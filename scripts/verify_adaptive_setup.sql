-- Verification script to check if adaptive assessment is set up correctly

-- Check if columns exist
SELECT
  'Checking columns...' as step,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_questions' AND column_name = 'irt_difficulty'
  ) as irt_difficulty_exists,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_assessments' AND column_name = 'current_ability_estimate'
  ) as ability_estimate_exists;

-- Check if tables exist
SELECT
  'Checking tables...' as step,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'assessment_answer_performance'
  ) as performance_table_exists;

-- Check if functions exist
SELECT
  'Checking functions...' as step,
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_next_adaptive_question'
  ) as get_next_question_exists,
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'record_adaptive_answer'
  ) as record_answer_exists,
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'calculate_ability_estimate'
  ) as calculate_ability_exists;

-- Summary
SELECT
  'Summary' as step,
  CASE
    WHEN (
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_questions' AND column_name = 'irt_difficulty')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_answer_performance')
      AND EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'record_adaptive_answer')
    ) THEN '✅ Adaptive assessment is properly set up'
    ELSE '❌ Adaptive assessment is NOT set up - run the migration scripts'
  END as status;
