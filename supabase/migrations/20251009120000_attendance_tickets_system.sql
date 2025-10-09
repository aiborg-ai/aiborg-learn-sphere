-- ============================================================================
-- ATTENDANCE TICKETS SYSTEM
-- Description: Digital attendance tickets for events and course sessions
-- Date: 2025-10-09
-- ============================================================================

-- ============================================================================
-- 1. ATTENDANCE_TICKETS TABLE
-- ============================================================================
-- Stores attendance tickets issued to users for events and course sessions

CREATE SEQUENCE IF NOT EXISTS attendance_ticket_sequence START WITH 1;

CREATE TABLE IF NOT EXISTS public.attendance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User information
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Ticket type and references
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('event', 'course_session')),
  event_id INTEGER REFERENCES public.events(id) ON DELETE SET NULL,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL,

  -- Session details
  session_title TEXT NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME,
  location TEXT,

  -- Ticket metadata
  ticket_number TEXT UNIQUE NOT NULL,
  badge_color TEXT NOT NULL CHECK (badge_color IN ('gold', 'silver', 'bronze', 'blue', 'green')) DEFAULT 'silver',
  is_verified BOOLEAN NOT NULL DEFAULT false,

  -- Admin tracking
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation: Either event_id OR course_id must be set (not both)
  CONSTRAINT valid_ticket_reference CHECK (
    (ticket_type = 'event' AND event_id IS NOT NULL AND course_id IS NULL) OR
    (ticket_type = 'course_session' AND course_id IS NOT NULL AND event_id IS NULL)
  )
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX idx_attendance_tickets_user ON public.attendance_tickets(user_id);
CREATE INDEX idx_attendance_tickets_type ON public.attendance_tickets(ticket_type);
CREATE INDEX idx_attendance_tickets_event ON public.attendance_tickets(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_attendance_tickets_course ON public.attendance_tickets(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_attendance_tickets_date ON public.attendance_tickets(session_date DESC);
CREATE INDEX idx_attendance_tickets_verified ON public.attendance_tickets(is_verified);
CREATE INDEX idx_attendance_tickets_user_type ON public.attendance_tickets(user_id, ticket_type);

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_val INTEGER;
  ticket_num TEXT;
  current_year TEXT;
BEGIN
  -- Get next sequence value
  next_val := nextval('attendance_ticket_sequence');

  -- Get current year
  current_year := TO_CHAR(NOW(), 'YYYY');

  -- Format: ATK-YYYY-NNNNNN
  ticket_num := 'ATK-' || current_year || '-' || LPAD(next_val::TEXT, 6, '0');

  RETURN ticket_num;
END;
$$;

-- Function to get user's total ticket count
CREATE OR REPLACE FUNCTION get_user_ticket_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.attendance_tickets
  WHERE user_id = p_user_id;

  RETURN v_count;
END;
$$;

-- Function to get tickets by type for a user
CREATE OR REPLACE FUNCTION get_tickets_by_type(
  p_user_id UUID,
  p_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.attendance_tickets
  WHERE user_id = p_user_id
  AND ticket_type = p_type;

  RETURN v_count;
END;
$$;

-- Function to get user's ticket statistics
CREATE OR REPLACE FUNCTION get_user_ticket_stats(p_user_id UUID)
RETURNS TABLE (
  total_tickets BIGINT,
  event_tickets BIGINT,
  course_session_tickets BIGINT,
  verified_tickets BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE ticket_type = 'event') as event_tickets,
    COUNT(*) FILTER (WHERE ticket_type = 'course_session') as course_session_tickets,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_tickets
  FROM public.attendance_tickets
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_set_ticket_number
  BEFORE INSERT ON public.attendance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Trigger for updated_at
CREATE TRIGGER update_attendance_tickets_updated_at
  BEFORE UPDATE ON public.attendance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.attendance_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own attendance tickets"
  ON public.attendance_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all attendance tickets"
  ON public.attendance_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can create tickets
CREATE POLICY "Admins can create attendance tickets"
  ON public.attendance_tickets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update tickets
CREATE POLICY "Admins can update attendance tickets"
  ON public.attendance_tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can delete tickets
CREATE POLICY "Admins can delete attendance tickets"
  ON public.attendance_tickets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Instructors can view tickets for their courses
CREATE POLICY "Instructors can view course tickets"
  ON public.attendance_tickets
  FOR SELECT
  USING (
    ticket_type = 'course_session'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'instructor'
    )
  );

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.attendance_tickets IS 'Digital attendance tickets for events and course sessions';
COMMENT ON COLUMN public.attendance_tickets.ticket_number IS 'Auto-generated unique ticket number (ATK-YYYY-NNNNNN)';
COMMENT ON COLUMN public.attendance_tickets.badge_color IS 'Visual color for ticket badge (gold, silver, bronze, blue, green)';
COMMENT ON COLUMN public.attendance_tickets.is_verified IS 'Whether attendance is administratively verified';
COMMENT ON FUNCTION generate_ticket_number IS 'Generates unique attendance ticket numbers';
COMMENT ON FUNCTION get_user_ticket_count IS 'Get total number of tickets for a user';
COMMENT ON FUNCTION get_tickets_by_type IS 'Get count of tickets by type for a user';
COMMENT ON FUNCTION get_user_ticket_stats IS 'Get comprehensive ticket statistics for a user';

-- ============================================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample tickets for testing
/*
INSERT INTO public.attendance_tickets (
  user_id,
  ticket_type,
  event_id,
  session_title,
  session_date,
  session_time,
  location,
  badge_color,
  is_verified,
  issued_by,
  notes
) VALUES (
  -- Replace with actual user_id
  '00000000-0000-0000-0000-000000000000',
  'event',
  1,
  'AI Fundamentals Workshop',
  '2025-03-15',
  '10:00',
  'Online (Zoom)',
  'gold',
  true,
  auth.uid(),
  'Attended full workshop'
);
*/
