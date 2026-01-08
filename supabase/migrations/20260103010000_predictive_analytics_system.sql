-- Predictive Analytics System
-- Phase 6: ML-powered predictions for learner success
--
-- Features:
-- 1. Completion forecasting
-- 2. Skills gap predictions
-- 3. Engagement predictions
-- 4. At-risk learner alerts
-- 5. Automated intervention triggers

-- ============================================================================
-- 1. LEARNER PREDICTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS learner_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,

  -- Prediction Types
  prediction_type VARCHAR(50) NOT NULL, -- 'completion', 'engagement', 'at_risk', 'skills_gap'

  -- Completion Predictions
  predicted_completion_date DATE,
  completion_probability DECIMAL(5,2), -- 0-100%
  estimated_days_to_complete INTEGER,
  completion_confidence DECIMAL(5,2), -- Model confidence 0-100%

  -- Engagement Predictions
  engagement_score DECIMAL(5,2), -- Current engagement 0-100
  predicted_engagement_7d DECIMAL(5,2), -- Predicted engagement in 7 days
  predicted_engagement_30d DECIMAL(5,2), -- Predicted engagement in 30 days
  engagement_trend VARCHAR(20), -- 'increasing', 'stable', 'declining', 'critical'

  -- At-Risk Scoring
  risk_score DECIMAL(5,2), -- 0-100, higher = more at risk
  risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  risk_factors JSONB, -- Array of contributing factors
  dropout_probability DECIMAL(5,2), -- 0-100%

  -- Skills Gap Predictions
  skill_gaps JSONB, -- {category_id: {gap_size, priority}}
  predicted_proficiency_30d JSONB, -- {category_id: predicted_score}
  hours_needed_to_close_gaps INTEGER,

  -- Intervention Recommendations
  recommended_interventions JSONB, -- Array of intervention types
  intervention_priority INTEGER, -- 1-5, 5 = urgent
  auto_alert_triggered BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMPTZ,

  -- Model Metadata
  model_version VARCHAR(20),
  features_used JSONB, -- Features that went into the model
  prediction_accuracy DECIMAL(5,2), -- Historical accuracy of this prediction type

  -- Timestamps
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- When prediction expires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, course_id, prediction_type, predicted_at)
);

CREATE INDEX idx_learner_predictions_user ON learner_predictions(user_id);
CREATE INDEX idx_learner_predictions_course ON learner_predictions(course_id);
CREATE INDEX idx_learner_predictions_type ON learner_predictions(prediction_type);
CREATE INDEX idx_learner_predictions_risk ON learner_predictions(risk_level) WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_learner_predictions_alert ON learner_predictions(auto_alert_triggered, alert_sent_at);
CREATE INDEX idx_learner_predictions_valid ON learner_predictions(valid_until) WHERE valid_until IS NOT NULL;

COMMENT ON TABLE learner_predictions IS
'Stores ML-generated predictions for learner success, engagement, and risk';

-- ============================================================================
-- 2. AT-RISK LEARNER ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS at_risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  prediction_id UUID REFERENCES learner_predictions(id) ON DELETE SET NULL,

  -- Alert Details
  alert_type VARCHAR(50) NOT NULL, -- 'engagement_drop', 'inactivity', 'poor_performance', 'dropout_risk'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  risk_score DECIMAL(5,2), -- 0-100

  -- Alert Message
  title TEXT NOT NULL,
  description TEXT,
  contributing_factors JSONB, -- Array of factors that triggered the alert

  -- Recommended Actions
  recommended_actions JSONB, -- Array of suggested interventions
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Instructor/admin to follow up

  -- Status Tracking
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'action_taken', 'resolved', 'dismissed'
  resolution_notes TEXT,
  action_taken TEXT,
  outcome VARCHAR(50), -- 'learner_recovered', 'dropout', 'transferred', 'no_action_needed'

  -- Intervention Tracking
  intervention_started_at TIMESTAMPTZ,
  intervention_completed_at TIMESTAMPTZ,
  follow_up_required BOOLEAN DEFAULT TRUE,
  next_follow_up_date DATE,

  -- Notification Tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  instructor_notified BOOLEAN DEFAULT FALSE,
  instructor_notified_at TIMESTAMPTZ,

  -- Timestamps
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_at_risk_alerts_user ON at_risk_alerts(user_id);
CREATE INDEX idx_at_risk_alerts_course ON at_risk_alerts(course_id);
CREATE INDEX idx_at_risk_alerts_severity ON at_risk_alerts(severity) WHERE severity IN ('high', 'critical');
CREATE INDEX idx_at_risk_alerts_status ON at_risk_alerts(status) WHERE status IN ('open', 'investigating');
CREATE INDEX idx_at_risk_alerts_assigned ON at_risk_alerts(assigned_to) WHERE status NOT IN ('resolved', 'dismissed');
CREATE INDEX idx_at_risk_alerts_follow_up ON at_risk_alerts(next_follow_up_date) WHERE follow_up_required = TRUE;

