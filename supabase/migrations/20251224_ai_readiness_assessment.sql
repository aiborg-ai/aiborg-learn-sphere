-- ============================================================================
-- AI Readiness Assessment System
-- Comprehensive assessment for SMEs to evaluate AI adoption readiness
-- ============================================================================

-- ============================================================================
-- 1. ENUMS & TYPES
-- ============================================================================

-- Drop existing types if they exist
DROP TYPE IF EXISTS assessment_tier CASCADE;
DROP TYPE IF EXISTS maturity_level CASCADE;
DROP TYPE IF EXISTS stakeholder_role CASCADE;

-- Assessment tier (freemium vs premium)
CREATE TYPE assessment_tier AS ENUM (
  'freemium',      -- 30 questions, basic report
  'premium',       -- 60 questions, full report + roadmap
  'enterprise'     -- Multi-stakeholder, benchmarking, quarterly
);

-- AI readiness maturity levels
CREATE TYPE maturity_level AS ENUM (
  'awareness',     -- 0-20: Just exploring AI
  'experimenting', -- 21-40: Running pilot projects
  'adopting',      -- 41-60: Scaling AI initiatives
  'optimizing',    -- 61-80: AI-first operations
  'leading'        -- 81-100: AI innovation leader
);

-- Stakeholder roles for multi-person assessment
CREATE TYPE stakeholder_role AS ENUM (
  'ceo',           -- Chief Executive / Owner
  'cto',           -- Chief Technology Officer
  'cfo',           -- Chief Financial Officer
  'operations',    -- Operations Manager
  'hr',            -- Human Resources
  'marketing',     -- Marketing/Sales
  'it',            -- IT Manager
  'other'          -- Other role
);

-- ============================================================================
-- 2. CORE ASSESSMENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_readiness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,

  -- Assessment metadata
  assessment_tier assessment_tier NOT NULL DEFAULT 'freemium',
  assessment_name VARCHAR(255), -- Custom name for tracking multiple assessments

  -- Company info (copied at assessment time for historical tracking)
  company_name VARCHAR(255),
  industry VARCHAR(100),
  company_size VARCHAR(50),

  -- Overall scores (calculated fields)
  overall_readiness_score DECIMAL(5,2), -- 0-100
  maturity_level maturity_level,

  -- Dimension scores (0-100 each, weighted in overall score)
  strategic_alignment_score DECIMAL(5,2),
  data_maturity_score DECIMAL(5,2),
  tech_infrastructure_score DECIMAL(5,2),
  human_capital_score DECIMAL(5,2),
  process_maturity_score DECIMAL(5,2),
  change_readiness_score DECIMAL(5,2),

  -- Dimension weights (for custom weighting, default all 16.67%)
  strategic_weight DECIMAL(5,2) DEFAULT 16.67,
  data_weight DECIMAL(5,2) DEFAULT 16.67,
  tech_weight DECIMAL(5,2) DEFAULT 16.67,
  human_weight DECIMAL(5,2) DEFAULT 16.67,
  process_weight DECIMAL(5,2) DEFAULT 16.67,
  change_weight DECIMAL(5,2) DEFAULT 16.67,

  -- Multi-stakeholder tracking
  is_multi_stakeholder BOOLEAN DEFAULT false,
  invited_stakeholder_count INTEGER DEFAULT 0,
  completed_stakeholder_count INTEGER DEFAULT 0,

  -- Benchmarking
  industry_percentile DECIMAL(5,2), -- Position vs industry peers
  size_percentile DECIMAL(5,2),     -- Position vs similar-sized companies

  -- Report generation
  report_generated_at TIMESTAMPTZ,
  report_url TEXT, -- PDF storage URL
  roadmap_generated_at TIMESTAMPTZ,

  -- Status tracking
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_saved_section INTEGER DEFAULT 1, -- Resume capability

  -- Consultation tracking (for premium tier)
  consultation_scheduled BOOLEAN DEFAULT false,
  consultation_completed BOOLEAN DEFAULT false,
  consultation_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_percentiles CHECK (
    (industry_percentile IS NULL OR (industry_percentile >= 0 AND industry_percentile <= 100)) AND
    (size_percentile IS NULL OR (size_percentile >= 0 AND size_percentile <= 100))
  ),
  CONSTRAINT valid_scores CHECK (
    (overall_readiness_score IS NULL OR (overall_readiness_score >= 0 AND overall_readiness_score <= 100))
  )
);

