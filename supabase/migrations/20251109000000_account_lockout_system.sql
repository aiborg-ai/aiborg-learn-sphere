-- Account Lockout System Migration
-- Created: 2025-11-09
-- Purpose: Implement account lockout policy to prevent brute force attacks
--
-- Features:
-- - Track failed login attempts
-- - Automatic account lockout after 5 failed attempts
-- - 30-minute lockout duration
-- - IP address and user agent logging
-- - Automatic cleanup of old attempts

-- ============================================================================
-- FAILED LOGIN ATTEMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_failed_attempts_email
  ON public.failed_login_attempts(email);

CREATE INDEX IF NOT EXISTS idx_failed_attempts_ip
  ON public.failed_login_attempts(ip_address);

CREATE INDEX IF NOT EXISTS idx_failed_attempts_timestamp
  ON public.failed_login_attempts(attempted_at DESC);

-- Composite index for lockout checks
CREATE INDEX IF NOT EXISTS idx_failed_attempts_email_time
  ON public.failed_login_attempts(email, attempted_at DESC);

COMMENT ON TABLE public.failed_login_attempts IS
  'Tracks failed login attempts for account lockout policy';

COMMENT ON COLUMN public.failed_login_attempts.email IS
  'Email address that failed authentication';

COMMENT ON COLUMN public.failed_login_attempts.ip_address IS
  'IP address of the failed login attempt';

COMMENT ON COLUMN public.failed_login_attempts.user_agent IS
  'Browser user agent string for forensics';

COMMENT ON COLUMN public.failed_login_attempts.attempted_at IS
  'Timestamp of the failed attempt';

-- ============================================================================
-- ACCOUNT LOCKOUT STATUS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_lockout_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  locked_until TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lockout_email
  ON public.account_lockout_status(email);

CREATE INDEX IF NOT EXISTS idx_lockout_until
  ON public.account_lockout_status(locked_until);

COMMENT ON TABLE public.account_lockout_status IS
  'Current lockout status for accounts with failed attempts';

COMMENT ON COLUMN public.account_lockout_status.locked_until IS
  'Timestamp when the account lockout expires';

COMMENT ON COLUMN public.account_lockout_status.attempt_count IS
  'Number of consecutive failed attempts';

-- ============================================================================
-- SECURITY AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  resource TEXT,
  action TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_event_type
  ON public.security_audit_log(event_type);

