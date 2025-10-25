DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'cognitive_level'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN cognitive_level VARCHAR(20) DEFAULT 'understand';

    COMMENT ON COLUMN assessment_questions.cognitive_level IS
    'Bloom''s Taxonomy cognitive level: remember, understand, apply, analyze, evaluate, create';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_question_options' AND column_name = 'is_correct'
  ) THEN
    ALTER TABLE assessment_question_options
    ADD COLUMN is_correct BOOLEAN DEFAULT false;

    COMMENT ON COLUMN assessment_question_options.is_correct IS
    'Indicates if this option is a correct answer';
  END IF;
END $$;

UPDATE assessment_question_options
SET is_correct = true
WHERE points > 0 AND is_correct IS NULL;
