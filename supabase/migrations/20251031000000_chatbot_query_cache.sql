-- ============================================================================
-- Chatbot Query Caching System
-- ============================================================================
-- This migration creates the infrastructure for caching common chatbot queries
-- to reduce API costs and improve response times.
--
-- Features:
-- - Persistent query cache with automatic expiration
-- - Hit count tracking for cache optimization
-- - Query type categorization
-- - Audience-specific caching
-- - Cache statistics and monitoring
-- ============================================================================

-- ============================================================================
-- 1. QUERY CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chatbot_query_cache (
  -- Primary Key
  cache_key TEXT PRIMARY KEY,

  -- Query Information
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  response TEXT NOT NULL,

  -- Context
  audience TEXT NOT NULL CHECK (audience IN ('primary', 'secondary', 'professional', 'business', 'default')),
  query_type TEXT CHECK (query_type IN (
    'greeting', 'pricing', 'course_recommendation', 'course_details',
    'technical_question', 'scheduling', 'support', 'enrollment', 'general', 'unknown'
  )),

  -- API Metadata
  model_used TEXT DEFAULT 'gpt-4-turbo-preview',

  -- Cache Management
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Constraints
  CONSTRAINT valid_hit_count CHECK (hit_count >= 0),
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- ============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for finding exact normalized query matches
CREATE INDEX IF NOT EXISTS idx_chatbot_cache_normalized
  ON chatbot_query_cache(normalized_query, audience, expires_at);

-- Index for finding queries by audience and expiry
CREATE INDEX IF NOT EXISTS idx_chatbot_cache_audience_expiry
  ON chatbot_query_cache(audience, expires_at DESC);

-- Index for finding most popular queries
CREATE INDEX IF NOT EXISTS idx_chatbot_cache_hit_count
  ON chatbot_query_cache(hit_count DESC)
  WHERE expires_at > NOW();

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_chatbot_cache_expired
  ON chatbot_query_cache(expires_at)
  WHERE expires_at < NOW();

-- Index for query type analytics
CREATE INDEX IF NOT EXISTS idx_chatbot_cache_query_type
  ON chatbot_query_cache(query_type, hit_count DESC);

-- Full text search index on queries
CREATE INDEX IF NOT EXISTS idx_chatbot_cache_query_search
  ON chatbot_query_cache USING gin(to_tsvector('english', query));

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function to increment cache hit count
CREATE OR REPLACE FUNCTION increment_cache_hit_count(p_cache_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE chatbot_query_cache
  SET hit_count = hit_count + 1
  WHERE cache_key = p_cache_key
    AND expires_at > NOW();
END;
$$;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_statistics(
  p_audience TEXT DEFAULT NULL,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  metric TEXT,
  value NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_entries'::TEXT, COUNT(*)::NUMERIC
  FROM chatbot_query_cache
  WHERE (p_audience IS NULL OR audience = p_audience)
    AND expires_at > NOW()

  UNION ALL

  SELECT 'total_hits'::TEXT, COALESCE(SUM(hit_count), 0)::NUMERIC
  FROM chatbot_query_cache
  WHERE (p_audience IS NULL OR audience = p_audience)
    AND expires_at > NOW()

  UNION ALL

  SELECT 'entries_last_24h'::TEXT, COUNT(*)::NUMERIC
  FROM chatbot_query_cache
  WHERE (p_audience IS NULL OR audience = p_audience)
    AND created_at >= NOW() - INTERVAL '1 hour' * p_hours

  UNION ALL

  SELECT 'avg_hit_count'::TEXT, COALESCE(AVG(hit_count), 0)::NUMERIC
  FROM chatbot_query_cache
  WHERE (p_audience IS NULL OR audience = p_audience)
    AND expires_at > NOW()
    AND hit_count > 0;
END;
$$;

-- Function to get top cached queries
CREATE OR REPLACE FUNCTION get_top_cached_queries(
  p_limit INTEGER DEFAULT 10,
  p_audience TEXT DEFAULT NULL
)
RETURNS TABLE (
  query TEXT,
  audience TEXT,
  query_type TEXT,
  hit_count INTEGER,
  model_used TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.query,
    c.audience,
    c.query_type,
    c.hit_count,
    c.model_used,
    c.created_at
  FROM chatbot_query_cache c
  WHERE (p_audience IS NULL OR c.audience = p_audience)
    AND c.expires_at > NOW()
  ORDER BY c.hit_count DESC
  LIMIT p_limit;
END;
$$;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM chatbot_query_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 4. SCHEDULED CLEANUP (via pg_cron if available)
-- ============================================================================

-- Note: This requires pg_cron extension
-- Run this manually if pg_cron is available:
--
-- SELECT cron.schedule(
--   'cleanup-chatbot-cache',
--   '0 2 * * *', -- Daily at 2 AM
--   'SELECT cleanup_expired_cache();'
-- );

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE chatbot_query_cache ENABLE ROW LEVEL SECURITY;

-- Admin can view all cache entries
CREATE POLICY "Admin can view all cache entries"
  ON chatbot_query_cache FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can manage cache
CREATE POLICY "Service role can manage cache"
  ON chatbot_query_cache FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- 6. MONITORING VIEW
-- ============================================================================

CREATE OR REPLACE VIEW chatbot_cache_health AS
SELECT
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries,
  COALESCE(SUM(hit_count), 0) as total_hits,
  COALESCE(AVG(hit_count) FILTER (WHERE hit_count > 0), 0) as avg_hits_per_entry,
  COUNT(*) FILTER (WHERE hit_count = 0 AND expires_at > NOW()) as unused_entries,
  COUNT(DISTINCT audience) as audiences_count,
  COUNT(DISTINCT query_type) as query_types_count,
  pg_size_pretty(pg_total_relation_size('chatbot_query_cache')) as table_size
FROM chatbot_query_cache;

-- Grant access to view
GRANT SELECT ON chatbot_cache_health TO authenticated;

-- ============================================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert some common queries for testing
-- These can be removed in production
INSERT INTO chatbot_query_cache (
  cache_key,
  query,
  normalized_query,
  response,
  audience,
  query_type,
  model_used,
  expires_at
) VALUES
  (
    'primary:hello123',
    'Hello! What can you help me with?',
    'can hello help me what with you',
    'Hi there! 🎉 I''m your AI learning buddy! I can help you discover awesome AI courses, answer questions about how AI works, and guide you on your learning journey. What would you like to know?',
    'primary',
    'greeting',
    'gpt-3.5-turbo',
    NOW() + INTERVAL '7 days'
  ),
  (
    'professional:ai-basics456',
    'What is machine learning?',
    'is learning machine what',
    'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It uses algorithms to identify patterns in data and make predictions or decisions. There are three main types: supervised learning (learning from labeled data), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through trial and error). Would you like to explore our Machine Learning for Business course to dive deeper?',
    'professional',
    'technical_question',
    'gpt-4-turbo-preview',
    NOW() + INTERVAL '30 days'
  ),
  (
    'secondary:course-recommend789',
    'Which course should I take to help with college applications?',
    'applications college course help i should take to which with',
    'Great question! For college applications, I''d recommend our "Ultimate Academic Advantage by AI" course (£39, 6 weeks). This course teaches you how to use AI tools to enhance your essays, research projects, and study efficiency - skills that will not only strengthen your college applications but also give you a competitive edge once you''re in college. It''s specifically designed for teens like you who want to stand out in the application process. Want to learn more about it?',
    'secondary',
    'course_recommendation',
    'gpt-4-turbo-preview',
    NOW() + INTERVAL '14 days'
  )
ON CONFLICT (cache_key) DO NOTHING;

-- ============================================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE chatbot_query_cache IS
  'Stores cached responses for common chatbot queries to reduce API costs and improve response times';

COMMENT ON COLUMN chatbot_query_cache.cache_key IS
  'Unique identifier generated from audience and normalized query hash';

COMMENT ON COLUMN chatbot_query_cache.normalized_query IS
  'Query with punctuation removed, lowercased, and words sorted for better matching';

COMMENT ON COLUMN chatbot_query_cache.hit_count IS
  'Number of times this cached response has been served';

COMMENT ON COLUMN chatbot_query_cache.expires_at IS
  'When this cache entry expires and should be removed';

COMMENT ON FUNCTION increment_cache_hit_count IS
  'Increments the hit count for a cached query when it is served from cache';

COMMENT ON FUNCTION get_cache_statistics IS
  'Returns cache health metrics including total entries, hits, and averages';

COMMENT ON FUNCTION get_top_cached_queries IS
  'Returns the most frequently accessed cached queries';

COMMENT ON FUNCTION cleanup_expired_cache IS
  'Removes expired cache entries and returns the number deleted';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Chatbot query cache system created successfully';
  RAISE NOTICE 'Run SELECT * FROM chatbot_cache_health; to check cache status';
  RAISE NOTICE 'Run SELECT * FROM get_top_cached_queries(10); to see top queries';
END $$;
