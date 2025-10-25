-- =====================================================
-- Complete Fix for Assessment Save Issues
-- Run this via Supabase Dashboard → SQL Editor
-- =====================================================

-- ============================================
-- PART 1: Fix assessment_tool_attempts RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own attempts" ON assessment_tool_attempts;
DROP POLICY IF EXISTS "Users can create own attempts" ON assessment_tool_attempts;
DROP POLICY IF EXISTS "Users can update own incomplete attempts" ON assessment_tool_attempts;
DROP POLICY IF EXISTS "Users can update own attempts" ON assessment_tool_attempts;

-- Recreate policies with correct permissions
CREATE POLICY "Users can view own attempts"
  ON assessment_tool_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attempts"
  ON assessment_tool_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts"
  ON assessment_tool_attempts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 2: Fix user_ai_assessments RLS
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE user_ai_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own assessments" ON user_ai_assessments;
DROP POLICY IF EXISTS "Users can create own assessments" ON user_ai_assessments;
DROP POLICY IF EXISTS "Users can update own assessments" ON user_ai_assessments;

-- Create policies for user_ai_assessments
CREATE POLICY "Users can view own assessments"
  ON user_ai_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessments"
  ON user_ai_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments"
  ON user_ai_assessments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 3: Fix get_attempt_history function
-- ============================================

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

-- ============================================
-- PART 4: Verify Setup
-- ============================================

-- Check RLS is enabled
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('assessment_tool_attempts', 'user_ai_assessments')
ORDER BY tablename;

-- List all policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('assessment_tool_attempts', 'user_ai_assessments')
ORDER BY tablename, cmd;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Assessment RLS policies have been fixed!';
  RAISE NOTICE '✅ Users can now:';
  RAISE NOTICE '   - Create assessment attempts';
  RAISE NOTICE '   - Update their own attempts';
  RAISE NOTICE '   - Complete assessments';
  RAISE NOTICE '   - View their assessment history';
  RAISE NOTICE '';
  RAISE NOTICE 'Test by taking an assessment now!';
END $$;
