# Fix: Course Update Stuck on "Saving..."

## Problem

The "Update Course" button shows "Saving..." indefinitely and never completes. The update appears to
hang.

### Root Cause

The code tries to update **TWO tables** when saving a course:

1. **`courses` table** - Main course data ✅ (Fixed with previous migration)
2. **`course_audiences` table** - Multiple audiences per course ❌ (STILL BROKEN)

The code flow (from `CourseManagementEnhanced.tsx:144-158`):

```typescript
// Update existing course
await supabase.from('courses').update(courseData).eq('id', editingCourse.id); // ✅ Works now

// Update course_audiences table
await supabase.from('course_audiences').delete().eq('course_id', editingCourse.id); // ❌ HANGS HERE

// Insert new audiences
await supabase.from('course_audiences').insert(audienceRecords); // ❌ OR HERE
```

The `course_audiences` table **also has RLS policy issues**:

- Either missing `WITH CHECK` clauses on INSERT/UPDATE
- Or has overly restrictive policies
- Or the admin check is failing

This causes the DELETE and/or INSERT operations to hang or fail silently, which makes the entire
update operation appear stuck.

---

## Solution

Apply the second migration: `20251105_fix_course_audiences_policies.sql`

This migration:

1. Drops all existing policies on `course_audiences`
2. Creates new policies with proper USING and WITH CHECK clauses:
   - **SELECT**: Anyone can view (public data)
   - **INSERT**: Admins only (with WITH CHECK)
   - **UPDATE**: Admins only (with both USING and WITH CHECK)
   - **DELETE**: Admins only (with USING)

---

## How to Apply

### Step 1: Run the Migration in Supabase

**Go to Supabase Dashboard → SQL Editor** and run:

```sql
-- Fix course_audiences RLS policies
-- The table likely has restrictive policies that are blocking DELETE/INSERT operations

-- Drop all existing policies on course_audiences
DROP POLICY IF EXISTS "Anyone can view course audiences" ON public.course_audiences;
DROP POLICY IF EXISTS "Allow all operations for development" ON public.course_audiences;
DROP POLICY IF EXISTS "Admins can manage course audiences" ON public.course_audiences;
DROP POLICY IF EXISTS "Admins can insert course audiences" ON public.course_audiences;
DROP POLICY IF EXISTS "Admins can update course audiences" ON public.course_audiences;
DROP POLICY IF EXISTS "Admins can delete course audiences" ON public.course_audiences;

-- Create proper policies with both USING and WITH CHECK clauses

-- 1. SELECT policy: Anyone can view (public data)
CREATE POLICY "Anyone can view course audiences"
ON public.course_audiences
FOR SELECT
USING (true);

-- 2. INSERT policy: Only admins can add audiences
CREATE POLICY "Admins can insert course audiences"
ON public.course_audiences
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

-- 3. UPDATE policy: Only admins can update audiences (though rarely used)
CREATE POLICY "Admins can update course audiences"
ON public.course_audiences
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

-- 4. DELETE policy: Only admins can delete audiences
CREATE POLICY "Admins can delete course audiences"
ON public.course_audiences
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);
```

### Step 2: Verify

Run this to confirm the policies are correct:

```sql
SELECT
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN '✓ USING' ELSE '✗ USING' END as has_using,
  CASE WHEN with_check IS NOT NULL THEN '✓ WITH CHECK' ELSE '✗ WITH CHECK' END as has_with_check
FROM pg_policies
WHERE tablename = 'course_audiences'
ORDER BY cmd, policyname;
```

**Expected Result:**

```
policyname                             | cmd    | has_using  | has_with_check
---------------------------------------+--------+------------+---------------
Anyone can view course audiences       | SELECT | ✓ USING    | ✗ WITH CHECK  (normal)
Admins can delete course audiences     | DELETE | ✓ USING    | ✗ WITH CHECK  (normal)
Admins can insert course audiences     | INSERT | ✗ USING    | ✓ WITH CHECK  (normal)
Admins can update course audiences     | UPDATE | ✓ USING    | ✓ WITH CHECK  ← BOTH!
```

### Step 3: Test Again

1. **Refresh** the admin page (F5)
2. **Click Edit** on a course
3. **Make a change** (e.g., add an audience or modify title)
4. **Click "Update Course"**

**Expected:**

- ✅ "Saving..." appears briefly (1-2 seconds)
- ✅ Green toast: "Course updated successfully"
- ✅ Dialog closes
- ✅ Changes are saved

**If it still hangs:**

- Check browser console (F12) for errors
- Look for specific RLS policy violation messages
- Verify your user is admin: `SELECT role FROM profiles WHERE user_id = auth.uid()`

---

## Why Two Tables?

The `course_audiences` table was added in migration `20250117_multi_audience_support.sql` to support
**multiple audiences per course**.

Before:

- Course has ONE audience (e.g., "Professionals")

After:

- Course has MULTIPLE audiences (e.g., ["Teenagers", "SMEs"])

The UI shows this as badges under "Target Audiences" in your screenshot.

---

## Technical Details

### The Hanging Code (Line 144-158)

```typescript
if (editingCourse?.id) {
  // 1. Update main course data ✅ Fixed
  await supabase.from('courses').update(courseData).eq('id', editingCourse.id);

  // 2. Delete old audiences ❌ HANGS if DELETE policy broken
  await supabase.from('course_audiences').delete().eq('course_id', editingCourse.id);

  // 3. Insert new audiences ❌ HANGS if INSERT policy broken
  if (formAudiences.length > 0) {
    await supabase.from('course_audiences').insert(audienceRecords);
  }
}
```

Without proper RLS policies, steps 2 and 3 will:

1. **Timeout** (60 seconds default)
2. **Throw an error** (caught by try/catch, shows "Failed to update course")
3. Or **hang indefinitely** (if no timeout configured)

---

## Checklist

- [x] First migration applied: `20251105_fix_course_update_policy.sql` ✅
- [ ] Second migration applied: `20251105_fix_course_audiences_policies.sql` ⏳ **DO THIS NOW**
- [ ] Policies verified with SELECT query
- [ ] Test course update - no more "Saving..." hang
- [ ] Test adding/removing audiences
- [ ] Browser console clean (no RLS errors)

---

## Files

1. **Migration**: `supabase/migrations/20251105_fix_course_audiences_policies.sql`
2. **Documentation**: This file (`FIX_COURSE_AUDIENCES_HANGING.md`)

---

## Prevention

In the future, when creating junction tables:

1. **Always create RLS policies immediately**
2. **Test DELETE and INSERT operations** (not just SELECT)
3. **Include WITH CHECK clauses** for INSERT/UPDATE
4. **Verify admin checks work** with actual admin users

---

**Status**: Ready to apply. Run the SQL above and test again!
