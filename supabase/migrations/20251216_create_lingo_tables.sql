-- AIBORGLingo Tables Migration
-- Creates tables for lesson management, questions, user progress, and analytics

-- ============================================================================
-- Table 1: lingo_lessons
-- Stores lesson metadata (title, skill, duration, XP reward)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lingo_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  skill TEXT NOT NULL,
  duration TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 35,
  description TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_lingo_lessons_active ON lingo_lessons(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_lingo_lessons_skill ON lingo_lessons(skill);

-- ============================================================================
-- Table 2: lingo_questions
-- Stores questions with type-specific fields (JSONB for flexibility)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lingo_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lingo_lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'fill_blank', 'matching', 'ordering', 'free_response')),
  prompt TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,

  -- Type-specific fields (nullable based on type)
  options JSONB,
  answer TEXT,
  answers JSONB,
  pairs JSONB,
  steps JSONB,
  ideal_answer TEXT,
  rubric TEXT,
  strictness DECIMAL DEFAULT 0.7,
  pass_score DECIMAL DEFAULT 0.65,

  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching questions by lesson
CREATE INDEX IF NOT EXISTS idx_lingo_questions_lesson ON lingo_questions(lesson_id, sort_order);

-- ============================================================================
-- Table 3: lingo_user_progress
-- Stores user gamification stats and lesson progress
-- ============================================================================
CREATE TABLE IF NOT EXISTS lingo_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Gamification stats
  xp_today INTEGER DEFAULT 0,
  daily_goal INTEGER DEFAULT 50,
  hearts INTEGER DEFAULT 5,
  streak INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  last_session_date DATE DEFAULT CURRENT_DATE,

  -- Lesson progress stored as JSON for flexibility
  lesson_progress JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_lingo_user_progress_user ON lingo_user_progress(user_id);

-- ============================================================================
-- Table 4: lingo_analytics
-- Stores analytics events for tracking user engagement
-- ============================================================================
CREATE TABLE IF NOT EXISTS lingo_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lingo_lessons(id) ON DELETE SET NULL,
  question_id UUID REFERENCES lingo_questions(id) ON DELETE SET NULL,

  -- Anonymous session tracking for non-logged-in users
  session_id TEXT,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'lesson_started',
    'lesson_completed',
    'question_answered',
    'xp_earned',
    'heart_lost',
    'streak_updated'
  )),
  event_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_lingo_analytics_event ON lingo_analytics(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_lingo_analytics_lesson ON lingo_analytics(lesson_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lingo_analytics_user ON lingo_analytics(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lingo_analytics_session ON lingo_analytics(session_id, created_at);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE lingo_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lingo_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lingo_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lingo_analytics ENABLE ROW LEVEL SECURITY;

-- Lessons: Public read, admin write
CREATE POLICY "Lessons are viewable by everyone"
  ON lingo_lessons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage lessons"
  ON lingo_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Questions: Public read (for active lessons), admin write
CREATE POLICY "Questions are viewable for active lessons"
  ON lingo_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lingo_lessons
      WHERE lingo_lessons.id = lingo_questions.lesson_id
      AND lingo_lessons.is_active = true
    )
  );

CREATE POLICY "Admins can manage questions"
  ON lingo_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- User Progress: Users can only access their own progress
CREATE POLICY "Users can view own progress"
  ON lingo_user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON lingo_user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON lingo_user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON lingo_user_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Analytics: Anyone can insert (for anonymous tracking), admins can read all
CREATE POLICY "Anyone can insert analytics"
  ON lingo_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own analytics"
  ON lingo_analytics FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all analytics"
  ON lingo_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lingo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER lingo_lessons_updated_at
  BEFORE UPDATE ON lingo_lessons
  FOR EACH ROW EXECUTE FUNCTION update_lingo_updated_at();

CREATE TRIGGER lingo_questions_updated_at
  BEFORE UPDATE ON lingo_questions
  FOR EACH ROW EXECUTE FUNCTION update_lingo_updated_at();

CREATE TRIGGER lingo_user_progress_updated_at
  BEFORE UPDATE ON lingo_user_progress
  FOR EACH ROW EXECUTE FUNCTION update_lingo_updated_at();

-- ============================================================================
-- Views for Analytics Dashboard
-- ============================================================================

-- View: Lesson statistics
CREATE OR REPLACE VIEW lingo_lesson_stats AS
SELECT
  l.id,
  l.lesson_id,
  l.title,
  l.skill,
  l.xp_reward,
  COUNT(DISTINCT q.id) AS question_count,
  COUNT(DISTINCT CASE WHEN a.event_type = 'lesson_started' THEN COALESCE(a.user_id::text, a.session_id) END) AS starts,
  COUNT(DISTINCT CASE WHEN a.event_type = 'lesson_completed' THEN COALESCE(a.user_id::text, a.session_id) END) AS completions
FROM lingo_lessons l
LEFT JOIN lingo_questions q ON q.lesson_id = l.id
LEFT JOIN lingo_analytics a ON a.lesson_id = l.id
GROUP BY l.id, l.lesson_id, l.title, l.skill, l.xp_reward;

-- View: Daily analytics summary
CREATE OR REPLACE VIEW lingo_daily_stats AS
SELECT
  DATE(created_at) AS date,
  COUNT(DISTINCT CASE WHEN event_type = 'lesson_started' THEN COALESCE(user_id::text, session_id) END) AS unique_users,
  COUNT(CASE WHEN event_type = 'lesson_started' THEN 1 END) AS lessons_started,
  COUNT(CASE WHEN event_type = 'lesson_completed' THEN 1 END) AS lessons_completed,
  COUNT(CASE WHEN event_type = 'question_answered' THEN 1 END) AS questions_answered,
  SUM(CASE WHEN event_type = 'xp_earned' THEN (event_data->>'xp')::integer ELSE 0 END) AS total_xp_earned
FROM lingo_analytics
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant access to views
GRANT SELECT ON lingo_lesson_stats TO authenticated;
GRANT SELECT ON lingo_daily_stats TO authenticated;
