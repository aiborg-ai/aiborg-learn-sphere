/**
 * Intelligent Skills Tracking System
 *
 * Phase 2.2: Enhanced skills infrastructure for:
 * - Industry-standard skills taxonomy
 * - Skill prerequisites and relationships
 * - Job role skill requirements
 * - AI-powered skill recommendations
 * - Peer benchmarking
 */

-- Industry Skills Taxonomy
CREATE TABLE IF NOT EXISTS industry_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- e.g., 'technical', 'soft_skills', 'leadership', 'domain_specific'
  subcategory TEXT, -- e.g., 'programming', 'data_science', 'communication'
  industry TEXT[], -- e.g., ['technology', 'finance', 'healthcare']
  proficiency_levels JSONB DEFAULT '["awareness", "foundational", "intermediate", "advanced", "expert"]'::jsonb,
  related_skills TEXT[], -- Array of related skill slugs
  is_trending BOOLEAN DEFAULT FALSE,
  demand_score INTEGER DEFAULT 50, -- 0-100 market demand score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill Prerequisites (DAG for skill dependencies)
CREATE TABLE IF NOT EXISTS skill_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES industry_skills(id) ON DELETE CASCADE,
  prerequisite_skill_id UUID NOT NULL REFERENCES industry_skills(id) ON DELETE CASCADE,
  required_level TEXT DEFAULT 'foundational', -- Minimum level needed
  is_recommended BOOLEAN DEFAULT FALSE, -- vs required
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, prerequisite_skill_id)
);

-- User Skills Inventory (enhanced)
CREATE TABLE IF NOT EXISTS user_skills_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES industry_skills(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL DEFAULT 'awareness',
  proficiency_score INTEGER DEFAULT 0, -- 0-100 fine-grained score
  verified BOOLEAN DEFAULT FALSE, -- Verified through assessment
  verified_at TIMESTAMPTZ,
  source TEXT, -- 'assessment', 'course_completion', 'self_reported', 'ai_inferred'
  evidence JSONB DEFAULT '[]'::jsonb, -- Certificates, badges, etc.
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Job Roles with Skill Requirements
CREATE TABLE IF NOT EXISTS job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  industry TEXT[],
  experience_level TEXT, -- 'entry', 'mid', 'senior', 'lead', 'executive'
  average_salary_usd INTEGER,
  growth_rate NUMERIC, -- Projected growth %
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Role Skill Requirements
CREATE TABLE IF NOT EXISTS job_role_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_role_id UUID NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES industry_skills(id) ON DELETE CASCADE,
  required_level TEXT NOT NULL DEFAULT 'intermediate',
  importance TEXT DEFAULT 'required', -- 'required', 'preferred', 'bonus'
  weight INTEGER DEFAULT 10, -- For scoring (0-100)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_role_id, skill_id)
);

-- User Career Goals
CREATE TABLE IF NOT EXISTS user_career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_role_id UUID NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
  target_date DATE,
  priority INTEGER DEFAULT 1, -- 1 = highest priority
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_role_id)
);

