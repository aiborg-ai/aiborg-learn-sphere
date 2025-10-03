-- Advanced Analytics & Insights Migration
-- Adds comprehensive tracking, predictions, and AI-powered recommendations

-- =====================================================
-- 1. LEARNING VELOCITY TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS learning_velocity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES user_ai_assessments(id) ON DELETE CASCADE,

  -- Velocity metrics
  ability_change DECIMAL(4,2), -- Change in ability from previous assessment
  questions_per_hour DECIMAL(6,2), -- Question answering rate
  time_to_proficiency_days INTEGER, -- Estimated days to reach next level
  learning_rate DECIMAL(4,2), -- Rate of improvement (-3 to +3)

  -- Momentum indicators
  streak_days INTEGER DEFAULT 0, -- Consecutive days of activity
  practice_frequency VARCHAR(20), -- 'daily', 'weekly', 'occasional', 'rare'
  engagement_score DECIMAL(4,2), -- 0-100 engagement metric

  -- Performance trends
  recent_accuracy DECIMAL(4,2), -- Last 10 questions accuracy
  improvement_trend VARCHAR(20), -- 'accelerating', 'steady', 'plateauing', 'declining'
  peak_performance_time TIME, -- Time of day when user performs best

  measured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_velocity_user ON learning_velocity_metrics(user_id);
CREATE INDEX idx_learning_velocity_measured ON learning_velocity_metrics(measured_at);

COMMENT ON TABLE learning_velocity_metrics IS
'Tracks learning velocity and momentum for predictive analytics';

-- =====================================================
-- 2. SKILL GAP ANALYSIS
-- =====================================================

CREATE TABLE IF NOT EXISTS skill_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES assessment_categories(id) ON DELETE CASCADE,

  -- Current state
  current_proficiency DECIMAL(4,2), -- 0-100 proficiency score
  target_proficiency DECIMAL(4,2), -- Desired proficiency level
  gap_size DECIMAL(4,2), -- Difference between current and target

  -- Predictions
  predicted_proficiency_30d DECIMAL(4,2), -- Predicted score in 30 days
  predicted_proficiency_90d DECIMAL(4,2), -- Predicted score in 90 days
  estimated_hours_to_close INTEGER, -- Hours needed to close gap

  -- Priority scoring
  priority_score DECIMAL(4,2), -- 0-100, higher = more critical
  business_impact VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
  market_demand VARCHAR(20), -- 'very_high', 'high', 'medium', 'low'

  -- Recommendations
  recommended_resources JSONB, -- Array of course/content IDs
  practice_frequency VARCHAR(50), -- '3x per week', 'daily', etc.

  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skill_gap_user ON skill_gap_analysis(user_id);
CREATE INDEX idx_skill_gap_category ON skill_gap_analysis(category_id);
CREATE INDEX idx_skill_gap_priority ON skill_gap_analysis(priority_score DESC);

COMMENT ON TABLE skill_gap_analysis IS
'Identifies and prioritizes skill gaps with predictive recommendations';

-- =====================================================
-- 3. COMPETENCY TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS competency_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Snapshot data
  competency_matrix JSONB, -- Heat map data: {category_id: score}
  overall_competency DECIMAL(4,2), -- Overall score 0-100

  -- Percentile rankings
  overall_percentile INTEGER, -- 0-100 percentile among all users
  category_percentiles JSONB, -- {category_id: percentile}

  -- Strengths and weaknesses
  top_strengths TEXT[], -- Array of category names
  top_weaknesses TEXT[], -- Array of category names

  -- Progress indicators
  categories_mastered INTEGER DEFAULT 0,
  categories_in_progress INTEGER DEFAULT 0,
  categories_not_started INTEGER DEFAULT 0,

  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_competency_user ON competency_snapshots(user_id);
CREATE INDEX idx_competency_date ON competency_snapshots(snapshot_date);

COMMENT ON TABLE competency_snapshots IS
'Daily/periodic snapshots of user competency for time-series analysis';

-- =====================================================
-- 4. AI RECOMMENDATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recommendation details
  recommendation_type VARCHAR(50), -- 'course', 'practice', 'resource', 'strategy'
  category_id UUID REFERENCES assessment_categories(id),

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  reasoning TEXT, -- Why this recommendation
  expected_impact TEXT, -- Expected outcome

  -- Targeting
  confidence_score DECIMAL(4,2), -- 0-100, AI confidence in recommendation
  relevance_score DECIMAL(4,2), -- 0-100, how relevant to user
  urgency VARCHAR(20), -- 'immediate', 'short_term', 'long_term'

  -- Action items
  resource_url TEXT,
  estimated_time_minutes INTEGER,
  difficulty_level VARCHAR(20),

  -- Engagement tracking
  viewed_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  feedback_rating INTEGER, -- 1-5 stars

  -- Metadata
  algorithm_version VARCHAR(20) DEFAULT '1.0',
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_active ON ai_recommendations(user_id, expires_at)
  WHERE dismissed_at IS NULL AND completed_at IS NULL;
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type);

