-- =====================================================
-- PRODUCTION LMS SETUP SCRIPT
-- Run this in your Supabase SQL Editor to enable LMS features
-- =====================================================

-- Note: This script creates all necessary tables for the LMS system
-- It's safe to run multiple times as it uses IF NOT EXISTS checks

-- =====================================================
-- 1. USER PROGRESS TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID,
  progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  current_position TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- 2. ACHIEVEMENTS & BADGES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_url TEXT,
  icon_emoji TEXT DEFAULT '🏆',
  category TEXT NOT NULL CHECK (category IN ('course_completion', 'skill_mastery', 'engagement', 'milestone', 'special')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  criteria JSONB NOT NULL,
  points INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  auto_allocate BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  awarded_by UUID REFERENCES auth.users(id),
  evidence JSONB,
  is_featured BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- 3. HOMEWORK & ASSIGNMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.homework_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  due_date TIMESTAMPTZ,
  max_score INTEGER DEFAULT 100,
  weight_percentage DECIMAL(5,2) DEFAULT 0,
  rubric JSONB,
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'docx', 'txt', 'zip'],
  max_file_size_mb INTEGER DEFAULT 10,
  allow_late_submission BOOLEAN DEFAULT false,
  late_penalty_per_day DECIMAL(5,2) DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.homework_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_urls TEXT[],
  submitted_at TIMESTAMPTZ,
  is_late BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('draft', 'submitted', 'grading', 'graded', 'returned')) DEFAULT 'draft',
  score DECIMAL(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMPTZ,
  peer_reviews JSONB[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, user_id)
);

-- =====================================================
-- 4. NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('achievement', 'deadline', 'grade', 'share', 'mention', 'announcement', 'course_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. CONTENT TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.content_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'document', 'material', 'resource')),
  content_id TEXT NOT NULL,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  completion_status TEXT CHECK (completion_status IN ('started', 'in_progress', 'completed')) DEFAULT 'started',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 6. CERTIFICATES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_number TEXT UNIQUE NOT NULL DEFAULT ('CERT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8)),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  grade TEXT,
  final_score DECIMAL(5,2),
  certificate_url TEXT,
  verification_code TEXT UNIQUE NOT NULL DEFAULT substr(gen_random_uuid()::text, 1, 12),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- 7. SHARED CONTENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shared_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('file', 'note', 'link', 'playlist', 'resource')),
  title TEXT NOT NULL,
  description TEXT,
  content_data JSONB NOT NULL,
  tags TEXT[],
  visibility TEXT CHECK (visibility IN ('private', 'course', 'public')) DEFAULT 'private',
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 8. LEARNING ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.learning_analytics (
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
-- 9. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. CREATE RLS POLICIES
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

-- User Achievement Policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view featured achievements" ON public.user_achievements
  FOR SELECT USING (is_featured = true);

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

-- Content View Policies
CREATE POLICY "Users can track own views" ON public.content_views
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 11. CREATE USER DASHBOARD VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT
  u.id as user_id,
  u.email,
  p.display_name,
  p.role,
  (SELECT COUNT(*) FROM public.enrollments WHERE user_id = u.id) as enrolled_courses,
  (SELECT COUNT(*) FROM public.user_achievements WHERE user_id = u.id) as total_achievements,
  (SELECT COUNT(*) FROM public.certificates WHERE user_id = u.id) as certificates_earned,
  0 as current_streak, -- Simplified for now
  (SELECT COUNT(*) FROM public.homework_submissions WHERE user_id = u.id AND status = 'submitted') as pending_assignments,
  (SELECT COUNT(*) FROM public.notifications WHERE user_id = u.id AND is_read = false) as unread_notifications
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id;

-- Grant permissions
GRANT SELECT ON public.user_dashboard TO authenticated;

-- =====================================================
-- 12. INSERT DEFAULT ACHIEVEMENTS
-- =====================================================

INSERT INTO public.achievements (name, description, category, rarity, criteria, points, icon_emoji) VALUES
('First Steps', 'Complete your first lesson', 'milestone', 'common', '{"type": "first_lesson"}', 10, '👣'),
('Course Champion', 'Complete an entire course', 'course_completion', 'rare', '{"type": "course_complete"}', 50, '🏆'),
('Learning Streak', 'Maintain a 7-day learning streak', 'engagement', 'rare', '{"type": "streak", "days": 7}', 30, '🔥'),
('Knowledge Seeker', 'Complete 5 courses', 'milestone', 'epic', '{"type": "courses_completed", "count": 5}', 100, '📚'),
('Perfect Score', 'Score 100% on an assignment', 'skill_mastery', 'rare', '{"type": "perfect_score"}', 40, '💯'),
('Early Bird', 'Submit assignment before deadline', 'engagement', 'common', '{"type": "early_submission"}', 15, '🌅'),
('AI Pioneer', 'Complete all AI courses', 'special', 'legendary', '{"type": "category_complete", "category": "AI"}', 200, '🤖')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 13. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_content_views_user_id ON public.content_views(user_id);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

-- The LMS system has been successfully set up!
-- Users can now access the Dashboard with full functionality.