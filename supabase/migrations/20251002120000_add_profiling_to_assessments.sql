-- Add profiling data support to AI assessments
-- This migration adds the ability to store user profiling information
-- collected before the assessment starts

-- Add profiling_data column to user_ai_assessments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'profiling_data'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN profiling_data JSONB DEFAULT '{}'::jsonb;

    COMMENT ON COLUMN user_ai_assessments.profiling_data IS
    'User profiling information collected before assessment: audience_type, experience_level, industry, job_role, goals, etc.';
  END IF;
END $$;

-- Add index for faster JSON queries on profiling data
CREATE INDEX IF NOT EXISTS idx_user_assessments_profiling_audience
ON user_ai_assessments ((profiling_data->>'audience_type'));

CREATE INDEX IF NOT EXISTS idx_user_assessments_profiling_experience
ON user_ai_assessments ((profiling_data->>'experience_level'));

-- Sample profiling data structure (for documentation):
-- {
--   "audience_type": "professional" | "business" | "primary" | "secondary",
--   "experience_level": "none" | "basic" | "intermediate" | "advanced",
--   "industry": "string",
--   "job_role": "string",
--   "years_experience": number,
--   "company_size": "string",
--   "goals": ["string"],
--   "current_tools": ["string"],
--   "challenges": ["string"],
--   "education_level": "string",  // for students
--   "grade_level": "string",      // for young learners
--   "interests": ["string"]
-- }
