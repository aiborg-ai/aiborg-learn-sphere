-- ============================================================================
-- AI Chatbot Performance Monitoring System
-- ============================================================================
-- This migration adds comprehensive performance monitoring for the AI chatbot
-- including response time tracking, cost optimization metrics, and cache analytics.
-- ============================================================================

-- ============================================================================
-- 1. PERFORMANCE METRICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW chatbot_performance_metrics AS
WITH recent_messages AS (
  SELECT
    response_time_ms,
    cost_usd,
    model,
    is_error,
    is_fallback,
    created_at,
    DATE(created_at) as message_date
  FROM chatbot_messages
  WHERE role = 'assistant'
    AND created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  -- Response Time Metrics
  ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time_ms,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms)::numeric, 2) as p50_response_time_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::numeric, 2) as p95_response_time_ms,
  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms)::numeric, 2) as p99_response_time_ms,
  MIN(response_time_ms) as min_response_time_ms,
  MAX(response_time_ms) as max_response_time_ms,

  -- Cost Metrics
  ROUND(SUM(cost_usd)::numeric, 4) as total_cost_usd,
  ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_per_message_usd,
  ROUND((SUM(cost_usd) FILTER (WHERE model = 'gpt-4-turbo-preview'))::numeric, 4) as gpt4_cost_usd,
  ROUND((SUM(cost_usd) FILTER (WHERE model = 'gpt-3.5-turbo'))::numeric, 4) as gpt35_cost_usd,

  -- Model Usage
  COUNT(*) FILTER (WHERE model = 'gpt-4-turbo-preview') as gpt4_count,
  COUNT(*) FILTER (WHERE model = 'gpt-3.5-turbo') as gpt35_count,
  COUNT(*) FILTER (WHERE model = 'cached' OR cost_usd = 0) as cached_count,

  -- Error Metrics
  COUNT(*) FILTER (WHERE is_error = TRUE) as error_count,
  COUNT(*) FILTER (WHERE is_fallback = TRUE) as fallback_count,
  ROUND((COUNT(*) FILTER (WHERE is_error = TRUE)::numeric / COUNT(*)::numeric * 100), 2) as error_rate_percent,

  -- Volume
  COUNT(*) as total_messages,
  COUNT(DISTINCT message_date) as days_with_activity
FROM recent_messages;

-- Grant access to authenticated users
GRANT SELECT ON chatbot_performance_metrics TO authenticated;

-- ============================================================================
-- 2. DAILY PERFORMANCE SUMMARY
-- ============================================================================

CREATE OR REPLACE VIEW chatbot_daily_performance AS
SELECT
  DATE(created_at) as date,

  -- Response Time
  ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::numeric, 2) as p95_response_time_ms,

  -- Cost
  ROUND(SUM(cost_usd)::numeric, 4) as total_cost_usd,
  ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_per_message_usd,

  -- Model Usage
  COUNT(*) FILTER (WHERE model = 'gpt-4-turbo-preview') as gpt4_calls,
  COUNT(*) FILTER (WHERE model = 'gpt-3.5-turbo') as gpt35_calls,
  COUNT(*) FILTER (WHERE cost_usd = 0) as cached_calls,
  ROUND((COUNT(*) FILTER (WHERE cost_usd = 0)::numeric / COUNT(*)::numeric * 100), 2) as cache_hit_rate_percent,

  -- Errors
  COUNT(*) FILTER (WHERE is_error = TRUE) as errors,
  ROUND((COUNT(*) FILTER (WHERE is_error = TRUE)::numeric / COUNT(*)::numeric * 100), 2) as error_rate_percent,

  -- Volume
  COUNT(*) as total_messages
FROM chatbot_messages
WHERE role = 'assistant'
  AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant access to authenticated users
GRANT SELECT ON chatbot_daily_performance TO authenticated;

-- ============================================================================
-- 3. MODEL PERFORMANCE COMPARISON
-- ============================================================================

CREATE OR REPLACE VIEW chatbot_model_comparison AS
SELECT
  model,

  -- Volume
  COUNT(*) as total_calls,
  ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ())::numeric * 100, 2) as usage_percent,

  -- Response Time
  ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::numeric, 2) as p95_response_time_ms,

  -- Cost
  ROUND(SUM(cost_usd)::numeric, 4) as total_cost_usd,
  ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_per_call_usd,

  -- Quality
  ROUND((COUNT(*) FILTER (WHERE is_error = FALSE)::numeric / COUNT(*)::numeric * 100), 2) as success_rate_percent,

  -- Efficiency Score (lower is better: cost per successful call)
  ROUND((SUM(cost_usd) / COUNT(*) FILTER (WHERE is_error = FALSE))::numeric, 6) as cost_per_success_usd
FROM chatbot_messages
WHERE role = 'assistant'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND model IS NOT NULL
GROUP BY model
ORDER BY total_calls DESC;

-- Grant access to authenticated users
GRANT SELECT ON chatbot_model_comparison TO authenticated;