COMMENT ON TABLE at_risk_alerts IS
'Tracks at-risk learners and intervention actions';

-- ============================================================================
-- 3. PREDICTION FEATURE STORE
-- ============================================================================
-- Stores engineered features used for ML predictions

CREATE TABLE IF NOT EXISTS prediction_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,

  -- Engagement Features
  days_since_last_activity INTEGER,
  total_time_spent_minutes INTEGER,
  avg_session_duration_minutes DECIMAL(8,2),
  sessions_count INTEGER,
  active_days_count INTEGER,
  active_days_last_7d INTEGER,
  active_days_last_30d INTEGER,

  -- Progress Features
  progress_percentage DECIMAL(5,2),
  progress_velocity DECIMAL(8,2), -- Progress per day
  time_on_current_module_minutes INTEGER,
  modules_completed INTEGER,
  modules_total INTEGER,

  -- Performance Features
  avg_assessment_score DECIMAL(5,2),
  assessment_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
  assignments_submitted INTEGER,
  assignments_on_time INTEGER,
  assignments_late INTEGER,
  assignments_overdue INTEGER,

  -- Behavioral Features
  login_streak_days INTEGER,
  longest_inactive_period_days INTEGER,
  weekend_activity_ratio DECIMAL(5,2), -- % of activity on weekends
  preferred_learning_time VARCHAR(20), -- 'morning', 'afternoon', 'evening', 'night'
  avg_questions_per_session DECIMAL(8,2),
  help_requests_count INTEGER,

  -- Social Features
  forum_posts_count INTEGER,
  peer_interactions_count INTEGER,
  study_group_participation BOOLEAN DEFAULT FALSE,

  -- Historical Features
  previous_courses_completed INTEGER,
  previous_courses_dropped INTEGER,
  avg_course_completion_rate DECIMAL(5,2),

  -- Derived Metrics
  engagement_momentum DECIMAL(5,2), -- Acceleration/deceleration of engagement
  performance_consistency DECIMAL(5,2), -- Stddev of scores
  learning_efficiency DECIMAL(5,2), -- Progress per hour spent

  -- Timestamps
  features_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  features_version VARCHAR(20) DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, course_id, features_calculated_at)
);

CREATE INDEX idx_prediction_features_user ON prediction_features(user_id);
CREATE INDEX idx_prediction_features_course ON prediction_features(course_id);
CREATE INDEX idx_prediction_features_calculated ON prediction_features(features_calculated_at DESC);

COMMENT ON TABLE prediction_features IS
'Engineered features for ML prediction models';

-- ============================================================================
-- 4. PREDICTION MODEL PERFORMANCE
-- ============================================================================
-- Tracks accuracy and performance of prediction models

CREATE TABLE IF NOT EXISTS prediction_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Model Info
  model_type VARCHAR(50) NOT NULL, -- 'completion', 'engagement', 'dropout', 'skills_gap'
  model_version VARCHAR(20) NOT NULL,
  algorithm VARCHAR(50), -- 'random_forest', 'gradient_boosting', 'neural_network', etc.

  -- Performance Metrics
  accuracy DECIMAL(5,2), -- Overall accuracy
  precision DECIMAL(5,2), -- Precision score
  recall DECIMAL(5,2), -- Recall score
  f1_score DECIMAL(5,2), -- F1 score
  auc_roc DECIMAL(5,2), -- AUC-ROC score

  -- Prediction Counts
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  false_negatives INTEGER DEFAULT 0,

  -- Feature Importance
  top_features JSONB, -- {feature_name: importance_score}

  -- Training Info
  training_samples_count INTEGER,
  training_completed_at TIMESTAMPTZ,
  last_retrained_at TIMESTAMPTZ,

  -- Evaluation Period
  evaluation_period_start TIMESTAMPTZ,
  evaluation_period_end TIMESTAMPTZ,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(model_type, model_version, evaluation_period_end)
);

