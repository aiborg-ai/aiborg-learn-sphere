-- Phase 4.1: AI Content Generation
-- AI Course Creator, Assessment Builder, Content Translation

-- =============================================================================
-- AI GENERATION JOBS
-- =============================================================================

-- Track AI content generation jobs
CREATE TABLE IF NOT EXISTS ai_content_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Job type
  job_type TEXT NOT NULL CHECK (job_type IN (
    'course', 'lesson', 'quiz', 'assessment', 'flashcards',
    'slide_deck', 'video_script', 'translation'
  )),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),

  -- Input parameters
  input_params JSONB NOT NULL DEFAULT '{}',
  /* Example for course:
  {
    "topic": "Introduction to Machine Learning",
    "audience": "professional",
    "difficulty": "intermediate",
    "duration_hours": 10,
    "num_modules": 5,
    "include_quizzes": true,
    "include_exercises": true
  }
  */

  -- Output
  output_data JSONB,
  output_content_id UUID, -- Reference to created content
  output_content_type TEXT,

  -- Generation details
  model_used TEXT DEFAULT 'gpt-4-turbo-preview',
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10, 6),
  generation_time_ms INTEGER,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- =============================================================================
-- COURSE TEMPLATES
-- =============================================================================

-- Pre-built course templates for AI generation
CREATE TABLE IF NOT EXISTS ai_course_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,

  -- Target audience
  audience TEXT DEFAULT 'professional' CHECK (audience IN (
    'primary', 'secondary', 'professional', 'business'
  )),

  -- Structure
  default_modules INTEGER DEFAULT 5,
  default_lessons_per_module INTEGER DEFAULT 4,
  default_duration_hours INTEGER DEFAULT 10,

  -- Content preferences
  include_quizzes BOOLEAN DEFAULT true,
  include_exercises BOOLEAN DEFAULT true,
  include_flashcards BOOLEAN DEFAULT false,
  include_video_scripts BOOLEAN DEFAULT false,

  -- Learning objectives template
  learning_objectives_template TEXT[],

  -- Module structure template
  module_structure JSONB,
  /* Example:
  [
    {
      "title_template": "Introduction to {topic}",
      "lessons": ["What is {topic}?", "History and Evolution", "Key Concepts"]
    },
    {
      "title_template": "Core Concepts of {topic}",
      "lessons": ["Fundamental Principles", "Types and Categories", "Practical Applications"]
    }
  ]
  */

  -- Assessment template
  assessment_template JSONB,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- GENERATED CONTENT
-- =============================================================================

-- Store generated course outlines before publishing
CREATE TABLE IF NOT EXISTS ai_generated_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES ai_content_jobs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Course info
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,

  -- Target
  audience TEXT DEFAULT 'professional',
  difficulty TEXT DEFAULT 'intermediate',
  estimated_duration_hours INTEGER,

  -- Structure
  learning_objectives TEXT[],
  prerequisites TEXT[],

  -- Generated content
  modules JSONB NOT NULL,
  /* Structure:
  [
    {
      "title": "Module 1: Introduction",
      "description": "...",
      "lessons": [
        {
          "title": "Lesson 1.1",
          "content": "...",
          "duration_minutes": 30,
          "quiz_questions": [...],
          "exercises": [...]
        }
      ]
    }
  ]
  */

  -- Metadata
  tags TEXT[],
  category TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'reviewing', 'approved', 'published', 'archived'
  )),
  published_course_id UUID REFERENCES courses(id),

  -- Review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store generated quiz questions
CREATE TABLE IF NOT EXISTS ai_generated_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES ai_content_jobs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source
  source_content TEXT, -- The content used to generate questions
  source_type TEXT, -- 'course', 'lesson', 'text', 'topic'

  -- Question data
  question_type TEXT NOT NULL CHECK (question_type IN (
    'multiple_choice', 'true_false', 'short_answer', 'matching', 'fill_blank'
  )),
  question_text TEXT NOT NULL,
  options JSONB, -- For multiple choice
  correct_answer TEXT,
  explanation TEXT,

  -- Metadata
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN (
    'beginner', 'intermediate', 'advanced', 'expert'
  )),
  points INTEGER DEFAULT 1,
  tags TEXT[],

  -- Quality
  quality_score DECIMAL(3, 2), -- 0.00 to 1.00
  is_reviewed BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,

  -- Usage
  added_to_quiz_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TRANSLATIONS
