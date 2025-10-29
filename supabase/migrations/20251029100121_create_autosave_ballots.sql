/*
  # Create Autosave Ballots System

  ## Overview
  This migration creates the infrastructure for autosaving partial ballot submissions
  with seamless transition to final submissions and proper event/judge isolation.

  ## New Tables
  
  ### autosave_ballots
  - `id` (uuid, primary key) - Unique autosave record identifier
  - `event_id` (text) - Event this ballot belongs to
  - `judge_profile_id` (uuid, references judge_profiles) - Judge who owns this autosave
  - `team_id` (uuid, references teams) - Team being scored
  - `payload` (jsonb) - Partial or complete ballot data
  - `is_locked` (boolean) - Whether this ballot has been finalized/submitted
  - `locked_at` (timestamptz) - When the ballot was locked
  - `created_at` (timestamptz) - Initial autosave timestamp
  - `updated_at` (timestamptz) - Last autosave update timestamp

  ### Payload Structure
  The payload field stores partial scoring data in this format:
  ```json
  {
    "scores": {
      "criterion_id_1": { "value": 8.5, "comment": "..." },
      "criterion_id_2": { "value": 7.0, "comment": "..." }
    },
    "metadata": {
      "last_modified_criterion": "criterion_id_1",
      "completion_percentage": 0.75
    }
  }
  ```

  ## Indexes
  - Composite index on (event_id, judge_profile_id, team_id) for fast upserts
  - Index on (judge_profile_id, event_id) for judge-specific queries
  - Index on is_locked for filtering active vs finalized ballots

  ## Security
  
  ### autosave_ballots RLS
  - Judges can read/write only their own autosave ballots for their assigned events
  - Locked ballots cannot be modified (enforced in RPC)
  - Service role has full access for administration

  ## RPC Functions

  ### autosave_ballot
  Upserts autosave data for a specific team ballot.
  Parameters: event_id, team_id, payload
  Returns: success status and autosave_id

  ### finalize_ballot
  Locks an autosave ballot and transfers scores to the scores table.
  Parameters: event_id, team_id
  Returns: success status

  ## Workflow
  1. Judge makes changes → autosave_ballot() called periodically
  2. Judge submits final ballot → finalize_ballot() locks autosave and creates score records
  3. Locked autosaves remain as audit trail but cannot be modified
*/

-- Create autosave_ballots table
CREATE TABLE IF NOT EXISTS autosave_ballots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  judge_profile_id uuid REFERENCES judge_profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_locked boolean DEFAULT false,
  locked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, judge_profile_id, team_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_autosave_ballots_composite 
  ON autosave_ballots(event_id, judge_profile_id, team_id);

CREATE INDEX IF NOT EXISTS idx_autosave_ballots_judge_event 
  ON autosave_ballots(judge_profile_id, event_id);

CREATE INDEX IF NOT EXISTS idx_autosave_ballots_locked 
  ON autosave_ballots(is_locked, event_id);

-- Enable RLS
ALTER TABLE autosave_ballots ENABLE ROW LEVEL SECURITY;

-- Policy: Judges can read their own autosave ballots for their assigned events
CREATE POLICY "Judges can read own autosave ballots"
  ON autosave_ballots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = autosave_ballots.judge_profile_id
      AND jp.event_id = autosave_ballots.event_id
    )
  );

-- Policy: Judges can insert autosave ballots for teams in their assigned events
CREATE POLICY "Judges can insert autosave ballots"
  ON autosave_ballots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = autosave_ballots.judge_profile_id
      AND jp.event_id = autosave_ballots.event_id
    )
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = autosave_ballots.team_id
      AND t.event_id = autosave_ballots.event_id
    )
    AND autosave_ballots.is_locked = false
  );

-- Policy: Judges can update their own unlocked autosave ballots
CREATE POLICY "Judges can update own unlocked autosave ballots"
  ON autosave_ballots
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = autosave_ballots.judge_profile_id
      AND jp.event_id = autosave_ballots.event_id
    )
    AND autosave_ballots.is_locked = false
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = autosave_ballots.judge_profile_id
      AND jp.event_id = autosave_ballots.event_id
    )
    AND autosave_ballots.is_locked = false
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_autosave_ballots_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER autosave_ballots_updated_at
  BEFORE UPDATE ON autosave_ballots
  FOR EACH ROW
  EXECUTE FUNCTION update_autosave_ballots_timestamp();

-- RPC function for autosaving ballots
CREATE OR REPLACE FUNCTION autosave_ballot(
  p_event_id text,
  p_team_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_judge_profile_id uuid;
  v_autosave_id uuid;
  v_is_locked boolean;
  v_team_exists boolean;
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

  -- Check if ballot is already locked
  SELECT is_locked INTO v_is_locked
  FROM autosave_ballots
  WHERE event_id = p_event_id
  AND judge_profile_id = v_judge_profile_id
  AND team_id = p_team_id;

  IF v_is_locked = true THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ballot is locked and cannot be modified'
    );
  END IF;

  -- Upsert autosave ballot
  INSERT INTO autosave_ballots (
    event_id,
    judge_profile_id,
    team_id,
    payload,
    updated_at
  )
  VALUES (
    p_event_id,
    v_judge_profile_id,
    p_team_id,
    p_payload,
    now()
  )
  ON CONFLICT (event_id, judge_profile_id, team_id)
  DO UPDATE SET
    payload = EXCLUDED.payload,
    updated_at = now()
  WHERE autosave_ballots.is_locked = false
  RETURNING id INTO v_autosave_id;

  IF v_autosave_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to save ballot (may be locked)'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'autosave_id', v_autosave_id,
    'updated_at', now()
  );
END;
$$;

-- RPC function for finalizing/locking ballots
CREATE OR REPLACE FUNCTION finalize_ballot(
  p_event_id text,
  p_team_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_judge_profile_id uuid;
  v_autosave_id uuid;
  v_payload jsonb;
  v_criterion_id text;
  v_score_data jsonb;
  v_score_value numeric;
  v_comment text;
  v_scores_inserted integer := 0;
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

  -- Get autosave ballot and lock it
  UPDATE autosave_ballots
  SET 
    is_locked = true,
    locked_at = now()
  WHERE event_id = p_event_id
  AND judge_profile_id = v_judge_profile_id
  AND team_id = p_team_id
  AND is_locked = false
  RETURNING id, payload INTO v_autosave_id, v_payload;

  IF v_autosave_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No unlocked autosave found for this team'
    );
  END IF;

  -- Transfer scores from payload to scores table
  IF v_payload ? 'scores' THEN
    FOR v_criterion_id, v_score_data IN 
      SELECT * FROM jsonb_each(v_payload->'scores')
    LOOP
      v_score_value := (v_score_data->>'value')::numeric;
      v_comment := v_score_data->>'comment';

      INSERT INTO scores (
        event_id,
        team_id,
        judge_profile_id,
        criterion_id,
        score_value,
        comment,
        submitted_at
      )
      VALUES (
        p_event_id,
        p_team_id,
        v_judge_profile_id,
        v_criterion_id,
        v_score_value,
        v_comment,
        now()
      )
      ON CONFLICT (event_id, team_id, judge_profile_id, criterion_id)
      DO UPDATE SET
        score_value = EXCLUDED.score_value,
        comment = EXCLUDED.comment,
        updated_at = now();

      v_scores_inserted := v_scores_inserted + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'autosave_id', v_autosave_id,
    'scores_transferred', v_scores_inserted,
    'locked_at', now()
  );
END;
$$;