-- Performance Monitoring System
-- Real User Monitoring (RUM) and Web Vitals tracking

-- =====================================================
-- 1. PERFORMANCE METRICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metric details
  metric_name TEXT NOT NULL CHECK (metric_name IN ('CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB')),
  metric_value DECIMAL(10,2) NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),

  -- Context
  url TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  connection_type TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_session ON public.performance_metrics(session_id);
CREATE INDEX idx_performance_metrics_user ON public.performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_name ON public.performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_created ON public.performance_metrics(created_at DESC);

COMMENT ON TABLE public.performance_metrics IS
'Tracks individual Core Web Vitals metrics from real users';

-- =====================================================
-- 2. PERFORMANCE REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.performance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Page context
  url TEXT NOT NULL,

  -- Web Vitals
  metrics JSONB DEFAULT '{}'::jsonb,
  custom_metrics JSONB DEFAULT '[]'::jsonb,
  device_info JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_reports_user ON public.performance_reports(user_id);
CREATE INDEX idx_performance_reports_url ON public.performance_reports(url);
CREATE INDEX idx_performance_reports_created ON public.performance_reports(created_at DESC);

COMMENT ON TABLE public.performance_reports IS
'Aggregated performance reports per session';

-- =====================================================
-- 3. ERROR REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.error_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Error details
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT NOT NULL,
  line INTEGER,
  column INTEGER,
  user_agent TEXT,

  -- Status
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_reports_session ON public.error_reports(session_id);
CREATE INDEX idx_error_reports_user ON public.error_reports(user_id);
CREATE INDEX idx_error_reports_created ON public.error_reports(created_at DESC);
CREATE INDEX idx_error_reports_resolved ON public.error_reports(resolved) WHERE NOT resolved;

COMMENT ON TABLE public.error_reports IS
'Tracks JavaScript errors and unhandled rejections from users';

-- =====================================================
-- 4. RUM SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.rum_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Session details
  start_time TIMESTAMPTZ NOT NULL,
  last_activity_time TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (last_activity_time - start_time)) * 1000) STORED,

  -- Metrics
  page_views INTEGER DEFAULT 0,
  interactions INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,

  -- Data
  interaction_data JSONB DEFAULT '[]'::jsonb,
  api_calls JSONB DEFAULT '[]'::jsonb,

  -- Location (from IP)
  country TEXT,
  city TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rum_sessions_user ON public.rum_sessions(user_id);
CREATE INDEX idx_rum_sessions_start ON public.rum_sessions(start_time DESC);
CREATE INDEX idx_rum_sessions_duration ON public.rum_sessions(duration_ms DESC);

COMMENT ON TABLE public.rum_sessions IS
'Real User Monitoring session data with interactions and metrics';

-- =====================================================
-- 5. PERFORMANCE BUDGETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.performance_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Budget definition
  metric_name TEXT NOT NULL CHECK (metric_name IN ('CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB', 'bundle-size', 'api-time')),
  good_threshold DECIMAL(10,2) NOT NULL,
  poor_threshold DECIMAL(10,2) NOT NULL,

  -- Target
  target_url TEXT, -- NULL means all pages
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'all')) DEFAULT 'all',

  -- Alert settings
  alert_enabled BOOLEAN DEFAULT TRUE,
  alert_recipients TEXT[], -- Email addresses

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_budgets_metric ON public.performance_budgets(metric_name);
CREATE INDEX idx_performance_budgets_active ON public.performance_budgets(is_active) WHERE is_active;

COMMENT ON TABLE public.performance_budgets IS
'Performance budgets and alerting thresholds';

-- =====================================================
-- 6. PERFORMANCE ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.performance_budgets(id) ON DELETE CASCADE,

  -- Alert details
  metric_name TEXT NOT NULL,
  actual_value DECIMAL(10,2) NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),

  -- Context
  url TEXT,
  session_id TEXT,

  -- Status
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_alerts_budget ON public.performance_alerts(budget_id);
CREATE INDEX idx_performance_alerts_created ON public.performance_alerts(created_at DESC);
CREATE INDEX idx_performance_alerts_ack ON public.performance_alerts(acknowledged) WHERE NOT acknowledged;

COMMENT ON TABLE public.performance_alerts IS
'Tracks performance budget violations and alerts';

-- =====================================================
-- 7. VIEWS FOR REPORTING
-- =====================================================

-- Average metrics by page
CREATE OR REPLACE VIEW performance_by_page AS
SELECT
  url,
  COUNT(*) as total_sessions,
  AVG((metrics->>'cls')::decimal) as avg_cls,
  AVG((metrics->>'fcp')::decimal) as avg_fcp,
  AVG((metrics->>'fid')::decimal) as avg_fid,
  AVG((metrics->>'inp')::decimal) as avg_inp,
  AVG((metrics->>'lcp')::decimal) as avg_lcp,
  AVG((metrics->>'ttfb')::decimal) as avg_ttfb,
  COUNT(*) FILTER (WHERE (metrics->>'lcp')::decimal > 4000) as poor_lcp_count,
  COUNT(*) FILTER (WHERE (metrics->>'cls')::decimal > 0.25) as poor_cls_count
