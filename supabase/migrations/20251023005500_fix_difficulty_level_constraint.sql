-- =====================================================
-- FIX: Update difficulty_level constraint to accept sample question values
-- Created: 2025-10-24
-- Purpose: Allow 'beginner', 'intermediate', 'expert' in addition to existing values
-- =====================================================

-- Drop the old constraint
ALTER TABLE assessment_questions
DROP CONSTRAINT IF EXISTS check_difficulty_level;

-- Add new constraint with all valid values
ALTER TABLE assessment_questions
ADD CONSTRAINT check_difficulty_level
CHECK (difficulty_level IN (
  'foundational',   -- Basic understanding
  'beginner',       -- Entry level (same as foundational)
  'applied',        -- Practical application
  'intermediate',   -- Medium difficulty
  'advanced',       -- High difficulty
  'expert',         -- Expert level
  'strategic'       -- Strategic/leadership level
));

-- Update any existing 'beginner' to 'foundational' for consistency (optional)
-- Uncomment if you want to normalize the data:
-- UPDATE assessment_questions SET difficulty_level = 'foundational' WHERE difficulty_level = 'beginner';
-- UPDATE assessment_questions SET difficulty_level = 'applied' WHERE difficulty_level = 'intermediate';
-- UPDATE assessment_questions SET difficulty_level = 'advanced' WHERE difficulty_level = 'expert';

COMMENT ON CONSTRAINT check_difficulty_level ON assessment_questions IS
'Allows multiple difficulty level naming conventions for flexibility';
