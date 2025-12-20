-- ============================================================================
-- AI Innovation Foundation Migration
-- Phase 1: OpenRouter Integration + Core Tables
-- ============================================================================

-- ============================================================================
-- 1. LLM RESPONSE CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS llm_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  prompt_hash TEXT NOT NULL,
  response TEXT NOT NULL,
  model VARCHAR(100) NOT NULL,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_llm_cache_key ON llm_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_llm_cache_expires ON llm_response_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_llm_cache_model ON llm_response_cache(model);

-- Enable RLS
ALTER TABLE llm_response_cache ENABLE ROW LEVEL SECURITY;

-- Cache is accessible by authenticated users (read-only for stats)
CREATE POLICY "Authenticated users can view cache stats"
  ON llm_response_cache FOR SELECT
  TO authenticated
  USING (true);

-- Service can manage cache
CREATE POLICY "Service can manage cache"
  ON llm_response_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. NEXT LESSON RECOMMENDATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS next_lesson_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recommended_content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'lesson', 'lingo_lesson', 'course_module', 'assessment'
  recommendation_score DECIMAL(5,4) NOT NULL,
  factors JSONB NOT NULL DEFAULT '{}',
  -- Factors: { skill_gaps, recent_performance, learning_velocity, streak_bonus, time_since }
  context VARCHAR(50) NOT NULL, -- 'dashboard', 'lesson_complete', 'session_start'
  shown_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_next_lesson_user ON next_lesson_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_next_lesson_active ON next_lesson_recommendations(user_id, expires_at)
  WHERE dismissed_at IS NULL AND completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_next_lesson_context ON next_lesson_recommendations(context);

-- Enable RLS
ALTER TABLE next_lesson_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can view their own recommendations
CREATE POLICY "Users can view own recommendations"
  ON next_lesson_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System can manage recommendations
CREATE POLICY "System can manage recommendations"
  ON next_lesson_recommendations FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. WRONG ANSWER EXPLANATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS wrong_answer_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  user_answer JSONB NOT NULL,
  correct_answer JSONB NOT NULL,
  explanation_text TEXT NOT NULL,
  explanation_style VARCHAR(30) NOT NULL, -- 'visual', 'analytical', 'conceptual', 'example-based'
  model_used VARCHAR(100) NOT NULL,
  tokens_used INTEGER,
  cache_key TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_explanations_user ON wrong_answer_explanations(user_id);
CREATE INDEX IF NOT EXISTS idx_explanations_question ON wrong_answer_explanations(question_id);
CREATE INDEX IF NOT EXISTS idx_explanations_cache ON wrong_answer_explanations(cache_key);

-- Enable RLS
ALTER TABLE wrong_answer_explanations ENABLE ROW LEVEL SECURITY;

-- Users can view and rate their own explanations
CREATE POLICY "Users can view own explanations"
  ON wrong_answer_explanations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own explanation ratings"
  ON wrong_answer_explanations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can insert explanations
CREATE POLICY "System can insert explanations"
  ON wrong_answer_explanations FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 4. EXPLANATION CACHE (for common patterns)
-- ============================================================================

CREATE TABLE IF NOT EXISTS explanation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  wrong_answer_pattern TEXT NOT NULL, -- normalized wrong answer
  explanation_text TEXT NOT NULL,
  learning_style VARCHAR(30),
  hit_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, wrong_answer_pattern, learning_style)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_explanation_cache_lookup ON explanation_cache(question_id, wrong_answer_pattern);

-- Enable RLS
ALTER TABLE explanation_cache ENABLE ROW LEVEL SECURITY;

-- Everyone can read cache
CREATE POLICY "Cache is readable"
  ON explanation_cache FOR SELECT
  USING (true);

