-- =====================================================
-- Fix get_attempt_history to include attempt ID
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_attempt_history(UUID, UUID);

-- Recreate with attempt_id included
CREATE OR REPLACE FUNCTION get_attempt_history(
  p_user_id UUID,
  p_tool_id UUID
)
RETURNS TABLE (
  attempt_id UUID,
  attempt_number INTEGER,
  score_percentage DECIMAL,
  ability_estimate DECIMAL,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  improvement_from_previous DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id as attempt_id,
    a.attempt_number,
    a.score_percentage,
    a.ability_estimate,
    a.completed_at,
    a.time_taken_seconds,
    (a.score_percentage - LAG(a.score_percentage) OVER (ORDER BY a.attempt_number)) as improvement_from_previous
  FROM assessment_tool_attempts a
  WHERE a.user_id = p_user_id
    AND a.tool_id = p_tool_id
    AND a.is_completed = true
  ORDER BY a.attempt_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_attempt_history IS 'Returns complete attempt history with IDs, score trends and improvement metrics';