CREATE INDEX IF NOT EXISTS idx_audit_user_id
  ON public.security_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp
  ON public.security_audit_log(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_email
  ON public.security_audit_log(email);

COMMENT ON TABLE public.security_audit_log IS
  'Comprehensive security event logging for compliance and forensics';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Record failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login_attempt(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_count INTEGER;
  v_lockout_duration INTERVAL := '30 minutes';
  v_max_attempts INTEGER := 5;
  v_locked_until TIMESTAMPTZ;
  v_is_locked BOOLEAN := FALSE;
BEGIN
  -- Insert failed attempt record
  INSERT INTO public.failed_login_attempts (email, ip_address, user_agent)
  VALUES (p_email, p_ip_address, p_user_agent);

  -- Count recent attempts (within lockout window)
  SELECT COUNT(*)
  INTO v_attempt_count
  FROM public.failed_login_attempts
  WHERE email = p_email
    AND attempted_at > NOW() - v_lockout_duration;

  -- Check if account should be locked
  IF v_attempt_count >= v_max_attempts THEN
    v_is_locked := TRUE;
    v_locked_until := NOW() + v_lockout_duration;

    -- Insert or update lockout status
    INSERT INTO public.account_lockout_status (
      email,
      locked_until,
      attempt_count,
      last_attempt_at
    )
    VALUES (
      p_email,
      v_locked_until,
      v_attempt_count,
      NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET locked_until = v_locked_until,
        attempt_count = v_attempt_count,
        last_attempt_at = NOW(),
        updated_at = NOW();

    -- Log lockout event
    INSERT INTO public.security_audit_log (
      event_type,
      email,
      ip_address,
      user_agent,
      metadata,
      timestamp
    )
    VALUES (
      'auth.lockout',
      p_email,
      p_ip_address,
      p_user_agent,
      jsonb_build_object(
        'attempt_count', v_attempt_count,
        'locked_until', v_locked_until
      ),
      NOW()
    );
  END IF;

  RETURN jsonb_build_object(
    'is_locked', v_is_locked,
    'attempt_count', v_attempt_count,
    'locked_until', v_locked_until,
    'max_attempts', v_max_attempts
  );
END;
$$;

COMMENT ON FUNCTION public.record_failed_login_attempt IS
  'Records a failed login attempt and applies lockout policy if threshold exceeded';

-- Function: Check if account is locked
CREATE OR REPLACE FUNCTION public.check_account_lockout(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lockout_record RECORD;
  v_is_locked BOOLEAN := FALSE;
  v_locked_until TIMESTAMPTZ;
  v_attempt_count INTEGER := 0;
BEGIN
  -- Check lockout status
  SELECT locked_until, attempt_count
  INTO v_lockout_record
  FROM public.account_lockout_status
  WHERE email = p_email
    AND locked_until > NOW();

  IF FOUND THEN
    v_is_locked := TRUE;
    v_locked_until := v_lockout_record.locked_until;
    v_attempt_count := v_lockout_record.attempt_count;
  END IF;

  RETURN jsonb_build_object(
    'is_locked', v_is_locked,
    'locked_until', v_locked_until,
    'attempt_count', v_attempt_count,
    'retry_after_seconds', CASE
      WHEN v_is_locked THEN EXTRACT(EPOCH FROM (v_locked_until - NOW()))::INTEGER
      ELSE 0
    END
  );
END;
$$;

COMMENT ON FUNCTION public.check_account_lockout IS
  'Checks if an account is currently locked due to failed login attempts';

-- Function: Clear failed attempts (after successful login)
CREATE OR REPLACE FUNCTION public.clear_failed_login_attempts(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete failed attempt records
  DELETE FROM public.failed_login_attempts
  WHERE email = p_email;

  -- Remove lockout status
  DELETE FROM public.account_lockout_status
  WHERE email = p_email;

  -- Log successful login
  INSERT INTO public.security_audit_log (
    event_type,
    email,
    timestamp
  )
  VALUES (
    'auth.success',
    p_email,
    NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.clear_failed_login_attempts IS
  'Clears failed login attempts after successful authentication';

-- ============================================================================
-- AUTOMATIC CLEANUP
-- ============================================================================

-- Function: Cleanup old records
CREATE OR REPLACE FUNCTION public.cleanup_old_security_records()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete failed attempts older than 24 hours
  DELETE FROM public.failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';

  -- Delete expired lockout status
  DELETE FROM public.account_lockout_status
  WHERE locked_until < NOW() - INTERVAL '1 hour';

  -- Delete old audit logs (keep 90 days)
  DELETE FROM public.security_audit_log
  WHERE timestamp < NOW() - INTERVAL '90 days';

  -- Log cleanup
  RAISE NOTICE 'Security records cleanup completed';
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_security_records IS
  'Removes old security records to maintain database performance';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all security tables
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lockout_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies: Only admins can view security logs
CREATE POLICY "Admins can view failed login attempts"
  ON public.failed_login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view lockout status"
  ON public.account_lockout_status
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view security audit log"
  ON public.security_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can perform all operations (for Edge Functions)
-- This is handled automatically by Supabase service_role bypassing RLS

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.record_failed_login_attempt(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_account_lockout(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_failed_login_attempts(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_security_records() TO postgres;

-- Grant table access for service role
GRANT ALL ON public.failed_login_attempts TO service_role;
GRANT ALL ON public.account_lockout_status TO service_role;
GRANT ALL ON public.security_audit_log TO service_role;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Log migration completion
INSERT INTO public.security_audit_log (
  event_type,
  metadata,
  timestamp
)
VALUES (
  'system.migration',
  jsonb_build_object(
    'migration', '20251109000000_account_lockout_system',
    'description', 'Account lockout system initialized'
  ),
  NOW()
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
DO $$
DECLARE
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'failed_login_attempts',
      'account_lockout_status',
      'security_audit_log'
    );

  IF v_table_count = 3 THEN
    RAISE NOTICE 'Account lockout system migration completed successfully';
  ELSE
    RAISE EXCEPTION 'Migration incomplete: Only % of 3 tables created', v_table_count;
  END IF;
END;
$$;
