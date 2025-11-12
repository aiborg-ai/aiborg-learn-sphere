-- Quick Apply Core Security Tables
-- Apply this in Supabase SQL Editor to create all core security tables
-- This script is idempotent - safe to run multiple times

-- =============================================================================
-- 1. ACCOUNT LOCKOUT SYSTEM
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.account_lockout_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  locked_until TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email_time
  ON public.failed_login_attempts(email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_lockout_status_email
  ON public.account_lockout_status(email);

-- =============================================================================
-- 2. SECURITY AUDIT LOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  resource TEXT,
  action TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at
  ON public.security_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id
  ON public.security_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type
  ON public.security_audit_log(event_type);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. RATE LIMITING SYSTEM
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  max_requests INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_identifier_endpoint
  ON public.rate_limit_tracking(identifier, endpoint);

CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_window_end
  ON public.rate_limit_tracking(window_end);

-- Insert default rate limit configurations
INSERT INTO public.rate_limit_config (endpoint, max_requests, window_seconds) VALUES
  ('/auth/login', 5, 300),           -- 5 attempts per 5 minutes
  ('/auth/signup', 3, 3600),         -- 3 signups per hour
  ('/api/chat', 30, 60),             -- 30 requests per minute
  ('/api/generate', 10, 60),         -- 10 AI generations per minute
  ('*', 100, 60)                     -- 100 requests per minute (default)
ON CONFLICT (endpoint) DO NOTHING;

-- =============================================================================
-- 4. PII ENCRYPTION SYSTEM
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.encrypted_pii (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_encrypted BYTEA,
  address_encrypted BYTEA,
  date_of_birth_encrypted BYTEA,
  national_id_encrypted BYTEA,
  encryption_key_id UUID,
  encrypted_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT UNIQUE NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'aes-256-gcm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.pii_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  accessed_by UUID NOT NULL REFERENCES auth.users(id),
  access_type TEXT NOT NULL CHECK (access_type IN ('read', 'write', 'delete')),
  fields_accessed TEXT[],
  purpose TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_encrypted_pii_user_id
  ON public.encrypted_pii(user_id);

CREATE INDEX IF NOT EXISTS idx_pii_access_log_user_id
  ON public.pii_access_log(user_id);

CREATE INDEX IF NOT EXISTS idx_pii_access_log_accessed_at
  ON public.pii_access_log(accessed_at DESC);

-- Enable RLS
ALTER TABLE public.encrypted_pii ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pii_access_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. GDPR COMPLIANCE SYSTEM
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  UNIQUE(user_id, consent_type)
);

CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  export_format TEXT NOT NULL DEFAULT 'json' CHECK (export_format IN ('json', 'csv', 'pdf')),
  completed_at TIMESTAMPTZ,
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  data_snapshot JSONB,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id
  ON public.user_consents(user_id);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id
  ON public.data_export_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id
  ON public.data_deletion_requests(user_id);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. API KEY ROTATION SYSTEM
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read'],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  rotated_to UUID REFERENCES public.api_keys(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revocation_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.api_key_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  response_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id
  ON public.api_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash
  ON public.api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_is_active
  ON public.api_keys(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_api_key_usage_log_api_key_id
  ON public.api_key_usage_log(api_key_id);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_log_created_at
  ON public.api_key_usage_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. DATA RETENTION AUTOMATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT UNIQUE NOT NULL,
  retention_days INTEGER NOT NULL,
  date_column TEXT NOT NULL DEFAULT 'created_at',
  anonymize_instead_of_delete BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, anonymize_instead_of_delete) VALUES
  ('security_audit_log', 90, FALSE),
  ('failed_login_attempts', 30, FALSE),
  ('rate_limit_tracking', 7, FALSE),
  ('pii_access_log', 365, FALSE),
  ('api_key_usage_log', 180, FALSE),
  ('user_activity_logs', 365, TRUE)
ON CONFLICT (table_name) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Run this to verify all tables were created:
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'failed_login_attempts',
      'account_lockout_status',
      'security_audit_log',
      'rate_limit_config',
      'rate_limit_tracking',
      'encrypted_pii',
      'encryption_keys',
      'pii_access_log',
      'user_consents',
      'data_export_requests',
      'data_deletion_requests',
      'api_keys',
      'api_key_usage_log',
      'data_retention_policies'
    );

  RAISE NOTICE 'Created % out of 14 security tables', table_count;

  IF table_count = 14 THEN
    RAISE NOTICE '✅ All security tables created successfully!';
  ELSE
    RAISE WARNING '⚠️ Some tables may already exist or failed to create';
  END IF;
END $$;
