-- Spaced Repetition Enhancements Migration
-- Adds tables for retention prediction, forgetting curves, and feedback loop integration
--
-- This migration extends the existing spaced repetition system with:
-- - Retention observations for personalized forgetting curve modeling
-- - Forgetting curve caching for performance
-- - Flashcard sources for tracking auto-generated cards
-- - Feedback loop events for assessment → study plan integration
-- - Additional columns on flashcards for standalone card support

-- ============================================================================
-- EXTEND FLASHCARDS TABLE
-- Add columns for standalone flashcard support (non-deck cards)
-- ============================================================================

-- Add user_id for standalone flashcards (not in a deck)
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add front/back aliases (views can use these for simpler queries)
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS front TEXT;

ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS back TEXT;

-- Add SM-2 state directly on flashcard for standalone cards
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS easiness_factor DECIMAL(4,2) DEFAULT 2.50;

ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS interval INTEGER DEFAULT 0;

ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS repetitions INTEGER DEFAULT 0;

ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS last_review_date TIMESTAMPTZ;

-- Create index for user's standalone flashcards
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(user_id, next_review_date);

-- RLS policy for standalone flashcards (user-owned cards not in decks)
DROP POLICY IF EXISTS "Users can manage their standalone flashcards" ON flashcards;
CREATE POLICY "Users can manage their standalone flashcards" ON flashcards
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- RETENTION OBSERVATIONS TABLE
-- Records each review outcome for forgetting curve calibration
-- ============================================================================

