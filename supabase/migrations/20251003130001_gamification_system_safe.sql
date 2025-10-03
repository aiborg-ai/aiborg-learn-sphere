-- Gamification System Migration (SAFE VERSION)
-- AIBORG Points, Quizzes, Exercises, Workshops, Badges
-- This version uses IF NOT EXISTS to avoid conflicts

-- =====================================================
-- 1. AIBORG POINTS SYSTEM
-- =====================================================

-- User points tracking and leveling
CREATE TABLE IF NOT EXISTS public.user_aiborg_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  level_progress DECIMAL(5,2) DEFAULT 0 CHECK (level_progress >= 0 AND level_progress <= 100),
  rank TEXT DEFAULT 'AI Newbie',
  points_this_week INTEGER DEFAULT 0,
  points_this_month INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Points transaction history (audit log)
CREATE TABLE IF NOT EXISTS public.aiborg_points_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('quiz', 'exercise', 'workshop', 'assessment', 'streak', 'achievement', 'bonus')),
  source_id UUID,
  description TEXT NOT NULL,
  metadata JSONB,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_points_history_user ON public.aiborg_points_history(user_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_source ON public.aiborg_points_history(source_type, source_id);

-- =====================================================
-- 2. QUIZ SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  time_limit_minutes INTEGER,
  passing_score_percentage DECIMAL(5,2) DEFAULT 70 CHECK (passing_score_percentage >= 0 AND passing_score_percentage <= 100),
  max_attempts INTEGER DEFAULT 3,
  points_reward INTEGER DEFAULT 50 CHECK (points_reward >= 0),
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'short_answer')),
  points_value INTEGER DEFAULT 10 CHECK (points_value >= 0),
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_question_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  score_earned DECIMAL(5,2) DEFAULT 0,
  score_percentage DECIMAL(5,2) DEFAULT 0,
  passed BOOLEAN,
  points_awarded INTEGER DEFAULT 0,
  answers JSONB,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id, is_published);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id, order_index);

-- =====================================================
-- 3. EXERCISE SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  estimated_time_minutes INTEGER,
  rubric JSONB,
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'docx', 'txt', 'zip', 'py', 'js', 'java', 'cpp'],
  max_file_size_mb INTEGER DEFAULT 25,
  points_reward INTEGER DEFAULT 100 CHECK (points_reward >= 0),
  auto_grade BOOLEAN DEFAULT false,
  test_cases JSONB,
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exercise_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_urls TEXT[],
  code_content TEXT,
  programming_language TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('draft', 'submitted', 'grading', 'graded', 'returned')) DEFAULT 'draft',
  score_earned DECIMAL(5,2),
  score_percentage DECIMAL(5,2),
  passed BOOLEAN,
  points_awarded INTEGER DEFAULT 0,
  feedback TEXT,
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMPTZ,
  auto_grade_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_course ON public.exercises(course_id, is_published);
