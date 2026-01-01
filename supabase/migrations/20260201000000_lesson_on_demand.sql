-- =============================================
-- Lesson on Demand Feature - Database Schema
-- =============================================
-- This migration creates the necessary tables and functions for the AI-powered
-- "Lesson on Demand" feature, allowing students to generate complete lessons
-- with learning objectives, content, exercises, quizzes, and resources.

-- =============================================
-- Table: ai_content_jobs (prerequisite)
-- =============================================
-- Create ai_content_jobs table if it doesn't exist (it may already exist from the
-- ai_content_generation migration)
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

  -- Output
  output_data JSONB,
  output_content_id UUID,
  output_content_type TEXT,

  -- Generation details
  model_used TEXT DEFAULT 'llama3.3:70b',
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_ai_content_jobs_user ON ai_content_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_jobs_status ON ai_content_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_content_jobs_type ON ai_content_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_jobs_created ON ai_content_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE ai_content_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_content_jobs' AND policyname = 'ai_content_jobs_own'
  ) THEN
    CREATE POLICY ai_content_jobs_own ON ai_content_jobs
      FOR ALL USING (user_id = auth.uid());
  END IF;
END$$;

-- Create helper function if it doesn't exist
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

-- =============================================
-- Table: ai_generated_lessons
-- =============================================
CREATE TABLE IF NOT EXISTS ai_generated_lessons (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES ai_content_jobs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Lesson metadata
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,

  -- Target audience & difficulty
  audience TEXT DEFAULT 'professional' CHECK (audience IN (
    'primary', 'secondary', 'professional', 'business'
  )),
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN (
    'beginner', 'intermediate', 'advanced', 'expert'
  )),

  -- Curriculum alignment (optional)
  curriculum_type TEXT, -- e.g., 'national_curriculum', 'ap', 'ib', 'common_core'
  grade_level TEXT,     -- e.g., 'year_7', 'grade_10', 'undergraduate'

  -- Learning objectives
  learning_objectives TEXT[] NOT NULL DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',

  -- Main content sections (structured as JSONB)
  content_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  /* Structure:
  [
    {
      "section_type": "introduction",
      "title": "Understanding the Topic",
      "content": "Markdown content...",
      "duration_minutes": 10,
      "key_points": ["Point 1", "Point 2"]
    },
    {
      "section_type": "main_content",
      "title": "Core Concepts",
      "content": "Detailed explanation...",
      "duration_minutes": 30,
      "examples": [
        {
          "title": "Example 1",
          "description": "Explanation...",
          "code_snippet": "optional code"
        }
      ]
    },
    {
      "section_type": "practice",
      "title": "Guided Practice",
      "content": "Practice activities...",
      "duration_minutes": 15
    },
    {
      "section_type": "summary",
      "title": "Key Takeaways",
      "content": "Recap of main points...",
      "duration_minutes": 5
    }
  ]
  */

  -- Practice exercises
  practice_exercises JSONB DEFAULT '[]'::jsonb,
  /* Structure:
  [
    {
      "title": "Exercise 1: Basic Application",
      "description": "Apply the concept to solve this problem...",
      "type": "hands_on|reflection|problem_solving|case_study",
      "difficulty": "beginner|intermediate|advanced",
      "estimated_minutes": 10,
      "solution_hints": ["Hint 1", "Hint 2"],
      "success_criteria": ["Criterion 1", "Criterion 2"]
    }
  ]
  */

  -- Quiz questions
  quiz_questions JSONB DEFAULT '[]'::jsonb,
  /* Structure:
  [
    {
      "question_type": "multiple_choice|true_false|short_answer|fill_blank",
      "question_text": "What is...?",
      "options": [
        {"text": "Option A", "is_correct": false},
        {"text": "Option B", "is_correct": true},
        {"text": "Option C", "is_correct": false},
        {"text": "Option D", "is_correct": false}
      ],
      "explanation": "The correct answer is B because...",
      "difficulty": "beginner|intermediate|advanced",
      "points": 2,
      "bloom_taxonomy_level": "remembering|understanding|applying|analyzing|evaluating|creating"
    }
  ]
  */

  -- Additional resources
  additional_resources JSONB DEFAULT '{}'::jsonb,
  /* Structure:
  {
    "reading_materials": [
      {
        "title": "Article Title",
        "url": "https://...",
        "type": "article|book|paper|documentation",
        "reading_time_minutes": 5
      }
    ],
    "videos": [
      {
        "title": "Video Title",
        "url": "https://...",
        "duration": "10:30",
        "platform": "youtube|vimeo|custom"
      }
    ],
    "interactive_tools": [
      {
        "title": "Interactive Tool",
        "url": "https://...",
        "description": "What it does",
        "type": "simulation|calculator|diagram|quiz"
      }
    ],
    "related_courses": [
      {
        "course_id": "uuid",
        "course_title": "Course Title",
        "relevance": "Builds on this lesson|Prerequisite|Advanced follow-up"
      }
    ]
  }
  */

  -- Lesson metrics
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 45,
  word_count INTEGER,

  -- Tags & categorization
  tags TEXT[] DEFAULT '{}',
  category TEXT,

  -- Status & workflow
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'reviewing', 'approved', 'published', 'archived'
  )),

  -- Publishing
  published_course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  published_lesson_url TEXT,

  -- Review workflow
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX idx_ai_generated_lessons_user
  ON ai_generated_lessons(user_id);

