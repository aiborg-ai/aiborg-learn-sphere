-- Migration: Create session_registrations table
-- Feature: 001-create-a-free (Free Introductory AI Session)
-- Purpose: User registrations for free sessions (both confirmed and waitlisted)

-- Create session_registrations table
CREATE TABLE IF NOT EXISTS public.session_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  session_id UUID NOT NULL REFERENCES public.free_sessions(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Personal Information
  full_name TEXT NOT NULL CHECK (length(full_name) >= 2 AND length(full_name) <= 100),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  birthdate DATE NOT NULL,
  age_at_registration INTEGER GENERATED ALWAYS AS (
    DATE_PART('year', AGE(birthdate))
  ) STORED,

  -- COPPA Compliance
  parent_email TEXT CHECK (
    parent_email IS NULL OR
    parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  parent_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  parent_consent_at TIMESTAMPTZ,

  -- Registration Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'waitlisted', 'cancelled', 'expired')
  ),
  registration_source TEXT DEFAULT 'web' CHECK (
    registration_source IN ('web', 'mobile', 'admin', 'api')
  ),

  -- Notifications
  confirmation_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  confirmation_email_sent_at TIMESTAMPTZ,
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_1h_sent BOOLEAN NOT NULL DEFAULT FALSE,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,

  -- Timestamps
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_email_per_session UNIQUE (session_id, email),
  CONSTRAINT require_parent_email_if_under_13 CHECK (
    (age_at_registration >= 13) OR
    (parent_email IS NOT NULL AND parent_consent_given = TRUE)
  ),
  CONSTRAINT confirmed_requires_timestamp CHECK (
    (status != 'confirmed') OR (confirmed_at IS NOT NULL)
  ),
  CONSTRAINT cancelled_requires_timestamp CHECK (
    (status != 'cancelled') OR (cancelled_at IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_session ON public.session_registrations(session_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.session_registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.session_registrations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registrations_pending_consent ON public.session_registrations(parent_email)
  WHERE age_at_registration < 13 AND parent_consent_given = FALSE;

-- Trigger: Update free_sessions.registered_count
CREATE OR REPLACE FUNCTION public.update_session_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR
     (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
    -- Increment count
    UPDATE public.free_sessions
    SET registered_count = registered_count + 1
    WHERE id = NEW.session_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status != 'confirmed') OR
        (TG_OP = 'DELETE' AND OLD.status = 'confirmed') THEN
    -- Decrement count
    UPDATE public.free_sessions
    SET registered_count = registered_count - 1
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_registered_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.session_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_registered_count();

-- Generic updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.session_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Comment on table
COMMENT ON TABLE public.session_registrations IS 'User registrations for free introductory AI sessions with COPPA compliance';
