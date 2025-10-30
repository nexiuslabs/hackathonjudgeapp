# Supabase Authentication Setup Guide

This guide walks you through configuring Supabase authentication, setting up magic link redirects, and assigning user roles for the Hackathon Judge application.

---

## 🚨 CRITICAL: Fix Magic Link Redirects First

**If magic links are redirecting to `localhost:3000` instead of your app URL**, you MUST update the Site URL in Supabase Dashboard.

**Quick Fix:**
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Change **Site URL** from `http://localhost:3000` to `http://localhost:5173` (or your production URL)
3. Add `http://localhost:5173/**` to **Redirect URLs**
4. Click **Save**
5. Request a NEW magic link and test

📖 **See [MAGIC_LINK_FIX.md](./MAGIC_LINK_FIX.md) for detailed troubleshooting.**

---

## Table of Contents

1. [Configure Supabase Site URL](#1-configure-supabase-site-url)
2. [Set Up Redirect URLs](#2-set-up-redirect-urls)
3. [Apply Database Migrations](#3-apply-database-migrations)
4. [Create Users and Assign Roles](#4-create-users-and-assign-roles)
5. [Test Authentication Flow](#5-test-authentication-flow)
6. [Troubleshooting](#troubleshooting)

---

## 1. Configure Supabase Site URL

The Site URL is the primary redirect destination for magic links and OAuth flows.

### Steps:

1. Open your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set the **Site URL** to your production domain:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`
4. Click **Save**

### Environment Variables

Update your `.env` file with the app URL:

```env
VITE_APP_URL=http://localhost:5173
```

For production deployment, set:

```env
VITE_APP_URL=https://yourdomain.com
```

---

## 2. Set Up Redirect URLs

Redirect URLs whitelist the domains that Supabase will accept as valid redirect targets.

### Steps:

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   http://localhost:5173/**
   https://yourdomain.com/**
   ```
3. Click **Save**

### Why This Matters

When a user clicks a magic link, Supabase validates the redirect URL against this whitelist. If the URL isn't whitelisted, the authentication will fail.

---

## 3. Apply Database Migrations

The user role management system requires database migrations to be applied.

### Option A: Using Supabase CLI (Recommended)

```bash
# Navigate to project directory
cd /path/to/project

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### Option B: Using Supabase SQL Editor

1. Open Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20251029141500_create_user_role_management.sql`
4. Paste and run the query
5. Verify success: You should see "Success. No rows returned"

---

## 4. Create Users and Assign Roles

### Step 4.1: Create User Accounts

Users must first exist in Supabase Auth before roles can be assigned.

#### Method A: Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter email address
4. Click **Send Magic Link** or **Create User**

#### Method B: Via Magic Link Request

1. Users can request magic links from your app's `/auth` page
2. They'll receive an email with a sign-in link
3. Clicking the link creates their account automatically

### Step 4.2: Assign Roles to Users

Once users exist in the system, assign roles using the SQL functions.

#### Available Roles

- **judge**: Standard judge with scoring access
- **head_judge**: Lead judge with oversight capabilities
- **operations**: Operations team with event management
- **admin**: Full administrative console access
- **owner**: Highest level with all permissions

#### Assign a Single Role

Open Supabase **SQL Editor** and run:

```sql
-- Assign admin role
SELECT set_user_role(
  'user@example.com',
  'admin',
  'demo-event'
);

-- Assign operations role
SELECT set_user_role(
  'ops@example.com',
  'operations',
  'demo-event'
);

-- Assign judge role
SELECT set_user_role(
  'judge@example.com',
  'judge',
  'demo-event'
);
```

#### Bulk Assign Roles

For multiple users, use the bulk assignment function:

```sql
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
    "email": "ops1@example.com",
    "role": "operations",
    "event_id": "demo-event"
  },
  {
    "email": "ops2@example.com",
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
  }
]'::jsonb);
```

### Step 4.3: Verify Role Assignments

Check that roles were assigned correctly:

```sql
-- List all users with roles
SELECT * FROM get_users_by_role();

-- List only admins
SELECT * FROM get_users_by_role('admin');

-- List users for a specific event
SELECT * FROM get_users_by_role(NULL, 'demo-event');

-- View audit log
SELECT
  u.email,
  a.previous_role,
  a.new_role,
  a.event_id,
  a.created_at
FROM user_roles_audit a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at DESC;
```

---

## 5. Test Authentication Flow

### Test Magic Link

1. Navigate to `/auth` in your app
2. Enter a test email address
3. Click "Request magic link"
4. Check your email inbox
5. Click the magic link
6. Verify you're redirected to `/score` (or the configured redirect)

### Test Admin Access

1. Sign in with a user that has an admin role (admin, operations, head_judge, or owner)
2. Navigate to `/admin`
3. Verify you can access the admin console
4. If you see "Access Denied", check:
   - User role was assigned correctly
   - User has signed in at least once after role assignment
   - Browser cache is cleared

### Test Role Permissions

Test each role level:

- **Judge**: Should access `/score` and `/brief`
- **Head Judge**: Should access `/admin` with limited controls
- **Operations**: Should access `/admin` with event controls
- **Admin**: Should access all admin features
- **Owner**: Should have complete access

---

## Troubleshooting

### Magic Link Redirects to localhost:3000

**Problem**: Magic link redirects to `localhost:3000` instead of the correct URL.

**Solution**:

1. Update `VITE_APP_URL` in `.env` file
2. Update **Site URL** in Supabase Dashboard
3. Rebuild your app: `npm run build`
4. Clear browser cache
5. Request a new magic link

### "User not found" Error When Assigning Role

**Problem**: Role assignment fails with "User not found" error.

**Solution**:

1. Verify the user exists: Go to **Authentication** → **Users**
2. Check the email address spelling
3. Ensure the user has signed in at least once
4. Wait a few seconds after user creation before assigning roles

### "Access Denied" on Admin Page

**Problem**: User sees "Access Denied" when visiting `/admin`.

**Solution**:

1. Check user role:
   ```sql
   SELECT email, raw_app_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'user@example.com';
   ```
2. Verify role is one of: `admin`, `operations`, `head_judge`, `owner`
3. Sign out and sign back in to refresh session
4. Clear browser localStorage: `localStorage.clear()`
5. Check browser console for permission errors

### Redirect URL Not Allowed

**Problem**: Error message "redirect URL not allowed" when clicking magic link.

**Solution**:

1. Go to **Authentication** → **URL Configuration**
2. Add your domain to **Redirect URLs** with wildcard: `https://yourdomain.com/**`
3. Save and try again
4. For development, ensure `http://localhost:5173/**` is listed

### Role Not Persisting After Sign-In

**Problem**: User role resets after signing out and back in.

**Solution**:

1. Roles should be stored in `raw_app_meta_data`, not `raw_user_meta_data`
2. Check role location:
   ```sql
   SELECT
     email,
     raw_app_meta_data,
     raw_user_meta_data
   FROM auth.users
   WHERE email = 'user@example.com';
   ```
3. If role is in `raw_user_meta_data`, reassign using `set_user_role` function
4. The function automatically places roles in the correct metadata field

---

## Quick Reference

### Essential SQL Commands

```sql
-- Assign role
SELECT set_user_role('user@example.com', 'admin', 'demo-event');

-- Create judge profile
SELECT create_judge_user('judge@example.com', 'Jane Smith', 'judge', 'demo-event');

-- List all users
SELECT * FROM get_users_by_role();

-- Check specific user role
SELECT email, raw_app_meta_data->>'role' as role
FROM auth.users
WHERE email = 'user@example.com';
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

### Role Hierarchy

1. **owner** - Full system access
2. **admin** - Complete admin console access
3. **operations** - Event management access
4. **head_judge** - Lead judge with admin access
5. **judge** - Standard scoring access

---

## Support

If you continue to experience issues:

1. Check Supabase logs: **Logs** → **Auth Logs**
2. Check browser console for JavaScript errors
3. Verify migrations were applied: **Database** → **Migrations**
4. Review the audit log for role change history

For additional help, consult the Supabase documentation:
- [Auth Configuration](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Email Auth](https://supabase.com/docs/guides/auth/auth-email)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
