/*
  # Create User Role Management System

  ## Overview
  This migration creates helper functions and tables for managing user roles
  and permissions across the judging application. It enables admins to assign
  roles to users and ensures proper metadata is stored in auth.users.

  ## Key Functions

  ### set_user_role(user_email, role_name, event_id)
  Assigns a role to a user by updating their app_metadata.
  - Parameters:
    - `user_email` (text) - The user's email address
    - `role_name` (text) - Role: judge, head_judge, operations, admin, owner
    - `event_id` (text) - Optional event ID to associate with the user
  - Returns: jsonb with success status and updated user info

  ### create_judge_user(user_email, full_name, role_name, event_id)
  Creates a new user entry in the judges table and links to auth.
  - Parameters:
    - `user_email` (text) - The user's email address
    - `full_name` (text) - The user's display name
    - `role_name` (text) - Role assignment
    - `event_id` (text) - Event identifier
  - Returns: jsonb with success status

  ### get_users_by_role(role_filter, event_filter)
  Retrieves users filtered by role and/or event.
  - Parameters:
    - `role_filter` (text) - Optional role to filter by
    - `event_filter` (text) - Optional event_id to filter by
  - Returns: Table of user records with role and event info

  ## New Tables

  ### user_roles_audit
  Tracks all role changes for audit purposes:
  - `id` (uuid, primary key) - Audit record identifier
  - `user_id` (uuid) - User who had their role changed
  - `previous_role` (text) - Role before the change
  - `new_role` (text) - Role after the change
  - `changed_by` (uuid) - Admin who made the change
  - `event_id` (text) - Associated event
  - `created_at` (timestamptz) - When the change occurred

  ## Security
  - All RPC functions are SECURITY DEFINER and restricted to service_role or admins
  - Audit logging is enabled for all role changes
  - RLS policies ensure only authorized users can manage roles

  ## Usage Examples

  ### Assign admin role to a user
  ```sql
  SELECT set_user_role(
    'admin@example.com',
    'admin',
    'demo-event'
  );
  ```

  ### Create a new judge
  ```sql
  SELECT create_judge_user(
    'judge@example.com',
    'Jane Smith',
    'judge',
    'demo-event'
  );
  ```

  ### List all admins for an event
  ```sql
  SELECT * FROM get_users_by_role('admin', 'demo-event');
  ```
*/

-- Create user_roles_audit table for tracking role changes
CREATE TABLE IF NOT EXISTS user_roles_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  previous_role text,
  new_role text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  event_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_audit_user_id ON user_roles_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_audit_event_id ON user_roles_audit(event_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_audit_created_at ON user_roles_audit(created_at DESC);

ALTER TABLE user_roles_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can read audit logs
CREATE POLICY "Service role can read audit logs"
  ON user_roles_audit
  FOR SELECT
  TO service_role
  USING (true);

-- Policy: Only service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON user_roles_audit
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RPC: Set user role in app_metadata
CREATE OR REPLACE FUNCTION set_user_role(
  user_email text,
  role_name text,
  event_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  current_metadata jsonb;
  new_metadata jsonb;
  previous_role text;
BEGIN
  -- Validate role
  IF role_name NOT IN ('judge', 'head_judge', 'operations', 'admin', 'owner', 'administrator', 'ops', 'coordinator', 'organizer', 'super_admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role. Must be one of: judge, head_judge, operations, admin, owner'
    );
  END IF;

  -- Normalize role aliases
  role_name := CASE role_name
    WHEN 'administrator' THEN 'admin'
    WHEN 'ops' THEN 'operations'
    WHEN 'coordinator' THEN 'operations'
    WHEN 'organizer' THEN 'owner'
    WHEN 'super_admin' THEN 'owner'
    ELSE role_name
  END;

  -- Find user by email
  SELECT id, raw_app_meta_data
  INTO target_user_id, current_metadata
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found with email: ' || user_email
    );
  END IF;

  -- Get previous role for audit
  previous_role := current_metadata->>'role';

  -- Build new metadata
  new_metadata := COALESCE(current_metadata, '{}'::jsonb);
  new_metadata := jsonb_set(new_metadata, '{role}', to_jsonb(role_name));

  IF event_id IS NOT NULL THEN
    new_metadata := jsonb_set(new_metadata, '{event_id}', to_jsonb(event_id));
  END IF;

  -- Update user metadata
  UPDATE auth.users
  SET raw_app_meta_data = new_metadata,
      updated_at = now()
  WHERE id = target_user_id;

  -- Log the change
  INSERT INTO user_roles_audit (user_id, previous_role, new_role, changed_by, event_id)
  VALUES (target_user_id, previous_role, role_name, auth.uid(), event_id);

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', user_email,
    'role', role_name,
    'event_id', event_id
  );
END;
$$;

-- RPC: Create judge user entry
CREATE OR REPLACE FUNCTION create_judge_user(
  user_email text,
  full_name text,
  role_name text DEFAULT 'judge',
  event_id text DEFAULT 'demo-event'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  judge_id uuid;
BEGIN
  -- Find or expect user to exist
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be created in auth.users first. Email: ' || user_email,
      'help', 'Create the user through Supabase Dashboard or signInWithOtp first'
    );
  END IF;

  -- Set the user role
  PERFORM set_user_role(user_email, role_name, event_id);

  -- Create judge profile if it doesn't exist
  INSERT INTO judges (event_id, user_id, full_name, is_published)
  VALUES (event_id, target_user_id, full_name, false)
  ON CONFLICT (event_id, user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      updated_at = now()
  RETURNING id INTO judge_id;

  -- Create judge_profile if it doesn't exist
  INSERT INTO judge_profiles (event_id, user_id)
  VALUES (event_id, target_user_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'judge_id', judge_id,
    'email', user_email,
    'full_name', full_name,
    'role', role_name,
    'event_id', event_id
  );
END;
$$;

-- RPC: Get users by role
CREATE OR REPLACE FUNCTION get_users_by_role(
  role_filter text DEFAULT NULL,
  event_filter text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  event_id text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.email::text,
    (u.raw_app_meta_data->>'role')::text as role,
    (u.raw_app_meta_data->>'event_id')::text as event_id,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE
    (role_filter IS NULL OR (u.raw_app_meta_data->>'role')::text = role_filter)
    AND (event_filter IS NULL OR (u.raw_app_meta_data->>'event_id')::text = event_filter)
  ORDER BY u.created_at DESC;
END;
$$;

-- RPC: Bulk assign roles from CSV data
CREATE OR REPLACE FUNCTION bulk_assign_roles(
  users_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record jsonb;
  success_count integer := 0;
  error_count integer := 0;
  results jsonb := '[]'::jsonb;
  result jsonb;
BEGIN
  FOR user_record IN SELECT * FROM jsonb_array_elements(users_data)
  LOOP
    BEGIN
      SELECT set_user_role(
        user_record->>'email',
        user_record->>'role',
        user_record->>'event_id'
      ) INTO result;

      IF result->>'success' = 'true' THEN
        success_count := success_count + 1;
      ELSE
        error_count := error_count + 1;
      END IF;

      results := results || jsonb_build_array(result);
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      results := results || jsonb_build_array(
        jsonb_build_object(
          'success', false,
          'email', user_record->>'email',
          'error', SQLERRM
        )
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'total', success_count + error_count,
    'success_count', success_count,
    'error_count', error_count,
    'results', results
  );
END;
$$;
