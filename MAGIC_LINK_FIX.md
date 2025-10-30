# Magic Link Redirect Fix

## Problem

Magic links are redirecting to `http://localhost:3000` instead of the correct application URL.

## Root Cause

The Supabase project's **Site URL** is currently set to `http://localhost:3000` in the Supabase Dashboard. This setting controls where magic links redirect users after authentication.

## Solution

You must update the Site URL in your Supabase Dashboard to match your actual application URL.

---

## Step-by-Step Fix

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `iwecxmhhoziamzneyamu`

### Step 2: Update Site URL

1. In the left sidebar, click **Authentication**
2. Click **URL Configuration** tab
3. Find the **Site URL** field
4. Update it to your application URL:
   - **For local development**: `http://localhost:5173`
   - **For production**: `https://yourdomain.com`
5. Click **Save**

### Step 3: Configure Redirect URLs

While you're in the URL Configuration section:

1. Scroll down to **Redirect URLs**
2. Add these URLs to the whitelist:
   ```
   http://localhost:5173/**
   https://yourdomain.com/**
   ```
3. Click **Save**

### Step 4: Test the Magic Link

1. Go to your app's `/auth` page
2. Enter your email address
3. Click "Request magic link"
4. Check your email and click the magic link
5. Verify you're redirected to the correct URL (should now be `localhost:5173` or your domain)

---

## Important Notes

### Understanding Site URL

The **Site URL** in Supabase is the primary redirect destination for:
- Magic links (email authentication)
- OAuth providers (Google, GitHub, etc.)
- Password reset links
- Email confirmation links

When a user clicks a magic link, Supabase:
1. Validates the token
2. Redirects to the Site URL + the path you specified (e.g., `/score`)
3. Appends the authentication tokens to the URL hash

### Why localhost:3000?

`localhost:3000` is the default Site URL set when creating a new Supabase project. It's commonly used by:
- Create React App (default port 3000)
- Next.js development server (default port 3000)

Your app uses **Vite**, which runs on port **5173** by default.

### What If I Change Ports?

If you change your development port, you must update:
1. `VITE_APP_URL` in `.env`
2. Site URL in Supabase Dashboard
3. Redirect URLs whitelist in Supabase Dashboard

---

## Verification

After making changes, verify the configuration:

### 1. Check Environment Variables

In your `.env` file:
```env
VITE_APP_URL=http://localhost:5173
```

### 2. Check Supabase Settings

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `http://localhost:5173` (for dev) or `https://yourdomain.com` (for prod)
- **Redirect URLs**: Must include your Site URL with wildcard

### 3. Test Authentication Flow

```bash
# Start your development server
npm run dev

# Navigate to http://localhost:5173/auth
# Request a magic link
# Click the link in your email
# Verify you're redirected to http://localhost:5173/score
```

---

## Production Deployment

When deploying to production:

### Before Deployment

1. Set production URL in `.env`:
   ```env
   VITE_APP_URL=https://yourdomain.com
   ```

2. Update Supabase Site URL to: `https://yourdomain.com`

3. Add production URL to Redirect URLs: `https://yourdomain.com/**`

4. Rebuild your app:
   ```bash
   npm run build
   ```

### After Deployment

1. Test magic link on production domain
2. Verify redirect goes to `https://yourdomain.com/score`
3. Check browser console for any errors

---

## Troubleshooting

### Still Redirecting to Wrong URL After Changes

**Problem**: Magic link still redirects to old URL after updating Site URL.

**Solutions**:
1. Clear your browser cache and cookies
2. Wait 1-2 minutes for Supabase changes to propagate
3. Request a NEW magic link (old emails may have cached the old URL)
4. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### "Invalid Redirect URL" Error

**Problem**: Error message when clicking magic link.

**Solutions**:
1. Verify the redirect URL is in the whitelist
2. Ensure the wildcard `/**` is included
3. Check for typos in the URL
4. Make sure protocol matches (http vs https)

### Authentication Works But Redirects to Wrong Page

**Problem**: User is authenticated but lands on wrong page.

**Solutions**:
1. Check the `emailRedirectTo` parameter in the magic link request
2. Default redirect is `/score` - this is controlled in `src/lib/api.ts`
3. You can customize by passing `redirectTo` parameter:
   ```typescript
   await requestMagicLink({
     email: 'user@example.com',
     redirectTo: 'http://localhost:5173/admin'
   });
   ```

### Token in URL But Not Authenticated

**Problem**: URL has `#access_token=...` but user isn't signed in.

**Solutions**:
1. Check browser console for errors
2. Verify `MagicLinkHandler` component is mounted (it should be in App.tsx)
3. Ensure Supabase client has `detectSessionInUrl: true` (already configured)
4. Clear localStorage: `localStorage.clear()`
5. Try again with a fresh magic link

---

## Quick Fix Checklist

- [ ] Updated Site URL in Supabase Dashboard to `http://localhost:5173`
- [ ] Added `http://localhost:5173/**` to Redirect URLs whitelist
- [ ] Set `VITE_APP_URL=http://localhost:5173` in `.env`
- [ ] Restarted development server (`npm run dev`)
- [ ] Requested a NEW magic link
- [ ] Clicked the link and verified correct redirect
- [ ] Checked that authentication is successful

---

## Need More Help?

If you're still experiencing issues:

1. Check Supabase Auth Logs:
   - Dashboard → Logs → Auth Logs
   - Look for recent authentication attempts
   - Check for any error messages

2. Check Browser Console:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for red error messages
   - Check Network tab for failed requests

3. Verify Configuration:
   ```sql
   -- Run in Supabase SQL Editor to check user
   SELECT id, email, created_at, last_sign_in_at
   FROM auth.users
   WHERE email = 'your@email.com';
   ```

4. Review [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) for complete authentication setup

---

## Summary

The magic link redirect issue is caused by incorrect Site URL configuration in Supabase Dashboard. The fix is simple:

1. **Update Site URL** in Supabase to `http://localhost:5173` (or your production domain)
2. **Add to Redirect URLs** whitelist
3. **Test with a fresh magic link**

This must be done in the Supabase Dashboard - it cannot be controlled from code.
