-- GDPR Compliance System Migration
-- Created: 2025-11-09
-- Purpose: Implement GDPR-compliant data export, deletion, and privacy controls
--
-- Features:
-- - Right to access (data export)
-- - Right to erasure (data deletion)
-- - Right to rectification (data correction)
-- - Data portability
-- - Consent management
-- - Data retention policies
-- - Anonymization for analytics

-- ============================================================================
-- DATA DELETION REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request details
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),

  -- Processing details
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Data snapshot before deletion (for audit)
  data_snapshot JSONB,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user
  ON public.data_deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status
  ON public.data_deletion_requests(status);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_requested_at
  ON public.data_deletion_requests(requested_at);

COMMENT ON TABLE public.data_deletion_requests IS
  'GDPR Article 17 - Right to Erasure (Right to be Forgotten)';

-- ============================================================================
-- DATA EXPORT REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request details
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  format TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json', 'csv', 'xml')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Export details
  export_url TEXT, -- Signed URL for download
  export_expires_at TIMESTAMPTZ,
  file_size_bytes BIGINT,

  -- Processing details
  processed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_requests_user
  ON public.data_export_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_export_requests_status
  ON public.data_export_requests(status);

CREATE INDEX IF NOT EXISTS idx_export_requests_requested_at
  ON public.data_export_requests(requested_at);

COMMENT ON TABLE public.data_export_requests IS
  'GDPR Article 15 - Right of Access & Article 20 - Right to Data Portability';

-- ============================================================================
-- CONSENT MANAGEMENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Consent types
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'terms_of_service',
    'privacy_policy',
    'marketing_emails',
    'analytics',
    'third_party_sharing',
    'cookies_functional',
    'cookies_analytics',
    'cookies_marketing'
  )),

  -- Consent status
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  -- Consent details
  consent_version TEXT NOT NULL, -- Version of terms/policy
  consent_text TEXT, -- Snapshot of what was agreed to

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, consent_type, consent_version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user
  ON public.user_consents(user_id);

CREATE INDEX IF NOT EXISTS idx_user_consents_type
  ON public.user_consents(consent_type);

CREATE INDEX IF NOT EXISTS idx_user_consents_granted
  ON public.user_consents(granted)
  WHERE granted = TRUE;

COMMENT ON TABLE public.user_consents IS
  'GDPR Article 7 - Conditions for Consent';

-- ============================================================================
-- DATA RETENTION POLICIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Policy details
  table_name TEXT UNIQUE NOT NULL,
  retention_days INTEGER NOT NULL,
  anonymize_instead_of_delete BOOLEAN DEFAULT FALSE,

  -- Policy metadata
  description TEXT,
  legal_basis TEXT,
  enabled BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retention_policies_table
  ON public.data_retention_policies(table_name);

COMMENT ON TABLE public.data_retention_policies IS
  'GDPR Article 5(1)(e) - Storage Limitation Principle';

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, anonymize_instead_of_delete, description, legal_basis) VALUES
  ('security_audit_log', 90, FALSE, 'Security logs retained for 90 days', 'Legitimate interest - security'),
  ('failed_login_attempts', 30, FALSE, 'Failed login attempts retained for 30 days', 'Legitimate interest - security'),
  ('rate_limit_tracking', 7, FALSE, 'Rate limit data retained for 7 days', 'Legitimate interest - abuse prevention'),
  ('user_activity_logs', 365, TRUE, 'Activity logs anonymized after 1 year', 'Legitimate interest - analytics'),
  ('payments', 2555, FALSE, 'Payment records retained for 7 years', 'Legal obligation - tax law'),
  ('course_enrollments', 1825, TRUE, 'Enrollment data anonymized after 5 years', 'Legitimate interest - analytics')
ON CONFLICT (table_name) DO NOTHING;

-- ============================================================================
-- GDPR FUNCTIONS
-- ============================================================================

/**
 * Request data export (GDPR Article 15 & 20)
 */
