# Fix: Course Update Not Saving in Admin Panel

## Problem Identified

The "Update Course" button in the admin panel is not saving changes because of a **missing
`WITH CHECK` clause** in the Row Level Security (RLS) policy for course updates.

### Root Cause

In PostgreSQL RLS policies:

- `USING` clause: Controls which rows can be **selected/read** for the operation
- `WITH CHECK` clause: Controls which rows can be **modified** (for INSERT/UPDATE)

The current policy at
`supabase/migrations/20250802214609_9c7d830e-4f18-4d9f-b906-a9cc101aab3f.sql:110-117` only has
`USING` but **no `WITH CHECK`** clause:

```sql
-- BROKEN POLICY (missing WITH CHECK)
CREATE POLICY "Admins can update courses"
ON public.courses
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);  -- ❌ Missing WITH CHECK clause
```

This causes UPDATE operations to **silently fail** because PostgreSQL can't verify if the new row
data passes the policy check.

---

## Solution

Run the migration file I created: `20251105_fix_course_update_policy.sql`

### Step 1: Run the Fix in Supabase

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of the migration file:

```sql
-- Fix the course update RLS policy
-- The issue is that the UPDATE policy is missing WITH CHECK clause
-- which is needed for UPDATE operations to succeed

-- Drop the existing faulty policy
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;

-- Recreate the policy with both USING and WITH CHECK clauses
CREATE POLICY "Admins can update courses"
ON public.courses
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);
```

4. Click **Run**
5. You should see: "Success. No rows returned"

**Option B: Via Supabase CLI**

```bash
cd aiborg-learn-sphere
npx supabase db push --file supabase/migrations/20251105_fix_course_update_policy.sql
```

---

### Step 2: Verify the Fix

Run this query in the SQL Editor to verify the policy is correct:

```sql
SELECT
  policyname,
  tablename,
  cmd,
  qual,        -- USING clause
  with_check   -- WITH CHECK clause (should NOT be NULL)
FROM pg_policies
WHERE tablename = 'courses'
  AND policyname = 'Admins can update courses';
```

You should see:

- `policyname`: "Admins can update courses"
- `cmd`: "UPDATE"
- `qual`: (auth.uid() IN ( SELECT profiles.user_id...))
- `with_check`: (auth.uid() IN ( SELECT profiles.user_id...)) ✅ **NOT NULL**

---

### Step 3: Test the Fix

1. Log in as an admin user
2. Go to Admin panel → Course Management
3. Click **Edit** on any course
4. Make a change (e.g., update the title)
5. Click **"Update Course"**
6. **Expected Result**:
   - ✅ Toast notification: "Course updated successfully"
   - ✅ Changes are saved in the database
   - ✅ Course list refreshes with updated data

---

## Why This Happened

The RLS policy was created in migration `20250802214609_9c7d830e-4f18-4d9f-b906-a9cc101aab3f.sql`
but only included the `USING` clause.

For `UPDATE` operations in PostgreSQL:

- `USING` checks if the **existing row** matches (can we select it?)
- `WITH CHECK` validates the **new row data** (can we save these changes?)

Without `WITH CHECK`, PostgreSQL rejects the UPDATE because it can't verify the new data complies
with the policy.

---

## Related Code

### Frontend (Working Correctly)

- `src/components/admin/CourseManagementEnhanced.tsx:135-142` ✅
  - The `onSubmit` function correctly calls Supabase update
  - Error handling is in place
  - The issue is **not in the frontend code**

### Database (Fixed)

- `supabase/migrations/20251105_fix_course_update_policy.sql` ✅
  - New migration with correct policy

### Previous Migrations (Reference)

- `20250802214609_9c7d830e-4f18-4d9f-b906-a9cc101aab3f.sql:110-117` ❌ (broken)
- `20250802075707_3635c0b0-30ad-4804-b8a9-3b83243ae185.sql:66-74` (also broken)
- `20250722004531-79063dbd-61eb-4af9-a9f6-f8168d3c704f.sql:15-16` (also broken)

---

## Prevention

To prevent this in the future, **always include both clauses** for UPDATE and INSERT policies:

```sql
-- ✅ CORRECT PATTERN
CREATE POLICY "Policy name"
ON table_name
FOR UPDATE
USING (condition)      -- Can we select the row?
WITH CHECK (condition); -- Can we save the new data?
```

---

## Additional Notes

- The INSERT and DELETE policies are working correctly
- The SELECT policy ("Anyone can view active courses") is fine
- Only the UPDATE policy was broken
- **No data loss** - all updates were simply rejected, not corrupted
- After applying the fix, all pending updates will work immediately

---

## Status

- ✅ Issue identified: Missing `WITH CHECK` clause in UPDATE policy
- ✅ Migration file created: `20251105_fix_course_update_policy.sql`
- ⏳ **Action Required**: Run the migration in Supabase
- ⏳ **Next Step**: Test course updates in admin panel

---

**Need Help?**

If the issue persists after running the migration:

1. Check browser console for errors (F12 → Console)
2. Verify your user has `role = 'admin'` in the `profiles` table
3. Check Supabase logs for RLS policy violations
4. Ensure the migration ran successfully (check migration history)
