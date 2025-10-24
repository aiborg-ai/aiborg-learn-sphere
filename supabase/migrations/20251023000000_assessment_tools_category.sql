-- =====================================================
-- ASSESSMENT TOOLS CATEGORY IMPLEMENTATION
-- Created: 2025-10-23
-- Purpose: Add new Assessment Tools category with AI-Readiness, AI-Awareness, and AI-Fluency assessments
-- =====================================================

-- =====================================================
-- TABLE 1: ASSESSMENT_TOOLS
-- Catalog of available assessment tools (AI-Readiness, AI-Awareness, AI-Fluency)
-- =====================================================

CREATE TABLE IF NOT EXISTS assessment_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'brain', -- Lucide icon name
  category_type VARCHAR(50) NOT NULL, -- 'readiness', 'awareness', 'fluency'
  target_audiences TEXT[] NOT NULL DEFAULT '{}', -- ['primary', 'secondary', 'professional', 'business']
  difficulty_level VARCHAR(50) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
  estimated_duration_minutes INTEGER DEFAULT 30,
  total_questions_pool INTEGER DEFAULT 0, -- Total questions available in pool
  min_questions_required INTEGER DEFAULT 15, -- Minimum questions for adaptive test
  passing_score_percentage DECIMAL(5,2) DEFAULT 70.0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Additional configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_assessment_tools_slug ON assessment_tools(slug);
CREATE INDEX idx_assessment_tools_active ON assessment_tools(is_active, display_order);
CREATE INDEX idx_assessment_tools_audiences ON assessment_tools USING GIN(target_audiences);

-- =====================================================
-- TABLE 2: ASSESSMENT_TOOL_ATTEMPTS
-- Track all user attempts with full history for unlimited retakes
-- =====================================================

CREATE TABLE IF NOT EXISTS assessment_tool_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES assessment_tools(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES user_ai_assessments(id) ON DELETE CASCADE, -- Link to adaptive assessment
  attempt_number INTEGER NOT NULL DEFAULT 1,

  -- Results
  total_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2) DEFAULT 0.0,
  ability_estimate DECIMAL(5,2) DEFAULT 0.0, -- IRT ability estimate
  ability_standard_error DECIMAL(5,2) DEFAULT 2.0, -- Confidence in estimate

  -- Completion info
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,

  -- Analytics
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  performance_by_category JSONB DEFAULT '{}', -- Category-wise breakdown

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_attempts_user ON assessment_tool_attempts(user_id, completed_at DESC);
CREATE INDEX idx_attempts_tool ON assessment_tool_attempts(tool_id, is_completed);
CREATE INDEX idx_attempts_assessment ON assessment_tool_attempts(assessment_id);
CREATE INDEX idx_attempts_user_tool ON assessment_tool_attempts(user_id, tool_id, attempt_number DESC);

-- =====================================================
-- TABLE 3: ASSESSMENT_QUESTION_POOLS
-- Link questions to specific assessment tools
-- =====================================================

CREATE TABLE IF NOT EXISTS assessment_question_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES assessment_tools(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  weight DECIMAL(3,2) DEFAULT 1.0, -- Question selection weight in adaptive algorithm
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure no duplicate question assignments
  UNIQUE(tool_id, question_id)
);

-- Indexes for performance
CREATE INDEX idx_question_pools_tool ON assessment_question_pools(tool_id, is_active);
CREATE INDEX idx_question_pools_question ON assessment_question_pools(question_id);

-- =====================================================
-- UPDATE EXISTING TABLES
-- =====================================================

-- Add tool_id to user_ai_assessments if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'tool_id'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN tool_id UUID REFERENCES assessment_tools(id) ON DELETE SET NULL;

    CREATE INDEX idx_user_assessments_tool ON user_ai_assessments(tool_id);
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE assessment_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_tool_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_question_pools ENABLE ROW LEVEL SECURITY;

-- Public read access for active assessment tools
CREATE POLICY "Public can view active assessment tools"
  ON assessment_tools FOR SELECT
  USING (is_active = true);

-- Admin full access to assessment tools
CREATE POLICY "Admins can manage assessment tools"
  ON assessment_tools FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own attempts
CREATE POLICY "Users can view own attempts"
  ON assessment_tool_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own attempts
CREATE POLICY "Users can create own attempts"
  ON assessment_tool_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own incomplete attempts
CREATE POLICY "Users can update own incomplete attempts"
  ON assessment_tool_attempts FOR UPDATE
  USING (auth.uid() = user_id AND is_completed = false);

-- Public read access for question pools (filtered by active tools)
CREATE POLICY "Public can view question pools for active tools"
  ON assessment_question_pools FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assessment_tools
      WHERE assessment_tools.id = tool_id
      AND assessment_tools.is_active = true
    )
  );

