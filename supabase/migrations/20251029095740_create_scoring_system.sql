/*
  # Create Scoring System

  ## Overview
  This migration creates the infrastructure for judges to score teams based on
  event-specific criteria. All access is scoped by event_id to prevent data leakage.

  ## New Tables
  
  ### scoring_criteria
  - `id` (uuid, primary key) - Unique criterion identifier
  - `event_id` (text) - Event this criterion belongs to
  - `criterion_id` (text) - Human-readable criterion identifier (e.g., "innovation")
  - `label` (text) - Display label for the criterion
  - `helper_copy` (text) - Explanatory text to guide judges
  - `weight` (numeric) - Weight of this criterion in final score (0.0-1.0)
  - `default_value` (numeric, nullable) - Optional default starting value
  - `ordering` (integer) - Display order for criteria
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### scores
  - `id` (uuid, primary key) - Unique score identifier
  - `event_id` (text) - Event this score belongs to
  - `team_id` (uuid, references teams) - Team being scored
  - `judge_profile_id` (uuid, references judge_profiles) - Judge submitting score
  - `criterion_id` (text) - Criterion being scored
  - `score_value` (numeric) - Numeric score value
  - `comment` (text, nullable) - Optional judge comment
  - `submitted_at` (timestamptz) - When score was submitted
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  
  ### scoring_criteria RLS
  - Authenticated judges can read criteria for their assigned events only
  - Only service role can write/update criteria

  ### scores RLS
  - Judges can read their own scores for their assigned events
  - Judges can insert/update their own scores for their assigned events
  - Service role has full access for administration

  ## RPC Functions

  ### submit_score
  Atomic function for submitting or updating a score with proper validation.
  Parameters: event_id, team_id, criterion_id, score_value, comment (optional)
*/

-- Create scoring_criteria table
CREATE TABLE IF NOT EXISTS scoring_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  criterion_id text NOT NULL,
  label text NOT NULL,
  helper_copy text,
  weight numeric NOT NULL CHECK (weight >= 0 AND weight <= 1),
  default_value numeric,
  ordering integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_scoring_criteria_event_id ON scoring_criteria(event_id, ordering);

ALTER TABLE scoring_criteria ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated judges can read criteria for events they're assigned to
CREATE POLICY "Judges can read criteria for their events"
  ON scoring_criteria
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.event_id = scoring_criteria.event_id
    )
  );

-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  judge_profile_id uuid REFERENCES judge_profiles(id) ON DELETE CASCADE,
  criterion_id text NOT NULL,
  score_value numeric NOT NULL,
  comment text,
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, team_id, judge_profile_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_event_team ON scores(event_id, team_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge ON scores(judge_profile_id, event_id);
CREATE INDEX IF NOT EXISTS idx_scores_team_criterion ON scores(team_id, criterion_id);

ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Policy: Judges can read their own scores for their assigned events
CREATE POLICY "Judges can read own scores"
  ON scores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = scores.judge_profile_id
      AND jp.event_id = scores.event_id
    )
  );

-- Policy: Judges can insert scores for teams in their assigned events
CREATE POLICY "Judges can insert scores for their events"
  ON scores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = scores.judge_profile_id
      AND jp.event_id = scores.event_id
    )
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = scores.team_id
      AND t.event_id = scores.event_id
    )
    AND EXISTS (
      SELECT 1 FROM scoring_criteria sc
      WHERE sc.event_id = scores.event_id
      AND sc.criterion_id = scores.criterion_id
    )
  );

-- Policy: Judges can update their own scores
CREATE POLICY "Judges can update own scores"
  ON scores
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = scores.judge_profile_id
      AND jp.event_id = scores.event_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.user_id = auth.uid()
      AND jp.id = scores.judge_profile_id
      AND jp.event_id = scores.event_id
    )
  );

-- Function to update updated_at timestamp for scoring_criteria
CREATE OR REPLACE FUNCTION update_scoring_criteria_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scoring_criteria_updated_at
  BEFORE UPDATE ON scoring_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_scoring_criteria_timestamp();

-- Function to update updated_at timestamp for scores
CREATE OR REPLACE FUNCTION update_scores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scores_updated_at
  BEFORE UPDATE ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_scores_timestamp();

-- RPC function for submitting scores with validation
CREATE OR REPLACE FUNCTION submit_score(
  p_event_id text,
  p_team_id uuid,
  p_criterion_id text,
  p_score_value numeric,
  p_comment text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_judge_profile_id uuid;
  v_score_id uuid;
  v_criterion_exists boolean;
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

  -- Verify criterion exists for this event
  SELECT EXISTS (
    SELECT 1 FROM scoring_criteria sc
    WHERE sc.event_id = p_event_id
    AND sc.criterion_id = p_criterion_id
  ) INTO v_criterion_exists;

  IF NOT v_criterion_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid criterion for this event'
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

  -- Insert or update score
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
    p_criterion_id,
    p_score_value,
    p_comment,
    now()
  )
  ON CONFLICT (event_id, team_id, judge_profile_id, criterion_id)
  DO UPDATE SET
    score_value = EXCLUDED.score_value,
    comment = EXCLUDED.comment,
    updated_at = now()
  RETURNING id INTO v_score_id;

  RETURN jsonb_build_object(
    'success', true,
    'score_id', v_score_id
  );
END;
$$;