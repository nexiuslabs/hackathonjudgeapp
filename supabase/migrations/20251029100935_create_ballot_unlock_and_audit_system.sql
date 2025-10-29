/*
  # Create Ballot Unlock Request and Audit System

  ## Overview
  This migration creates a comprehensive unlock request and audit trail system for ballots,
  supporting both online and offline workflows with idempotency.

  ## New Tables

  ### ballot_unlock_requests
  - `id` (uuid, primary key) - Unique unlock request identifier
  - `ballot_id` (uuid, references autosave_ballots) - Ballot being unlocked
  - `judge_profile_id` (uuid, references judge_profiles) - Judge requesting unlock
  - `event_id` (text) - Event scope for quick filtering
  - `team_id` (uuid, references teams) - Team being scored
  - `reason` (text, nullable) - Judge's reason for unlock request
  - `status` (text) - Request status: pending, approved, rejected
  - `created_at` (timestamptz) - When request was created
  - `resolved_at` (timestamptz, nullable) - When request was resolved
  - `resolved_by` (uuid, references auth.users, nullable) - Admin who resolved
  - `resolution_notes` (text, nullable) - Admin notes on resolution

  ### ballot_audit
  - `id` (uuid, primary key) - Unique audit record identifier
  - `ballot_id` (uuid, references autosave_ballots) - Ballot being audited
  - `judge_profile_id` (uuid, references judge_profiles) - Judge who performed action
  - `event_id` (text) - Event scope for quick filtering
  - `team_id` (uuid, references teams) - Team being scored
  - `action` (text) - Action type: submitted, unlock_requested, unlock_approved, unlock_rejected, unlock_revoked
  - `metadata` (jsonb) - Additional action context
  - `created_at` (timestamptz) - When action occurred
  - `created_by` (uuid, references auth.users) - User who performed action

  ## Indexes
  - ballot_unlock_requests: (event_id, status), (judge_profile_id, status), partial unique for pending
  - ballot_audit: (ballot_id, created_at), (event_id, created_at)

  ## Security
  
  ### ballot_unlock_requests RLS
  - Judges can insert requests for their own ballots
  - Judges can read their own requests
  - Admins (via service role) can read/update all requests

  ### ballot_audit RLS
  - Judges can read audit records for their own ballots
  - Admins (via service role) can read all audit records
  - Only functions can insert audit records (SECURITY DEFINER)

  ## RPC Functions

  ### submit_ballot(event_id, team_id, payload, comment_strength, comment_improvement)
  Idempotent ballot submission that locks ballot and creates audit record.
  Safe for offline sync retries.

  ### request_unlock(event_id, team_id, reason)
  Creates unlock request and audit record in single transaction.
  Returns request ID and status.

  ### approve_unlock_request(request_id, resolution_notes)
  Admin function to approve unlock request, unlock ballot, and audit.

  ### reject_unlock_request(request_id, resolution_notes)
  Admin function to reject unlock request and audit.
*/

-- Create ballot_unlock_requests table
CREATE TABLE IF NOT EXISTS ballot_unlock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ballot_id uuid REFERENCES autosave_ballots(id) ON DELETE CASCADE,
  judge_profile_id uuid REFERENCES judge_profiles(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  resolution_notes text
);

-- Create partial unique index to ensure only one pending request per ballot
CREATE UNIQUE INDEX IF NOT EXISTS idx_ballot_unlock_requests_ballot_pending 
  ON ballot_unlock_requests(ballot_id) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_ballot_unlock_requests_event_status 
  ON ballot_unlock_requests(event_id, status);

CREATE INDEX IF NOT EXISTS idx_ballot_unlock_requests_judge_status 
  ON ballot_unlock_requests(judge_profile_id, status);

ALTER TABLE ballot_unlock_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Judges can insert unlock requests for their own ballots
CREATE POLICY "Judges can insert unlock requests"
  ON ballot_unlock_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = ballot_unlock_requests.judge_profile_id
      AND jp.event_id = ballot_unlock_requests.event_id
    )
    AND EXISTS (
      SELECT 1 FROM autosave_ballots ab
      WHERE ab.id = ballot_unlock_requests.ballot_id
      AND ab.judge_profile_id = ballot_unlock_requests.judge_profile_id
      AND ab.event_id = ballot_unlock_requests.event_id
    )
  );