-- Admin full access to question pools
CREATE POLICY "Admins can manage question pools"
  ON assessment_question_pools FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_assessment_tools_updated_at
  BEFORE UPDATE ON assessment_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_tool_attempts_updated_at
  BEFORE UPDATE ON assessment_tool_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_question_pools_updated_at
  BEFORE UPDATE ON assessment_question_pools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA: INSERT 3 ASSESSMENT TOOLS
-- =====================================================

INSERT INTO assessment_tools (
  name,
  slug,
  description,
  icon,
  category_type,
  target_audiences,
  difficulty_level,
  estimated_duration_minutes,
  min_questions_required,
  passing_score_percentage,
  is_active,
  display_order
) VALUES
(
  'AI-Readiness Assessment',
  'ai-readiness',
  'Evaluate your organization''s readiness for AI adoption. Designed for SMEs to assess strategic alignment, capabilities, resources, and implementation roadmap.',
  'building-2',
  'readiness',
  ARRAY['business'],
  'intermediate',
  40,
  20,
  60.0,
  true,
  1
),
(
  'AI-Awareness Assessment',
  'ai-awareness',
  'Test your understanding of AI fundamentals, applications, and ethical considerations. Perfect for building a strong foundation in artificial intelligence.',
  'lightbulb',
  'awareness',
  ARRAY['primary', 'secondary', 'professional'],
  'beginner',
  25,
  15,
  70.0,
  true,
  2
),
(
  'AI-Fluency Assessment',
  'ai-fluency',
  'Demonstrate your proficiency in using AI tools, prompt engineering, and practical problem-solving. For those ready to level up their AI skills.',
  'zap',
  'fluency',
  ARRAY['primary', 'secondary', 'professional'],
  'advanced',
  35,
  20,
  75.0,
  true,
  3
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- HELPER FUNCTION: GET USER'S LATEST ATTEMPT FOR A TOOL
-- =====================================================

CREATE OR REPLACE FUNCTION get_latest_attempt_for_tool(
  p_user_id UUID,
  p_tool_id UUID
)
RETURNS TABLE (
  attempt_id UUID,
  attempt_number INTEGER,
  score_percentage DECIMAL,
  ability_estimate DECIMAL,
  is_completed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    attempt_number,
    score_percentage,
    ability_estimate,
    is_completed,
    completed_at
  FROM assessment_tool_attempts
  WHERE user_id = p_user_id
    AND tool_id = p_tool_id
  ORDER BY attempt_number DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: GET ATTEMPT HISTORY WITH TRENDS
-- =====================================================

CREATE OR REPLACE FUNCTION get_attempt_history(
  p_user_id UUID,
  p_tool_id UUID
)
RETURNS TABLE (
  attempt_number INTEGER,
  score_percentage DECIMAL,
  ability_estimate DECIMAL,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  improvement_from_previous DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.attempt_number,
    a.score_percentage,
    a.ability_estimate,
    a.completed_at,
    a.time_taken_seconds,
    (a.score_percentage - LAG(a.score_percentage) OVER (ORDER BY a.attempt_number)) as improvement_from_previous
  FROM assessment_tool_attempts a
  WHERE a.user_id = p_user_id
    AND a.tool_id = p_tool_id
    AND a.is_completed = true
  ORDER BY a.attempt_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: GET ASSESSMENT TOOLS FOR AUDIENCE
-- =====================================================

CREATE OR REPLACE FUNCTION get_assessment_tools_for_audience(
  p_audience TEXT
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  icon VARCHAR,
  category_type VARCHAR,
  difficulty_level VARCHAR,
  estimated_duration_minutes INTEGER,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.slug,
    t.description,
    t.icon,
    t.category_type,
    t.difficulty_level,
    t.estimated_duration_minutes,
    t.display_order
  FROM assessment_tools t
  WHERE t.is_active = true
    AND (p_audience = ANY(t.target_audiences) OR 'All' = ANY(t.target_audiences))
  ORDER BY t.display_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE assessment_tools IS 'Catalog of assessment tools (AI-Readiness, AI-Awareness, AI-Fluency) with audience targeting';
COMMENT ON TABLE assessment_tool_attempts IS 'Tracks all user attempts with unlimited retakes, full history, and performance analytics';
COMMENT ON TABLE assessment_question_pools IS 'Links questions to assessment tools for adaptive question selection';

COMMENT ON FUNCTION get_latest_attempt_for_tool IS 'Returns user''s most recent attempt for a specific assessment tool';
COMMENT ON FUNCTION get_attempt_history IS 'Returns complete attempt history with score trends and improvement metrics';
COMMENT ON FUNCTION get_assessment_tools_for_audience IS 'Returns active assessment tools filtered by target audience';