CREATE INDEX idx_model_performance_type ON prediction_model_performance(model_type);
CREATE INDEX idx_model_performance_version ON prediction_model_performance(model_version);
CREATE INDEX idx_model_performance_accuracy ON prediction_model_performance(accuracy DESC);

COMMENT ON TABLE prediction_model_performance IS
'Tracks ML model performance and accuracy metrics';

-- ============================================================================
-- 5. INTERVENTION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS learner_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES at_risk_alerts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,

  -- Intervention Details
  intervention_type VARCHAR(50) NOT NULL, -- 'email_reminder', 'instructor_outreach', 'peer_mentor', 'content_recommendation', 'deadline_extension'
  intervention_category VARCHAR(30), -- 'proactive', 'reactive', 'automated', 'manual'

  -- Intervention Content
  title TEXT NOT NULL,
  message TEXT,
  resources_provided JSONB, -- Array of resource IDs/links

  -- Delivery
  delivered_via VARCHAR(30), -- 'email', 'in_app', 'sms', 'phone', 'meeting'
  delivered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  delivered_at TIMESTAMPTZ,

  -- Tracking
  opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMPTZ,
  responded BOOLEAN DEFAULT FALSE,
  responded_at TIMESTAMPTZ,
  response_text TEXT,

  -- Effectiveness
  effectiveness VARCHAR(20), -- 'very_effective', 'effective', 'minimal', 'ineffective', 'unknown'
  engagement_before DECIMAL(5,2),
  engagement_after DECIMAL(5,2),
  engagement_change DECIMAL(5,2),

  -- Follow-up
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interventions_alert ON learner_interventions(alert_id);
CREATE INDEX idx_interventions_user ON learner_interventions(user_id);
CREATE INDEX idx_interventions_type ON learner_interventions(intervention_type);
CREATE INDEX idx_interventions_scheduled ON learner_interventions(scheduled_for) WHERE completed_at IS NULL;
CREATE INDEX idx_interventions_follow_up ON learner_interventions(follow_up_date) WHERE follow_up_required = TRUE;