CREATE INDEX idx_readiness_user ON ai_readiness_assessments(user_id);
CREATE INDEX idx_readiness_company ON ai_readiness_assessments(company_id);
CREATE INDEX idx_readiness_completed ON ai_readiness_assessments(is_completed, completed_at DESC);
CREATE INDEX idx_readiness_tier ON ai_readiness_assessments(assessment_tier);
CREATE INDEX idx_readiness_industry ON ai_readiness_assessments(industry) WHERE is_completed = true;

-- ============================================================================
-- 3. DIMENSION-SPECIFIC DETAIL TABLES
-- ============================================================================

-- 3.1 Strategic Alignment Details
CREATE TABLE IF NOT EXISTS readiness_strategic_alignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_readiness_assessments(id) ON DELETE CASCADE,

  -- Questions (1-5 scale unless noted)
  executive_buy_in INTEGER CHECK (executive_buy_in BETWEEN 1 AND 5),
  budget_allocated INTEGER CHECK (budget_allocated BETWEEN 1 AND 5),
  clear_use_cases INTEGER CHECK (clear_use_cases BETWEEN 1 AND 5),
  kpis_defined INTEGER CHECK (kpis_defined BETWEEN 1 AND 5),
  change_champions INTEGER CHECK (change_champions BETWEEN 1 AND 5),
  competitive_pressure INTEGER CHECK (competitive_pressure BETWEEN 1 AND 5),
  innovation_culture INTEGER CHECK (innovation_culture BETWEEN 1 AND 5),
  strategic_roadmap INTEGER CHECK (strategic_roadmap BETWEEN 1 AND 5),
  roi_expectations TEXT, -- Open text
  priority_use_cases TEXT[], -- Array of use cases

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id)
);

-- 3.2 Data Maturity Details
CREATE TABLE IF NOT EXISTS readiness_data_maturity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_readiness_assessments(id) ON DELETE CASCADE,

  data_quality INTEGER CHECK (data_quality BETWEEN 1 AND 5),
  data_accessibility INTEGER CHECK (data_accessibility BETWEEN 1 AND 5),
  data_governance INTEGER CHECK (data_governance BETWEEN 1 AND 5),
  data_documentation INTEGER CHECK (data_documentation BETWEEN 1 AND 5),
  privacy_compliance INTEGER CHECK (privacy_compliance BETWEEN 1 AND 5),
  security_posture INTEGER CHECK (security_posture BETWEEN 1 AND 5),
  data_integration INTEGER CHECK (data_integration BETWEEN 1 AND 5),
  master_data_mgmt INTEGER CHECK (master_data_mgmt BETWEEN 1 AND 5),
  data_volume_adequacy INTEGER CHECK (data_volume_adequacy BETWEEN 1 AND 5),
  data_silos INTEGER CHECK (data_silos BETWEEN 1 AND 5),
  key_data_sources TEXT[], -- List of primary data sources
  data_challenges TEXT, -- Open text

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id)
);

-- 3.3 Technical Infrastructure Details
CREATE TABLE IF NOT EXISTS readiness_tech_infrastructure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_readiness_assessments(id) ON DELETE CASCADE,

  cloud_readiness INTEGER CHECK (cloud_readiness BETWEEN 1 AND 5),
  it_systems_capability INTEGER CHECK (it_systems_capability BETWEEN 1 AND 5),
  api_availability INTEGER CHECK (api_availability BETWEEN 1 AND 5),
  security_infrastructure INTEGER CHECK (security_infrastructure BETWEEN 1 AND 5),
  scalability INTEGER CHECK (scalability BETWEEN 1 AND 5),
  integration_capability INTEGER CHECK (integration_capability BETWEEN 1 AND 5),
  vendor_ecosystem INTEGER CHECK (vendor_ecosystem BETWEEN 1 AND 5),
  it_support_capacity INTEGER CHECK (it_support_capacity BETWEEN 1 AND 5),
  current_tech_stack TEXT, -- Open text description
  planned_upgrades TEXT[], -- List of planned tech improvements

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id)
);

