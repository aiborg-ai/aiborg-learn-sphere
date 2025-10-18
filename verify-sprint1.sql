-- ============================================================================
-- SPRINT 1 VERIFICATION SCRIPT
-- ============================================================================
-- Run this script after deploying Sprint 1 migrations to verify everything
-- is working correctly.
-- ============================================================================

\echo '==========================================';
\echo 'Sprint 1 Deployment Verification';
\echo '==========================================';
\echo '';

-- ============================================================================
-- 1. Check Tables
-- ============================================================================
\echo '1. Checking Tables...';

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
)
ORDER BY table_name;

\echo 'Expected: 4 tables';
\echo '';

-- ============================================================================
-- 2. Check Views
-- ============================================================================
\echo '2. Checking Views...';

SELECT
  table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
AND (
  table_name LIKE '%team%'
  OR table_name LIKE '%member%'
  OR table_name LIKE '%assignment%'
)
ORDER BY table_name;

\echo 'Expected: 5 views (including team_dashboard_cache)';
\echo '';

-- ============================================================================
-- 3. Check Functions
-- ============================================================================
\echo '3. Checking Functions...';

SELECT
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'log_invitation_action',
  'expire_old_invitations',
  'accept_team_invitation',
  'auto_enroll_assigned_users',
  'sync_assignment_progress',
  'update_assignment_statistics',
  'mark_overdue_assignments',
  'get_top_performers',
  'get_department_comparison',
  'get_popular_courses',
  'get_learning_velocity',
  'refresh_team_analytics_cache'
)
ORDER BY routine_name;

\echo 'Expected: 12 functions';
\echo '';

-- ============================================================================
-- 4. Check RLS Status
-- ============================================================================
\echo '4. Checking RLS Status...';

SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
)
ORDER BY tablename;

\echo 'Expected: All tables should have RLS ENABLED';
\echo '';

-- ============================================================================
-- 5. Check RLS Policies
-- ============================================================================
\echo '5. Checking RLS Policies...';

SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
)
GROUP BY tablename
ORDER BY tablename;

\echo 'Expected: team_assignment_users: 5, team_course_assignments: 5,';
\echo '          team_invitation_history: 3, team_invitations: 5';
\echo '';

-- ============================================================================
-- 6. Check Indexes
-- ============================================================================
\echo '6. Checking Indexes...';

SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
)
ORDER BY tablename, indexname;

\echo 'Expected: Multiple indexes on each table';
\echo '';

-- ============================================================================
-- 7. Check Triggers
-- ============================================================================
\echo '7. Checking Triggers...';

SELECT
  event_object_table as table_name,
  trigger_name
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN (
  'team_invitations',
  'team_course_assignments',
  'team_assignment_users',
  'enrollments'
)
ORDER BY event_object_table, trigger_name;

\echo 'Expected: Several triggers for auto-logging and syncing';
\echo '';

-- ============================================================================
-- 8. Health Check Summary
-- ============================================================================
\echo '8. Health Check Summary...';

SELECT
  'Tables' as category,
  COUNT(*) as actual,
  4 as expected,
  CASE WHEN COUNT(*) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
)

UNION ALL

SELECT
  'Views',
  COUNT(*),
  5,
  CASE WHEN COUNT(*) >= 5 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM information_schema.views
WHERE table_schema = 'public'
AND (
  table_name LIKE '%team%'
  OR table_name LIKE '%member%'
  OR table_name LIKE '%assignment%'
)

UNION ALL

SELECT
  'Functions',
  COUNT(*),
  12,
  CASE WHEN COUNT(*) = 12 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'log_invitation_action',
  'expire_old_invitations',
  'accept_team_invitation',
  'auto_enroll_assigned_users',
  'sync_assignment_progress',
  'update_assignment_statistics',
  'mark_overdue_assignments',
  'get_top_performers',
  'get_department_comparison',
  'get_popular_courses',
  'get_learning_velocity',
  'refresh_team_analytics_cache'
)

UNION ALL

SELECT
  'RLS Policies',
  COUNT(*),
  18,
  CASE WHEN COUNT(*) = 18 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
);

\echo '';
\echo '==========================================';
\echo 'Verification Complete!';
\echo '==========================================';
\echo '';
\echo 'If all checks show ✅ PASS, your deployment';
\echo 'was successful!';
\echo '';
\echo 'Next: Test with sample data (see guide)';
