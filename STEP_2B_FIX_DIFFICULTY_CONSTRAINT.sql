ALTER TABLE assessment_questions
DROP CONSTRAINT IF EXISTS check_difficulty_level;

ALTER TABLE assessment_questions
ADD CONSTRAINT check_difficulty_level
CHECK (difficulty_level IN (
  'foundational',
  'beginner',
  'applied',
  'intermediate',
  'advanced',
  'expert',
  'strategic'
));
