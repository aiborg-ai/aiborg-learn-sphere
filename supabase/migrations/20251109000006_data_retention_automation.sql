-- Data Retention Policy Automation Migration
-- Created: 2025-11-09
-- Purpose: Automated data retention and cleanup based on policies
--
-- Features:
-- - Automatic cleanup of expired data
-- - Data anonymization for analytics retention
-- - Scheduled cleanup jobs via pg_cron
-- - Audit logging for all retention actions

-- ============================================================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable pg_cron for scheduled jobs (if available)
-- Note: pg_cron requires superuser and may not be available in all environments
-- For Supabase, use Edge Functions with cron triggers instead

-- ============================================================================
-- DATA RETENTION EXECUTION FUNCTIONS
-- ============================================================================

/**
 * Execute data retention policy for a specific table
 */
CREATE OR REPLACE FUNCTION public.execute_retention_policy(
  p_table_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_policy RECORD;
  v_deleted_count INTEGER := 0;
  v_anonymized_count INTEGER := 0;
  v_cutoff_date TIMESTAMPTZ;
  v_sql TEXT;
BEGIN
  -- Get retention policy for table
  SELECT * INTO v_policy
  FROM public.data_retention_policies
  WHERE table_name = p_table_name
    AND enabled = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', format('No retention policy found for table: %s', p_table_name)
    );
  END IF;

  -- Calculate cutoff date
  v_cutoff_date := NOW() - (v_policy.retention_days || ' days')::INTERVAL;

  RAISE NOTICE 'Executing retention policy for % (cutoff: %)', p_table_name, v_cutoff_date;

  -- Execute policy based on table
  IF p_table_name = 'security_audit_log' THEN
    -- Delete old security logs
    DELETE FROM public.security_audit_log
    WHERE timestamp < v_cutoff_date;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  ELSIF p_table_name = 'failed_login_attempts' THEN
    -- Delete old failed login attempts
    DELETE FROM public.failed_login_attempts
    WHERE attempted_at < v_cutoff_date;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  ELSIF p_table_name = 'rate_limit_tracking' THEN
    -- Delete old rate limit tracking
    DELETE FROM public.rate_limit_tracking
    WHERE window_end < v_cutoff_date;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  ELSIF p_table_name = 'api_key_usage_logs' THEN
    -- Delete old API usage logs
    DELETE FROM public.api_key_usage_logs
    WHERE logged_at < v_cutoff_date;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  ELSIF p_table_name = 'user_activity_logs' THEN
    IF v_policy.anonymize_instead_of_delete THEN
      -- Anonymize instead of delete
      UPDATE public.user_activity_logs
      SET
        user_id = NULL,
        ip_address = 'anonymized',
        user_agent = 'anonymized'
      WHERE created_at < v_cutoff_date
        AND user_id IS NOT NULL;

      GET DIAGNOSTICS v_anonymized_count = ROW_COUNT;
    ELSE
      DELETE FROM public.user_activity_logs
      WHERE created_at < v_cutoff_date;

      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    END IF;

  ELSIF p_table_name = 'course_enrollments' THEN
    IF v_policy.anonymize_instead_of_delete THEN
      -- Anonymize old enrollments for analytics
      UPDATE public.enrollments
      SET user_id = NULL -- Keep enrollment stats but remove user link
      WHERE enrolled_at < v_cutoff_date
        AND user_id IS NOT NULL
        AND completed = TRUE; -- Only anonymize completed enrollments

      GET DIAGNOSTICS v_anonymized_count = ROW_COUNT;
    END IF;

  ELSE
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', format('No retention handler for table: %s', p_table_name)
    );
  END IF;

  -- Log retention execution
  INSERT INTO public.security_audit_log (
    event_type,
    severity,
    metadata,
    timestamp
  )
  VALUES (
    'data_retention.executed',
    'low',
    jsonb_build_object(
      'table_name', p_table_name,
      'cutoff_date', v_cutoff_date,
      'deleted_count', v_deleted_count,
      'anonymized_count', v_anonymized_count,
      'retention_days', v_policy.retention_days
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'table_name', p_table_name,
    'cutoff_date', v_cutoff_date,
    'deleted_count', v_deleted_count,
    'anonymized_count', v_anonymized_count
  );
END;
$$;

COMMENT ON FUNCTION public.execute_retention_policy IS
  'Executes retention policy for a specific table';

/**
 * Execute all active retention policies
 */
CREATE OR REPLACE FUNCTION public.execute_all_retention_policies()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_policy RECORD;
  v_result JSONB;
  v_results JSONB[] := ARRAY[]::JSONB[];
  v_total_deleted INTEGER := 0;
  v_total_anonymized INTEGER := 0;
  v_start_time TIMESTAMPTZ;
BEGIN
  v_start_time := NOW();

  RAISE NOTICE 'Starting retention policy execution at %', v_start_time;

  -- Execute each active policy
  FOR v_policy IN
    SELECT table_name
    FROM public.data_retention_policies
    WHERE enabled = TRUE
    ORDER BY table_name
  LOOP
    BEGIN
      v_result := public.execute_retention_policy(v_policy.table_name);
      v_results := array_append(v_results, v_result);

      -- Accumulate totals
      v_total_deleted := v_total_deleted + COALESCE((v_result->>'deleted_count')::INTEGER, 0);
      v_total_anonymized := v_total_anonymized + COALESCE((v_result->>'anonymized_count')::INTEGER, 0);

      RAISE NOTICE 'Completed retention for %: % deleted, % anonymized',
        v_policy.table_name,
        COALESCE((v_result->>'deleted_count')::INTEGER, 0),
        COALESCE((v_result->>'anonymized_count')::INTEGER, 0);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to execute retention for %: %', v_policy.table_name, SQLERRM;
        v_results := array_append(v_results, jsonb_build_object(
          'success', FALSE,
          'table_name', v_policy.table_name,
          'error', SQLERRM
        ));
    END;
  END LOOP;

  -- Log summary
  INSERT INTO public.security_audit_log (
    event_type,
    severity,
    metadata,
    timestamp
  )
  VALUES (
    'data_retention.batch_executed',
    'medium',
    jsonb_build_object(
      'start_time', v_start_time,
      'end_time', NOW(),
      'duration_seconds', EXTRACT(EPOCH FROM (NOW() - v_start_time)),
      'total_deleted', v_total_deleted,
      'total_anonymized', v_total_anonymized,
      'policies_executed', array_length(v_results, 1)
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'start_time', v_start_time,
    'end_time', NOW(),
    'total_deleted', v_total_deleted,
    'total_anonymized', v_total_anonymized,
    'results', to_jsonb(v_results)
  );
END;
$$;

COMMENT ON FUNCTION public.execute_all_retention_policies IS
  'Executes all active retention policies in batch';

/**
 * Preview retention policy impact (dry run)
 */
CREATE OR REPLACE FUNCTION public.preview_retention_policy(
  p_table_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_policy RECORD;
  v_cutoff_date TIMESTAMPTZ;
  v_count INTEGER := 0;
BEGIN
  -- Get retention policy
  SELECT * INTO v_policy
  FROM public.data_retention_policies
  WHERE table_name = p_table_name
    AND enabled = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', format('No retention policy found for table: %s', p_table_name)
    );
  END IF;

  -- Calculate cutoff
  v_cutoff_date := NOW() - (v_policy.retention_days || ' days')::INTERVAL;

  -- Count affected records based on table
  IF p_table_name = 'security_audit_log' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.security_audit_log
    WHERE timestamp < v_cutoff_date;

  ELSIF p_table_name = 'failed_login_attempts' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.failed_login_attempts
    WHERE attempted_at < v_cutoff_date;

  ELSIF p_table_name = 'rate_limit_tracking' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.rate_limit_tracking
    WHERE window_end < v_cutoff_date;

  ELSIF p_table_name = 'api_key_usage_logs' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.api_key_usage_logs
    WHERE logged_at < v_cutoff_date;

  END IF;

  RETURN jsonb_build_object(
    'table_name', p_table_name,
    'retention_days', v_policy.retention_days,
    'cutoff_date', v_cutoff_date,
    'records_affected', v_count,
    'action', CASE WHEN v_policy.anonymize_instead_of_delete THEN 'anonymize' ELSE 'delete' END,
    'enabled', v_policy.enabled
  );
END;
$$;

COMMENT ON FUNCTION public.preview_retention_policy IS
  'Previews the impact of a retention policy without executing it';

/**
 * Update retention policy
 */
CREATE OR REPLACE FUNCTION public.update_retention_policy(
  p_table_name TEXT,
  p_retention_days INTEGER,
  p_anonymize_instead_of_delete BOOLEAN DEFAULT NULL,
  p_enabled BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate inputs
  IF p_retention_days < 1 THEN
    RAISE EXCEPTION 'Retention days must be at least 1';
  END IF;

  -- Update policy
  UPDATE public.data_retention_policies
  SET
    retention_days = COALESCE(p_retention_days, retention_days),
    anonymize_instead_of_delete = COALESCE(p_anonymize_instead_of_delete, anonymize_instead_of_delete),
    enabled = COALESCE(p_enabled, enabled),
    updated_at = NOW()
  WHERE table_name = p_table_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No retention policy found for table: %', p_table_name;
  END IF;

  -- Log policy update
  INSERT INTO public.security_audit_log (
    event_type,
    severity,
    metadata,
    timestamp
  )
  VALUES (
    'data_retention.policy_updated',
    'medium',
    jsonb_build_object(
      'table_name', p_table_name,
      'retention_days', p_retention_days,
      'anonymize', p_anonymize_instead_of_delete,
      'enabled', p_enabled
    ),
    NOW()
  );

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.update_retention_policy IS
  'Updates a data retention policy configuration';

-- ============================================================================
-- ANALYTICS VIEW FOR RETENTION MONITORING
-- ============================================================================

CREATE OR REPLACE VIEW public.retention_policy_status AS
SELECT
  rp.table_name,
  rp.retention_days,
  rp.anonymize_instead_of_delete,
  rp.enabled,
  rp.description,
  rp.legal_basis,
  CASE
    WHEN rp.table_name = 'security_audit_log' THEN
      (SELECT COUNT(*) FROM public.security_audit_log
       WHERE timestamp < NOW() - (rp.retention_days || ' days')::INTERVAL)
    WHEN rp.table_name = 'failed_login_attempts' THEN
      (SELECT COUNT(*) FROM public.failed_login_attempts
       WHERE attempted_at < NOW() - (rp.retention_days || ' days')::INTERVAL)
    WHEN rp.table_name = 'rate_limit_tracking' THEN
      (SELECT COUNT(*) FROM public.rate_limit_tracking
       WHERE window_end < NOW() - (rp.retention_days || ' days')::INTERVAL)
    ELSE 0
  END as records_eligible_for_cleanup,
  rp.created_at,
  rp.updated_at
FROM public.data_retention_policies rp
ORDER BY rp.table_name;

COMMENT ON VIEW public.retention_policy_status IS
  'Real-time status of retention policies and eligible records';

-- Grant view access to admins
GRANT SELECT ON public.retention_policy_status TO authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Already enabled in previous migration for data_retention_policies table

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.execute_retention_policy(TEXT) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.execute_all_retention_policies() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.preview_retention_policy(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_retention_policy(TEXT, INTEGER, BOOLEAN, BOOLEAN) TO authenticated;

-- ============================================================================
-- INSTRUCTIONS FOR SCHEDULED EXECUTION
-- ============================================================================

-- For Supabase deployments, create an Edge Function that calls execute_all_retention_policies()
-- and trigger it via Supabase Cron (https://supabase.com/docs/guides/functions/cron)
--
-- Example Edge Function (supabase/functions/data-retention-cleanup/index.ts):
--
-- import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
--
-- Deno.serve(async () => {
--   const supabase = createClient(
--     Deno.env.get('SUPABASE_URL')!,
--     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
--   )
--
--   const { data, error } = await supabase.rpc('execute_all_retention_policies')
--
--   if (error) {
--     return new Response(JSON.stringify({ error: error.message }), { status: 500 })
--   }
--
--   return new Response(JSON.stringify(data), { status: 200 })
-- })
--
-- Then add to supabase/functions/data-retention-cleanup/cron.yml:
--
-- - cron: '0 2 * * *'  # Run daily at 2 AM UTC
--   name: 'data-retention-cleanup'

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_function_count INTEGER;
  v_view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN (
    'execute_retention_policy',
    'execute_all_retention_policies',
    'preview_retention_policy',
    'update_retention_policy'
  );

  SELECT COUNT(*) INTO v_view_count
  FROM pg_views
  WHERE viewname = 'retention_policy_status';

  IF v_function_count = 4 AND v_view_count = 1 THEN
    RAISE NOTICE 'Data retention automation migration completed successfully';
    RAISE NOTICE 'Functions: %, Views: %', v_function_count, v_view_count;
  ELSE
    RAISE EXCEPTION 'Migration incomplete: Functions: %, Views: %',
      v_function_count, v_view_count;
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
    'migration', '20251109000006_data_retention_automation',
    'description', 'Data retention automation system initialized',
    'features', jsonb_build_array(
      'Automated data cleanup based on policies',
      'Data anonymization for analytics',
      'Retention preview and monitoring',
      'Policy management functions'
    ),
    'note', 'Schedule Edge Function via Supabase Cron for automatic execution'
  ),
  NOW()
);
