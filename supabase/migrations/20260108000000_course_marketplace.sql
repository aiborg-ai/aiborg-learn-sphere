-- Course Marketplace Migration
-- Creates tables for external AI course marketplace

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: course_providers
-- Stores information about external course providers
-- =====================================================
CREATE TABLE IF NOT EXISTS course_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('mooc', 'ai', 'regional')),
  description TEXT,
  country VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for common queries
CREATE INDEX idx_course_providers_category ON course_providers(category);
CREATE INDEX idx_course_providers_is_active ON course_providers(is_active);

-- =====================================================
-- Table: external_courses
-- Stores curated external AI courses from various providers
-- =====================================================
CREATE TABLE IF NOT EXISTS external_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES course_providers(id) ON DELETE CASCADE,
  external_id VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  instructor_name VARCHAR(255),
  instructor_bio TEXT,
  thumbnail_url TEXT,
  external_url TEXT NOT NULL,

  -- Course attributes
  level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  mode VARCHAR(20) CHECK (mode IN ('online', 'self-paced', 'cohort', 'hybrid')),
  language VARCHAR(10) DEFAULT 'en',
  duration_hours INTEGER,
  duration_text VARCHAR(50),

  -- Pricing
  price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('free', 'freemium', 'paid', 'subscription')),
  price_amount DECIMAL(10,2),
  price_currency VARCHAR(3) DEFAULT 'USD',
  original_price DECIMAL(10,2),

  -- Metrics
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,

  -- Features
  certificate_available BOOLEAN DEFAULT false,

  -- Arrays for flexible categorization
  skills TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  learning_outcomes TEXT[] DEFAULT '{}',

  -- Content info
  lesson_count INTEGER,
  video_hours DECIMAL(5,1),

  -- Metadata
  last_updated DATE,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for external_courses
CREATE INDEX idx_external_courses_provider ON external_courses(provider_id);
CREATE INDEX idx_external_courses_level ON external_courses(level);
CREATE INDEX idx_external_courses_price_type ON external_courses(price_type);
CREATE INDEX idx_external_courses_rating ON external_courses(rating DESC NULLS LAST);
CREATE INDEX idx_external_courses_is_featured ON external_courses(is_featured);
CREATE INDEX idx_external_courses_is_active ON external_courses(is_active);
CREATE INDEX idx_external_courses_enrollment ON external_courses(enrollment_count DESC);

-- Full-text search index
CREATE INDEX idx_external_courses_search ON external_courses
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- GIN indexes for array columns
CREATE INDEX idx_external_courses_skills ON external_courses USING gin(skills);
CREATE INDEX idx_external_courses_topics ON external_courses USING gin(topics);
CREATE INDEX idx_external_courses_categories ON external_courses USING gin(categories);

-- =====================================================
-- Table: user_course_favorites
-- Stores user's favorited external courses
-- =====================================================
CREATE TABLE IF NOT EXISTS user_course_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES external_courses(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_user_course_favorite UNIQUE(user_id, course_id)
);

-- Indexes for favorites
CREATE INDEX idx_user_course_favorites_user ON user_course_favorites(user_id);
CREATE INDEX idx_user_course_favorites_course ON user_course_favorites(course_id);

-- =====================================================
-- Table: user_price_alerts
-- Stores user's price alerts for courses
-- =====================================================
CREATE TABLE IF NOT EXISTS user_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES external_courses(id) ON DELETE CASCADE,
  target_price DECIMAL(10,2) NOT NULL,
  original_price_at_creation DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_user_course_alert UNIQUE(user_id, course_id)
);

-- Indexes for price alerts
CREATE INDEX idx_user_price_alerts_user ON user_price_alerts(user_id);
CREATE INDEX idx_user_price_alerts_active ON user_price_alerts(is_active) WHERE is_active = true;

