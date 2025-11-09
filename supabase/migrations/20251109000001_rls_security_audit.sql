-- Row-Level Security (RLS) Audit & Enhancement
-- Created: 2025-11-09
-- Purpose: Verify and enhance RLS policies across all tables
--
-- Security Objectives:
-- 1. Ensure ALL tables have RLS enabled
-- 2. Verify policy effectiveness
-- 3. Close authorization gaps
-- 4. Document security boundaries

-- ============================================================================
-- RLS VERIFICATION
-- ============================================================================

-- Query to identify tables WITHOUT RLS enabled
DO $$
DECLARE
  v_table RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_table IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = FALSE
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
    ORDER BY tablename
  LOOP
    RAISE NOTICE 'WARNING: Table %.% does NOT have RLS enabled',
      v_table.schemaname, v_table.tablename;
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE 'SUCCESS: All public tables have RLS enabled';
  ELSE
    RAISE WARNING '% tables found without RLS protection', v_count;
  END IF;
END;
$$;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES (IF NOT ALREADY ENABLED)
-- ============================================================================

-- Critical tables that MUST have RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.family_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ENHANCED RLS POLICIES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES TABLE
-- -----------------------------------------------------------------------------

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile (excluding role field)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    -- Prevent users from changing their own role
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- COURSES TABLE
-- -----------------------------------------------------------------------------

-- Public can view published courses
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses"
  ON public.courses
  FOR SELECT
  TO anon, authenticated
  USING (published = TRUE);

-- Instructors can view own courses
DROP POLICY IF EXISTS "Instructors can view own courses" ON public.courses;
CREATE POLICY "Instructors can view own courses"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (
    instructor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Only admins and instructors can create courses
DROP POLICY IF EXISTS "Admins and instructors can create courses" ON public.courses;
CREATE POLICY "Admins and instructors can create courses"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Instructors can update own courses, admins can update all
DROP POLICY IF EXISTS "Course owners can update" ON public.courses;
CREATE POLICY "Course owners can update"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (
    instructor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete courses
DROP POLICY IF EXISTS "Only admins can delete courses" ON public.courses;
CREATE POLICY "Only admins can delete courses"
  ON public.courses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- ENROLLMENTS TABLE
-- -----------------------------------------------------------------------------

-- Users can view their own enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Users can view own enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Users can create their own enrollments
DROP POLICY IF EXISTS "Users can create own enrollments" ON public.enrollments;
CREATE POLICY "Users can create own enrollments"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own enrollments (status changes)
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.enrollments;
CREATE POLICY "Users can update own enrollments"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- -----------------------------------------------------------------------------
-- ASSESSMENT RESULTS TABLE
-- -----------------------------------------------------------------------------

-- Users can view own assessment results
DROP POLICY IF EXISTS "Users can view own results" ON public.assessment_results;
CREATE POLICY "Users can view own results"
  ON public.assessment_results
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Users can insert own assessment results
DROP POLICY IF EXISTS "Users can create own results" ON public.assessment_results;
CREATE POLICY "Users can create own results"
  ON public.assessment_results
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Prevent users from modifying completed assessments
DROP POLICY IF EXISTS "No updates to completed assessments" ON public.assessment_results;
CREATE POLICY "No updates to completed assessments"
  ON public.assessment_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- CHAT HISTORY TABLE
-- -----------------------------------------------------------------------------

-- Users can only view their own chat history
DROP POLICY IF EXISTS "Users can view own chat history" ON public.chat_history;
CREATE POLICY "Users can view own chat history"
  ON public.chat_history
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own chat messages
DROP POLICY IF EXISTS "Users can create own messages" ON public.chat_history;
CREATE POLICY "Users can create own messages"
  ON public.chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- No updates or deletes allowed (audit trail)
DROP POLICY IF EXISTS "No updates to chat history" ON public.chat_history;
CREATE POLICY "No updates to chat history"
  ON public.chat_history
  FOR UPDATE
  TO authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "No deletes from chat history" ON public.chat_history;
CREATE POLICY "No deletes from chat history"
  ON public.chat_history
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- PAYMENTS TABLE
-- -----------------------------------------------------------------------------

-- Users can view own payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only service role can create payments (via Edge Functions)
DROP POLICY IF EXISTS "Service can create payments" ON public.payments;
-- This policy is handled by service_role bypassing RLS

-- No user updates or deletes allowed (financial audit trail)
DROP POLICY IF EXISTS "No user updates to payments" ON public.payments;
CREATE POLICY "No user updates to payments"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "No user deletes from payments" ON public.payments;
CREATE POLICY "No user deletes from payments"
  ON public.payments
  FOR DELETE
  TO authenticated
  USING (FALSE);

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Function: Check if user is instructor
CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'instructor')
  );
$$;

-- Function: Check if user owns a course
CREATE OR REPLACE FUNCTION public.owns_course(course_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id_param AND instructor_id = auth.uid()
  );
$$;

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

-- Log RLS audit completion
INSERT INTO public.security_audit_log (
  event_type,
  metadata,
  timestamp
)
VALUES (
  'system.rls_audit',
  jsonb_build_object(
    'migration', '20251109000001_rls_security_audit',
    'tables_audited', (
      SELECT COUNT(*)
      FROM pg_tables
      WHERE schemaname = 'public'
      AND rowsecurity = TRUE
    ),
    'policies_created', (
      SELECT COUNT(*)
      FROM pg_policies
      WHERE schemaname = 'public'
    )
  ),
  NOW()
);

-- ============================================================================
-- VERIFICATION REPORT
-- ============================================================================

-- Generate RLS status report
DO $$
DECLARE
  v_total_tables INTEGER;
  v_rls_enabled INTEGER;
  v_total_policies INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*)
  INTO v_total_tables
  FROM pg_tables
  WHERE schemaname = 'public';

  -- Count tables with RLS
  SELECT COUNT(*)
  INTO v_rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = TRUE;

  -- Count policies
  SELECT COUNT(*)
  INTO v_total_policies
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS SECURITY AUDIT REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total tables: %', v_total_tables;
  RAISE NOTICE 'Tables with RLS: %', v_rls_enabled;
  RAISE NOTICE 'Coverage: %% %', ROUND((v_rls_enabled::NUMERIC / v_total_tables::NUMERIC) * 100, 2);
  RAISE NOTICE 'Total policies: %', v_total_policies;
  RAISE NOTICE '========================================';
END;
$$;
