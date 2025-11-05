-- Create course_sessions table for tracking scheduled course meetings
-- Migration: 20251105000000_create_course_sessions.sql
-- Description: Adds course session scheduling with support for recurring and ad-hoc sessions

CREATE TABLE IF NOT EXISTS public.course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title VARCHAR(200),
  description TEXT,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('scheduled', 'extra', 'makeup')) DEFAULT 'scheduled',
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  meeting_url TEXT,
  instructor_notes TEXT,
  max_capacity INTEGER,
  current_attendance INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  check_in_enabled BOOLEAN DEFAULT false,
  check_in_window_start TIMESTAMPTZ,
  check_in_window_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, session_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_sessions_course_id ON public.course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_date ON public.course_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_course_sessions_status ON public.course_sessions(status);
CREATE INDEX IF NOT EXISTS idx_course_sessions_date_status ON public.course_sessions(session_date, status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_course_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_sessions_updated_at
BEFORE UPDATE ON public.course_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_course_sessions_updated_at();

-- Enable Row Level Security
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view scheduled sessions for active courses
CREATE POLICY "Public can view scheduled sessions"
ON public.course_sessions
FOR SELECT
TO public
USING (
  status IN ('scheduled', 'in_progress', 'completed')
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_sessions.course_id
    AND c.is_active = true
  )
);

-- RLS Policy: Authenticated users can view all non-draft sessions
CREATE POLICY "Authenticated users can view sessions"
ON public.course_sessions
FOR SELECT
TO authenticated
USING (status != 'draft');

-- RLS Policy: Instructors can manage sessions for their courses
CREATE POLICY "Instructors can manage course sessions"
ON public.course_sessions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_sessions.course_id
    AND c.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_sessions.course_id
    AND c.instructor_id = auth.uid()
  )
);

-- RLS Policy: Admins can manage all sessions
CREATE POLICY "Admins can manage all sessions"
ON public.course_sessions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Create helper function to get upcoming sessions for a course
CREATE OR REPLACE FUNCTION public.get_upcoming_course_sessions(p_course_id INTEGER, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  course_id INTEGER,
  session_number INTEGER,
  title VARCHAR,
  session_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  meeting_url TEXT,
  status VARCHAR,
  current_attendance INTEGER,
  max_capacity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.course_id,
    cs.session_number,
    cs.title,
    cs.session_date,
    cs.start_time,
    cs.end_time,
    cs.location,
    cs.meeting_url,
    cs.status,
    cs.current_attendance,
    cs.max_capacity
  FROM public.course_sessions cs
  WHERE cs.course_id = p_course_id
    AND cs.session_date >= CURRENT_DATE
    AND cs.status IN ('scheduled', 'in_progress')
  ORDER BY cs.session_date ASC, cs.start_time ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get session statistics for a course
CREATE OR REPLACE FUNCTION public.get_course_session_stats(p_course_id INTEGER)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  upcoming_sessions BIGINT,
  cancelled_sessions BIGINT,
  avg_attendance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
    COUNT(*) FILTER (WHERE status = 'scheduled' AND session_date >= CURRENT_DATE) as upcoming_sessions,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_sessions,
    ROUND(AVG(current_attendance), 2) as avg_attendance
  FROM public.course_sessions
  WHERE course_id = p_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TABLE public.course_sessions IS 'Stores scheduled course sessions/meetings with attendance tracking';
COMMENT ON COLUMN public.course_sessions.session_type IS 'Type of session: scheduled (regular), extra (additional), makeup (rescheduled)';
COMMENT ON COLUMN public.course_sessions.check_in_enabled IS 'Whether students can check in to this session';
COMMENT ON COLUMN public.course_sessions.check_in_window_start IS 'When check-in opens (e.g., 15 min before session)';
COMMENT ON COLUMN public.course_sessions.check_in_window_end IS 'When check-in closes (e.g., 30 min after start)';
