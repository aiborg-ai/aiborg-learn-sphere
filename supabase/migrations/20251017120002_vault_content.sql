-- ============================================================================
-- VAULT CONTENT TABLE
-- ============================================================================
-- Stores exclusive premium content for membership holders
-- Created: October 17, 2025
-- ============================================================================

-- Create content type enum
CREATE TYPE vault_content_type AS ENUM (
  'video',
  'article',
  'worksheet',
  'template',
  'tool',
  'webinar',
  'case_study',
  'guide'
);

-- Create vault_content table
CREATE TABLE IF NOT EXISTS public.vault_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content details
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  content_type vault_content_type NOT NULL,

  -- Content location
  url TEXT, -- Video URL, article URL, or file path
  thumbnail_url TEXT,
  file_size_mb DECIMAL(10, 2),

  -- Metadata
  duration_minutes INTEGER, -- For videos and webinars
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Access control
  is_premium BOOLEAN NOT NULL DEFAULT true,
  required_plan_tier INTEGER DEFAULT 1, -- 1 = all members, 2 = premium only

  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,

  -- Content author/creator
  author_name TEXT,
  author_bio TEXT,
  author_avatar_url TEXT,

  -- Publishing
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE,
  featured_order INTEGER, -- For featuring content (null = not featured)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_vault_content_slug ON public.vault_content(slug);
CREATE INDEX idx_vault_content_content_type ON public.vault_content(content_type);
CREATE INDEX idx_vault_content_category ON public.vault_content(category);
CREATE INDEX idx_vault_content_is_published ON public.vault_content(is_published);
CREATE INDEX idx_vault_content_featured_order ON public.vault_content(featured_order) WHERE featured_order IS NOT NULL;
CREATE INDEX idx_vault_content_tags ON public.vault_content USING GIN(tags);

-- Enable RLS
ALTER TABLE public.vault_content ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only users with active membership can view vault content
CREATE POLICY "Members can view published vault content"
  ON public.vault_content
  FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.membership_subscriptions
      WHERE user_id = auth.uid()
      AND status IN ('trialing', 'active')
      AND (
        (trial_end IS NOT NULL AND trial_end > NOW())
        OR (current_period_end IS NOT NULL AND current_period_end > NOW())
      )
    )
  );

-- ============================================================================
-- VAULT CONTENT ACCESS LOG (Track views and downloads)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vault_content_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.vault_content(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.membership_subscriptions(id) ON DELETE SET NULL,

  -- Access details
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'download', 'bookmark')),
  completed BOOLEAN DEFAULT false, -- For videos: did they watch to end?
  watch_percentage INTEGER CHECK (watch_percentage >= 0 AND watch_percentage <= 100),

  -- Timestamp
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate logs within same session
  CONSTRAINT unique_recent_access UNIQUE (user_id, content_id, action_type, accessed_at)
);

-- Create indexes
CREATE INDEX idx_vault_access_log_user_id ON public.vault_content_access_log(user_id);
CREATE INDEX idx_vault_access_log_content_id ON public.vault_content_access_log(content_id);
CREATE INDEX idx_vault_access_log_action_type ON public.vault_content_access_log(action_type);
CREATE INDEX idx_vault_access_log_accessed_at ON public.vault_content_access_log(accessed_at);

-- Enable RLS
ALTER TABLE public.vault_content_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own access log"
  ON public.vault_content_access_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own access log"
  ON public.vault_content_access_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- USER CONTENT BOOKMARKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_vault_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.vault_content(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate bookmarks
  CONSTRAINT unique_user_content_bookmark UNIQUE (user_id, content_id)
);

-- Create indexes
CREATE INDEX idx_user_vault_bookmarks_user_id ON public.user_vault_bookmarks(user_id);
CREATE INDEX idx_user_vault_bookmarks_content_id ON public.user_vault_bookmarks(content_id);