COMMENT ON TABLE learner_interventions IS
'Tracks interventions and their effectiveness for at-risk learners';

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate risk score based on multiple factors
CREATE OR REPLACE FUNCTION calculate_risk_score(
  p_engagement_score DECIMAL,
  p_progress_percentage DECIMAL,
  p_days_since_activity INTEGER,
  p_assignment_completion_rate DECIMAL,
  p_assessment_avg DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  risk_score DECIMAL := 0;
BEGIN
  -- Low engagement (weight: 30%)
  IF p_engagement_score < 30 THEN
    risk_score := risk_score + 30;
  ELSIF p_engagement_score < 50 THEN
    risk_score := risk_score + 20;
  ELSIF p_engagement_score < 70 THEN
    risk_score := risk_score + 10;
  END IF;

  -- Low progress (weight: 25%)
  IF p_progress_percentage < 20 THEN
    risk_score := risk_score + 25;
  ELSIF p_progress_percentage < 40 THEN
    risk_score := risk_score + 15;
  ELSIF p_progress_percentage < 60 THEN
    risk_score := risk_score + 8;
  END IF;

  -- Inactivity (weight: 25%)
  IF p_days_since_activity > 14 THEN
    risk_score := risk_score + 25;
  ELSIF p_days_since_activity > 7 THEN
    risk_score := risk_score + 15;
  ELSIF p_days_since_activity > 3 THEN
    risk_score := risk_score + 8;
  END IF;

  -- Assignment completion (weight: 10%)
  IF p_assignment_completion_rate < 40 THEN
    risk_score := risk_score + 10;
  ELSIF p_assignment_completion_rate < 70 THEN
    risk_score := risk_score + 5;
  END IF;

  -- Assessment performance (weight: 10%)
  IF p_assessment_avg < 50 THEN
    risk_score := risk_score + 10;
  ELSIF p_assessment_avg < 70 THEN
    risk_score := risk_score + 5;
  END IF;

  RETURN LEAST(risk_score, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine risk level from score
CREATE OR REPLACE FUNCTION get_risk_level(risk_score DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
  CASE
    WHEN risk_score >= 75 THEN RETURN 'critical';
    WHEN risk_score >= 50 THEN RETURN 'high';
    WHEN risk_score >= 25 THEN RETURN 'medium';
    ELSE RETURN 'low';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 7. VIEWS FOR ANALYTICS
-- ============================================================================

-- At-Risk Learners Summary
CREATE OR REPLACE VIEW at_risk_learners_summary AS
SELECT
  p.id as profile_id,
  p.user_id,
  p.display_name,
  p.email,
  ara.course_id,
  c.title as course_title,
  lp.risk_score,
  lp.risk_level,
  lp.dropout_probability,
  lp.engagement_score,
  lp.engagement_trend,
  ara.severity,
  ara.status,
  ara.triggered_at,
  ara.assigned_to,
  ara.next_follow_up_date,
  EXTRACT(EPOCH FROM (NOW() - ara.triggered_at)) / 86400 as days_since_alert,
  COUNT(li.id) as interventions_attempted,
  MAX(li.delivered_at) as last_intervention_date
FROM profiles p
INNER JOIN at_risk_alerts ara ON ara.user_id = p.user_id
LEFT JOIN courses c ON c.id = ara.course_id
LEFT JOIN learner_predictions lp ON lp.user_id = p.user_id AND lp.course_id = ara.course_id AND lp.prediction_type = 'at_risk'
LEFT JOIN learner_interventions li ON li.alert_id = ara.id
WHERE ara.status IN ('open', 'investigating')
GROUP BY p.id, p.user_id, p.display_name, p.email, ara.course_id, c.title, lp.risk_score, lp.risk_level,
         lp.dropout_probability, lp.engagement_score, lp.engagement_trend, ara.severity, ara.status,
         ara.triggered_at, ara.assigned_to, ara.next_follow_up_date
ORDER BY lp.risk_score DESC NULLS LAST, ara.triggered_at ASC;

COMMENT ON VIEW at_risk_learners_summary IS
'Summary view of all at-risk learners requiring intervention';

-- Prediction Accuracy Tracking
CREATE OR REPLACE VIEW prediction_accuracy_tracking AS
SELECT
  lp.prediction_type,
  lp.model_version,
  COUNT(*) as total_predictions,
  AVG(lp.completion_confidence) as avg_confidence,
  AVG(lp.risk_score) as avg_risk_score,
  COUNT(CASE WHEN ara.id IS NOT NULL THEN 1 END) as alerts_triggered,
  COUNT(CASE WHEN ara.status = 'resolved' AND ara.outcome = 'learner_recovered' THEN 1 END) as successful_interventions,
  COUNT(CASE WHEN ara.outcome = 'dropout' THEN 1 END) as actual_dropouts
FROM learner_predictions lp
LEFT JOIN at_risk_alerts ara ON ara.prediction_id = lp.id
WHERE lp.predicted_at >= NOW() - INTERVAL '90 days'
GROUP BY lp.prediction_type, lp.model_version;

COMMENT ON VIEW prediction_accuracy_tracking IS
'Tracks prediction accuracy and intervention effectiveness';

-- ============================================================================
-- 8. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE learner_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE at_risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_interventions ENABLE ROW LEVEL SECURITY;

-- Policies for learner_predictions
CREATE POLICY "Users can view their own predictions"
  ON learner_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and instructors can view all predictions"
  ON learner_predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "System can insert predictions"
  ON learner_predictions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR auth.uid() = user_id);

-- Policies for at_risk_alerts
CREATE POLICY "Users can view their own alerts"
  ON at_risk_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and instructors can view all alerts"
  ON at_risk_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Policies for prediction_features
CREATE POLICY "Users can view their own features"
  ON prediction_features FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all features"
  ON prediction_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for learner_interventions
CREATE POLICY "Users can view their own interventions"
  ON learner_interventions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors can manage interventions"
  ON learner_interventions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Policy for model performance (admin only)
CREATE POLICY "Admins can view model performance"
  ON prediction_model_performance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_learner_predictions_updated_at
  BEFORE UPDATE ON learner_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_at_risk_alerts_updated_at
  BEFORE UPDATE ON at_risk_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prediction_features_updated_at
  BEFORE UPDATE ON prediction_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learner_interventions_updated_at
  BEFORE UPDATE ON learner_interventions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
