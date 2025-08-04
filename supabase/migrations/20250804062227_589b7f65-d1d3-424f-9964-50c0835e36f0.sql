-- Add currently_enrolling column to courses table
ALTER TABLE public.courses 
ADD COLUMN currently_enrolling boolean NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.courses.currently_enrolling IS 'Indicates if the course is currently accepting enrollments';