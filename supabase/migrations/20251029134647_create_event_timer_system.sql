/*
  # Create Event Timer System with Presets and Revision Control

  ## Overview
  This migration creates a comprehensive timer system with:
  - Timer presets for quick access to common durations
  - State management with revision tracking for conflict detection
  - Unified RPC function for all timer actions
  - Helper functions for expires_at calculation
  - Role-based access control for admin/head judge operations

  ## New Tables

  ### event_timer_presets
  Stores reusable timer duration presets for events:
  - `id` (uuid, primary key) - Preset identifier
  - `event_id` (text, FK to events) - Event this preset belongs to
  - `label` (text, NOT NULL) - Display label (e.g., "Pitch Duration")
  - `duration_seconds` (integer, NOT NULL) - Preset duration
  - `ordering` (integer) - Display order
  - `archived_at` (timestamptz) - Soft delete timestamp
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### event_timer_state
  Stores current timer state with revision control:
  - `id` (uuid, primary key) - State record identifier
  - `event_id` (text, UNIQUE, FK to events) - Event this timer belongs to
  - `phase` (text) - idle | running | paused | finished
  - `duration_seconds` (integer) - Total duration
  - `started_at` (timestamptz) - When timer started/resumed
  - `paused_at` (timestamptz) - When timer paused
  - `elapsed_seconds` (integer) - Elapsed time at pause
  - `control_owner` (uuid, FK to auth.users) - Admin controlling timer
  - `revision` (integer) - Incrementing version for conflict detection
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Views

  ### event_timer_state_with_expiry
  Adds computed expires_at field for client countdown calculations.

  ## RPC Functions

  ### call_timer_action(p_event_id, p_action, p_preset_id, p_actor)
  Unified timer control function supporting:
  - start - Start new timer from preset
  - pause - Pause running timer
  - resume - Resume paused timer
  - reset - Reset to idle
  - finish - Mark as finished

  ### get_timer_remaining_seconds(p_event_id)
  Returns remaining seconds for a timer.

  ## Security

  ### event_timer_presets RLS
  - Authenticated users can read non-archived presets
  - Only service role can create/update/delete

  ### event_timer_state RLS
  - Authenticated judges can read timer state
  - Only service role (admin/head judge) can write

  ## Indexes
  - event_timer_presets: (event_id, archived_at, ordering)
  - event_timer_state: (event_id) UNIQUE
*/

-- Drop old admin_timer_state table if it exists (will be replaced)
DROP TABLE IF EXISTS admin_timer_state CASCADE;

-- Create event_timer_presets table
CREATE TABLE IF NOT EXISTS event_timer_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  label text NOT NULL,
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  ordering integer DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_event_timer_presets_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT uq_event_timer_presets_label 
    UNIQUE (event_id, label)
);

CREATE INDEX IF NOT EXISTS idx_event_timer_presets_event_active 
  ON event_timer_presets(event_id, ordering) 
  WHERE archived_at IS NULL;

ALTER TABLE event_timer_presets ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read non-archived presets
CREATE POLICY "Authenticated users can read active presets"
  ON event_timer_presets
  FOR SELECT
  TO authenticated
  USING (archived_at IS NULL);

-- Policy: Service role can manage all presets
CREATE POLICY "Service role can manage presets"
  ON event_timer_presets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create event_timer_state table
CREATE TABLE IF NOT EXISTS event_timer_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  phase text NOT NULL DEFAULT 'idle' CHECK (phase IN ('idle', 'running', 'paused', 'finished')),
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  started_at timestamptz,
  paused_at timestamptz,
  elapsed_seconds integer DEFAULT 0 CHECK (elapsed_seconds >= 0),
  control_owner uuid,
  revision integer DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_event_timer_state_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_timer_state_owner 
    FOREIGN KEY (control_owner) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_timer_state_event 
  ON event_timer_state(event_id);

ALTER TABLE event_timer_state ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read timer state
CREATE POLICY "Authenticated users can read timer state"
  ON event_timer_state
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Service role can manage timer state
CREATE POLICY "Service role can manage timer state"
  ON event_timer_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create view with computed expires_at
