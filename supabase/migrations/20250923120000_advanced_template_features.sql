-- Migration: Advanced Template Features
-- Description: Add scheduled imports, template versioning, and URL imports
-- Author: AIBorg Team
-- Date: 2025-09-23

-- ============================================
-- 1. TEMPLATE VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.template_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  schema_version INTEGER NOT NULL,
  description TEXT,

  -- Schema definitions
  course_schema JSONB,
  event_schema JSONB,

  -- Compatibility
  min_version VARCHAR(20),
  max_version VARCHAR(20),
  breaking_changes JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  is_current BOOLEAN DEFAULT FALSE,
  deprecated BOOLEAN DEFAULT FALSE,
  deprecated_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. SCHEDULED IMPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.scheduled_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Schedule configuration
  name VARCHAR(200) NOT NULL,
  description TEXT,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly')),
  scheduled_at TIMESTAMPTZ,
  cron_expression VARCHAR(100), -- For recurring schedules
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Import configuration
  import_type TEXT NOT NULL CHECK (import_type IN ('course', 'event', 'both')),
  source_type TEXT NOT NULL CHECK (source_type IN ('url', 'file', 'api')),
  source_url TEXT,
  source_config JSONB DEFAULT '{}'::jsonb,

  -- Import options
  import_options JSONB DEFAULT '{
    "skip_duplicates": true,
    "update_existing": false,
    "validate_first": true,
    "send_notifications": false
  }'::jsonb,

  -- Authentication for external sources
  auth_type TEXT CHECK (auth_type IN ('none', 'basic', 'bearer', 'api_key')),
  auth_config JSONB, -- Encrypted credentials

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  last_run_summary JSONB,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. SCHEDULED IMPORT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.scheduled_import_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_import_id UUID NOT NULL REFERENCES public.scheduled_imports(id) ON DELETE CASCADE,
  import_id UUID REFERENCES public.template_imports(id) ON DELETE SET NULL,

  -- Execution details
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),

  -- Results
  items_processed INTEGER DEFAULT 0,
  items_imported INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,

  -- Error handling
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. URL IMPORT CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.url_import_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  url_hash VARCHAR(64) NOT NULL, -- SHA256 hash of URL

  -- Cache data
  content_type VARCHAR(50),
  content_size INTEGER,
  content_hash VARCHAR(64), -- SHA256 hash of content
  parsed_data JSONB,

  -- Validation
  is_valid BOOLEAN DEFAULT TRUE,
  validation_errors JSONB,

  -- Metadata
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. EXPORT CONFIGURATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.export_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Configuration
  name VARCHAR(200) NOT NULL,
  description TEXT,
  export_type TEXT NOT NULL CHECK (export_type IN ('course', 'event', 'both')),
  format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'excel')),

  -- Filters
  filters JSONB DEFAULT '{}'::jsonb,
  -- Filters include: category, is_active, display, date_from, date_to, ids

  -- Options
  options JSONB DEFAULT '{}'::jsonb,
  -- Options include: include_inactive, include_hidden, include_materials, include_metadata

  -- Schedule (optional)
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron VARCHAR(100),
  export_destination TEXT, -- URL or email for automated exports

  -- Usage
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- Add template version tracking to imports
ALTER TABLE public.template_imports
ADD COLUMN IF NOT EXISTS template_version VARCHAR(20),
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'file' CHECK (source_type IN ('file', 'url', 'api', 'scheduled')),
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS scheduled_import_id UUID REFERENCES public.scheduled_imports(id) ON DELETE SET NULL;

-- Add CSV support tracking
ALTER TABLE public.template_imports
ADD COLUMN IF NOT EXISTS original_format TEXT DEFAULT 'json' CHECK (original_format IN ('json', 'csv', 'excel'));

-- ============================================
-- 7. INDEXES
-- ============================================

-- Template versions
CREATE INDEX idx_template_versions_current ON public.template_versions(is_current);
CREATE INDEX idx_template_versions_version ON public.template_versions(version);