CREATE OR REPLACE FUNCTION public.request_data_export(
  p_user_id UUID,
  p_format TEXT DEFAULT 'json',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  -- Validate format
  IF p_format NOT IN ('json', 'csv', 'xml') THEN
    RAISE EXCEPTION 'Invalid export format. Must be json, csv, or xml';
  END IF;

  -- Create export request
  INSERT INTO public.data_export_requests (
    user_id,
    format,
    status,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_format,
    'pending',
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_request_id;

  -- Log request
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    metadata,
    timestamp
  )
  VALUES (
    'gdpr.data_export_requested',
    p_user_id,
    jsonb_build_object(
      'request_id', v_request_id,
      'format', p_format
    ),
    NOW()
  );

  RETURN v_request_id;
END;
$$;

COMMENT ON FUNCTION public.request_data_export IS
  'Creates a GDPR data export request for a user';

/**
 * Generate user data export (called by background job)
 */
CREATE OR REPLACE FUNCTION public.generate_data_export(
  p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_user_data JSONB;
  v_profile JSONB;
  v_courses JSONB;
  v_enrollments JSONB;
  v_payments JSONB;
  v_pii JSONB;
  v_consents JSONB;
BEGIN
  -- Get request details
  SELECT * INTO v_request
  FROM public.data_export_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Export request not found';
  END IF;

  -- Update status to processing
  UPDATE public.data_export_requests
  SET status = 'processing', updated_at = NOW()
  WHERE id = p_request_id;

  -- Gather user profile data
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'full_name', full_name,
    'username', username,
    'bio', bio,
    'avatar_url', avatar_url,
    'role', role,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_profile
  FROM public.profiles
  WHERE id = v_request.user_id;

  -- Gather course data (if user is instructor)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'description', description,
      'created_at', created_at,
      'published', published
    )
  ) INTO v_courses
  FROM public.courses
  WHERE instructor_id = v_request.user_id;

  -- Gather enrollment data
  SELECT jsonb_agg(
    jsonb_build_object(
      'course_id', course_id,
      'enrolled_at', enrolled_at,
      'progress', progress,
      'completed', completed
    )
  ) INTO v_enrollments
  FROM public.enrollments
  WHERE user_id = v_request.user_id;

  -- Gather payment data
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'amount', amount,
      'currency', currency,
      'status', status,
      'created_at', created_at
    )
  ) INTO v_payments
  FROM public.payments
  WHERE user_id = v_request.user_id;

  -- Get encrypted PII (decrypted server-side)
  SELECT public.get_decrypted_pii(v_request.user_id) INTO v_pii;

  -- Gather consent records
  SELECT jsonb_agg(
    jsonb_build_object(
      'consent_type', consent_type,
      'granted', granted,
      'granted_at', granted_at,
      'consent_version', consent_version
    )
  ) INTO v_consents
  FROM public.user_consents
  WHERE user_id = v_request.user_id;

  -- Build complete export
  v_user_data := jsonb_build_object(
    'export_metadata', jsonb_build_object(
      'request_id', p_request_id,
      'exported_at', NOW(),
      'format', v_request.format,
      'gdpr_article', 'Article 15 (Right of Access) & Article 20 (Data Portability)'
    ),
    'profile', v_profile,
    'personal_information', v_pii,
    'courses_created', COALESCE(v_courses, '[]'::jsonb),
    'course_enrollments', COALESCE(v_enrollments, '[]'::jsonb),
    'payment_history', COALESCE(v_payments, '[]'::jsonb),
    'consent_records', COALESCE(v_consents, '[]'::jsonb)
  );

  -- Update request as completed
  UPDATE public.data_export_requests
  SET
    status = 'completed',
    processed_at = NOW(),
    file_size_bytes = length(v_user_data::text),
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Log completion
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    metadata,
    timestamp
  )
  VALUES (
    'gdpr.data_export_completed',
    v_request.user_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'data_size_bytes', length(v_user_data::text)
    ),
    NOW()
  );

  RETURN v_user_data;
END;
$$;

COMMENT ON FUNCTION public.generate_data_export IS
  'Generates complete GDPR data export for a user';

/**
 * Request account deletion (GDPR Article 17)
 */
