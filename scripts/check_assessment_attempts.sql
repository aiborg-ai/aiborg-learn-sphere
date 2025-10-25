-- =====================================================
-- CHECK ASSESSMENT ATTEMPTS - DIAGNOSTIC ONLY
-- =====================================================

-- 1. Check if there are ANY attempts in the table
SELECT
  '1. Total Attempts in Database' as check_name,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN is_completed = true THEN 1 END) as completed,
  COUNT(CASE WHEN is_completed = false THEN 1 END) as incomplete
FROM assessment_tool_attempts;

-- 2. Check current RLS status
SELECT
  '2. RLS Status' as check_name,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'assessment_tool_attempts';

-- 3. Check existing RLS policies
SELECT
  '3. Current RLS Policies' as check_name,
  policyname,
  permissive,
  ARRAY_TO_STRING(roles, ', ') as roles,
  cmd as operation,
  SUBSTRING(qual::text, 1, 100) as condition
FROM pg_policies
WHERE tablename = 'assessment_tool_attempts'
ORDER BY policyname;

-- 4. Show all attempts (this query will work even with RLS because we're running as admin)
SELECT
  '4. All Attempts in Table' as check_name,
  id,
  user_id,
  tool_id,
  attempt_number,
  score_percentage,
  is_completed,
  completed_at,
  created_at
FROM assessment_tool_attempts
ORDER BY created_at DESC;

-- 5. Check assessment tools table
SELECT
  '5. Assessment Tools' as check_name,
  id,
  name,
  slug,
  is_active
FROM assessment_tools
WHERE is_active = true
ORDER BY display_order;
