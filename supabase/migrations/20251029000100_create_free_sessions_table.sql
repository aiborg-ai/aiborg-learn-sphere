-- Migration: Create free_sessions table
-- Feature: 001-create-a-free (Free Introductory AI Session)
-- Purpose: Master table for free introductory session events

-- Create free_sessions table
CREATE TABLE IF NOT EXISTS public.free_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Details
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  description TEXT NOT NULL CHECK (length(description) >= 10),
  session_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90 CHECK (duration_minutes > 0),
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Capacity Management
  capacity INTEGER NOT NULL DEFAULT 50 CHECK (capacity > 0 AND capacity <= 500),
  registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
  waitlist_count INTEGER NOT NULL DEFAULT 0 CHECK (waitlist_count >= 0),
  is_full BOOLEAN GENERATED ALWAYS AS (registered_count >= capacity) STORED,

  -- Meeting Details
  meeting_url TEXT,
  meeting_room_name TEXT,
  meeting_provider TEXT DEFAULT 'jitsi' CHECK (meeting_provider IN ('jitsi', 'google_meet', 'zoom')),

  -- Target Audience
  target_age_min INTEGER NOT NULL DEFAULT 9 CHECK (target_age_min >= 0),
  target_age_max INTEGER NOT NULL DEFAULT 18 CHECK (target_age_max >= target_age_min),

  -- Pricing
  price_currency TEXT NOT NULL DEFAULT 'GBP' CHECK (price_currency IN ('GBP', 'USD', 'EUR')),
  price_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price_amount >= 0),

  -- Status Management
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled')
  ),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,

  -- Recording (future use)
  recording_url TEXT,
  recording_available_at TIMESTAMPTZ,

  -- Email Tracking
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_1h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  post_session_email_sent BOOLEAN NOT NULL DEFAULT FALSE,

  -- Support
  support_contact TEXT,
  support_whatsapp TEXT DEFAULT '+44 7404568207',

  -- Admin
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_session_date CHECK (session_date > created_at),
  CONSTRAINT valid_age_range CHECK (target_age_max > target_age_min),
  CONSTRAINT published_requires_meeting CHECK (
    is_published = FALSE OR (meeting_url IS NOT NULL AND meeting_room_name IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_free_sessions_status ON public.free_sessions(status) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_free_sessions_date ON public.free_sessions(session_date) WHERE status IN ('scheduled', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_free_sessions_reminders ON public.free_sessions(session_date, reminder_24h_sent, reminder_1h_sent);

-- Helper function: Check if session is full
CREATE OR REPLACE FUNCTION public.is_session_full(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_capacity INTEGER;
  v_registered INTEGER;
BEGIN
  SELECT capacity, registered_count
  INTO v_capacity, v_registered
  FROM public.free_sessions
  WHERE id = p_session_id;

  RETURN v_registered >= v_capacity;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comment on table
COMMENT ON TABLE public.free_sessions IS 'Master table for free introductory AI session events';
