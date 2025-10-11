-- ============================================================================
-- Gamification System - Phase 3
-- Achievements, Points, Levels, Leaderboards, Streaks
-- ============================================================================

-- ============================================================================
-- 1. ACHIEVEMENTS TABLES
-- ============================================================================

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  category TEXT NOT NULL CHECK (category IN ('completion', 'performance', 'streak', 'social', 'special')),
  criteria JSONB NOT NULL,
  points_value INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  rarity_percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (unlocked badges)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_achievements_tier ON achievements(tier);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at DESC);

-- ============================================================================
-- 2. POINTS & LEVELING TABLES
-- ============================================================================

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  points_multiplier DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point transactions log
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'penalty')),
  source TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_points ON user_progress(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created ON point_transactions(created_at DESC);

-- ============================================================================
-- 3. LEADERBOARDS TABLES
-- ============================================================================

-- Leaderboard configurations
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('global', 'industry', 'role', 'friends', 'team')),
  criteria TEXT NOT NULL CHECK (criteria IN ('points', 'ability', 'assessments', 'streak', 'improvement')),
  time_period TEXT NOT NULL CHECK (time_period IN ('weekly', 'monthly', 'all_time')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard entries (cached for performance)
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score DECIMAL(10,2) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id)
);

-- User leaderboard preferences
CREATE TABLE IF NOT EXISTS user_leaderboard_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  opt_in BOOLEAN DEFAULT true,
  show_real_name BOOLEAN DEFAULT true,
  visible_to TEXT DEFAULT 'all' CHECK (visible_to IN ('all', 'friends', 'team', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_leaderboard ON leaderboard_entries(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON leaderboard_entries(rank);

-- ============================================================================
-- 4. SEED DATA - DEFAULT ACHIEVEMENTS
-- ============================================================================

INSERT INTO achievements (name, description, icon_url, tier, category, criteria, points_value) VALUES
-- Completion Achievements
('First Timer', 'Complete your first AI assessment', '/badges/first-timer.svg', 'bronze', 'completion',
  '{"type": "count", "threshold": 1, "metric": "assessments_completed"}', 100),

('Dedicated Learner', 'Complete 5 assessments', '/badges/dedicated.svg', 'silver', 'completion',
  '{"type": "count", "threshold": 5, "metric": "assessments_completed"}', 500),

('Assessment Master', 'Complete 10 assessments', '/badges/master.svg', 'gold', 'completion',
  '{"type": "count", "threshold": 10, "metric": "assessments_completed"}', 1000),

-- Performance Achievements
('Quick Learner', 'Complete an assessment in under 8 minutes', '/badges/quick.svg', 'bronze', 'performance',
  '{"type": "time", "threshold": 480, "metric": "completion_time"}', 150),

('Perfectionist', 'Score 90%+ on an assessment', '/badges/perfect.svg', 'silver', 'performance',
  '{"type": "score", "threshold": 90, "metric": "ability_percentage"}', 300),

('Expert Level', 'Reach Expert proficiency level', '/badges/expert.svg', 'gold', 'performance',
  '{"type": "ability", "threshold": 1.5, "metric": "ability_score"}', 500),

('Legendary', 'Score in the top 5% of all users', '/badges/legendary.svg', 'diamond', 'performance',
  '{"type": "percentile", "threshold": 95, "metric": "global_rank"}', 2000),

-- Streak Achievements
('On Fire', 'Maintain a 3-day streak', '/badges/fire-3.svg', 'bronze', 'streak',
  '{"type": "streak", "threshold": 3, "metric": "login_streak"}', 100),

('Unstoppable', 'Maintain a 7-day streak', '/badges/fire-7.svg', 'silver', 'streak',
  '{"type": "streak", "threshold": 7, "metric": "login_streak"}', 300),

('Streak Champion', 'Maintain a 30-day streak', '/badges/champion.svg', 'gold', 'streak',
  '{"type": "streak", "threshold": 30, "metric": "login_streak"}', 1000),

-- Social Achievements
('Social Butterfly', 'Share your first result', '/badges/social.svg', 'bronze', 'social',
  '{"type": "count", "threshold": 1, "metric": "shares"}', 100),

('Influencer', 'Get 5 friends to take the assessment', '/badges/influencer.svg', 'silver', 'social',
  '{"type": "count", "threshold": 5, "metric": "referrals"}', 500),

('Team Player', 'Join a study group', '/badges/team.svg', 'bronze', 'social',
  '{"type": "boolean", "metric": "joined_group"}', 100),

-- Special Achievements
('Comeback Kid', 'Improve your score by 20%+', '/badges/comeback.svg', 'silver', 'special',
  '{"type": "improvement", "threshold": 20, "metric": "score_improvement"}', 400),

('Early Bird', 'Complete an assessment before 9 AM', '/badges/early-bird.svg', 'bronze', 'special',
  '{"type": "time_of_day", "threshold": 9, "metric": "completion_hour"}', 100),

('Night Owl', 'Complete an assessment after 8 PM', '/badges/night-owl.svg', 'bronze', 'special',
  '{"type": "time_of_day", "threshold": 20, "metric": "completion_hour"}', 100),

('Weekend Warrior', 'Complete an assessment on a weekend', '/badges/weekend.svg', 'bronze', 'special',
  '{"type": "day_of_week", "metric": "completion_day"}', 100),

('Category Master: Prompting', 'Excel in Prompt Engineering', '/badges/prompt-master.svg', 'gold', 'performance',
  '{"type": "category_score", "threshold": 85, "category": "Prompt Engineering"}', 400),

('Category Master: Agents', 'Excel in AI Agents', '/badges/agent-master.svg', 'gold', 'performance',
  '{"type": "category_score", "threshold": 85, "category": "AI Agents"}', 400),

('Category Master: LLMs', 'Excel in LLM Fundamentals', '/badges/llm-master.svg', 'gold', 'performance',
  '{"type": "category_score", "threshold": 85, "category": "LLM Fundamentals"}', 400)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. DEFAULT LEADERBOARDS
-- ============================================================================

INSERT INTO leaderboards (name, description, type, criteria, time_period) VALUES
('Global Champions', 'Top performers worldwide', 'global', 'points', 'all_time'),
('Weekly Warriors', 'This week''s top scorers', 'global', 'points', 'weekly'),
('Monthly Masters', 'Top performers this month', 'global', 'points', 'monthly'),
('Ability Elite', 'Highest ability scores', 'global', 'ability', 'all_time'),
('Most Improved', 'Biggest improvement this month', 'global', 'improvement', 'monthly'),
('Assessment Champions', 'Most assessments completed', 'global', 'assessments', 'all_time')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Initialize user progress
CREATE OR REPLACE FUNCTION initialize_user_progress(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_progress (user_id, total_points, current_level, last_activity_date)
  VALUES (p_user_id, 0, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO user_leaderboard_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Award points to user
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_multiplier DECIMAL(3,2);
  v_actual_amount INTEGER;
BEGIN
  -- Ensure user progress exists
  PERFORM initialize_user_progress(p_user_id);

  -- Get current level and multiplier
  SELECT current_level, points_multiplier INTO v_old_level, v_multiplier
  FROM user_progress
  WHERE user_id = p_user_id;

  -- Apply multiplier
  v_actual_amount := FLOOR(p_amount * v_multiplier);

  -- Record transaction
  INSERT INTO point_transactions (user_id, amount, transaction_type, source, description, metadata)
  VALUES (p_user_id, v_actual_amount, 'earned', p_source, p_description, p_metadata);

  -- Update user progress
  UPDATE user_progress
  SET
    total_points = total_points + v_actual_amount,
    lifetime_points = lifetime_points + v_actual_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING total_points INTO v_new_total;

  -- Calculate new level (exponential curve: Level = floor(sqrt(total_points / 100)))
  v_new_level := GREATEST(1, FLOOR(SQRT(v_new_total::DECIMAL / 100)));

  -- Update level if changed
  IF v_new_level != v_old_level THEN
    UPDATE user_progress
    SET current_level = v_new_level
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'points_awarded', v_actual_amount,
    'total_points', v_new_total,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'level_up', v_new_level > v_old_level
  );
END;
$$;

-- Check and unlock achievement
CREATE OR REPLACE FUNCTION check_achievement(
  p_user_id UUID,
  p_achievement_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_criteria JSONB;
  v_unlocked BOOLEAN;
  v_points INTEGER;
BEGIN
  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  ) INTO v_unlocked;

  IF v_unlocked THEN
    RETURN false;
  END IF;

  -- Get achievement criteria and points
  SELECT criteria, points_value INTO v_criteria, v_points
  FROM achievements
  WHERE id = p_achievement_id AND is_active = true;

  IF v_criteria IS NULL THEN
    RETURN false;
  END IF;

  -- TODO: Implement criteria checking logic based on type
  -- For now, manual unlock via separate function

  RETURN false;
END;
$$;

-- Manually unlock achievement (for testing and admin)
CREATE OR REPLACE FUNCTION unlock_achievement(
  p_user_id UUID,
  p_achievement_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  ) INTO v_already_unlocked;

  IF v_already_unlocked THEN
    RETURN false;
  END IF;

  -- Get achievement points
  SELECT points_value INTO v_points
  FROM achievements
  WHERE id = p_achievement_id AND is_active = true;

  IF v_points IS NULL THEN
    RETURN false;
  END IF;

  -- Unlock achievement
  INSERT INTO user_achievements (user_id, achievement_id, metadata)
  VALUES (p_user_id, p_achievement_id, p_metadata);

  -- Award points
  PERFORM award_points(
    p_user_id,
    v_points,
    'achievement',
    'Achievement unlocked: ' || (SELECT name FROM achievements WHERE id = p_achievement_id),
    jsonb_build_object('achievement_id', p_achievement_id)
  );

  RETURN true;
END;
$$;

-- Update user streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
  v_bonus_points INTEGER := 0;
BEGIN
  -- Ensure user progress exists
  PERFORM initialize_user_progress(p_user_id);

  -- Get current data
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM user_progress
  WHERE user_id = p_user_id;

  -- Calculate new streak
  IF v_last_activity IS NULL OR v_last_activity < CURRENT_DATE - INTERVAL '1 day' THEN
    -- First activity or streak broken
    v_new_streak := 1;
  ELSIF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day
    v_new_streak := v_current_streak + 1;
    -- Award streak bonus (10 points per day)
    v_bonus_points := 10;
  ELSE
    -- Same day, no change
    v_new_streak := v_current_streak;
  END IF;

  -- Update progress
  UPDATE user_progress
  SET
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_activity_date = CURRENT_DATE,
    points_multiplier = CASE
      WHEN v_new_streak >= 30 THEN 2.0
      WHEN v_new_streak >= 14 THEN 1.5
      WHEN v_new_streak >= 7 THEN 1.25
      ELSE 1.0
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Award streak bonus
  IF v_bonus_points > 0 THEN
    PERFORM award_points(p_user_id, v_bonus_points, 'streak_bonus', 'Daily streak bonus');
  END IF;

  RETURN jsonb_build_object(
    'current_streak', v_new_streak,
    'longest_streak', GREATEST(v_longest_streak, v_new_streak),
    'bonus_points', v_bonus_points,
    'multiplier', CASE
      WHEN v_new_streak >= 30 THEN 2.0
      WHEN v_new_streak >= 14 THEN 1.5
      WHEN v_new_streak >= 7 THEN 1.25
      ELSE 1.0
    END
  );
END;
$$;

-- Get user leaderboard position
CREATE OR REPLACE FUNCTION get_user_leaderboard_position(
  p_user_id UUID,
  p_leaderboard_id UUID
)
RETURNS TABLE (
  rank INTEGER,
  score DECIMAL(10,2),
  total_entries BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    le.rank,
    le.score,
    (SELECT COUNT(*) FROM leaderboard_entries WHERE leaderboard_id = p_leaderboard_id) as total_entries
  FROM leaderboard_entries le
  WHERE le.leaderboard_id = p_leaderboard_id
    AND le.user_id = p_user_id;
END;
$$;

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_leaderboard_preferences ENABLE ROW LEVEL SECURITY;

-- Achievements - everyone can view
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (is_active = true);

-- User achievements - users can view their own
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- User achievements - users can view others' if public
CREATE POLICY "Users can view public achievements"
  ON user_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_leaderboard_preferences
      WHERE user_id = user_achievements.user_id
        AND opt_in = true
    )
  );

-- User progress - users can view their own
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Point transactions - users can view their own
CREATE POLICY "Users can view own transactions"
  ON point_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Leaderboards - everyone can view active leaderboards
CREATE POLICY "Anyone can view leaderboards"
  ON leaderboards FOR SELECT
  USING (is_active = true);

-- Leaderboard entries - respect privacy settings
CREATE POLICY "Anyone can view public leaderboard entries"
  ON leaderboard_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_leaderboard_preferences ulp
      WHERE ulp.user_id = leaderboard_entries.user_id
        AND ulp.opt_in = true
    ) OR auth.uid() = user_id
  );

-- User preferences - users can manage their own
CREATE POLICY "Users can manage own preferences"
  ON user_leaderboard_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboards_updated_at BEFORE UPDATE ON leaderboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE achievements IS 'Achievement definitions with unlock criteria';
COMMENT ON TABLE user_achievements IS 'Achievements unlocked by users';
COMMENT ON TABLE user_progress IS 'User points, levels, and streak tracking';
COMMENT ON TABLE point_transactions IS 'Log of all point awards and deductions';
COMMENT ON TABLE leaderboards IS 'Leaderboard configurations';
COMMENT ON TABLE leaderboard_entries IS 'Cached leaderboard rankings';
COMMENT ON TABLE user_leaderboard_preferences IS 'User privacy and display preferences for leaderboards';

COMMENT ON FUNCTION award_points IS 'Award points to a user and update their level';
COMMENT ON FUNCTION unlock_achievement IS 'Unlock an achievement for a user';
COMMENT ON FUNCTION update_user_streak IS 'Update user daily streak and award bonuses';
COMMENT ON FUNCTION get_user_leaderboard_position IS 'Get user rank in a specific leaderboard';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
