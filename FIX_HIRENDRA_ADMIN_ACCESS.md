# 🚨 FIX ADMIN ACCESS FOR hirendra@gmail.com

## Problem Identified

Your profile has `role = 'admin'` in the database ✅, but you still can't access `/admin` ❌

**Root Cause:** `profile.user_id` doesn't match your actual `auth.users.id`

This means the frontend can't find your profile when you sign in, even though it exists!

---

## ⚡ Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql

---

### Step 2: Run Diagnostic Query

Copy and paste this into the SQL editor:

```sql
-- Diagnose the issue
SELECT
  'DIAGNOSIS' as check_type,
  (SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com') as correct_auth_user_id,
  (SELECT user_id FROM profiles WHERE email = 'hirendra@gmail.com') as current_profile_user_id,
  (SELECT role FROM profiles WHERE email = 'hirendra@gmail.com') as role,
  CASE
    WHEN (SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com') =
         (SELECT user_id FROM profiles WHERE email = 'hirendra@gmail.com')
    THEN '✅ LINKED CORRECTLY - Issue is elsewhere'
    ELSE '❌ MISMATCH FOUND - Run the fix below'
  END as diagnosis;
```

Click **RUN**

**Expected Output:**

- diagnosis = `❌ MISMATCH FOUND - Run the fix below`

This confirms the problem!

---

### Step 3: Run the Fix

Copy and paste this into the SQL editor:

```sql
-- FIX: Update profile.user_id to match auth user
UPDATE profiles
SET
  user_id = (SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com'),
  updated_at = now()
WHERE email = 'hirendra@gmail.com';
```

Click **RUN**

**Expected Output:** `UPDATE 1`

---

### Step 4: Verify the Fix

Copy and paste this into the SQL editor:

```sql
-- Verify the fix worked
SELECT
  'VERIFICATION' as status,
  p.email,
  p.user_id as profile_user_id,
  au.id as auth_user_id,
  p.role,
  CASE
    WHEN p.user_id = au.id THEN '✅ FIXED SUCCESSFULLY'
    ELSE '❌ STILL MISMATCHED'
  END as fix_status
FROM profiles p
JOIN auth.users au ON au.email = p.email
WHERE p.email = 'hirendra@gmail.com';
```

Click **RUN**

**Expected Output:**

- fix_status = `✅ FIXED SUCCESSFULLY`
- role = `admin`
- profile_user_id = auth_user_id (same UUID)

---

### Step 5: Refresh Your Session

**CRITICAL:** You must sign out and sign in again to refresh your session!

1. Go to http://localhost:8080
2. Click your name in top-right navbar
3. Click **"Sign Out"**
4. Close the browser tab
5. Open a new tab
6. Go to http://localhost:8080/auth
7. Sign in with `hirendra@gmail.com`
8. Wait for sign-in to complete

---

### Step 6: Test /admin Access

1. Go to http://localhost:8080/admin
2. **SUCCESS!** You should now see the admin dashboard! 🎉

---

## 📊 What to Check

### Browser Console (F12)

You should now see these logs:

```
[useAuth] Checking for existing session...
[useAuth] Fetching profile for user: [your-uuid]
[useAuth] Profile fetched successfully: { role: "admin", ... }
[Admin] Auth loaded, checking admin access: { isAdmin: true }
[Admin] Access granted - fetching admin data
```

### If Still Not Working

1. **Check browser console for errors**
   - Open DevTools (F12)
   - Look for any red errors
   - Look for `[useAuth]` and `[Admin]` logs

2. **Verify you're signed in as hirendra@gmail.com**
   - Top-right navbar should show your email
   - Not signed in as a different account

3. **Clear browser cache**
   - Press Ctrl+Shift+R (hard refresh)
   - Or clear browser storage in DevTools

4. **Try incognito/private browsing**
   - This eliminates cache issues
   - Sign in fresh and test

---

## 🔍 Additional Diagnostics (If Needed)

If the quick fix didn't work, run these comprehensive scripts:

### Full Diagnostic

Open and run: `/home/vik/aiborg_CC/aiborg-learn-sphere/DIAGNOSE_ADMIN_ISSUE.sql`

This script runs 8 comprehensive checks to identify any database issues.

### Full Fix Script

Open and run: `/home/vik/aiborg_CC/aiborg-learn-sphere/FIX_USER_ID_MISMATCH.sql`

This script includes:

- Backup creation
- Comprehensive fix
- Verification
- Rollback capability

---

## 📚 Reference Documentation

- **DIAGNOSE_ADMIN_ISSUE.sql** - Comprehensive diagnostic queries
- **FIX_USER_ID_MISMATCH.sql** - Full fix script with backup/rollback
- **ADMIN_PAGE_FIX_GUIDE.md** - Complete troubleshooting guide
- **FIX_ADMIN_ACCESS.sql** - General admin access fixes

---

## 🎯 Summary

**The Problem:**

```
auth.users.id = "uuid-A" (your current auth account)
profile.user_id = "uuid-B" (wrong, points to old/different account)
Result: Profile not found → Access denied
```

**The Fix:**

```
UPDATE profiles SET user_id = "uuid-A"
Result: Profile found → role='admin' → Access granted ✅
```

**After the fix:**

- Profile is linked to correct auth user
- Frontend can find your profile
- Role is recognized as 'admin'
- /admin access works!

---

**Created:** October 8, 2025 **For:** hirendra@gmail.com admin access issue