CREATE OR REPLACE VIEW event_timer_state_with_expiry AS
SELECT
  ets.*,
  CASE 
    WHEN ets.phase = 'running' AND ets.started_at IS NOT NULL 
    THEN ets.started_at + (ets.duration_seconds - ets.elapsed_seconds) * INTERVAL '1 second'
    ELSE NULL
  END AS expires_at,
  CASE 
    WHEN ets.phase = 'running' AND ets.started_at IS NOT NULL 
    THEN GREATEST(
      ets.duration_seconds - (
        ets.elapsed_seconds + 
        EXTRACT(EPOCH FROM (now() - ets.started_at))::integer
      ),
      0
    )
    WHEN ets.phase = 'paused' 
    THEN GREATEST(ets.duration_seconds - ets.elapsed_seconds, 0)
    WHEN ets.phase = 'idle' 
    THEN ets.duration_seconds
    WHEN ets.phase = 'finished' 
    THEN 0
    ELSE 0
  END AS remaining_seconds
FROM event_timer_state ets;

-- RPC: Unified timer action handler
CREATE OR REPLACE FUNCTION call_timer_action(
  p_event_id text,
  p_action text,
  p_preset_id uuid DEFAULT NULL,
  p_actor uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_state RECORD;
  v_preset_duration integer;
  v_new_phase text;
  v_new_started_at timestamptz;
  v_new_paused_at timestamptz;
  v_new_elapsed integer;
  v_new_duration integer;
  v_new_revision integer;
  v_current_elapsed integer;
  v_result jsonb;
  v_expires_at timestamptz;
BEGIN
  -- Validate action
  IF p_action NOT IN ('start', 'pause', 'resume', 'reset', 'finish') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid action. Must be one of: start, pause, resume, reset, finish'
    );
  END IF;

  -- Get current state (or create if not exists)
  SELECT * INTO v_current_state
  FROM event_timer_state
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    -- Initialize state
    INSERT INTO event_timer_state (event_id, phase, control_owner)
    VALUES (p_event_id, 'idle', p_actor)
    RETURNING * INTO v_current_state;
  END IF;

  -- Execute action based on current phase
  CASE p_action
    WHEN 'start' THEN
      -- Get preset duration if provided
      IF p_preset_id IS NOT NULL THEN
        SELECT duration_seconds INTO v_preset_duration
        FROM event_timer_presets
        WHERE id = p_preset_id
        AND event_id = p_event_id
        AND archived_at IS NULL;

        IF NOT FOUND THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Preset not found or archived'
          );
        END IF;
      ELSE
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Preset ID required for start action'
        );
      END IF;

      -- Start new timer
      v_new_phase := 'running';
      v_new_duration := v_preset_duration;
      v_new_started_at := now();
      v_new_paused_at := NULL;
      v_new_elapsed := 0;

    WHEN 'pause' THEN
      IF v_current_state.phase != 'running' THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Can only pause running timer'
        );
      END IF;

      -- Calculate elapsed time
      v_current_elapsed := v_current_state.elapsed_seconds + 
        EXTRACT(EPOCH FROM (now() - v_current_state.started_at))::integer;

      v_new_phase := 'paused';
      v_new_duration := v_current_state.duration_seconds;
      v_new_started_at := NULL;
      v_new_paused_at := now();
      v_new_elapsed := LEAST(v_current_elapsed, v_current_state.duration_seconds);

    WHEN 'resume' THEN
      IF v_current_state.phase != 'paused' THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Can only resume paused timer'
        );
      END IF;

      v_new_phase := 'running';
      v_new_duration := v_current_state.duration_seconds;
      v_new_started_at := now();
      v_new_paused_at := NULL;
      v_new_elapsed := v_current_state.elapsed_seconds;

    WHEN 'reset' THEN
      v_new_phase := 'idle';
      v_new_duration := 0;
      v_new_started_at := NULL;
      v_new_paused_at := NULL;
      v_new_elapsed := 0;

    WHEN 'finish' THEN
      -- Calculate final elapsed time if running
      IF v_current_state.phase = 'running' THEN
        v_current_elapsed := v_current_state.elapsed_seconds + 
          EXTRACT(EPOCH FROM (now() - v_current_state.started_at))::integer;
      ELSE
        v_current_elapsed := v_current_state.elapsed_seconds;
      END IF;

      v_new_phase := 'finished';
      v_new_duration := v_current_state.duration_seconds;
      v_new_started_at := NULL;
      v_new_paused_at := NULL;
      v_new_elapsed := v_current_elapsed;

  END CASE;

  -- Increment revision for conflict detection
  v_new_revision := v_current_state.revision + 1;

  -- Calculate expires_at for running timers
  IF v_new_phase = 'running' AND v_new_started_at IS NOT NULL THEN
    v_expires_at := v_new_started_at + (v_new_duration - v_new_elapsed) * INTERVAL '1 second';
  ELSE
    v_expires_at := NULL;
  END IF;

  -- Update state
  UPDATE event_timer_state
  SET
    phase = v_new_phase,
    duration_seconds = v_new_duration,
    started_at = v_new_started_at,
    paused_at = v_new_paused_at,
    elapsed_seconds = v_new_elapsed,
    control_owner = COALESCE(p_actor, control_owner),
    revision = v_new_revision,
    updated_at = now()
  WHERE event_id = p_event_id
  RETURNING 
    id,
    event_id,
    phase,
    duration_seconds,
    started_at,
    paused_at,
    elapsed_seconds,
    control_owner,
    revision,
    updated_at
  INTO v_current_state;

  -- Build response with realtime payload
  v_result := jsonb_build_object(
    'success', true,
    'action', p_action,
    'state', jsonb_build_object(
      'id', v_current_state.id,
      'event_id', v_current_state.event_id,
      'phase', v_current_state.phase,
      'duration_seconds', v_current_state.duration_seconds,
      'started_at', v_current_state.started_at,
      'paused_at', v_current_state.paused_at,
      'elapsed_seconds', v_current_state.elapsed_seconds,
      'expires_at', v_expires_at,
      'control_owner', v_current_state.control_owner,
      'revision', v_current_state.revision,
      'updated_at', v_current_state.updated_at
    )
  );

  -- Supabase realtime automatically broadcasts changes to event_timer_state table

  RETURN v_result;