-- 3.4 Human Capital Details
CREATE TABLE IF NOT EXISTS readiness_human_capital (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_readiness_assessments(id) ON DELETE CASCADE,

  executive_ai_literacy INTEGER CHECK (executive_ai_literacy BETWEEN 1 AND 5),
  technical_team_skills INTEGER CHECK (technical_team_skills BETWEEN 1 AND 5),
  business_team_literacy INTEGER CHECK (business_team_literacy BETWEEN 1 AND 5),
  training_budget INTEGER CHECK (training_budget BETWEEN 1 AND 5),
  hiring_capability INTEGER CHECK (hiring_capability BETWEEN 1 AND 5),
  external_expertise INTEGER CHECK (external_expertise BETWEEN 1 AND 5),
  learning_culture INTEGER CHECK (learning_culture BETWEEN 1 AND 5),
  skills_gap_awareness INTEGER CHECK (skills_gap_awareness BETWEEN 1 AND 5),
  retention_capability INTEGER CHECK (retention_capability BETWEEN 1 AND 5),
  change_management INTEGER CHECK (change_management BETWEEN 1 AND 5),
  critical_skill_gaps TEXT[], -- List of identified gaps
  training_priorities TEXT, -- Open text

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id)
);

-- 3.5 Process Maturity Details
CREATE TABLE IF NOT EXISTS readiness_process_maturity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_readiness_assessments(id) ON DELETE CASCADE,

  process_documentation INTEGER CHECK (process_documentation BETWEEN 1 AND 5),
  process_standardization INTEGER CHECK (process_standardization BETWEEN 1 AND 5),
  automation_level INTEGER CHECK (automation_level BETWEEN 1 AND 5),
  performance_metrics INTEGER CHECK (performance_metrics BETWEEN 1 AND 5),
  continuous_improvement INTEGER CHECK (continuous_improvement BETWEEN 1 AND 5),
  workflow_efficiency INTEGER CHECK (workflow_efficiency BETWEEN 1 AND 5),
  decision_making_speed INTEGER CHECK (decision_making_speed BETWEEN 1 AND 5),
  quality_control INTEGER CHECK (quality_control BETWEEN 1 AND 5),
  automation_opportunities TEXT[], -- List of processes to automate
  process_pain_points TEXT, -- Open text

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id)
);

-- 3.6 Change Readiness Details
CREATE TABLE IF NOT EXISTS readiness_change_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_readiness_assessments(id) ON DELETE CASCADE,

  leadership_commitment INTEGER CHECK (leadership_commitment BETWEEN 1 AND 5),
  employee_sentiment INTEGER CHECK (employee_sentiment BETWEEN 1 AND 5),
  communication_plan INTEGER CHECK (communication_plan BETWEEN 1 AND 5),
  pilot_approach INTEGER CHECK (pilot_approach BETWEEN 1 AND 5),
  risk_tolerance INTEGER CHECK (risk_tolerance BETWEEN 1 AND 5),
  change_history INTEGER CHECK (change_history BETWEEN 1 AND 5),
  resistance_management INTEGER CHECK (resistance_management BETWEEN 1 AND 5),
  success_celebration INTEGER CHECK (success_celebration BETWEEN 1 AND 5),
  anticipated_resistance TEXT, -- Open text
  mitigation_strategies TEXT[], -- List of strategies

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id)
);

-- ============================================================================
-- 4. MULTI-STAKEHOLDER RESPONSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS readiness_stakeholder_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_readiness_assessments(id) ON DELETE CASCADE,

  email VARCHAR(255) NOT NULL,
  stakeholder_role stakeholder_role NOT NULL,
  stakeholder_name VARCHAR(255),

  invite_token UUID DEFAULT gen_random_uuid(),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),

  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,

  UNIQUE(assessment_id, email)
);

CREATE INDEX idx_stakeholder_invites_assessment ON readiness_stakeholder_invites(assessment_id);
CREATE INDEX idx_stakeholder_invites_token ON readiness_stakeholder_invites(invite_token);
CREATE INDEX idx_stakeholder_invites_pending ON readiness_stakeholder_invites(is_completed) WHERE is_completed = false;

CREATE TABLE IF NOT EXISTS readiness_stakeholder_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_readiness_assessments(id) ON DELETE CASCADE,
  invite_id UUID REFERENCES readiness_stakeholder_invites(id) ON DELETE CASCADE,

  stakeholder_email VARCHAR(255) NOT NULL,
  stakeholder_role stakeholder_role NOT NULL,

  -- Store all responses as JSONB for flexibility
  strategic_responses JSONB DEFAULT '{}',
  data_responses JSONB DEFAULT '{}',
  tech_responses JSONB DEFAULT '{}',
  human_responses JSONB DEFAULT '{}',
  process_responses JSONB DEFAULT '{}',
  change_responses JSONB DEFAULT '{}',

  -- Calculated scores for this stakeholder
  strategic_score DECIMAL(5,2),
  data_score DECIMAL(5,2),
  tech_score DECIMAL(5,2),
  human_score DECIMAL(5,2),
  process_score DECIMAL(5,2),
  change_score DECIMAL(5,2),

  completed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assessment_id, stakeholder_email)
);

