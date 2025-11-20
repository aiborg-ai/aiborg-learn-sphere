-- AI Study Planner Migration
-- Smart scheduling, adaptive curriculum, learning style detection

-- =====================================================
-- LEARNING STYLE PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS learning_style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Primary learning styles (scores 0-100)
  visual_score INTEGER DEFAULT 50 CHECK (visual_score BETWEEN 0 AND 100),
  auditory_score INTEGER DEFAULT 50 CHECK (auditory_score BETWEEN 0 AND 100),
  reading_score INTEGER DEFAULT 50 CHECK (reading_score BETWEEN 0 AND 100),
  kinesthetic_score INTEGER DEFAULT 50 CHECK (kinesthetic_score BETWEEN 0 AND 100),

  -- Preferred formats
  preferred_content_format TEXT[] DEFAULT '{}',

  -- Learning preferences
  preferred_session_length INTEGER DEFAULT 25, -- minutes (Pomodoro default)
  preferred_break_length INTEGER DEFAULT 5, -- minutes
  sessions_before_long_break INTEGER DEFAULT 4,
  long_break_length INTEGER DEFAULT 15,

  -- Focus patterns
  focus_duration_avg INTEGER DEFAULT 25, -- actual measured focus time
  distraction_frequency TEXT DEFAULT 'moderate', -- low, moderate, high

  -- Pacing preferences
  preferred_pace TEXT DEFAULT 'moderate' CHECK (preferred_pace IN ('slow', 'moderate', 'fast', 'adaptive')),

  -- Assessment results
  last_style_assessment_at TIMESTAMPTZ,
  assessment_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_learning_style UNIQUE (user_id)
);

-- =====================================================
-- OPTIMAL LEARNING TIMES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_optimal_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Day of week (0 = Sunday, 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),

  -- Time slots with productivity scores
  morning_score INTEGER DEFAULT 50 CHECK (morning_score BETWEEN 0 AND 100), -- 6am-12pm
  afternoon_score INTEGER DEFAULT 50 CHECK (afternoon_score BETWEEN 0 AND 100), -- 12pm-5pm
  evening_score INTEGER DEFAULT 50 CHECK (evening_score BETWEEN 0 AND 100), -- 5pm-9pm
  night_score INTEGER DEFAULT 30 CHECK (night_score BETWEEN 0 AND 100), -- 9pm-12am

  -- Best hour (0-23)
  peak_hour INTEGER CHECK (peak_hour BETWEEN 0 AND 23),

  -- Availability windows
  available_start TIME,
  available_end TIME,

  -- Data points used for calculation
  sample_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_day UNIQUE (user_id, day_of_week)
);

