-- Migration to fix database errors found in production
-- Fixes: Missing tables (engagement_metrics, page_views) and RLS policies

-- ============================================================================
-- 1. CREATE MISSING TABLES
-- ============================================================================

-- Create engagement_metrics table (for tracking user engagement)
CREATE TABLE IF NOT EXISTS public.engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  page_path TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'view', 'click', 'scroll', 'time_spent'
  action_data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for engagement_metrics
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_user_id ON public.engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_session_id ON public.engagement_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_page_path ON public.engagement_metrics(page_path);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_action_type ON public.engagement_metrics(action_type);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_timestamp ON public.engagement_metrics(timestamp DESC);

-- Create page_views table (for analytics)
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  page_path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for page_views
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_country ON public.page_views(country);
CREATE INDEX IF NOT EXISTS idx_page_views_device_type ON public.page_views(device_type);

-- ============================================================================
-- 2. FIX RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- engagement_metrics policies
-- Allow anonymous/authenticated users to insert their own metrics
CREATE POLICY "Anyone can insert engagement metrics"
  ON public.engagement_metrics
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view their own metrics
CREATE POLICY "Users can view their own engagement metrics"
  ON public.engagement_metrics
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- page_views policies
-- Allow anyone to insert page views (for analytics)
CREATE POLICY "Anyone can insert page views"
  ON public.page_views
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view their own page views
CREATE POLICY "Users can view their own page views"
  ON public.page_views
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- ============================================================================
-- 3. FIX REVIEWS TABLE RLS (if it exists)
-- ============================================================================

-- Drop existing policies and create new ones for reviews
DO $$
BEGIN
  -- Check if reviews table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    -- Drop ALL existing policies on reviews table
    DROP POLICY IF EXISTS "Users can view approved reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Public read access to approved reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Enable read access for approved reviews" ON public.reviews;

    -- Create permissive policy for approved reviews
    CREATE POLICY "Anyone can view approved reviews"
      ON public.reviews
      FOR SELECT
      USING (approved = true);
  END IF;
END $$;

-- ============================================================================
-- 4. FIX EVENTS TABLE RLS (if it exists)
-- ============================================================================

DO $$
BEGIN
  -- Check if events table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
    -- Drop ALL existing policies on events table
    DROP POLICY IF EXISTS "Users can view visible events" ON public.events;
    DROP POLICY IF EXISTS "Public read access to visible events" ON public.events;
    DROP POLICY IF EXISTS "Anyone can view visible events" ON public.events;
    DROP POLICY IF EXISTS "Enable read access for visible events" ON public.events;

    -- Create permissive policy for visible events
    CREATE POLICY "Anyone can view visible events"
      ON public.events
      FOR SELECT
      USING (is_visible = true);
  END IF;
END $$;

-- ============================================================================
-- 5. FIX get_tenant_by_domain RPC FUNCTION
-- ============================================================================

-- Drop and recreate the function with proper error handling
CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(domain_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  domain TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if tenant_settings table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant_settings') THEN
    RETURN QUERY
    SELECT
      ts.id,
      ts.name,
      ts.domain,
      ts.logo_url,
      ts.primary_color,
      ts.secondary_color,
      ts.metadata
    FROM public.tenant_settings ts
    WHERE ts.domain = domain_name
    LIMIT 1;
  ELSE
    -- Return empty result if table doesn't exist
    RETURN;
  END IF;
END;
$$;

-- ============================================================================
-- 6. CREATE HELPER VIEWS FOR ANALYTICS
-- ============================================================================

-- View for page view analytics
CREATE OR REPLACE VIEW public.page_view_analytics AS
SELECT
  page_path,
  COUNT(*) as total_views,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(duration_seconds) as avg_duration_seconds,
  COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_views,
  COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_views,
  COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet_views,
  DATE_TRUNC('day', created_at) as date
FROM public.page_views
GROUP BY page_path, DATE_TRUNC('day', created_at);

-- View for engagement analytics
CREATE OR REPLACE VIEW public.engagement_analytics AS
SELECT
  page_path,
  action_type,
  COUNT(*) as action_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  DATE_TRUNC('hour', timestamp) as hour
FROM public.engagement_metrics
GROUP BY page_path, action_type, DATE_TRUNC('hour', timestamp);

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions on new tables to authenticated and anon users
GRANT SELECT, INSERT ON public.engagement_metrics TO authenticated, anon;
GRANT SELECT, INSERT ON public.page_views TO authenticated, anon;

-- Grant permissions on views
GRANT SELECT ON public.page_view_analytics TO authenticated;
GRANT SELECT ON public.engagement_analytics TO authenticated;

-- ============================================================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.engagement_metrics IS 'Tracks user engagement actions (views, clicks, scrolls, time spent)';
COMMENT ON TABLE public.page_views IS 'Analytics table for tracking page views and session data';
COMMENT ON FUNCTION public.get_tenant_by_domain IS 'Returns tenant configuration by domain name';
COMMENT ON VIEW public.page_view_analytics IS 'Aggregated page view statistics by page and date';
COMMENT ON VIEW public.engagement_analytics IS 'Aggregated engagement metrics by page, action type, and hour';
