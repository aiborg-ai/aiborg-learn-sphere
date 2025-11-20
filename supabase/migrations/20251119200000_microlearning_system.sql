/**
 * Microlearning System
 *
 * Phase 2.3: Bite-sized learning with:
 * - Learning nuggets (2-10 minute lessons)
 * - AI content chunking
 * - Daily learning goals
 * - Just-in-time recommendations
 * - Spaced repetition for nuggets
 */

-- Learning Nuggets (bite-sized content)
CREATE TABLE IF NOT EXISTS learning_nuggets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID, -- Reference to original lesson if chunked from course
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'reading', 'quiz', 'exercise', 'flashcard', 'summary')),
  content JSONB NOT NULL, -- Content data (video_url, text, questions, etc.)
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 15),
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  skill_tags TEXT[], -- Skills this nugget teaches
  prerequisites UUID[], -- Other nugget IDs that should be completed first
  order_index INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User nugget progress
CREATE TABLE IF NOT EXISTS user_nugget_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nugget_id UUID NOT NULL REFERENCES learning_nuggets(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  score INTEGER, -- Quiz/exercise score
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  next_review_date DATE, -- For spaced repetition
  easiness_factor NUMERIC DEFAULT 2.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, nugget_id)
);

-- Daily learning goals
CREATE TABLE IF NOT EXISTS user_learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_minutes_goal INTEGER DEFAULT 15 CHECK (daily_minutes_goal BETWEEN 5 AND 120),
  daily_nuggets_goal INTEGER DEFAULT 3 CHECK (daily_nuggets_goal BETWEEN 1 AND 20),
  preferred_learning_times TEXT[] DEFAULT ARRAY['morning', 'evening'], -- morning, afternoon, evening, night
  notification_enabled BOOLEAN DEFAULT TRUE,
  notification_times TIME[] DEFAULT ARRAY['08:00', '20:00']::TIME[],
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Daily learning activity
CREATE TABLE IF NOT EXISTS user_daily_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_learned INTEGER DEFAULT 0,
  nuggets_completed INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  goal_achieved BOOLEAN DEFAULT FALSE,
  nugget_ids UUID[] DEFAULT '{}', -- Nuggets completed this day
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Learning streaks (enhanced)
CREATE TABLE IF NOT EXISTS user_learning_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_started_at DATE,
  total_learning_days INTEGER DEFAULT 0,
  freeze_days_remaining INTEGER DEFAULT 0, -- Streak freeze protection
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Just-in-time recommendations
CREATE TABLE IF NOT EXISTS learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nugget_id UUID NOT NULL REFERENCES learning_nuggets(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'spaced_review', -- Due for review
    'skill_gap', -- Addresses skill gap
    'trending', -- Trending content
    'career_goal', -- Aligned with career goal
    'contextual', -- Based on current activity
    'daily_goal' -- To meet daily goal
  )),
  priority_score INTEGER DEFAULT 50 CHECK (priority_score BETWEEN 0 AND 100),
  reason TEXT,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  is_dismissed BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_nuggets_course ON learning_nuggets(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_nuggets_type ON learning_nuggets(content_type);
CREATE INDEX IF NOT EXISTS idx_learning_nuggets_skills ON learning_nuggets USING GIN(skill_tags);
CREATE INDEX IF NOT EXISTS idx_user_nugget_progress_user ON user_nugget_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nugget_progress_review ON user_nugget_progress(next_review_date) WHERE next_review_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_daily_learning_user_date ON user_daily_learning(user_id, date);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_user ON learning_recommendations(user_id) WHERE is_dismissed = FALSE AND is_completed = FALSE;

-- RLS Policies
ALTER TABLE learning_nuggets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nugget_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_recommendations ENABLE ROW LEVEL SECURITY;

-- Public read for nuggets
CREATE POLICY "Anyone can read active nuggets" ON learning_nuggets FOR SELECT USING (is_active = TRUE);

-- User-specific access
CREATE POLICY "Users can read own nugget progress" ON user_nugget_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own nugget progress" ON user_nugget_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own learning goals" ON user_learning_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own daily learning" ON user_daily_learning FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own streaks" ON user_learning_streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recommendations" ON learning_recommendations FOR ALL USING (auth.uid() = user_id);

-- Function to get nuggets due for review
CREATE OR REPLACE FUNCTION get_due_nuggets(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  nugget_id UUID,
  title TEXT,
  content_type TEXT,
  duration_minutes INTEGER,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content_type,
    n.duration_minutes,
    (CURRENT_DATE - unp.next_review_date)::INTEGER as days_overdue
  FROM user_nugget_progress unp
  JOIN learning_nuggets n ON n.id = unp.nugget_id
  WHERE unp.user_id = p_user_id
    AND unp.next_review_date <= CURRENT_DATE
    AND unp.status IN ('completed', 'mastered')
  ORDER BY unp.next_review_date ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update daily learning and streak
CREATE OR REPLACE FUNCTION update_daily_learning(
  p_user_id UUID,
  p_minutes INTEGER,
  p_nugget_id UUID DEFAULT NULL
)
RETURNS TABLE (
  streak_updated BOOLEAN,
  new_streak INTEGER,
  goal_achieved BOOLEAN,
  points_earned INTEGER
) AS $$
DECLARE
  v_streak_updated BOOLEAN := FALSE;
  v_new_streak INTEGER;
  v_goal_achieved BOOLEAN := FALSE;
  v_points INTEGER := 0;
  v_daily_goal INTEGER;
  v_total_minutes INTEGER;
BEGIN
  -- Get user's daily goal
  SELECT daily_minutes_goal INTO v_daily_goal
  FROM user_learning_goals
  WHERE user_id = p_user_id;

  IF v_daily_goal IS NULL THEN
    v_daily_goal := 15; -- Default
  END IF;

  -- Upsert daily learning
  INSERT INTO user_daily_learning (user_id, date, minutes_learned, nuggets_completed, nugget_ids)
  VALUES (
    p_user_id,
    CURRENT_DATE,
    p_minutes,
    CASE WHEN p_nugget_id IS NOT NULL THEN 1 ELSE 0 END,
    CASE WHEN p_nugget_id IS NOT NULL THEN ARRAY[p_nugget_id] ELSE '{}' END
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    minutes_learned = user_daily_learning.minutes_learned + p_minutes,
    nuggets_completed = user_daily_learning.nuggets_completed +
      CASE WHEN p_nugget_id IS NOT NULL THEN 1 ELSE 0 END,
    nugget_ids = CASE
      WHEN p_nugget_id IS NOT NULL AND NOT (p_nugget_id = ANY(user_daily_learning.nugget_ids))
      THEN array_append(user_daily_learning.nugget_ids, p_nugget_id)
      ELSE user_daily_learning.nugget_ids
    END,
    updated_at = NOW()
  RETURNING minutes_learned INTO v_total_minutes;

  -- Check if goal achieved
  IF v_total_minutes >= v_daily_goal THEN
    UPDATE user_daily_learning
    SET goal_achieved = TRUE
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    v_goal_achieved := TRUE;
    v_points := 50; -- Bonus for achieving daily goal
  END IF;

  -- Update streak
  INSERT INTO user_learning_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_started_at, total_learning_days)
  VALUES (p_user_id, 1, 1, CURRENT_DATE, CURRENT_DATE, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      WHEN user_learning_streaks.last_activity_date = CURRENT_DATE THEN user_learning_streaks.current_streak
      WHEN user_learning_streaks.last_activity_date = CURRENT_DATE - 1 THEN user_learning_streaks.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_learning_streaks.longest_streak,
      CASE
        WHEN user_learning_streaks.last_activity_date = CURRENT_DATE THEN user_learning_streaks.current_streak
        WHEN user_learning_streaks.last_activity_date = CURRENT_DATE - 1 THEN user_learning_streaks.current_streak + 1
        ELSE 1
      END
    ),
    last_activity_date = CURRENT_DATE,
    streak_started_at = CASE
      WHEN user_learning_streaks.last_activity_date = CURRENT_DATE - 1 OR user_learning_streaks.last_activity_date = CURRENT_DATE
      THEN user_learning_streaks.streak_started_at
      ELSE CURRENT_DATE
    END,
    total_learning_days = user_learning_streaks.total_learning_days +
      CASE WHEN user_learning_streaks.last_activity_date < CURRENT_DATE THEN 1 ELSE 0 END,
    updated_at = NOW()
  RETURNING current_streak INTO v_new_streak;

  -- Award streak milestone points
  IF v_new_streak = 7 THEN
    v_points := v_points + 100; -- Weekly streak bonus
  ELSIF v_new_streak = 30 THEN
    v_points := v_points + 500; -- Monthly streak bonus
  ELSIF v_new_streak = 100 THEN
    v_points := v_points + 2000; -- 100-day streak bonus
  END IF;

  -- Update points if any earned
  IF v_points > 0 THEN
    UPDATE user_daily_learning
    SET points_earned = user_daily_learning.points_earned + v_points
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
  END IF;

  RETURN QUERY SELECT
    (v_new_streak > 1 OR v_goal_achieved),
    v_new_streak,
    v_goal_achieved,
    v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate daily recommendations
CREATE OR REPLACE FUNCTION generate_daily_recommendations(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Clear expired recommendations
  DELETE FROM learning_recommendations
  WHERE user_id = p_user_id AND (expires_at < NOW() OR is_completed = TRUE);

  -- Add spaced review recommendations
  INSERT INTO learning_recommendations (user_id, nugget_id, recommendation_type, priority_score, reason)
  SELECT
    p_user_id,
    n.id,
    'spaced_review',
    90 - LEAST((CURRENT_DATE - unp.next_review_date)::INTEGER * 5, 30),
    'Due for review to maintain retention'
  FROM user_nugget_progress unp
  JOIN learning_nuggets n ON n.id = unp.nugget_id
  WHERE unp.user_id = p_user_id
    AND unp.next_review_date <= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM learning_recommendations lr
      WHERE lr.user_id = p_user_id AND lr.nugget_id = n.id AND lr.is_dismissed = FALSE
    )
  LIMIT 5;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Add daily goal recommendations (new nuggets to reach goal)
  INSERT INTO learning_recommendations (user_id, nugget_id, recommendation_type, priority_score, reason)
  SELECT
    p_user_id,
    n.id,
    'daily_goal',
    70,
    'Complete to reach your daily learning goal'
  FROM learning_nuggets n
  LEFT JOIN user_nugget_progress unp ON unp.nugget_id = n.id AND unp.user_id = p_user_id
  WHERE n.is_active = TRUE
    AND (unp.id IS NULL OR unp.status = 'not_started')
    AND NOT EXISTS (
      SELECT 1 FROM learning_recommendations lr
      WHERE lr.user_id = p_user_id AND lr.nugget_id = n.id AND lr.is_dismissed = FALSE
    )
  ORDER BY n.order_index, RANDOM()
  LIMIT 5;

  GET DIAGNOSTICS v_count = v_count + ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate next review date (SM-2)
CREATE OR REPLACE FUNCTION calculate_next_review(
  p_easiness_factor NUMERIC,
  p_repetition_count INTEGER,
  p_quality INTEGER
)
RETURNS TABLE (
  next_date DATE,
  new_easiness NUMERIC,
  new_repetition INTEGER
) AS $$
DECLARE
  v_ef NUMERIC;
  v_interval INTEGER;
  v_rep INTEGER;
BEGIN
  -- Update easiness factor
  v_ef := p_easiness_factor + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02));
  v_ef := GREATEST(1.3, v_ef);

  -- Calculate interval and repetition
  IF p_quality < 3 THEN
    v_rep := 0;
    v_interval := 1;
  ELSE
    v_rep := p_repetition_count + 1;
    IF v_rep = 1 THEN
      v_interval := 1;
    ELSIF v_rep = 2 THEN
      v_interval := 6;
    ELSE
      v_interval := CEIL((v_rep - 1) * v_ef)::INTEGER;
    END IF;
  END IF;

  RETURN QUERY SELECT
    (CURRENT_DATE + v_interval)::DATE,
    v_ef,
    v_rep;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_due_nuggets(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_learning(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_daily_recommendations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_review(NUMERIC, INTEGER, INTEGER) TO authenticated;

-- Create sample learning nuggets
INSERT INTO learning_nuggets (title, description, content_type, content, duration_minutes, difficulty, skill_tags) VALUES
('What is Machine Learning?', 'Quick intro to ML concepts', 'video', '{"video_url": "", "transcript": "Machine learning is a subset of AI..."}', 3, 'beginner', ARRAY['machine-learning']),
('Python Variables in 5 Minutes', 'Learn Python variable basics', 'reading', '{"text": "# Variables in Python\n\nVariables are containers for storing data..."}', 5, 'beginner', ARRAY['python']),
('Neural Network Quiz', 'Test your neural network knowledge', 'quiz', '{"questions": [{"question": "What is a neuron?", "options": ["A", "B", "C", "D"], "correct": 0}]}', 3, 'intermediate', ARRAY['deep-learning']),
('Prompt Engineering Basics', 'Core concepts of prompt design', 'reading', '{"text": "# Prompt Engineering\n\nPrompt engineering is the art of..."}', 5, 'beginner', ARRAY['prompt-engineering']),
('Data Visualization Best Practices', 'Quick tips for effective charts', 'video', '{"video_url": "", "key_points": ["Choose the right chart", "Use color wisely"]}', 4, 'intermediate', ARRAY['data-visualization']),
('SQL SELECT Statement', 'Master the SELECT query', 'exercise', '{"instructions": "Write a SELECT query...", "solution": "SELECT * FROM users"}', 5, 'beginner', ARRAY['sql']),
('NLP Tokenization Explained', 'Understanding text tokenization', 'reading', '{"text": "# Tokenization\n\nTokenization is the process of..."}', 4, 'intermediate', ARRAY['nlp']),
('Generative AI Overview', 'What makes AI generative?', 'video', '{"video_url": "", "duration_seconds": 180}', 3, 'beginner', ARRAY['generative-ai'])
ON CONFLICT DO NOTHING;

COMMENT ON TABLE learning_nuggets IS 'Bite-sized learning content (2-15 minutes) for microlearning';
COMMENT ON TABLE user_nugget_progress IS 'User progress and spaced repetition state for nuggets';
COMMENT ON TABLE user_learning_goals IS 'User daily learning goals and notification preferences';
COMMENT ON TABLE user_daily_learning IS 'Daily learning activity tracking';
COMMENT ON TABLE user_learning_streaks IS 'User learning streak tracking with freeze protection';
COMMENT ON TABLE learning_recommendations IS 'AI-generated just-in-time learning recommendations';
