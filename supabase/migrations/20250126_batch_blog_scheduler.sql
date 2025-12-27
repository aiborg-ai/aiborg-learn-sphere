-- Batch Blog Scheduler Migration
-- Creates tables for templates, campaigns, batch jobs, and related infrastructure

-- =====================================================
-- 1. BLOG TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  topic_template TEXT NOT NULL,
  audience VARCHAR(20) DEFAULT 'professional' CHECK (audience IN ('primary', 'secondary', 'professional', 'business')),
  tone VARCHAR(20) DEFAULT 'professional' CHECK (tone IN ('professional', 'casual', 'technical', 'friendly')),
  length VARCHAR(20) DEFAULT 'medium' CHECK (length IN ('short', 'medium', 'long')),
  keywords TEXT,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  default_tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active templates
CREATE INDEX idx_blog_templates_active ON blog_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_blog_templates_created_by ON blog_templates(created_by);

-- Updated_at trigger
CREATE TRIGGER update_blog_templates_updated_at
  BEFORE UPDATE ON blog_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for blog_templates
ALTER TABLE blog_templates ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY admin_all_blog_templates ON blog_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 2. BLOG CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_post_count INTEGER DEFAULT 0,
  actual_post_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: end_date must be after start_date
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- Indexes for campaigns
CREATE INDEX idx_blog_campaigns_status ON blog_campaigns(status);
CREATE INDEX idx_blog_campaigns_created_by ON blog_campaigns(created_by);
CREATE INDEX idx_blog_campaigns_dates ON blog_campaigns(start_date, end_date);

-- Updated_at trigger
CREATE TRIGGER update_blog_campaigns_updated_at
  BEFORE UPDATE ON blog_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for blog_campaigns
ALTER TABLE blog_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY admin_all_blog_campaigns ON blog_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 3. BLOG POST CAMPAIGNS (Junction Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_post_campaigns (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES blog_campaigns(id) ON DELETE CASCADE,
  position_in_campaign INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (post_id, campaign_id)
);

-- Index for efficient lookups
CREATE INDEX idx_blog_post_campaigns_campaign ON blog_post_campaigns(campaign_id);
CREATE INDEX idx_blog_post_campaigns_post ON blog_post_campaigns(post_id);

-- RLS Policies for blog_post_campaigns
ALTER TABLE blog_post_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY admin_all_blog_post_campaigns ON blog_post_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 4. BLOG BATCH JOBS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES blog_campaigns(id) ON DELETE SET NULL,
  template_id UUID REFERENCES blog_templates(id) ON DELETE SET NULL,
  total_posts INTEGER NOT NULL,
  completed_posts INTEGER DEFAULT 0,
  failed_posts INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  generation_params JSONB, -- Stores all generation parameters
  error_log JSONB[], -- Array of error objects
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: completed + failed <= total
  CONSTRAINT valid_post_counts CHECK (completed_posts + failed_posts <= total_posts)
);

-- Indexes for batch jobs
CREATE INDEX idx_blog_batch_jobs_status ON blog_batch_jobs(status);
CREATE INDEX idx_blog_batch_jobs_created_by ON blog_batch_jobs(created_by);
CREATE INDEX idx_blog_batch_jobs_campaign ON blog_batch_jobs(campaign_id);
CREATE INDEX idx_blog_batch_jobs_template ON blog_batch_jobs(template_id);
CREATE INDEX idx_blog_batch_jobs_created_at ON blog_batch_jobs(created_at DESC);

-- RLS Policies for blog_batch_jobs
ALTER TABLE blog_batch_jobs ENABLE ROW LEVEL SECURITY;

-- Admin can view all jobs
CREATE POLICY admin_view_all_batch_jobs ON blog_batch_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own jobs
CREATE POLICY users_view_own_batch_jobs ON blog_batch_jobs
  FOR SELECT
  USING (created_by = auth.uid());

