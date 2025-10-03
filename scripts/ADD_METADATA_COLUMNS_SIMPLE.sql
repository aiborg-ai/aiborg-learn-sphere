-- Simple script to add metadata columns to assessment_questions table
-- Run this in Supabase SQL Editor

BEGIN;

-- Add difficulty_level column
ALTER TABLE assessment_questions
ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'applied';

-- Add recommended_experience_level column
ALTER TABLE assessment_questions
ADD COLUMN IF NOT EXISTS recommended_experience_level VARCHAR(20) DEFAULT 'basic';

-- Add tags column
ALTER TABLE assessment_questions
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add prerequisite_concepts column
ALTER TABLE assessment_questions
ADD COLUMN IF NOT EXISTS prerequisite_concepts TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update any NULL or invalid values BEFORE adding constraints
UPDATE assessment_questions
SET difficulty_level = 'applied'
WHERE difficulty_level IS NULL
   OR difficulty_level NOT IN ('foundational', 'applied', 'advanced', 'strategic');

UPDATE assessment_questions
SET recommended_experience_level = 'basic'
WHERE recommended_experience_level IS NULL
   OR recommended_experience_level NOT IN ('none', 'basic', 'intermediate', 'advanced');

UPDATE assessment_questions
SET tags = ARRAY[]::TEXT[]
WHERE tags IS NULL;

UPDATE assessment_questions
SET prerequisite_concepts = ARRAY[]::TEXT[]
WHERE prerequisite_concepts IS NULL;

-- Add constraints AFTER cleaning data
ALTER TABLE assessment_questions
DROP CONSTRAINT IF EXISTS check_difficulty_level;

ALTER TABLE assessment_questions
ADD CONSTRAINT check_difficulty_level
CHECK (difficulty_level IN ('foundational', 'applied', 'advanced', 'strategic'));

ALTER TABLE assessment_questions
DROP CONSTRAINT IF EXISTS check_experience_level;

ALTER TABLE assessment_questions
ADD CONSTRAINT check_experience_level
CHECK (recommended_experience_level IN ('none', 'basic', 'intermediate', 'advanced'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_difficulty
ON assessment_questions (difficulty_level);

CREATE INDEX IF NOT EXISTS idx_questions_experience_level
ON assessment_questions (recommended_experience_level);

CREATE INDEX IF NOT EXISTS idx_questions_tags
ON assessment_questions USING GIN (tags);

COMMIT;

-- Verify
SELECT
  'Columns added successfully!' AS status,
  COUNT(*) AS total_questions,
  COUNT(*) FILTER (WHERE difficulty_level IS NOT NULL) AS has_difficulty,
  COUNT(*) FILTER (WHERE recommended_experience_level IS NOT NULL) AS has_experience
FROM assessment_questions;
