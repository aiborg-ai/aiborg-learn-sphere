-- =====================================================
-- QUIZZES, EXERCISES & WORKSHOPS SYSTEM
-- Migration: 20251013000000
-- Description: Comprehensive system for quizzes, exercises, and collaborative workshops
-- =====================================================

-- =====================================================
-- QUIZZES SYSTEM
-- =====================================================

-- Quiz banks for organizing quizzes by course
CREATE TABLE public.quiz_banks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'module_quiz', 'practice', 'final', 'pop_quiz'
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'intermediate',
  is_published BOOLEAN DEFAULT false,
  pass_percentage DECIMAL(5,2) DEFAULT 70.00, -- Minimum score to pass
  time_limit_minutes INTEGER, -- NULL = no time limit
  max_attempts INTEGER DEFAULT 3, -- NULL = unlimited
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT true, -- Show after submission
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_bank_id UUID NOT NULL REFERENCES public.quiz_banks(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'matching', 'fill_blank')) DEFAULT 'multiple_choice',
  points INTEGER DEFAULT 1,
  explanation TEXT, -- Shown after answer
  order_index INTEGER DEFAULT 0,
  media_url TEXT, -- Optional image/video
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quiz question options (for multiple choice, true/false)
CREATE TABLE public.quiz_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quiz attempts by students
CREATE TABLE public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_bank_id UUID NOT NULL REFERENCES public.quiz_banks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  time_taken_seconds INTEGER,
  score DECIMAL(5,2),
  total_points INTEGER,
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timed_out')) DEFAULT 'in_progress',
  answers JSONB, -- Store all answers {question_id: selected_option_id or answer_text}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quiz responses (individual answers)
CREATE TABLE public.quiz_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.quiz_options(id),
  answer_text TEXT, -- For short answer/fill in blank
  is_correct BOOLEAN,
  points_earned DECIMAL(5,2),
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- =====================================================
-- EXERCISES SYSTEM (Enhanced from homework)
-- =====================================================

-- Exercises (distinct from homework - more self-paced, practice-oriented)
CREATE TABLE public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'intermediate',
  estimated_time_minutes INTEGER,
  exercise_type TEXT CHECK (exercise_type IN ('coding', 'writing', 'analysis', 'design', 'research', 'project')) DEFAULT 'writing',
  points_reward INTEGER DEFAULT 10, -- Aiborg points for completion
  starter_code TEXT, -- For coding exercises
  test_cases JSONB, -- Automated test cases for coding exercises
  rubric JSONB, -- Grading criteria
  required_files TEXT[], -- Required file types
  max_file_size_mb INTEGER DEFAULT 25,
  is_published BOOLEAN DEFAULT false,
  submission_required BOOLEAN DEFAULT true,
  peer_review_enabled BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exercise submissions
CREATE TABLE public.exercise_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_text TEXT,
  code_submission TEXT, -- For coding exercises
  file_urls TEXT[],
  github_repo_url TEXT, -- For project exercises
  submitted_at TIMESTAMPTZ DEFAULT now(),
  status TEXT CHECK (status IN ('draft', 'submitted', 'under_review', 'passed', 'needs_revision', 'completed')) DEFAULT 'draft',
  score DECIMAL(5,2),
  test_results JSONB, -- Automated test results
  feedback TEXT,
  points_earned INTEGER, -- Aiborg points earned
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMPTZ,
  revision_count INTEGER DEFAULT 0,
  peer_review_data JSONB, -- Store peer review information
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exercise_id, user_id)
);

-- =====================================================
-- WORKSHOPS SYSTEM (Group Collaborative Sessions)
-- =====================================================

-- Workshop definitions
CREATE TABLE public.workshops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objectives TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'intermediate',
  duration_minutes INTEGER DEFAULT 120,
  min_participants INTEGER DEFAULT 2,
  max_participants INTEGER DEFAULT 6,
  points_reward INTEGER DEFAULT 50, -- Aiborg points for completion

  -- Workshop stages configuration
  setup_instructions TEXT,
  setup_duration_minutes INTEGER DEFAULT 15,
  problem_statement TEXT NOT NULL,
  problem_duration_minutes INTEGER DEFAULT 30,
  solving_instructions TEXT,
  solving_duration_minutes INTEGER DEFAULT 60,
  reporting_instructions TEXT,
  reporting_duration_minutes INTEGER DEFAULT 15,

  -- Materials and resources
  materials JSONB, -- Links, files, references
  tools_required TEXT[],
  prerequisites TEXT[],

  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workshop sessions (scheduled instances)
