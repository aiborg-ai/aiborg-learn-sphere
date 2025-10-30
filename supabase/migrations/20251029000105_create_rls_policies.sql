-- Migration: Create RLS policies and helper functions
-- Feature: 001-create-a-free (Free Introductory AI Session)
-- Purpose: Row Level Security policies for all tables + helper functions

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate age from birthdate
CREATE OR REPLACE FUNCTION public.calculate_age(birthdate DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN DATE_PART('year', AGE(birthdate));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- RLS POLICIES: free_sessions
-- ============================================================================

ALTER TABLE public.free_sessions ENABLE ROW LEVEL SECURITY;

-- Public can view published sessions
CREATE POLICY "Public can view published sessions"
  ON public.free_sessions
  FOR SELECT
  USING (is_published = TRUE AND status IN ('scheduled', 'in_progress'));

-- Authenticated users can view all published
CREATE POLICY "Authenticated can view all published"
  ON public.free_sessions
  FOR SELECT
  TO authenticated
  USING (is_published = TRUE);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage sessions"
  ON public.free_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES: session_registrations
-- ============================================================================

ALTER TABLE public.session_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
  ON public.session_registrations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can insert their own registrations (authenticated or anon)
CREATE POLICY "Users can register"
  ON public.session_registrations
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (TRUE);

-- Users can cancel their own registrations
CREATE POLICY "Users can cancel own registrations"
  ON public.session_registrations
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    status = 'cancelled' AND cancelled_at IS NOT NULL
  );

-- Admins can manage all registrations
CREATE POLICY "Admins can manage registrations"
  ON public.session_registrations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES: session_waitlist
-- ============================================================================

ALTER TABLE public.session_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist status
CREATE POLICY "Users can view own waitlist status"
  ON public.session_waitlist
  FOR SELECT
  TO authenticated
  USING (
    registration_id IN (
      SELECT id FROM public.session_registrations WHERE user_id = auth.uid()
    )
  );

-- Admins can manage waitlist
CREATE POLICY "Admins can manage waitlist"
  ON public.session_waitlist
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Service role bypasses RLS (Edge Functions use service_role key)

-- ============================================================================
-- RLS POLICIES: session_attendance
-- ============================================================================

ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- Users can view their own attendance
CREATE POLICY "Users can view own attendance"
  ON public.session_attendance
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all attendance
CREATE POLICY "Admins can view all attendance"
  ON public.session_attendance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Service role can insert/update (Edge Functions handle writes)

-- ============================================================================
-- RLS POLICIES: email_logs
-- ============================================================================

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Service role can insert (Edge Functions log emails)

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Public can view published sessions" ON public.free_sessions IS 'Allow anonymous users to view active published sessions';
COMMENT ON POLICY "Users can register" ON public.session_registrations IS 'Allow both authenticated and anonymous users to register for sessions';
COMMENT ON FUNCTION public.calculate_age(DATE) IS 'Calculate age from birthdate for COPPA compliance checks';
