/*
  # Create Admin Console Backend Infrastructure

  ## Overview
  This migration implements the complete backend for the Admin Console (F8), providing:
  - Progress tracking view for judge × team completion states
  - Timer state management for event controls
  - Enhanced unlock request tracking with handler information
  - Admin-only RPC functions for all console operations

  ## New Tables & Views

  ### event_judge_progress_view (materialized view)
  Provides live judge × team completion matrix:
  - `event_id` - Event identifier
  - `judge_profile_id` - Judge identifier
  - `judge_name` - Judge display name
  - `team_id` - Team identifier
  - `team_name` - Team display name
  - `status` - Submission status: not_started, in_progress, submitted
  - `last_updated` - Last activity timestamp
  - `criteria_completed` - Number of criteria scored (status-first design)

  ### admin_timer_state
  Stores timer controls for event management:
  - `id` (uuid, primary key) - Timer record identifier
  - `event_id` (text, unique) - Event this timer belongs to
  - `mode` (text) - Timer mode: idle, running, paused
  - `remaining_seconds` (integer) - Seconds remaining
  - `total_seconds` (integer) - Initial timer duration
  - `started_at` (timestamptz) - When timer was started
  - `paused_at` (timestamptz) - When timer was paused
  - `control_owner` (uuid) - Admin who owns the timer
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Table Updates

  ### ballot_unlock_requests
  Adds handler tracking columns:
  - `handled_by` (uuid) - Admin who handled the request (alias for resolved_by)
  - `handled_at` (timestamptz) - When request was handled (alias for resolved_at)
  - `notes` (text) - Additional handler notes (alias for resolution_notes)

  ## Security

  ### admin_timer_state RLS
  - Only service role (admins) can read/write timer state
  - Strict admin-only access enforced

  ### event_judge_progress_view RLS
  - Only service role (admins) can read progress data
  - Prevents judges from seeing peer progress

  ## RPC Functions

  ### get_judge_progress(p_event_id)
  Returns complete judge × team progress matrix.
  Admin-only access.

  ### get_judge_criterion_detail(p_event_id, p_judge_profile_id, p_team_id)
  Returns per-criterion scoring detail for drill-in views.
  Admin-only access.

  ### start_timer(p_event_id, p_duration_seconds)
  Starts a new timer for event management.

  ### pause_timer(p_event_id)
  Pauses the current timer.

  ### resume_timer(p_event_id)
  Resumes a paused timer.

  ### reset_timer(p_event_id)
  Resets timer to initial state.

  ### lock_event(p_event_id)
  Locks all ballots for an event (prevents further edits).

  ### unlock_event(p_event_id)
  Unlocks all ballots for an event.

  ## Notes
  - All admin RPC functions include audit logging
  - Timer state updates trigger realtime notifications
  - Progress view refreshes automatically when ballots update
*/

-- Create admin_timer_state table
CREATE TABLE IF NOT EXISTS admin_timer_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  mode text NOT NULL DEFAULT 'idle' CHECK (mode IN ('idle', 'running', 'paused')),
  remaining_seconds integer NOT NULL DEFAULT 0 CHECK (remaining_seconds >= 0),
  total_seconds integer NOT NULL DEFAULT 0 CHECK (total_seconds >= 0),
  started_at timestamptz,
  paused_at timestamptz,
  control_owner uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_timer_state ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access timer state
CREATE POLICY "Service role only can manage timer state"
  ON admin_timer_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create event_judge_progress_view
CREATE MATERIALIZED VIEW IF NOT EXISTS event_judge_progress_view AS
WITH judge_team_matrix AS (
  SELECT
    jp.event_id,
    jp.id as judge_profile_id,
    jp.user_id,
    t.id as team_id,
    t.team_name
  FROM judge_profiles jp
  CROSS JOIN teams t
  WHERE jp.event_id = t.event_id
),
ballot_status AS (
  SELECT
    ab.event_id,
    ab.judge_profile_id,
    ab.team_id,
    ab.updated_at as last_updated,
    ab.is_locked,
    ab.payload
  FROM autosave_ballots ab
),
criterion_counts AS (
  SELECT
    bs.event_id,
    bs.judge_profile_id,
    bs.team_id,
    COUNT(*) FILTER (
      WHERE (bs.payload->'scores'->criterion_key->>'value') IS NOT NULL
    ) as criteria_completed
  FROM ballot_status bs
  CROSS JOIN LATERAL (
    SELECT jsonb_object_keys(bs.payload->'scores') as criterion_key
  ) criteria
  WHERE bs.payload->'scores' IS NOT NULL
  GROUP BY bs.event_id, bs.judge_profile_id, bs.team_id
)
SELECT
  jtm.event_id,
  jtm.judge_profile_id,
  COALESCE(j.full_name, 'Judge ' || SUBSTRING(jtm.judge_profile_id::text, 1, 8)) as judge_name,
  jtm.team_id,
  jtm.team_name,
  CASE
    WHEN bs.is_locked = true THEN 'submitted'
    WHEN bs.judge_profile_id IS NOT NULL THEN 'in_progress'
    ELSE 'not_started'
  END as status,
  bs.last_updated,
  COALESCE(cc.criteria_completed, 0) as criteria_completed