CREATE TABLE public.workshop_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  session_name TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  current_stage TEXT CHECK (current_stage IN ('setup', 'problem_statement', 'solving', 'reporting', 'completed')) DEFAULT 'setup',
  stage_started_at TIMESTAMPTZ,

  -- Session configuration
  facilitator_id UUID REFERENCES auth.users(id),
  max_participants INTEGER DEFAULT 6,
  is_open_enrollment BOOLEAN DEFAULT true,
  meeting_link TEXT, -- Video conference link
  meeting_password TEXT,

  -- Session data
  workspace JSONB, -- Real-time collaboration data
  shared_notes TEXT,
  deliverables JSONB, -- Files, links, results

  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workshop participants
CREATE TABLE public.workshop_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.workshop_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('participant', 'facilitator', 'observer')) DEFAULT 'participant',
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,
  contribution_score INTEGER, -- Peer-rated contribution
  attendance_status TEXT CHECK (attendance_status IN ('registered', 'attended', 'absent', 'cancelled')) DEFAULT 'registered',
  points_earned INTEGER, -- Aiborg points earned
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Workshop stage submissions (per team/group)
CREATE TABLE public.workshop_stage_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.workshop_sessions(id) ON DELETE CASCADE,
  stage TEXT CHECK (stage IN ('setup', 'problem_statement', 'solving', 'reporting')) NOT NULL,
  content TEXT,
  attachments TEXT[],
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Real-time workshop activities (for collaboration tracking)
CREATE TABLE public.workshop_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.workshop_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT CHECK (activity_type IN ('join', 'leave', 'stage_change', 'message', 'file_upload', 'contribution')) NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- GAMIFICATION INTEGRATION
-- =====================================================

-- Track points earned from quizzes, exercises, workshops
CREATE TABLE public.learning_activity_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('quiz', 'exercise', 'workshop')) NOT NULL,
  activity_id UUID NOT NULL, -- quiz_attempt_id, exercise_submission_id, or workshop_session_id
  points_earned INTEGER NOT NULL,
  bonus_multiplier DECIMAL(3,2) DEFAULT 1.00,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Quiz indexes
CREATE INDEX idx_quiz_banks_course_id ON public.quiz_banks(course_id);
CREATE INDEX idx_quiz_questions_quiz_bank_id ON public.quiz_questions(quiz_bank_id);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_bank_id ON public.quiz_attempts(quiz_bank_id);
CREATE INDEX idx_quiz_attempts_status ON public.quiz_attempts(status);

-- Exercise indexes
CREATE INDEX idx_exercises_course_id ON public.exercises(course_id);
CREATE INDEX idx_exercise_submissions_user_id ON public.exercise_submissions(user_id);
CREATE INDEX idx_exercise_submissions_exercise_id ON public.exercise_submissions(exercise_id);
CREATE INDEX idx_exercise_submissions_status ON public.exercise_submissions(status);

-- Workshop indexes
CREATE INDEX idx_workshops_course_id ON public.workshops(course_id);
CREATE INDEX idx_workshop_sessions_workshop_id ON public.workshop_sessions(workshop_id);
CREATE INDEX idx_workshop_sessions_scheduled_start ON public.workshop_sessions(scheduled_start);
CREATE INDEX idx_workshop_sessions_status ON public.workshop_sessions(status);
CREATE INDEX idx_workshop_participants_user_id ON public.workshop_participants(user_id);
CREATE INDEX idx_workshop_participants_session_id ON public.workshop_participants(session_id);

-- Activity points indexes
CREATE INDEX idx_learning_activity_points_user_id ON public.learning_activity_points(user_id);
CREATE INDEX idx_learning_activity_points_activity_type ON public.learning_activity_points(activity_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.quiz_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_stage_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activity_points ENABLE ROW LEVEL SECURITY;

-- Quiz Policies
CREATE POLICY "Enrolled users can view published quizzes"
ON public.quiz_banks FOR SELECT
USING (
  is_published = true AND EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = auth.uid() AND course_id = quiz_banks.course_id
  )
);

CREATE POLICY "Instructors can manage course quizzes"
ON public.quiz_banks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = quiz_banks.course_id
    AND (p.role = 'instructor' OR p.role = 'admin')
  )
);

CREATE POLICY "Users can view quiz questions when taking quiz"
ON public.quiz_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_banks qb
    JOIN public.enrollments e ON e.course_id = qb.course_id
    WHERE qb.id = quiz_questions.quiz_bank_id
    AND e.user_id = auth.uid()
    AND qb.is_published = true
  )
);

CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own in-progress attempts"
ON public.quiz_attempts FOR UPDATE
USING (user_id = auth.uid() AND status = 'in_progress');

-- Exercise Policies
CREATE POLICY "Enrolled users can view published exercises"
ON public.exercises FOR SELECT
USING (
  is_published = true AND EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = auth.uid() AND course_id = exercises.course_id
  )
);