-- Skill Assessments (pre/post course)
CREATE TABLE IF NOT EXISTS skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES industry_skills(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL, -- 'pre_course', 'post_course', 'standalone', 'certification'
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  score INTEGER NOT NULL, -- 0-100
  proficiency_level TEXT NOT NULL,
  time_taken_seconds INTEGER,
  questions_answered INTEGER,
  correct_answers INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill Recommendations (AI-generated)
CREATE TABLE IF NOT EXISTS skill_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES industry_skills(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- Why this skill is recommended
  priority_score INTEGER DEFAULT 50, -- 0-100
  recommended_courses UUID[], -- Course IDs
  estimated_hours INTEGER,
  business_impact TEXT, -- 'critical', 'high', 'medium', 'low'
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Skill Benchmarks (for peer comparison)
CREATE TABLE IF NOT EXISTS skill_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES industry_skills(id) ON DELETE CASCADE,
  benchmark_group TEXT NOT NULL, -- 'industry', 'role', 'experience_level', 'organization'
  benchmark_value TEXT, -- The specific group value (e.g., 'data_scientist', '3-5_years')
  percentile_25 INTEGER,
  percentile_50 INTEGER,
  percentile_75 INTEGER,
  percentile_90 INTEGER,
  sample_size INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, benchmark_group, benchmark_value)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_industry_skills_category ON industry_skills(category);
CREATE INDEX IF NOT EXISTS idx_industry_skills_trending ON industry_skills(is_trending) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_skills_inventory_user ON user_skills_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_inventory_skill ON user_skills_inventory(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_user ON skill_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_recommendations_user ON skill_recommendations(user_id) WHERE is_dismissed = FALSE;
CREATE INDEX IF NOT EXISTS idx_job_role_skills_role ON job_role_skills(job_role_id);

-- RLS Policies
ALTER TABLE industry_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_role_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_benchmarks ENABLE ROW LEVEL SECURITY;

-- Public read access for taxonomy
CREATE POLICY "Anyone can read industry skills" ON industry_skills FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read skill prerequisites" ON skill_prerequisites FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read job roles" ON job_roles FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read job role skills" ON job_role_skills FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read skill benchmarks" ON skill_benchmarks FOR SELECT USING (TRUE);

-- User-specific access
CREATE POLICY "Users can read own skills inventory" ON user_skills_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own skills inventory" ON user_skills_inventory FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own career goals" ON user_career_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own career goals" ON user_career_goals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own skill assessments" ON skill_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill assessments" ON skill_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own recommendations" ON skill_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own recommendations" ON skill_recommendations FOR UPDATE USING (auth.uid() = user_id);

-- Function to get user skill match for a job role
CREATE OR REPLACE FUNCTION get_job_role_skill_match(
  p_user_id UUID,
  p_job_role_id UUID
)
RETURNS TABLE (
  match_percentage INTEGER,
  matched_skills INTEGER,
  total_required INTEGER,
  skill_gaps JSONB,
  strengths JSONB
) AS $$
DECLARE
  v_matched INTEGER := 0;
  v_total INTEGER := 0;
  v_gaps JSONB := '[]'::jsonb;
  v_strengths JSONB := '[]'::jsonb;
BEGIN
  -- Count required skills and matches
  SELECT
    COUNT(*) FILTER (WHERE usi.proficiency_level >= jrs.required_level OR
                          CASE
                            WHEN jrs.required_level = 'awareness' THEN 1
                            WHEN jrs.required_level = 'foundational' THEN 2
                            WHEN jrs.required_level = 'intermediate' THEN 3
                            WHEN jrs.required_level = 'advanced' THEN 4
                            WHEN jrs.required_level = 'expert' THEN 5
                            ELSE 3
                          END <=
                          CASE
                            WHEN usi.proficiency_level = 'awareness' THEN 1
                            WHEN usi.proficiency_level = 'foundational' THEN 2
                            WHEN usi.proficiency_level = 'intermediate' THEN 3
                            WHEN usi.proficiency_level = 'advanced' THEN 4
                            WHEN usi.proficiency_level = 'expert' THEN 5
                            ELSE 0
                          END),
    COUNT(*)
  INTO v_matched, v_total
  FROM job_role_skills jrs
  LEFT JOIN user_skills_inventory usi ON usi.skill_id = jrs.skill_id AND usi.user_id = p_user_id
  WHERE jrs.job_role_id = p_job_role_id;

  -- Get skill gaps
  SELECT jsonb_agg(jsonb_build_object(
    'skill_name', s.name,
    'required_level', jrs.required_level,
    'current_level', COALESCE(usi.proficiency_level, 'none'),
    'importance', jrs.importance
  ))
  INTO v_gaps
  FROM job_role_skills jrs
  JOIN industry_skills s ON s.id = jrs.skill_id
  LEFT JOIN user_skills_inventory usi ON usi.skill_id = jrs.skill_id AND usi.user_id = p_user_id
  WHERE jrs.job_role_id = p_job_role_id
    AND (usi.id IS NULL OR
         CASE
           WHEN jrs.required_level = 'awareness' THEN 1
           WHEN jrs.required_level = 'foundational' THEN 2
           WHEN jrs.required_level = 'intermediate' THEN 3
           WHEN jrs.required_level = 'advanced' THEN 4
           WHEN jrs.required_level = 'expert' THEN 5
           ELSE 3
         END >
         CASE
           WHEN usi.proficiency_level = 'awareness' THEN 1
           WHEN usi.proficiency_level = 'foundational' THEN 2
           WHEN usi.proficiency_level = 'intermediate' THEN 3
           WHEN usi.proficiency_level = 'advanced' THEN 4
           WHEN usi.proficiency_level = 'expert' THEN 5
           ELSE 0
         END);

  -- Get strengths (skills that exceed requirements)
  SELECT jsonb_agg(jsonb_build_object(
    'skill_name', s.name,
    'required_level', jrs.required_level,
    'current_level', usi.proficiency_level
  ))
  INTO v_strengths
  FROM job_role_skills jrs
  JOIN industry_skills s ON s.id = jrs.skill_id
  JOIN user_skills_inventory usi ON usi.skill_id = jrs.skill_id AND usi.user_id = p_user_id
  WHERE jrs.job_role_id = p_job_role_id
    AND CASE
          WHEN usi.proficiency_level = 'awareness' THEN 1
          WHEN usi.proficiency_level = 'foundational' THEN 2
          WHEN usi.proficiency_level = 'intermediate' THEN 3
          WHEN usi.proficiency_level = 'advanced' THEN 4
          WHEN usi.proficiency_level = 'expert' THEN 5
          ELSE 0
        END >
        CASE
          WHEN jrs.required_level = 'awareness' THEN 1
          WHEN jrs.required_level = 'foundational' THEN 2
          WHEN jrs.required_level = 'intermediate' THEN 3
          WHEN jrs.required_level = 'advanced' THEN 4
          WHEN jrs.required_level = 'expert' THEN 5
          ELSE 3
        END;

  RETURN QUERY SELECT
    CASE WHEN v_total > 0 THEN (v_matched * 100 / v_total)::INTEGER ELSE 0 END,
    v_matched,
    v_total,
    COALESCE(v_gaps, '[]'::jsonb),
    COALESCE(v_strengths, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get skill percentile for a user
CREATE OR REPLACE FUNCTION get_user_skill_percentile(
  p_user_id UUID,
  p_skill_id UUID,
  p_benchmark_group TEXT DEFAULT 'industry'
)
RETURNS INTEGER AS $$
DECLARE
  v_user_score INTEGER;
  v_percentile INTEGER;
BEGIN
  -- Get user's score
  SELECT proficiency_score INTO v_user_score
  FROM user_skills_inventory
  WHERE user_id = p_user_id AND skill_id = p_skill_id;

  IF v_user_score IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate percentile based on all users with this skill
  SELECT (
    COUNT(*) FILTER (WHERE proficiency_score <= v_user_score) * 100 /
    NULLIF(COUNT(*), 0)
  )::INTEGER INTO v_percentile
  FROM user_skills_inventory
  WHERE skill_id = p_skill_id;

  RETURN COALESCE(v_percentile, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate AI skill recommendations
CREATE OR REPLACE FUNCTION generate_skill_recommendations(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Clear old recommendations
  DELETE FROM skill_recommendations
  WHERE user_id = p_user_id AND (is_dismissed = TRUE OR expires_at < NOW());

  -- Generate recommendations based on career goals
  INSERT INTO skill_recommendations (user_id, skill_id, reason, priority_score, estimated_hours, business_impact)
  SELECT DISTINCT ON (jrs.skill_id)
    p_user_id,
    jrs.skill_id,
    'Required for ' || jr.title || ' career goal',
    CASE jrs.importance
      WHEN 'required' THEN 90
      WHEN 'preferred' THEN 70
      ELSE 50
    END,
    CASE
      WHEN jrs.required_level = 'foundational' THEN 10
      WHEN jrs.required_level = 'intermediate' THEN 30
      WHEN jrs.required_level = 'advanced' THEN 60
      WHEN jrs.required_level = 'expert' THEN 100
      ELSE 20
    END,
    CASE jrs.importance
      WHEN 'required' THEN 'critical'
      WHEN 'preferred' THEN 'high'
      ELSE 'medium'
    END
  FROM user_career_goals ucg
  JOIN job_roles jr ON jr.id = ucg.job_role_id
  JOIN job_role_skills jrs ON jrs.job_role_id = jr.id
  LEFT JOIN user_skills_inventory usi ON usi.skill_id = jrs.skill_id AND usi.user_id = p_user_id
  WHERE ucg.user_id = p_user_id
    AND ucg.is_active = TRUE
    AND (usi.id IS NULL OR usi.proficiency_score < 70)
    AND NOT EXISTS (
      SELECT 1 FROM skill_recommendations sr
      WHERE sr.user_id = p_user_id AND sr.skill_id = jrs.skill_id AND sr.is_dismissed = FALSE
    )
  ORDER BY jrs.skill_id, ucg.priority;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Add trending skills recommendations
  INSERT INTO skill_recommendations (user_id, skill_id, reason, priority_score, estimated_hours, business_impact)
  SELECT
    p_user_id,
    s.id,
    'Trending skill in your industry with high demand',
    s.demand_score,
    30,
    'medium'
  FROM industry_skills s
  LEFT JOIN user_skills_inventory usi ON usi.skill_id = s.id AND usi.user_id = p_user_id
  WHERE s.is_trending = TRUE
    AND usi.id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM skill_recommendations sr
      WHERE sr.user_id = p_user_id AND sr.skill_id = s.id
    )
  LIMIT 3;

  GET DIAGNOSTICS v_count = v_count + ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_job_role_skill_match(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_skill_percentile(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_skill_recommendations(UUID) TO authenticated;

-- Populate initial industry skills taxonomy (AI/ML focused)
INSERT INTO industry_skills (name, slug, description, category, subcategory, industry, is_trending, demand_score) VALUES
-- Technical Skills - AI/ML
('Machine Learning', 'machine-learning', 'Building systems that learn from data', 'technical', 'ai_ml', ARRAY['technology', 'finance', 'healthcare'], TRUE, 95),
('Deep Learning', 'deep-learning', 'Neural networks and deep architectures', 'technical', 'ai_ml', ARRAY['technology', 'research'], TRUE, 92),
('Natural Language Processing', 'nlp', 'Processing and understanding human language', 'technical', 'ai_ml', ARRAY['technology'], TRUE, 90),
('Computer Vision', 'computer-vision', 'Enabling machines to interpret visual data', 'technical', 'ai_ml', ARRAY['technology', 'manufacturing', 'healthcare'], TRUE, 88),
('Generative AI', 'generative-ai', 'Creating AI systems that generate content', 'technical', 'ai_ml', ARRAY['technology', 'media'], TRUE, 98),
('Prompt Engineering', 'prompt-engineering', 'Crafting effective prompts for AI models', 'technical', 'ai_ml', ARRAY['technology'], TRUE, 96),
('RAG Systems', 'rag-systems', 'Retrieval Augmented Generation implementation', 'technical', 'ai_ml', ARRAY['technology'], TRUE, 85),
('MLOps', 'mlops', 'ML operations and deployment', 'technical', 'ai_ml', ARRAY['technology'], TRUE, 87),

-- Technical Skills - Programming
('Python', 'python', 'Python programming language', 'technical', 'programming', ARRAY['technology', 'finance', 'research'], TRUE, 94),
('JavaScript', 'javascript', 'JavaScript programming language', 'technical', 'programming', ARRAY['technology'], FALSE, 85),
('TypeScript', 'typescript', 'TypeScript programming language', 'technical', 'programming', ARRAY['technology'], TRUE, 88),
('SQL', 'sql', 'Database query language', 'technical', 'programming', ARRAY['technology', 'finance', 'healthcare'], FALSE, 80),
('R', 'r-programming', 'R statistical programming', 'technical', 'programming', ARRAY['research', 'finance'], FALSE, 70),

-- Technical Skills - Data
('Data Analysis', 'data-analysis', 'Analyzing and interpreting data', 'technical', 'data_science', ARRAY['technology', 'finance', 'healthcare'], FALSE, 85),
('Data Visualization', 'data-visualization', 'Creating visual representations of data', 'technical', 'data_science', ARRAY['technology', 'finance'], FALSE, 78),
('Statistical Analysis', 'statistical-analysis', 'Applying statistical methods', 'technical', 'data_science', ARRAY['research', 'finance', 'healthcare'], FALSE, 75),
('Big Data', 'big-data', 'Processing large-scale datasets', 'technical', 'data_science', ARRAY['technology', 'finance'], FALSE, 82),

-- Soft Skills
('Critical Thinking', 'critical-thinking', 'Analyzing and evaluating information', 'soft_skills', 'cognitive', ARRAY['technology', 'finance', 'healthcare', 'education'], FALSE, 85),
('Problem Solving', 'problem-solving', 'Finding solutions to complex problems', 'soft_skills', 'cognitive', ARRAY['technology', 'finance', 'healthcare'], FALSE, 88),
('Communication', 'communication', 'Effective verbal and written communication', 'soft_skills', 'interpersonal', ARRAY['technology', 'finance', 'healthcare', 'education'], FALSE, 90),
('Collaboration', 'collaboration', 'Working effectively in teams', 'soft_skills', 'interpersonal', ARRAY['technology', 'finance', 'healthcare'], FALSE, 85),
('Creativity', 'creativity', 'Generating innovative ideas', 'soft_skills', 'cognitive', ARRAY['technology', 'media', 'education'], FALSE, 80),

-- Leadership Skills
('AI Strategy', 'ai-strategy', 'Developing AI adoption strategies', 'leadership', 'strategy', ARRAY['technology', 'finance'], TRUE, 88),
('Change Management', 'change-management', 'Leading organizational change', 'leadership', 'management', ARRAY['technology', 'finance', 'healthcare'], FALSE, 82),
('Project Management', 'project-management', 'Planning and executing projects', 'leadership', 'management', ARRAY['technology', 'finance', 'healthcare'], FALSE, 85),
('Team Leadership', 'team-leadership', 'Leading and motivating teams', 'leadership', 'management', ARRAY['technology', 'finance', 'healthcare'], FALSE, 88)
ON CONFLICT (slug) DO NOTHING;

-- Populate skill prerequisites
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_level, is_recommended)
SELECT
  (SELECT id FROM industry_skills WHERE slug = 'deep-learning'),
  (SELECT id FROM industry_skills WHERE slug = 'machine-learning'),
  'intermediate',
  FALSE
WHERE EXISTS (SELECT 1 FROM industry_skills WHERE slug = 'deep-learning')
  AND EXISTS (SELECT 1 FROM industry_skills WHERE slug = 'machine-learning')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_level, is_recommended)
SELECT
  (SELECT id FROM industry_skills WHERE slug = 'machine-learning'),
  (SELECT id FROM industry_skills WHERE slug = 'python'),
  'foundational',
  FALSE
WHERE EXISTS (SELECT 1 FROM industry_skills WHERE slug = 'machine-learning')
  AND EXISTS (SELECT 1 FROM industry_skills WHERE slug = 'python')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_level, is_recommended)
SELECT
  (SELECT id FROM industry_skills WHERE slug = 'rag-systems'),
  (SELECT id FROM industry_skills WHERE slug = 'nlp'),
  'foundational',
  TRUE
WHERE EXISTS (SELECT 1 FROM industry_skills WHERE slug = 'rag-systems')
  AND EXISTS (SELECT 1 FROM industry_skills WHERE slug = 'nlp')
ON CONFLICT DO NOTHING;

-- Populate sample job roles
INSERT INTO job_roles (title, slug, description, industry, experience_level, average_salary_usd, growth_rate) VALUES
('AI/ML Engineer', 'ai-ml-engineer', 'Build and deploy machine learning models', ARRAY['technology'], 'mid', 145000, 22.5),
('Data Scientist', 'data-scientist', 'Extract insights from complex datasets', ARRAY['technology', 'finance'], 'mid', 130000, 19.8),
('Prompt Engineer', 'prompt-engineer', 'Design prompts for LLMs and generative AI', ARRAY['technology'], 'entry', 100000, 45.2),
('AI Product Manager', 'ai-product-manager', 'Lead AI product development strategy', ARRAY['technology'], 'senior', 165000, 28.3),
('MLOps Engineer', 'mlops-engineer', 'Deploy and maintain ML systems in production', ARRAY['technology'], 'mid', 155000, 35.7)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE industry_skills IS 'Industry-standard skills taxonomy for intelligent skills tracking';
COMMENT ON TABLE skill_prerequisites IS 'Skill dependency graph showing prerequisites';
COMMENT ON TABLE user_skills_inventory IS 'User skill proficiency inventory with verification';
COMMENT ON TABLE job_roles IS 'Job roles with skill requirements for career matching';
COMMENT ON TABLE skill_recommendations IS 'AI-generated skill recommendations for users';
