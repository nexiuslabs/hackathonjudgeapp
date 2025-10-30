# Quick Start Guide - Magic Link Fix

## 🚨 IMMEDIATE ACTION REQUIRED

Your magic links are redirecting to `localhost:3000` because the Supabase Site URL is misconfigured.

---

## Fix It Now (2 Minutes)

### Step 1: Open Supabase Dashboard

Go to: https://supabase.com/dashboard/project/iwecxmhhoziamzneyamu/auth/url-configuration

(Replace `iwecxmhhoziamzneyamu` with your project ID if different)

### Step 2: Update Site URL

Find the **Site URL** field and change it to:

```
http://localhost:5173
```

### Step 3: Update Redirect URLs

Scroll down to **Redirect URLs** section and add:

```
http://localhost:5173/**
```

### Step 4: Save Changes

Click the **Save** button.

### Step 5: Test

1. Go to: http://localhost:5173/auth
2. Request a new magic link
3. Check your email and click the link
4. You should now be redirected to `localhost:5173` instead of `localhost:3000`

---

## Why This Happens

- Your Supabase project was configured with `localhost:3000` as the default Site URL
- Your app runs on `localhost:5173` (Vite's default port)
- The mismatch causes magic links to redirect to the wrong URL

---

## For Production

When deploying to production, update:

1. **Supabase Site URL**: `https://yourdomain.com`
2. **Redirect URLs**: `https://yourdomain.com/**`
3. **Environment Variable**: `VITE_APP_URL=https://yourdomain.com`

---

## Still Not Working?

See [MAGIC_LINK_FIX.md](./MAGIC_LINK_FIX.md) for detailed troubleshooting.

Common issues:
- Cached old URL in email (request a NEW magic link)
- Browser cache (hard refresh with Ctrl+Shift+R)
- Wrong project selected in Supabase Dashboard
- Typo in URL configuration

---

## User Roles Setup

After fixing magic links, you'll need to assign roles to users:

### Step 1: Create Users

Users must first exist in Supabase. Either:
- Let them request magic links (creates user automatically)
- Add them manually in Supabase Dashboard → Authentication → Users

### Step 2: Assign Roles

Run in Supabase SQL Editor:

```sql
-- For an admin user
SELECT set_user_role(
  'admin@example.com',
  'admin',
  'demo-event'
);

-- For a judge
SELECT set_user_role(
  'judge@example.com',
  'judge',
  'demo-event'
);

-- For operations
SELECT set_user_role(
  'ops@example.com',
  'operations',
  'demo-event'
);
```

### Available Roles

- `owner` - Full access
- `admin` - Admin console access
- `operations` - Event management
- `head_judge` - Lead judge with admin access
- `judge` - Standard scoring access

### Step 3: Verify

```sql
SELECT email, raw_app_meta_data->>'role' as role
FROM auth.users;
```

---

## Complete Documentation

- **Magic Link Issues**: [MAGIC_LINK_FIX.md](./MAGIC_LINK_FIX.md)
- **Full Auth Setup**: [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md)
- **Role Examples**: [supabase/seed.sql](./supabase/seed.sql)
- **General Info**: [README.md](./README.md)

---

## Need Help?

1. Check browser console for errors (F12)
2. Check Supabase Auth Logs in Dashboard
3. Verify `.env` has correct `VITE_APP_URL`
4. Ensure development server is running on port 5173

---

## Summary Checklist

- [ ] Updated Site URL to `http://localhost:5173`
- [ ] Added `http://localhost:5173/**` to Redirect URLs
- [ ] Saved changes in Supabase Dashboard
- [ ] Requested a NEW magic link
- [ ] Successfully redirected to correct URL
- [ ] Applied migrations for role management
- [ ] Assigned roles to users
- [ ] Tested authentication flow

**You're all set!** 🎉
