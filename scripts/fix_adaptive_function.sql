-- Fix for get_next_adaptive_question function type mismatch
-- Run this after the main migration if you get a type error

DROP FUNCTION IF EXISTS get_next_adaptive_question(UUID, DECIMAL, UUID[], UUID);

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
    aq.opts
  FROM available_questions aq
  ORDER BY aq.match_score DESC
  LIMIT 1;

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

SELECT 'Function fixed successfully!' as status;