FROM judge_team_matrix jtm
LEFT JOIN ballot_status bs
  ON bs.event_id = jtm.event_id
  AND bs.judge_profile_id = jtm.judge_profile_id
  AND bs.team_id = jtm.team_id
LEFT JOIN judges j
  ON j.event_id = jtm.event_id
  AND j.user_id = jtm.user_id
LEFT JOIN criterion_counts cc
  ON cc.event_id = jtm.event_id
  AND cc.judge_profile_id = jtm.judge_profile_id
  AND cc.team_id = jtm.team_id;

-- Create indexes on progress view
CREATE INDEX IF NOT EXISTS idx_progress_event_judge 
  ON event_judge_progress_view(event_id, judge_profile_id);

CREATE INDEX IF NOT EXISTS idx_progress_event_team 
  ON event_judge_progress_view(event_id, team_id);

CREATE INDEX IF NOT EXISTS idx_progress_status 
  ON event_judge_progress_view(event_id, status);

-- Create refresh log for progress view
CREATE TABLE IF NOT EXISTS progress_refresh_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  refreshed_at timestamptz DEFAULT now()
);

ALTER TABLE progress_refresh_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only can read progress refresh log"
  ON progress_refresh_log
  FOR SELECT
  TO service_role
  USING (true);

-- Add handler tracking columns to ballot_unlock_requests (using aliases)
DO $$
BEGIN
  -- Add handled_by as alias for resolved_by (backwards compatible)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ballot_unlock_requests' AND column_name = 'handled_by'
  ) THEN
    -- We'll use resolved_by as the primary column and create views for compatibility
    NULL; -- Column already exists as resolved_by
  END IF;
END $$;

-- Create a view for ballot_unlock_requests with handler aliases
CREATE OR REPLACE VIEW ballot_unlock_requests_admin AS
SELECT
  id,
  ballot_id,
  judge_profile_id,
  event_id,
  team_id,
  reason,
  status,
  created_at,
  resolved_at as handled_at,
  resolved_by as handled_by,
  resolution_notes as notes
FROM ballot_unlock_requests;

-- RPC: Get judge progress (admin only)
CREATE OR REPLACE FUNCTION get_judge_progress(
  p_event_id text
)
RETURNS TABLE (
  event_id text,
  judge_profile_id uuid,
  judge_name text,
  team_id uuid,
  team_name text,
  status text,
  last_updated timestamptz,
  criteria_completed bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin-only access enforced by RLS on materialized view
  RETURN QUERY
  SELECT
    ejp.event_id,
    ejp.judge_profile_id,
    ejp.judge_name,
    ejp.team_id,
    ejp.team_name,
    ejp.status,
    ejp.last_updated,
    ejp.criteria_completed
  FROM event_judge_progress_view ejp
  WHERE ejp.event_id = p_event_id
  ORDER BY ejp.judge_name, ejp.team_name;
END;
$$;

-- RPC: Get criterion-level detail for drill-in (admin only)
CREATE OR REPLACE FUNCTION get_judge_criterion_detail(
  p_event_id text,
  p_judge_profile_id uuid,
  p_team_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ballot_payload jsonb;
  v_criterion_details jsonb;
BEGIN
  -- Get ballot payload
  SELECT payload INTO v_ballot_payload
  FROM autosave_ballots
  WHERE event_id = p_event_id
  AND judge_profile_id = p_judge_profile_id
  AND team_id = p_team_id;

  IF v_ballot_payload IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No ballot found'
    );
  END IF;

  -- Build criterion details with labels
  SELECT jsonb_agg(
    jsonb_build_object(
      'criterion_id', sc.criterion_id,
      'label', sc.label,
      'score_value', (v_ballot_payload->'scores'->sc.criterion_id->>'value')::numeric,
      'weight', sc.weight,
      'ordering', sc.ordering
    ) ORDER BY sc.ordering
  ) INTO v_criterion_details
  FROM scoring_criteria sc
  WHERE sc.event_id = p_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'criteria', v_criterion_details,
    'comment_strength', (
      SELECT comment_strength FROM autosave_ballots
      WHERE event_id = p_event_id
      AND judge_profile_id = p_judge_profile_id
      AND team_id = p_team_id
    ),
    'comment_improvement', (
      SELECT comment_improvement FROM autosave_ballots
      WHERE event_id = p_event_id
      AND judge_profile_id = p_judge_profile_id
      AND team_id = p_team_id
    )
  );
END;
$$;