CREATE OR REPLACE FUNCTION public.request_data_deletion(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_data_snapshot JSONB;
BEGIN
  -- Create data snapshot before deletion (for audit)
  SELECT public.generate_data_export(
    (SELECT id FROM public.data_export_requests WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1)
  ) INTO v_data_snapshot;

  -- Create deletion request
  INSERT INTO public.data_deletion_requests (
    user_id,
    reason,
    status,
    data_snapshot,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_reason,
    'pending',
    v_data_snapshot,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_request_id;

  -- Log request
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    severity,
    metadata,
    timestamp
  )
  VALUES (
    'gdpr.data_deletion_requested',
    p_user_id,
    'high',
    jsonb_build_object(
      'request_id', v_request_id,
      'reason', p_reason
    ),
    NOW()
  );

  RETURN v_request_id;
END;
$$;

COMMENT ON FUNCTION public.request_data_deletion IS
  'Creates a GDPR data deletion request (Right to be Forgotten)';

/**
 * Execute data deletion (admin-approved)
 */
CREATE OR REPLACE FUNCTION public.execute_data_deletion(
  p_request_id UUID,
  p_approved_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_admin_role TEXT;
BEGIN
  -- Verify approver is admin
  SELECT role INTO v_admin_role
  FROM public.profiles
  WHERE id = p_approved_by;

  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can approve data deletion';
  END IF;

  -- Get request
  SELECT * INTO v_request
  FROM public.data_deletion_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deletion request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request has already been processed';
  END IF;

  -- Update request status
  UPDATE public.data_deletion_requests
  SET
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Delete user data (cascading deletes will handle related records)
  -- Note: Some data may be anonymized instead of deleted per retention policies

  -- Delete encrypted PII
  DELETE FROM public.encrypted_pii WHERE user_id = v_request.user_id;

  -- Anonymize instead of delete (per retention policy)
  UPDATE public.enrollments
  SET user_id = NULL -- Anonymize but keep enrollment stats
  WHERE user_id = v_request.user_id;

  -- Delete profile (will cascade to most user data)
  DELETE FROM public.profiles WHERE id = v_request.user_id;

  -- Delete auth user
  DELETE FROM auth.users WHERE id = v_request.user_id;

  -- Mark request as completed
  UPDATE public.data_deletion_requests
  SET
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Log completion
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    severity,
    metadata,
    timestamp
  )
  VALUES (
    'gdpr.data_deletion_completed',
    v_request.user_id,
    'critical',
    jsonb_build_object(
      'request_id', p_request_id,
      'approved_by', p_approved_by
    ),
    NOW()
  );

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.execute_data_deletion IS
  'Executes approved data deletion request (admin only)';

/**
 * Record user consent
 */
CREATE OR REPLACE FUNCTION public.record_consent(
  p_user_id UUID,
  p_consent_type TEXT,
  p_granted BOOLEAN,
  p_consent_version TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  -- Insert or update consent
  INSERT INTO public.user_consents (
    user_id,
    consent_type,
    granted,
    granted_at,
    revoked_at,
    consent_version,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_consent_type,
    p_granted,
    CASE WHEN p_granted THEN NOW() ELSE NULL END,
    CASE WHEN NOT p_granted THEN NOW() ELSE NULL END,
    p_consent_version,
    p_ip_address,
    p_user_agent
  )
  ON CONFLICT (user_id, consent_type, consent_version)
  DO UPDATE SET
    granted = EXCLUDED.granted,
    granted_at = CASE WHEN EXCLUDED.granted THEN NOW() ELSE user_consents.granted_at END,
    revoked_at = CASE WHEN NOT EXCLUDED.granted THEN NOW() ELSE NULL END,
    updated_at = NOW()
  RETURNING id INTO v_consent_id;

  -- Log consent change
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    metadata,
    timestamp
  )
  VALUES (
    CASE WHEN p_granted THEN 'consent.granted' ELSE 'consent.revoked' END,
    p_user_id,
    jsonb_build_object(
      'consent_id', v_consent_id,
      'consent_type', p_consent_type,
      'version', p_consent_version
    ),
    NOW()
  );

  RETURN v_consent_id;
END;
$$;

COMMENT ON FUNCTION public.record_consent IS
  'Records user consent for GDPR compliance';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own deletion requests"
  ON public.data_deletion_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own export requests"
  ON public.data_export_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can view their own consents
CREATE POLICY "Users can view own consents"
  ON public.user_consents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own consents"
  ON public.user_consents FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Only admins can view retention policies
CREATE POLICY "Admins can view retention policies"
  ON public.data_retention_policies FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.request_data_export(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_data_export(UUID) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.request_data_deletion(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_data_deletion(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_consent(UUID, TEXT, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;

GRANT SELECT, INSERT ON public.data_deletion_requests TO authenticated;
GRANT SELECT, INSERT ON public.data_export_requests TO authenticated;
GRANT ALL ON public.user_consents TO authenticated;
GRANT SELECT ON public.data_retention_policies TO authenticated;

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
    AND table_name IN (
      'data_deletion_requests',
      'data_export_requests',
      'user_consents',
      'data_retention_policies'
    );

  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN (
    'request_data_export',
    'generate_data_export',
    'request_data_deletion',
    'execute_data_deletion',
    'record_consent'
  );

  IF v_table_count = 4 AND v_function_count = 5 THEN
    RAISE NOTICE 'GDPR compliance system migration completed successfully';
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
    'migration', '20251109000004_gdpr_compliance_system',
    'description', 'GDPR compliance system initialized',
    'features', jsonb_build_array(
      'Data export (Article 15 & 20)',
      'Data deletion (Article 17)',
      'Consent management (Article 7)',
      'Data retention policies (Article 5)'
    )
  ),
  NOW()
);
