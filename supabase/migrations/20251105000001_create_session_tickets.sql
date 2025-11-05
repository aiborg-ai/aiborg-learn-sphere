-- Create session_tickets table for student attendance tickets
-- Migration: 20251105000001_create_session_tickets.sql
-- Description: Digital tickets for course session attendance with QR codes and check-in tracking

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION public.generate_session_ticket_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  ticket_num TEXT;
BEGIN
  year_part := to_char(CURRENT_DATE, 'YYYY');

  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 9) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.session_tickets
  WHERE ticket_number LIKE 'STK-' || year_part || '-%';

  -- Format: STK-YYYY-NNNNNN (e.g., STK-2025-000001)
  ticket_num := 'STK-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Create session_tickets table
CREATE TABLE IF NOT EXISTS public.session_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL DEFAULT public.generate_session_ticket_number(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'attended', 'missed')) DEFAULT 'active',
  qr_code TEXT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  checked_in_at TIMESTAMPTZ,
  check_in_method VARCHAR(20) CHECK (check_in_method IN ('qr_scan', 'manual', 'instructor', 'auto')),
  checked_in_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_tickets_user_id ON public.session_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tickets_session_id ON public.session_tickets(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tickets_course_id ON public.session_tickets(course_id);
CREATE INDEX IF NOT EXISTS idx_session_tickets_status ON public.session_tickets(status);
CREATE INDEX IF NOT EXISTS idx_session_tickets_ticket_number ON public.session_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_session_tickets_user_course ON public.session_tickets(user_id, course_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_session_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_tickets_updated_at
BEFORE UPDATE ON public.session_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_session_tickets_updated_at();

-- Function to generate QR code data
CREATE OR REPLACE FUNCTION public.generate_ticket_qr_code(
  p_user_id UUID,
  p_session_id UUID,
  p_ticket_id UUID
)
RETURNS TEXT AS $$
BEGIN
  -- QR code format: QR:STK:{user_id}:{session_id}:{ticket_id}:{timestamp}
  RETURN 'QR:STK:' || p_user_id || ':' || p_session_id || ':' || p_ticket_id || ':' || EXTRACT(EPOCH FROM now())::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate QR code if not provided
CREATE OR REPLACE FUNCTION public.auto_generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := public.generate_ticket_qr_code(NEW.user_id, NEW.session_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_qr_code
BEFORE INSERT ON public.session_tickets
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_qr_code();

-- Enable Row Level Security
ALTER TABLE public.session_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.session_tickets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policy: Users can update their own tickets (for cancellation)
CREATE POLICY "Users can cancel own tickets"
ON public.session_tickets
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND status IN ('cancelled', 'active'));

-- RLS Policy: Instructors can view tickets for their course sessions
CREATE POLICY "Instructors can view session tickets"
ON public.session_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.course_sessions cs
    JOIN public.courses c ON c.id = cs.course_id
    WHERE cs.id = session_tickets.session_id
    AND c.instructor_id = auth.uid()
  )
);

-- RLS Policy: Instructors can update tickets for check-in
CREATE POLICY "Instructors can check in tickets"
ON public.session_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.course_sessions cs
    JOIN public.courses c ON c.id = cs.course_id
    WHERE cs.id = session_tickets.session_id
    AND c.instructor_id = auth.uid()
  )
);