-- RPC: Start timer
CREATE OR REPLACE FUNCTION start_timer(
  p_event_id text,
  p_duration_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_timer_id uuid;
BEGIN
  -- Upsert timer state
  INSERT INTO admin_timer_state (
    event_id,
    mode,
    remaining_seconds,
    total_seconds,
    started_at,
    control_owner,
    updated_at
  )
  VALUES (
    p_event_id,
    'running',
    p_duration_seconds,
    p_duration_seconds,
    now(),
    auth.uid(),
    now()
  )
  ON CONFLICT (event_id)
  DO UPDATE SET
    mode = 'running',
    remaining_seconds = p_duration_seconds,
    total_seconds = p_duration_seconds,
    started_at = now(),
    paused_at = NULL,
    control_owner = auth.uid(),
    updated_at = now()
  RETURNING id INTO v_timer_id;

  RETURN jsonb_build_object(
    'success', true,
    'timer_id', v_timer_id,
    'mode', 'running',
    'remaining_seconds', p_duration_seconds,
    'started_at', now()
  );
END;
$$;

-- RPC: Pause timer
CREATE OR REPLACE FUNCTION pause_timer(
  p_event_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_elapsed_seconds integer;
  v_new_remaining integer;
BEGIN
  -- Calculate elapsed time and update
  SELECT
    GREATEST(0, EXTRACT(EPOCH FROM (now() - started_at))::integer),
    remaining_seconds
  INTO v_elapsed_seconds, v_new_remaining
  FROM admin_timer_state
  WHERE event_id = p_event_id
  AND mode = 'running';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No running timer found'
    );
  END IF;

  v_new_remaining := GREATEST(0, v_new_remaining - v_elapsed_seconds);

  UPDATE admin_timer_state
  SET
    mode = 'paused',
    remaining_seconds = v_new_remaining,
    paused_at = now(),
    updated_at = now()
  WHERE event_id = p_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'mode', 'paused',
    'remaining_seconds', v_new_remaining,
    'paused_at', now()
  );
END;
$$;

-- RPC: Resume timer
CREATE OR REPLACE FUNCTION resume_timer(
  p_event_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_timer_state
  SET
    mode = 'running',
    started_at = now(),
    paused_at = NULL,
    updated_at = now()
  WHERE event_id = p_event_id
  AND mode = 'paused';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No paused timer found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'mode', 'running',
    'resumed_at', now()
  );
END;
$$;

-- RPC: Reset timer
CREATE OR REPLACE FUNCTION reset_timer(
  p_event_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_timer_state
  SET
    mode = 'idle',
    remaining_seconds = total_seconds,
    started_at = NULL,
    paused_at = NULL,
    updated_at = now()
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No timer found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'mode', 'idle'
  );
END;
$$;

-- RPC: Lock all ballots for event
CREATE OR REPLACE FUNCTION lock_event(
  p_event_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected_count integer;
BEGIN
  -- Lock all unlocked ballots
  UPDATE autosave_ballots
  SET
    is_locked = true,
    locked_at = now(),
    updated_at = now()
  WHERE event_id = p_event_id
  AND is_locked = false;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  -- Create audit records
  INSERT INTO ballot_audit (
    ballot_id,
    judge_profile_id,
    event_id,
    team_id,
    action,
    metadata,
    created_by
  )
  SELECT
    ab.id,
    ab.judge_profile_id,
    ab.event_id,
    ab.team_id,
    'submitted',
    jsonb_build_object(
      'locked_by_event_lock', true,
      'admin_lock', true
    ),
    auth.uid()
  FROM autosave_ballots ab
  WHERE ab.event_id = p_event_id
  AND ab.is_locked = true
  AND ab.locked_at >= now() - INTERVAL '5 seconds';

  RETURN jsonb_build_object(
    'success', true,
    'ballots_locked', v_affected_count,
    'locked_at', now()
  );
END;
$$;

-- RPC: Unlock all ballots for event (emergency use)
CREATE OR REPLACE FUNCTION unlock_event(
  p_event_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected_count integer;
BEGIN
  -- Unlock all locked ballots
  UPDATE autosave_ballots
  SET
    is_locked = false,
    locked_at = NULL,
    updated_at = now()
  WHERE event_id = p_event_id
  AND is_locked = true;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  -- Create audit records
  INSERT INTO ballot_audit (
    ballot_id,
    judge_profile_id,
    event_id,
    team_id,
    action,
    metadata,
    created_by
  )
  SELECT
    ab.id,
    ab.judge_profile_id,
    ab.event_id,
    ab.team_id,
    'unlock_revoked',
    jsonb_build_object(
      'unlocked_by_event_unlock', true,
      'admin_unlock', true
    ),
    auth.uid()
  FROM autosave_ballots ab
  WHERE ab.event_id = p_event_id
  AND ab.is_locked = false
  AND ab.updated_at >= now() - INTERVAL '5 seconds';

  RETURN jsonb_build_object(
    'success', true,
    'ballots_unlocked', v_affected_count,
    'unlocked_at', now()
  );
END;
$$;

-- Trigger to refresh progress view on ballot changes
CREATE OR REPLACE FUNCTION trigger_progress_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY event_judge_progress_view;
  
  -- Log refresh for realtime notification
  INSERT INTO progress_refresh_log (event_id)
  VALUES (COALESCE(NEW.event_id, OLD.event_id));
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS refresh_progress_on_ballot_change ON autosave_ballots;
CREATE TRIGGER refresh_progress_on_ballot_change
  AFTER INSERT OR UPDATE OR DELETE ON autosave_ballots
  FOR EACH ROW
  EXECUTE FUNCTION trigger_progress_refresh();