-- System can manage cache
CREATE POLICY "System can manage cache"
  ON explanation_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. STUDENT RISK SCORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  risk_score DECIMAL(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  risk_factors JSONB NOT NULL DEFAULT '{}',
  -- Factors structure:
  -- {
  --   declining_scores: { weight, value, trend },
  --   missed_sessions: { weight, value, days },
  --   low_engagement: { weight, value, avg_time },
  --   streak_breaks: { weight, value, previous_streak },
  --   time_away: { weight, value, days_inactive },
  --   assessment_failures: { weight, value, count }
  -- }
  predicted_outcome VARCHAR(50),
  recommended_interventions JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_scores_user ON student_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_level ON student_risk_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_scores_valid ON student_risk_scores(valid_until);
CREATE INDEX IF NOT EXISTS idx_risk_scores_user_valid ON student_risk_scores(user_id, valid_until DESC);

-- Enable RLS
ALTER TABLE student_risk_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own risk scores
CREATE POLICY "Users can view own risk scores"
  ON student_risk_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System can manage risk scores
CREATE POLICY "System can manage risk scores"
  ON student_risk_scores FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 6. INTERVENTION EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS intervention_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL,
  intervention_type VARCHAR(50) NOT NULL, -- 'nudge', 'instructor_alert', 'email', 'in_app'
  trigger_risk_score DECIMAL(5,2),
  trigger_factors JSONB,
  message_template VARCHAR(100),
  message_content TEXT,
  recipient_type VARCHAR(20) NOT NULL, -- 'student', 'instructor', 'admin'
  recipient_id UUID,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  acted_upon_at TIMESTAMPTZ,
  outcome VARCHAR(50), -- 'ignored', 'acknowledged', 'action_taken', 'engagement_improved'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interventions_student ON intervention_events(student_user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_type ON intervention_events(intervention_type);
CREATE INDEX IF NOT EXISTS idx_interventions_created ON intervention_events(created_at DESC);

-- Enable RLS
ALTER TABLE intervention_events ENABLE ROW LEVEL SECURITY;

-- Users can view interventions about themselves
CREATE POLICY "Users can view own interventions"
  ON intervention_events FOR SELECT
  TO authenticated
  USING (auth.uid() = student_user_id OR auth.uid() = recipient_id);

-- System can manage interventions
CREATE POLICY "System can manage interventions"
  ON intervention_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 7. INTERVENTION TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS intervention_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  intervention_type VARCHAR(50) NOT NULL,
  risk_level_trigger VARCHAR(20) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL,
  subject_template TEXT,
  message_template TEXT NOT NULL,
  -- Template variables: {{user_name}}, {{risk_level}}, {{top_factor}}, {{suggestion}}, {{course_name}}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE intervention_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view active templates
CREATE POLICY "Templates are viewable"
  ON intervention_templates FOR SELECT
  USING (is_active = TRUE);

-- ============================================================================
-- 8. AI GENERATED CONTENT (for instructors)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'summary', 'quiz', 'objectives', 'gap_analysis'
  source_content_id UUID,
  source_content_type VARCHAR(50),
  generated_content JSONB NOT NULL,
  model_used VARCHAR(100) NOT NULL,
  tokens_used INTEGER,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_content_instructor ON ai_generated_content(instructor_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_type ON ai_generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_status ON ai_generated_content(status);

-- Enable RLS
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own content
CREATE POLICY "Instructors can manage own content"
  ON ai_generated_content FOR ALL
  TO authenticated
  USING (auth.uid() = instructor_id)
  WITH CHECK (auth.uid() = instructor_id);

-- ============================================================================
-- 9. CONTENT GAP ANALYSIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  gaps_identified JSONB NOT NULL,
  -- Format: [{topic, coverage: 'none'|'partial'|'full', priority, suggestions}]
  recommendations JSONB NOT NULL,
  instructor_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gap_analysis_course ON content_gap_analysis(course_id);

-- Enable RLS
ALTER TABLE content_gap_analysis ENABLE ROW LEVEL SECURITY;

-- Course owners can view gap analysis
CREATE POLICY "Gap analysis viewable by course owners"
  ON content_gap_analysis FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 10. SEED INTERVENTION TEMPLATES
-- ============================================================================

INSERT INTO intervention_templates (name, intervention_type, risk_level_trigger, recipient_type, subject_template, message_template) VALUES
  -- Student nudges
  ('Gentle Reminder', 'nudge', 'moderate', 'student', NULL,
   'Hey {{user_name}}! We noticed you haven''t studied in a few days. Your {{course_name}} progress is waiting for you. Even 5 minutes can make a difference!'),

  ('Streak Recovery', 'nudge', 'moderate', 'student', NULL,
   '{{user_name}}, your learning streak was broken! Don''t worry - start a new one today and get back on track with {{course_name}}.'),

  ('Struggling Alert', 'nudge', 'high', 'student', NULL,
   'We see you''re having a tough time with {{top_factor}}. Would you like to try some easier practice questions to build your confidence?'),

  -- Instructor alerts
  ('At-Risk Student Alert', 'instructor_alert', 'high', 'instructor',
   'Student Needs Attention: {{user_name}}',
   '{{user_name}} is showing signs of disengagement in {{course_name}}. Risk score: {{risk_level}}. Main factor: {{top_factor}}. Consider reaching out.'),

  ('Critical Intervention Needed', 'instructor_alert', 'critical', 'instructor',
   'URGENT: Student at Critical Risk',
   '{{user_name}} has a critical risk score and may be about to drop out of {{course_name}}. Immediate intervention recommended. Factors: {{risk_factors}}.'),

  -- Automated emails
  ('We Miss You', 'email', 'high', 'student',
   'We miss you at AIBorg Learn!',
   'Hi {{user_name}},\n\nWe noticed you haven''t visited in a while. Your learning journey in {{course_name}} is waiting for you!\n\nHere''s what you can do:\n{{suggestion}}\n\nEven 10 minutes a day can help you reach your goals.\n\nBest,\nThe AIBorg Team'),

  ('Weekly Progress Reminder', 'email', 'moderate', 'student',
   'Your Weekly Learning Update',
   'Hi {{user_name}},\n\nHere''s your progress update for {{course_name}}:\n\n{{progress_summary}}\n\nKeep going - you''re doing great!\n\nBest,\nThe AIBorg Team')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. HELPER FUNCTIONS
-- ============================================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_llm_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM llm_response_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current risk level
CREATE OR REPLACE FUNCTION get_user_risk_level(p_user_id UUID)
RETURNS TABLE(risk_score DECIMAL, risk_level VARCHAR, factors JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT rs.risk_score, rs.risk_level, rs.risk_factors
  FROM student_risk_scores rs
  WHERE rs.user_id = p_user_id
    AND rs.valid_until > NOW()
  ORDER BY rs.calculated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. GRANTS
-- ============================================================================

GRANT SELECT ON llm_response_cache TO authenticated;
GRANT SELECT ON next_lesson_recommendations TO authenticated;
GRANT SELECT, UPDATE ON wrong_answer_explanations TO authenticated;
GRANT SELECT ON explanation_cache TO authenticated;
GRANT SELECT ON student_risk_scores TO authenticated;
GRANT SELECT ON intervention_events TO authenticated;
GRANT SELECT ON intervention_templates TO authenticated;
GRANT ALL ON ai_generated_content TO authenticated;
GRANT SELECT ON content_gap_analysis TO authenticated;
