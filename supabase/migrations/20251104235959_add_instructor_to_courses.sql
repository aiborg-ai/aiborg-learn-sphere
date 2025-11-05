-- Add instructor_id to courses table
-- Migration: 20251104235959_add_instructor_to_courses.sql
-- Description: Add instructor relationship to courses for session management

-- Add instructor_id column to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES auth.users(id);

-- Create index for instructor lookups
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);

-- Update RLS policies to allow instructors to manage their courses
CREATE POLICY "Instructors can view their courses"
ON public.courses
FOR SELECT
TO authenticated
USING (instructor_id = auth.uid() OR is_active = true);

CREATE POLICY "Instructors can update their courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- Add comment for documentation
COMMENT ON COLUMN public.courses.instructor_id IS 'The instructor who manages this course';
