-- API Key Rotation System Migration
-- Created: 2025-11-09
-- Purpose: Implement secure API key management with rotation support
--
-- Features:
-- - Secure API key generation and storage
-- - Key rotation without downtime
-- - Usage tracking and analytics
-- - Automatic expiration
-- - Rate limiting per key

-- ============================================================================
-- API KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Key details
  key_name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash of the API key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "sk_test_")

  -- Key permissions and scopes
  scopes TEXT[] DEFAULT ARRAY['read']::TEXT[], -- e.g., ['read', 'write', 'admin']
  allowed_origins TEXT[], -- CORS origins allowed to use this key

  -- Key lifecycle
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  rotated_to UUID REFERENCES public.api_keys(id), -- Points to replacement key

  -- Usage limits
  rate_limit_per_hour INTEGER DEFAULT 1000,
  requests_count BIGINT DEFAULT 0,

  -- Metadata
  ip_address TEXT, -- IP that created the key
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user
  ON public.api_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON public.api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix
  ON public.api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS idx_api_keys_active
  ON public.api_keys(is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_api_keys_expires
  ON public.api_keys(expires_at)
  WHERE expires_at IS NOT NULL;

COMMENT ON TABLE public.api_keys IS
  'API keys for programmatic access with rotation support';

COMMENT ON COLUMN public.api_keys.key_hash IS
  'SHA-256 hash of the API key for secure storage';

COMMENT ON COLUMN public.api_keys.key_prefix IS
  'Displayable prefix for key identification (e.g., sk_live_abc12345)';

COMMENT ON COLUMN public.api_keys.scopes IS
  'Permissions granted to this API key';

-- ============================================================================
-- API KEY USAGE LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,

  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,

  -- Security details
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,

  -- Timestamp
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_key
  ON public.api_key_usage_logs(api_key_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_logged_at
  ON public.api_key_usage_logs(logged_at);

-- Partition by month for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_logged_at_month
  ON public.api_key_usage_logs(api_key_id, DATE_TRUNC('month', logged_at));

COMMENT ON TABLE public.api_key_usage_logs IS
  'Detailed usage logs for API keys';

-- ============================================================================
-- API KEY FUNCTIONS
-- ============================================================================

/**
 * Generate a secure random API key
 * Format: sk_{env}_{random_32_chars}
 */
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_random_bytes BYTEA;
  v_random_string TEXT;
  v_env TEXT;
BEGIN
  -- Generate 32 random bytes
  v_random_bytes := gen_random_bytes(32);

  -- Convert to base64url-safe string
  v_random_string := encode(v_random_bytes, 'base64');
  v_random_string := REPLACE(v_random_string, '/', '_');
  v_random_string := REPLACE(v_random_string, '+', '-');
  v_random_string := REPLACE(v_random_string, '=', '');
  v_random_string := SUBSTRING(v_random_string, 1, 32);

  -- Get environment (default to 'live')
  v_env := COALESCE(current_setting('app.settings.environment', TRUE), 'live');

  -- Return formatted key
  RETURN 'sk_' || v_env || '_' || v_random_string;
END;
$$;

COMMENT ON FUNCTION public.generate_api_key IS
  'Generates a cryptographically secure API key';

/**
 * Hash API key for storage (SHA-256)
 */
CREATE OR REPLACE FUNCTION public.hash_api_key(
  p_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
IMMUTABLE
AS $$
BEGIN
  RETURN encode(digest(p_key, 'sha256'), 'hex');
END;
$$;

COMMENT ON FUNCTION public.hash_api_key IS
  'Hashes API key using SHA-256 for secure storage';

/**
 * Create new API key
 */
CREATE OR REPLACE FUNCTION public.create_api_key(
  p_user_id UUID,
  p_key_name TEXT,
  p_scopes TEXT[] DEFAULT ARRAY['read']::TEXT[],
  p_expires_in_days INTEGER DEFAULT 90,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_api_key TEXT;
  v_key_hash TEXT;
  v_key_prefix TEXT;
  v_key_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Validate inputs
  IF p_key_name IS NULL OR LENGTH(TRIM(p_key_name)) = 0 THEN
    RAISE EXCEPTION 'Key name is required';
  END IF;

  IF array_length(p_scopes, 1) IS NULL OR array_length(p_scopes, 1) = 0 THEN
    RAISE EXCEPTION 'At least one scope is required';
  END IF;

  -- Generate API key
  v_api_key := public.generate_api_key();
  v_key_hash := public.hash_api_key(v_api_key);
  v_key_prefix := SUBSTRING(v_api_key, 1, 16) || '...';

  -- Calculate expiration
  IF p_expires_in_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  END IF;

  -- Store key (only hash, never plaintext)
  INSERT INTO public.api_keys (
    user_id,
    key_name,
    key_hash,
    key_prefix,
    scopes,
    expires_at,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_key_name,
    v_key_hash,
    v_key_prefix,
    p_scopes,
    v_expires_at,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_key_id;

  -- Log key creation
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    metadata,
    timestamp
  )
  VALUES (
    'api_key.created',
    p_user_id,
    jsonb_build_object(
      'key_id', v_key_id,
      'key_name', p_key_name,
      'key_prefix', v_key_prefix,
      'scopes', p_scopes,
      'expires_at', v_expires_at
    ),
    NOW()
  );

  -- Return key details (plaintext key only returned once!)
  RETURN jsonb_build_object(
    'key_id', v_key_id,
    'api_key', v_api_key, -- ONLY TIME THIS IS VISIBLE!
    'key_prefix', v_key_prefix,
    'scopes', p_scopes,
    'expires_at', v_expires_at,
    'warning', 'Store this key securely. It will not be shown again.'
  );
END;
$$;

COMMENT ON FUNCTION public.create_api_key IS
  'Creates a new API key (plaintext only returned once)';

/**
 * Validate API key and return user context
 */
CREATE OR REPLACE FUNCTION public.validate_api_key(
  p_api_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_key_hash TEXT;
  v_key RECORD;
  v_is_valid BOOLEAN := FALSE;
BEGIN
  -- Hash the provided key
  v_key_hash := public.hash_api_key(p_api_key);

  -- Find matching key
  SELECT * INTO v_key
  FROM public.api_keys
  WHERE key_hash = v_key_hash
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

  IF FOUND THEN
    v_is_valid := TRUE;

    -- Update last used timestamp and increment counter
    UPDATE public.api_keys
    SET
      last_used_at = NOW(),
      requests_count = requests_count + 1,
      updated_at = NOW()
    WHERE id = v_key.id;

    -- Return validation result with user context
    RETURN jsonb_build_object(
      'valid', TRUE,
      'user_id', v_key.user_id,
      'key_id', v_key.id,
      'scopes', v_key.scopes,
      'rate_limit', v_key.rate_limit_per_hour
    );
  ELSE
    -- Log invalid attempt
    INSERT INTO public.security_audit_log (
      event_type,
      severity,
      metadata,
      timestamp
    )
    VALUES (
      'api_key.validation_failed',
      'medium',
      jsonb_build_object(
        'key_hash_prefix', SUBSTRING(v_key_hash, 1, 8)
      ),
      NOW()
    );

    RETURN jsonb_build_object(
      'valid', FALSE,
      'error', 'Invalid or expired API key'
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.validate_api_key IS
  'Validates an API key and returns user context';

/**
 * Rotate API key (create replacement, mark old as rotated)
 */
CREATE OR REPLACE FUNCTION public.rotate_api_key(
  p_old_key_id UUID,
  p_grace_period_days INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_key RECORD;
  v_new_key_result JSONB;
  v_new_key_id UUID;
BEGIN
  -- Get old key details
  SELECT * INTO v_old_key
  FROM public.api_keys
  WHERE id = p_old_key_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'API key not found';
  END IF;

  -- Create new key with same settings
  v_new_key_result := public.create_api_key(
    v_old_key.user_id,
    v_old_key.key_name || ' (rotated)',
    v_old_key.scopes,
    90, -- Default 90-day expiration
    NULL,
    NULL
  );

  v_new_key_id := (v_new_key_result->>'key_id')::UUID;

  -- Mark old key as rotated (keep active for grace period)
  UPDATE public.api_keys
  SET
    rotated_to = v_new_key_id,
    expires_at = NOW() + (p_grace_period_days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_old_key_id;

  -- Log rotation
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    metadata,
    timestamp
  )
  VALUES (
    'api_key.rotated',
    v_old_key.user_id,
    jsonb_build_object(
      'old_key_id', p_old_key_id,
      'new_key_id', v_new_key_id,
      'grace_period_days', p_grace_period_days
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'old_key_id', p_old_key_id,
    'new_key', v_new_key_result,
    'grace_period_days', p_grace_period_days,
    'old_key_expires_at', NOW() + (p_grace_period_days || ' days')::INTERVAL
  );
END;
$$;

COMMENT ON FUNCTION public.rotate_api_key IS
  'Rotates an API key with a grace period for the old key';

/**
 * Revoke API key immediately
 */
CREATE OR REPLACE FUNCTION public.revoke_api_key(
  p_key_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key RECORD;
BEGIN
  -- Get key details
  SELECT * INTO v_key
  FROM public.api_keys
  WHERE id = p_key_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'API key not found or access denied';
  END IF;

  -- Deactivate key
  UPDATE public.api_keys
  SET
    is_active = FALSE,
    updated_at = NOW()
  WHERE id = p_key_id;

  -- Log revocation
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    severity,
    metadata,
    timestamp
  )
  VALUES (
    'api_key.revoked',
    p_user_id,
    'medium',
    jsonb_build_object(
      'key_id', p_key_id,
      'key_name', v_key.key_name
    ),
    NOW()
  );

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.revoke_api_key IS
  'Immediately revokes an API key';

/**
 * Log API key usage
 */
CREATE OR REPLACE FUNCTION public.log_api_key_usage(
  p_api_key_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referer TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.api_key_usage_logs (
    api_key_id,
    endpoint,
    method,
    status_code,
    response_time_ms,
    ip_address,
    user_agent,
    referer
  )
  VALUES (
    p_api_key_id,
    p_endpoint,
    p_method,
    p_status_code,
    p_response_time_ms,
    p_ip_address,
    p_user_agent,
    p_referer
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION public.log_api_key_usage IS
  'Logs API key usage for analytics and security';

-- ============================================================================
-- CLEANUP FUNCTION FOR EXPIRED KEYS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_api_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deactivated INTEGER;
BEGIN
  -- Deactivate expired keys
  UPDATE public.api_keys
  SET
    is_active = FALSE,
    updated_at = NOW()
  WHERE expires_at < NOW()
    AND is_active = TRUE;

  GET DIAGNOSTICS v_deactivated = ROW_COUNT;

  IF v_deactivated > 0 THEN
    RAISE NOTICE 'Deactivated % expired API keys', v_deactivated;
  END IF;

  RETURN v_deactivated;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_api_keys IS
  'Automatically deactivates expired API keys';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own keys
CREATE POLICY "Users can view own API keys"
  ON public.api_keys FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own keys
CREATE POLICY "Users can create own API keys"
  ON public.api_keys FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own keys
CREATE POLICY "Users can update own API keys"
  ON public.api_keys FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own keys
CREATE POLICY "Users can delete own API keys"
  ON public.api_keys FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Users can view usage logs for their keys
CREATE POLICY "Users can view own API key usage"
  ON public.api_key_usage_logs FOR SELECT TO authenticated
  USING (
    api_key_id IN (
      SELECT id FROM public.api_keys WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.generate_api_key() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hash_api_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_api_key(UUID, TEXT, TEXT[], INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_api_key(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_api_key(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_api_key(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_api_key_usage(UUID, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_api_keys() TO postgres;

GRANT ALL ON public.api_keys TO authenticated;
GRANT ALL ON public.api_key_usage_logs TO authenticated;

-- ============================================================================
-- ANALYTICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.api_key_analytics AS
SELECT
  ak.id as key_id,
  ak.key_name,
  ak.key_prefix,
  ak.user_id,
  ak.scopes,
  ak.created_at,
  ak.last_used_at,
  ak.requests_count,
  COUNT(aul.id) as logged_requests,
  AVG(aul.response_time_ms) as avg_response_time_ms,
  COUNT(CASE WHEN aul.status_code >= 400 THEN 1 END) as error_count,
  COUNT(CASE WHEN aul.logged_at > NOW() - INTERVAL '24 hours' THEN 1 END) as requests_last_24h
FROM public.api_keys ak
LEFT JOIN public.api_key_usage_logs aul ON ak.id = aul.api_key_id
GROUP BY ak.id, ak.key_name, ak.key_prefix, ak.user_id, ak.scopes, ak.created_at, ak.last_used_at, ak.requests_count;

COMMENT ON VIEW public.api_key_analytics IS
  'Analytics view for API key usage and performance';

GRANT SELECT ON public.api_key_analytics TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_table_count INTEGER;
  v_function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('api_keys', 'api_key_usage_logs');

  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN (
    'generate_api_key',
    'hash_api_key',
    'create_api_key',
    'validate_api_key',
    'rotate_api_key',
    'revoke_api_key',
    'log_api_key_usage',
    'cleanup_expired_api_keys'
  );

  IF v_table_count = 2 AND v_function_count = 8 THEN
    RAISE NOTICE 'API key rotation system migration completed successfully';
    RAISE NOTICE 'Tables: %, Functions: %', v_table_count, v_function_count;
  ELSE
    RAISE EXCEPTION 'Migration incomplete: Tables: %, Functions: %',
      v_table_count, v_function_count;
  END IF;
END;
$$;

-- Log migration completion
INSERT INTO public.security_audit_log (
  event_type,
  metadata,
  timestamp
)
VALUES (
  'system.migration',
  jsonb_build_object(
    'migration', '20251109000005_api_key_rotation_system',
    'description', 'API key rotation system initialized',
    'features', jsonb_build_array(
      'Secure key generation with SHA-256 hashing',
      'Key rotation with grace period',
      'Usage tracking and analytics',
      'Automatic expiration',
      'Scope-based permissions'
    )
  ),
  NOW()
);
