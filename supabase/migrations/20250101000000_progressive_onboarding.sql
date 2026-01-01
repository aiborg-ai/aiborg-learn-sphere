-- Progressive Onboarding System
-- Tracks which onboarding tips users have seen and their progress through the platform

-- Create user_onboarding_progress table
CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Track which tips have been shown
  completed_tips TEXT[] DEFAULT '{}',

  -- Track major milestones
  has_completed_profile BOOLEAN DEFAULT FALSE,
  has_enrolled_in_course BOOLEAN DEFAULT FALSE,
  has_attended_event BOOLEAN DEFAULT FALSE,
  has_completed_assessment BOOLEAN DEFAULT FALSE,
  has_explored_dashboard BOOLEAN DEFAULT FALSE,
  has_used_ai_chat BOOLEAN DEFAULT FALSE,
  has_created_content BOOLEAN DEFAULT FALSE, -- For admins/instructors

  -- Overall progress
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_skipped BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_onboarding_progress_user_id ON public.user_onboarding_progress(user_id);
CREATE INDEX idx_user_onboarding_progress_completed ON public.user_onboarding_progress(onboarding_completed);

-- Enable RLS
ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own onboarding progress"
  ON public.user_onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
  ON public.user_onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
  ON public.user_onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all onboarding progress
CREATE POLICY "Admins can view all onboarding progress"
  ON public.user_onboarding_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_onboarding_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-set completed_at when onboarding is marked complete
  IF NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE THEN
    NEW.completed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_user_onboarding_progress_timestamp
  BEFORE UPDATE ON public.user_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_progress_updated_at();

-- Function to initialize onboarding for new users
CREATE OR REPLACE FUNCTION initialize_user_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_onboarding_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create onboarding record for new profiles
CREATE TRIGGER on_profile_created_initialize_onboarding
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_onboarding();

-- Create onboarding_tips table for predefined tips
CREATE TABLE IF NOT EXISTS public.onboarding_tips (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_element TEXT, -- CSS selector or component identifier
  placement TEXT DEFAULT 'bottom', -- top, bottom, left, right
  category TEXT NOT NULL, -- dashboard, courses, studio, navigation, etc.
  role TEXT, -- null = all users, 'admin', 'instructor', 'student'
  icon TEXT,
  action_label TEXT DEFAULT 'Got it',
  priority INTEGER DEFAULT 0, -- Higher = shown first
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default onboarding tips
INSERT INTO public.onboarding_tips (id, title, description, target_element, placement, category, role, icon, priority) VALUES
-- Navigation tips
('nav-welcome', 'Welcome to Aiborg Learn Sphere!', 'Your AI-augmented learning platform. Let''s explore key features together.', '.navbar', 'bottom', 'navigation', null, 'Sparkles', 100),
('nav-courses', 'Browse Courses', 'Find and enroll in courses that match your learning goals.', '[href="/courses"]', 'bottom', 'navigation', null, 'BookOpen', 90),
('nav-events', 'Attend Events', 'Join workshops, webinars, and community events.', '[href="/events"]', 'bottom', 'navigation', null, 'Calendar', 85),
('nav-studio', 'Content Studio', 'Create courses, events, blogs, and announcements with AI assistance.', '[href="/studio"]', 'bottom', 'navigation', 'admin', 'Wand2', 95),

-- Dashboard tips
('dashboard-welcome', 'Your Learning Dashboard', 'This is your personalized learning hub. Track progress, view recommendations, and access your courses.', '.dashboard-container', 'top', 'dashboard', null, 'LayoutDashboard', 80),
('dashboard-progress', 'Track Your Progress', 'See your course completion, achievements, and learning velocity.', '.progress-section', 'left', 'dashboard', null, 'TrendingUp', 75),
('dashboard-recommendations', 'AI Recommendations', 'Get personalized course and content recommendations based on your learning patterns.', '.recommendations-section', 'right', 'dashboard', null, 'Brain', 70),

-- Courses tips
('courses-enroll', 'Enroll in a Course', 'Click on any course card to view details and enroll.', '.course-card:first-child', 'top', 'courses', null, 'GraduationCap', 65),
('courses-filter', 'Filter Courses', 'Use filters to find courses by level, category, or mode.', '.course-filters', 'bottom', 'courses', null, 'Filter', 60),

-- Studio tips (admin only)
('studio-create', 'Create Content', 'Use the wizard to create professional content with AI assistance.', '.studio-create-button', 'bottom', 'studio', 'admin', 'Plus', 85),
('studio-wizard', 'Step-by-Step Wizards', 'Our wizards guide you through creating courses, events, blogs, and announcements.', '.asset-type-selector', 'right', 'studio', 'admin', 'Workflow', 80),
('studio-ai', 'AI-Powered Creation', 'Get AI suggestions for titles, descriptions, and content as you create.', '.ai-assist-button', 'top', 'studio', 'admin', 'Sparkles', 75),

-- Profile tips
('profile-complete', 'Complete Your Profile', 'Add your bio, interests, and learning goals for better recommendations.', '.profile-edit-button', 'bottom', 'profile', null, 'UserCircle', 70),
('profile-achievements', 'Unlock Achievements', 'Earn badges and points as you progress through courses.', '.achievements-section', 'left', 'profile', null, 'Award', 65),

-- Assessment tips
('assessment-adaptive', 'Adaptive Assessments', 'Our AI adjusts question difficulty based on your performance.', '.assessment-info', 'top', 'assessment', null, 'Brain', 60),

-- Chat tips
('chat-ai', 'AI Learning Assistant', 'Ask questions and get instant help from our AI chatbot.', '.chatbot-trigger', 'left', 'general', null, 'MessageCircle', 55);

-- Grant permissions
GRANT SELECT ON public.onboarding_tips TO authenticated;

COMMENT ON TABLE public.user_onboarding_progress IS 'Tracks user progress through onboarding and which tips they have seen';
COMMENT ON TABLE public.onboarding_tips IS 'Predefined onboarding tips shown progressively as users explore the platform';