-- =====================================================
-- Table: course_reviews_aggregated
-- Stores aggregated reviews from external sources
-- =====================================================
CREATE TABLE IF NOT EXISTS course_reviews_aggregated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES external_courses(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  avg_rating DECIMAL(2,1),
  total_reviews INTEGER DEFAULT 0,
  rating_distribution JSONB DEFAULT '{"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}',
  sentiment_score DECIMAL(3,2),
  highlights TEXT[],
  concerns TEXT[],
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_course_source_review UNIQUE(course_id, source)
);

-- Index for reviews
CREATE INDEX idx_course_reviews_course ON course_reviews_aggregated(course_id);

-- =====================================================
-- Table: user_course_comparison_history
-- Stores user's comparison history for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS user_course_comparison_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_ids UUID[] NOT NULL,
  selected_course_id UUID REFERENCES external_courses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comparison_history_user ON user_course_comparison_history(user_id);

-- =====================================================
-- Views
-- =====================================================

-- View: external_courses_with_provider
-- Combines course data with provider info
CREATE OR REPLACE VIEW external_courses_with_provider AS
SELECT
  ec.*,
  cp.name as provider_name,
  cp.slug as provider_slug,
  cp.logo_url as provider_logo_url,
  cp.website_url as provider_website_url,
  cp.category as provider_category,
  cp.country as provider_country
FROM external_courses ec
JOIN course_providers cp ON ec.provider_id = cp.id
WHERE ec.is_active = true AND cp.is_active = true;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE course_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_comparison_history ENABLE ROW LEVEL SECURITY;

-- course_providers: Everyone can read active providers
CREATE POLICY "Anyone can view active providers" ON course_providers
  FOR SELECT USING (is_active = true);

-- course_providers: Only admins can modify
CREATE POLICY "Admins can manage providers" ON course_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- external_courses: Everyone can read active courses
CREATE POLICY "Anyone can view active courses" ON external_courses
  FOR SELECT USING (is_active = true);

-- external_courses: Only admins can modify
CREATE POLICY "Admins can manage courses" ON external_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- user_course_favorites: Users can manage their own favorites
CREATE POLICY "Users can view own favorites" ON user_course_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON user_course_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON user_course_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- user_price_alerts: Users can manage their own alerts
CREATE POLICY "Users can view own alerts" ON user_price_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON user_price_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON user_price_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON user_price_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- course_reviews_aggregated: Everyone can read
CREATE POLICY "Anyone can view reviews" ON course_reviews_aggregated
  FOR SELECT USING (true);

-- course_reviews_aggregated: Only admins can modify
CREATE POLICY "Admins can manage reviews" ON course_reviews_aggregated
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- user_course_comparison_history: Users can view/create own history
CREATE POLICY "Users can view own comparison history" ON user_course_comparison_history
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert comparison history" ON user_course_comparison_history
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- Functions
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_course_providers_updated_at
  BEFORE UPDATE ON course_providers
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER update_external_courses_updated_at
  BEFORE UPDATE ON external_courses
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER update_user_price_alerts_updated_at
  BEFORE UPDATE ON user_price_alerts
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