-- =====================================================
-- STUDY PLANS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan details
  title TEXT NOT NULL,
  description TEXT,

  -- Goal linkage
  learning_goal_id UUID, -- Optional link to user_learning_goals
  course_id UUID, -- Optional link to courses

  -- Time parameters
  start_date DATE NOT NULL,
  end_date DATE,
  total_hours_planned NUMERIC(6,2),
  hours_per_week NUMERIC(4,2) DEFAULT 5,

  -- Adaptive settings
  difficulty_adjustment TEXT DEFAULT 'auto' CHECK (difficulty_adjustment IN ('fixed', 'auto', 'challenge')),
  pace_adjustment TEXT DEFAULT 'auto' CHECK (pace_adjustment IN ('fixed', 'auto', 'accelerate', 'decelerate')),

  -- Focus areas
  focus_topics TEXT[] DEFAULT '{}',
  skip_mastered BOOLEAN DEFAULT TRUE,
  deep_dive_struggling BOOLEAN DEFAULT TRUE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),

  -- AI generation metadata
  is_ai_generated BOOLEAN DEFAULT FALSE,
  generation_params JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STUDY PLAN ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS study_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES user_study_plans(id) ON DELETE CASCADE,

  -- Content reference
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'lesson', 'nugget', 'quiz', 'exercise', 'review', 'custom')),
  content_id UUID, -- Optional reference to actual content

  -- Item details
  title TEXT NOT NULL,
  description TEXT,

  -- Scheduling
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  duration_minutes INTEGER NOT NULL DEFAULT 30,

  -- Priority and order
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  order_index INTEGER DEFAULT 0,

  -- Adaptive flags
  is_mastered BOOLEAN DEFAULT FALSE, -- Skip if true and skip_mastered enabled
  needs_deep_dive BOOLEAN DEFAULT FALSE, -- Extra time if struggling
  prerequisite_item_id UUID REFERENCES study_plan_items(id),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'skipped', 'rescheduled')),
  completed_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STUDY SESSIONS (Real-time tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan linkage
  plan_id UUID REFERENCES user_study_plans(id) ON DELETE SET NULL,
  plan_item_id UUID REFERENCES study_plan_items(id) ON DELETE SET NULL,

  -- Session details
  title TEXT,
  content_type TEXT,
  content_id UUID,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,

  -- Duration tracking
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  active_duration_minutes INTEGER, -- Excluding pauses

  -- Break tracking
  breaks_taken INTEGER DEFAULT 0,
  total_break_minutes INTEGER DEFAULT 0,

  -- Focus metrics
  focus_score INTEGER CHECK (focus_score BETWEEN 0 AND 100),
  distraction_count INTEGER DEFAULT 0,

  -- Performance
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  productivity_score INTEGER CHECK (productivity_score BETWEEN 0 AND 100),

  -- Context
  environment TEXT, -- home, office, library, cafe
  device_type TEXT, -- desktop, mobile, tablet

  -- Self-assessment
  energy_level_before INTEGER CHECK (energy_level_before BETWEEN 1 AND 5),
  energy_level_after INTEGER CHECK (energy_level_after BETWEEN 1 AND 5),
  mood_before TEXT,
  mood_after TEXT,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STUDY SCHEDULE (Weekly recurring slots)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_study_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Schedule details
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Preferences
  session_type TEXT DEFAULT 'focused' CHECK (session_type IN ('focused', 'review', 'practice', 'reading', 'any')),
  is_flexible BOOLEAN DEFAULT FALSE, -- Can be moved if needed

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT unique_user_schedule_slot UNIQUE (user_id, day_of_week, start_time)
);

