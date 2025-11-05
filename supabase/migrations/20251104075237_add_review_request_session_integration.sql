-- Migration: Add Review Request Session Integration
-- Description: Adds review request tracking columns to session tables
-- Prerequisites: review_requests table must exist (from previous migration)
-- This migration is safe to run even if session tables don't exist yet

-- =====================================================
-- ADD REVIEW REQUEST COLUMNS TO SESSION TABLES
-- =====================================================

-- Workshop Sessions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'workshop_sessions'
  ) THEN
    ALTER TABLE public.workshop_sessions
    ADD COLUMN IF NOT EXISTS review_requests_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_requests_count INTEGER DEFAULT 0;

    RAISE NOTICE 'Added review request columns to workshop_sessions';
  ELSE
    RAISE NOTICE 'workshop_sessions table does not exist, skipping';
  END IF;
END $$;

-- Free Sessions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'free_sessions'
  ) THEN
    ALTER TABLE public.free_sessions
    ADD COLUMN IF NOT EXISTS review_requests_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_requests_count INTEGER DEFAULT 0;

    RAISE NOTICE 'Added review request columns to free_sessions';
  ELSE
    RAISE NOTICE 'free_sessions table does not exist, skipping';
  END IF;
END $$;

-- Classroom Sessions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'classroom_sessions'
  ) THEN
    ALTER TABLE public.classroom_sessions
    ADD COLUMN IF NOT EXISTS review_requests_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_requests_count INTEGER DEFAULT 0;

    RAISE NOTICE 'Added review request columns to classroom_sessions';
  ELSE
    RAISE NOTICE 'classroom_sessions table does not exist, skipping';
  END IF;
END $$;

-- Courses (as fallback)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'courses'
  ) THEN
    ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS review_requests_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_requests_count INTEGER DEFAULT 0;

    RAISE NOTICE 'Added review request columns to courses';
  ELSE
    RAISE NOTICE 'courses table does not exist, skipping';
  END IF;
END $$;

-- Events
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'events'
  ) THEN
    ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS review_requests_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_requests_count INTEGER DEFAULT 0;

    RAISE NOTICE 'Added review request columns to events';
  ELSE
    RAISE NOTICE 'events table does not exist, skipping';
  END IF;
END $$;

-- =====================================================
-- CREATE OR REPLACE TRIGGER FUNCTION
-- =====================================================

-- Function to update session review request count
-- This function checks at runtime which tables exist
CREATE OR REPLACE FUNCTION update_session_review_request_count()
RETURNS TRIGGER AS $$
DECLARE
  v_table_exists BOOLEAN;
  v_sql TEXT;
BEGIN
  -- Build update SQL based on session_type
  CASE NEW.session_type
    WHEN 'workshop' THEN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'workshop_sessions'
      ) INTO v_table_exists;

      IF v_table_exists THEN
        UPDATE public.workshop_sessions
        SET
          review_requests_count = (
            SELECT COUNT(*) FROM public.review_requests
            WHERE session_id = NEW.session_id AND session_type = 'workshop'
          ),
          review_requests_sent_at = COALESCE(review_requests_sent_at, NOW())
        WHERE id = NEW.session_id;
      END IF;

    WHEN 'free_session' THEN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'free_sessions'
      ) INTO v_table_exists;

      IF v_table_exists THEN
        UPDATE public.free_sessions
        SET
          review_requests_count = (
            SELECT COUNT(*) FROM public.review_requests
            WHERE session_id = NEW.session_id AND session_type = 'free_session'
          ),
          review_requests_sent_at = COALESCE(review_requests_sent_at, NOW())
        WHERE id = NEW.session_id;
      END IF;

    WHEN 'classroom' THEN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'classroom_sessions'
      ) INTO v_table_exists;

      IF v_table_exists THEN
        UPDATE public.classroom_sessions
        SET
          review_requests_count = (
            SELECT COUNT(*) FROM public.review_requests
            WHERE session_id = NEW.session_id AND session_type = 'classroom'
          ),
          review_requests_sent_at = COALESCE(review_requests_sent_at, NOW())
        WHERE id = NEW.session_id;
      END IF;

    WHEN 'course' THEN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'courses'
      ) INTO v_table_exists;

      IF v_table_exists THEN
        UPDATE public.courses
        SET
          review_requests_count = (
            SELECT COUNT(*) FROM public.review_requests
            WHERE session_id = NEW.session_id AND session_type = 'course'
          ),
          review_requests_sent_at = COALESCE(review_requests_sent_at, NOW())
        WHERE id = NEW.session_id;
      END IF;

    WHEN 'event' THEN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'events'
      ) INTO v_table_exists;

      IF v_table_exists THEN
        UPDATE public.events
        SET
          review_requests_count = (
            SELECT COUNT(*) FROM public.review_requests
            WHERE session_id = NEW.session_id AND session_type = 'event'
          ),
          review_requests_sent_at = COALESCE(review_requests_sent_at, NOW())
        WHERE id = NEW.session_id;
      END IF;

    ELSE
      -- Unknown session type, log but don't error
      RAISE NOTICE 'Unknown session_type: %. Skipping session table update.', NEW.session_type;
  END CASE;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Error updating session table for session_type %: %', NEW.session_type, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGER
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_session_review_count ON public.review_requests;

-- Create new trigger
CREATE TRIGGER trigger_update_session_review_count
  AFTER INSERT ON public.review_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_session_review_request_count();

-- =====================================================
-- DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION update_session_review_request_count() IS
  'Updates review request count in session tables. Safely handles missing tables.';
