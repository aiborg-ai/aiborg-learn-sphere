-- =====================================================
-- FIX ASSESSMENT HISTORY RLS POLICIES
-- =====================================================

-- First, let's check if there are ANY attempts in the table
SELECT
  'Total Attempts' as check_name,
  COUNT(*) as count,
  COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_count,
  COUNT(CASE WHEN is_completed = false THEN 1 END) as incomplete_count
FROM assessment_tool_attempts;

-- Check current RLS policies on assessment_tool_attempts
SELECT
  'Current RLS Policies' as check_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'assessment_tool_attempts';

-- Enable RLS if not already enabled
ALTER TABLE assessment_tool_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own attempts" ON assessment_tool_attempts;
DROP POLICY IF EXISTS "Users can create own attempts" ON assessment_tool_attempts;
DROP POLICY IF EXISTS "Users can update own incomplete attempts" ON assessment_tool_attempts;

-- Recreate policies with proper permissions
-- Policy 1: Users can view their own attempts
CREATE POLICY "Users can view own attempts"
  ON assessment_tool_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can create their own attempts
CREATE POLICY "Users can create own attempts"
  ON assessment_tool_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own attempts
CREATE POLICY "Users can update own attempts"
  ON assessment_tool_attempts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Verify the fix
SELECT
  'Verification' as check_name,
  COUNT(*) as total_attempts_visible
FROM assessment_tool_attempts;

-- Show sample of attempts (this will only show if user is logged in with correct permissions)
SELECT
  'Sample Attempts' as check_name,
  id,
  user_id,
  tool_id,
  attempt_number,
  score_percentage,
  is_completed,
  completed_at
FROM assessment_tool_attempts
ORDER BY created_at DESC
LIMIT 5;

-- ✅ DONE
SELECT '✅ RLS policies updated. Refresh browser and try again.' as message;