-- Function to search courses with full-text search
CREATE OR REPLACE FUNCTION search_external_courses(
  search_query TEXT DEFAULT NULL,
  filter_providers TEXT[] DEFAULT NULL,
  filter_levels TEXT[] DEFAULT NULL,
  filter_price_types TEXT[] DEFAULT NULL,
  filter_min_rating DECIMAL DEFAULT NULL,
  filter_categories TEXT[] DEFAULT NULL,
  filter_certificate_only BOOLEAN DEFAULT FALSE,
  sort_by TEXT DEFAULT 'relevance',
  sort_direction TEXT DEFAULT 'desc',
  page_size INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  provider_id UUID,
  slug VARCHAR,
  title VARCHAR,
  description TEXT,
  instructor_name VARCHAR,
  thumbnail_url TEXT,
  external_url TEXT,
  level VARCHAR,
  mode VARCHAR,
  language VARCHAR,
  duration_hours INTEGER,
  duration_text VARCHAR,
  price_type VARCHAR,
  price_amount DECIMAL,
  price_currency VARCHAR,
  original_price DECIMAL,
  rating DECIMAL,
  review_count INTEGER,
  enrollment_count INTEGER,
  certificate_available BOOLEAN,
  skills TEXT[],
  topics TEXT[],
  categories TEXT[],
  is_featured BOOLEAN,
  provider_name VARCHAR,
  provider_slug VARCHAR,
  provider_logo_url TEXT,
  provider_category VARCHAR,
  search_rank REAL,
  total_count BIGINT
) AS $$
DECLARE
  total BIGINT;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO total
  FROM external_courses ec
  JOIN course_providers cp ON ec.provider_id = cp.id
  WHERE ec.is_active = true
    AND cp.is_active = true
    AND (search_query IS NULL OR
         to_tsvector('english', ec.title || ' ' || COALESCE(ec.description, '')) @@ plainto_tsquery('english', search_query))
    AND (filter_providers IS NULL OR cp.slug = ANY(filter_providers))
    AND (filter_levels IS NULL OR ec.level = ANY(filter_levels))
    AND (filter_price_types IS NULL OR ec.price_type = ANY(filter_price_types))
    AND (filter_min_rating IS NULL OR ec.rating >= filter_min_rating)
    AND (filter_categories IS NULL OR ec.categories && filter_categories)
    AND (NOT filter_certificate_only OR ec.certificate_available = true);

  RETURN QUERY
  SELECT
    ec.id,
    ec.provider_id,
    ec.slug,
    ec.title,
    ec.description,
    ec.instructor_name,
    ec.thumbnail_url,
    ec.external_url,
    ec.level,
    ec.mode,
    ec.language,
    ec.duration_hours,
    ec.duration_text,
    ec.price_type,
    ec.price_amount,
    ec.price_currency,
    ec.original_price,
    ec.rating,
    ec.review_count,
    ec.enrollment_count,
    ec.certificate_available,
    ec.skills,
    ec.topics,
    ec.categories,
    ec.is_featured,
    cp.name,
    cp.slug,
    cp.logo_url,
    cp.category,
    CASE
      WHEN search_query IS NOT NULL THEN
        ts_rank(to_tsvector('english', ec.title || ' ' || COALESCE(ec.description, '')), plainto_tsquery('english', search_query))
      ELSE 1.0
    END as search_rank,
    total
  FROM external_courses ec
  JOIN course_providers cp ON ec.provider_id = cp.id
  WHERE ec.is_active = true
    AND cp.is_active = true
    AND (search_query IS NULL OR
         to_tsvector('english', ec.title || ' ' || COALESCE(ec.description, '')) @@ plainto_tsquery('english', search_query))
    AND (filter_providers IS NULL OR cp.slug = ANY(filter_providers))
    AND (filter_levels IS NULL OR ec.level = ANY(filter_levels))
    AND (filter_price_types IS NULL OR ec.price_type = ANY(filter_price_types))
    AND (filter_min_rating IS NULL OR ec.rating >= filter_min_rating)
    AND (filter_categories IS NULL OR ec.categories && filter_categories)
    AND (NOT filter_certificate_only OR ec.certificate_available = true)
  ORDER BY
    CASE WHEN sort_by = 'relevance' AND search_query IS NOT NULL THEN
      ts_rank(to_tsvector('english', ec.title || ' ' || COALESCE(ec.description, '')), plainto_tsquery('english', search_query))
    END DESC NULLS LAST,
    CASE WHEN sort_by = 'rating' AND sort_direction = 'desc' THEN ec.rating END DESC NULLS LAST,
    CASE WHEN sort_by = 'rating' AND sort_direction = 'asc' THEN ec.rating END ASC NULLS LAST,
    CASE WHEN sort_by = 'price' AND sort_direction = 'asc' THEN COALESCE(ec.price_amount, 0) END ASC,
    CASE WHEN sort_by = 'price' AND sort_direction = 'desc' THEN COALESCE(ec.price_amount, 0) END DESC,
    CASE WHEN sort_by = 'enrollment_count' THEN ec.enrollment_count END DESC NULLS LAST,
    CASE WHEN sort_by = 'newest' THEN ec.created_at END DESC,
    ec.is_featured DESC,
    ec.sort_order ASC
  LIMIT page_size
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Seed Data: Course Providers
-- =====================================================

