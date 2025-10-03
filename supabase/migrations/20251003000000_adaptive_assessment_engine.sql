-- Adaptive Assessment Engine Migration
-- Implements IRT-based adaptive testing with real-time difficulty adjustment

-- =====================================================
-- 1. CREATE PERFORMANCE TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS assessment_answer_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES user_ai_assessments(id) ON DELETE CASCADE,
  question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
  answer_timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  question_difficulty DECIMAL(4,2), -- IRT difficulty at time of answer
  estimated_ability_before DECIMAL(4,2), -- Ability estimate before this question
  estimated_ability_after DECIMAL(4,2), -- Ability estimate after this question
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_answer_performance_assessment
  ON assessment_answer_performance(assessment_id);

CREATE INDEX IF NOT EXISTS idx_answer_performance_timestamp
  ON assessment_answer_performance(answer_timestamp);

COMMENT ON TABLE assessment_answer_performance IS
'Tracks real-time assessment performance for adaptive testing. Records answer correctness and ability estimates.';

-- =====================================================
-- 2. ADD IRT DIFFICULTY TO QUESTIONS
-- =====================================================

DO $$
BEGIN
  -- Add IRT difficulty column to assessment_questions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'irt_difficulty'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN irt_difficulty DECIMAL(4,2) DEFAULT 0.0;

    COMMENT ON COLUMN assessment_questions.irt_difficulty IS
    'IRT difficulty parameter. Range: -3.0 (very easy) to +3.0 (very hard), 0.0 = medium difficulty';
  END IF;

  -- Add difficulty_level if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE assessment_questions
    ADD COLUMN difficulty_level VARCHAR(20) DEFAULT 'medium';

    COMMENT ON COLUMN assessment_questions.difficulty_level IS
    'Human-readable difficulty level: easy, medium, hard';
  END IF;
END $$;

-- =====================================================
-- 3. ADD ADAPTIVE TRACKING COLUMNS TO ASSESSMENTS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'current_ability_estimate'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN current_ability_estimate DECIMAL(4,2) DEFAULT 0.0;

    COMMENT ON COLUMN user_ai_assessments.current_ability_estimate IS
    'Current ability estimate (theta) using IRT. Range: -3.0 (low) to +3.0 (high), 0.0 = average';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'ability_standard_error'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN ability_standard_error DECIMAL(4,2) DEFAULT 1.5;

    COMMENT ON COLUMN user_ai_assessments.ability_standard_error IS
    'Standard error of ability estimate. Lower = more confident. Typical range: 0.2-1.5';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'questions_answered_count'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN questions_answered_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'is_adaptive'
  ) THEN
    ALTER TABLE user_ai_assessments
    ADD COLUMN is_adaptive BOOLEAN DEFAULT true;

    COMMENT ON COLUMN user_ai_assessments.is_adaptive IS
    'Whether this assessment uses adaptive question selection';
  END IF;
END $$;

-- =====================================================
-- 4. FUNCTION: CALCULATE ABILITY ESTIMATE (Simplified IRT)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_ability_estimate(
  p_assessment_id UUID
)
RETURNS TABLE (
  ability_estimate DECIMAL(4,2),
  standard_error DECIMAL(4,2),
  confidence DECIMAL(5,2)
) AS $$
DECLARE
  v_correct_count INTEGER;
  v_total_count INTEGER;
  v_avg_difficulty DECIMAL(4,2);
  v_ability DECIMAL(4,2);
  v_se DECIMAL(4,2);
