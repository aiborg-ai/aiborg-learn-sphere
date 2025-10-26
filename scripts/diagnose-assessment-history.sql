-- =====================================================
-- Diagnostic Script for Assessment History Issue
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose the problem
-- Dashboard: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj

-- =====================================================
-- 1. CHECK IF ASSESSMENT ATTEMPTS DATA EXISTS
-- =====================================================
SELECT
  'Assessment Attempts Status' as check_name,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE is_completed = true) as completed_attempts,
  COUNT(*) FILTER (WHERE is_completed = false) as incomplete_attempts,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT tool_id) as unique_tools
FROM assessment_tool_attempts;

-- =====================================================
-- 2. CHECK RECENT COMPLETED ATTEMPTS
-- =====================================================
SELECT
  'Recent Completed Attempts' as check_name,
  id as attempt_id,
  user_id,
  tool_id,
  attempt_number,
  score_percentage,
  is_completed,
  completed_at
FROM assessment_tool_attempts
WHERE is_completed = true
ORDER BY completed_at DESC NULLS LAST
LIMIT 5;

-- =====================================================
-- 3. CHECK IF get_attempt_history FUNCTION EXISTS
-- =====================================================
SELECT
  'Function Exists' as check_name,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_attempt_history';

-- =====================================================
-- 4. CHECK FUNCTION PARAMETERS AND RETURN COLUMNS
-- =====================================================
SELECT
  'Function Signature' as check_name,
  ordinal_position,
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND routine_name = 'get_attempt_history'
ORDER BY ordinal_position;

-- =====================================================
-- 5. CHECK IF attempt_id IS IN RETURN TABLE
-- =====================================================
-- This should show attempt_id as one of the OUT parameters
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.parameters
      WHERE specific_schema = 'public'
        AND routine_name = 'get_attempt_history'
        AND parameter_name = 'attempt_id'
        AND parameter_mode = 'OUT'
    )
    THEN '✅ FIXED: attempt_id is present in function'
    ELSE '❌ BROKEN: attempt_id is MISSING from function - migration needed!'
  END as migration_status;

-- =====================================================
-- 6. GET SAMPLE DATA FOR TESTING
-- =====================================================
SELECT
  'Sample User for Testing' as check_name,
  user_id,
  tool_id,
  COUNT(*) as completed_attempts,
  MAX(completed_at) as latest_completion
FROM assessment_tool_attempts
WHERE is_completed = true
GROUP BY user_id, tool_id
ORDER BY latest_completion DESC NULLS LAST
LIMIT 1;

-- =====================================================
-- 7. TEST THE FUNCTION (if data exists)
-- =====================================================
-- Replace the UUIDs below with values from query #6 above
-- Uncomment and run after getting sample UUIDs:

/*
SELECT * FROM get_attempt_history(
  '<user_id_from_query_6>'::UUID,
  '<tool_id_from_query_6>'::UUID
);
*/

-- Expected output if FIXED:
--   attempt_id | attempt_number | score_percentage | ability_estimate | completed_at | time_taken_seconds | improvement_from_previous
-- Expected output if BROKEN:
--   Error: column "attempt_id" does not exist
--   OR
--   Missing attempt_id column in results

-- =====================================================
-- 8. CHECK RLS POLICIES
-- =====================================================
SELECT
  'RLS Policies' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'assessment_tool_attempts'
ORDER BY policyname;

-- =====================================================
-- 9. CHECK ASSESSMENT TOOLS TABLE
-- =====================================================
SELECT
  'Assessment Tools' as check_name,
  id,
  name,
  slug,
  category_type,
  is_active
FROM assessment_tools
ORDER BY display_order;

-- =====================================================
-- INTERPRETATION GUIDE
-- =====================================================
/*

SCENARIO 1: Migration NOT Applied
  - Query #5 shows: ❌ BROKEN
  - Query #4 doesn't show 'attempt_id' in OUT parameters
  - Action: Apply migration from ASSESSMENT_HISTORY_FIX.md

SCENARIO 2: Migration Applied, No Data
  - Query #5 shows: ✅ FIXED
  - Query #1 shows: 0 completed_attempts
  - Reason: Users haven't completed any assessments
  - Action: None needed - this is normal for new systems

SCENARIO 3: Migration Applied, Data Exists
  - Query #5 shows: ✅ FIXED
  - Query #1 shows: completed_attempts > 0
  - Query #7 returns data with attempt_id column
  - Expected: Frontend should work correctly
  - If still broken: Check frontend console for errors

SCENARIO 4: RLS Policy Blocking
  - Query #5 shows: ✅ FIXED
  - Query #1 shows: completed_attempts > 0
  - Query #7 returns empty results
  - Action: Check RLS policies in Query #8
  - Fix: Apply RLS fix from ASSESSMENT_HISTORY_FIX.md

*/
