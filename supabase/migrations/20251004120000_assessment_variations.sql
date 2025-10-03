-- Assessment Variations Migration
-- Adds domain-specific assessments, certification tracks, practice/certification modes, and leaderboards

-- =====================================================
-- 1. ASSESSMENT DOMAINS & TRACKS
-- =====================================================

CREATE TABLE IF NOT EXISTS assessment_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50), -- Icon name from lucide-react
  color VARCHAR(20), -- Hex color for branding

  -- Domain metadata
  target_audience TEXT[], -- ['professional', 'business', 'secondary']
  industry_tags TEXT[], -- ['marketing', 'development', 'healthcare']
  difficulty_range VARCHAR(50), -- 'beginner-to-advanced', 'intermediate-only'

  -- Visibility
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  requires_prerequisites BOOLEAN DEFAULT false,

  -- Content
  cover_image_url TEXT,
  learning_outcomes TEXT[],
  estimated_duration_minutes INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert predefined domains
INSERT INTO assessment_domains (name, slug, description, icon, color, target_audience, industry_tags) VALUES
('AI for Marketing', 'ai-marketing', 'Master AI tools for marketing automation, content creation, and campaign optimization', 'Megaphone', '#FF6B6B', ARRAY['professional', 'business'], ARRAY['marketing', 'advertising']),
('AI for Development', 'ai-development', 'Learn AI-powered coding tools, code generation, and software development assistance', 'Code', '#4ECDC4', ARRAY['professional', 'secondary'], ARRAY['software', 'technology']),
('AI for Data Science', 'ai-data-science', 'Explore AI tools for data analysis, visualization, and predictive modeling', 'BarChart', '#95E1D3', ARRAY['professional'], ARRAY['data', 'analytics']),
('AI for Content Creation', 'ai-content', 'Create compelling content using AI writing, image, and video generation tools', 'Sparkles', '#F38181', ARRAY['professional', 'business'], ARRAY['content', 'media']),
('AI for Customer Service', 'ai-customer-service', 'Implement AI chatbots and automation for superior customer support', 'MessageSquare', '#AA96DA', ARRAY['professional', 'business'], ARRAY['service', 'support']),
('AI for Education', 'ai-education', 'Leverage AI tools for teaching, learning, and educational administration', 'GraduationCap', '#FCBAD3', ARRAY['professional', 'secondary'], ARRAY['education', 'teaching'])
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX idx_domains_active ON assessment_domains(is_active);
CREATE INDEX idx_domains_slug ON assessment_domains(slug);

-- =====================================================
-- 2. CERTIFICATION TRACKS
-- =====================================================

CREATE TABLE IF NOT EXISTS certification_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES assessment_domains(id) ON DELETE CASCADE,

  -- Track details
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  level VARCHAR(50) NOT NULL, -- 'foundation', 'professional', 'expert', 'master'
  description TEXT,

  -- Requirements
  min_score_percentage INTEGER NOT NULL DEFAULT 70, -- Minimum to pass
  passing_criteria JSONB, -- Additional criteria (e.g., must pass all categories)
  prerequisite_track_id UUID REFERENCES certification_tracks(id),

  -- Content
  total_questions INTEGER,
  time_limit_minutes INTEGER,
  allowed_attempts INTEGER DEFAULT 3,

  -- Certification
  certificate_template VARCHAR(100),
  certificate_validity_months INTEGER, -- NULL = lifetime
  badge_image_url TEXT,
  certificate_code_prefix VARCHAR(10), -- e.g., 'AIMKT-', 'AIDEV-'

  -- Visibility
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert certification tracks
INSERT INTO certification_tracks (domain_id, name, slug, level, min_score_percentage, time_limit_minutes, certificate_code_prefix) VALUES
((SELECT id FROM assessment_domains WHERE slug = 'ai-marketing'), 'AI Marketing Foundation', 'ai-marketing-foundation', 'foundation', 70, 45, 'AIMKT-F-'),
((SELECT id FROM assessment_domains WHERE slug = 'ai-marketing'), 'AI Marketing Professional', 'ai-marketing-professional', 'professional', 80, 60, 'AIMKT-P-'),
((SELECT id FROM assessment_domains WHERE slug = 'ai-development'), 'AI-Assisted Development Foundation', 'ai-dev-foundation', 'foundation', 70, 50, 'AIDEV-F-'),
((SELECT id FROM assessment_domains WHERE slug = 'ai-development'), 'AI-Assisted Development Expert', 'ai-dev-expert', 'expert', 85, 75, 'AIDEV-E-')
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX idx_cert_tracks_domain ON certification_tracks(domain_id);
CREATE INDEX idx_cert_tracks_level ON certification_tracks(level);