BEGIN
  -- Get performance statistics
  SELECT
    COUNT(*) FILTER (WHERE is_correct = true),
    COUNT(*),
    AVG(question_difficulty) FILTER (WHERE is_correct = true)
  INTO v_correct_count, v_total_count, v_avg_difficulty
  FROM assessment_answer_performance
  WHERE assessment_id = p_assessment_id;

  -- Handle edge cases
  IF v_total_count = 0 THEN
    RETURN QUERY SELECT 0.0::DECIMAL(4,2), 1.5::DECIMAL(4,2), 0.0::DECIMAL(5,2);
    RETURN;
  END IF;

  -- Simplified IRT ability estimation
  -- ability ≈ avg_difficulty_of_correct_answers + adjustment_for_success_rate
  v_ability := COALESCE(v_avg_difficulty, 0.0) +
               (v_correct_count::DECIMAL / v_total_count - 0.5) * 2.0;

  -- Clamp to valid range
  v_ability := GREATEST(-3.0, LEAST(3.0, v_ability));

  -- Calculate standard error (decreases with more questions)
  v_se := 1.5 / SQRT(v_total_count + 1);

  -- Return results
  RETURN QUERY SELECT
    v_ability,
    v_se,
    (1.0 - v_se / 1.5) * 100.0; -- Confidence percentage
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_ability_estimate IS
'Calculates user ability estimate using simplified IRT. Returns ability (-3 to +3), standard error, and confidence %.';

-- =====================================================
-- 5. FUNCTION: GET NEXT ADAPTIVE QUESTION
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
  options JSONB
) AS $$
DECLARE
  v_target_difficulty DECIMAL(4,2);
  v_difficulty_range DECIMAL(4,2) := 0.5; -- Search within ±0.5 of target
BEGIN
  -- Calculate target difficulty (slightly above current ability for optimal learning)
  v_target_difficulty := p_current_ability + 0.3;
  v_target_difficulty := GREATEST(-2.0, LEAST(2.5, v_target_difficulty));

  -- Select best matching question
  RETURN QUERY
  WITH available_questions AS (
    SELECT
      q.id,
      q.question_text,
      q.question_type,
      q.difficulty_level,
      COALESCE(q.irt_difficulty, 0.0) AS irt_diff,
      c.name AS cat_name,
      -- Calculate match score
      (
        -- Difficulty match (most important)
        50 - ABS(COALESCE(q.irt_difficulty, 0.0) - v_target_difficulty) * 25 +
        -- Category preference bonus
        CASE WHEN p_category_id IS NULL OR q.category_id = p_category_id THEN 10 ELSE 0 END +
        -- Random factor for variety
        RANDOM() * 5
      ) AS match_score,
      -- Get options as JSONB
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', opt.id,
            'option_text', opt.option_text,
            'option_value', opt.option_value,
            'points', opt.points,
            'description', opt.description,
            'is_correct', opt.is_correct,
            'order_index', opt.order_index
          ) ORDER BY opt.order_index
        )
        FROM assessment_question_options opt
        WHERE opt.question_id = q.id
      ) AS opts
    FROM assessment_questions q
    JOIN assessment_categories c ON q.category_id = c.id
    WHERE
      q.is_active = true
      AND q.id != ALL(p_answered_questions) -- Exclude already answered
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
    aq.opts
  FROM available_questions aq
  ORDER BY aq.match_score DESC
  LIMIT 1;

  -- If no question found in preferred range, widen search
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      q.id,
      q.question_text,
      q.question_type,
      q.difficulty_level,
      COALESCE(q.irt_difficulty, 0.0),
      c.name,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', opt.id,
            'option_text', opt.option_text,
            'option_value', opt.option_value,
            'points', opt.points,
            'description', opt.description,
            'is_correct', opt.is_correct,
            'order_index', opt.order_index
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

COMMENT ON FUNCTION get_next_adaptive_question IS
'Selects the next optimal question for adaptive testing based on current ability estimate. Uses IRT to maximize information gain.';

-- =====================================================
-- 6. FUNCTION: RECORD ANSWER AND UPDATE ABILITY
-- =====================================================

