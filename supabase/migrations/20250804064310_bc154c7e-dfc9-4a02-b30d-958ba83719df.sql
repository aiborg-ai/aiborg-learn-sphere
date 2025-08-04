-- Add display column to courses table
ALTER TABLE public.courses 
ADD COLUMN display boolean NOT NULL DEFAULT true;

-- Update RLS policies to filter by display column for courses
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view active courses" ON public.courses;

CREATE POLICY "Anyone can view active and displayed courses" 
ON public.courses 
FOR SELECT 
USING (is_active = true AND display = true);