-- =====================================================
-- 3. ASSESSMENT MODES
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'assessment_mode'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN assessment_mode VARCHAR(50) DEFAULT 'practice'; -- 'practice', 'certification', 'timed_challenge'

    COMMENT ON COLUMN user_ai_assessments.assessment_mode IS
    'Assessment mode: practice (no pressure), certification (counts towards cert), timed_challenge (competitive)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'domain_id'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN domain_id UUID REFERENCES assessment_domains(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'certification_track_id'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN certification_track_id UUID REFERENCES certification_tracks(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'time_limit_seconds'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN time_limit_seconds INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'time_remaining_seconds'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN time_remaining_seconds INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'attempt_number'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN attempt_number INTEGER DEFAULT 1;
  END IF;
END $$;

-- =====================================================
-- 4. USER CERTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_track_id UUID REFERENCES certification_tracks(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES user_ai_assessments(id) ON DELETE SET NULL,

  -- Certification details
  certificate_code VARCHAR(50) UNIQUE NOT NULL,
  issued_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE, -- NULL if lifetime

  -- Performance
  final_score INTEGER NOT NULL,
  final_percentage DECIMAL(5,2) NOT NULL,
  ability_level DECIMAL(4,2),
  category_scores JSONB, -- Breakdown by category

  -- Verification
  verification_url TEXT, -- Public verification link
  certificate_pdf_url TEXT, -- Generated PDF
  badge_earned_url TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'revoked'
  revoked_reason TEXT,
  revoked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, certification_track_id, issued_date)
);

CREATE INDEX idx_user_certs_user ON user_certifications(user_id);
CREATE INDEX idx_user_certs_track ON user_certifications(certification_track_id);
CREATE INDEX idx_user_certs_code ON user_certifications(certificate_code);
CREATE INDEX idx_user_certs_status ON user_certifications(status);

-- =====================================================
-- 5. LEADERBOARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Leaderboard type
  leaderboard_type VARCHAR(50) NOT NULL, -- 'global', 'domain', 'track', 'timed_challenge'
  scope_id UUID, -- domain_id or track_id

  -- Performance metrics
  score INTEGER NOT NULL,
  percentage DECIMAL(5,2),
  time_taken_seconds INTEGER,
  questions_answered INTEGER,
  accuracy_rate DECIMAL(5,2),

  -- Ranking
  rank INTEGER,
  percentile INTEGER,

  -- Time period
  period VARCHAR(20) DEFAULT 'all_time', -- 'daily', 'weekly', 'monthly', 'all_time'
  period_start DATE,
  period_end DATE,

  -- Display
  display_name VARCHAR(100),
  avatar_url TEXT,
  show_in_leaderboard BOOLEAN DEFAULT true,

  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, leaderboard_type, scope_id, period)
);

CREATE INDEX idx_leaderboard_type ON leaderboard_entries(leaderboard_type, scope_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(leaderboard_type, rank);
CREATE INDEX idx_leaderboard_period ON leaderboard_entries(period, period_start, period_end);

-- =====================================================
-- 6. TIMED CHALLENGES
-- =====================================================

CREATE TABLE IF NOT EXISTS timed_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES assessment_domains(id),

  -- Challenge details
  name VARCHAR(150) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20), -- 'easy', 'medium', 'hard', 'expert'

  -- Timing
  time_limit_seconds INTEGER NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,

  -- Content
  question_count INTEGER NOT NULL,
  min_questions_to_complete INTEGER, -- Can be less than total

  -- Rewards
  reward_points INTEGER DEFAULT 0,
  badge_image_url TEXT,

  -- Leaderboard
  has_leaderboard BOOLEAN DEFAULT true,
  leaderboard_prize_pool JSONB, -- Top 3 rewards

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'cancelled'
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenges_status ON timed_challenges(status);
CREATE INDEX idx_challenges_time ON timed_challenges(start_time, end_time);

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================

