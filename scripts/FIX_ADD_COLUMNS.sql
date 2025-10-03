-- Simple fix: Just add the columns without constraints first
-- Run this in Supabase SQL Editor

-- Add columns one by one
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20);
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS recommended_experience_level VARCHAR(20);
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS prerequisite_concepts TEXT[];

-- Set defaults for all rows
UPDATE assessment_questions SET difficulty_level = 'applied' WHERE difficulty_level IS NULL;
UPDATE assessment_questions SET recommended_experience_level = 'basic' WHERE recommended_experience_level IS NULL;
UPDATE assessment_questions SET tags = ARRAY[]::TEXT[] WHERE tags IS NULL;
UPDATE assessment_questions SET prerequisite_concepts = ARRAY[]::TEXT[] WHERE prerequisite_concepts IS NULL;

-- Clean up any invalid values
UPDATE assessment_questions
SET difficulty_level = 'applied'
WHERE difficulty_level NOT IN ('foundational', 'applied', 'advanced', 'strategic');

UPDATE assessment_questions
SET recommended_experience_level = 'basic'
WHERE recommended_experience_level NOT IN ('none', 'basic', 'intermediate', 'advanced');

-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assessment_questions'
  AND column_name IN ('difficulty_level', 'recommended_experience_level', 'tags', 'prerequisite_concepts');

SELECT 'Columns added!' AS status;
