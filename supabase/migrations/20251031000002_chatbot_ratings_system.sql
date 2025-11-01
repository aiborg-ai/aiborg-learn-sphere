-- ============================================================================
-- AI Chatbot Ratings System
-- ============================================================================
-- This migration creates the infrastructure for collecting and analyzing
-- user ratings of chatbot responses to improve AI quality over time.
--
-- Features:
-- - User ratings (thumbs up/down) with optional feedback
-- - Rating analytics by model, cache status, and query type
-- - Trend analysis for response quality improvements
-- - Integration with existing performance monitoring
-- ============================================================================

-- ============================================================================
-- 1. CHATBOT RATINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chatbot_ratings (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  message_id UUID, -- References chatbot_messages(id) but we store as UUID for flexibility

  -- User Information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous users

  -- Rating Data
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  feedback TEXT, -- Optional user feedback for negative ratings

  -- Context (denormalized for analytics)
  model TEXT, -- Which AI model was used
  cache_hit BOOLEAN DEFAULT FALSE,
  cache_source TEXT CHECK (cache_source IN ('memory', 'database-exact', 'database-fuzzy')),
  response_time_ms INTEGER,
  cost_usd NUMERIC(10, 6),
  query_type TEXT,
  audience TEXT,

  -- Query Information (for pattern analysis)
  user_query TEXT, -- The original user question
  ai_response_length INTEGER, -- Length of AI response in characters

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_response_time CHECK (response_time_ms >= 0),
  CONSTRAINT valid_cost CHECK (cost_usd >= 0)
);

-- ============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for finding ratings by conversation
CREATE INDEX IF NOT EXISTS idx_ratings_conversation
  ON chatbot_ratings(conversation_id, created_at DESC);

-- Index for finding ratings by user
CREATE INDEX IF NOT EXISTS idx_ratings_user
  ON chatbot_ratings(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Index for analytics by model
CREATE INDEX IF NOT EXISTS idx_ratings_model
  ON chatbot_ratings(model, rating, created_at DESC);

-- Index for cache performance analysis
CREATE INDEX IF NOT EXISTS idx_ratings_cache
  ON chatbot_ratings(cache_hit, rating, created_at DESC);

-- Index for query type analysis
CREATE INDEX IF NOT EXISTS idx_ratings_query_type
  ON chatbot_ratings(query_type, rating, created_at DESC);

-- Index for audience analysis
CREATE INDEX IF NOT EXISTS idx_ratings_audience
  ON chatbot_ratings(audience, rating, created_at DESC);

-- Index for recent ratings
CREATE INDEX IF NOT EXISTS idx_ratings_recent
  ON chatbot_ratings(created_at DESC);

-- Full text search on feedback
CREATE INDEX IF NOT EXISTS idx_ratings_feedback_search
  ON chatbot_ratings USING gin(to_tsvector('english', COALESCE(feedback, '')))
  WHERE feedback IS NOT NULL;

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE chatbot_ratings ENABLE ROW LEVEL SECURITY;

-- Users can view their own ratings
CREATE POLICY "Users can view own ratings"
  ON chatbot_ratings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own ratings
CREATE POLICY "Users can insert own ratings"
  ON chatbot_ratings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own ratings (within 24 hours)
CREATE POLICY "Users can update own recent ratings"
  ON chatbot_ratings FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Admin can view all ratings
CREATE POLICY "Admin can view all ratings"
  ON chatbot_ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can manage all ratings
CREATE POLICY "Service role can manage ratings"
  ON chatbot_ratings FOR ALL
  TO service_role
  USING (true);

-- Anonymous users can insert ratings (with session_id)
CREATE POLICY "Anonymous can insert ratings"
  ON chatbot_ratings FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);

-- ============================================================================
-- 4. RATING ANALYTICS VIEWS
-- ============================================================================