-- Generate unique certificate code
CREATE OR REPLACE FUNCTION generate_certificate_code(p_track_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_prefix VARCHAR(10);
  v_code VARCHAR(50);
  v_exists BOOLEAN;
BEGIN
  -- Get certificate prefix
  SELECT certificate_code_prefix INTO v_prefix
  FROM certification_tracks
  WHERE id = p_track_id;

  v_prefix := COALESCE(v_prefix, 'CERT-');

  -- Generate unique code
  LOOP
    v_code := v_prefix || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

    -- Check if exists
    SELECT EXISTS(
      SELECT 1 FROM user_certifications WHERE certificate_code = v_code
    ) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Award certification
CREATE OR REPLACE FUNCTION award_certification(
  p_user_id UUID,
  p_assessment_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_track_id UUID;
  v_score INTEGER;
  v_max_score INTEGER;
  v_percentage DECIMAL(5,2);
  v_min_percentage INTEGER;
  v_cert_id UUID;
  v_cert_code VARCHAR(50);
  v_validity_months INTEGER;
  v_expiry_date DATE;
BEGIN
  -- Get assessment details
  SELECT
    certification_track_id,
    total_score,
    max_possible_score
  INTO v_track_id, v_score, v_max_score
  FROM user_ai_assessments
  WHERE id = p_assessment_id AND user_id = p_user_id;

  IF v_track_id IS NULL THEN
    RAISE EXCEPTION 'Assessment is not linked to a certification track';
  END IF;

  -- Calculate percentage
  v_percentage := (v_score::DECIMAL / v_max_score * 100);

  -- Get passing threshold
  SELECT min_score_percentage, certificate_validity_months
  INTO v_min_percentage, v_validity_months
  FROM certification_tracks
  WHERE id = v_track_id;

  -- Check if passed
  IF v_percentage < v_min_percentage THEN
    RAISE EXCEPTION 'Score % does not meet minimum % required', v_percentage, v_min_percentage;
  END IF;

  -- Calculate expiry
  IF v_validity_months IS NOT NULL THEN
    v_expiry_date := CURRENT_DATE + (v_validity_months || ' months')::INTERVAL;
  END IF;

  -- Generate certificate code
  v_cert_code := generate_certificate_code(v_track_id);

  -- Insert certification
  INSERT INTO user_certifications (
    user_id,
    certification_track_id,
    assessment_id,
    certificate_code,
    final_score,
    final_percentage,
    expiry_date,
    verification_url
  ) VALUES (
    p_user_id,
    v_track_id,
    p_assessment_id,
    v_cert_code,
    v_score,
    v_percentage,
    v_expiry_date,
    '/verify/' || v_cert_code
  )
  RETURNING id INTO v_cert_id;

  RETURN v_cert_id;
END;
$$ LANGUAGE plpgsql;

-- Update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard(
  p_user_id UUID,
  p_assessment_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_domain_id UUID;
  v_track_id UUID;
  v_score INTEGER;
  v_percentage DECIMAL(5,2);
  v_time_seconds INTEGER;
  v_questions INTEGER;
  v_display_name VARCHAR(100);
BEGIN
  -- Get assessment data
  SELECT
    domain_id,
    certification_track_id,
    total_score,
    (total_score::DECIMAL / max_possible_score * 100),
    completion_time_seconds,
    questions_answered_count
  INTO v_domain_id, v_track_id, v_score, v_percentage, v_time_seconds, v_questions
  FROM user_ai_assessments
  WHERE id = p_assessment_id;

  -- Get display name
  SELECT COALESCE(full_name, email)
  INTO v_display_name
  FROM auth.users
  WHERE id = p_user_id;

  -- Update global leaderboard
  INSERT INTO leaderboard_entries (
    user_id, leaderboard_type, score, percentage,
    time_taken_seconds, questions_answered,
    display_name, period
  ) VALUES (
    p_user_id, 'global', v_score, v_percentage,
    v_time_seconds, v_questions,
    v_display_name, 'all_time'
  )
  ON CONFLICT (user_id, leaderboard_type, scope_id, period)
  DO UPDATE SET
    score = GREATEST(leaderboard_entries.score, EXCLUDED.score),
    percentage = GREATEST(leaderboard_entries.percentage, EXCLUDED.percentage),
    updated_at = NOW();

  -- Update domain leaderboard
  IF v_domain_id IS NOT NULL THEN
    INSERT INTO leaderboard_entries (
      user_id, leaderboard_type, scope_id, score,
      percentage, display_name, period
    ) VALUES (
      p_user_id, 'domain', v_domain_id, v_score,
      v_percentage, v_display_name, 'all_time'
    )
    ON CONFLICT (user_id, leaderboard_type, scope_id, period)
    DO UPDATE SET
      score = GREATEST(leaderboard_entries.score, EXCLUDED.score),
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

ALTER TABLE assessment_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timed_challenges ENABLE ROW LEVEL SECURITY;

-- Public read for active domains and tracks
CREATE POLICY "Anyone can view active domains"
  ON assessment_domains FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active tracks"
  ON certification_tracks FOR SELECT
  USING (is_active = true);

-- Users can view their own certifications
CREATE POLICY "Users can view own certifications"
  ON user_certifications FOR SELECT
  USING (auth.uid() = user_id);

-- Public read for leaderboards
CREATE POLICY "Anyone can view leaderboards"
  ON leaderboard_entries FOR SELECT
  USING (show_in_leaderboard = true);

-- Public read for active challenges
CREATE POLICY "Anyone can view active challenges"
  ON timed_challenges FOR SELECT
  USING (status IN ('active', 'scheduled'));

COMMENT ON DATABASE postgres IS 'Assessment variations: domains, certifications, modes, leaderboards';
