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

-- Verify the policies are working
-- Run this to check:
-- SELECT * FROM pg_policies WHERE tablename = 'courses';
