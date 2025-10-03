-- Add all potentially missing columns to assessment_questions
ALTER TABLE assessment_questions
ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT 'single_choice',
ADD COLUMN IF NOT EXISTS points_value INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add all potentially missing columns to assessment_question_options
ALTER TABLE assessment_question_options
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Verify columns exist
SELECT 'assessment_questions columns:' as info;
SELECT column_name FROM information_schema.columns
WHERE table_name = 'assessment_questions'
ORDER BY ordinal_position;

SELECT 'assessment_question_options columns:' as info;
SELECT column_name FROM information_schema.columns
WHERE table_name = 'assessment_question_options'
ORDER BY ordinal_position;
