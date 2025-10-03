-- Enhanced Question Types Migration
-- Adds support for multimedia scenarios, drag-drop, code evaluation, and case studies

-- =====================================================
-- 1. EXTEND QUESTION TYPES
-- =====================================================

-- Add new question type enum values
DO $$
BEGIN
  -- Check if custom type exists, if not we'll add values to the column constraint
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type_enum') THEN
    -- Add new enum values if type exists
    ALTER TYPE question_type_enum ADD VALUE IF NOT EXISTS 'scenario_multimedia';
    ALTER TYPE question_type_enum ADD VALUE IF NOT EXISTS 'drag_drop_ranking';
    ALTER TYPE question_type_enum ADD VALUE IF NOT EXISTS 'drag_drop_ordering';
    ALTER TYPE question_type_enum ADD VALUE IF NOT EXISTS 'code_evaluation';
    ALTER TYPE question_type_enum ADD VALUE IF NOT EXISTS 'case_study';
  END IF;
END $$;

-- =====================================================
-- 2. ADD MULTIMEDIA SUPPORT TO QUESTIONS
-- =====================================================

DO $$
BEGIN
  -- Add media fields to assessment_questions table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN media_type VARCHAR(20); -- 'image', 'video', 'audio', 'document'

    COMMENT ON COLUMN assessment_questions.media_type IS
    'Type of media attached to question: image, video, audio, document';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'media_url'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN media_url TEXT;

    COMMENT ON COLUMN assessment_questions.media_url IS
    'URL or Supabase Storage path to media resource';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'media_caption'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN media_caption TEXT;

    COMMENT ON COLUMN assessment_questions.media_caption IS
    'Caption or description for accessibility';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'scenario_context'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN scenario_context TEXT;

    COMMENT ON COLUMN assessment_questions.scenario_context IS
    'Rich text scenario description for scenario-based questions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'code_snippet'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN code_snippet TEXT;

    COMMENT ON COLUMN assessment_questions.code_snippet IS
    'Code snippet for code evaluation questions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'code_language'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN code_language VARCHAR(50);

    COMMENT ON COLUMN assessment_questions.code_language IS
    'Programming language for syntax highlighting (e.g., python, javascript, sql)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'case_study_data'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN case_study_data JSONB;

    COMMENT ON COLUMN assessment_questions.case_study_data IS
    'Structured case study data including background, challenges, metrics, etc.';
  END IF;
END $$;

-- =====================================================
-- 3. ENHANCE OPTIONS FOR DRAG-DROP
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_question_options' AND column_name = 'correct_position'
  ) THEN
    ALTER TABLE assessment_question_options
    ADD COLUMN correct_position INTEGER;

    COMMENT ON COLUMN assessment_question_options.correct_position IS
    'For drag-drop ranking/ordering: the correct position/rank (1-indexed)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_question_options' AND column_name = 'option_image_url'
  ) THEN
    ALTER TABLE assessment_question_options
    ADD COLUMN option_image_url TEXT;

    COMMENT ON COLUMN assessment_question_options.option_image_url IS
    'Image URL for visual options in drag-drop questions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

    COMMENT ON COLUMN assessment_questions.metadata IS
    'Flexible metadata for question-specific configuration (e.g., time limits, hints, explanations)';
  END IF;
END $$;

-- =====================================================
-- 4. CREATE FUNCTION: VALIDATE DRAG-DROP ANSWER
-- =====================================================

CREATE OR REPLACE FUNCTION validate_drag_drop_answer(
  p_question_id UUID,
  p_user_ordering UUID[] -- Array of option IDs in user's order
)
RETURNS TABLE (
  is_correct BOOLEAN,
  points_earned INTEGER,
  correct_ordering UUID[],
  position_scores JSONB
) AS $$
DECLARE
  v_correct_ordering UUID[];
  v_is_perfect_match BOOLEAN;
  v_points INTEGER := 0;
  v_max_points INTEGER := 0;
  v_position_scores JSONB := '[]'::jsonb;
  v_option RECORD;
  v_user_position INTEGER;