CREATE TABLE IF NOT EXISTS retention_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id TEXT,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,

  -- Observation data
  days_since_last_review INTEGER NOT NULL CHECK (days_since_last_review >= 0),
  was_recalled BOOLEAN NOT NULL,
  quality_score SMALLINT CHECK (quality_score >= 0 AND quality_score <= 5),
  predicted_retention DECIMAL(4,3) CHECK (predicted_retention >= 0 AND predicted_retention <= 1),

  -- Timestamps
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_retention_obs_user ON retention_observations(user_id);
CREATE INDEX IF NOT EXISTS idx_retention_obs_user_topic ON retention_observations(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_retention_obs_flashcard ON retention_observations(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_retention_obs_observed ON retention_observations(observed_at DESC);

-- Enable RLS
ALTER TABLE retention_observations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own retention_observations" ON retention_observations
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE retention_observations IS 'Individual retention observations used to calibrate personalized forgetting curves';

-- ============================================================================
-- FORGETTING CURVES TABLE
-- Cached personalized forgetting curve parameters per user/topic
-- ============================================================================

CREATE TABLE IF NOT EXISTS forgetting_curves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id TEXT,

  -- Forgetting curve parameters (R = e^(-k*t))
  decay_constant DECIMAL(5,4) NOT NULL CHECK (decay_constant > 0 AND decay_constant <= 1),
  initial_retention DECIMAL(4,3) DEFAULT 1.0 CHECK (initial_retention >= 0 AND initial_retention <= 1),
  half_life DECIMAL(6,2), -- Days until 50% retention

  -- Model quality metrics
  confidence DECIMAL(4,3) CHECK (confidence >= 0 AND confidence <= 1),
  data_points INTEGER DEFAULT 0 CHECK (data_points >= 0),

  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per user/topic combination
  UNIQUE(user_id, COALESCE(topic_id, ''))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forgetting_curves_user ON forgetting_curves(user_id);
CREATE INDEX IF NOT EXISTS idx_forgetting_curves_user_topic ON forgetting_curves(user_id, topic_id);

-- Enable RLS
ALTER TABLE forgetting_curves ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own forgetting_curves" ON forgetting_curves
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE forgetting_curves IS 'Personalized forgetting curve parameters derived from retention observations';

-- ============================================================================
-- FLASHCARD SOURCES TABLE
-- Tracks origin of auto-generated flashcards
-- ============================================================================

CREATE TABLE IF NOT EXISTS flashcard_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,

  -- Source information
  source_type TEXT NOT NULL CHECK (source_type IN ('assessment', 'quiz', 'course', 'manual')),
  question_id UUID,

  -- Initial calibration data
  initial_ef DECIMAL(4,2) CHECK (initial_ef >= 1.3 AND initial_ef <= 3.0),
  irt_difficulty DECIMAL(4,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One source record per flashcard
  UNIQUE(flashcard_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flashcard_sources_flashcard ON flashcard_sources(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sources_question ON flashcard_sources(question_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sources_type ON flashcard_sources(source_type);

-- Enable RLS
ALTER TABLE flashcard_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view sources for their cards" ON flashcard_sources
  FOR SELECT USING (
    flashcard_id IN (
      SELECT id FROM flashcards
      WHERE user_id = auth.uid()
      OR deck_id IN (SELECT id FROM flashcard_decks WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can insert sources for their cards" ON flashcard_sources
  FOR INSERT WITH CHECK (
    flashcard_id IN (
      SELECT id FROM flashcards
      WHERE user_id = auth.uid()
      OR deck_id IN (SELECT id FROM flashcard_decks WHERE created_by = auth.uid())
    )
  );

COMMENT ON TABLE flashcard_sources IS 'Tracks the origin of auto-generated flashcards from assessments/quizzes';

-- ============================================================================
-- FEEDBACK LOOP EVENTS TABLE
-- Records significant feedback events for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_loop_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID,

  -- Event information
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'answer_submitted',
      'assessment_completed',
      'ability_changed',
      'accuracy_drop',
      'mastery_achieved',
      'struggle_detected',
      'streak_broken',
      'plan_adjusted'
    )
  ),

  -- Ability tracking
  ability_before DECIMAL(4,2),
  ability_after DECIMAL(4,2),

  -- Trigger information
  triggers_fired INTEGER DEFAULT 0 CHECK (triggers_fired >= 0),
  trigger_data JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_events_user ON feedback_loop_events(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_events_assessment ON feedback_loop_events(assessment_id);
CREATE INDEX IF NOT EXISTS idx_feedback_events_type ON feedback_loop_events(event_type);
CREATE INDEX IF NOT EXISTS idx_feedback_events_created ON feedback_loop_events(created_at DESC);

-- Enable RLS
ALTER TABLE feedback_loop_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own feedback_loop_events" ON feedback_loop_events
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE feedback_loop_events IS 'Records feedback loop events for assessment → study plan integration';

-- ============================================================================
-- STUDY SESSION ANALYTICS TABLE
-- Enhanced session tracking with time-of-day patterns
-- ============================================================================

CREATE TABLE IF NOT EXISTS study_session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session timing
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  hour_of_day SMALLINT CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week SMALLINT CHECK (day_of_week >= 0 AND day_of_week <= 6),

  -- Performance metrics
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  ability_start DECIMAL(4,2),
  ability_end DECIMAL(4,2),
  focus_score DECIMAL(3,2) CHECK (focus_score >= 0 AND focus_score <= 1),

  -- Session type
  session_type TEXT CHECK (session_type IN ('assessment', 'quiz', 'flashcard', 'course', 'mixed')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_analytics_user ON study_session_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_start ON study_session_analytics(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_session_analytics_hour ON study_session_analytics(user_id, hour_of_day);
CREATE INDEX IF NOT EXISTS idx_session_analytics_day ON study_session_analytics(user_id, day_of_week);

-- Enable RLS
ALTER TABLE study_session_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own study_session_analytics" ON study_session_analytics
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE study_session_analytics IS 'Detailed study session analytics for pattern detection and optimization';

-- ============================================================================
-- ABILITY SNAPSHOTS TABLE
-- Track ability estimate over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS ability_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT,

  -- Ability data
  ability_estimate DECIMAL(4,2) NOT NULL,
  standard_error DECIMAL(4,2) DEFAULT 0.5,
  confidence_lower DECIMAL(4,2),
  confidence_upper DECIMAL(4,2),

  -- Source
  source_assessment_id UUID,

  -- Timestamps
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ability_snapshots_user ON ability_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_ability_snapshots_user_category ON ability_snapshots(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_ability_snapshots_recorded ON ability_snapshots(recorded_at DESC);

-- Enable RLS
ALTER TABLE ability_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own ability_snapshots" ON ability_snapshots
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE ability_snapshots IS 'Historical ability estimate snapshots for trajectory analysis';

-- ============================================================================
-- HELPER FUNCTION: Calculate retention at given days
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_retention(
  decay_constant DECIMAL,
  days_since_review INTEGER
) RETURNS DECIMAL AS $$
BEGIN
  -- R = e^(-k * t)
  RETURN EXP(-decay_constant * days_since_review);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_retention IS 'Calculate memory retention using exponential decay formula';

-- ============================================================================
-- HELPER FUNCTION: Get due flashcards with retention priority
-- ============================================================================

CREATE OR REPLACE FUNCTION get_due_flashcards_with_retention(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  flashcard_id UUID,
  front TEXT,
  back TEXT,
  days_since_review INTEGER,
  estimated_retention DECIMAL,
  urgency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS flashcard_id,
    COALESCE(f.front, f.front_content) AS front,
    COALESCE(f.back, f.back_content) AS back,
    EXTRACT(DAY FROM NOW() - COALESCE(f.last_review_date, f.created_at))::INTEGER AS days_since_review,
    calculate_retention(
      COALESCE(
        (SELECT fc.decay_constant FROM forgetting_curves fc WHERE fc.user_id = p_user_id LIMIT 1),
        0.3
      ),
      EXTRACT(DAY FROM NOW() - COALESCE(f.last_review_date, f.created_at))::INTEGER
    ) AS estimated_retention,
    CASE
      WHEN calculate_retention(0.3, EXTRACT(DAY FROM NOW() - COALESCE(f.last_review_date, f.created_at))::INTEGER) < 0.5 THEN 'critical'
      WHEN calculate_retention(0.3, EXTRACT(DAY FROM NOW() - COALESCE(f.last_review_date, f.created_at))::INTEGER) < 0.7 THEN 'high'
      ELSE 'normal'
    END AS urgency
  FROM flashcards f
  WHERE (f.user_id = p_user_id OR f.deck_id IN (SELECT id FROM flashcard_decks WHERE created_by = p_user_id))
    AND COALESCE(f.next_review_date, NOW()) <= NOW()
  ORDER BY
    CASE
      WHEN calculate_retention(0.3, EXTRACT(DAY FROM NOW() - COALESCE(f.last_review_date, f.created_at))::INTEGER) < 0.5 THEN 0
      WHEN calculate_retention(0.3, EXTRACT(DAY FROM NOW() - COALESCE(f.last_review_date, f.created_at))::INTEGER) < 0.7 THEN 1
      ELSE 2
    END,
    COALESCE(f.next_review_date, f.created_at) ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_due_flashcards_with_retention IS 'Get due flashcards sorted by retention urgency';

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON COLUMN flashcards.user_id IS 'Owner of standalone flashcards (not in a deck)';
COMMENT ON COLUMN flashcards.front IS 'Front content alias for simpler queries';
COMMENT ON COLUMN flashcards.back IS 'Back content alias for simpler queries';
COMMENT ON COLUMN flashcards.easiness_factor IS 'SM-2 easiness factor for standalone cards';
COMMENT ON COLUMN flashcards.interval IS 'Current review interval in days';
COMMENT ON COLUMN flashcards.repetitions IS 'Consecutive correct review count';
COMMENT ON COLUMN flashcards.next_review_date IS 'When card is next due for review';