-- ============================================================================
-- 4. CACHE EFFECTIVENESS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW chatbot_cache_effectiveness AS
WITH cache_metrics AS (
  SELECT
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE cost_usd = 0) as cache_hits,
    COUNT(*) FILTER (WHERE cost_usd > 0) as cache_misses,
    COUNT(*) as total,
    ROUND(SUM(cost_usd)::numeric, 4) as actual_cost_usd
  FROM chatbot_messages
  WHERE role = 'assistant'
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
),
estimated_savings AS (
  SELECT
    date,
    cache_hits,
    cache_misses,
    total,
    actual_cost_usd,
    -- Estimate: If no cache, all would be API calls at avg $0.005 per call
    ROUND((cache_hits * 0.005)::numeric, 4) as saved_cost_usd,
    ROUND((cache_hits::numeric / total::numeric * 100), 2) as cache_hit_rate_percent
  FROM cache_metrics
)
SELECT
  date,
  cache_hits,
  cache_misses,
  total,
  cache_hit_rate_percent,
  actual_cost_usd,
  saved_cost_usd,
  ROUND((actual_cost_usd + saved_cost_usd)::numeric, 4) as estimated_cost_without_cache_usd,
  ROUND(((saved_cost_usd / (actual_cost_usd + saved_cost_usd)) * 100)::numeric, 2) as cost_reduction_percent
FROM estimated_savings
ORDER BY date DESC;

-- Grant access to authenticated users
GRANT SELECT ON chatbot_cache_effectiveness TO authenticated;

-- ============================================================================
-- 5. QUERY TYPE PERFORMANCE
-- ============================================================================

-- First, add query_type to chatbot_messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_messages'
    AND column_name = 'query_type'
  ) THEN
    ALTER TABLE chatbot_messages
    ADD COLUMN query_type TEXT;

    COMMENT ON COLUMN chatbot_messages.query_type IS
      'Type of query (greeting, pricing, technical_question, etc.)';
  END IF;
END $$;

CREATE OR REPLACE VIEW chatbot_query_type_performance AS
SELECT
  query_type,
  COUNT(*) as total_queries,

  -- Response Time
  ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time_ms,

  -- Model Selection
  COUNT(*) FILTER (WHERE model = 'gpt-4-turbo-preview') as gpt4_count,
  COUNT(*) FILTER (WHERE model = 'gpt-3.5-turbo') as gpt35_count,
  ROUND((COUNT(*) FILTER (WHERE model = 'gpt-4-turbo-preview')::numeric / COUNT(*)::numeric * 100), 2) as gpt4_usage_percent,

  -- Cost
  ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_usd,

  -- Cache Hit Rate
  COUNT(*) FILTER (WHERE cost_usd = 0) as cached_count,
  ROUND((COUNT(*) FILTER (WHERE cost_usd = 0)::numeric / COUNT(*)::numeric * 100), 2) as cache_hit_rate_percent
FROM chatbot_messages
WHERE role = 'assistant'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND query_type IS NOT NULL
GROUP BY query_type
ORDER BY total_queries DESC;

-- Grant access to authenticated users
GRANT SELECT ON chatbot_query_type_performance TO authenticated;

-- ============================================================================
-- 6. PERFORMANCE MONITORING FUNCTIONS
-- ============================================================================