-- Policy: Judges can read their own unlock requests
CREATE POLICY "Judges can read own unlock requests"
  ON ballot_unlock_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = ballot_unlock_requests.judge_profile_id
      AND jp.event_id = ballot_unlock_requests.event_id
    )
  );

-- Create ballot_audit table
CREATE TABLE IF NOT EXISTS ballot_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ballot_id uuid REFERENCES autosave_ballots(id) ON DELETE CASCADE,
  judge_profile_id uuid REFERENCES judge_profiles(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN (
    'submitted',
    'unlock_requested',
    'unlock_approved',
    'unlock_rejected',
    'unlock_revoked'
  )),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ballot_audit_ballot_created 
  ON ballot_audit(ballot_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ballot_audit_event_created 
  ON ballot_audit(event_id, created_at DESC);

ALTER TABLE ballot_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Judges can read audit records for their own ballots
CREATE POLICY "Judges can read own ballot audit"
  ON ballot_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = ballot_audit.judge_profile_id
      AND jp.event_id = ballot_audit.event_id
    )
  );

-- RPC: Submit ballot with idempotency and audit
CREATE OR REPLACE FUNCTION submit_ballot(
  p_event_id text,
  p_team_id uuid,
  p_payload jsonb,
  p_comment_strength text DEFAULT NULL,
  p_comment_improvement text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_judge_profile_id uuid;
  v_ballot_id uuid;
  v_is_locked boolean;
  v_team_exists boolean;
  v_was_already_locked boolean := false;
BEGIN
  -- Get judge profile for current user and event
  SELECT jp.id INTO v_judge_profile_id
  FROM judge_profiles jp
  WHERE jp.user_id = auth.uid()
  AND jp.event_id = p_event_id;

  IF v_judge_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Judge profile not found for this event'
    );
  END IF;

  -- Verify team exists for this event
  SELECT EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = p_team_id
    AND t.event_id = p_event_id
  ) INTO v_team_exists;

  IF NOT v_team_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid team for this event'
    );
  END IF;

  -- Check if ballot already exists and is locked
  SELECT id, is_locked INTO v_ballot_id, v_is_locked
  FROM autosave_ballots
  WHERE event_id = p_event_id
  AND judge_profile_id = v_judge_profile_id
  AND team_id = p_team_id;

  IF v_is_locked = true THEN
    v_was_already_locked := true;
  END IF;

  -- Upsert ballot with lock
  INSERT INTO autosave_ballots (
    event_id,
    judge_profile_id,
    team_id,
    payload,
    comment_strength,
    comment_improvement,
    is_locked,
    locked_at,
    updated_at
  )
  VALUES (
    p_event_id,
    v_judge_profile_id,
    p_team_id,
    p_payload,
    p_comment_strength,
    p_comment_improvement,
    true,
    now(),
    now()
  )
  ON CONFLICT (event_id, judge_profile_id, team_id)
  DO UPDATE SET
    payload = EXCLUDED.payload,
    comment_strength = EXCLUDED.comment_strength,
    comment_improvement = EXCLUDED.comment_improvement,
    is_locked = true,
    locked_at = COALESCE(autosave_ballots.locked_at, now()),
    updated_at = now()
  RETURNING id INTO v_ballot_id;

  -- Create audit record if not already locked (idempotency)
  IF NOT v_was_already_locked THEN
    INSERT INTO ballot_audit (
      ballot_id,
      judge_profile_id,
      event_id,
      team_id,
      action,
      metadata,
      created_by
    )
    VALUES (
      v_ballot_id,
      v_judge_profile_id,
      p_event_id,
      p_team_id,
      'submitted',
      jsonb_build_object(
        'comment_strength_length', length(p_comment_strength),
        'comment_improvement_length', length(p_comment_improvement),
        'criteria_count', jsonb_array_length(COALESCE(p_payload->'scores', '[]'::jsonb))
      ),
      auth.uid()
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'ballot_id', v_ballot_id,
    'was_already_submitted', v_was_already_locked,
    'locked_at', now()
  );
END;
$$;

