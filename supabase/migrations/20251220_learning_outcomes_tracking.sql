-- ============================================================================
-- Learning Outcomes Tracking Migration
-- Pre/Post Assessment Comparison + A/B Testing Framework
-- ============================================================================

-- ============================================================================
-- 1. PRE/POST ASSESSMENT TRACKING
-- ============================================================================

-- Link assessments as pre/post pairs
CREATE TABLE IF NOT EXISTS assessment_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id INTEGER,
  skill_id VARCHAR(100),
  pre_assessment_id UUID NOT NULL,
  post_assessment_id UUID,
  pair_type VARCHAR(50) NOT NULL DEFAULT 'course', -- 'course', 'skill', 'module', 'custom'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(pre_assessment_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_pairs_user ON assessment_pairs(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_pairs_course ON assessment_pairs(course_id);

-- Statistical improvement metrics
CREATE TABLE IF NOT EXISTS learning_improvement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID REFERENCES assessment_pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Score changes
  pre_score DECIMAL(5,2) NOT NULL,
  post_score DECIMAL(5,2) NOT NULL,
  score_change DECIMAL(5,2) NOT NULL,
  percentage_improvement DECIMAL(5,2) NOT NULL,

  -- Statistical measures
  effect_size DECIMAL(6,4), -- Cohen's d
  normalized_gain DECIMAL(5,4), -- Hake's normalized gain
  is_significant BOOLEAN DEFAULT FALSE,
  confidence_level DECIMAL(4,2), -- 0.90, 0.95, 0.99
  p_value DECIMAL(8,6),

  -- Time metrics
  days_between DECIMAL(5,1),
  study_hours_between DECIMAL(6,1),

  -- Category breakdown (JSONB)
  category_improvements JSONB DEFAULT '{}',
  -- Format: { "category_id": { "pre": 80, "post": 95, "change": 15, "effect_size": 0.8 } }

  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_improvement_metrics_user ON learning_improvement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_improvement_metrics_pair ON learning_improvement_metrics(pair_id);

-- ============================================================================
-- 2. MASTERY PROGRESSION TRACKING
-- ============================================================================

-- Mastery levels per skill/category
CREATE TABLE IF NOT EXISTS mastery_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_id VARCHAR(100) NOT NULL,
  skill_name VARCHAR(255),

  -- Current state
  current_level VARCHAR(20) NOT NULL DEFAULT 'novice',
  -- Levels: 'novice', 'beginner', 'intermediate', 'proficient', 'advanced', 'expert', 'master'
  current_score DECIMAL(5,2) DEFAULT 0,

  -- Progress within level
  level_progress DECIMAL(5,2) DEFAULT 0, -- 0-100 within current level

  -- History
  level_history JSONB DEFAULT '[]',
  -- Format: [{ "level": "novice", "achieved_at": "...", "score": 45 }, ...]

  -- Time tracking
  time_at_current_level_days INTEGER DEFAULT 0,
  total_practice_hours DECIMAL(8,2) DEFAULT 0,

  -- Velocity
  avg_improvement_per_week DECIMAL(5,2) DEFAULT 0,
  projected_next_level_days INTEGER,

  first_assessment_at TIMESTAMPTZ,
  last_assessment_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_mastery_user ON mastery_progression(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_skill ON mastery_progression(skill_id);
CREATE INDEX IF NOT EXISTS idx_mastery_level ON mastery_progression(current_level);

-- Mastery level thresholds configuration
CREATE TABLE IF NOT EXISTS mastery_level_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_name VARCHAR(20) NOT NULL UNIQUE,
  level_order INTEGER NOT NULL,
  min_score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL,
  badge_icon VARCHAR(50),
  badge_color VARCHAR(20),
  description TEXT,
  requirements JSONB DEFAULT '{}'
);

-- Insert default mastery levels
INSERT INTO mastery_level_config (level_name, level_order, min_score, max_score, badge_icon, badge_color, description) VALUES
  ('novice', 1, 0, 19.99, 'circle', '#9CA3AF', 'Just starting out'),
  ('beginner', 2, 20, 39.99, 'star', '#60A5FA', 'Learning the basics'),
  ('intermediate', 3, 40, 59.99, 'award', '#34D399', 'Building competence'),
  ('proficient', 4, 60, 74.99, 'trophy', '#FBBF24', 'Strong understanding'),
  ('advanced', 5, 75, 89.99, 'crown', '#F97316', 'Deep expertise'),
  ('expert', 6, 90, 94.99, 'gem', '#8B5CF6', 'Exceptional mastery'),
  ('master', 7, 95, 100, 'diamond', '#EC4899', 'Complete mastery')
ON CONFLICT (level_name) DO NOTHING;

-- ============================================================================
-- 3. A/B TESTING FRAMEWORK
-- ============================================================================

-- Experiments definition
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hypothesis TEXT,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- Status: 'draft', 'running', 'paused', 'completed', 'archived'

  -- Targeting
  target_audience JSONB DEFAULT '{}',
  -- Format: { "roles": ["student"], "courses": ["..."], "min_activity_days": 7 }

  -- Traffic allocation
  traffic_percentage DECIMAL(5,2) DEFAULT 100, -- % of eligible users

  -- Timing
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Success metrics
  primary_metric VARCHAR(100) NOT NULL,
  secondary_metrics JSONB DEFAULT '[]',
  minimum_sample_size INTEGER DEFAULT 100,
  minimum_effect_size DECIMAL(5,3) DEFAULT 0.05,

  -- Results
  winner_variant_id UUID,
  concluded_at TIMESTAMPTZ,
  conclusion_notes TEXT,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_dates ON experiments(start_date, end_date);

-- Experiment variants
CREATE TABLE IF NOT EXISTS experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_control BOOLEAN DEFAULT FALSE,

  -- Traffic weight (relative to other variants)
  weight DECIMAL(5,2) DEFAULT 50,

  -- Variant configuration
  config JSONB DEFAULT '{}',
  -- Format: { "feature_flag": "new_ui", "params": { "color": "blue" } }

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_experiment ON experiment_variants(experiment_id);

-- User variant assignments
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES experiment_variants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Assignment details
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assignment_reason VARCHAR(50) DEFAULT 'random', -- 'random', 'forced', 'override'

  -- Engagement tracking
  first_exposure_at TIMESTAMPTZ,
  last_exposure_at TIMESTAMPTZ,
  exposure_count INTEGER DEFAULT 0,

  UNIQUE(experiment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_experiment ON experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_variant ON experiment_assignments(variant_id);

-- Experiment events/conversions
CREATE TABLE IF NOT EXISTS experiment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES experiment_variants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Event details
  event_type VARCHAR(50) NOT NULL,
  -- Types: 'exposure', 'click', 'conversion', 'completion', 'custom'
  event_name VARCHAR(100),
  event_value DECIMAL(10,2),
  event_metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_experiment ON experiment_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_events_variant ON experiment_events(variant_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON experiment_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON experiment_events(event_type);

-- Pre-calculated experiment metrics
CREATE TABLE IF NOT EXISTS experiment_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES experiment_variants(id) ON DELETE CASCADE,

  -- Sample sizes
  total_users INTEGER DEFAULT 0,
  exposed_users INTEGER DEFAULT 0,
  converted_users INTEGER DEFAULT 0,

  -- Rates
  exposure_rate DECIMAL(5,4) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,

  -- Primary metric stats
  metric_mean DECIMAL(10,4),
  metric_std_dev DECIMAL(10,4),
  metric_median DECIMAL(10,4),

  -- Comparison to control
  lift_vs_control DECIMAL(6,4),
  confidence_interval_lower DECIMAL(6,4),
  confidence_interval_upper DECIMAL(6,4),
  p_value DECIMAL(8,6),
  is_significant BOOLEAN DEFAULT FALSE,

  -- Timing
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_experiment ON experiment_metrics(experiment_id);

-- ============================================================================
-- 4. INSTITUTIONAL REPORTING
-- ============================================================================

-- Institutional report requests
CREATE TABLE IF NOT EXISTS institutional_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  requested_by UUID NOT NULL,

  -- Report type
  report_type VARCHAR(50) NOT NULL,
  -- Types: 'learning_outcomes', 'improvement_summary', 'cohort_analysis', 'efficacy_report'

  -- Scope
  date_range_start TIMESTAMPTZ NOT NULL,
  date_range_end TIMESTAMPTZ NOT NULL,
  user_ids JSONB, -- null = all users in org
  course_ids JSONB, -- null = all courses

  -- Options
  include_individual_data BOOLEAN DEFAULT FALSE,
  include_comparisons BOOLEAN DEFAULT TRUE,
  include_recommendations BOOLEAN DEFAULT TRUE,

  -- Output
  format VARCHAR(10) NOT NULL DEFAULT 'pdf', -- 'pdf', 'csv', 'xlsx'
  file_url TEXT,
  file_size_bytes INTEGER,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- Status: 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inst_reports_org ON institutional_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_inst_reports_status ON institutional_reports(status);

-- ============================================================================
-- 5. LEARNING OUTCOMES SUMMARY (Aggregated View)
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_outcomes_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type VARCHAR(20) NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'yearly'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Assessment metrics
  assessments_completed INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),
  score_improvement DECIMAL(5,2),

  -- Time metrics
  total_study_hours DECIMAL(8,2) DEFAULT 0,
  active_days INTEGER DEFAULT 0,

  -- Mastery metrics
  skills_improved INTEGER DEFAULT 0,
  skills_mastered INTEGER DEFAULT 0,
  new_levels_achieved INTEGER DEFAULT 0,

  -- Engagement
  streak_days INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,

  -- Comparisons
  percentile_rank DECIMAL(5,2),
  vs_previous_period_change DECIMAL(5,2),

  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_outcomes_user ON learning_outcomes_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_period ON learning_outcomes_summary(period_type, period_start);

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

ALTER TABLE assessment_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_improvement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutional_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_outcomes_summary ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own assessment pairs" ON assessment_pairs;
DROP POLICY IF EXISTS "Users can view own improvement metrics" ON learning_improvement_metrics;
DROP POLICY IF EXISTS "Users can view own mastery progression" ON mastery_progression;
DROP POLICY IF EXISTS "Users can view own experiment assignments" ON experiment_assignments;
DROP POLICY IF EXISTS "Users can view own outcomes summary" ON learning_outcomes_summary;
DROP POLICY IF EXISTS "System can manage assessment pairs" ON assessment_pairs;
DROP POLICY IF EXISTS "System can manage improvement metrics" ON learning_improvement_metrics;
DROP POLICY IF EXISTS "System can manage mastery progression" ON mastery_progression;
DROP POLICY IF EXISTS "System can manage experiments" ON experiments;
DROP POLICY IF EXISTS "System can manage variants" ON experiment_variants;
DROP POLICY IF EXISTS "System can manage assignments" ON experiment_assignments;
DROP POLICY IF EXISTS "System can manage events" ON experiment_events;
DROP POLICY IF EXISTS "System can manage metrics" ON experiment_metrics;
DROP POLICY IF EXISTS "System can manage reports" ON institutional_reports;
DROP POLICY IF EXISTS "System can manage outcomes" ON learning_outcomes_summary;
DROP POLICY IF EXISTS "Anyone can view mastery levels" ON mastery_level_config;

-- Users can view their own data
CREATE POLICY "Users can view own assessment pairs"
  ON assessment_pairs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own improvement metrics"
  ON learning_improvement_metrics FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own mastery progression"
  ON mastery_progression FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own experiment assignments"
  ON experiment_assignments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own outcomes summary"
  ON learning_outcomes_summary FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- System can manage all
CREATE POLICY "System can manage assessment pairs"
  ON assessment_pairs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage improvement metrics"
  ON learning_improvement_metrics FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage mastery progression"
  ON mastery_progression FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage experiments"
  ON experiments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage variants"
  ON experiment_variants FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage assignments"
  ON experiment_assignments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage events"
  ON experiment_events FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage metrics"
  ON experiment_metrics FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage reports"
  ON institutional_reports FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage outcomes"
  ON learning_outcomes_summary FOR ALL USING (true) WITH CHECK (true);

-- Everyone can read mastery level config
CREATE POLICY "Anyone can view mastery levels"
  ON mastery_level_config FOR SELECT USING (true);

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Calculate Cohen's d effect size
CREATE OR REPLACE FUNCTION calculate_effect_size(
  pre_mean DECIMAL,
  post_mean DECIMAL,
  pooled_std DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  IF pooled_std = 0 OR pooled_std IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (post_mean - pre_mean) / pooled_std;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate Hake's normalized gain
CREATE OR REPLACE FUNCTION calculate_normalized_gain(
  pre_score DECIMAL,
  post_score DECIMAL,
  max_score DECIMAL DEFAULT 100
) RETURNS DECIMAL AS $$
DECLARE
  possible_gain DECIMAL;
BEGIN
  possible_gain := max_score - pre_score;
  IF possible_gain <= 0 THEN
    RETURN NULL;
  END IF;
  RETURN (post_score - pre_score) / possible_gain;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get mastery level for a score
CREATE OR REPLACE FUNCTION get_mastery_level(score DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
  RETURN (
    SELECT level_name
    FROM mastery_level_config
    WHERE score >= min_score AND score <= max_score
    ORDER BY level_order DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 8. GRANTS
-- ============================================================================

GRANT SELECT ON assessment_pairs TO authenticated;
GRANT SELECT ON learning_improvement_metrics TO authenticated;
GRANT SELECT ON mastery_progression TO authenticated;
GRANT SELECT ON mastery_level_config TO authenticated;
GRANT SELECT ON experiment_assignments TO authenticated;
GRANT SELECT ON learning_outcomes_summary TO authenticated;