CREATE INDEX idx_stakeholder_responses_assessment ON readiness_stakeholder_responses(assessment_id);

-- ============================================================================
-- 5. BENCHMARKING DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS readiness_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Segmentation
  industry VARCHAR(100),
  company_size VARCHAR(50), -- '1-10', '11-50', '51-200', '201-500', '500+'
  dimension VARCHAR(50) NOT NULL, -- 'overall', 'strategic', 'data', etc.

  -- Statistical measures
  sample_size INTEGER NOT NULL,
  avg_score DECIMAL(5,2) NOT NULL,
  median_score DECIMAL(5,2),
  std_dev DECIMAL(5,2),

  -- Percentiles
  percentile_25 DECIMAL(5,2),
  percentile_50 DECIMAL(5,2),
  percentile_75 DECIMAL(5,2),
  percentile_90 DECIMAL(5,2),

  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(industry, company_size, dimension)
);

CREATE INDEX idx_benchmarks_lookup ON readiness_benchmarks(industry, company_size, dimension);

-- ============================================================================
-- 6. MATURITY LEVEL CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS readiness_maturity_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level maturity_level NOT NULL UNIQUE,
  level_order INTEGER NOT NULL,
  min_score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL,

  -- Display
  display_name VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  badge_color VARCHAR(20),
  badge_icon VARCHAR(50),

  -- Characteristics
  characteristics TEXT[], -- Array of key traits
  typical_challenges TEXT[], -- Common issues at this level
  next_level_focus TEXT[], -- What to work on to advance

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed maturity levels
INSERT INTO readiness_maturity_config
  (level, level_order, min_score, max_score, display_name, description, badge_color, badge_icon, characteristics, typical_challenges, next_level_focus)
VALUES
  ('awareness', 1, 0, 20, 'AI Awareness',
   'Your organization is beginning to explore AI opportunities but lacks structured approach.',
   '#9CA3AF', 'info',
   ARRAY['Exploring AI concepts', 'No formal AI strategy', 'Limited technical capability', 'Early-stage learning'],
   ARRAY['Lack of executive buy-in', 'Unclear use cases', 'Limited budget', 'Skills shortage'],
   ARRAY['Educate leadership team', 'Identify quick-win use cases', 'Assess data readiness', 'Build business case']),

  ('experimenting', 2, 21, 40, 'Experimenting',
   'You are running pilot projects and building foundational AI capabilities.',
   '#60A5FA', 'flask',
   ARRAY['Running pilots', 'Building initial capabilities', 'Learning from experiments', 'Some quick wins achieved'],
   ARRAY['Difficulty scaling pilots', 'Fragmented efforts', 'ROI uncertainty', 'Change resistance'],
   ARRAY['Standardize AI approach', 'Improve data infrastructure', 'Develop AI skills', 'Plan for scale']),

  ('adopting', 3, 41, 60, 'Adopting',
   'You are scaling AI initiatives across the organization with measurable impact.',
   '#34D399', 'trending-up',
   ARRAY['Scaling successful pilots', 'Established AI governance', 'Clear ROI demonstrated', 'Growing AI team'],
   ARRAY['Integration complexity', 'Process adaptation', 'Talent retention', 'Change fatigue'],
   ARRAY['Optimize AI operations', 'Build AI-first culture', 'Expand use cases', 'Automate workflows']),

  ('optimizing', 4, 61, 80, 'Optimizing',
   'AI is embedded in core operations and driving continuous improvement.',
   '#F97316', 'target',
   ARRAY['AI-first mindset', 'Automated key processes', 'Data-driven decisions', 'Competitive advantage'],
   ARRAY['Maintaining innovation pace', 'Ethical AI concerns', 'Regulatory compliance', 'Legacy system constraints'],
   ARRAY['Drive AI innovation', 'Develop proprietary AI', 'Lead industry standards', 'Build AI ecosystem']),

  ('leading', 5, 81, 100, 'AI Leader',
   'Your organization is an AI innovation leader, setting industry standards.',
   '#8B5CF6', 'crown',
   ARRAY['Industry thought leader', 'Proprietary AI capabilities', 'AI-native products', 'Innovation culture'],
   ARRAY['Staying ahead', 'Responsible AI at scale', 'Attracting top talent', 'Regulatory leadership'],
   ARRAY['Shape industry future', 'Contribute to AI advancement', 'Partner with research', 'Mentor others'])
