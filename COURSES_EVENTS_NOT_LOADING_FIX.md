# Fix: Courses and Events Not Loading When Logged In

## Problem
When you log into the application, courses and events don't load or display. This is likely caused by Row Level Security (RLS) policies in Supabase that are either:
1. Too restrictive for authenticated users
2. Missing for public access
3. Conflicting with each other

## Quick Fix (5 minutes)

### Step 1: Run Diagnostic Script
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of: `DIAGNOSE_DATA_LOADING_ISSUE.sql`
4. Click **Run**
5. Review the results to identify the issue

### Step 2: Apply the Fix
1. In **Supabase Dashboard** → **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of: `FIX_COURSES_EVENTS_RLS.sql`
4. Click **Run**
5. Wait for completion (should see "Success")

### Step 3: Verify the Fix
1. Log out of your application
2. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
3. Log back in with `hirendra@gmail.com`
4. Check if courses and events now load

## What the Fix Does

### Before (Problematic State)
- RLS policies may have been created with `TO authenticated` only
- This blocks **anonymous (not logged in)** users from viewing data
- Or policies may block **authenticated (logged in)** users unexpectedly
- Conflicting policies can cause data to not load

### After (Fixed State)
- Policies use `TO public` which includes BOTH:
  - Anonymous users (not logged in)
  - Authenticated users (logged in)
- Separate admin policies for full data management
- Clear, non-conflicting policies

## What Gets Fixed

### Courses Table
```sql
-- Old (may be missing or too restrictive):
CREATE POLICY "..." ON courses FOR SELECT TO authenticated USING (...);

-- New (works for everyone):
CREATE POLICY "Everyone can view active and displayed courses"
ON courses FOR SELECT TO public
USING (is_active = true AND display = true);
```

### Events Table
```sql
-- Old (may be missing or too restrictive):
CREATE POLICY "..." ON events FOR SELECT TO authenticated USING (...);

-- New (works for everyone):
CREATE POLICY "Everyone can view active and visible events"
ON events FOR SELECT TO public
USING (is_active = true AND is_visible = true);
```

## Common Causes of This Issue

1. **RLS Enabled Without Public Policy**
   - RLS is enabled on tables
   - But only admin policies exist
   - No policy allows public/authenticated users to SELECT

2. **Conflicting Policies**
   - Multiple policies with different rules
   - One policy allows access, another denies it
   - PostgreSQL RLS uses AND logic (all must pass)

3. **Missing Grant Permissions**
   - Even with policies, tables need GRANT SELECT
   - Fix script includes: `GRANT SELECT ON courses TO anon, authenticated;`

4. **Incorrect Role Targeting**
   - Policy says `TO authenticated` but doesn't work as expected
   - Better to use `TO public` for read-only data

## Verification Steps

After running the fix, verify with this SQL:

```sql
-- Check policies exist
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('courses', 'events')
  AND schemaname = 'public';

-- Should return courses
SELECT COUNT(*) FROM courses WHERE is_active = true;

-- Should return events
SELECT COUNT(*) FROM events WHERE is_active = true;
```

## Alternative: Check Browser Console

If data still doesn't load after the fix:

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Look for errors** like:
   - "Failed to fetch courses"
   - "403 Forbidden"
   - "row-level security policy"
4. **Share the error** for further debugging

## Files Involved

- `DIAGNOSE_DATA_LOADING_ISSUE.sql` - Diagnostic script (run this first)
- `FIX_COURSES_EVENTS_RLS.sql` - Fix script (run this second)
- `src/hooks/useCourses.ts` - Frontend hook that fetches courses
- `src/hooks/useEvents.ts` - Frontend hook that fetches events

## Expected Behavior After Fix

✅ **Logged Out**: Can view courses and events
✅ **Logged In**: Can view courses and events
✅ **Admin Logged In**: Can view AND manage courses and events

## Still Not Working?

If the issue persists after running both scripts:

### Check 1: Verify You're on the Right Database
```sql
SELECT current_database(), current_user;
```

### Check 2: Check Table Permissions
```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('courses', 'events')
  AND table_schema = 'public';
```

### Check 3: Temporarily Disable RLS (Testing Only!)
```sql
-- DO NOT USE IN PRODUCTION
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
```

If data loads after disabling RLS, the problem is definitely in the policies.

### Check 4: Check for JavaScript Errors
1. Open Browser Console (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Reload page
5. Check if requests to Supabase are failing
6. Click on failed request → Preview tab to see error

## Need More Help?

If none of the above works, provide:
1. Screenshot of DIAGNOSE script results
2. Browser console errors
3. Supabase project URL (without credentials)
4. Which user email you're testing with

## Summary

**Problem**: Courses and events don't load when logged in
**Cause**: RLS policies blocking authenticated users
**Solution**: Run `FIX_COURSES_EVENTS_RLS.sql` in Supabase SQL Editor
**Time**: 5 minutes
**Result**: Data loads for both logged in and logged out users