-- Scheduled imports
CREATE INDEX idx_scheduled_imports_user_id ON public.scheduled_imports(user_id);
CREATE INDEX idx_scheduled_imports_active ON public.scheduled_imports(is_active);
CREATE INDEX idx_scheduled_imports_next_run ON public.scheduled_imports(next_run_at);
CREATE INDEX idx_scheduled_imports_source ON public.scheduled_imports(source_type, source_url);

-- Scheduled import logs
CREATE INDEX idx_scheduled_import_logs_import ON public.scheduled_import_logs(scheduled_import_id);
CREATE INDEX idx_scheduled_import_logs_status ON public.scheduled_import_logs(status);
CREATE INDEX idx_scheduled_import_logs_created ON public.scheduled_import_logs(created_at DESC);

-- URL cache
CREATE UNIQUE INDEX idx_url_import_cache_hash ON public.url_import_cache(url_hash);
CREATE INDEX idx_url_import_cache_expires ON public.url_import_cache(expires_at);

-- Export configurations
CREATE INDEX idx_export_configs_user ON public.export_configurations(user_id);
CREATE INDEX idx_export_configs_scheduled ON public.export_configurations(is_scheduled);

-- ============================================
-- 8. FUNCTIONS
-- ============================================

-- Function to calculate next run time for scheduled imports
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  p_schedule_type TEXT,
  p_cron_expression TEXT,
  p_timezone TEXT DEFAULT 'UTC',
  p_from_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE p_schedule_type
    WHEN 'once' THEN
      RETURN NULL; -- One-time schedules don't have next run
    WHEN 'daily' THEN
      RETURN p_from_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN p_from_time + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN p_from_time + INTERVAL '1 month';
    ELSE
      -- For cron expressions, would need additional logic
      -- For now, default to daily
      RETURN p_from_time + INTERVAL '1 day';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to execute scheduled import
CREATE OR REPLACE FUNCTION execute_scheduled_import(p_scheduled_import_id UUID)
RETURNS UUID AS $$
DECLARE
  v_import_id UUID;
  v_import_config RECORD;
  v_log_id UUID;
BEGIN
  -- Get scheduled import configuration
  SELECT * INTO v_import_config
  FROM public.scheduled_imports
  WHERE id = p_scheduled_import_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Scheduled import not found or inactive';
  END IF;

  -- Create log entry
  INSERT INTO public.scheduled_import_logs (
    scheduled_import_id,
    status,
    started_at
  ) VALUES (
    p_scheduled_import_id,
    'running',
    NOW()
  ) RETURNING id INTO v_log_id;

  -- Update scheduled import
  UPDATE public.scheduled_imports
  SET
    last_run_at = NOW(),
    last_run_status = 'running',
    run_count = run_count + 1
  WHERE id = p_scheduled_import_id;

  -- The actual import would be triggered here via edge function
  -- This is a placeholder for the import logic

  -- Calculate and set next run time
  UPDATE public.scheduled_imports
  SET next_run_at = calculate_next_run_time(
    schedule_type,
    cron_expression,
    timezone,
    NOW()
  )
  WHERE id = p_scheduled_import_id
    AND schedule_type != 'once';

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired URL cache
CREATE OR REPLACE FUNCTION clean_expired_url_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.url_import_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create URL cache
CREATE OR REPLACE FUNCTION get_or_create_url_cache(
  p_url TEXT,
  p_content JSONB DEFAULT NULL
)
RETURNS TABLE(
  cache_id UUID,
  is_cached BOOLEAN,
  cached_data JSONB
) AS $$
DECLARE
  v_url_hash VARCHAR(64);
  v_cache_record RECORD;