CREATE INDEX IF NOT EXISTS idx_exercise_submissions_user ON public.exercise_submissions(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_submissions_status ON public.exercise_submissions(status, graded_at);

-- =====================================================
-- 4. WORKSHOP SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objectives TEXT[],
  problem_statement TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  max_participants INTEGER DEFAULT 30,
  min_group_size INTEGER DEFAULT 3,
  max_group_size INTEGER DEFAULT 5,
  points_reward INTEGER DEFAULT 200 CHECK (points_reward >= 0),
  leader_bonus_points INTEGER DEFAULT 50,
  current_phase TEXT CHECK (current_phase IN ('setup', 'problem_statement', 'solving', 'reporting', 'completed')) DEFAULT 'setup',
  phase_start_time TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT false,
  facilitator_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workshop_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workshop_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.workshop_groups(id),
  role TEXT CHECK (role IN ('participant', 'leader', 'facilitator')) DEFAULT 'participant',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  feedback_given TEXT,
  UNIQUE(workshop_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.workshop_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.workshop_groups(id),
  phase TEXT NOT NULL CHECK (phase IN ('problem_statement', 'solving', 'reporting')),
  content TEXT NOT NULL,
  attachments TEXT[],
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT false,
  reviewer_feedback TEXT,
  UNIQUE(workshop_id, group_id, phase)
);

CREATE TABLE IF NOT EXISTS public.workshop_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.workshop_groups(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'file', 'system')) DEFAULT 'text',
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workshops_course ON public.workshops(course_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_user ON public.workshop_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_messages_group ON public.workshop_messages(group_id, created_at);

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION award_aiborg_points(
  p_user_id UUID,
  p_points INTEGER,
  p_source_type TEXT,
  p_source_id UUID,
  p_description TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.aiborg_points_history (
    user_id, points_earned, source_type, source_id, description
  ) VALUES (
    p_user_id, p_points, p_source_type, p_source_id, p_description
  );

  INSERT INTO public.user_aiborg_points (user_id, total_points, last_activity_date)
  VALUES (p_user_id, p_points, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_aiborg_points.total_points + p_points,
    points_this_week = user_aiborg_points.points_this_week + p_points,
    points_this_month = user_aiborg_points.points_this_month + p_points,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_level(p_total_points INTEGER)
RETURNS TABLE (
  level INTEGER,
  rank TEXT,
  min_points INTEGER,
  max_points INTEGER,
  next_level_points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN p_total_points < 100 THEN 1
      WHEN p_total_points < 500 THEN 2
      WHEN p_total_points < 1000 THEN 3
      WHEN p_total_points < 2500 THEN 4
      WHEN p_total_points < 5000 THEN 5
      WHEN p_total_points < 10000 THEN 6
      ELSE 7
    END,
    CASE
      WHEN p_total_points < 100 THEN 'AI Newbie'
      WHEN p_total_points < 500 THEN 'AI Explorer'
      WHEN p_total_points < 1000 THEN 'AI Apprentice'
      WHEN p_total_points < 2500 THEN 'AI Practitioner'
      WHEN p_total_points < 5000 THEN 'Augmented Human'
      WHEN p_total_points < 10000 THEN 'AIBORG'
      ELSE 'AIBORG Master'
    END,
    CASE
      WHEN p_total_points < 100 THEN 0
      WHEN p_total_points < 500 THEN 100
      WHEN p_total_points < 1000 THEN 500
      WHEN p_total_points < 2500 THEN 1000
      WHEN p_total_points < 5000 THEN 2500
      WHEN p_total_points < 10000 THEN 5000
      ELSE 10000
    END,
    CASE
      WHEN p_total_points < 100 THEN 99
      WHEN p_total_points < 500 THEN 499
      WHEN p_total_points < 1000 THEN 999
      WHEN p_total_points < 2500 THEN 2499
      WHEN p_total_points < 5000 THEN 4999
      WHEN p_total_points < 10000 THEN 9999
      ELSE 99999
    END,
    CASE
      WHEN p_total_points < 100 THEN 100
      WHEN p_total_points < 500 THEN 500
      WHEN p_total_points < 1000 THEN 1000
      WHEN p_total_points < 2500 THEN 2500
      WHEN p_total_points < 5000 THEN 5000
      WHEN p_total_points < 10000 THEN 10000
      ELSE NULL
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 6. RLS POLICIES (with DROP IF EXISTS)
-- =====================================================

ALTER TABLE public.user_aiborg_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aiborg_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own points" ON public.user_aiborg_points;
  DROP POLICY IF EXISTS "Users can view their own points history" ON public.aiborg_points_history;
  DROP POLICY IF EXISTS "Anyone can view published quizzes" ON public.quizzes;
  DROP POLICY IF EXISTS "Users can view quiz questions for published quizzes" ON public.quiz_questions;
  DROP POLICY IF EXISTS "Users can view quiz options for questions" ON public.quiz_question_options;
  DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON public.quiz_attempts;
  DROP POLICY IF EXISTS "Users can insert their own quiz attempts" ON public.quiz_attempts;
  DROP POLICY IF EXISTS "Users can update their own quiz attempts" ON public.quiz_attempts;
  DROP POLICY IF EXISTS "Anyone can view published exercises" ON public.exercises;
  DROP POLICY IF EXISTS "Users can view their own exercise submissions" ON public.exercise_submissions;
  DROP POLICY IF EXISTS "Users can insert their own exercise submissions" ON public.exercise_submissions;
  DROP POLICY IF EXISTS "Users can update their own exercise submissions" ON public.exercise_submissions;
  DROP POLICY IF EXISTS "Anyone can view published workshops" ON public.workshops;
  DROP POLICY IF EXISTS "Users can view workshop groups they're in" ON public.workshop_groups;
  DROP POLICY IF EXISTS "Users can view their own workshop participations" ON public.workshop_participants;
  DROP POLICY IF EXISTS "Users can insert themselves as workshop participants" ON public.workshop_participants;
  DROP POLICY IF EXISTS "Users can view submissions from their group" ON public.workshop_submissions;
  DROP POLICY IF EXISTS "Users can insert submissions for their group" ON public.workshop_submissions;
  DROP POLICY IF EXISTS "Users can view messages in their workshops" ON public.workshop_messages;
  DROP POLICY IF EXISTS "Users can insert messages in their workshops" ON public.workshop_messages;
END $$;

-- Create policies
CREATE POLICY "Users can view their own points" ON public.user_aiborg_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own points history" ON public.aiborg_points_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view published quizzes" ON public.quizzes FOR SELECT USING (is_published = true);
CREATE POLICY "Users can view quiz questions for published quizzes" ON public.quiz_questions FOR SELECT USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND is_published = true));
CREATE POLICY "Users can view quiz options for questions" ON public.quiz_question_options FOR SELECT USING (EXISTS (SELECT 1 FROM public.quiz_questions q JOIN public.quizzes qz ON q.quiz_id = qz.id WHERE q.id = question_id AND qz.is_published = true));
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quiz attempts" ON public.quiz_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view published exercises" ON public.exercises FOR SELECT USING (is_published = true);
CREATE POLICY "Users can view their own exercise submissions" ON public.exercise_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exercise submissions" ON public.exercise_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exercise submissions" ON public.exercise_submissions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view published workshops" ON public.workshops FOR SELECT USING (is_published = true);
CREATE POLICY "Users can view workshop groups they're in" ON public.workshop_groups FOR SELECT USING (EXISTS (SELECT 1 FROM public.workshop_participants WHERE group_id = workshop_groups.id AND user_id = auth.uid()));
CREATE POLICY "Users can view their own workshop participations" ON public.workshop_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert themselves as workshop participants" ON public.workshop_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view submissions from their group" ON public.workshop_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.workshop_participants WHERE group_id = workshop_submissions.group_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert submissions for their group" ON public.workshop_submissions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workshop_participants WHERE group_id = workshop_submissions.group_id AND user_id = auth.uid()));
CREATE POLICY "Users can view messages in their workshops" ON public.workshop_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.workshop_participants WHERE workshop_id = workshop_messages.workshop_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert messages in their workshops" ON public.workshop_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.workshop_participants WHERE workshop_id = workshop_messages.workshop_id AND user_id = auth.uid()));
