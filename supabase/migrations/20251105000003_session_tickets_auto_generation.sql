-- Auto-generation triggers for session tickets
-- Migration: 20251105000003_session_tickets_auto_generation.sql
-- Description: Automatically generate tickets on enrollment and session creation

-- Function to auto-generate tickets for enrolled students when new session is created
CREATE OR REPLACE FUNCTION public.generate_tickets_for_new_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate for scheduled sessions (not drafts)
  IF NEW.status = 'scheduled' THEN
    INSERT INTO public.session_tickets (ticket_number, user_id, course_id, session_id, qr_code)
    SELECT
      public.generate_session_ticket_number(),
      e.user_id,
      NEW.course_id,
      NEW.id,
      public.generate_ticket_qr_code(e.user_id, NEW.id, gen_random_uuid())
    FROM public.enrollments e
    WHERE e.course_id = NEW.course_id
      AND e.payment_status IN ('completed', 'family_pass')
    ON CONFLICT (user_id, session_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_generate_tickets_for_new_session
AFTER INSERT ON public.course_sessions
FOR EACH ROW
EXECUTE FUNCTION public.generate_tickets_for_new_session();

-- Function to auto-generate tickets for all future sessions when user enrolls
CREATE OR REPLACE FUNCTION public.generate_session_tickets_on_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate tickets for completed enrollments
  IF NEW.payment_status IN ('completed', 'family_pass') THEN
    INSERT INTO public.session_tickets (ticket_number, user_id, course_id, session_id, qr_code)
    SELECT
      public.generate_session_ticket_number(),
      NEW.user_id,
      NEW.course_id,
      cs.id,
      public.generate_ticket_qr_code(NEW.user_id, cs.id, gen_random_uuid())
    FROM public.course_sessions cs
    WHERE cs.course_id = NEW.course_id
      AND cs.status = 'scheduled'
      AND cs.session_date >= CURRENT_DATE
    ON CONFLICT (user_id, session_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_generate_tickets_on_enrollment
AFTER INSERT ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.generate_session_tickets_on_enrollment();

-- Function to handle ticket status updates when session changes
CREATE OR REPLACE FUNCTION public.handle_session_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If session is cancelled, mark all active tickets as cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.session_tickets
    SET status = 'cancelled'
    WHERE session_id = NEW.id
      AND status = 'active';
  END IF;

  -- If session is completed, mark all active tickets as missed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.session_tickets
    SET status = 'missed'
    WHERE session_id = NEW.id
      AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_session_status_change
AFTER UPDATE ON public.course_sessions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_session_status_change();

-- Function to set check-in window when session becomes in_progress
CREATE OR REPLACE FUNCTION public.auto_enable_check_in()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    NEW.check_in_enabled := true;
    IF NEW.check_in_window_start IS NULL THEN
      NEW.check_in_window_start := now();
    END IF;
    IF NEW.check_in_window_end IS NULL THEN
      -- Default: check-in available for 30 minutes after start
      NEW.check_in_window_end := now() + INTERVAL '30 minutes';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_enable_check_in
BEFORE UPDATE ON public.course_sessions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.auto_enable_check_in();

-- Backward compatibility: Update attendance_tickets table
ALTER TABLE public.attendance_tickets
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.course_sessions(id),
  ADD COLUMN IF NOT EXISTS legacy BOOLEAN DEFAULT false;

-- Create index on new column
CREATE INDEX IF NOT EXISTS idx_attendance_tickets_session_id ON public.attendance_tickets(session_id);

-- Function to bulk generate tickets for existing enrollments
CREATE OR REPLACE FUNCTION public.backfill_session_tickets_for_course(p_course_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  WITH inserted AS (
    INSERT INTO public.session_tickets (ticket_number, user_id, course_id, session_id, qr_code)
    SELECT
      public.generate_session_ticket_number(),
      e.user_id,
      e.course_id,
      cs.id,
      public.generate_ticket_qr_code(e.user_id, cs.id, gen_random_uuid())
    FROM public.enrollments e
    CROSS JOIN public.course_sessions cs
    WHERE e.course_id = p_course_id
      AND cs.course_id = p_course_id
      AND e.payment_status IN ('completed', 'family_pass')
      AND cs.status = 'scheduled'
      AND cs.session_date >= CURRENT_DATE
    ON CONFLICT (user_id, session_id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if user can check in to session
CREATE OR REPLACE FUNCTION public.can_check_in_to_session(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS TABLE (
  can_check_in BOOLEAN,
  reason TEXT,
  ticket_id UUID
) AS $$
DECLARE
  v_session_status VARCHAR;
  v_check_in_enabled BOOLEAN;
  v_check_in_window_end TIMESTAMPTZ;
  v_ticket_id UUID;
  v_ticket_status VARCHAR;
BEGIN
  -- Get session details
  SELECT cs.status, cs.check_in_enabled, cs.check_in_window_end
  INTO v_session_status, v_check_in_enabled, v_check_in_window_end
  FROM public.course_sessions cs
  WHERE cs.id = p_session_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Session not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check session status
  IF v_session_status = 'cancelled' THEN
    RETURN QUERY SELECT false, 'Session has been cancelled'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_session_status = 'completed' THEN
    RETURN QUERY SELECT false, 'Session has already ended'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if check-in is enabled
  IF NOT v_check_in_enabled THEN
    RETURN QUERY SELECT false, 'Check-in is not yet open'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if within check-in window
  IF v_check_in_window_end IS NOT NULL AND now() > v_check_in_window_end THEN
    RETURN QUERY SELECT false, 'Check-in window has closed'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if user has ticket
  SELECT st.id, st.status
  INTO v_ticket_id, v_ticket_status
  FROM public.session_tickets st
  WHERE st.user_id = p_user_id
    AND st.session_id = p_session_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'You do not have a ticket for this session'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check ticket status
  IF v_ticket_status = 'cancelled' THEN
    RETURN QUERY SELECT false, 'Your ticket has been cancelled'::TEXT, v_ticket_id;
    RETURN;
  END IF;

  IF v_ticket_status = 'attended' THEN
    RETURN QUERY SELECT false, 'You have already checked in'::TEXT, v_ticket_id;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, 'You can check in'::TEXT, v_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION public.generate_session_tickets_on_enrollment() IS 'Auto-generates session tickets when student enrolls in course';
COMMENT ON FUNCTION public.generate_tickets_for_new_session() IS 'Auto-generates tickets for all enrolled students when new session is created';
COMMENT ON FUNCTION public.backfill_session_tickets_for_course(INTEGER) IS 'Manually generate tickets for all enrolled students (one-time backfill)';
COMMENT ON FUNCTION public.can_check_in_to_session(UUID, UUID) IS 'Validates if user can check in to a session';
