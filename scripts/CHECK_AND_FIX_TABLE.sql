-- Check if assessment_questions table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'assessment_questions'
ORDER BY ordinal_position;

-- If difficulty_level is missing, add it
ALTER TABLE assessment_questions
ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50) DEFAULT 'beginner';

-- Verify column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'assessment_questions'
  AND column_name = 'difficulty_level';
