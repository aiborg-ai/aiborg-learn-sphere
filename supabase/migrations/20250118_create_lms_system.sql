-- Comprehensive LMS System Migration
-- This migration creates the complete infrastructure for a world-class Learning Management System

-- =====================================================
-- LEARNING PROGRESS TRACKING
-- =====================================================

-- Track user progress through courses and modules
CREATE TABLE public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID,
  progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  current_position TEXT, -- JSON storing current video position, page number, etc.
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- ACHIEVEMENT & BADGE SYSTEM
-- =====================================================

-- Define achievement badges
CREATE TABLE public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_url TEXT,
  icon_emoji TEXT DEFAULT '🏆',
  category TEXT NOT NULL CHECK (category IN ('course_completion', 'skill_mastery', 'engagement', 'milestone', 'special')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  criteria JSONB NOT NULL, -- Stores conditions for automatic allocation
  points INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  auto_allocate BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track user achievements
CREATE TABLE public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  awarded_by UUID REFERENCES auth.users(id), -- Admin who manually awarded it
  evidence JSONB, -- Stores proof of achievement (course_id, score, etc.)
  is_featured BOOLEAN DEFAULT false, -- User can feature this on profile
  UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- LEARNING PATHS
-- =====================================================

-- Define curated learning paths
CREATE TABLE public.learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  thumbnail_url TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_hours INTEGER,
  prerequisites TEXT[],
  outcomes TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Courses in learning paths
CREATE TABLE public.learning_path_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  UNIQUE(learning_path_id, course_id)
);

-- User enrollment in learning paths
CREATE TABLE public.user_learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  current_course_index INTEGER DEFAULT 0,
  UNIQUE(user_id, learning_path_id)
);

-- =====================================================
-- HOMEWORK & ASSIGNMENTS
-- =====================================================

-- Define homework assignments
CREATE TABLE public.homework_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  due_date TIMESTAMPTZ,
  max_score INTEGER DEFAULT 100,
  weight_percentage DECIMAL(5,2) DEFAULT 0, -- Weight in final grade
  rubric JSONB, -- Detailed grading criteria
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'docx', 'txt', 'zip'],
  max_file_size_mb INTEGER DEFAULT 10,
  allow_late_submission BOOLEAN DEFAULT false,
  late_penalty_per_day DECIMAL(5,2) DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student homework submissions
CREATE TABLE public.homework_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.homework_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_urls TEXT[],
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_late BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('draft', 'submitted', 'grading', 'graded', 'returned')) DEFAULT 'draft',
  score DECIMAL(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMPTZ,
  peer_reviews JSONB[], -- For peer review assignments
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, user_id)
);

-- =====================================================
-- CONTENT SHARING & COLLABORATION
-- =====================================================

-- Shared content between users
CREATE TABLE public.shared_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('file', 'note', 'link', 'playlist', 'resource')),
  title TEXT NOT NULL,
  description TEXT,
  content_data JSONB NOT NULL, -- Stores file_url, text content, links, etc.
  tags TEXT[],
  visibility TEXT CHECK (visibility IN ('private', 'course', 'public')) DEFAULT 'private',
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE, -- Optional course association
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content sharing permissions
CREATE TABLE public.content_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.shared_content(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('view', 'edit', 'manage')) DEFAULT 'view',
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  CHECK (
    (shared_with_user_id IS NOT NULL AND shared_with_course_id IS NULL) OR
    (shared_with_user_id IS NULL AND shared_with_course_id IS NOT NULL)
  )
);

-- =====================================================
-- DISCUSSION FORUMS
-- =====================================================

-- Course discussion threads
CREATE TABLE public.discussion_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('general', 'homework', 'resources', 'help', 'announcements')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Discussion posts
CREATE TABLE public.discussion_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_answer BOOLEAN DEFAULT false, -- For Q&A threads
  likes_count INTEGER DEFAULT 0,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- User notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('achievement', 'deadline', 'grade', 'share', 'mention', 'announcement', 'course_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data (achievement_id, assignment_id, etc.)
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- CONTENT VIEWING ANALYTICS
-- =====================================================

-- Track video/content viewing
CREATE TABLE public.content_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'document', 'material', 'resource')),
  content_id TEXT NOT NULL, -- Can be material_id, video_id, etc.
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  completion_status TEXT CHECK (completion_status IN ('started', 'in_progress', 'completed')) DEFAULT 'started',
  metadata JSONB, -- Store additional viewing data
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- LEARNING ANALYTICS
-- =====================================================

-- Detailed learning analytics
CREATE TABLE public.learning_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('daily_time', 'quiz_score', 'assignment_score', 'engagement', 'streak')),
  metric_value DECIMAL(10,2) NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, metric_type, metric_date)
);

-- =====================================================
-- CERTIFICATES
-- =====================================================