FROM public.performance_reports
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY url
ORDER BY total_sessions DESC;

COMMENT ON VIEW performance_by_page IS
'Performance metrics aggregated by page URL';

-- Error summary
CREATE OR REPLACE VIEW error_summary AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_errors,
  COUNT(DISTINCT user_id) as affected_users,
  COUNT(DISTINCT session_id) as affected_sessions,
  COUNT(*) FILTER (WHERE resolved) as resolved_count,
  array_agg(DISTINCT message ORDER BY message) as error_types
FROM public.error_reports
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

COMMENT ON VIEW error_summary IS
'Daily error summary with affected users and sessions';

-- User session summary
CREATE OR REPLACE VIEW user_session_summary AS
SELECT
  user_id,
  COUNT(*) as total_sessions,
  AVG(duration_ms) as avg_session_duration,
  SUM(page_views) as total_page_views,
  SUM(interactions) as total_interactions,
  SUM(errors) as total_errors,
  MAX(last_activity_time) as last_seen
FROM public.rum_sessions
WHERE start_time > NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY total_sessions DESC;

COMMENT ON VIEW user_session_summary IS
'User engagement summary from RUM sessions';

-- =====================================================
-- 8. FUNCTIONS
-- =====================================================

-- Check performance budgets
CREATE OR REPLACE FUNCTION check_performance_budget(
  p_metric_name TEXT,
  p_value DECIMAL,
  p_url TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT 'all'
)
RETURNS TABLE (
  violated BOOLEAN,
  budget_id UUID,
  severity TEXT,
  threshold DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN p_value >= pb.poor_threshold THEN TRUE
      WHEN p_value >= pb.good_threshold THEN TRUE
      ELSE FALSE
    END as violated,
    pb.id as budget_id,
    CASE
      WHEN p_value >= pb.poor_threshold THEN 'critical'
      WHEN p_value >= pb.good_threshold THEN 'warning'
      ELSE 'ok'
    END as severity,
    CASE
      WHEN p_value >= pb.poor_threshold THEN pb.poor_threshold
      WHEN p_value >= pb.good_threshold THEN pb.good_threshold
      ELSE NULL
    END as threshold
  FROM public.performance_budgets pb
  WHERE pb.metric_name = p_metric_name
    AND pb.is_active = TRUE
    AND pb.alert_enabled = TRUE
    AND (pb.target_url IS NULL OR pb.target_url = p_url)
    AND (pb.device_type = 'all' OR pb.device_type = p_device_type)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create alerts
CREATE OR REPLACE FUNCTION create_performance_alert()
RETURNS TRIGGER AS $$
DECLARE
  budget_check RECORD;
BEGIN
  -- Check if metric violates any budget
  SELECT * INTO budget_check
  FROM check_performance_budget(
    NEW.metric_name,
    NEW.metric_value,
    NEW.url,
    NEW.device_type
  )
  WHERE violated = TRUE;

  -- Create alert if budget violated
  IF FOUND THEN
    INSERT INTO public.performance_alerts (
      budget_id,
      metric_name,
      actual_value,
      threshold_value,
      severity,
      url,
      session_id
    ) VALUES (
      budget_check.budget_id,
      NEW.metric_name,
      NEW.metric_value,
      budget_check.threshold,
      budget_check.severity,
      NEW.url,
      NEW.session_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_performance_alert
  AFTER INSERT ON public.performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION create_performance_alert();

-- =====================================================
-- 9. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rum_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on performance_metrics"
  ON public.performance_metrics FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on performance_reports"
  ON public.performance_reports FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on error_reports"
  ON public.error_reports FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on rum_sessions"
  ON public.rum_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to insert their own data
CREATE POLICY "Users can insert own metrics"
  ON public.performance_metrics FOR INSERT
  WITH CHECK (TRUE); -- Open for anonymous metrics

CREATE POLICY "Users can insert own reports"
  ON public.performance_reports FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can insert own errors"
  ON public.error_reports FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can insert own sessions"
  ON public.rum_sessions FOR INSERT
  WITH CHECK (TRUE);

-- Admins can view all
CREATE POLICY "Admins view all performance_metrics"
  ON public.performance_metrics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins view all error_reports"
  ON public.error_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Admins manage budgets
CREATE POLICY "Admins manage budgets"
  ON public.performance_budgets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins manage alerts"
  ON public.performance_alerts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- =====================================================
-- 10. INITIAL DATA
-- =====================================================

-- Set default performance budgets
INSERT INTO public.performance_budgets (metric_name, good_threshold, poor_threshold, device_type, alert_recipients)
VALUES
  ('LCP', 2500, 4000, 'all', ARRAY['admin@example.com']),
  ('FID', 100, 300, 'all', ARRAY['admin@example.com']),
  ('CLS', 0.1, 0.25, 'all', ARRAY['admin@example.com']),
  ('FCP', 1800, 3000, 'all', ARRAY['admin@example.com']),
  ('TTFB', 800, 1800, 'all', ARRAY['admin@example.com'])
ON CONFLICT DO NOTHING;
