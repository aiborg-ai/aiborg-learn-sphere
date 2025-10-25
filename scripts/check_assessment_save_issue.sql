-- =====================================================
-- Diagnostic Script: Check Assessment Save Issues
-- =====================================================

-- 1. Check if assessment_tool_attempts table exists
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'assessment_tool_attempts';

-- 2. Check RLS policies on assessment_tool_attempts
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'assessment_tool_attempts';

-- 3. Check if RLS is enabled
SELECT
  relname,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'assessment_tool_attempts';

-- 4. Test INSERT permission (this will show the actual error)
-- Replace 'YOUR_USER_ID' with actual user ID
/*
INSERT INTO assessment_tool_attempts (
  user_id,
  tool_id,
  attempt_number,
  is_completed,
  started_at
) VALUES (
  'YOUR_USER_ID'::UUID,
  (SELECT id FROM assessment_tools WHERE slug = 'ai-awareness' LIMIT 1),
  1,
  false,
  NOW()
) RETURNING id;
*/

-- 5. Check recent attempts (if any exist)
SELECT
  id,
  user_id,
  tool_id,
  attempt_number,
  is_completed,
  created_at,
  completed_at
FROM assessment_tool_attempts
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if user_ai_assessments table exists
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'user_ai_assessments';

-- 7. Check RLS policies on user_ai_assessments
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_ai_assessments';

-- 8. Check recent user_ai_assessments (if any exist)
SELECT
  id,
  user_id,
  tool_id,
  is_complete,
  created_at,
  completed_at
FROM user_ai_assessments
ORDER BY created_at DESC
LIMIT 10;

-- 9. Check assessment_tools table
SELECT
  id,
  slug,
  name,
  is_active
FROM assessment_tools
WHERE is_active = true
ORDER BY created_at;

-- 10. Check if the function get_attempt_history exists and its definition
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_attempt_history';