-- Course completion certificates
CREATE TABLE public.certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_number TEXT UNIQUE NOT NULL DEFAULT ('CERT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8)),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  grade TEXT,
  final_score DECIMAL(5,2),
  certificate_url TEXT,
  verification_code TEXT UNIQUE NOT NULL DEFAULT substr(gen_random_uuid()::text, 1, 12),
  metadata JSONB, -- Additional certificate data
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- STUDY GROUPS
-- =====================================================

-- Study groups for collaborative learning
CREATE TABLE public.study_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Study group members
CREATE TABLE public.study_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'moderator', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_course_id ON public.user_progress(course_id);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_featured ON public.user_achievements(user_id, is_featured);
CREATE INDEX idx_homework_submissions_user_id ON public.homework_submissions(user_id);
CREATE INDEX idx_homework_submissions_assignment_id ON public.homework_submissions(assignment_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_content_views_user_id ON public.content_views(user_id);
CREATE INDEX idx_learning_analytics_user_date ON public.learning_analytics(user_id, metric_date);
CREATE INDEX idx_certificates_verification ON public.certificates(verification_code);
CREATE INDEX idx_discussion_threads_course ON public.discussion_threads(course_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- User Progress Policies
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievement Policies
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- User Achievement Policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view featured achievements" ON public.user_achievements
  FOR SELECT USING (is_featured = true);
CREATE POLICY "Admins can manage user achievements" ON public.user_achievements
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Learning Path Policies
CREATE POLICY "Anyone can view published paths" ON public.learning_paths
  FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage paths" ON public.learning_paths
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Homework Assignment Policies
CREATE POLICY "Enrolled users can view assignments" ON public.homework_assignments
  FOR SELECT USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE user_id = auth.uid() AND course_id = homework_assignments.course_id
    )
  );
CREATE POLICY "Admins can manage assignments" ON public.homework_assignments
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Homework Submission Policies
CREATE POLICY "Users can view own submissions" ON public.homework_submissions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit homework" ON public.homework_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON public.homework_submissions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

-- Notification Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Certificate Policies
CREATE POLICY "Users can view own certificates" ON public.certificates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can verify certificates" ON public.certificates
  FOR SELECT USING (true);

-- Discussion Policies
CREATE POLICY "Enrolled users can view discussions" ON public.discussion_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE user_id = auth.uid() AND course_id = discussion_threads.course_id
    )
  );
CREATE POLICY "Enrolled users can create discussions" ON public.discussion_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE user_id = auth.uid() AND course_id = discussion_threads.course_id
    )
  );

-- =====================================================
-- FUNCTIONS FOR AUTOMATIC OPERATIONS
-- =====================================================

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
BEGIN
  -- Check all auto-allocate achievements
  FOR achievement_record IN
    SELECT * FROM public.achievements
    WHERE is_active = true AND auto_allocate = true
  LOOP
    -- Check criteria based on achievement type
    -- This is simplified - expand based on your criteria structure
    IF achievement_record.category = 'course_completion' THEN
      -- Check if user completed a course
      IF NEW.progress_percentage = 100 THEN
        INSERT INTO public.user_achievements (user_id, achievement_id, evidence)
        VALUES (NEW.user_id, achievement_record.id, jsonb_build_object('course_id', NEW.course_id))
        ON CONFLICT DO NOTHING;

        -- Send notification
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (NEW.user_id, 'achievement', 'Achievement Unlocked!',
                'You earned: ' || achievement_record.name,
                jsonb_build_object('achievement_id', achievement_record.id));
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic achievement allocation
CREATE TRIGGER trigger_check_achievements
AFTER INSERT OR UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.check_and_award_achievements();

-- Function to calculate learning streak
CREATE OR REPLACE FUNCTION public.calculate_learning_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  last_date DATE;
  current_date_check DATE;
BEGIN
  SELECT metric_date INTO last_date
  FROM public.learning_analytics
  WHERE user_id = p_user_id
    AND metric_type = 'daily_time'
    AND metric_value > 0
  ORDER BY metric_date DESC
  LIMIT 1;

  IF last_date IS NULL THEN
    RETURN 0;
  END IF;

  current_date_check := last_date;

  WHILE EXISTS (
    SELECT 1 FROM public.learning_analytics
    WHERE user_id = p_user_id
      AND metric_type = 'daily_time'
      AND metric_date = current_date_check
      AND metric_value > 0
  ) LOOP
    streak := streak + 1;
    current_date_check := current_date_check - INTERVAL '1 day';
  END LOOP;

  RETURN streak;
END;
$$ LANGUAGE plpgsql;

-- Function to generate certificate
CREATE OR REPLACE FUNCTION public.generate_certificate(
  p_user_id UUID,
  p_course_id INTEGER
)
RETURNS UUID AS $$
DECLARE
  certificate_id UUID;
  user_score DECIMAL(5,2);
  user_grade TEXT;