-- Enable RLS
ALTER TABLE public.user_vault_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own bookmarks"
  ON public.user_vault_bookmarks
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to record content access
CREATE OR REPLACE FUNCTION public.log_vault_content_access(
  p_content_id UUID,
  p_action_type TEXT,
  p_watch_percentage INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get active subscription
  SELECT id INTO v_subscription_id
  FROM public.membership_subscriptions
  WHERE user_id = v_user_id
  AND status IN ('trialing', 'active')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Insert access log
  INSERT INTO public.vault_content_access_log (
    user_id,
    content_id,
    subscription_id,
    action_type,
    watch_percentage,
    completed
  ) VALUES (
    v_user_id,
    p_content_id,
    v_subscription_id,
    p_action_type,
    p_watch_percentage,
    CASE WHEN p_watch_percentage >= 90 THEN true ELSE false END
  )
  ON CONFLICT (user_id, content_id, action_type, accessed_at) DO NOTHING;

  -- Update content metrics
  IF p_action_type = 'view' THEN
    UPDATE public.vault_content
    SET view_count = view_count + 1
    WHERE id = p_content_id;
  ELSIF p_action_type = 'download' THEN
    UPDATE public.vault_content
    SET download_count = download_count + 1
    WHERE id = p_content_id;
  ELSIF p_action_type = 'bookmark' THEN
    UPDATE public.vault_content
    SET bookmark_count = bookmark_count + 1
    WHERE id = p_content_id;
  END IF;
END;
$$;

-- Function to get user's vault statistics
CREATE OR REPLACE FUNCTION public.get_user_vault_stats(p_user_id UUID)
RETURNS TABLE (
  total_views INTEGER,
  total_downloads INTEGER,
  total_bookmarks INTEGER,
  unique_content_viewed INTEGER,
  hours_watched DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE action_type = 'view')::INTEGER AS total_views,
    COUNT(*) FILTER (WHERE action_type = 'download')::INTEGER AS total_downloads,
    COUNT(DISTINCT content_id) FILTER (WHERE action_type = 'bookmark')::INTEGER AS total_bookmarks,
    COUNT(DISTINCT content_id) FILTER (WHERE action_type = 'view')::INTEGER AS unique_content_viewed,
    ROUND(SUM(
      CASE
        WHEN action_type = 'view' AND watch_percentage IS NOT NULL THEN
          (vc.duration_minutes * watch_percentage / 100.0)
        ELSE 0
      END
    ) / 60.0, 2) AS hours_watched
  FROM public.vault_content_access_log vcal
  LEFT JOIN public.vault_content vc ON vcal.content_id = vc.id
  WHERE vcal.user_id = p_user_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_vault_content_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_vault_content_timestamp
  BEFORE UPDATE ON public.vault_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vault_content_timestamp();

-- ============================================================================
-- INSERT SAMPLE VAULT CONTENT
-- ============================================================================

INSERT INTO public.vault_content (title, slug, description, content_type, category, difficulty_level, duration_minutes, is_published, tags) VALUES
  ('AI Fundamentals Masterclass', 'ai-fundamentals-masterclass', 'Comprehensive video series covering the basics of artificial intelligence, machine learning, and neural networks.', 'video', 'AI Fundamentals', 'beginner', 120, true, ARRAY['ai', 'machine-learning', 'fundamentals']),
  ('Prompt Engineering Workbook', 'prompt-engineering-workbook', 'Downloadable workbook with 50+ prompt templates for ChatGPT, Claude, and other AI tools.', 'worksheet', 'Prompt Engineering', 'intermediate', null, true, ARRAY['prompts', 'chatgpt', 'templates']),
  ('Computer Vision Project Template', 'computer-vision-template', 'Complete Python template for building computer vision applications with OpenCV and TensorFlow.', 'template', 'Computer Vision', 'advanced', null, true, ARRAY['computer-vision', 'python', 'tensorflow']),
  ('Introduction to NLP', 'introduction-to-nlp', 'Natural Language Processing basics explained with practical examples and code samples.', 'video', 'NLP & Chatbots', 'beginner', 90, true, ARRAY['nlp', 'text-processing', 'chatbots']),
  ('AI Ethics Framework Guide', 'ai-ethics-framework-guide', 'Comprehensive guide to implementing ethical AI practices in your organization.', 'guide', 'AI Ethics', 'intermediate', null, true, ARRAY['ethics', 'responsible-ai', 'governance']),
  ('Machine Learning Algorithms Cheat Sheet', 'ml-algorithms-cheat-sheet', 'Visual cheat sheet covering 20+ common ML algorithms with use cases and implementation tips.', 'worksheet', 'Machine Learning', 'intermediate', null, true, ARRAY['algorithms', 'ml', 'reference']),
  ('Building Your First Neural Network', 'building-first-neural-network', 'Step-by-step video tutorial on creating neural networks from scratch using PyTorch.', 'video', 'AI Fundamentals', 'intermediate', 75, true, ARRAY['neural-networks', 'pytorch', 'deep-learning']),
  ('AI Tools Comparison Matrix', 'ai-tools-comparison-matrix', 'Downloadable spreadsheet comparing 50+ AI tools across categories, pricing, and features.', 'tool', 'AI Tools', 'beginner', null, true, ARRAY['tools', 'comparison', 'productivity']),
  ('Webinar: Future of AI in Education', 'webinar-future-ai-education', 'Recorded webinar featuring industry experts discussing AI trends in education and learning.', 'webinar', 'AI in Education', 'beginner', 60, true, ARRAY['education', 'trends', 'webinar']),
  ('Real-World AI Case Studies', 'real-world-ai-case-studies', 'Collection of 10 detailed case studies showing successful AI implementations across industries.', 'case_study', 'Case Studies', 'intermediate', null, true, ARRAY['case-studies', 'implementation', 'real-world']);

-- Add comments
COMMENT ON TABLE public.vault_content IS 'Stores exclusive premium content accessible only to membership holders';
COMMENT ON TABLE public.vault_content_access_log IS 'Tracks user interactions with vault content for analytics and recommendations';
COMMENT ON TABLE public.user_vault_bookmarks IS 'Stores user bookmarks for vault content with optional notes';
COMMENT ON FUNCTION public.log_vault_content_access IS 'Records user access to vault content and updates metrics';
COMMENT ON FUNCTION public.get_user_vault_stats IS 'Returns aggregated statistics for a user''s vault content usage';
