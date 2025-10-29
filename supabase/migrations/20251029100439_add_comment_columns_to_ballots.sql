/*
  # Add Comment Columns to Autosave Ballots

  ## Overview
  Adds dedicated comment columns for strengths and improvements to the autosave_ballots table.
  These supplement the criteria-specific comments stored in the payload JSON.

  ## Changes
  
  ### autosave_ballots table additions
  - `comment_strength` (text, nullable) - Judge's comments on team strengths (max 1000 chars)
  - `comment_improvement` (text, nullable) - Judge's comments on areas for improvement (max 1000 chars)

  ## Notes
  - No indexes initially required as these are free-text fields not used in WHERE clauses
  - Comments stored at ballot level (not per-criterion) for overall feedback
  - RLS policies already cover these columns through row-level access control
  - The payload JSON still stores criterion-specific comments
  - Character limits enforced via CHECK constraints for data integrity

  ## Security
  Existing RLS policies on autosave_ballots already cover these columns:
  - Judges can read/write their own ballots only
  - Access scoped to assigned events
  - Service role has full access for exports
*/

-- Add comment columns to autosave_ballots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'autosave_ballots' AND column_name = 'comment_strength'
  ) THEN
    ALTER TABLE autosave_ballots 
    ADD COLUMN comment_strength text CHECK (length(comment_strength) <= 1000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'autosave_ballots' AND column_name = 'comment_improvement'
  ) THEN
    ALTER TABLE autosave_ballots 
    ADD COLUMN comment_improvement text CHECK (length(comment_improvement) <= 1000);
  END IF;
END $$;

-- Update the autosave_ballot RPC function to handle the new comment columns
CREATE OR REPLACE FUNCTION autosave_ballot(
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

  -- Upsert autosave ballot with comment columns
  INSERT INTO autosave_ballots (
    event_id,
    judge_profile_id,
    team_id,
    payload,
    comment_strength,
    comment_improvement,
    updated_at
  )
  VALUES (
    p_event_id,
    v_judge_profile_id,
    p_team_id,
    p_payload,
    p_comment_strength,
    p_comment_improvement,
    now()
  )
  ON CONFLICT (event_id, judge_profile_id, team_id)
  DO UPDATE SET
    payload = EXCLUDED.payload,
    comment_strength = EXCLUDED.comment_strength,
    comment_improvement = EXCLUDED.comment_improvement,
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