-- =====================================================
-- ADAPTIVE CURRICULUM TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS adaptive_curriculum_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES user_study_plans(id) ON DELETE CASCADE,

  -- Mastery tracking
  mastered_topics JSONB DEFAULT '[]', -- [{topic_id, mastered_at, score}]
  struggling_topics JSONB DEFAULT '[]', -- [{topic_id, attempts, avg_score, needs_review}]

  -- Pace analysis
  current_pace TEXT DEFAULT 'on_track' CHECK (current_pace IN ('behind', 'on_track', 'ahead')),
  pace_deviation_days INTEGER DEFAULT 0, -- Positive = ahead, negative = behind

  -- Recommendations
  recommended_adjustments JSONB DEFAULT '[]', -- AI suggestions
  last_adjustment_at TIMESTAMPTZ,

  -- Learning patterns
  best_content_types TEXT[] DEFAULT '{}',
  worst_content_types TEXT[] DEFAULT '{}',
  optimal_session_length INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_plan_state UNIQUE (user_id, plan_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_learning_style_user ON learning_style_profiles(user_id);
CREATE INDEX idx_optimal_times_user ON user_optimal_times(user_id);
CREATE INDEX idx_study_plans_user ON user_study_plans(user_id);
CREATE INDEX idx_study_plans_status ON user_study_plans(status);
CREATE INDEX idx_study_plan_items_plan ON study_plan_items(plan_id);
CREATE INDEX idx_study_plan_items_date ON study_plan_items(scheduled_date);
CREATE INDEX idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_started ON study_sessions(started_at DESC);
CREATE INDEX idx_study_schedule_user ON user_study_schedule(user_id);
CREATE INDEX idx_adaptive_state_user ON adaptive_curriculum_state(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE learning_style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_optimal_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_curriculum_state ENABLE ROW LEVEL SECURITY;

-- Users can manage their own data
CREATE POLICY learning_style_user_policy ON learning_style_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY optimal_times_user_policy ON user_optimal_times
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY study_plans_user_policy ON user_study_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY study_plan_items_user_policy ON study_plan_items
  FOR ALL USING (plan_id IN (SELECT id FROM user_study_plans WHERE user_id = auth.uid()));

CREATE POLICY study_sessions_user_policy ON study_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY study_schedule_user_policy ON user_study_schedule
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY adaptive_state_user_policy ON adaptive_curriculum_state
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Calculate optimal study times based on session history
CREATE OR REPLACE FUNCTION calculate_optimal_times(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_day INTEGER;
  v_sessions RECORD;
BEGIN
  -- For each day of the week
  FOR v_day IN 0..6 LOOP
    -- Calculate productivity scores by time of day
    INSERT INTO user_optimal_times (
      user_id,
      day_of_week,
      morning_score,
      afternoon_score,
      evening_score,
      night_score,
      peak_hour,
      sample_count
    )
    SELECT
      p_user_id,
      v_day,
      COALESCE(AVG(CASE
        WHEN EXTRACT(HOUR FROM started_at) BETWEEN 6 AND 11 THEN productivity_score
      END), 50)::INTEGER,
      COALESCE(AVG(CASE
        WHEN EXTRACT(HOUR FROM started_at) BETWEEN 12 AND 16 THEN productivity_score
      END), 50)::INTEGER,
      COALESCE(AVG(CASE
        WHEN EXTRACT(HOUR FROM started_at) BETWEEN 17 AND 20 THEN productivity_score
      END), 50)::INTEGER,
      COALESCE(AVG(CASE
        WHEN EXTRACT(HOUR FROM started_at) BETWEEN 21 AND 23 THEN productivity_score
      END), 30)::INTEGER,
      -- Peak hour
      (
        SELECT EXTRACT(HOUR FROM started_at)::INTEGER
        FROM study_sessions
        WHERE user_id = p_user_id
          AND EXTRACT(DOW FROM started_at) = v_day
          AND productivity_score IS NOT NULL
        GROUP BY EXTRACT(HOUR FROM started_at)
        ORDER BY AVG(productivity_score) DESC
        LIMIT 1
      ),
      -- Sample count
      COUNT(*)::INTEGER
    FROM study_sessions
    WHERE user_id = p_user_id
      AND EXTRACT(DOW FROM started_at) = v_day
      AND productivity_score IS NOT NULL
    ON CONFLICT (user_id, day_of_week)
    DO UPDATE SET
      morning_score = EXCLUDED.morning_score,
      afternoon_score = EXCLUDED.afternoon_score,
      evening_score = EXCLUDED.evening_score,
      night_score = EXCLUDED.night_score,
      peak_hour = EXCLUDED.peak_hour,
      sample_count = EXCLUDED.sample_count,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate AI study plan
CREATE OR REPLACE FUNCTION generate_study_plan(
  p_user_id UUID,
  p_title TEXT,
  p_goal_id UUID DEFAULT NULL,
  p_course_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_hours_per_week NUMERIC DEFAULT 5,
  p_duration_weeks INTEGER DEFAULT 4
) RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
  v_end_date DATE;
  v_learning_style RECORD;
  v_optimal_times RECORD;
BEGIN
  -- Calculate end date
  v_end_date := p_start_date + (p_duration_weeks * 7);

  -- Get learning style
  SELECT * INTO v_learning_style
  FROM learning_style_profiles
  WHERE user_id = p_user_id;

  -- Create the study plan
  INSERT INTO user_study_plans (
    user_id,
    title,
    learning_goal_id,
    course_id,
    start_date,
    end_date,
    hours_per_week,
    total_hours_planned,
    is_ai_generated,
    generation_params
  ) VALUES (
    p_user_id,
    p_title,
    p_goal_id,
    p_course_id,
    p_start_date,
    v_end_date,
    p_hours_per_week,
    p_hours_per_week * p_duration_weeks,
    TRUE,
    jsonb_build_object(
      'duration_weeks', p_duration_weeks,
      'learning_style', v_learning_style,
      'generated_at', NOW()
    )
  ) RETURNING id INTO v_plan_id;

  -- Initialize adaptive curriculum state
  INSERT INTO adaptive_curriculum_state (
    user_id,
    plan_id
  ) VALUES (
    p_user_id,
    v_plan_id
  );

  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record study session and update analytics
CREATE OR REPLACE FUNCTION complete_study_session(
  p_session_id UUID,
  p_completion_percentage INTEGER DEFAULT 100,
  p_productivity_score INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS TABLE (
  session_id UUID,
  duration_minutes INTEGER,
  streak_bonus BOOLEAN
) AS $$
DECLARE
  v_session RECORD;
  v_duration INTEGER;
  v_active_duration INTEGER;
BEGIN
  -- Get session
  SELECT * INTO v_session
  FROM study_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Calculate duration
  v_duration := EXTRACT(EPOCH FROM (NOW() - v_session.started_at)) / 60;
  v_active_duration := v_duration - COALESCE(v_session.total_break_minutes, 0);

  -- Update session
  UPDATE study_sessions SET
    ended_at = NOW(),
    actual_duration_minutes = v_duration,
    active_duration_minutes = v_active_duration,
    completion_percentage = p_completion_percentage,
    productivity_score = COALESCE(p_productivity_score,
      CASE
        WHEN p_completion_percentage >= 90 THEN 90
        WHEN p_completion_percentage >= 70 THEN 75
        WHEN p_completion_percentage >= 50 THEN 60
        ELSE 40
      END
    ),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Update plan item if linked
  IF v_session.plan_item_id IS NOT NULL THEN
    UPDATE study_plan_items SET
      status = 'completed',
      completed_at = NOW(),
      actual_duration_minutes = v_active_duration
    WHERE id = v_session.plan_item_id;

    -- Update plan completion percentage
    UPDATE user_study_plans SET
      completion_percentage = (
        SELECT ROUND(AVG(CASE WHEN status = 'completed' THEN 100 ELSE 0 END))
        FROM study_plan_items
        WHERE plan_id = v_session.plan_id
      )
    WHERE id = v_session.plan_id;
  END IF;

  -- Recalculate optimal times
  PERFORM calculate_optimal_times(v_session.user_id);

  RETURN QUERY SELECT
    p_session_id,
    v_active_duration,
    FALSE; -- Streak bonus calculation can be added
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update learning style based on performance
CREATE OR REPLACE FUNCTION update_learning_style(
  p_user_id UUID,
  p_content_type TEXT,
  p_score INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Ensure profile exists
  INSERT INTO learning_style_profiles (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update scores based on content type performance
  UPDATE learning_style_profiles SET
    visual_score = CASE
      WHEN p_content_type IN ('video', 'infographic', 'diagram')
      THEN LEAST(100, visual_score + (p_score - 70) / 10)
      ELSE visual_score
    END,
    auditory_score = CASE
      WHEN p_content_type IN ('audio', 'podcast', 'lecture')
      THEN LEAST(100, auditory_score + (p_score - 70) / 10)
      ELSE auditory_score
    END,
    reading_score = CASE
      WHEN p_content_type IN ('reading', 'article', 'documentation')
      THEN LEAST(100, reading_score + (p_score - 70) / 10)
      ELSE reading_score
    END,
    kinesthetic_score = CASE
      WHEN p_content_type IN ('exercise', 'lab', 'hands-on', 'quiz')
      THEN LEAST(100, kinesthetic_score + (p_score - 70) / 10)
      ELSE kinesthetic_score
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get study plan recommendations
CREATE OR REPLACE FUNCTION get_plan_recommendations(p_user_id UUID)
RETURNS TABLE (
  recommendation_type TEXT,
  title TEXT,
  description TEXT,
  priority INTEGER,
  action_data JSONB
) AS $$
BEGIN
  -- Check for upcoming deadlines
  RETURN QUERY
  SELECT
    'deadline'::TEXT,
    'Upcoming deadline: ' || sp.title,
    'Your plan ends in ' || (sp.end_date - CURRENT_DATE) || ' days with ' ||
      (100 - sp.completion_percentage) || '% remaining',
    1,
    jsonb_build_object('plan_id', sp.id, 'days_remaining', sp.end_date - CURRENT_DATE)
  FROM user_study_plans sp
  WHERE sp.user_id = p_user_id
    AND sp.status = 'active'
    AND sp.end_date <= CURRENT_DATE + 7
    AND sp.completion_percentage < 90;

  -- Check for overdue items
  RETURN QUERY
  SELECT
    'overdue'::TEXT,
    'Overdue items need attention',
    COUNT(*) || ' study items are past their scheduled date',
    2,
    jsonb_build_object('count', COUNT(*))
  FROM study_plan_items spi
  JOIN user_study_plans sp ON spi.plan_id = sp.id
  WHERE sp.user_id = p_user_id
    AND spi.status = 'pending'
    AND spi.scheduled_date < CURRENT_DATE
  GROUP BY sp.user_id
  HAVING COUNT(*) > 0;

  -- Check for optimal study time
  RETURN QUERY
  SELECT
    'optimal_time'::TEXT,
    'Best study time today',
    'Based on your history, ' ||
      CASE peak_hour
        WHEN 6 THEN '6 AM'
        WHEN 7 THEN '7 AM'
        WHEN 8 THEN '8 AM'
        WHEN 9 THEN '9 AM'
        WHEN 10 THEN '10 AM'
        WHEN 11 THEN '11 AM'
        WHEN 12 THEN '12 PM'
        WHEN 13 THEN '1 PM'
        WHEN 14 THEN '2 PM'
        WHEN 15 THEN '3 PM'
        WHEN 16 THEN '4 PM'
        WHEN 17 THEN '5 PM'
        WHEN 18 THEN '6 PM'
        WHEN 19 THEN '7 PM'
        WHEN 20 THEN '8 PM'
        WHEN 21 THEN '9 PM'
        ELSE peak_hour::TEXT
      END || ' is your most productive time',
    3,
    jsonb_build_object('peak_hour', peak_hour)
  FROM user_optimal_times
  WHERE user_id = p_user_id
    AND day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
    AND peak_hour IS NOT NULL;

  -- Suggest session length based on style
  RETURN QUERY
  SELECT
    'session_suggestion'::TEXT,
    'Optimal session length',
    'Try ' || preferred_session_length || ' minute sessions with ' ||
      preferred_break_length || ' minute breaks',
    4,
    jsonb_build_object(
      'session_minutes', preferred_session_length,
      'break_minutes', preferred_break_length
    )
  FROM learning_style_profiles
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get today's study schedule
CREATE OR REPLACE FUNCTION get_todays_schedule(p_user_id UUID)
RETURNS TABLE (
  item_id UUID,
  plan_title TEXT,
  item_title TEXT,
  content_type TEXT,
  scheduled_time TIME,
  duration_minutes INTEGER,
  priority TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    spi.id,
    sp.title,
    spi.title,
    spi.content_type,
    spi.scheduled_start_time,
    spi.duration_minutes,
    spi.priority,
    spi.status
  FROM study_plan_items spi
  JOIN user_study_plans sp ON spi.plan_id = sp.id
  WHERE sp.user_id = p_user_id
    AND spi.scheduled_date = CURRENT_DATE
    AND spi.status NOT IN ('completed', 'skipped')
  ORDER BY spi.scheduled_start_time NULLS LAST, spi.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_study_planner_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_learning_style_timestamp
  BEFORE UPDATE ON learning_style_profiles
  FOR EACH ROW EXECUTE FUNCTION update_study_planner_timestamp();

CREATE TRIGGER update_optimal_times_timestamp
  BEFORE UPDATE ON user_optimal_times
  FOR EACH ROW EXECUTE FUNCTION update_study_planner_timestamp();

CREATE TRIGGER update_study_plans_timestamp
  BEFORE UPDATE ON user_study_plans
  FOR EACH ROW EXECUTE FUNCTION update_study_planner_timestamp();

CREATE TRIGGER update_study_plan_items_timestamp
  BEFORE UPDATE ON study_plan_items
  FOR EACH ROW EXECUTE FUNCTION update_study_planner_timestamp();

CREATE TRIGGER update_study_sessions_timestamp
  BEFORE UPDATE ON study_sessions
  FOR EACH ROW EXECUTE FUNCTION update_study_planner_timestamp();

CREATE TRIGGER update_study_schedule_timestamp
  BEFORE UPDATE ON user_study_schedule
  FOR EACH ROW EXECUTE FUNCTION update_study_planner_timestamp();

CREATE TRIGGER update_adaptive_state_timestamp
  BEFORE UPDATE ON adaptive_curriculum_state
  FOR EACH ROW EXECUTE FUNCTION update_study_planner_timestamp();

COMMENT ON TABLE learning_style_profiles IS 'User learning style preferences and detection';
COMMENT ON TABLE user_optimal_times IS 'Calculated optimal study times per day';
COMMENT ON TABLE user_study_plans IS 'AI-generated and custom study plans';
COMMENT ON TABLE study_plan_items IS 'Individual items within study plans';
COMMENT ON TABLE study_sessions IS 'Real-time study session tracking';
COMMENT ON TABLE user_study_schedule IS 'Weekly recurring study time slots';
COMMENT ON TABLE adaptive_curriculum_state IS 'Adaptive curriculum tracking per plan';