-- Overall rating statistics
CREATE OR REPLACE VIEW chatbot_rating_summary AS
SELECT
  COUNT(*) as total_ratings,
  COUNT(*) FILTER (WHERE rating = 'positive') as positive_ratings,
  COUNT(*) FILTER (WHERE rating = 'negative') as negative_ratings,
  ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as positive_rate_percent,
  COUNT(*) FILTER (WHERE feedback IS NOT NULL) as ratings_with_feedback,
  COUNT(DISTINCT user_id) as unique_raters,
  COUNT(DISTINCT session_id) FILTER (WHERE user_id IS NULL) as anonymous_raters,
  MIN(created_at) as first_rating,
  MAX(created_at) as latest_rating
FROM chatbot_ratings
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Rating statistics by model
CREATE OR REPLACE VIEW chatbot_rating_by_model AS
SELECT
  model,
  COUNT(*) as total_ratings,
  COUNT(*) FILTER (WHERE rating = 'positive') as positive,
  COUNT(*) FILTER (WHERE rating = 'negative') as negative,
  ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as positive_rate_percent,
  ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time_ms,
  ROUND(AVG(cost_usd)::NUMERIC, 6) as avg_cost_usd,
  COUNT(*) FILTER (WHERE feedback IS NOT NULL) as feedback_count
FROM chatbot_ratings
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND model IS NOT NULL
GROUP BY model
ORDER BY total_ratings DESC;

