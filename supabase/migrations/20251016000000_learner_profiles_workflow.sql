-- ===================================================================
-- LEARNER PROFILES & WORKFLOW SYSTEM
-- Creates step-by-step profile creation workflow inspired by appboardguru2
-- ===================================================================

-- ===================================================================
-- 1. LEARNER PROFILES TABLE
-- Named profiles that users can create to organize their learning
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.learner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  description TEXT,

  -- Learning Goals
  learning_goals JSONB DEFAULT '[]'::jsonb,
  target_audience TEXT CHECK (target_audience IN ('professional', 'business', 'student', 'primary', 'secondary')),
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),

  -- Professional Context
  industry TEXT,
  job_role TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  years_experience INTEGER,

  -- Learning Preferences
  preferred_learning_style TEXT CHECK (preferred_learning_style IN ('visual', 'reading', 'hands-on', 'mixed')),
  available_hours_per_week INTEGER DEFAULT 5 CHECK (available_hours_per_week >= 1 AND available_hours_per_week <= 168),
  preferred_schedule JSONB DEFAULT '{}'::jsonb,

  -- Assessment linkage
  latest_assessment_id UUID REFERENCES public.user_ai_assessments(id) ON DELETE SET NULL,
  irt_ability_score DECIMAL(4,2),
  proficiency_areas JSONB DEFAULT '{}'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  -- Metadata
  created_via TEXT DEFAULT 'workflow' CHECK (created_via IN ('workflow', 'quick_create', 'import')),
  workflow_completed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_profile_name_length CHECK (LENGTH(profile_name) >= 3 AND LENGTH(profile_name) <= 100)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_id ON public.learner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_profiles_is_active ON public.learner_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_learner_profiles_is_primary ON public.learner_profiles(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_primary ON public.learner_profiles(user_id, is_primary) WHERE is_primary = true;

COMMENT ON TABLE public.learner_profiles IS
'Named learning profiles for users to organize their learning journey. Users can create multiple profiles for different goals (e.g., Career Switch, Leadership Development).';

-- ===================================================================
-- 2. PROFILE WORKFLOW STEPS TEMPLATE
-- Defines the step-by-step wizard for profile creation
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.profile_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_order INTEGER NOT NULL UNIQUE,
  step_name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  step_type TEXT CHECK (step_type IN ('form', 'assessment', 'selection', 'review')) NOT NULL,

  -- Field definitions and validation
  fields_to_collect JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  is_required BOOLEAN DEFAULT true,
  is_skippable BOOLEAN DEFAULT false,

  -- UX metadata
  estimated_minutes INTEGER DEFAULT 2 CHECK (estimated_minutes > 0),
  help_text TEXT,
  icon_name TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON public.profile_workflow_steps(step_order);

COMMENT ON TABLE public.profile_workflow_steps IS
'Template defining the step-by-step workflow for creating a learner profile. Inspired by appboardguru2 onboarding system.';

-- ===================================================================
-- 3. USER PROFILE WORKFLOW PROGRESS
-- Tracks individual user progress through the profile creation workflow
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_profile_workflow_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.learner_profiles(id) ON DELETE CASCADE,

  current_step_order INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],

  -- Step data storage (accumulated as user progresses)
  step_data JSONB DEFAULT '{}'::jsonb,

  -- Status
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')) DEFAULT 'not_started',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_progress_user ON public.user_profile_workflow_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_progress_status ON public.user_profile_workflow_progress(status);
CREATE INDEX IF NOT EXISTS idx_workflow_progress_profile ON public.user_profile_workflow_progress(profile_id);

COMMENT ON TABLE public.user_profile_workflow_progress IS
'Tracks user progress through the profile creation workflow, storing step data and completion status.';

