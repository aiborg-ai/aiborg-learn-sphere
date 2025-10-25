-- =====================================================
-- Fix RLS policy to allow users to complete their own attempts
-- =====================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update own incomplete attempts" ON assessment_tool_attempts;

-- Create new policy that allows users to update their own attempts (complete or incomplete)
CREATE POLICY "Users can update own attempts"
  ON assessment_tool_attempts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own attempts" ON assessment_tool_attempts IS
'Allows users to update their own attempts, including marking them as completed';
