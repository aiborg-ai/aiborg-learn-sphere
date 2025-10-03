-- Fix for ambiguous column reference in record_adaptive_answer
-- Run this to fix the "column reference is_correct is ambiguous" error

DROP FUNCTION IF EXISTS record_adaptive_answer(UUID, UUID, UUID[], INTEGER);

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

  -- Get correct options and check answer (with table alias to avoid ambiguity)
  SELECT
    array_agg(opt.id),
    bool_and(opt.id = ANY(p_selected_options)) AND
    NOT EXISTS (
      SELECT 1 FROM unnest(p_selected_options) AS selected
      WHERE selected != ALL(array_agg(opt.id))
    )
  INTO v_correct_option_ids, v_is_correct
  FROM assessment_question_options opt
  WHERE opt.question_id = p_question_id AND opt.is_correct = true;

  -- Calculate points earned (with table alias)
  IF v_is_correct THEN
    SELECT COALESCE(SUM(opt.points), 0)
    INTO v_points
    FROM assessment_question_options opt
    WHERE opt.id = ANY(p_selected_options) AND opt.is_correct = true;
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

SELECT 'Function fixed - ambiguous column error resolved!' as status;
