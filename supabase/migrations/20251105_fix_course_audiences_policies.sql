-- Fix course_audiences RLS policies
-- The table likely has restrictive policies that are blocking DELETE/INSERT operations
-- This is causing the "Saving..." to hang when updating courses

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

-- Verify the policies
SELECT
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN '✓' ELSE '✗' END as has_using,
  CASE WHEN with_check IS NOT NULL THEN '✓' ELSE '✗' END as has_with_check
FROM pg_policies
WHERE tablename = 'course_audiences'
ORDER BY cmd, policyname;