-- Function to get performance summary for date range
CREATE OR REPLACE FUNCTION get_performance_summary(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  metric TEXT,
  value TEXT,
  change_percent NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_avg_time NUMERIC;
  v_previous_avg_time NUMERIC;
  v_current_cost NUMERIC;
  v_previous_cost NUMERIC;
  v_current_cache_rate NUMERIC;
  v_previous_cache_rate NUMERIC;
BEGIN
  -- Current period metrics
  SELECT
    AVG(response_time_ms),
    SUM(cost_usd),
    (COUNT(*) FILTER (WHERE cost_usd = 0)::NUMERIC / COUNT(*)::NUMERIC * 100)
  INTO v_current_avg_time, v_current_cost, v_current_cache_rate
  FROM chatbot_messages
  WHERE role = 'assistant'
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Previous period metrics (same duration before start date)
  SELECT
    AVG(response_time_ms),
    SUM(cost_usd),
    (COUNT(*) FILTER (WHERE cost_usd = 0)::NUMERIC / COUNT(*)::NUMERIC * 100)
  INTO v_previous_avg_time, v_previous_cost, v_previous_cache_rate
  FROM chatbot_messages
  WHERE role = 'assistant'
    AND created_at BETWEEN
      (p_start_date - (p_end_date - p_start_date))
      AND p_start_date;

  -- Return results
  RETURN QUERY
  SELECT 'Avg Response Time (ms)'::TEXT,
         ROUND(v_current_avg_time, 2)::TEXT,
         ROUND(((v_current_avg_time - v_previous_avg_time) / v_previous_avg_time * 100), 2)

  UNION ALL

  SELECT 'Total Cost (USD)'::TEXT,
         '$' || ROUND(v_current_cost, 4)::TEXT,
         ROUND(((v_current_cost - v_previous_cost) / v_previous_cost * 100), 2)

  UNION ALL

  SELECT 'Cache Hit Rate (%)'::TEXT,
         ROUND(v_current_cache_rate, 2)::TEXT,
         ROUND((v_current_cache_rate - v_previous_cache_rate), 2);
END;
$$;

-- Function to identify slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(
  p_threshold_ms INTEGER DEFAULT 3000,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  query_sample TEXT,
  avg_response_time_ms NUMERIC,
  occurrences INTEGER,
  model TEXT,
  audience TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUBSTRING(m1.content, 1, 100) as query_sample,
    ROUND(AVG(m2.response_time_ms)::NUMERIC, 2) as avg_response_time_ms,
    COUNT(*)::INTEGER as occurrences,
    m2.model,
    m2.audience
  FROM chatbot_messages m1
  JOIN chatbot_messages m2 ON m2.conversation_id = m1.conversation_id
    AND m2.created_at > m1.created_at
    AND m2.created_at < m1.created_at + INTERVAL '1 minute'
  WHERE m1.role = 'user'
    AND m2.role = 'assistant'
    AND m2.response_time_ms > p_threshold_ms
    AND m1.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY SUBSTRING(m1.content, 1, 100), m2.model, m2.audience
  ORDER BY AVG(m2.response_time_ms) DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- 7. PERFORMANCE ALERTS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS chatbot_performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'slow_response', 'high_cost', 'high_error_rate', 'low_cache_rate'
  )),
  threshold_value NUMERIC NOT NULL,
  actual_value NUMERIC NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Index for active alerts
CREATE INDEX idx_performance_alerts_active
  ON chatbot_performance_alerts(created_at DESC)
  WHERE resolved = FALSE;

-- Function to check performance and create alerts
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_response_time NUMERIC;
  v_error_rate NUMERIC;
  v_cache_rate NUMERIC;
  v_hourly_cost NUMERIC;
  v_alerts_created INTEGER := 0;
BEGIN
  -- Get last hour metrics
  SELECT
    AVG(response_time_ms),
    (COUNT(*) FILTER (WHERE is_error = TRUE)::NUMERIC / COUNT(*)::NUMERIC * 100),
    (COUNT(*) FILTER (WHERE cost_usd = 0)::NUMERIC / COUNT(*)::NUMERIC * 100),
    SUM(cost_usd)
  INTO v_avg_response_time, v_error_rate, v_cache_rate, v_hourly_cost
  FROM chatbot_messages
  WHERE role = 'assistant'
    AND created_at >= NOW() - INTERVAL '1 hour';

  -- Check slow response time
  IF v_avg_response_time > 5000 THEN
    INSERT INTO chatbot_performance_alerts (
      alert_type, threshold_value, actual_value, severity, message
    ) VALUES (
      'slow_response', 5000, v_avg_response_time, 'warning',
      'Average response time (' || ROUND(v_avg_response_time, 0) || 'ms) exceeds 5 seconds'
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Check high error rate
  IF v_error_rate > 5 THEN
    INSERT INTO chatbot_performance_alerts (
      alert_type, threshold_value, actual_value, severity, message
    ) VALUES (
      'high_error_rate', 5, v_error_rate, 'critical',
      'Error rate (' || ROUND(v_error_rate, 2) || '%) exceeds 5%'
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Check low cache rate
  IF v_cache_rate < 20 THEN
    INSERT INTO chatbot_performance_alerts (
      alert_type, threshold_value, actual_value, severity, message
    ) VALUES (
      'low_cache_rate', 20, v_cache_rate, 'info',
      'Cache hit rate (' || ROUND(v_cache_rate, 2) || '%) below 20%'
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Check high hourly cost
  IF v_hourly_cost > 1.00 THEN
    INSERT INTO chatbot_performance_alerts (
      alert_type, threshold_value, actual_value, severity, message
    ) VALUES (
      'high_cost', 1.00, v_hourly_cost, 'warning',
      'Hourly cost ($' || ROUND(v_hourly_cost, 4) || ') exceeds $1.00'
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  RETURN v_alerts_created;
END;
$$;

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON chatbot_performance_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_slow_queries TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Performance monitoring system created successfully';
  RAISE NOTICE 'Views available:';
  RAISE NOTICE '  - chatbot_performance_metrics';
  RAISE NOTICE '  - chatbot_daily_performance';
  RAISE NOTICE '  - chatbot_model_comparison';
  RAISE NOTICE '  - chatbot_cache_effectiveness';
  RAISE NOTICE '  - chatbot_query_type_performance';
  RAISE NOTICE 'Functions available:';
  RAISE NOTICE '  - get_performance_summary(start_date, end_date)';
  RAISE NOTICE '  - get_slow_queries(threshold_ms, limit)';
  RAISE NOTICE '  - check_performance_alerts()';
END $$;
