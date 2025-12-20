-- ============================================================================
-- AIBORGLingo Gamification Integration
-- Self-contained Lingo leaderboards and achievements
-- ============================================================================

-- ============================================================================
-- 1. LINGO LEADERBOARD TABLE (Standalone)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lingo_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  perfect_lessons INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_lingo_leaderboard_xp ON lingo_leaderboard(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_lingo_leaderboard_updated ON lingo_leaderboard(updated_at DESC);

-- Enable RLS
ALTER TABLE lingo_leaderboard ENABLE ROW LEVEL SECURITY;

-- Everyone can view leaderboard
CREATE POLICY "Leaderboard is viewable by everyone"
  ON lingo_leaderboard FOR SELECT
  USING (true);

-- Users can update their own entry
CREATE POLICY "Users can update own leaderboard entry"
  ON lingo_leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert entries
CREATE POLICY "System can insert leaderboard entries"
  ON lingo_leaderboard FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 2. LINGO ACHIEVEMENTS TABLE (Standalone)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lingo_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Lessons', 'Streaks', 'XP', 'Accuracy')),
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points_value INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (unlocked)
CREATE TABLE IF NOT EXISTS lingo_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES lingo_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lingo_achievements_category ON lingo_achievements(category);
CREATE INDEX IF NOT EXISTS idx_lingo_user_achievements_user ON lingo_user_achievements(user_id);

-- Enable RLS
ALTER TABLE lingo_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lingo_user_achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can view achievements
CREATE POLICY "Achievements are viewable by everyone"
  ON lingo_achievements FOR SELECT
  USING (is_active = true);

-- Users can view their own earned achievements
CREATE POLICY "Users can view own achievements"
  ON lingo_user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert user achievements
CREATE POLICY "System can insert user achievements"
  ON lingo_user_achievements FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 3. SEED LINGO ACHIEVEMENTS
-- ============================================================================

INSERT INTO lingo_achievements (achievement_id, name, description, icon, category, tier, requirement_type, requirement_value, points_value) VALUES
  -- Lesson Completion
  ('first_steps', 'First Steps', 'Complete your first Lingo lesson', '🎯', 'Lessons', 'bronze', 'lessons_completed', 1, 100),
  ('getting_started', 'Getting Started', 'Complete 5 Lingo lessons', '📚', 'Lessons', 'bronze', 'lessons_completed', 5, 200),
  ('dedicated_learner', 'Dedicated Learner', 'Complete 10 Lingo lessons', '🎓', 'Lessons', 'silver', 'lessons_completed', 10, 400),
  ('ai_scholar', 'AI Scholar', 'Complete 20 Lingo lessons', '🏆', 'Lessons', 'gold', 'lessons_completed', 20, 800),
  ('lingo_master', 'Lingo Master', 'Complete all Lingo lessons', '👑', 'Lessons', 'platinum', 'lessons_completed', 30, 2000),

  -- Streaks
  ('on_fire', 'On Fire', 'Achieve a 3-day Lingo streak', '🔥', 'Streaks', 'bronze', 'streak', 3, 150),
  ('week_warrior', 'Week Warrior', 'Achieve a 7-day Lingo streak', '⚡', 'Streaks', 'silver', 'streak', 7, 350),
  ('two_week_champion', 'Two Week Champion', 'Achieve a 14-day Lingo streak', '💪', 'Streaks', 'gold', 'streak', 14, 700),
  ('month_master', 'Month Master', 'Achieve a 30-day Lingo streak', '🌟', 'Streaks', 'platinum', 'streak', 30, 1500),

  -- XP Milestones
  ('xp_hunter', 'XP Hunter', 'Earn 500 Lingo XP', '⭐', 'XP', 'bronze', 'total_xp', 500, 100),
  ('xp_champion', 'XP Champion', 'Earn 2,000 Lingo XP', '✨', 'XP', 'silver', 'total_xp', 2000, 300),
  ('xp_legend', 'XP Legend', 'Earn 5,000 Lingo XP', '💫', 'XP', 'gold', 'total_xp', 5000, 600),

  -- Accuracy
  ('perfect_lesson', 'Perfect Lesson', 'Complete a lesson with 100% accuracy', '💯', 'Accuracy', 'silver', 'perfect_lessons', 1, 250),
  ('perfection_streak', 'Perfection Streak', 'Complete 5 perfect lessons', '🎯', 'Accuracy', 'gold', 'perfect_lessons', 5, 500)
ON CONFLICT (achievement_id) DO NOTHING;

-- ============================================================================
-- 4. FUNCTION TO UPDATE LEADERBOARD
-- ============================================================================

CREATE OR REPLACE FUNCTION update_lingo_leaderboard()
RETURNS TRIGGER AS $$
DECLARE
  user_display_name TEXT;
  user_avatar TEXT;
  completed_count INTEGER;
  perfect_count INTEGER;
BEGIN
  -- Get user display name and avatar
  SELECT
    COALESCE(full_name, email) as display_name,
    avatar_url
  INTO user_display_name, user_avatar
  FROM profiles
  WHERE id = NEW.user_id;

  -- Count completed lessons
  SELECT COUNT(*) INTO completed_count
  FROM jsonb_each(NEW.lesson_progress)
  WHERE (value->>'completed')::boolean = true;

  -- Count perfect lessons
  SELECT COUNT(*) INTO perfect_count
  FROM jsonb_each(NEW.lesson_progress)
  WHERE (value->>'perfect')::boolean = true;

  -- Upsert leaderboard entry
  INSERT INTO lingo_leaderboard (
    user_id, display_name, avatar_url, total_xp, streak, lessons_completed, perfect_lessons, updated_at
  ) VALUES (
    NEW.user_id, user_display_name, user_avatar, NEW.total_xp, NEW.streak, completed_count, perfect_count, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    total_xp = EXCLUDED.total_xp,
    streak = EXCLUDED.streak,
    lessons_completed = EXCLUDED.lessons_completed,
    perfect_lessons = EXCLUDED.perfect_lessons,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS update_lingo_leaderboard_trigger ON lingo_user_progress;
CREATE TRIGGER update_lingo_leaderboard_trigger
  AFTER INSERT OR UPDATE ON lingo_user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_lingo_leaderboard();

-- ============================================================================
-- 5. FUNCTION TO CHECK AND AWARD ACHIEVEMENTS
-- ============================================================================

CREATE OR REPLACE FUNCTION check_lingo_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement RECORD;
  completed_count INTEGER;
  perfect_count INTEGER;
BEGIN
  -- Count completed and perfect lessons
  SELECT
    COUNT(*) FILTER (WHERE (value->>'completed')::boolean = true),
    COUNT(*) FILTER (WHERE (value->>'perfect')::boolean = true)
  INTO completed_count, perfect_count
  FROM jsonb_each(NEW.lesson_progress);

  -- Check each achievement
  FOR achievement IN
    SELECT * FROM lingo_achievements WHERE is_active = true
  LOOP
    -- Skip if already earned
    IF EXISTS (
      SELECT 1 FROM lingo_user_achievements
      WHERE user_id = NEW.user_id AND achievement_id = achievement.id
    ) THEN
      CONTINUE;
    END IF;

    -- Check if requirement is met
    IF (achievement.requirement_type = 'lessons_completed' AND completed_count >= achievement.requirement_value) OR
       (achievement.requirement_type = 'streak' AND NEW.streak >= achievement.requirement_value) OR
       (achievement.requirement_type = 'total_xp' AND NEW.total_xp >= achievement.requirement_value) OR
       (achievement.requirement_type = 'perfect_lessons' AND perfect_count >= achievement.requirement_value)
    THEN
      INSERT INTO lingo_user_achievements (user_id, achievement_id)
      VALUES (NEW.user_id, achievement.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for achievements
DROP TRIGGER IF EXISTS check_lingo_achievements_trigger ON lingo_user_progress;
CREATE TRIGGER check_lingo_achievements_trigger
  AFTER INSERT OR UPDATE ON lingo_user_progress
  FOR EACH ROW
  EXECUTE FUNCTION check_lingo_achievements();

-- ============================================================================
-- 6. VIEW FOR LEADERBOARD QUERIES
-- ============================================================================

CREATE OR REPLACE VIEW lingo_leaderboard_view AS
SELECT
  lb.user_id,
  lb.display_name,
  lb.avatar_url,
  lb.total_xp AS score,
  lb.streak,
  lb.lessons_completed,
  lb.perfect_lessons,
  lb.updated_at,
  RANK() OVER (ORDER BY lb.total_xp DESC) as rank
FROM lingo_leaderboard lb
WHERE lb.total_xp > 0
ORDER BY lb.total_xp DESC;

-- Grant access
GRANT SELECT ON lingo_leaderboard_view TO authenticated;
GRANT SELECT ON lingo_leaderboard TO authenticated;
GRANT SELECT ON lingo_achievements TO authenticated;
GRANT SELECT ON lingo_user_achievements TO authenticated;

-- ============================================================================
-- 7. ADD question_count COLUMN TO lingo_lessons IF NOT EXISTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lingo_lessons' AND column_name = 'question_count'
  ) THEN
    ALTER TABLE lingo_lessons ADD COLUMN question_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- 8. ADD MISSING COLUMNS TO lingo_questions IF NEEDED
-- ============================================================================

DO $$
BEGIN
  -- Add question_type if not exists (alias for type)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lingo_questions' AND column_name = 'question_type'
  ) THEN
    ALTER TABLE lingo_questions ADD COLUMN question_type TEXT;
    UPDATE lingo_questions SET question_type = type WHERE question_type IS NULL;
  END IF;

  -- Add question_text if not exists (alias for prompt)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lingo_questions' AND column_name = 'question_text'
  ) THEN
    ALTER TABLE lingo_questions ADD COLUMN question_text TEXT;
    UPDATE lingo_questions SET question_text = prompt WHERE question_text IS NULL;
  END IF;

  -- Add correct_answer if not exists (alias for answer)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lingo_questions' AND column_name = 'correct_answer'
  ) THEN
    ALTER TABLE lingo_questions ADD COLUMN correct_answer TEXT;
    UPDATE lingo_questions SET correct_answer = answer WHERE correct_answer IS NULL;
  END IF;

  -- Add accepted_answers if not exists (alias for answers)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lingo_questions' AND column_name = 'accepted_answers'
  ) THEN
    ALTER TABLE lingo_questions ADD COLUMN accepted_answers TEXT[];
  END IF;

  -- Add matching_pairs if not exists (alias for pairs)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lingo_questions' AND column_name = 'matching_pairs'
  ) THEN
    ALTER TABLE lingo_questions ADD COLUMN matching_pairs JSONB;
    UPDATE lingo_questions SET matching_pairs = pairs WHERE matching_pairs IS NULL AND pairs IS NOT NULL;
  END IF;

  -- Add ordering_items if not exists (alias for steps)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lingo_questions' AND column_name = 'ordering_items'
  ) THEN
    ALTER TABLE lingo_questions ADD COLUMN ordering_items TEXT[];
  END IF;

  -- Add hint column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lingo_questions' AND column_name = 'hint'
  ) THEN
    ALTER TABLE lingo_questions ADD COLUMN hint TEXT;
  END IF;

  -- Add free_response_config column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lingo_questions' AND column_name = 'free_response_config'
  ) THEN
    ALTER TABLE lingo_questions ADD COLUMN free_response_config JSONB;
  END IF;
END $$;