-- Cache performance ratings
CREATE OR REPLACE VIEW chatbot_rating_by_cache AS
WITH cache_ratings AS (
  SELECT
    CASE
      WHEN cache_hit = TRUE THEN 'Cached'
      ELSE 'API Call'
    END as response_type,
    cache_source,
    rating,
    response_time_ms
  FROM chatbot_ratings
  WHERE created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  response_type,
  cache_source,
  COUNT(*) as total_ratings,
  COUNT(*) FILTER (WHERE rating = 'positive') as positive,
  COUNT(*) FILTER (WHERE rating = 'negative') as negative,
  ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as positive_rate_percent,
  ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time_ms
FROM cache_ratings
GROUP BY response_type, cache_source
ORDER BY total_ratings DESC;

-- Daily rating trends
CREATE OR REPLACE VIEW chatbot_rating_trends AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_ratings,
  COUNT(*) FILTER (WHERE rating = 'positive') as positive,
  COUNT(*) FILTER (WHERE rating = 'negative') as negative,
  ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as positive_rate_percent,
  ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time_ms,
  COUNT(*) FILTER (WHERE feedback IS NOT NULL) as feedback_count
FROM chatbot_ratings
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Rating statistics by query type
CREATE OR REPLACE VIEW chatbot_rating_by_query_type AS
SELECT
  query_type,
  COUNT(*) as total_ratings,
  COUNT(*) FILTER (WHERE rating = 'positive') as positive,
  COUNT(*) FILTER (WHERE rating = 'negative') as negative,
  ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as positive_rate_percent,
  ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time_ms,
  COUNT(*) FILTER (WHERE cache_hit = TRUE) as cached_responses,
  ROUND((COUNT(*) FILTER (WHERE cache_hit = TRUE)::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as cache_rate_percent
FROM chatbot_ratings
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND query_type IS NOT NULL
GROUP BY query_type
ORDER BY total_ratings DESC;

-- Rating statistics by audience
CREATE OR REPLACE VIEW chatbot_rating_by_audience AS
SELECT
  audience,
  COUNT(*) as total_ratings,
  COUNT(*) FILTER (WHERE rating = 'positive') as positive,
  COUNT(*) FILTER (WHERE rating = 'negative') as negative,
  ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as positive_rate_percent,
  COUNT(*) FILTER (WHERE feedback IS NOT NULL) as feedback_count
FROM chatbot_ratings
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND audience IS NOT NULL
GROUP BY audience
ORDER BY total_ratings DESC;

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get recent negative feedback
CREATE OR REPLACE FUNCTION get_recent_negative_feedback(
  p_limit INTEGER DEFAULT 20,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  rating_id UUID,
  created_at TIMESTAMPTZ,
  model TEXT,
  query_type TEXT,
  user_query TEXT,
  feedback TEXT,
  response_time_ms INTEGER,
  cache_hit BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as rating_id,
    r.created_at,
    r.model,
    r.query_type,
    r.user_query,
    r.feedback,
    r.response_time_ms,
    r.cache_hit
  FROM chatbot_ratings r
  WHERE r.rating = 'negative'
    AND r.feedback IS NOT NULL
    AND r.created_at >= NOW() - INTERVAL '1 day' * p_days
  ORDER BY r.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to analyze rating quality correlation
CREATE OR REPLACE FUNCTION analyze_rating_quality_factors()
RETURNS TABLE (
  factor TEXT,
  positive_rate NUMERIC,
  avg_response_time NUMERIC,
  sample_size BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Response time impact
  SELECT
    'Fast Response (<1s)'::TEXT as factor,
    ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as positive_rate,
    ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time,
    COUNT(*) as sample_size
  FROM chatbot_ratings
  WHERE response_time_ms < 1000
    AND created_at >= NOW() - INTERVAL '30 days'

  UNION ALL

  SELECT
    'Medium Response (1-3s)'::TEXT,
    ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2),
    ROUND(AVG(response_time_ms)::NUMERIC, 2),
    COUNT(*)
  FROM chatbot_ratings
  WHERE response_time_ms BETWEEN 1000 AND 3000
    AND created_at >= NOW() - INTERVAL '30 days'

  UNION ALL

  SELECT
    'Slow Response (>3s)'::TEXT,
    ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2),
    ROUND(AVG(response_time_ms)::NUMERIC, 2),
    COUNT(*)
  FROM chatbot_ratings
  WHERE response_time_ms > 3000
    AND created_at >= NOW() - INTERVAL '30 days'

  UNION ALL

  -- Cache impact
  SELECT
    'Cached Response'::TEXT,
    ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2),
    ROUND(AVG(response_time_ms)::NUMERIC, 2),
    COUNT(*)
  FROM chatbot_ratings
  WHERE cache_hit = TRUE
    AND created_at >= NOW() - INTERVAL '30 days'

  UNION ALL

  SELECT
    'API Response'::TEXT,
    ROUND((COUNT(*) FILTER (WHERE rating = 'positive')::NUMERIC / COUNT(*)::NUMERIC * 100), 2),
    ROUND(AVG(response_time_ms)::NUMERIC, 2),
    COUNT(*)
  FROM chatbot_ratings
  WHERE cache_hit = FALSE
    AND created_at >= NOW() - INTERVAL '30 days'

  ORDER BY sample_size DESC;
END;
$$;

-- Function to get rating improvement suggestions
CREATE OR REPLACE FUNCTION get_rating_improvement_suggestions()
RETURNS TABLE (
  issue_type TEXT,
  severity TEXT,
  description TEXT,
  affected_count BIGINT,
  recommendation TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_slow_response_count BIGINT;
  v_negative_gpt4_count BIGINT;
  v_low_cache_rating_count BIGINT;
BEGIN
  -- Check for slow responses with negative ratings
  SELECT COUNT(*) INTO v_slow_response_count
  FROM chatbot_ratings
  WHERE response_time_ms > 5000
    AND rating = 'negative'
    AND created_at >= NOW() - INTERVAL '7 days';

  IF v_slow_response_count > 5 THEN
    RETURN QUERY SELECT
      'slow_response'::TEXT,
      'high'::TEXT,
      'Many users rated slow responses negatively'::TEXT,
      v_slow_response_count,
      'Consider optimizing API timeouts, adding more aggressive caching, or improving network performance'::TEXT;
  END IF;

  -- Check for GPT-4 overuse with negative ratings
  SELECT COUNT(*) INTO v_negative_gpt4_count
  FROM chatbot_ratings
  WHERE model = 'gpt-4-turbo-preview'
    AND rating = 'negative'
    AND created_at >= NOW() - INTERVAL '7 days';

  IF v_negative_gpt4_count > 10 THEN
    RETURN QUERY SELECT
      'expensive_model_negative'::TEXT,
      'medium'::TEXT,
      'GPT-4 responses getting negative ratings'::TEXT,
      v_negative_gpt4_count,
      'Review query classification - some complex queries may be better handled by GPT-3.5 or need better prompts'::TEXT;
  END IF;

  -- Check for low cache rating
  SELECT COUNT(*) INTO v_low_cache_rating_count
  FROM chatbot_ratings
  WHERE cache_hit = TRUE
    AND rating = 'negative'
    AND created_at >= NOW() - INTERVAL '7 days';

  IF v_low_cache_rating_count > 5 THEN
    RETURN QUERY SELECT
      'cache_quality'::TEXT,
      'medium'::TEXT,
      'Cached responses receiving negative ratings'::TEXT,
      v_low_cache_rating_count,
      'Review cached responses for staleness or accuracy - consider shorter TTL or invalidation rules'::TEXT;
  END IF;

  RETURN;
END;
$$;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON chatbot_rating_summary TO authenticated;
GRANT SELECT ON chatbot_rating_by_model TO authenticated;
GRANT SELECT ON chatbot_rating_by_cache TO authenticated;
GRANT SELECT ON chatbot_rating_trends TO authenticated;
GRANT SELECT ON chatbot_rating_by_query_type TO authenticated;
GRANT SELECT ON chatbot_rating_by_audience TO authenticated;

GRANT EXECUTE ON FUNCTION get_recent_negative_feedback TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_rating_quality_factors TO authenticated;
GRANT EXECUTE ON FUNCTION get_rating_improvement_suggestions TO authenticated;

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE chatbot_ratings IS
  'Stores user ratings (thumbs up/down) for AI chatbot responses with context for quality analysis';

COMMENT ON COLUMN chatbot_ratings.rating IS
  'User rating: positive (thumbs up) or negative (thumbs down)';

COMMENT ON COLUMN chatbot_ratings.feedback IS
  'Optional user feedback text, especially valuable for negative ratings';

COMMENT ON COLUMN chatbot_ratings.model IS
  'Which AI model generated the response (gpt-4-turbo-preview, gpt-3.5-turbo, cached, fallback)';

COMMENT ON COLUMN chatbot_ratings.cache_hit IS
  'Whether the response came from cache (true) or was generated by API call (false)';

COMMENT ON COLUMN chatbot_ratings.user_query IS
  'The original user question - stored for pattern analysis of poorly rated queries';

COMMENT ON VIEW chatbot_rating_summary IS
  'Overall rating statistics for the last 30 days';

COMMENT ON VIEW chatbot_rating_by_model IS
  'Rating breakdown by AI model to identify which models perform best';

COMMENT ON VIEW chatbot_rating_by_cache IS
  'Rating comparison between cached and API-generated responses';

COMMENT ON FUNCTION get_recent_negative_feedback IS
  'Retrieves recent negative ratings with user feedback for quality improvement';

COMMENT ON FUNCTION analyze_rating_quality_factors IS
  'Analyzes correlation between response characteristics (speed, cache) and rating quality';

COMMENT ON FUNCTION get_rating_improvement_suggestions IS
  'Automated suggestions for improving chatbot quality based on rating patterns';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Chatbot ratings system created successfully';
  RAISE NOTICE 'Views available:';
  RAISE NOTICE '  - chatbot_rating_summary';
  RAISE NOTICE '  - chatbot_rating_by_model';
  RAISE NOTICE '  - chatbot_rating_by_cache';
  RAISE NOTICE '  - chatbot_rating_trends';
  RAISE NOTICE '  - chatbot_rating_by_query_type';
  RAISE NOTICE '  - chatbot_rating_by_audience';
  RAISE NOTICE 'Functions available:';
  RAISE NOTICE '  - get_recent_negative_feedback(limit, days)';
  RAISE NOTICE '  - analyze_rating_quality_factors()';
  RAISE NOTICE '  - get_rating_improvement_suggestions()';
END $$;