COMMENT ON TABLE ai_recommendations IS
'AI-generated personalized recommendations with engagement tracking';

-- =====================================================
-- 5. PERFORMANCE BENCHMARKS
-- =====================================================

CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Benchmark metadata
  benchmark_type VARCHAR(50), -- 'category', 'overall', 'difficulty_level'
  dimension VARCHAR(100), -- Specific category/level name
  audience_type VARCHAR(50), -- 'primary', 'secondary', 'professional', 'business'

  -- Statistical measures
  sample_size INTEGER,
  mean_score DECIMAL(6,2),
  median_score DECIMAL(6,2),
  std_deviation DECIMAL(6,2),

  -- Percentile thresholds
  percentile_25 DECIMAL(6,2),
  percentile_50 DECIMAL(6,2),
  percentile_75 DECIMAL(6,2),
  percentile_90 DECIMAL(6,2),
  percentile_95 DECIMAL(6,2),

  -- Time period
  period_start DATE,
  period_end DATE,

  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(benchmark_type, dimension, audience_type, period_start)
);

CREATE INDEX idx_benchmarks_type ON performance_benchmarks(benchmark_type, dimension);
CREATE INDEX idx_benchmarks_period ON performance_benchmarks(period_start, period_end);

COMMENT ON TABLE performance_benchmarks IS
'Aggregated performance benchmarks for peer comparison';

-- =====================================================
-- 6. ANALYTICS FUNCTIONS
-- =====================================================

-- Calculate Learning Velocity
CREATE OR REPLACE FUNCTION calculate_learning_velocity(p_user_id UUID)
RETURNS TABLE (
  ability_change DECIMAL(4,2),
  learning_rate DECIMAL(4,2),
  improvement_trend TEXT,
  time_to_next_level INTEGER
) AS $$
DECLARE
  v_current_ability DECIMAL(4,2);
  v_previous_ability DECIMAL(4,2);
  v_assessments_count INTEGER;
  v_days_elapsed INTEGER;
BEGIN
  -- Get current and previous ability
  SELECT
    current_ability_estimate,
    LAG(current_ability_estimate) OVER (ORDER BY completed_at),
    COUNT(*) OVER (),
    EXTRACT(DAY FROM (MAX(completed_at) OVER () - MIN(completed_at) OVER ()))
  INTO v_current_ability, v_previous_ability, v_assessments_count, v_days_elapsed
  FROM user_ai_assessments
  WHERE user_id = p_user_id AND is_complete = true
  ORDER BY completed_at DESC
  LIMIT 1;

  -- Calculate metrics
  RETURN QUERY SELECT
    COALESCE(v_current_ability - v_previous_ability, 0.0)::DECIMAL(4,2),
    CASE
      WHEN v_days_elapsed > 0 AND v_previous_ability IS NOT NULL
      THEN ((v_current_ability - v_previous_ability) / v_days_elapsed * 30)::DECIMAL(4,2)
      ELSE 0.0::DECIMAL(4,2)
    END,
    CASE
      WHEN v_current_ability > v_previous_ability + 0.3 THEN 'accelerating'
      WHEN v_current_ability > v_previous_ability THEN 'steady'
      WHEN v_current_ability < v_previous_ability - 0.3 THEN 'declining'
      ELSE 'plateauing'
    END,
    CASE
      WHEN v_current_ability >= 1.5 THEN 0 -- Already expert
      WHEN v_current_ability - v_previous_ability > 0
      THEN CEIL((1.5 - v_current_ability) / ((v_current_ability - v_previous_ability) / v_days_elapsed))::INTEGER
      ELSE 999
    END;
END;
$$ LANGUAGE plpgsql;

