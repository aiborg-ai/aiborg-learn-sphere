-- Migration: Create Event Session Tickets Table
-- Description: QR-code based tickets for event session check-in and attendance tracking
-- Created: 2025-11-06

CREATE TABLE IF NOT EXISTS public.event_session_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'attended', 'missed')),
  qr_code TEXT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  checked_in_at TIMESTAMPTZ,
  check_in_method VARCHAR(20) CHECK (check_in_method IN ('qr_scan', 'manual', 'host', 'auto')),
  checked_in_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Indexes
CREATE INDEX idx_event_session_tickets_user_id ON public.event_session_tickets(user_id);
CREATE INDEX idx_event_session_tickets_session_id ON public.event_session_tickets(session_id);
CREATE INDEX idx_event_session_tickets_event_id ON public.event_session_tickets(event_id);
CREATE INDEX idx_event_session_tickets_status ON public.event_session_tickets(status);
CREATE INDEX idx_event_session_tickets_ticket_number ON public.event_session_tickets(ticket_number);

-- Enable RLS
ALTER TABLE public.event_session_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own tickets
CREATE POLICY "Users can view own event session tickets"
  ON public.event_session_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own tickets (for check-in)
CREATE POLICY "Users can update own event session tickets"
  ON public.event_session_tickets
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all tickets
CREATE POLICY "Admins can view all event session tickets"
  ON public.event_session_tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage all tickets
CREATE POLICY "Admins can manage all event session tickets"
  ON public.event_session_tickets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_event_session_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_session_tickets_updated_at
  BEFORE UPDATE ON public.event_session_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_event_session_tickets_updated_at();

-- Function to generate unique ticket numbers (format: EVT-YYYY-NNNNNN)
CREATE OR REPLACE FUNCTION generate_event_ticket_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
  new_ticket_number TEXT;
  max_number INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get the maximum ticket number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 10) AS INTEGER)), 0)
  INTO max_number
  FROM public.event_session_tickets
  WHERE ticket_number LIKE 'EVT-' || year_part || '-%';

  -- Increment and format
  seq_part := LPAD((max_number + 1)::TEXT, 6, '0');
  new_ticket_number := 'EVT-' || year_part || '-' || seq_part;

  RETURN new_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_event_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_event_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_ticket_number_trigger
  BEFORE INSERT ON public.event_session_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_event_ticket_number();

-- Function to update session registration count when tickets change
CREATE OR REPLACE FUNCTION update_event_session_registrations()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count based on active/attended tickets
  UPDATE public.event_sessions
  SET current_registrations = (
    SELECT COUNT(*)
    FROM public.event_session_tickets
    WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
    AND status IN ('active', 'attended')
  )
  WHERE id = COALESCE(NEW.session_id, OLD.session_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_session_registrations_count
  AFTER INSERT OR UPDATE OR DELETE ON public.event_session_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_event_session_registrations();

-- Comments
COMMENT ON TABLE public.event_session_tickets IS 'QR-code based tickets for event session attendance';
COMMENT ON COLUMN public.event_session_tickets.ticket_number IS 'Auto-generated unique ticket number (EVT-YYYY-NNNNNN)';
COMMENT ON COLUMN public.event_session_tickets.qr_code IS 'QR code data for check-in scanning';
COMMENT ON COLUMN public.event_session_tickets.check_in_method IS 'How user checked in: qr_scan, manual, host, or auto';
