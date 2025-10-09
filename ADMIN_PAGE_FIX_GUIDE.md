# 🔧 Admin Page Fix & Diagnostic Guide

## 📋 Summary of Changes

This guide explains the comprehensive fixes applied to diagnose and resolve /admin page access
issues.

### ✅ What Was Fixed

1. **Enhanced Debug Logging** - Added detailed logging throughout authentication flow
2. **User-Friendly Error Messages** - Replaced silent redirects with informative error pages
3. **Error State Tracking** - Added profile error state to useAuth hook
4. **Diagnostic SQL Script** - Created `FIX_ADMIN_ACCESS.sql` for database troubleshooting
5. **Better Error Handling** - Comprehensive error handling in profile fetch

---

## 🔍 How to Diagnose Admin Access Issues

### Step 1: Check Browser Console Logs

When you try to access `/admin`, check the browser console (F12) for detailed logs:

**Look for these log messages:**

```
[useAuth] Checking for existing session...
[useAuth] Existing session check: { hasSession: true, userId: "...", email: "..." }
[useAuth] Fetching profile for user: ...
[useAuth] Profile fetched successfully: { role: "admin", ... }
[Admin] Auth loaded, checking admin access: { isAdmin: true, ... }
[Admin] Access granted - fetching admin data
```

**If you see errors:**

```
[useAuth] Error fetching profile: { code: "...", message: "..." }
[Admin] Access denied - redirecting to home: { reason: "Not admin role", currentRole: "user" }
```

This tells you exactly what's wrong!

---

### Step 2: Use the SQL Diagnostic Script

Run the `FIX_ADMIN_ACCESS.sql` script in Supabase SQL Editor:

1. **Open Supabase Dashboard:**
   - https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql

2. **Open the SQL file:**
   - Located at: `/home/vik/aiborg_CC/aiborg-learn-sphere/FIX_ADMIN_ACCESS.sql`

3. **Follow the steps in the script:**
   - STEP 1: Check all profiles
   - STEP 2: Find your profile
   - STEP 3: Update role to admin
   - STEP 4: Verify the update

**Quick Fix Template (copy and run):**

```sql
-- Replace YOUR_EMAIL@example.com with your actual email
UPDATE profiles
SET role = 'admin', updated_at = now()
WHERE email = 'YOUR_EMAIL@example.com';

-- Verify it worked
SELECT email, role FROM profiles WHERE email = 'YOUR_EMAIL@example.com';
```

---

### Step 3: Check the Error Message on /admin Page

When you try to access `/admin` without proper access, you'll now see:

**Instead of silent redirect, you'll see:**

1. **"Authentication Required"** - You're not signed in
   - Action: Click "Sign In" button

2. **"Profile Not Found"** - Your profile doesn't exist
   - Action: Click "Retry" or sign out/in again
   - Check database to ensure profile was created

3. **"Admin Access Required"** - Your role is not admin
   - Shows your current role
   - Action: Update role in database using SQL script

**Development Mode Bonus:**

In development (`npm run dev`), you'll see a debug info box showing:

- User ID
- Email
- Profile ID
- Current role
- Denial reason
- Profile error (if any)

---

## 🛠️ Common Issues & Solutions

### Issue 1: "Admin Access Required" - Role is 'user'

**Cause:** Your account exists but role is not admin

**Fix:**

1. Run this SQL in Supabase:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

2. **IMPORTANT:** Sign out and sign in again to refresh session

3. Try accessing `/admin` again

---

### Issue 2: "Profile Not Found"

**Cause:** No profile row exists for your user

**Fix:**

1. Check if auth user exists:

