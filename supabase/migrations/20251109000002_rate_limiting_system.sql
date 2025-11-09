-- Rate Limiting System Migration
-- Created: 2025-11-09
-- Purpose: Implement rate limiting to prevent API abuse and DDoS attacks
--
-- Features:
-- - Sliding window rate limiting
-- - Per-user and per-IP tracking
-- - Configurable limits per endpoint
-- - Automatic cleanup of expired records
-- - Rate limit analytics

-- ============================================================================
-- RATE LIMIT TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier
  ON public.rate_limit_tracking(identifier);

CREATE INDEX IF NOT EXISTS idx_rate_limit_endpoint
  ON public.rate_limit_tracking(endpoint);

CREATE INDEX IF NOT EXISTS idx_rate_limit_window
  ON public.rate_limit_tracking(window_end);

-- Composite index for rate limit checks
CREATE INDEX IF NOT EXISTS idx_rate_limit_check
  ON public.rate_limit_tracking(identifier, endpoint, window_end);

COMMENT ON TABLE public.rate_limit_tracking IS
  'Tracks API request counts for rate limiting';

COMMENT ON COLUMN public.rate_limit_tracking.identifier IS
  'User ID or IP address making the request';

COMMENT ON COLUMN public.rate_limit_tracking.endpoint IS
  'API endpoint being accessed';

COMMENT ON COLUMN public.rate_limit_tracking.request_count IS
  'Number of requests in current window';

COMMENT ON COLUMN public.rate_limit_tracking.window_start IS
  'Start of the rate limit window';

COMMENT ON COLUMN public.rate_limit_tracking.window_end IS
  'End of the rate limit window';

-- ============================================================================
-- RATE LIMIT CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  max_requests INTEGER NOT NULL DEFAULT 100,
  window_seconds INTEGER NOT NULL DEFAULT 60,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_config_endpoint
  ON public.rate_limit_config(endpoint);

COMMENT ON TABLE public.rate_limit_config IS
  'Configuration for rate limits per endpoint';

-- Insert default rate limit configurations
INSERT INTO public.rate_limit_config (endpoint, max_requests, window_seconds, description) VALUES
  ('/auth/login', 5, 300, 'Login attempts - 5 per 5 minutes'),
  ('/auth/signup', 3, 3600, 'Signup attempts - 3 per hour'),
  ('/auth/reset-password', 3, 3600, 'Password reset - 3 per hour'),
  ('/api/search', 60, 60, 'Search queries - 60 per minute'),
  ('/api/chat', 30, 60, 'AI chat - 30 per minute'),
  ('/api/upload', 10, 60, 'File uploads - 10 per minute'),
  ('/api/payments', 10, 300, 'Payment requests - 10 per 5 minutes'),
  ('*', 100, 60, 'Default limit - 100 per minute')
ON CONFLICT (endpoint) DO NOTHING;

-- ============================================================================
-- RATE LIMITING FUNCTIONS
-- ============================================================================

-- Function: Check if rate limit is exceeded
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT DEFAULT '*'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config RECORD;
  v_tracking RECORD;
  v_window_end TIMESTAMPTZ;
  v_requests INTEGER := 0;
  v_is_limited BOOLEAN := FALSE;
  v_retry_after INTEGER := 0;
BEGIN
  -- Get rate limit configuration for endpoint (or default)
  SELECT max_requests, window_seconds
  INTO v_config
  FROM public.rate_limit_config
  WHERE endpoint = p_endpoint AND enabled = TRUE
  LIMIT 1;

  -- Fallback to default if endpoint not configured
  IF NOT FOUND THEN
    SELECT max_requests, window_seconds
    INTO v_config
    FROM public.rate_limit_config
    WHERE endpoint = '*' AND enabled = TRUE
    LIMIT 1;
  END IF;

  -- If no config found, allow (fail open)
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'limit', 100,
      'remaining', 99,
      'reset_at', NOW() + INTERVAL '60 seconds'
    );
  END IF;

  -- Calculate window
  v_window_end := NOW();

  -- Check current request count in window
  SELECT request_count, window_end
  INTO v_tracking
  FROM public.rate_limit_tracking
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_end > NOW()
  ORDER BY window_end DESC
  LIMIT 1;

  IF FOUND THEN
    v_requests := v_tracking.request_count;
    v_window_end := v_tracking.window_end;

    -- Check if limit exceeded
    IF v_requests >= v_config.max_requests THEN
      v_is_limited := TRUE;
      v_retry_after := EXTRACT(EPOCH FROM (v_tracking.window_end - NOW()))::INTEGER;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'allowed', NOT v_is_limited,
    'limit', v_config.max_requests,
    'remaining', GREATEST(0, v_config.max_requests - v_requests - 1),
    'reset_at', v_window_end,
    'retry_after', v_retry_after
  );
END;
$$;

COMMENT ON FUNCTION public.check_rate_limit IS
  'Checks if rate limit is exceeded for identifier and endpoint';

