-- Add metadata fields for intelligent question curation and adaptive assessment
-- This migration adds fields to support difficulty-based filtering and prerequisite tracking

-- Add difficulty_level field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN difficulty_level VARCHAR(20) DEFAULT 'applied';

    COMMENT ON COLUMN assessment_questions.difficulty_level IS
    'Difficulty level: foundational, applied, advanced, strategic';
  END IF;
END $$;

-- Add prerequisite_concepts field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'prerequisite_concepts'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN prerequisite_concepts TEXT[] DEFAULT ARRAY[]::TEXT[];

    COMMENT ON COLUMN assessment_questions.prerequisite_concepts IS
    'Array of concepts user should know before this question';
  END IF;
END $$;

-- Add recommended_experience_level field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'recommended_experience_level'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN recommended_experience_level VARCHAR(20) DEFAULT 'basic';

    COMMENT ON COLUMN assessment_questions.recommended_experience_level IS
    'Minimum experience level: none, basic, intermediate, advanced';
  END IF;
END $$;

-- Add tags field for flexible categorization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'tags'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];

    COMMENT ON COLUMN assessment_questions.tags IS
    'Flexible tags for filtering: practical, theoretical, business-focused, technical, etc.';
  END IF;
END $$;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_questions_difficulty
ON assessment_questions (difficulty_level);

CREATE INDEX IF NOT EXISTS idx_questions_experience_level
ON assessment_questions (recommended_experience_level);

CREATE INDEX IF NOT EXISTS idx_questions_tags
ON assessment_questions USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_questions_audience_filters
ON assessment_questions USING GIN (audience_filters);

-- Update any existing NULL or invalid difficulty levels before adding constraint
UPDATE assessment_questions
SET difficulty_level = 'applied'
WHERE difficulty_level IS NULL OR difficulty_level NOT IN ('foundational', 'applied', 'advanced', 'strategic');

-- Add constraint to ensure valid difficulty levels
ALTER TABLE assessment_questions
DROP CONSTRAINT IF EXISTS check_difficulty_level;

ALTER TABLE assessment_questions
ADD CONSTRAINT check_difficulty_level
CHECK (difficulty_level IN ('foundational', 'applied', 'advanced', 'strategic'));

-- Update any existing NULL or invalid experience levels before adding constraint
UPDATE assessment_questions
SET recommended_experience_level = 'basic'
WHERE recommended_experience_level IS NULL OR recommended_experience_level NOT IN ('none', 'basic', 'intermediate', 'advanced');

-- Add constraint to ensure valid experience levels
ALTER TABLE assessment_questions
DROP CONSTRAINT IF EXISTS check_experience_level;

ALTER TABLE assessment_questions
ADD CONSTRAINT check_experience_level
CHECK (recommended_experience_level IN ('none', 'basic', 'intermediate', 'advanced'));

-- Add function to get recommended questions for a user profile
CREATE OR REPLACE FUNCTION get_recommended_questions(
  p_audience_type TEXT,
  p_experience_level TEXT DEFAULT 'basic',
  p_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  category_name TEXT,
  difficulty_level VARCHAR(20),
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id AS question_id,
    q.question_text,
    c.name AS category_name,
    q.difficulty_level,
    -- Calculate relevance score based on multiple factors
    (
      CASE
        -- Perfect audience match
        WHEN q.audience_filters IS NULL OR p_audience_type = ANY(q.audience_filters) THEN 20
        ELSE 0
      END +
      CASE
        -- Experience level match
        WHEN q.recommended_experience_level = p_experience_level THEN 15
        WHEN q.recommended_experience_level = 'none' THEN 10
        WHEN p_experience_level = 'advanced' THEN 12
        ELSE 5
      END +
      CASE
        -- Goal alignment (check if any tags match goals)
        WHEN p_goals && q.tags THEN 15
        ELSE 0
      END
    ) AS relevance_score
  FROM assessment_questions q
  JOIN assessment_categories c ON q.category_id = c.id
  WHERE q.is_active = true
    AND (
      q.audience_filters IS NULL
      OR p_audience_type = ANY(q.audience_filters)
    )
  ORDER BY relevance_score DESC, q.order_index ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION get_recommended_questions IS
'Returns recommended questions for a user based on their profile (audience, experience, goals). Questions are scored by relevance.';

-- Sample usage documentation
COMMENT ON TABLE assessment_questions IS
'Assessment questions with adaptive filtering support.

Example usage:
SELECT * FROM get_recommended_questions(
  p_audience_type := ''professional'',
  p_experience_level := ''intermediate'',
  p_goals := ARRAY[''automation'', ''productivity''],
  p_limit := 25
);

Difficulty Levels:
- foundational: Basic concepts, suitable for all
- applied: Practical usage questions
- advanced: Deep technical knowledge
- strategic: Business/leadership focus

Experience Levels:
- none: No prior AI tool experience
- basic: Tried a few tools occasionally
- intermediate: Regular AI tool user
- advanced: Proficient with multiple tools
';