ON CONFLICT (level) DO UPDATE SET
  description = EXCLUDED.description,
  characteristics = EXCLUDED.characteristics,
  typical_challenges = EXCLUDED.typical_challenges,
  next_level_focus = EXCLUDED.next_level_focus;

-- ============================================================================
-- 7. RECOMMENDATIONS & ROADMAP
-- ============================================================================

CREATE TABLE IF NOT EXISTS readiness_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_readiness_assessments(id) ON DELETE CASCADE,

  -- Recommendation details
  dimension VARCHAR(50) NOT NULL, -- Which dimension this addresses
  priority VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  timeframe VARCHAR(20) NOT NULL, -- 'quick_win', 'short_term', 'medium_term', 'long_term'

  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  expected_impact TEXT,

  -- Implementation details
  estimated_effort VARCHAR(50), -- 'low', 'medium', 'high'
  estimated_cost_range VARCHAR(50), -- '£0-5K', '£5-25K', '£25-100K', '£100K+'
  required_resources TEXT[],
  success_metrics TEXT[],

  -- Dependencies
  prerequisite_recommendations UUID[], -- Array of recommendation IDs

  -- Tracking
  is_ai_generated BOOLEAN DEFAULT true,
  user_notes TEXT,
  marked_complete BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_assessment ON readiness_recommendations(assessment_id);
CREATE INDEX idx_recommendations_priority ON readiness_recommendations(priority, timeframe);

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Calculate dimension score from responses
CREATE OR REPLACE FUNCTION calculate_dimension_score(
  responses JSONB,
  question_count INTEGER DEFAULT 10
)
RETURNS DECIMAL AS $$
DECLARE
  total_score DECIMAL := 0;
  question_value DECIMAL;
  key TEXT;