-- Generate Skill Gap Analysis
CREATE OR REPLACE FUNCTION analyze_skill_gaps(p_user_id UUID)
RETURNS TABLE (
  category_name TEXT,
  current_proficiency DECIMAL(4,2),
  gap_size DECIMAL(4,2),
  priority_score DECIMAL(4,2),
  recommended_action TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_scores AS (
    SELECT
      c.id AS category_id,
      c.name,
      AVG(
        CASE
          WHEN aap.is_correct THEN 100.0
          ELSE 0.0
        END
      )::DECIMAL(4,2) AS proficiency
    FROM assessment_categories c
    LEFT JOIN assessment_questions q ON q.category_id = c.id
    LEFT JOIN assessment_answer_performance aap ON aap.question_id = q.id
    WHERE aap.assessment_id IN (
      SELECT id FROM user_ai_assessments
      WHERE user_id = p_user_id AND is_complete = true
    )
    GROUP BY c.id, c.name
  )
  SELECT
    us.name,
    COALESCE(us.proficiency, 0.0)::DECIMAL(4,2),
    (100.0 - COALESCE(us.proficiency, 0.0))::DECIMAL(4,2),
    -- Priority score: larger gaps + important categories get higher priority
    (
      (100.0 - COALESCE(us.proficiency, 0.0)) * 0.7 +
      30.0 -- Base importance
    )::DECIMAL(4,2),
    CASE
      WHEN COALESCE(us.proficiency, 0) < 40 THEN 'Start with fundamentals - take beginner courses'
      WHEN COALESCE(us.proficiency, 0) < 70 THEN 'Practice regularly - complete intermediate exercises'
      ELSE 'Advanced mastery - work on real-world projects'
    END
  FROM user_scores us
  ORDER BY (100.0 - COALESCE(us.proficiency, 0.0)) DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Calculate Competency Matrix
CREATE OR REPLACE FUNCTION get_competency_matrix(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_matrix JSONB;
BEGIN
  SELECT jsonb_object_agg(
    category_name,
    jsonb_build_object(
      'score', proficiency,
      'percentile', percentile,
      'level', CASE
        WHEN proficiency >= 90 THEN 'expert'
        WHEN proficiency >= 70 THEN 'advanced'
        WHEN proficiency >= 40 THEN 'intermediate'
        ELSE 'beginner'
      END
    )
  )
  INTO v_matrix
  FROM (
    SELECT
      c.name AS category_name,
      AVG(
        CASE WHEN aap.is_correct THEN 100.0 ELSE 0.0 END
      )::DECIMAL(4,2) AS proficiency,
      PERCENT_RANK() OVER (PARTITION BY c.id ORDER BY AVG(
        CASE WHEN aap.is_correct THEN 1.0 ELSE 0.0 END
      )) * 100 AS percentile
    FROM assessment_categories c
    LEFT JOIN assessment_questions q ON q.category_id = c.id
    LEFT JOIN assessment_answer_performance aap ON aap.question_id = q.id
    WHERE aap.assessment_id IN (
      SELECT id FROM user_ai_assessments
      WHERE user_id = p_user_id AND is_complete = true
    )
    GROUP BY c.id, c.name
  ) matrix;

  RETURN COALESCE(v_matrix, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Generate AI Recommendations
CREATE OR REPLACE FUNCTION generate_ai_recommendations(p_user_id UUID)
RETURNS SETOF ai_recommendations AS $$
DECLARE
  v_weak_categories RECORD;
  v_recommendation ai_recommendations;
BEGIN
  -- Find weakest categories
  FOR v_weak_categories IN
    SELECT * FROM analyze_skill_gaps(p_user_id)
    WHERE gap_size > 30
    LIMIT 3
  LOOP
    -- Generate recommendation
    v_recommendation.id := gen_random_uuid();
    v_recommendation.user_id := p_user_id;
    v_recommendation.recommendation_type := 'practice';
    v_recommendation.title := 'Improve ' || v_weak_categories.category_name;
    v_recommendation.description := v_weak_categories.recommended_action;
    v_recommendation.reasoning := 'Your proficiency in ' || v_weak_categories.category_name ||
                                   ' is ' || v_weak_categories.current_proficiency::TEXT ||
                                   '%. Closing this gap will significantly boost your overall score.';
    v_recommendation.expected_impact := 'Could improve overall score by 10-15%';
    v_recommendation.confidence_score := GREATEST(v_weak_categories.priority_score, 50.0);
    v_recommendation.relevance_score := v_weak_categories.priority_score;
    v_recommendation.urgency := CASE
      WHEN v_weak_categories.gap_size > 60 THEN 'immediate'
      WHEN v_weak_categories.gap_size > 40 THEN 'short_term'
      ELSE 'long_term'
    END;
    v_recommendation.estimated_time_minutes := 30;
    v_recommendation.difficulty_level := 'intermediate';

    RETURN NEXT v_recommendation;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. AUTOMATIC SNAPSHOT CREATION
-- =====================================================

CREATE OR REPLACE FUNCTION create_competency_snapshot(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_matrix JSONB;
  v_overall_score DECIMAL(4,2);
BEGIN
  -- Get competency matrix
  v_matrix := get_competency_matrix(p_user_id);

  -- Calculate overall score
  SELECT AVG((value->>'score')::DECIMAL)
  INTO v_overall_score
  FROM jsonb_each(v_matrix);

  -- Insert snapshot
  INSERT INTO competency_snapshots (
    user_id,
    competency_matrix,
    overall_competency,
    snapshot_date
  ) VALUES (
    p_user_id,
    v_matrix,
    COALESCE(v_overall_score, 0.0),
    CURRENT_DATE
  )
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET
    competency_matrix = EXCLUDED.competency_matrix,
    overall_competency = EXCLUDED.overall_competency
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. ENABLE RLS
-- =====================================================

ALTER TABLE learning_velocity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own velocity metrics"
  ON learning_velocity_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own skill gaps"
  ON skill_gap_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own competency snapshots"
  ON competency_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recommendations"
  ON ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON ai_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON DATABASE postgres IS 'Advanced analytics and insights system for personalized learning';
