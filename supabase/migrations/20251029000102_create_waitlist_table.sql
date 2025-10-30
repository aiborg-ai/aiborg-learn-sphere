-- Migration: Create session_waitlist table
-- Feature: 001-create-a-free (Free Introductory AI Session)
-- Purpose: FIFO queue for users waiting for session spots

-- Create session_waitlist table
CREATE TABLE IF NOT EXISTS public.session_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  session_id UUID NOT NULL REFERENCES public.free_sessions(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.session_registrations(id) ON DELETE CASCADE,

  -- Waitlist Position (1-indexed)
  position INTEGER NOT NULL CHECK (position > 0),

  -- Status
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (
    status IN ('waiting', 'promoted', 'expired', 'declined')
  ),

  -- Promotion Details
  promoted_at TIMESTAMPTZ,
  promotion_expires_at TIMESTAMPTZ,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,

  -- Response
  accepted_promotion BOOLEAN,
  responded_at TIMESTAMPTZ,

  -- Timestamps
  joined_waitlist_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_registration_waitlist UNIQUE (registration_id),
  CONSTRAINT promoted_requires_timestamp CHECK (
    (status != 'promoted') OR (promoted_at IS NOT NULL)
  ),
  CONSTRAINT response_requires_timestamp CHECK (
    (accepted_promotion IS NULL) OR (responded_at IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_session_position ON public.session_waitlist(session_id, position)
  WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_waitlist_session_status ON public.session_waitlist(session_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_expired_promotions ON public.session_waitlist(promotion_expires_at)
  WHERE status = 'promoted' AND accepted_promotion IS NULL;

-- Trigger: Assign position on insert
CREATE OR REPLACE FUNCTION public.assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Get next position in queue (only if position not already set)
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position
    FROM public.session_waitlist
    WHERE session_id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_position
  BEFORE INSERT ON public.session_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_waitlist_position();

-- Trigger: Update free_sessions.waitlist_count
CREATE OR REPLACE FUNCTION public.update_session_waitlist_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.free_sessions
    SET waitlist_count = waitlist_count + 1
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.free_sessions
    SET waitlist_count = waitlist_count - 1
    WHERE id = OLD.session_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'waiting' AND NEW.status != 'waiting' THEN
    UPDATE public.free_sessions
    SET waitlist_count = waitlist_count - 1
    WHERE id = NEW.session_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_waitlist_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.session_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_waitlist_count();

-- Trigger: Update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.session_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Comment on table
COMMENT ON TABLE public.session_waitlist IS 'FIFO queue for users waiting for session spots with automatic position assignment';