BEGIN
  -- Get correct ordering
  SELECT array_agg(id ORDER BY correct_position)
  INTO v_correct_ordering
  FROM assessment_question_options
  WHERE question_id = p_question_id
    AND correct_position IS NOT NULL;

  -- Calculate max points
  SELECT COALESCE(SUM(points), 0)
  INTO v_max_points
  FROM assessment_question_options
  WHERE question_id = p_question_id;

  -- Check if perfect match
  v_is_perfect_match := (p_user_ordering = v_correct_ordering);

  IF v_is_perfect_match THEN
    v_points := v_max_points;
  ELSE
    -- Award partial credit for correct positions
    FOR v_option IN
      SELECT id, correct_position, points
      FROM assessment_question_options
      WHERE question_id = p_question_id
        AND correct_position IS NOT NULL
      ORDER BY correct_position
    LOOP
      -- Find position in user's ordering
      v_user_position := array_position(p_user_ordering, v_option.id);

      IF v_user_position = v_option.correct_position THEN
        -- Correct position - award full points for this item
        v_points := v_points + v_option.points;

        v_position_scores := v_position_scores || jsonb_build_object(
          'option_id', v_option.id,
          'correct_position', v_option.correct_position,
          'user_position', v_user_position,
          'is_correct', true,
          'points', v_option.points
        );
      ELSE
        -- Incorrect position - no points
        v_position_scores := v_position_scores || jsonb_build_object(
          'option_id', v_option.id,
          'correct_position', v_option.correct_position,
          'user_position', v_user_position,
          'is_correct', false,
          'points', 0
        );
      END IF;
    END LOOP;
  END IF;

  RETURN QUERY SELECT
    v_is_perfect_match,
    v_points,
    v_correct_ordering,
    v_position_scores;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_drag_drop_answer IS
'Validates drag-and-drop answers by comparing user ordering with correct positions. Awards partial credit.';

-- =====================================================
-- 5. CREATE FUNCTION: VALIDATE CODE EVALUATION
-- =====================================================

CREATE OR REPLACE FUNCTION validate_code_evaluation(
  p_question_id UUID,
  p_selected_options UUID[] -- Multiple choice options about the code
)
RETURNS TABLE (
  is_correct BOOLEAN,
  points_earned INTEGER,
  correct_options UUID[]
) AS $$
DECLARE
  v_correct_options UUID[];
  v_is_correct BOOLEAN;
  v_points INTEGER := 0;
BEGIN
  -- Get correct options
  SELECT array_agg(id)
  INTO v_correct_options
  FROM assessment_question_options
  WHERE question_id = p_question_id
    AND is_correct = true;

  -- Check if answer is correct
  -- For code evaluation, usually looking for exact match or subset match
  v_is_correct := (
    p_selected_options <@ v_correct_options AND
    v_correct_options <@ p_selected_options
  );

  IF v_is_correct THEN
    SELECT COALESCE(SUM(points), 0)
    INTO v_points
    FROM assessment_question_options
    WHERE id = ANY(p_selected_options)
      AND is_correct = true;
  END IF;

  RETURN QUERY SELECT
    v_is_correct,
    v_points,
    v_correct_options;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_code_evaluation IS
'Validates code evaluation questions where users analyze code snippets and select correct interpretations.';

-- =====================================================
-- 6. UPDATE ADAPTIVE QUESTION FUNCTION FOR NEW TYPES
-- =====================================================

CREATE OR REPLACE FUNCTION get_next_adaptive_question(
  p_assessment_id UUID,
  p_current_ability DECIMAL(4,2) DEFAULT 0.0,
  p_answered_questions UUID[] DEFAULT ARRAY[]::UUID[],
  p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  question_type VARCHAR(50),
  difficulty_level VARCHAR(20),
  irt_difficulty DECIMAL(4,2),
  category_name VARCHAR(100),
  -- New fields for enhanced questions
  media_type VARCHAR(20),
  media_url TEXT,
  media_caption TEXT,
  scenario_context TEXT,
  code_snippet TEXT,
  code_language VARCHAR(50),
  case_study_data JSONB,
  metadata JSONB,
  options JSONB
) AS $$
DECLARE
  v_target_difficulty DECIMAL(4,2);
  v_difficulty_range DECIMAL(4,2) := 0.5;
