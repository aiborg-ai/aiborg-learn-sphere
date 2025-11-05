-- Migration: Add Review Request System (Standalone Version)
-- Description: Core review request system without session table dependencies
-- This migration only requires: auth.users, profiles, notifications, and reviews tables
-- Session table columns will be added by a separate follow-up migration

-- =====================================================
-- 1. EXTEND NOTIFICATION TYPES
-- =====================================================

-- Check if notifications table exists, if not skip this
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    -- Drop existing constraint if it exists
    ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

    -- Add new constraint with review_request type
    ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('achievement', 'deadline', 'grade', 'share', 'mention',
                    'announcement', 'course_update', 'review_request'));
  END IF;
END $$;

-- =====================================================
-- 2. CREATE REVIEW REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session Reference (flexible - doesn't require session tables to exist)
  session_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('workshop', 'free_session', 'classroom', 'course', 'event')),

  -- User and Status
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'completed', 'dismissed')) DEFAULT 'pending',

  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- Related Records (optional - may not exist yet)
  review_id UUID, -- Will reference reviews(id) if that table exists
  notification_id UUID, -- Will reference notifications(id) if that table exists

  -- Reminder Tracking
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMPTZ,

  -- Session Context (stored directly to avoid dependencies)
  session_title TEXT,
  session_date TIMESTAMPTZ,
  custom_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one request per user per session
  UNIQUE(session_id, session_type, user_id)
);

-- Add foreign key constraints only if referenced tables exist
DO $$
BEGIN
  -- Add review_id foreign key if reviews table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) THEN
    ALTER TABLE public.review_requests
    ADD CONSTRAINT fk_review_requests_review_id
    FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE SET NULL;
  END IF;

  -- Add notification_id foreign key if notifications table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.review_requests
    ADD CONSTRAINT fk_review_requests_notification_id
    FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_review_requests_user_status
  ON public.review_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_review_requests_session
  ON public.review_requests(session_id, session_type);

CREATE INDEX IF NOT EXISTS idx_review_requests_pending
  ON public.review_requests(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_review_requests_created
  ON public.review_requests(created_at DESC);

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own review requests
CREATE POLICY "Users can view own review requests"
  ON public.review_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all review requests (if profiles table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all review requests"
      ON public.review_requests FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role IN (''admin'', ''super_admin'', ''company_admin'')
        )
      )';
  END IF;
END $$;

-- Admins can insert review requests (if profiles table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can create review requests"
      ON public.review_requests FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role IN (''admin'', ''super_admin'', ''company_admin'')
        )
      )';
  END IF;
END $$;

-- Users and admins can update review requests
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own review requests"
      ON public.review_requests FOR UPDATE
      USING (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role IN (''admin'', ''super_admin'', ''company_admin'')
        )
      )';
  ELSE
    -- Fallback: only users can update their own requests
    EXECUTE 'CREATE POLICY "Users can update own review requests"
      ON public.review_requests FOR UPDATE
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- =====================================================
-- 5. AUTO-UPDATE TRIGGERS
-- =====================================================

-- Function to auto-update updated_at and responded_at
CREATE OR REPLACE FUNCTION update_review_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- If status changed to completed or dismissed, set responded_at
  IF (NEW.status IN ('completed', 'dismissed')) AND
     (OLD.status IS NULL OR OLD.status = 'pending') AND
     NEW.responded_at IS NULL THEN
    NEW.responded_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_review_request_updated_at ON public.review_requests;
CREATE TRIGGER trigger_review_request_updated_at
  BEFORE UPDATE ON public.review_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_review_request_updated_at();

-- =====================================================
-- 6. ENABLE REALTIME
-- =====================================================

-- Enable realtime replication if publication exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.review_requests;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not enable realtime: %', SQLERRM;
END $$;

-- =====================================================
-- 7. ANALYTICS VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.review_request_stats AS
SELECT
  session_id,
  session_type,
  session_title,
  session_date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed_count,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100,
    2
  ) as response_rate_pct,
  MIN(requested_at) as first_request_sent,
  MAX(responded_at) as last_response_received,
  AVG(EXTRACT(EPOCH FROM (responded_at - requested_at)) / 3600) as avg_response_hours
FROM public.review_requests
GROUP BY session_id, session_type, session_title, session_date;

-- Grant access to authenticated users
GRANT SELECT ON public.review_request_stats TO authenticated;

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Get pending review requests for a user
CREATE OR REPLACE FUNCTION get_user_pending_review_requests(p_user_id UUID)
RETURNS TABLE (
  request_id UUID,
  session_title TEXT,
  session_date TIMESTAMPTZ,
  session_type TEXT,
  requested_at TIMESTAMPTZ,
  notification_id UUID,
  custom_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rr.id,
    rr.session_title,
    rr.session_date,
    rr.session_type,
    rr.requested_at,
    rr.notification_id,
    rr.custom_message
  FROM public.review_requests rr
  WHERE rr.user_id = p_user_id
    AND rr.status = 'pending'
  ORDER BY rr.requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_pending_review_requests(UUID) TO authenticated;

-- =====================================================
-- 9. DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.review_requests IS
  'Core review request tracking system. Session table integration happens in separate migration.';

COMMENT ON COLUMN public.review_requests.session_type IS
  'Type of session: workshop, free_session, classroom, course, or event';

COMMENT ON COLUMN public.review_requests.status IS
  'Request status: pending (awaiting response), completed (review submitted), dismissed (user declined)';

COMMENT ON COLUMN public.review_requests.reminder_count IS
  'Number of reminder notifications sent for this request';

COMMENT ON VIEW public.review_request_stats IS
  'Analytics view for review request response rates and timing by session';

COMMENT ON FUNCTION get_user_pending_review_requests(UUID) IS
  'Returns all pending review requests for a user (used for login notifications)';