BEGIN
  -- Calculate URL hash
  v_url_hash := encode(sha256(p_url::bytea), 'hex');

  -- Try to get from cache
  SELECT * INTO v_cache_record
  FROM public.url_import_cache
  WHERE url_hash = v_url_hash
    AND expires_at > NOW()
    AND is_valid = TRUE;

  IF FOUND THEN
    -- Update cache hit
    UPDATE public.url_import_cache
    SET
      hit_count = hit_count + 1,
      last_accessed_at = NOW()
    WHERE id = v_cache_record.id;

    RETURN QUERY SELECT
      v_cache_record.id,
      TRUE,
      v_cache_record.parsed_data;
  ELSIF p_content IS NOT NULL THEN
    -- Create new cache entry
    INSERT INTO public.url_import_cache (
      url,
      url_hash,
      parsed_data,
      content_hash
    ) VALUES (
      p_url,
      v_url_hash,
      p_content,
      encode(sha256(p_content::text::bytea), 'hex')
    ) RETURNING id INTO v_cache_record;

    RETURN QUERY SELECT
      v_cache_record.id,
      FALSE,
      p_content;
  ELSE
    RETURN QUERY SELECT
      NULL::UUID,
      FALSE,
      NULL::JSONB;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. INSERT DEFAULT TEMPLATE VERSION
-- ============================================
INSERT INTO public.template_versions (
  version,
  schema_version,
  description,
  is_current,
  course_schema,
  event_schema
) VALUES (
  '1.0.0',
  1,
  'Initial template schema version',
  TRUE,
  '{
    "required": ["title", "description", "audiences", "mode", "duration", "price", "level", "start_date", "features", "keywords", "category"],
    "properties": {
      "title": {"type": "string", "minLength": 1, "maxLength": 200},
      "description": {"type": "string", "minLength": 10, "maxLength": 5000}
    }
  }'::jsonb,
  '{
    "required": ["title", "description", "event_type", "audiences", "date", "time", "duration", "mode", "price", "tags"],
    "properties": {
      "title": {"type": "string", "minLength": 1, "maxLength": 200},
      "description": {"type": "string", "minLength": 10, "maxLength": 5000}
    }
  }'::jsonb
) ON CONFLICT (version) DO NOTHING;

-- ============================================
-- 10. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_import_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_configurations ENABLE ROW LEVEL SECURITY;

-- Template versions (read-only for all authenticated users)
CREATE POLICY "All users can view template versions"
ON public.template_versions FOR SELECT
USING (true);

-- Scheduled imports (admin only)
CREATE POLICY "Admin users can manage scheduled imports"
ON public.scheduled_imports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Scheduled import logs (admin only)
CREATE POLICY "Admin users can view import logs"
ON public.scheduled_import_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- URL cache (admin only)
CREATE POLICY "Admin users can manage URL cache"
ON public.url_import_cache
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Export configurations (user's own configs)
CREATE POLICY "Users can manage their own export configs"
ON public.export_configurations
FOR ALL
USING (user_id = auth.uid());

-- ============================================
-- 11. TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE TRIGGER update_scheduled_imports_updated_at
BEFORE UPDATE ON public.scheduled_imports
FOR EACH ROW
EXECUTE FUNCTION trigger_update_updated_at();

CREATE TRIGGER update_template_versions_updated_at
BEFORE UPDATE ON public.template_versions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_updated_at();

CREATE TRIGGER update_export_configs_updated_at
BEFORE UPDATE ON public.export_configurations
FOR EACH ROW
EXECUTE FUNCTION trigger_update_updated_at();

-- ============================================
-- 12. GRANTS
-- ============================================

GRANT SELECT ON public.template_versions TO authenticated;
GRANT ALL ON public.scheduled_imports TO authenticated;
GRANT SELECT ON public.scheduled_import_logs TO authenticated;
GRANT ALL ON public.url_import_cache TO authenticated;
GRANT ALL ON public.export_configurations TO authenticated;

GRANT EXECUTE ON FUNCTION calculate_next_run_time TO authenticated;
GRANT EXECUTE ON FUNCTION execute_scheduled_import TO authenticated;
GRANT EXECUTE ON FUNCTION clean_expired_url_cache TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_url_cache TO authenticated;

-- ============================================
-- 13. COMMENTS
-- ============================================

COMMENT ON TABLE public.template_versions IS 'Tracks template schema versions for backward compatibility';
COMMENT ON TABLE public.scheduled_imports IS 'Configuration for scheduled template imports';
COMMENT ON TABLE public.scheduled_import_logs IS 'Execution logs for scheduled imports';
COMMENT ON TABLE public.url_import_cache IS 'Cache for URL-based imports to reduce external API calls';
COMMENT ON TABLE public.export_configurations IS 'Saved export configurations for quick re-use';