-- Create session_attendance table for detailed attendance tracking
-- Migration: 20251105000002_create_session_attendance.sql
-- Description: Comprehensive attendance records with instructor notes and participation tracking

CREATE TABLE IF NOT EXISTS public.session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.session_tickets(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  participation_score INTEGER CHECK (participation_score >= 0 AND participation_score <= 100),
  instructor_notes TEXT,
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_attendance_session_id ON public.session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_user_id ON public.session_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_status ON public.session_attendance(status);
CREATE INDEX IF NOT EXISTS idx_session_attendance_user_status ON public.session_attendance(user_id, status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_session_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_attendance_updated_at
BEFORE UPDATE ON public.session_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_session_attendance_updated_at();

-- Trigger to update session attendance count
CREATE OR REPLACE FUNCTION public.update_session_attendance_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'present' THEN
    UPDATE public.course_sessions
    SET current_attendance = current_attendance + 1
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'present' AND NEW.status = 'present' THEN
      UPDATE public.course_sessions
      SET current_attendance = current_attendance + 1
      WHERE id = NEW.session_id;
    ELSIF OLD.status = 'present' AND NEW.status != 'present' THEN
      UPDATE public.course_sessions
      SET current_attendance = GREATEST(0, current_attendance - 1)
      WHERE id = NEW.session_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'present' THEN
    UPDATE public.course_sessions
    SET current_attendance = GREATEST(0, current_attendance - 1)
    WHERE id = OLD.session_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attendance_count
AFTER INSERT OR UPDATE OR DELETE ON public.session_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_session_attendance_count();

-- Trigger to update ticket status when attendance is marked
CREATE OR REPLACE FUNCTION public.sync_ticket_status_with_attendance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.session_tickets
    SET
      status = CASE
        WHEN NEW.status IN ('present', 'late') THEN 'attended'
        WHEN NEW.status = 'absent' THEN 'missed'
        ELSE status
      END,
      checked_in_at = CASE
        WHEN NEW.status IN ('present', 'late') AND checked_in_at IS NULL THEN NEW.check_in_time
        ELSE checked_in_at
      END,
      check_in_method = CASE
        WHEN NEW.status IN ('present', 'late') AND check_in_method IS NULL THEN 'instructor'
        ELSE check_in_method
      END,
      checked_in_by = CASE
        WHEN NEW.status IN ('present', 'late') AND checked_in_by IS NULL THEN NEW.marked_by
        ELSE checked_in_by
      END
    WHERE session_id = NEW.session_id
      AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_ticket_status
AFTER INSERT OR UPDATE ON public.session_attendance
FOR EACH ROW
EXECUTE FUNCTION public.sync_ticket_status_with_attendance();

-- Enable Row Level Security
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own attendance
CREATE POLICY "Users can view own attendance"
ON public.session_attendance
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policy: Instructors can view attendance for their sessions
CREATE POLICY "Instructors can view session attendance"
ON public.session_attendance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.course_sessions cs
    JOIN public.courses c ON c.id = cs.course_id
    WHERE cs.id = session_attendance.session_id
    AND c.instructor_id = auth.uid()
  )
);

-- RLS Policy: Instructors can mark attendance for their sessions
CREATE POLICY "Instructors can mark attendance"
ON public.session_attendance
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.course_sessions cs
    JOIN public.courses c ON c.id = cs.course_id
    WHERE cs.id = session_attendance.session_id
    AND c.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.course_sessions cs
    JOIN public.courses c ON c.id = cs.course_id
    WHERE cs.id = session_attendance.session_id
    AND c.instructor_id = auth.uid()
  )
);

-- RLS Policy: Admins can manage all attendance
CREATE POLICY "Admins can manage all attendance"
ON public.session_attendance
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Helper function: Get session attendance list
CREATE OR REPLACE FUNCTION public.get_session_attendance_list(p_session_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  ticket_number VARCHAR,
  status VARCHAR,
  check_in_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  participation_score INTEGER,
  instructor_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    COALESCE(p.full_name, u.email) as user_name,
    u.email as user_email,
    st.ticket_number,
    COALESCE(sa.status::VARCHAR, 'not_marked'::VARCHAR) as status,
    sa.check_in_time,
    sa.duration_minutes,
    sa.participation_score,
    sa.instructor_notes
  FROM auth.users u
  JOIN public.session_tickets st ON st.user_id = u.id
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.session_attendance sa ON sa.user_id = u.id AND sa.session_id = p_session_id
  WHERE st.session_id = p_session_id
  ORDER BY user_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get course attendance report
CREATE OR REPLACE FUNCTION public.get_course_attendance_report(p_course_id INTEGER)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  total_sessions BIGINT,
  attended BIGINT,
  missed BIGINT,
  excused BIGINT,
  late BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    COALESCE(p.full_name, u.email) as user_name,
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(sa.id) FILTER (WHERE sa.status = 'present') as attended,
    COUNT(sa.id) FILTER (WHERE sa.status = 'absent') as missed,
    COUNT(sa.id) FILTER (WHERE sa.status = 'excused') as excused,
    COUNT(sa.id) FILTER (WHERE sa.status = 'late') as late,
    ROUND(
      (COUNT(sa.id) FILTER (WHERE sa.status IN ('present', 'late'))::NUMERIC /
       NULLIF(COUNT(DISTINCT cs.id) FILTER (WHERE cs.session_date < CURRENT_DATE), 0)) * 100,
      2
    ) as attendance_rate
  FROM auth.users u
  JOIN public.enrollments e ON e.user_id = u.id AND e.course_id = p_course_id
  LEFT JOIN public.profiles p ON p.id = u.id
  CROSS JOIN public.course_sessions cs
  LEFT JOIN public.session_attendance sa ON sa.user_id = u.id AND sa.session_id = cs.id
  WHERE cs.course_id = p_course_id
    AND cs.status IN ('completed', 'in_progress')
  GROUP BY u.id, u.email, p.full_name
  ORDER BY user_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Mark session missed for no-shows
CREATE OR REPLACE FUNCTION public.mark_missed_sessions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark tickets as 'missed' for past sessions where user didn't check in
  WITH updated AS (
    UPDATE public.session_tickets st
    SET status = 'missed'
    FROM public.course_sessions cs
    WHERE st.session_id = cs.id
      AND st.status = 'active'
      AND cs.session_date < CURRENT_DATE
      AND cs.status = 'completed'
    RETURNING st.id
  )
  SELECT COUNT(*) INTO updated_count FROM updated;

  -- Create absent attendance records
  INSERT INTO public.session_attendance (session_id, user_id, ticket_id, status)
  SELECT
    st.session_id,
    st.user_id,
    st.id,
    'absent'
  FROM public.session_tickets st
  JOIN public.course_sessions cs ON cs.id = st.session_id
  WHERE st.status = 'missed'
    AND NOT EXISTS (
      SELECT 1 FROM public.session_attendance sa
      WHERE sa.session_id = st.session_id
      AND sa.user_id = st.user_id
    )
  ON CONFLICT (session_id, user_id) DO NOTHING;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.session_attendance IS 'Detailed attendance records for course sessions';
COMMENT ON COLUMN public.session_attendance.status IS 'Attendance status: present (on time), late (checked in late), absent (no show), excused (approved absence)';
COMMENT ON COLUMN public.session_attendance.participation_score IS 'Optional participation score (0-100) assigned by instructor';
COMMENT ON COLUMN public.session_attendance.duration_minutes IS 'How long the student attended (calculated from check-in/check-out)';
COMMENT ON FUNCTION public.mark_missed_sessions() IS 'Scheduled function to mark no-shows as missed (run daily)';
