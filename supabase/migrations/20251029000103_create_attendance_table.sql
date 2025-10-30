-- Migration: Create session_attendance table
-- Feature: 001-create-a-free (Free Introductory AI Session)
-- Purpose: Track who joined the session and for how long

-- Create session_attendance table
CREATE TABLE IF NOT EXISTS public.session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  session_id UUID NOT NULL REFERENCES public.free_sessions(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.session_registrations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Jitsi Participant Details
  jitsi_participant_id TEXT,
  display_name TEXT,

  -- Attendance Times
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN left_at IS NOT NULL THEN EXTRACT(EPOCH FROM (left_at - joined_at))::INTEGER
      ELSE NULL
    END
  ) STORED,

  -- Device Info (optional)
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,

  -- Status
  still_in_session BOOLEAN GENERATED ALWAYS AS (left_at IS NULL) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_attendance_times CHECK (left_at IS NULL OR left_at > joined_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.session_attendance(session_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_registration ON public.session_attendance(registration_id);
CREATE INDEX IF NOT EXISTS idx_attendance_active ON public.session_attendance(session_id)
  WHERE left_at IS NULL;

-- Trigger: Update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.session_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Comment on table
COMMENT ON TABLE public.session_attendance IS 'Tracks session attendance with join/leave timestamps and duration calculation';
