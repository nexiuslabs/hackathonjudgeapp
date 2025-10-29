/*
  # Seed Data for User Roles

  ## Overview
  This file contains example SQL commands for creating initial users with different roles.
  These commands should be run in the Supabase SQL Editor after the migrations are applied.

  ## Important Notes
  - Users must first be created through Supabase Auth (via Dashboard, Magic Link, or signInWithOtp)
  - This script only assigns roles to EXISTING users
  - Replace the email addresses with your actual user emails
  - The event_id should match your actual event identifier

  ## Roles Available
  - judge: Standard judge with scoring access
  - head_judge: Lead judge with additional oversight capabilities
  - operations: Operations team member with event management access
  - admin: Full administrative access to the console
  - owner: Highest level access with all permissions

  ## Usage

  ### Step 1: Create users in Supabase Dashboard
  Navigate to: Authentication > Users > Add User
  Or send magic links to the email addresses you want to use

  ### Step 2: Run the role assignment commands below
  Copy and execute the SQL commands in the Supabase SQL Editor

  ### Step 3: Verify the assignments
  Use the get_users_by_role function to confirm:
  ```sql
  SELECT * FROM get_users_by_role();
  ```
*/

-- ============================================================================
-- EXAMPLE USER ROLE ASSIGNMENTS
-- ============================================================================
-- IMPORTANT: Replace these email addresses with your actual user emails
-- ============================================================================

-- Assign OWNER role (highest permissions)
-- Example: Replace 'owner@example.com' with your email
SELECT set_user_role(
  'owner@example.com',
  'owner',
  'demo-event'
);

-- Assign ADMIN role
-- Example: Replace 'admin@example.com' with your email
SELECT set_user_role(
  'admin@example.com',
  'admin',
  'demo-event'
);

-- Assign OPERATIONS role
-- Example: Replace 'ops@example.com' with your email
SELECT set_user_role(
  'ops@example.com',
  'operations',
  'demo-event'
);

-- Assign HEAD JUDGE role
-- Example: Replace 'headjudge@example.com' with your email
SELECT set_user_role(
  'headjudge@example.com',
  'head_judge',
  'demo-event'
);

-- Assign JUDGE role
-- Example: Replace 'judge@example.com' with your email
SELECT set_user_role(
  'judge@example.com',
  'judge',
  'demo-event'
);

-- ============================================================================
-- BULK ASSIGNMENT EXAMPLE
-- ============================================================================
-- Use this to assign roles to multiple users at once
-- ============================================================================

/*
SELECT bulk_assign_roles('[
  {
    "email": "owner@example.com",
    "role": "owner",
    "event_id": "demo-event"
  },
  {
    "email": "admin@example.com",
    "role": "admin",
    "event_id": "demo-event"
  },
  {
    "email": "ops@example.com",
    "role": "operations",
    "event_id": "demo-event"
  },
  {
    "email": "headjudge@example.com",
    "role": "head_judge",
    "event_id": "demo-event"
  },
  {
    "email": "judge1@example.com",
    "role": "judge",
    "event_id": "demo-event"
  },
  {
    "email": "judge2@example.com",
    "role": "judge",
    "event_id": "demo-event"
  }
]'::jsonb);
*/

-- ============================================================================
-- CREATE JUDGE PROFILES
-- ============================================================================
-- Use this to create judge entries in the judges table
-- ============================================================================

/*
SELECT create_judge_user(
  'judge1@example.com',
  'Jane Smith',
  'judge',
  'demo-event'
);

SELECT create_judge_user(
  'judge2@example.com',
  'John Doe',
  'judge',
  'demo-event'
);

SELECT create_judge_user(
  'headjudge@example.com',
  'Sarah Johnson',
  'head_judge',
  'demo-event'
);
*/

-- ============================================================================
-- VERIFY ROLE ASSIGNMENTS
-- ============================================================================

-- List all users with roles
SELECT * FROM get_users_by_role();

-- List only admins
SELECT * FROM get_users_by_role('admin');

-- List all users for a specific event
SELECT * FROM get_users_by_role(NULL, 'demo-event');

-- View audit log of role changes
SELECT
  u.email,
  a.previous_role,
  a.new_role,
  a.event_id,
  a.created_at
FROM user_roles_audit a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at DESC
LIMIT 50;