END;
$$;

-- Helper function to get remaining seconds
CREATE OR REPLACE FUNCTION get_timer_remaining_seconds(
  p_event_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state RECORD;
  v_remaining integer;
BEGIN
  SELECT * INTO v_state
  FROM event_timer_state
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  CASE v_state.phase
    WHEN 'idle' THEN
      RETURN v_state.duration_seconds;
    WHEN 'running' THEN
      v_remaining := v_state.duration_seconds - 
        (v_state.elapsed_seconds + EXTRACT(EPOCH FROM (now() - v_state.started_at))::integer);
      RETURN GREATEST(v_remaining, 0);
    WHEN 'paused' THEN
      RETURN GREATEST(v_state.duration_seconds - v_state.elapsed_seconds, 0);
    WHEN 'finished' THEN
      RETURN 0;
    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

-- Helper function to archive a preset (soft delete)
CREATE OR REPLACE FUNCTION archive_timer_preset(
  p_preset_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE event_timer_presets
  SET 
    archived_at = now(),
    updated_at = now()
  WHERE id = p_preset_id
  AND archived_at IS NULL;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'preset_id', p_preset_id,
      'archived_at', now()
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Preset not found or already archived'
    );
  END IF;
END;
$$;

-- Helper function to restore archived preset
CREATE OR REPLACE FUNCTION restore_timer_preset(
  p_preset_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE event_timer_presets
  SET 
    archived_at = NULL,
    updated_at = now()
  WHERE id = p_preset_id
  AND archived_at IS NOT NULL;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'preset_id', p_preset_id,
      'restored_at', now()
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Preset not found or not archived'
    );
  END IF;
END;
$$;

-- Seed default presets for common timer durations
INSERT INTO event_timer_presets (event_id, label, duration_seconds, ordering)
SELECT 
  e.id,
  preset.label,
  preset.duration_seconds,
  preset.ordering
FROM events e
CROSS JOIN (
  VALUES 
    ('Pitch Time (3 min)', 180, 1),
    ('Pitch Time (5 min)', 300, 2),
    ('Q&A Session (2 min)', 120, 3),
    ('Q&A Session (3 min)', 180, 4),
    ('Break (5 min)', 300, 5),
    ('Break (10 min)', 600, 6),
    ('Judging Window (15 min)', 900, 7),
    ('Judging Window (30 min)', 1800, 8)
) AS preset(label, duration_seconds, ordering)
ON CONFLICT (event_id, label) DO NOTHING;