-- =============================================================================

-- Content translations
CREATE TABLE IF NOT EXISTS ai_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES ai_content_jobs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source
  source_content_id UUID NOT NULL,
  source_content_type TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'en',

  -- Translation
  target_language TEXT NOT NULL,
  translated_content JSONB NOT NULL,

  -- Quality
  quality_score DECIMAL(3, 2),
  is_reviewed BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  reviewer_notes TEXT,

  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN (
    'pending', 'completed', 'failed', 'needs_review'
  )),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_content_id, source_content_type, target_language)
);

-- Supported languages
CREATE TABLE IF NOT EXISTS supported_languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT,
  is_active BOOLEAN DEFAULT true,
  translation_quality TEXT DEFAULT 'standard' CHECK (translation_quality IN (
    'basic', 'standard', 'premium'
  ))
);

-- =============================================================================
-- VIDEO SCRIPTS & SLIDE DECKS
-- =============================================================================

-- Generated video scripts
CREATE TABLE IF NOT EXISTS ai_video_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES ai_content_jobs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  topic TEXT,
  duration_minutes INTEGER,

  -- Script
  script_content JSONB NOT NULL,
  /* Structure:
  {
    "introduction": "...",
    "sections": [
      {
        "title": "Section 1",
        "narration": "...",
        "visual_notes": "...",
        "duration_seconds": 120
      }
    ],
    "conclusion": "...",
    "call_to_action": "..."
  }
  */

  -- Settings
  tone TEXT DEFAULT 'professional',
  target_audience TEXT DEFAULT 'professional',

  -- Status
  is_approved BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated slide decks
CREATE TABLE IF NOT EXISTS ai_slide_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES ai_content_jobs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  topic TEXT,

  -- Slides
  slides JSONB NOT NULL,
  /* Structure:
  [
    {
      "slide_number": 1,
      "type": "title",
      "title": "...",
      "subtitle": "...",
      "speaker_notes": "..."
    },
    {
      "slide_number": 2,
      "type": "content",
      "title": "...",
      "bullet_points": ["...", "..."],
      "image_suggestion": "...",
      "speaker_notes": "..."
    }
  ]
  */

  -- Settings
  num_slides INTEGER,
  style TEXT DEFAULT 'professional',

  -- Export
  exported_url TEXT, -- Link to exported PPT/PDF

  -- Status
  is_approved BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_content_jobs_user ON ai_content_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_jobs_status ON ai_content_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_content_jobs_type ON ai_content_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_jobs_created ON ai_content_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generated_courses_user ON ai_generated_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_courses_status ON ai_generated_courses(status);

CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_user ON ai_generated_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_type ON ai_generated_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_approved ON ai_generated_questions(is_approved) WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_ai_translations_source ON ai_translations(source_content_id, source_content_type);
CREATE INDEX IF NOT EXISTS idx_ai_translations_language ON ai_translations(target_language);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Create AI content generation job
CREATE OR REPLACE FUNCTION create_ai_content_job(
  p_user_id UUID,
  p_job_type TEXT,
  p_input_params JSONB
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO ai_content_jobs (
    user_id,
    job_type,
    input_params,
    status
  ) VALUES (
    p_user_id,
    p_job_type,
    p_input_params,
    'pending'
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Complete AI content job
CREATE OR REPLACE FUNCTION complete_ai_content_job(
  p_job_id UUID,
  p_output_data JSONB,
  p_content_id UUID DEFAULT NULL,
  p_content_type TEXT DEFAULT NULL,
  p_tokens INTEGER DEFAULT 0,
  p_cost DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE ai_content_jobs
  SET
    status = 'completed',
    output_data = p_output_data,
    output_content_id = p_content_id,
    output_content_type = p_content_type,
    total_tokens = p_tokens,
    cost_usd = p_cost,
    completed_at = NOW()
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Fail AI content job
CREATE OR REPLACE FUNCTION fail_ai_content_job(
  p_job_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE ai_content_jobs
  SET
    status = 'failed',
    error_message = p_error_message,
    completed_at = NOW(),
    retry_count = retry_count + 1
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Get user's generation stats
CREATE OR REPLACE FUNCTION get_user_generation_stats(p_user_id UUID)
RETURNS TABLE (
  total_jobs BIGINT,
  completed_jobs BIGINT,
  failed_jobs BIGINT,
  total_tokens BIGINT,
  total_cost DECIMAL,
  jobs_by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
    COALESCE(SUM(ai_content_jobs.total_tokens), 0) as total_tokens,
    COALESCE(SUM(cost_usd), 0) as total_cost,
    jsonb_object_agg(
      COALESCE(job_type, 'unknown'),
      type_count
    ) as jobs_by_type
  FROM ai_content_jobs
  LEFT JOIN (
    SELECT job_type as jt, COUNT(*) as type_count
    FROM ai_content_jobs
    WHERE user_id = p_user_id
    GROUP BY job_type
  ) type_counts ON type_counts.jt = ai_content_jobs.job_type
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE ai_content_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_course_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_video_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_slide_decks ENABLE ROW LEVEL SECURITY;

-- Users can see their own jobs
CREATE POLICY ai_content_jobs_own ON ai_content_jobs
  FOR ALL USING (user_id = auth.uid());

-- Templates are public for reading
CREATE POLICY ai_course_templates_read ON ai_course_templates
  FOR SELECT USING (is_active = true);

-- Users can see their own generated content
CREATE POLICY ai_generated_courses_own ON ai_generated_courses
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY ai_generated_questions_own ON ai_generated_questions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY ai_translations_own ON ai_translations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY ai_video_scripts_own ON ai_video_scripts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY ai_slide_decks_own ON ai_slide_decks
  FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- SEED DATA - COURSE TEMPLATES
-- =============================================================================

INSERT INTO ai_course_templates (
  name, description, category, audience, default_modules, default_lessons_per_module,
  default_duration_hours, include_quizzes, include_exercises, learning_objectives_template, module_structure
) VALUES
-- Technical Training Template
(
  'Technical Skills Training',
  'Template for technical skill development courses',
  'technical',
  'professional',
  5, 4, 12, true, true,
  ARRAY[
    'Understand fundamental concepts of {topic}',
    'Apply {topic} principles in practical scenarios',
    'Develop hands-on skills through exercises',
    'Demonstrate proficiency through assessments',
    'Build real-world projects using {topic}'
  ],
  '[
    {"title_template": "Introduction to {topic}", "lessons": ["What is {topic}?", "Why Learn {topic}?", "Getting Started", "Setting Up Your Environment"]},
    {"title_template": "Core Concepts", "lessons": ["Fundamental Principles", "Key Components", "Best Practices", "Common Patterns"]},
    {"title_template": "Practical Application", "lessons": ["Hands-on Exercises", "Real-world Scenarios", "Problem Solving", "Building Projects"]},
    {"title_template": "Advanced Topics", "lessons": ["Advanced Techniques", "Performance Optimization", "Security Considerations", "Integration Patterns"]},
    {"title_template": "Mastery & Next Steps", "lessons": ["Capstone Project", "Certification Prep", "Career Applications", "Continued Learning"]}
  ]'::jsonb
),
-- Compliance Training Template
(
  'Compliance Training',
  'Template for regulatory and compliance training courses',
  'compliance',
  'professional',
  4, 3, 6, true, false,
  ARRAY[
    'Understand regulatory requirements for {topic}',
    'Identify compliance risks and violations',
    'Apply compliant practices in daily work',
    'Pass compliance assessment with 80%+ score'
  ],
  '[
    {"title_template": "Regulatory Overview", "lessons": ["Regulations & Standards", "Legal Requirements", "Penalties & Consequences"]},
    {"title_template": "Compliance Requirements", "lessons": ["Key Requirements", "Documentation", "Reporting Procedures"]},
    {"title_template": "Practical Application", "lessons": ["Daily Compliance", "Identifying Violations", "Escalation Process"]},
    {"title_template": "Assessment & Certification", "lessons": ["Knowledge Check", "Scenario Analysis", "Final Assessment"]}
  ]'::jsonb
),
-- Soft Skills Template
(
  'Soft Skills Development',
  'Template for leadership and soft skills courses',
  'soft_skills',
  'professional',
  4, 4, 8, true, true,
  ARRAY[
    'Develop core {topic} competencies',
    'Apply {topic} skills in workplace scenarios',
    'Receive feedback and improve techniques',
    'Build confidence in {topic} abilities'
  ],
  '[
    {"title_template": "Understanding {topic}", "lessons": ["The Importance of {topic}", "Self-Assessment", "Core Principles", "Mindset Development"]},
    {"title_template": "Building Skills", "lessons": ["Key Techniques", "Practice Exercises", "Common Challenges", "Overcoming Barriers"]},
    {"title_template": "Application & Practice", "lessons": ["Workplace Scenarios", "Role-Playing", "Feedback & Reflection", "Action Planning"]},
    {"title_template": "Mastery & Growth", "lessons": ["Advanced Strategies", "Continuous Improvement", "Measuring Progress", "Next Steps"]}
  ]'::jsonb
),
-- Onboarding Template
(
  'Employee Onboarding',
  'Template for new employee orientation courses',
  'onboarding',
  'professional',
  5, 3, 4, true, false,
  ARRAY[
    'Understand company culture and values',
    'Navigate key systems and processes',
    'Meet team members and stakeholders',
    'Complete required onboarding tasks',
    'Prepare for first 90 days of success'
  ],
  '[
    {"title_template": "Welcome to {company}", "lessons": ["Company Overview", "Mission & Values", "Organizational Structure"]},
    {"title_template": "Systems & Tools", "lessons": ["Essential Tools", "Communication Platforms", "IT & Security"]},
    {"title_template": "Policies & Procedures", "lessons": ["HR Policies", "Compliance Requirements", "Benefits Overview"]},
    {"title_template": "Your Role", "lessons": ["Job Responsibilities", "Team Introduction", "Success Metrics"]},
    {"title_template": "30-60-90 Day Plan", "lessons": ["First Month Goals", "Building Relationships", "Long-term Success"]}
  ]'::jsonb
);

-- Seed supported languages
INSERT INTO supported_languages (code, name, native_name, is_active, translation_quality) VALUES
('en', 'English', 'English', true, 'premium'),
('es', 'Spanish', 'Español', true, 'premium'),
('fr', 'French', 'Français', true, 'premium'),
('de', 'German', 'Deutsch', true, 'premium'),
('it', 'Italian', 'Italiano', true, 'standard'),
('pt', 'Portuguese', 'Português', true, 'standard'),
('zh', 'Chinese', '中文', true, 'premium'),
('ja', 'Japanese', '日本語', true, 'premium'),
('ko', 'Korean', '한국어', true, 'standard'),
('ar', 'Arabic', 'العربية', true, 'standard'),
('hi', 'Hindi', 'हिन्दी', true, 'standard'),
('ru', 'Russian', 'Русский', true, 'standard'),
('nl', 'Dutch', 'Nederlands', true, 'standard'),
('sv', 'Swedish', 'Svenska', true, 'standard'),
('pl', 'Polish', 'Polski', true, 'basic'),
('tr', 'Turkish', 'Türkçe', true, 'basic'),
('vi', 'Vietnamese', 'Tiếng Việt', true, 'basic'),
('th', 'Thai', 'ไทย', true, 'basic'),
('id', 'Indonesian', 'Bahasa Indonesia', true, 'basic'),
('ms', 'Malay', 'Bahasa Melayu', true, 'basic')
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE ai_content_jobs IS 'Track all AI content generation jobs and their status';
COMMENT ON TABLE ai_course_templates IS 'Pre-built templates for AI course generation';
COMMENT ON TABLE ai_generated_courses IS 'AI-generated course outlines before publishing';
COMMENT ON TABLE ai_generated_questions IS 'AI-generated quiz questions for review';
COMMENT ON TABLE ai_translations IS 'AI-generated content translations';
COMMENT ON TABLE ai_video_scripts IS 'AI-generated video narration scripts';
COMMENT ON TABLE ai_slide_decks IS 'AI-generated presentation slides';
COMMENT ON TABLE supported_languages IS 'Languages available for content translation';