```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

2. Create profile:

```sql
INSERT INTO profiles (user_id, email, display_name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', email), 'admin'
FROM auth.users
WHERE email = 'your-email@example.com';
```

3. Sign out and sign in again

---

### Issue 3: Profile Fetch Error in Console

**Cause:** RLS policy blocking access or database connection issue

**Fix:**

1. Check console for error code
2. Common error codes:
   - `PGRST116` - Row not found (profile doesn't exist)
   - `PGRST301` - Row Level Security blocking access
   - `Connection error` - Database connection issue

3. For RLS issues, verify policies exist:

```sql
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
```

Expected policies:

- "Users can view their own profile"
- "Admins can view all profiles"

---

### Issue 4: Still Redirecting After Fixing Database

**Cause:** Browser cached old session data

**Fix:**

**Option A: Sign Out/In (Recommended)**

1. Sign out completely
2. Close browser tab
3. Open new tab
4. Sign in again
5. Try `/admin`

**Option B: Clear Browser Storage**

1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Refresh and sign in

**Option C: Hard Refresh**

1. Press Ctrl+Shift+R (Windows/Linux)
2. Or Cmd+Shift+R (Mac)

---

### Issue 5: Role is 'admin' but Still Can't Access (user_id Mismatch) ⚠️ CRITICAL

**Cause:** The `user_id` in your profile row doesn't match your `auth.users.id`

**Symptoms:**

- Database shows `role = 'admin'` ✅
- You're signed in successfully ✅
- Still redirected from `/admin` ❌
- Console shows: `[useAuth] Profile not found for user` ❌

**Why this happens:**

The frontend looks up your profile like this:

```javascript
.from('profiles')
.eq('user_id', currentAuthUserId)  // Must match!
.single()
```

If `profile.user_id` doesn't match the auth user's ID, the profile isn't found even though it
exists!

**How to diagnose:**

1. **Run the diagnostic script:**
   - Open: `DIAGNOSE_ADMIN_ISSUE.sql`
   - Run in Supabase SQL Editor
   - Look for: `❌ MISMATCH - NEEDS FIX`

2. **Check the Quick Summary query:**

```sql
SELECT
  (SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com') as auth_user_id,
  (SELECT user_id FROM profiles WHERE email = 'hirendra@gmail.com') as profile_user_id,
  CASE
    WHEN (SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com') =
         (SELECT user_id FROM profiles WHERE email = 'hirendra@gmail.com')
    THEN '✅ LINKED CORRECTLY'
    ELSE '❌ MISMATCH FOUND'
  END as status;
```

**Fix:**

**Step 1: Run the fix script**

- Open: `FIX_USER_ID_MISMATCH.sql`
- Execute in Supabase SQL Editor
- Verify: Final summary shows `✅ FIX SUCCESSFUL`

**Step 2: Quick fix command** (if you prefer one-liner):

```sql
-- Replace YOUR_EMAIL with your actual email
UPDATE profiles
SET
  user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL'),
  updated_at = now()
WHERE email = 'YOUR_EMAIL';

-- Verify the fix
SELECT
  p.user_id as profile_user_id,
  au.id as auth_user_id,
  CASE WHEN p.user_id = au.id THEN '✅ FIXED' ELSE '❌ STILL WRONG' END as status
FROM profiles p
JOIN auth.users au ON au.email = p.email
WHERE p.email = 'YOUR_EMAIL';
```

**Step 3: Test**

1. Sign out completely
2. Sign in again
3. Go to `/admin`
4. Success! ✅

**Real-world example:**

```
Database shows:
profiles table:
  email: hirendra@gmail.com
  role: admin ✅
  user_id: "old-uuid-xyz-789" ❌ WRONG!

auth.users table:
  email: hirendra@gmail.com
  id: "current-uuid-abc-123" ✅ CORRECT

Problem: old-uuid-xyz-789 ≠ current-uuid-abc-123
Solution: Update profile.user_id to "current-uuid-abc-123"
```

**Common causes:**

- Profile was created for a different auth account
- Auth account was deleted and recreated
- Manual profile insertion with wrong user_id
- Database migration error
- Multiple sign-up methods (email vs OAuth) created separate accounts

---

## 📊 Testing Scenarios

### Test 1: Admin User Access

**Setup:**

- User signed in
- Profile exists
- Role = 'admin'

**Expected:**

- ✅ See admin dashboard
- ✅ Console shows: `[Admin] Access granted`
- ✅ No errors

---

### Test 2: Non-Admin User Access

**Setup:**

- User signed in
- Profile exists
- Role = 'user'

**Expected:**

- ✅ See error page: "Admin Access Required"
- ✅ Shows current role in message
- ✅ Console shows: `[Admin] Access denied - not admin role`
- ✅ Debug box shows role = 'user'

---

### Test 3: Unauthenticated Access

**Setup:**

- User NOT signed in

**Expected:**

- ✅ See error page: "Authentication Required"
- ✅ "Sign In" button appears
- ✅ Console shows: `[Admin] Access denied - no user`

---

### Test 4: Missing Profile

**Setup:**

- User signed in
- Profile doesn't exist in database

**Expected:**

- ✅ See error page: "Profile Not Found"
- ✅ "Retry" button appears
- ✅ Console shows: `[useAuth] Profile not found for user`
- ✅ Debug box shows profileError message

---

## 🔧 Debugging Checklist

Use this checklist to systematically diagnose issues:

- [ ] **Browser Console Open** (F12)
- [ ] **Check for [useAuth] logs** - Shows auth state and profile fetch
- [ ] **Check for [Admin] logs** - Shows access check results
- [ ] **Look for errors** - Red errors indicate problems
- [ ] **Verify user signed in** - Should see user ID in logs
- [ ] **Verify profile loaded** - Should see profile ID and role in logs
- [ ] **Check role value** - Should be 'admin' for access
- [ ] **Run SQL diagnostic script** - Verify database state
- [ ] **Check error page message** - Tells you what's wrong
- [ ] **Look at debug info box** (dev mode) - Shows all relevant data

---

## 📝 Log Examples

### ✅ Successful Admin Access

```
[useAuth] Checking for existing session...
[useAuth] Existing session check: { hasSession: true, userId: "abc-123", email: "admin@example.com" }
[useAuth] Fetching profile for user: abc-123
[useAuth] Profile fetched successfully: { userId: "abc-123", profileId: "def-456", role: "admin", email: "admin@example.com" }
[useAuth] Initial load complete
[Admin] Auth loaded, checking admin access: { hasUser: true, userId: "abc-123", userEmail: "admin@example.com", hasProfile: true, profileRole: "admin", isAdmin: true }
[Admin] Access granted - fetching admin data
```

### ❌ Access Denied - Not Admin

```
[useAuth] Checking for existing session...
[useAuth] Existing session check: { hasSession: true, userId: "abc-123", email: "user@example.com" }
[useAuth] Fetching profile for user: abc-123
[useAuth] Profile fetched successfully: { userId: "abc-123", profileId: "def-456", role: "user", email: "user@example.com" }
[useAuth] Initial load complete
[Admin] Auth loaded, checking admin access: { hasUser: true, userId: "abc-123", userEmail: "user@example.com", hasProfile: true, profileRole: "user", isAdmin: false }
[Admin] Access denied - not admin role: { currentRole: "user" }
```

### ❌ Profile Not Found

```
[useAuth] Checking for existing session...
[useAuth] Existing session check: { hasSession: true, userId: "abc-123", email: "user@example.com" }
[useAuth] Fetching profile for user: abc-123
[useAuth] Profile not found for user: abc-123
[useAuth] Initial load complete
[Admin] Auth loaded, checking admin access: { hasUser: true, userId: "abc-123", userEmail: "user@example.com", hasProfile: false, profileRole: undefined, isAdmin: false }
[Admin] Access denied - profile not loaded
```

---

## 🚀 Quick Recovery Steps

**If /admin is not working, follow this sequence:**

1. **Open browser console** (F12)
2. **Go to /admin** and observe logs
3. **Identify the error** from logs or error page
4. **Fix in database:**
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';
   ```
5. **Sign out completely**
6. **Sign in again**
7. **Try /admin again**
8. **Check console logs** to verify success

---

## 📞 Still Having Issues?

If you've followed all steps and still have problems:

1. **Check browser console** for unexpected errors
2. **Run full SQL diagnostic script**
3. **Verify environment variables** are correct (.env.local)
4. **Try incognito/private browsing** to rule out cache issues
5. **Check Supabase dashboard** for auth user and profile data
6. **Review RLS policies** to ensure they allow profile access

---

**Created:** October 8, 2025 **Last Updated:** October 8, 2025