-- RLS Policy: Admins can manage all tickets
CREATE POLICY "Admins can manage all tickets"
ON public.session_tickets
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- RLS Policy: System can insert tickets (for auto-generation)
CREATE POLICY "System can create tickets"
ON public.session_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is creating their own ticket OR user is instructor/admin
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Helper function: Get user's tickets for a course
CREATE OR REPLACE FUNCTION public.get_user_course_tickets(
  p_user_id UUID,
  p_course_id INTEGER,
  p_include_past BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  ticket_number VARCHAR,
  session_id UUID,
  session_title VARCHAR,
  session_date DATE,
  start_time TIME,
  status VARCHAR,
  qr_code TEXT,
  checked_in_at TIMESTAMPTZ,
  check_in_method VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    st.ticket_number,
    st.session_id,
    cs.title,
    cs.session_date,
    cs.start_time,
    st.status,
    st.qr_code,
    st.checked_in_at,
    st.check_in_method
  FROM public.session_tickets st
  JOIN public.course_sessions cs ON cs.id = st.session_id
  WHERE st.user_id = p_user_id
    AND st.course_id = p_course_id
    AND (p_include_past OR cs.session_date >= CURRENT_DATE)
  ORDER BY cs.session_date ASC, cs.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get user's attendance statistics
CREATE OR REPLACE FUNCTION public.get_user_session_stats(
  p_user_id UUID,
  p_course_id INTEGER
)
RETURNS TABLE (
  total_sessions BIGINT,
  attended_sessions BIGINT,
  missed_sessions BIGINT,
  cancelled_sessions BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE st.status = 'attended') as attended_sessions,
    COUNT(*) FILTER (WHERE st.status = 'missed') as missed_sessions,
    COUNT(*) FILTER (WHERE st.status = 'cancelled') as cancelled_sessions,
    ROUND(
      (COUNT(*) FILTER (WHERE st.status = 'attended')::NUMERIC /
       NULLIF(COUNT(*) FILTER (WHERE cs.session_date < CURRENT_DATE), 0)) * 100,
      2
    ) as attendance_rate
  FROM public.session_tickets st
  JOIN public.course_sessions cs ON cs.id = st.session_id
  WHERE st.user_id = p_user_id
    AND st.course_id = p_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Validate QR code
CREATE OR REPLACE FUNCTION public.validate_ticket_qr_code(p_qr_code TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  ticket_id UUID,
  user_id UUID,
  session_id UUID,
  status VARCHAR,
  message TEXT
) AS $$
DECLARE
  v_parts TEXT[];
  v_ticket_id UUID;
  v_user_id UUID;
  v_session_id UUID;
  v_status VARCHAR;
BEGIN
  -- Parse QR code format: QR:STK:{user_id}:{session_id}:{ticket_id}:{timestamp}
  v_parts := string_to_array(p_qr_code, ':');

  IF array_length(v_parts, 1) < 6 OR v_parts[1] != 'QR' OR v_parts[2] != 'STK' THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::UUID, NULL::VARCHAR, 'Invalid QR code format'::TEXT;
    RETURN;
  END IF;

  v_user_id := v_parts[3]::UUID;
  v_session_id := v_parts[4]::UUID;
  v_ticket_id := v_parts[5]::UUID;

  -- Check if ticket exists and get status
  SELECT st.status INTO v_status
  FROM public.session_tickets st
  WHERE st.id = v_ticket_id
    AND st.user_id = v_user_id
    AND st.session_id = v_session_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, v_ticket_id, v_user_id, v_session_id, NULL::VARCHAR, 'Ticket not found'::TEXT;
    RETURN;
  END IF;

  IF v_status = 'cancelled' THEN
    RETURN QUERY SELECT false, v_ticket_id, v_user_id, v_session_id, v_status, 'Ticket has been cancelled'::TEXT;
    RETURN;
  END IF;

  IF v_status = 'attended' THEN
    RETURN QUERY SELECT false, v_ticket_id, v_user_id, v_session_id, v_status, 'Already checked in'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_ticket_id, v_user_id, v_session_id, v_status, 'Valid ticket'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.session_tickets IS 'Digital attendance tickets for course sessions with QR codes';
COMMENT ON COLUMN public.session_tickets.ticket_number IS 'Unique ticket identifier format: STK-YYYY-NNNNNN';
COMMENT ON COLUMN public.session_tickets.qr_code IS 'QR code data for scanning at session check-in';
COMMENT ON COLUMN public.session_tickets.status IS 'Ticket status: active (not used), cancelled (user cancelled), attended (checked in), missed (session passed without check-in)';
COMMENT ON COLUMN public.session_tickets.check_in_method IS 'How the student checked in: qr_scan, manual (self), instructor (marked by instructor), auto (system)';