-- Function: Record API request (increment counter)
CREATE OR REPLACE FUNCTION public.record_api_request(
  p_identifier TEXT,
  p_endpoint TEXT DEFAULT '*'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config RECORD;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Get rate limit configuration
  SELECT max_requests, window_seconds
  INTO v_config
  FROM public.rate_limit_config
  WHERE endpoint = p_endpoint AND enabled = TRUE
  LIMIT 1;

  -- Fallback to default
  IF NOT FOUND THEN
    SELECT max_requests, window_seconds
    INTO v_config
    FROM public.rate_limit_config
    WHERE endpoint = '*' AND enabled = TRUE
    LIMIT 1;
  END IF;

  -- Set window bounds
  v_window_start := NOW();
  v_window_end := v_window_start + (v_config.window_seconds || ' seconds')::INTERVAL;

  -- Insert or update tracking record
  INSERT INTO public.rate_limit_tracking (
    identifier,
    endpoint,
    request_count,
    window_start,
    window_end
  )
  VALUES (
    p_identifier,
    p_endpoint,
    1,
    v_window_start,
    v_window_end
  )
  ON CONFLICT ON CONSTRAINT rate_limit_tracking_pkey
  DO UPDATE
  SET request_count = rate_limit_tracking.request_count + 1,
      updated_at = NOW()
  WHERE rate_limit_tracking.window_end > NOW();

  -- Return current limit status
  RETURN public.check_rate_limit(p_identifier, p_endpoint);
END;
$$;

COMMENT ON FUNCTION public.record_api_request IS
  'Records an API request and returns updated rate limit status';

-- Function: Get rate limit status without incrementing
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
  p_identifier TEXT,
  p_endpoint TEXT DEFAULT '*'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN public.check_rate_limit(p_identifier, p_endpoint);
END;
$$;

COMMENT ON FUNCTION public.get_rate_limit_status IS
  'Returns current rate limit status without incrementing counter';

-- Function: Reset rate limit for identifier
CREATE OR REPLACE FUNCTION public.reset_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_endpoint IS NULL THEN
    -- Reset all endpoints for identifier
    DELETE FROM public.rate_limit_tracking
    WHERE identifier = p_identifier;
  ELSE
    -- Reset specific endpoint
    DELETE FROM public.rate_limit_tracking
    WHERE identifier = p_identifier
      AND endpoint = p_endpoint;
  END IF;

  -- Log reset event
  INSERT INTO public.security_audit_log (
    event_type,
    metadata,
    timestamp
  )
  VALUES (
    'rate_limit.reset',
    jsonb_build_object(
      'identifier', p_identifier,
      'endpoint', COALESCE(p_endpoint, 'all')
    ),
    NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.reset_rate_limit IS
  'Resets rate limit for an identifier (admin use)';

-- Function: Cleanup expired rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete expired windows
  DELETE FROM public.rate_limit_tracking
  WHERE window_end < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Log cleanup
  IF v_deleted > 0 THEN
    RAISE NOTICE 'Rate limit cleanup: % records deleted', v_deleted;
  END IF;

  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.cleanup_rate_limits IS
  'Removes expired rate limit tracking records';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate limit data
CREATE POLICY "Admins can view rate limit tracking"
  ON public.rate_limit_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view rate limit config"
  ON public.rate_limit_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage rate limit config"
  ON public.rate_limit_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_api_request(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_rate_limit_status(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_rate_limit(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO postgres;

-- Grant table access for service role
GRANT ALL ON public.rate_limit_tracking TO service_role;
GRANT ALL ON public.rate_limit_config TO service_role;

-- ============================================================================
-- ANALYTICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.rate_limit_analytics AS
SELECT
  endpoint,
  COUNT(DISTINCT identifier) as unique_users,
  SUM(request_count) as total_requests,
  AVG(request_count) as avg_requests_per_user,
  MAX(request_count) as max_requests,
  DATE_TRUNC('hour', window_start) as hour
FROM public.rate_limit_tracking
WHERE window_end > NOW() - INTERVAL '24 hours'
GROUP BY endpoint, DATE_TRUNC('hour', window_start)
ORDER BY hour DESC, total_requests DESC;

COMMENT ON VIEW public.rate_limit_analytics IS
  'Analytics view for rate limit monitoring (last 24 hours)';

-- Grant view access to admins only
GRANT SELECT ON public.rate_limit_analytics TO authenticated;

-- ============================================================================
-- INITIAL DATA & VERIFICATION
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
    'migration', '20251109000002_rate_limiting_system',
    'description', 'Rate limiting system initialized',
    'endpoints_configured', (SELECT COUNT(*) FROM public.rate_limit_config)
  ),
  NOW()
);

-- Verify tables and functions
DO $$
DECLARE
  v_tables_count INTEGER;
  v_functions_count INTEGER;
BEGIN
  -- Check tables
  SELECT COUNT(*)
  INTO v_tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('rate_limit_tracking', 'rate_limit_config');

  -- Check functions
  SELECT COUNT(*)
  INTO v_functions_count
  FROM pg_proc
  WHERE proname IN (
    'check_rate_limit',
    'record_api_request',
    'get_rate_limit_status',
    'reset_rate_limit',
    'cleanup_rate_limits'
  );

  IF v_tables_count = 2 AND v_functions_count = 5 THEN
    RAISE NOTICE 'Rate limiting system migration completed successfully';
    RAISE NOTICE 'Tables: %, Functions: %', v_tables_count, v_functions_count;
  ELSE
    RAISE EXCEPTION 'Migration incomplete: Tables: %, Functions: %',
      v_tables_count, v_functions_count;
  END IF;
END;
$$;