CREATE POLICY "Instructors can manage course exercises"
ON public.exercises FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = exercises.course_id
    AND (p.role = 'instructor' OR p.role = 'admin')
  )
);

CREATE POLICY "Users can view their own exercise submissions"
ON public.exercise_submissions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create exercise submissions"
ON public.exercise_submissions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own draft submissions"
ON public.exercise_submissions FOR UPDATE
USING (user_id = auth.uid() AND status IN ('draft', 'needs_revision'));

-- Workshop Policies
CREATE POLICY "Enrolled users can view published workshops"
ON public.workshops FOR SELECT
USING (
  is_published = true AND EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = auth.uid() AND course_id = workshops.course_id
  )
);

CREATE POLICY "Instructors can manage course workshops"
ON public.workshops FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = workshops.course_id
    AND (p.role = 'instructor' OR p.role = 'admin')
  )
);

CREATE POLICY "Enrolled users can view workshop sessions"
ON public.workshop_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workshops w
    JOIN public.enrollments e ON e.course_id = w.course_id
    WHERE w.id = workshop_sessions.workshop_id
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Participants can view their workshop participation"
ON public.workshop_participants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can join workshops"
ON public.workshop_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Participants can view session activities"
ON public.workshop_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workshop_participants
    WHERE session_id = workshop_activities.session_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own activity points"
ON public.learning_activity_points FOR SELECT
USING (user_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can manage all quiz content"
ON public.quiz_banks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage all exercises"
ON public.exercises FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage all workshops"
ON public.workshops FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamps trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_quiz_banks_updated_at BEFORE UPDATE ON public.quiz_banks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_submissions_updated_at BEFORE UPDATE ON public.exercise_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON public.workshops
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workshop_sessions_updated_at BEFORE UPDATE ON public.workshop_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate quiz score automatically
CREATE OR REPLACE FUNCTION calculate_quiz_score(attempt_id_param UUID)
RETURNS void AS $$
DECLARE
  total_pts INTEGER;
  earned_pts DECIMAL(5,2);
  percentage_val DECIMAL(5,2);
  pass_pct DECIMAL(5,2);
  quiz_id UUID;
BEGIN
  -- Get quiz bank ID and pass percentage
  SELECT qb.id, qb.pass_percentage INTO quiz_id, pass_pct
  FROM public.quiz_attempts qa
  JOIN public.quiz_banks qb ON qb.id = qa.quiz_bank_id
  WHERE qa.id = attempt_id_param;

  -- Calculate total possible points
  SELECT COALESCE(SUM(points), 0) INTO total_pts
  FROM public.quiz_questions
  WHERE quiz_bank_id = quiz_id;

  -- Calculate earned points
  SELECT COALESCE(SUM(points_earned), 0) INTO earned_pts
  FROM public.quiz_responses
  WHERE attempt_id = attempt_id_param;

  -- Calculate percentage
  IF total_pts > 0 THEN
    percentage_val := (earned_pts / total_pts) * 100;
  ELSE
    percentage_val := 0;
  END IF;

  -- Update attempt with results
  UPDATE public.quiz_attempts
  SET
    score = earned_pts,
    total_points = total_pts,
    percentage = percentage_val,
    passed = (percentage_val >= pass_pct),
    completed_at = now(),
    status = 'completed'
  WHERE id = attempt_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Award points for completed activities
CREATE OR REPLACE FUNCTION award_activity_points(
  user_id_param UUID,
  activity_type_param TEXT,
  activity_id_param UUID,
  points_param INTEGER,
  reason_param TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.learning_activity_points (
    user_id,
    activity_type,
    activity_id,
    points_earned,
    reason
  ) VALUES (
    user_id_param,
    activity_type_param,
    activity_id_param,
    points_param,
    reason_param
  );

  -- Update user's total points (assumes user_points table exists)
  -- This can be customized based on your gamification system
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.quiz_banks IS 'Quiz collections organized by course';
COMMENT ON TABLE public.quiz_questions IS 'Individual quiz questions with multiple types';
COMMENT ON TABLE public.quiz_attempts IS 'Student quiz attempts with scores and status';
COMMENT ON TABLE public.exercises IS 'Self-paced practice exercises for skill development';
COMMENT ON TABLE public.exercise_submissions IS 'Student exercise submissions with grading';
COMMENT ON TABLE public.workshops IS 'Group collaborative workshop definitions';
COMMENT ON TABLE public.workshop_sessions IS 'Scheduled workshop instances with real-time collaboration';
COMMENT ON TABLE public.workshop_participants IS 'Workshop session participants and their roles';
COMMENT ON TABLE public.learning_activity_points IS 'Gamification points earned from learning activities';

-- Migration complete