CREATE OR REPLACE FUNCTION record_adaptive_answer(
  p_assessment_id UUID,
  p_question_id UUID,
  p_selected_options UUID[],
  p_time_spent INTEGER DEFAULT NULL
)
RETURNS TABLE (
  is_correct BOOLEAN,
  points_earned INTEGER,
  new_ability_estimate DECIMAL(4,2),
  new_standard_error DECIMAL(4,2)
) AS $$
DECLARE
  v_is_correct BOOLEAN;
  v_points INTEGER := 0;
  v_question_difficulty DECIMAL(4,2);
  v_ability_before DECIMAL(4,2);
  v_ability_after DECIMAL(4,2);
  v_se_after DECIMAL(4,2);
  v_correct_option_ids UUID[];
BEGIN
  -- Get current ability estimate
  SELECT current_ability_estimate
  INTO v_ability_before
  FROM user_ai_assessments
  WHERE id = p_assessment_id;

  v_ability_before := COALESCE(v_ability_before, 0.0);

  -- Get question difficulty
  SELECT COALESCE(irt_difficulty, 0.0)
  INTO v_question_difficulty
  FROM assessment_questions
  WHERE id = p_question_id;

  -- Get correct options and check answer
  SELECT
    array_agg(id),
    bool_and(id = ANY(p_selected_options)) AND
    NOT EXISTS (
      SELECT 1 FROM unnest(p_selected_options) AS selected
      WHERE selected != ALL(array_agg(id))
    )
  INTO v_correct_option_ids, v_is_correct
  FROM assessment_question_options
  WHERE question_id = p_question_id AND is_correct = true;

  -- Calculate points earned
  IF v_is_correct THEN
    SELECT COALESCE(SUM(points), 0)
    INTO v_points
    FROM assessment_question_options
    WHERE id = ANY(p_selected_options) AND is_correct = true;
  END IF;

  -- Record performance
  INSERT INTO assessment_answer_performance (
    assessment_id,
    question_id,
    is_correct,
    time_spent_seconds,
    question_difficulty,
    estimated_ability_before
  ) VALUES (
    p_assessment_id,
    p_question_id,
    v_is_correct,
    p_time_spent,
    v_question_difficulty,
    v_ability_before
  );

  -- Update ability estimate
  SELECT ability_estimate, standard_error
  INTO v_ability_after, v_se_after
  FROM calculate_ability_estimate(p_assessment_id);

  -- Update performance record with new ability
  UPDATE assessment_answer_performance
  SET estimated_ability_after = v_ability_after
  WHERE assessment_id = p_assessment_id
    AND question_id = p_question_id
    AND estimated_ability_after IS NULL;

  -- Update assessment record
  UPDATE user_ai_assessments
  SET
    current_ability_estimate = v_ability_after,
    ability_standard_error = v_se_after,
    questions_answered_count = questions_answered_count + 1,
    total_score = COALESCE(total_score, 0) + v_points
  WHERE id = p_assessment_id;

  -- Return results
  RETURN QUERY SELECT
    v_is_correct,
    v_points,
    v_ability_after,
    v_se_after;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_adaptive_answer IS
'Records an answer, determines correctness, updates ability estimate, and returns new assessment state.';

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_questions_irt_difficulty
  ON assessment_questions(irt_difficulty)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_questions_difficulty_category
  ON assessment_questions(difficulty_level, category_id)
  WHERE is_active = true;

-- =====================================================
-- 8. SAMPLE DATA AND TESTING
-- =====================================================

-- Test the adaptive engine (commented out - uncomment to test)
/*
-- Test ability calculation
SELECT * FROM calculate_ability_estimate('[assessment-id-here]');

-- Test question selection
SELECT * FROM get_next_adaptive_question(
  '[assessment-id-here]',
  0.5, -- current ability
  ARRAY[]::UUID[] -- no answered questions yet
);

-- Test answer recording
SELECT * FROM record_adaptive_answer(
  '[assessment-id-here]',
  '[question-id-here]',
  ARRAY['[option-id-here]']::UUID[]
);
*/