-- RPC: Request ballot unlock
CREATE OR REPLACE FUNCTION request_unlock(
  p_event_id text,
  p_team_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_judge_profile_id uuid;
  v_ballot_id uuid;
  v_is_locked boolean;
  v_unlock_request_id uuid;
  v_existing_pending boolean;
BEGIN
  -- Get judge profile for current user and event
  SELECT jp.id INTO v_judge_profile_id
  FROM judge_profiles jp
  WHERE jp.user_id = auth.uid()
  AND jp.event_id = p_event_id;

  IF v_judge_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Judge profile not found for this event'
    );
  END IF;

  -- Get ballot and verify it's locked
  SELECT id, is_locked INTO v_ballot_id, v_is_locked
  FROM autosave_ballots
  WHERE event_id = p_event_id
  AND judge_profile_id = v_judge_profile_id
  AND team_id = p_team_id;

  IF v_ballot_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No ballot found for this team'
    );
  END IF;

  IF v_is_locked = false THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ballot is not locked'
    );
  END IF;

  -- Check for existing pending request
  SELECT EXISTS (
    SELECT 1 FROM ballot_unlock_requests
    WHERE ballot_id = v_ballot_id
    AND status = 'pending'
  ) INTO v_existing_pending;

  IF v_existing_pending THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unlock request already pending for this ballot'
    );
  END IF;

  -- Create unlock request
  INSERT INTO ballot_unlock_requests (
    ballot_id,
    judge_profile_id,
    event_id,
    team_id,
    reason,
    status
  )
  VALUES (
    v_ballot_id,
    v_judge_profile_id,
    p_event_id,
    p_team_id,
    p_reason,
    'pending'
  )
  RETURNING id INTO v_unlock_request_id;

  -- Create audit record
  INSERT INTO ballot_audit (
    ballot_id,
    judge_profile_id,
    event_id,
    team_id,
    action,
    metadata,
    created_by
  )
  VALUES (
    v_ballot_id,
    v_judge_profile_id,
    p_event_id,
    p_team_id,
    'unlock_requested',
    jsonb_build_object(
      'unlock_request_id', v_unlock_request_id,
      'reason', p_reason
    ),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'success', true,
    'unlock_request_id', v_unlock_request_id,
    'status', 'pending',
    'created_at', now()
  );
END;
$$;

-- RPC: Approve unlock request (admin only)
CREATE OR REPLACE FUNCTION approve_unlock_request(
  p_request_id uuid,
  p_resolution_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_record record;
  v_ballot_id uuid;
BEGIN
  -- Get unlock request details
  SELECT * INTO v_request_record
  FROM ballot_unlock_requests
  WHERE id = p_request_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unlock request not found or already resolved'
    );
  END IF;

  -- Update request status
  UPDATE ballot_unlock_requests
  SET 
    status = 'approved',
    resolved_at = now(),
    resolved_by = auth.uid(),
    resolution_notes = p_resolution_notes
  WHERE id = p_request_id;

  -- Unlock the ballot
  UPDATE autosave_ballots
  SET 
    is_locked = false,
    locked_at = NULL,
    updated_at = now()
  WHERE id = v_request_record.ballot_id;

  -- Create audit record
  INSERT INTO ballot_audit (
    ballot_id,
    judge_profile_id,
    event_id,
    team_id,
    action,
    metadata,
    created_by
  )
  VALUES (
    v_request_record.ballot_id,
    v_request_record.judge_profile_id,
    v_request_record.event_id,
    v_request_record.team_id,
    'unlock_approved',
    jsonb_build_object(
      'unlock_request_id', p_request_id,
      'resolution_notes', p_resolution_notes,
      'approved_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'status', 'approved',
    'ballot_id', v_request_record.ballot_id
  );
END;
$$;

-- RPC: Reject unlock request (admin only)
CREATE OR REPLACE FUNCTION reject_unlock_request(
  p_request_id uuid,
  p_resolution_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_record record;
BEGIN
  -- Get unlock request details
  SELECT * INTO v_request_record
  FROM ballot_unlock_requests
  WHERE id = p_request_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unlock request not found or already resolved'
    );
  END IF;

  -- Update request status
  UPDATE ballot_unlock_requests
  SET 
    status = 'rejected',
    resolved_at = now(),
    resolved_by = auth.uid(),
    resolution_notes = p_resolution_notes
  WHERE id = p_request_id;

  -- Create audit record
  INSERT INTO ballot_audit (
    ballot_id,
    judge_profile_id,
    event_id,
    team_id,
    action,
    metadata,
    created_by
  )
  VALUES (
    v_request_record.ballot_id,
    v_request_record.judge_profile_id,
    v_request_record.event_id,
    v_request_record.team_id,
    'unlock_rejected',
    jsonb_build_object(
      'unlock_request_id', p_request_id,
      'resolution_notes', p_resolution_notes,
      'rejected_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'status', 'rejected'
  );
END;
$$;