BEGIN
  -- Sum all numeric values in JSONB
  FOR key IN SELECT jsonb_object_keys(responses)
  LOOP
    question_value := (responses->>key)::DECIMAL;
    IF question_value IS NOT NULL THEN
      total_score := total_score + question_value;
    END IF;
  END LOOP;

  -- Convert to 0-100 scale (assuming 1-5 rating scale)
  RETURN ROUND((total_score / (question_count * 5.0)) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate overall readiness score with weighted dimensions
CREATE OR REPLACE FUNCTION calculate_overall_readiness(
  p_assessment_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  v_overall_score DECIMAL;
BEGIN
  SELECT
    ROUND(
      (strategic_alignment_score * strategic_weight / 100) +
      (data_maturity_score * data_weight / 100) +
      (tech_infrastructure_score * tech_weight / 100) +
      (human_capital_score * human_weight / 100) +
      (process_maturity_score * process_weight / 100) +
      (change_readiness_score * change_weight / 100),
      2
    )
  INTO v_overall_score
  FROM ai_readiness_assessments
  WHERE id = p_assessment_id;

  RETURN v_overall_score;
END;
$$ LANGUAGE plpgsql STABLE;

-- Determine maturity level from score
CREATE OR REPLACE FUNCTION get_maturity_level(p_score DECIMAL)
RETURNS maturity_level AS $$
BEGIN
  RETURN (
    SELECT level
    FROM readiness_maturity_config
    WHERE p_score >= min_score AND p_score <= max_score
    ORDER BY level_order DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate industry percentile
CREATE OR REPLACE FUNCTION calculate_percentile(
  p_score DECIMAL,
  p_industry VARCHAR,
  p_company_size VARCHAR,
  p_dimension VARCHAR DEFAULT 'overall'
)
RETURNS DECIMAL AS $$
DECLARE
  v_percentile DECIMAL;
  v_benchmark RECORD;
BEGIN
  SELECT * INTO v_benchmark
  FROM readiness_benchmarks
  WHERE industry = p_industry
    AND company_size = p_company_size
    AND dimension = p_dimension
  LIMIT 1;

  IF v_benchmark IS NULL THEN
    RETURN NULL;
  END IF;

  -- Simple percentile estimation
  IF p_score < v_benchmark.percentile_25 THEN
    v_percentile := (p_score / v_benchmark.percentile_25) * 25;
  ELSIF p_score < v_benchmark.percentile_50 THEN
    v_percentile := 25 + ((p_score - v_benchmark.percentile_25) / (v_benchmark.percentile_50 - v_benchmark.percentile_25)) * 25;
  ELSIF p_score < v_benchmark.percentile_75 THEN
    v_percentile := 50 + ((p_score - v_benchmark.percentile_50) / (v_benchmark.percentile_75 - v_benchmark.percentile_50)) * 25;
  ELSE
    v_percentile := 75 + ((p_score - v_benchmark.percentile_75) / (v_benchmark.percentile_90 - v_benchmark.percentile_75)) * 15;
  END IF;

  RETURN ROUND(LEAST(100, v_percentile), 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

ALTER TABLE ai_readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_strategic_alignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_data_maturity ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_tech_infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_human_capital ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_process_maturity ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_change_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_stakeholder_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_stakeholder_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_recommendations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own assessments" ON ai_readiness_assessments;
DROP POLICY IF EXISTS "Users can insert own assessments" ON ai_readiness_assessments;
DROP POLICY IF EXISTS "Users can update own assessments" ON ai_readiness_assessments;
DROP POLICY IF EXISTS "Service role can manage all" ON ai_readiness_assessments;

-- Users can view their own assessments
CREATE POLICY "Users can view own assessments"
  ON ai_readiness_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON ai_readiness_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments"
  ON ai_readiness_assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all (for edge functions)
CREATE POLICY "Service role can manage all"
  ON ai_readiness_assessments FOR ALL
  USING (true);

-- Dimension tables: users can access via assessment ownership
CREATE POLICY "Users can access own dimension data"
  ON readiness_strategic_alignment FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_readiness_assessments
      WHERE id = readiness_strategic_alignment.assessment_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access own dimension data"
  ON readiness_data_maturity FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_readiness_assessments
      WHERE id = readiness_data_maturity.assessment_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access own dimension data"
  ON readiness_tech_infrastructure FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_readiness_assessments
      WHERE id = readiness_tech_infrastructure.assessment_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access own dimension data"
  ON readiness_human_capital FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_readiness_assessments
      WHERE id = readiness_human_capital.assessment_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access own dimension data"
  ON readiness_process_maturity FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_readiness_assessments
      WHERE id = readiness_process_maturity.assessment_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access own dimension data"
  ON readiness_change_readiness FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_readiness_assessments
      WHERE id = readiness_change_readiness.assessment_id
      AND user_id = auth.uid()
    )
  );

-- Stakeholder policies
CREATE POLICY "Users can manage own stakeholder invites"
  ON readiness_stakeholder_invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_readiness_assessments
      WHERE id = readiness_stakeholder_invites.assessment_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view invite by token"
  ON readiness_stakeholder_invites FOR SELECT
  USING (true); -- Token-based access controlled in application layer

CREATE POLICY "Users can view own recommendations"
  ON readiness_recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_readiness_assessments
      WHERE id = readiness_recommendations.assessment_id
      AND user_id = auth.uid()
    )
  );

-- Public read access to config tables
ALTER TABLE readiness_maturity_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view maturity config"
  ON readiness_maturity_config FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view benchmarks"
  ON readiness_benchmarks FOR SELECT
  USING (true);

-- ============================================================================
-- 10. TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_readiness_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON ai_readiness_assessments
  FOR EACH ROW EXECUTE FUNCTION update_readiness_updated_at();

CREATE TRIGGER update_recommendations_updated_at
  BEFORE UPDATE ON readiness_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_readiness_updated_at();

-- ============================================================================
-- 11. COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_readiness_assessments IS 'Core AI readiness assessment table for SMEs';
COMMENT ON TABLE readiness_strategic_alignment IS 'Strategic alignment dimension responses';
COMMENT ON TABLE readiness_data_maturity IS 'Data maturity dimension responses';
COMMENT ON TABLE readiness_tech_infrastructure IS 'Technical infrastructure dimension responses';
COMMENT ON TABLE readiness_human_capital IS 'Human capital dimension responses';
COMMENT ON TABLE readiness_process_maturity IS 'Process maturity dimension responses';
COMMENT ON TABLE readiness_change_readiness IS 'Change readiness dimension responses';
COMMENT ON TABLE readiness_stakeholder_invites IS 'Multi-stakeholder assessment invitations';
COMMENT ON TABLE readiness_stakeholder_responses IS 'Stakeholder-specific assessment responses';
COMMENT ON TABLE readiness_benchmarks IS 'Industry and size-based benchmark data';
COMMENT ON TABLE readiness_maturity_config IS 'AI readiness maturity level definitions';
COMMENT ON TABLE readiness_recommendations IS 'AI-generated recommendations and roadmap items';