BEGIN
  v_target_difficulty := p_current_ability + 0.3;
  v_target_difficulty := GREATEST(-2.0, LEAST(2.5, v_target_difficulty));

  RETURN QUERY
  WITH available_questions AS (
    SELECT
      q.id,
      q.question_text,
      q.question_type,
      q.difficulty_level,
      COALESCE(q.irt_difficulty, 0.0) AS irt_diff,
      c.name AS cat_name,
      q.media_type,
      q.media_url,
      q.media_caption,
      q.scenario_context,
      q.code_snippet,
      q.code_language,
      q.case_study_data,
      COALESCE(q.metadata, '{}'::jsonb) AS q_metadata,
      (
        50 - ABS(COALESCE(q.irt_difficulty, 0.0) - v_target_difficulty) * 25 +
        CASE WHEN p_category_id IS NULL OR q.category_id = p_category_id THEN 10 ELSE 0 END +
        RANDOM() * 5
      ) AS match_score,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', opt.id,
            'option_text', opt.option_text,
            'option_value', opt.option_value,
            'points', opt.points,
            'description', opt.description,
            'is_correct', opt.is_correct,
            'order_index', opt.order_index,
            'correct_position', opt.correct_position,
            'option_image_url', opt.option_image_url
          ) ORDER BY opt.order_index
        )
        FROM assessment_question_options opt
        WHERE opt.question_id = q.id
      ) AS opts
    FROM assessment_questions q
    JOIN assessment_categories c ON q.category_id = c.id
    WHERE
      q.is_active = true
      AND q.id != ALL(p_answered_questions)
      AND COALESCE(q.irt_difficulty, 0.0) BETWEEN
          (v_target_difficulty - v_difficulty_range) AND
          (v_target_difficulty + v_difficulty_range)
  )
  SELECT
    aq.id,
    aq.question_text,
    aq.question_type,
    aq.difficulty_level,
    aq.irt_diff,
    aq.cat_name,
    aq.media_type,
    aq.media_url,
    aq.media_caption,
    aq.scenario_context,
    aq.code_snippet,
    aq.code_language,
    aq.case_study_data,
    aq.q_metadata,
    aq.opts
  FROM available_questions aq
  ORDER BY aq.match_score DESC
  LIMIT 1;

  -- Fallback if no questions found in range
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      q.id,
      q.question_text,
      q.question_type,
      q.difficulty_level,
      COALESCE(q.irt_difficulty, 0.0),
      c.name,
      q.media_type,
      q.media_url,
      q.media_caption,
      q.scenario_context,
      q.code_snippet,
      q.code_language,
      q.case_study_data,
      COALESCE(q.metadata, '{}'::jsonb),
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', opt.id,
            'option_text', opt.option_text,
            'option_value', opt.option_value,
            'points', opt.points,
            'description', opt.description,
            'is_correct', opt.is_correct,
            'order_index', opt.order_index,
            'correct_position', opt.correct_position,
            'option_image_url', opt.option_image_url
          ) ORDER BY opt.order_index
        )
        FROM assessment_question_options opt
        WHERE opt.question_id = q.id
      )
    FROM assessment_questions q
    JOIN assessment_categories c ON q.category_id = c.id
    WHERE
      q.is_active = true
      AND q.id != ALL(p_answered_questions)
    ORDER BY RANDOM()
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_questions_question_type
  ON assessment_questions(question_type)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_questions_media_type
  ON assessment_questions(media_type)
  WHERE is_active = true AND media_type IS NOT NULL;

-- =====================================================
-- 8. INSERT SAMPLE ENHANCED QUESTIONS
-- =====================================================

-- Note: These are examples - you'll want to customize with real content
-- Sample Scenario-based question with image
INSERT INTO assessment_questions (
  question_text,
  question_type,
  difficulty_level,
  irt_difficulty,
  category_id,
  media_type,
  media_url,
  media_caption,
  scenario_context,
  is_active,
  metadata
)
SELECT
  'Based on the workflow diagram shown, which AI tool would be most effective for automating this process?',
  'scenario_multimedia',
  'applied',
  0.5,
  id,
  'image',
  '/assets/sample-workflow.png',
  'Business process workflow diagram showing manual data entry steps',
  'Your company currently processes customer orders manually. The workflow involves: 1) Receiving email orders, 2) Manually entering data into spreadsheet, 3) Checking inventory, 4) Creating invoices, 5) Sending confirmation emails. This takes 2-3 hours per day.',
  true,
  '{"time_limit_seconds": 120, "hints": ["Think about automation for repetitive tasks", "Consider email and spreadsheet tools"]}'::jsonb
FROM assessment_categories
WHERE name = 'Automation'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample code evaluation question
INSERT INTO assessment_questions (
  question_text,
  question_type,
  difficulty_level,
  irt_difficulty,
  category_id,
  code_snippet,
  code_language,
  is_active,
  metadata
)
SELECT
  'What will this AI-assisted code do when executed?',
  'code_evaluation',
  'advanced',
  1.2,
  id,
  E'# Using OpenAI API for text summarization\nimport openai\n\ndef summarize_text(text, max_words=50):\n    response = openai.ChatCompletion.create(\n        model="gpt-3.5-turbo",\n        messages=[{\n            "role": "user",\n            "content": f"Summarize in {max_words} words: {text}"\n        }]\n    )\n    return response.choices[0].message.content',
  'python',
  true,
  '{"time_limit_seconds": 180, "explanation": "This code uses OpenAI API to create concise summaries of longer texts."}'::jsonb
FROM assessment_categories
WHERE name = 'Development & Coding'
LIMIT 1
ON CONFLICT DO NOTHING;

COMMENT ON TABLE assessment_questions IS
'Enhanced to support multimedia scenarios, code evaluation, drag-drop, and case studies for advanced assessments.';