INSERT INTO course_providers (slug, name, logo_url, website_url, category, description, country) VALUES
  -- MOOCs
  ('coursera', 'Coursera', 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-96x96.png', 'https://www.coursera.org', 'mooc', 'Online learning platform partnering with universities and organizations worldwide', 'USA'),
  ('udemy', 'Udemy', 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg', 'https://www.udemy.com', 'mooc', 'Global marketplace for learning and instruction', 'USA'),
  ('edx', 'edX', 'https://www.edx.org/images/logos/edx-logo-elm.svg', 'https://www.edx.org', 'mooc', 'Massive open online courses from top universities', 'USA'),
  ('linkedin_learning', 'LinkedIn Learning', 'https://static.licdn.com/aero-v1/sc/h/3loy7tajf3n0cho89wgg0fjre', 'https://www.linkedin.com/learning', 'mooc', 'Professional courses for career development', 'USA'),
  ('pluralsight', 'Pluralsight', 'https://www.pluralsight.com/etc/clientlibs/pluralsight/main/images/global/header/PS_logo.png', 'https://www.pluralsight.com', 'mooc', 'Technology skills platform for enterprises', 'USA'),

  -- AI-Specific Platforms
  ('deeplearning_ai', 'DeepLearning.AI', 'https://www.deeplearning.ai/favicon.ico', 'https://www.deeplearning.ai', 'ai', 'AI education company founded by Andrew Ng', 'USA'),
  ('fast_ai', 'fast.ai', 'https://www.fast.ai/images/favicon.png', 'https://www.fast.ai', 'ai', 'Making neural nets uncool again - practical deep learning', 'USA'),
  ('kaggle', 'Kaggle Learn', 'https://www.kaggle.com/static/images/favicon.ico', 'https://www.kaggle.com/learn', 'ai', 'Hands-on data science and ML micro-courses', 'USA'),
  ('google_ai', 'Google AI', 'https://ai.google/static/images/favicon.png', 'https://ai.google/education', 'ai', 'Machine learning education from Google', 'USA'),
  ('aws_ml', 'AWS Machine Learning', 'https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico', 'https://aws.amazon.com/training/learn-about/machine-learning/', 'ai', 'AWS cloud-based ML training and certification', 'USA'),
  ('huggingface', 'Hugging Face', 'https://huggingface.co/favicon.ico', 'https://huggingface.co/learn', 'ai', 'Open-source NLP and ML courses', 'USA'),

  -- Regional Platforms
  ('swayam', 'SWAYAM', 'https://swayam.gov.in/assets/images/swayam_logo.png', 'https://swayam.gov.in', 'regional', 'Indian government MOOCs platform with NPTEL courses', 'India'),
  ('xuetangx', 'XuetangX', 'https://www.xuetangx.com/favicon.ico', 'https://www.xuetangx.com', 'regional', 'Chinese MOOC platform from Tsinghua University', 'China'),
  ('futurelearn', 'FutureLearn', 'https://www.futurelearn.com/favicon.ico', 'https://www.futurelearn.com', 'regional', 'UK-based online learning platform', 'UK'),
  ('alison', 'Alison', 'https://alison.com/favicon.ico', 'https://alison.com', 'regional', 'Free online courses with certificates', 'Ireland')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  website_url = EXCLUDED.website_url,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  country = EXCLUDED.country,
  updated_at = now();

-- Add comment for documentation
COMMENT ON TABLE external_courses IS 'Curated external AI courses from global providers for the marketplace';
COMMENT ON TABLE course_providers IS 'External course provider metadata (Coursera, Udemy, DeepLearning.AI, etc.)';
COMMENT ON TABLE user_course_favorites IS 'User saved/favorited external courses';
COMMENT ON TABLE user_price_alerts IS 'User price drop alerts for external courses';
COMMENT ON FUNCTION search_external_courses IS 'Full-text search with filtering for external courses';