-- Admin can insert/update/delete jobs
CREATE POLICY admin_manage_batch_jobs ON blog_batch_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 5. INDEXES ON EXISTING BLOG_POSTS TABLE
-- =====================================================
-- Index for efficient scheduled post queries (for auto-publisher)
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_for
  ON blog_posts(scheduled_for)
  WHERE status = 'scheduled';

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_scheduled
  ON blog_posts(status)
  WHERE status = 'scheduled';

-- =====================================================
-- 6. FUNCTIONS FOR CAMPAIGN POST COUNT UPDATES
-- =====================================================

-- Function to update campaign post count when posts are linked/unlinked
CREATE OR REPLACE FUNCTION update_campaign_post_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update actual_post_count for the campaign
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_campaigns
    SET actual_post_count = (
      SELECT COUNT(*)
      FROM blog_post_campaigns
      WHERE campaign_id = NEW.campaign_id
    )
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_campaigns
    SET actual_post_count = (
      SELECT COUNT(*)
      FROM blog_post_campaigns
      WHERE campaign_id = OLD.campaign_id
    )
    WHERE id = OLD.campaign_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update campaign post counts
CREATE TRIGGER update_campaign_post_count_trigger
  AFTER INSERT OR DELETE ON blog_post_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_post_count();

-- =====================================================
-- 7. SEED DATA - DEFAULT TEMPLATES
-- =====================================================

-- Insert default blog templates for common use cases
INSERT INTO blog_templates (name, description, topic_template, audience, tone, length, keywords, default_tags, is_active)
VALUES
  (
    'AI Fundamentals Series',
    'Educational posts explaining AI concepts to professionals',
    'Explain {topic} in the context of artificial intelligence and machine learning',
    'professional',
    'professional',
    'medium',
    'AI, machine learning, artificial intelligence',
    ARRAY['AI', 'Education', 'Technology'],
    true
  ),
  (
    'Industry News Update',
    'Quick news updates about AI and technology industry',
    'Recent developments in {topic}',
    'professional',
    'professional',
    'short',
    'news, updates, industry',
    ARRAY['News', 'Industry', 'Updates'],
    true
  ),
  (
    'Tutorial: How to...',
    'Step-by-step tutorials for technical topics',
    'How to {topic}: A step-by-step guide',
    'professional',
    'friendly',
    'long',
    'tutorial, guide, how-to',
    ARRAY['Tutorial', 'Guide', 'Education'],
    true
  ),
  (
    'Case Study',
    'Real-world case studies showing practical applications',
    'Case study: {topic} - Implementation and results',
    'business',
    'professional',
    'long',
    'case study, implementation, results',
    ARRAY['Case Study', 'Business', 'Analysis'],
    true
  ),
  (
    'Product Feature Announcement',
    'Announce new features or product updates',
    'Introducing {topic}: New features and capabilities',
    'business',
    'friendly',
    'medium',
    'product, features, announcement',
    ARRAY['Product', 'Features', 'Announcement'],
    true
  ),
  (
    'Beginner-Friendly Explainer',
    'Simple explanations of complex topics for younger audiences',
    'Understanding {topic}: A beginner-friendly guide',
    'secondary',
    'friendly',
    'medium',
    'beginner, introduction, basics',
    ARRAY['Beginner', 'Education', 'Basics'],
    true
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. HELPER FUNCTION - GET TEMPLATE USAGE COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION get_template_usage_count(template_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM blog_batch_jobs
    WHERE template_id = template_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment to track migration
COMMENT ON TABLE blog_templates IS 'Reusable templates for batch blog generation';
COMMENT ON TABLE blog_campaigns IS 'Content campaigns grouping related blog posts';
COMMENT ON TABLE blog_post_campaigns IS 'Junction table linking posts to campaigns';
COMMENT ON TABLE blog_batch_jobs IS 'Tracks batch blog generation jobs with progress and errors';