BEGIN
  -- Calculate final score from assignments
  SELECT AVG(score) INTO user_score
  FROM public.homework_submissions hs
  JOIN public.homework_assignments ha ON hs.assignment_id = ha.id
  WHERE hs.user_id = p_user_id AND ha.course_id = p_course_id AND hs.status = 'graded';

  -- Determine grade
  IF user_score >= 90 THEN user_grade := 'A';
  ELSIF user_score >= 80 THEN user_grade := 'B';
  ELSIF user_score >= 70 THEN user_grade := 'C';
  ELSIF user_score >= 60 THEN user_grade := 'D';
  ELSE user_grade := 'F';
  END IF;

  -- Create certificate
  INSERT INTO public.certificates (user_id, course_id, grade, final_score)
  VALUES (p_user_id, p_course_id, user_grade, user_score)
  RETURNING id INTO certificate_id;

  -- Mark course as completed
  UPDATE public.user_progress
  SET completed_at = now(), progress_percentage = 100
  WHERE user_id = p_user_id AND course_id = p_course_id;

  RETURN certificate_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR EASIER QUERYING
-- =====================================================

-- User dashboard view
CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT
  u.id as user_id,
  u.email,
  p.display_name,
  p.role,
  (SELECT COUNT(*) FROM public.enrollments WHERE user_id = u.id) as enrolled_courses,
  (SELECT COUNT(*) FROM public.user_achievements WHERE user_id = u.id) as total_achievements,
  (SELECT COUNT(*) FROM public.certificates WHERE user_id = u.id) as certificates_earned,
  (SELECT calculate_learning_streak(u.id)) as current_streak,
  (SELECT COUNT(*) FROM public.homework_submissions WHERE user_id = u.id AND status = 'submitted') as pending_assignments,
  (SELECT COUNT(*) FROM public.notifications WHERE user_id = u.id AND is_read = false) as unread_notifications
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id;

-- Public profile view
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  u.id as user_id,
  p.display_name,
  p.created_at as member_since,
  (SELECT COUNT(*) FROM public.certificates WHERE user_id = u.id) as certificates_earned,
  (SELECT COUNT(*) FROM public.user_achievements WHERE user_id = u.id AND is_featured = true) as featured_achievements,
  (SELECT array_agg(
    jsonb_build_object(
      'name', a.name,
      'description', a.description,
      'icon_emoji', a.icon_emoji,
      'rarity', a.rarity,
      'earned_at', ua.earned_at
    ) ORDER BY ua.earned_at DESC
  ) FROM public.user_achievements ua
    JOIN public.achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = u.id AND ua.is_featured = true
  ) as featured_badges
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id;

-- Grant permissions on views
GRANT SELECT ON public.user_dashboard TO authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- =====================================================
-- INITIAL DATA SEED
-- =====================================================

-- Insert default achievements
INSERT INTO public.achievements (name, description, category, rarity, criteria, points, icon_emoji) VALUES
('First Steps', 'Complete your first lesson', 'milestone', 'common', '{"type": "first_lesson"}', 10, '👣'),
('Course Champion', 'Complete an entire course', 'course_completion', 'rare', '{"type": "course_complete"}', 50, '🏆'),
('Learning Streak', 'Maintain a 7-day learning streak', 'engagement', 'rare', '{"type": "streak", "days": 7}', 30, '🔥'),
('Knowledge Seeker', 'Complete 5 courses', 'milestone', 'epic', '{"type": "courses_completed", "count": 5}', 100, '📚'),
('Perfect Score', 'Score 100% on an assignment', 'skill_mastery', 'rare', '{"type": "perfect_score"}', 40, '💯'),
('Early Bird', 'Submit assignment before deadline', 'engagement', 'common', '{"type": "early_submission"}', 15, '🌅'),
('Collaborative Learner', 'Join a study group', 'engagement', 'common', '{"type": "join_group"}', 20, '🤝'),
('Discussion Leader', 'Create 10 discussion threads', 'engagement', 'epic', '{"type": "discussions_created", "count": 10}', 60, '💬'),
('Video Marathon', 'Watch 10 hours of content', 'engagement', 'rare', '{"type": "watch_time", "hours": 10}', 35, '📺'),
('Certificate Collector', 'Earn 3 certificates', 'milestone', 'epic', '{"type": "certificates", "count": 3}', 80, '📜'),
('AI Pioneer', 'Complete all AI courses', 'special', 'legendary', '{"type": "category_complete", "category": "AI"}', 200, '🤖'),
('Learning Legend', 'Achieve 30-day streak', 'engagement', 'legendary', '{"type": "streak", "days": 30}', 150, '⭐');

-- Add comments for documentation
COMMENT ON TABLE public.user_progress IS 'Tracks user progress through courses and modules';
COMMENT ON TABLE public.achievements IS 'Defines achievement badges that users can earn';
COMMENT ON TABLE public.user_achievements IS 'Records achievements earned by users';
COMMENT ON TABLE public.homework_assignments IS 'Stores homework assignments for courses';
COMMENT ON TABLE public.homework_submissions IS 'Tracks student homework submissions';
COMMENT ON TABLE public.certificates IS 'Stores course completion certificates';
COMMENT ON TABLE public.notifications IS 'User notification system';
COMMENT ON TABLE public.learning_analytics IS 'Detailed learning metrics and analytics';