CREATE INDEX idx_ai_generated_lessons_status
  ON ai_generated_lessons(status);

CREATE INDEX idx_ai_generated_lessons_audience
  ON ai_generated_lessons(audience);

CREATE INDEX idx_ai_generated_lessons_difficulty
  ON ai_generated_lessons(difficulty);

CREATE INDEX idx_ai_generated_lessons_created
  ON ai_generated_lessons(created_at DESC);

CREATE INDEX idx_ai_generated_lessons_tags
  ON ai_generated_lessons USING gin(tags);

CREATE INDEX idx_ai_generated_lessons_job
  ON ai_generated_lessons(job_id)
  WHERE job_id IS NOT NULL;

CREATE INDEX idx_ai_generated_lessons_course
  ON ai_generated_lessons(published_course_id)
  WHERE published_course_id IS NOT NULL;

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================
ALTER TABLE ai_generated_lessons ENABLE ROW LEVEL SECURITY;

-- Users can manage their own lessons
CREATE POLICY ai_generated_lessons_own
  ON ai_generated_lessons
  FOR ALL
  USING (user_id = auth.uid());

-- Admins can view all published lessons
CREATE POLICY ai_generated_lessons_published_read
  ON ai_generated_lessons
  FOR SELECT
  USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can manage all lessons (for moderation)
CREATE POLICY ai_generated_lessons_admin_manage
  ON ai_generated_lessons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =============================================
-- Trigger: Auto-update updated_at timestamp
-- =============================================
CREATE TRIGGER update_ai_generated_lessons_updated_at
  BEFORE UPDATE ON ai_generated_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Helper Functions
-- =============================================

-- Function to get lesson statistics for a user
CREATE OR REPLACE FUNCTION get_user_lesson_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_lessons', COUNT(*),
    'draft_lessons', COUNT(*) FILTER (WHERE status = 'draft'),
    'published_lessons', COUNT(*) FILTER (WHERE status = 'published'),
    'archived_lessons', COUNT(*) FILTER (WHERE status = 'archived'),
    'total_duration_minutes', COALESCE(SUM(estimated_duration_minutes), 0),
    'avg_duration_minutes', COALESCE(AVG(estimated_duration_minutes), 0)::integer,
    'audiences', json_agg(DISTINCT audience),
    'most_used_tags', (
      SELECT json_agg(tag)
      FROM (
        SELECT unnest(tags) as tag, COUNT(*) as count
        FROM ai_generated_lessons
        WHERE user_id = p_user_id
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 10
      ) t
    )
  ) INTO v_stats
  FROM ai_generated_lessons
  WHERE user_id = p_user_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to publish a lesson
CREATE OR REPLACE FUNCTION publish_generated_lesson(
  p_lesson_id UUID,
  p_course_id INTEGER DEFAULT NULL
)
RETURNS ai_generated_lessons AS $$
DECLARE
  v_lesson ai_generated_lessons;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM ai_generated_lessons
    WHERE id = p_lesson_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Lesson not found or access denied';
  END IF;

  -- Update lesson status
  UPDATE ai_generated_lessons
  SET
    status = 'published',
    published_course_id = p_course_id,
    updated_at = NOW()
  WHERE id = p_lesson_id
  RETURNING * INTO v_lesson;

  RETURN v_lesson;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive a lesson
CREATE OR REPLACE FUNCTION archive_generated_lesson(p_lesson_id UUID)
RETURNS ai_generated_lessons AS $$
DECLARE
  v_lesson ai_generated_lessons;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM ai_generated_lessons
    WHERE id = p_lesson_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Lesson not found or access denied';
  END IF;

  -- Archive lesson
  UPDATE ai_generated_lessons
  SET
    status = 'archived',
    updated_at = NOW()
  WHERE id = p_lesson_id
  RETURNING * INTO v_lesson;

  RETURN v_lesson;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Comments for Documentation
-- =============================================
COMMENT ON TABLE ai_generated_lessons IS
  'AI-generated lessons with structured content, exercises, quizzes, and resources';

COMMENT ON COLUMN ai_generated_lessons.content_sections IS
  'Structured lesson content with introduction, main content, practice sections, and summary';

COMMENT ON COLUMN ai_generated_lessons.practice_exercises IS
  'Hands-on practice activities with hints, success criteria, and solutions';

COMMENT ON COLUMN ai_generated_lessons.quiz_questions IS
  'Assessment questions with multiple choice, true/false, and short answer formats';

COMMENT ON COLUMN ai_generated_lessons.additional_resources IS
  'Curated collection of reading materials, videos, tools, and related courses';

COMMENT ON COLUMN ai_generated_lessons.status IS
  'Workflow status: draft (editing), reviewing (pending approval), approved (ready to publish), published (live), archived (retired)';

-- =============================================
-- Grant Permissions
-- =============================================
-- Grant execute permission on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_lesson_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION publish_generated_lesson(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_generated_lesson(UUID) TO authenticated;