-- ===================================================================
-- 4. PROFILE INTERACTION EVENTS
-- Auto-update profiles based on user learning activities
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.profile_interaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.learner_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'course_completed',
    'course_enrolled',
    'assessment_taken',
    'exercise_completed',
    'quiz_completed',
    'workshop_attended',
    'achievement_earned',
    'skill_improved'
  )),
  event_data JSONB DEFAULT '{}'::jsonb,

  -- Impact on profile
  proficiency_change JSONB DEFAULT '{}'::jsonb,
  goals_affected UUID[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_events_profile ON public.profile_interaction_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_events_user ON public.profile_interaction_events(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_events_type ON public.profile_interaction_events(event_type);
CREATE INDEX IF NOT EXISTS idx_profile_events_created ON public.profile_interaction_events(created_at DESC);

COMMENT ON TABLE public.profile_interaction_events IS
'Tracks user learning activities to automatically update profile proficiency and goals. Enables adaptive learning path adjustments.';

-- ===================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- Enable RLS
ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile_workflow_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interaction_events ENABLE ROW LEVEL SECURITY;

-- Learner Profiles Policies
CREATE POLICY "Users can view their own profiles"
  ON public.learner_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles"
  ON public.learner_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
  ON public.learner_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
  ON public.learner_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Workflow Steps Policies (public read for all authenticated users)
CREATE POLICY "Authenticated users can view workflow steps"
  ON public.profile_workflow_steps FOR SELECT
  USING (auth.role() = 'authenticated');

-- Workflow Progress Policies
CREATE POLICY "Users can view their own workflow progress"
  ON public.user_profile_workflow_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflow progress"
  ON public.user_profile_workflow_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflow progress"
  ON public.user_profile_workflow_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profile Interaction Events Policies
CREATE POLICY "Users can view their own interaction events"
  ON public.profile_interaction_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert interaction events"
  ON public.profile_interaction_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===================================================================
-- 6. FUNCTIONS
-- ===================================================================

-- Function to ensure only one primary profile per user
CREATE OR REPLACE FUNCTION ensure_single_primary_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Set all other profiles for this user to is_primary = false
    UPDATE public.learner_profiles
    SET is_primary = false, last_updated_at = NOW()
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_profile
BEFORE INSERT OR UPDATE OF is_primary ON public.learner_profiles
FOR EACH ROW
WHEN (NEW.is_primary = true)
EXECUTE FUNCTION ensure_single_primary_profile();

-- Function to update last_updated_at timestamp
CREATE OR REPLACE FUNCTION update_learner_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_timestamp
BEFORE UPDATE ON public.learner_profiles
FOR EACH ROW
EXECUTE FUNCTION update_learner_profile_timestamp();

-- Function to calculate workflow completion percentage
CREATE OR REPLACE FUNCTION calculate_workflow_completion(
  p_completed_steps INTEGER[],
  p_total_steps INTEGER
)
RETURNS DECIMAL AS $$
BEGIN
  IF p_total_steps = 0 THEN
    RETURN 0;
  END IF;
  RETURN (ARRAY_LENGTH(p_completed_steps, 1)::DECIMAL / p_total_steps::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create user's active workflow progress
CREATE OR REPLACE FUNCTION get_or_create_workflow_progress(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_progress_id UUID;
BEGIN
  -- Try to find existing active workflow
  SELECT id INTO v_progress_id
  FROM public.user_profile_workflow_progress
  WHERE user_id = p_user_id
    AND status IN ('not_started', 'in_progress')
  ORDER BY last_activity_at DESC
  LIMIT 1;

  -- If not found, create new one
  IF v_progress_id IS NULL THEN
    INSERT INTO public.user_profile_workflow_progress (user_id, status)
    VALUES (p_user_id, 'not_started')
    RETURNING id INTO v_progress_id;
  END IF;

  RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 7. SEED WORKFLOW STEPS
-- ===================================================================

-- Clear existing workflow steps if any
DELETE FROM public.profile_workflow_steps;

INSERT INTO public.profile_workflow_steps (
  step_order, step_name, title, description, step_type,
  fields_to_collect, is_required, is_skippable, estimated_minutes, help_text, icon_name
) VALUES
(
  1,
  'welcome',
  'Welcome! Let''s Create Your Learning Profile',
  'Give your profile a meaningful name and describe what you want to achieve.',
  'form',
  '[
    {"name": "profile_name", "type": "text", "label": "Profile Name", "placeholder": "e.g., Career Switch to AI, Leadership Development", "required": true, "min_length": 3, "max_length": 100},
    {"name": "description", "type": "textarea", "label": "Description (Optional)", "placeholder": "Describe what you want to achieve with this learning path...", "required": false, "max_length": 500}
  ]'::jsonb,
  true,
  false,
  2,
  'Choose a name that represents your learning goal. You can create multiple profiles for different objectives.',
  'User'
),
(
  2,
  'background',
  'Tell Us About Your Background',
  'Help us understand your professional context to recommend the best courses.',
  'form',
  '[
    {"name": "target_audience", "type": "select", "label": "I am a...", "required": true, "options": ["professional", "business", "student", "primary", "secondary"]},
    {"name": "experience_level", "type": "select", "label": "AI Experience Level", "required": true, "options": ["beginner", "intermediate", "advanced", "expert"]},
    {"name": "industry", "type": "text", "label": "Industry", "required": false, "conditional": {"field": "target_audience", "values": ["professional", "business"]}},
    {"name": "job_role", "type": "text", "label": "Job Role", "required": false, "conditional": {"field": "target_audience", "values": ["professional", "business"]}},
    {"name": "company_size", "type": "select", "label": "Company Size", "required": false, "options": ["1-10", "11-50", "51-200", "201-1000", "1000+"], "conditional": {"field": "target_audience", "values": ["business"]}},
    {"name": "years_experience", "type": "number", "label": "Years of Professional Experience", "required": false, "min": 0, "max": 70, "conditional": {"field": "target_audience", "values": ["professional", "business"]}}
  ]'::jsonb,
  true,
  false,
  3,
  'This information helps us tailor course recommendations to your professional level and context.',
  'Briefcase'
),
(
  3,
  'learning_goals',
  'What Are Your Learning Goals?',
  'Select or create goals you want to achieve through your learning journey.',
  'selection',
  '[
    {"name": "learning_goals", "type": "multi_select_chips", "label": "Select Your Goals", "required": true, "min_selections": 1, "max_selections": 5, "custom_input": true, "predefined_options": [
      {"id": "ai_fundamentals", "label": "Master AI Fundamentals", "description": "Learn core AI concepts and techniques"},
      {"id": "ml_engineer", "label": "Become ML Engineer", "description": "Develop skills for machine learning engineering"},
      {"id": "ai_product", "label": "Build AI Products", "description": "Learn to design and ship AI-powered products"},
      {"id": "ai_strategy", "label": "Lead AI Strategy", "description": "Develop business and leadership skills for AI adoption"},
      {"id": "data_science", "label": "Master Data Science", "description": "Learn data analysis and statistical modeling"},
      {"id": "nlp_specialist", "label": "NLP Specialist", "description": "Focus on natural language processing"},
      {"id": "computer_vision", "label": "Computer Vision Expert", "description": "Learn image and video analysis with AI"},
      {"id": "ai_ethics", "label": "AI Ethics & Governance", "description": "Understand responsible AI development"}
    ]}
  ]'::jsonb,
  true,
  false,
  3,
  'Select up to 5 goals that align with your learning aspirations. You can also add custom goals.',
  'Target'
),
(
  4,
  'learning_preferences',
  'How Do You Prefer to Learn?',
  'Tell us about your learning style and time availability.',
  'form',
  '[
    {"name": "preferred_learning_style", "type": "radio_cards", "label": "Learning Style", "required": true, "options": [
      {"value": "visual", "label": "Visual", "description": "Videos, diagrams, infographics", "icon": "Eye"},
      {"value": "reading", "label": "Reading", "description": "Articles, documentation, books", "icon": "BookOpen"},
      {"value": "hands-on", "label": "Hands-On", "description": "Projects, exercises, coding", "icon": "Code"},
      {"value": "mixed", "label": "Mixed", "description": "Combination of all styles", "icon": "Layers"}
    ]},
    {"name": "available_hours_per_week", "type": "slider", "label": "Available Hours Per Week", "required": true, "min": 1, "max": 40, "default": 5, "step": 1},
    {"name": "preferred_schedule", "type": "schedule_selector", "label": "Preferred Schedule (Optional)", "required": false, "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], "time_slots": ["morning", "afternoon", "evening", "late_night"]}
  ]'::jsonb,
  true,
  false,
  2,
  'This helps us recommend courses that match your learning style and schedule.',
  'Calendar'
),
(
  5,
  'assessment_link',
  'Link Your Assessment (Optional)',
  'Connect your AI assessment results to personalize your learning path.',
  'assessment',
  '[
    {"name": "has_assessment", "type": "radio", "label": "Have you taken our AI Assessment?", "required": true, "options": ["yes", "no", "take_now"]},
    {"name": "latest_assessment_id", "type": "assessment_selector", "label": "Select Assessment", "required": false, "conditional": {"field": "has_assessment", "value": "yes"}}
  ]'::jsonb,
  false,
  true,
  2,
  'Linking your assessment helps us create a highly personalized curriculum based on your current skill level.',
  'Brain'
),
(
  6,
  'review',
  'Review Your Profile',
  'Review your profile details and make any final adjustments.',
  'review',
  '{}'::jsonb,
  true,
  false,
  2,
  'Take a moment to review all the information. You can edit any step before finalizing.',
  'CheckCircle'
);

-- ===================================================================
-- 8. GRANT PERMISSIONS
-- ===================================================================

-- Grant SELECT on workflow steps to authenticated users (public read)
GRANT SELECT ON public.profile_workflow_steps TO authenticated;

-- Grant CRUD on profiles and progress to authenticated users (RLS enforces ownership)
GRANT ALL ON public.learner_profiles TO authenticated;
GRANT ALL ON public.user_profile_workflow_progress TO authenticated;
GRANT SELECT, INSERT ON public.profile_interaction_events TO authenticated;

-- ===================================================================
-- SUCCESS!
-- ===================================================================

COMMENT ON SCHEMA public IS
'Learner Profiles Workflow system successfully created. Users can now create step-by-step learning profiles!';
