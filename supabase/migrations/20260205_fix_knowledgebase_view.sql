-- Fix knowledgebase view and RLS completely
-- The view needs SECURITY DEFINER to bypass RLS for accurate aggregate stats

-- Drop the existing view
DROP VIEW IF EXISTS knowledgebase_topic_stats;

-- Recreate view with SECURITY INVOKER (we'll use a function instead for stats)
-- Actually, let's create a simple view that works with RLS
CREATE OR REPLACE VIEW knowledgebase_topic_stats AS
SELECT
  topic_type,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
  COUNT(*) as total_count,
  COALESCE(SUM(view_count) FILTER (WHERE status = 'published'), 0) as total_views
FROM knowledgebase_entries
GROUP BY topic_type;

-- Grant access to the view
GRANT SELECT ON knowledgebase_topic_stats TO authenticated;
GRANT SELECT ON knowledgebase_topic_stats TO anon;

-- Make sure the base table has proper grants
GRANT SELECT ON knowledgebase_entries TO anon;
GRANT SELECT ON knowledgebase_entries TO authenticated;

-- For authenticated users, also grant INSERT, UPDATE, DELETE (controlled by RLS)
GRANT INSERT, UPDATE, DELETE ON knowledgebase_entries TO authenticated;

-- Create an RPC function for stats that bypasses RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_knowledgebase_stats()
RETURNS TABLE (
  topic_type knowledgebase_topic_type,
  published_count bigint,
  draft_count bigint,
  total_count bigint,
  total_views bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    topic_type,
    COUNT(*) FILTER (WHERE status = 'published'),
    COUNT(*) FILTER (WHERE status = 'draft'),
    COUNT(*),
    COALESCE(SUM(view_count) FILTER (WHERE status = 'published'), 0)
  FROM knowledgebase_entries
  GROUP BY topic_type;
$$;

-- Grant execute to all
GRANT EXECUTE ON FUNCTION get_knowledgebase_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_knowledgebase_stats() TO authenticated;
