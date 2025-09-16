-- Migration to support multiple audiences per course
-- Creates a junction table for many-to-many relationship between courses and audiences

-- Step 1: Create the junction table for course audiences
CREATE TABLE public.course_audiences (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('Young Learners', 'Teenagers', 'Professionals', 'SMEs')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, audience)
);

-- Step 2: Add indexes for performance
CREATE INDEX idx_course_audiences_course_id ON public.course_audiences(course_id);
CREATE INDEX idx_course_audiences_audience ON public.course_audiences(audience);

-- Step 3: Enable Row Level Security
ALTER TABLE public.course_audiences ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for course_audiences
-- Allow everyone to read course audiences (public data)
CREATE POLICY "Anyone can view course audiences"
ON public.course_audiences
FOR SELECT
USING (true);

-- Allow admins to manage course audiences (for development, later update with proper admin roles)
CREATE POLICY "Allow all operations for development"
ON public.course_audiences
FOR ALL
USING (true);

-- Step 5: Migrate existing data from courses.audience to course_audiences
INSERT INTO public.course_audiences (course_id, audience)
SELECT id, audience FROM public.courses
WHERE audience IS NOT NULL;

-- Step 6: Add a column to track if migration is complete (temporary, can be removed later)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS audiences_migrated BOOLEAN DEFAULT false;

-- Mark all existing courses as migrated
UPDATE public.courses SET audiences_migrated = true;

-- Step 7: Create a function to get audiences for a course (for easier querying)
CREATE OR REPLACE FUNCTION public.get_course_audiences(p_course_id INTEGER)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT audience
    FROM public.course_audiences
    WHERE course_id = p_course_id
    ORDER BY audience
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 8: Create a view for courses with their audiences array
CREATE OR REPLACE VIEW public.courses_with_audiences AS
SELECT
  c.*,
  COALESCE(
    ARRAY_AGG(ca.audience ORDER BY ca.audience) FILTER (WHERE ca.audience IS NOT NULL),
    ARRAY[]::TEXT[]
  ) AS audiences
FROM public.courses c
LEFT JOIN public.course_audiences ca ON c.id = ca.course_id
GROUP BY c.id;

-- Grant permissions on the view
GRANT SELECT ON public.courses_with_audiences TO anon, authenticated;

-- Step 9: Create helper functions for managing course audiences

-- Function to set audiences for a course (replaces all existing)
CREATE OR REPLACE FUNCTION public.set_course_audiences(
  p_course_id INTEGER,
  p_audiences TEXT[]
)
RETURNS VOID AS $$
BEGIN
  -- Delete existing audiences
  DELETE FROM public.course_audiences WHERE course_id = p_course_id;

  -- Insert new audiences
  IF p_audiences IS NOT NULL AND array_length(p_audiences, 1) > 0 THEN
    INSERT INTO public.course_audiences (course_id, audience)
    SELECT p_course_id, unnest(p_audiences);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add a single audience to a course
CREATE OR REPLACE FUNCTION public.add_course_audience(
  p_course_id INTEGER,
  p_audience TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.course_audiences (course_id, audience)
  VALUES (p_course_id, p_audience)
  ON CONFLICT (course_id, audience) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a single audience from a course
CREATE OR REPLACE FUNCTION public.remove_course_audience(
  p_course_id INTEGER,
  p_audience TEXT
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.course_audiences
  WHERE course_id = p_course_id AND audience = p_audience;
END;
$$ LANGUAGE plpgsql;

-- Note: The old 'audience' column in courses table will be kept for now for backward compatibility
-- It can be dropped in a future migration once all code is updated
-- To drop it later, use: ALTER TABLE public.courses DROP COLUMN audience;

-- Add comment to document the migration
COMMENT ON TABLE public.course_audiences IS 'Junction table for many-to-many relationship between courses and audiences';
COMMENT ON COLUMN public.course_audiences.course_id IS 'Foreign key to courses table';
COMMENT ON COLUMN public.course_audiences.audience IS 'Audience type: Young Learners, Teenagers, Professionals, or SMEs';