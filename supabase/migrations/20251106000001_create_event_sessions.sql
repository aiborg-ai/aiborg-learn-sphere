-- Migration: Create Event Sessions Table
-- Description: Stores individual session instances for recurring event series
-- Created: 2025-11-06

CREATE TABLE IF NOT EXISTS public.event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id INTEGER NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title VARCHAR(200),
  description TEXT,
  session_type VARCHAR(20) DEFAULT 'scheduled' CHECK (session_type IN ('scheduled', 'extra', 'cancelled')),
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  meeting_url TEXT,
  host_notes TEXT,
  max_capacity INTEGER DEFAULT 50,
  current_registrations INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  check_in_enabled BOOLEAN DEFAULT true,
  check_in_window_start TIMESTAMPTZ,
  check_in_window_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, session_number),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes for performance
CREATE INDEX idx_event_sessions_event_id ON public.event_sessions(event_id);
CREATE INDEX idx_event_sessions_session_date ON public.event_sessions(session_date);
CREATE INDEX idx_event_sessions_status ON public.event_sessions(status);
CREATE INDEX idx_event_sessions_upcoming ON public.event_sessions(session_date, start_time) WHERE status IN ('scheduled', 'in_progress');

-- Enable RLS
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow public to read non-cancelled sessions
CREATE POLICY "Public can view scheduled event sessions"
  ON public.event_sessions
  FOR SELECT
  USING (status != 'cancelled' OR status IS NULL);

-- Allow authenticated users to view all sessions
CREATE POLICY "Authenticated users can view all event sessions"
  ON public.event_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete sessions
CREATE POLICY "Admins can manage event sessions"
  ON public.event_sessions
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

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_sessions_updated_at
  BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_event_sessions_updated_at();

-- Function to auto-set check-in window (30 mins before to 15 mins after start)
CREATE OR REPLACE FUNCTION set_event_session_checkin_window()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_in_window_start IS NULL THEN
    NEW.check_in_window_start := (NEW.session_date + NEW.start_time)::timestamptz - INTERVAL '30 minutes';
  END IF;

  IF NEW.check_in_window_end IS NULL THEN
    NEW.check_in_window_end := (NEW.session_date + NEW.start_time)::timestamptz + INTERVAL '15 minutes';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_session_checkin_window
  BEFORE INSERT OR UPDATE ON public.event_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_event_session_checkin_window();

-- Comments for documentation
COMMENT ON TABLE public.event_sessions IS 'Individual session instances for recurring event series';
COMMENT ON COLUMN public.event_sessions.session_type IS 'Type: scheduled (regular), extra (bonus session), cancelled';
COMMENT ON COLUMN public.event_sessions.check_in_window_start IS 'Auto-set to 30 mins before start_time';
COMMENT ON COLUMN public.event_sessions.check_in_window_end IS 'Auto-set to 15 mins after start_time';
