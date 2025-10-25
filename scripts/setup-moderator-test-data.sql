-- ========================================================
-- MODERATOR DASHBOARD TEST DATA SETUP
-- ========================================================
-- This script creates test data for the Moderator Dashboard
-- Replace placeholders with actual UUIDs from your database
-- ========================================================

-- Step 1: Make yourself a moderator
-- REPLACE 'YOUR_USER_ID' with your actual auth.users.id
INSERT INTO forum_moderators (user_id, category_id, assigned_by, permissions, is_active)
VALUES (
  'YOUR_USER_ID',           -- Your auth user ID
  NULL,                      -- NULL = global moderator (all categories)
  'YOUR_USER_ID',           -- Assigned by yourself (for testing)
  '{"delete": true, "edit": true, "pin": true, "lock": true, "ban": true, "warn": true}'::jsonb,
  true
)
ON CONFLICT (user_id, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid))
DO UPDATE SET
  permissions = EXCLUDED.permissions,
  is_active = true;

-- ========================================================
-- Step 2: Create test users for moderation scenarios
-- ========================================================

-- You'll need to create these users through the auth system first
-- Then insert their profiles

-- Test User 1: Spammer
-- (Create via Supabase Auth, then get the ID)
-- INSERT INTO profiles (id, email, full_name)
-- VALUES ('TEST_SPAMMER_ID', 'spammer@test.com', 'Test Spammer');

-- Test User 2: Harasser
-- INSERT INTO profiles (id, email, full_name)
-- VALUES ('TEST_HARASSER_ID', 'harasser@test.com', 'Test Harasser');

-- Test User 3: Banned User
-- INSERT INTO profiles (id, email, full_name)
-- VALUES ('TEST_BANNED_ID', 'banned@test.com', 'Test Banned User');

-- ========================================================
-- Step 3: Create test forum content
-- ========================================================

-- Get a category ID first
-- SELECT id, name FROM forum_categories LIMIT 5;

-- Create test thread from spammer
-- REPLACE 'CATEGORY_ID' and 'TEST_SPAMMER_ID' with actual values
/*
INSERT INTO forum_threads (category_id, user_id, title, content, is_deleted)
VALUES (
  'CATEGORY_ID',
  'TEST_SPAMMER_ID',
  'Buy Cheap Viagra - Best Prices!!!',
  'Click here for amazing deals! http://spam-site.com This is definitely spam content.',
  false
)
RETURNING id;
-- Note the returned thread ID for next step
*/

-- Create test post from harasser
/*
INSERT INTO forum_posts (thread_id, user_id, content, is_deleted)
VALUES (
  'THREAD_ID',
  'TEST_HARASSER_ID',
  'You are an idiot and everyone hates you. Go away!',
  false
)
RETURNING id;
-- Note the returned post ID for next step
*/

-- ========================================================
-- Step 4: Create pending reports
-- ========================================================

-- Report #1: Spam thread
-- REPLACE: YOUR_USER_ID, TEST_SPAMMER_ID, THREAD_ID
/*
INSERT INTO forum_reports (
  reporter_id,
  reported_user_id,
  reportable_type,
  reportable_id,
  reason,
  description,
  status
)
VALUES (
  'YOUR_USER_ID',           -- You are reporting
  'TEST_SPAMMER_ID',        -- The spammer
  'thread',
  'THREAD_ID',              -- The spam thread
  'spam',
  'This is obvious spam advertising medication',
  'pending'
);
*/

-- Report #2: Harassment post
/*
INSERT INTO forum_reports (
  reporter_id,
  reported_user_id,
  reportable_type,
  reportable_id,
  reason,
  description,
  status
)
VALUES (
  'YOUR_USER_ID',
  'TEST_HARASSER_ID',
  'post',
  'POST_ID',                -- The harassment post
  'harassment',
  'This user is harassing others with offensive language',
  'pending'
);
*/

-- Report #3: Off-topic post
/*
INSERT INTO forum_reports (
  reporter_id,
  reported_user_id,
  reportable_type,
  reportable_id,
  reason,
  description,
  status
)
VALUES (
  'YOUR_USER_ID',
  'TEST_SPAMMER_ID',
  'post',
  'POST_ID',
  'offtopic',
  'Completely unrelated to the discussion topic',
  'pending'
);
*/

-- ========================================================
-- Step 5: Create test bans
-- ========================================================

-- Ban #1: Temporary ban (7 days)
-- REPLACE: TEST_BANNED_ID, YOUR_USER_ID
/*
INSERT INTO forum_bans (
  user_id,
  banned_by,
  ban_type,
  reason,
  start_date,
  end_date,
  is_active,
  can_read,
  can_vote,
  notes
)
VALUES (
  'TEST_BANNED_ID',
  'YOUR_USER_ID',
  'temporary',
  'Repeated spamming after warnings',
  NOW(),
  NOW() + INTERVAL '7 days',
  true,
  true,
  false,
  'Third strike - auto-banned'
);
*/

-- Ban #2: Permanent ban
/*
INSERT INTO forum_bans (
  user_id,
  banned_by,
  ban_type,
  reason,
  start_date,
  end_date,
  is_active,
  can_read,
  can_vote,
  notes
)
VALUES (
  'TEST_SPAMMER_ID',
  'YOUR_USER_ID',
  'permanent',
  'Spam bot - multiple violations',
  NOW(),
  NULL,
  true,
  false,
  false,
  'Confirmed spam account'
);
*/

-- Ban #3: Shadow ban
/*
INSERT INTO forum_bans (
  user_id,
  banned_by,
  ban_type,
  reason,
  start_date,
  end_date,
  is_active,
  can_read,
  can_vote,
  notes
)
VALUES (
  'TEST_HARASSER_ID',
  'YOUR_USER_ID',
  'shadow',
  'Trolling and harassment',
  NOW(),
  NOW() + INTERVAL '14 days',
  true,
  true,
  true,
  'User can see content but posts are hidden from others'
);
*/

-- ========================================================
-- Step 6: Create test warnings
-- ========================================================

-- Warning #1: Low severity
/*
INSERT INTO forum_warnings (
  user_id,
  issued_by,
  severity,
  reason,
  description,
  is_acknowledged,
  auto_ban_threshold
)
VALUES (
  'TEST_HARASSER_ID',
  'YOUR_USER_ID',
  'low',
  'Minor language violation',
  'Please keep language family-friendly',
  true,
  3
);
*/

-- Warning #2: Medium severity
/*
INSERT INTO forum_warnings (
  user_id,
  issued_by,
  severity,
  reason,
  description,
  is_acknowledged,
  auto_ban_threshold
)
VALUES (
  'TEST_SPAMMER_ID',
  'YOUR_USER_ID',
  'medium',
  'Off-topic posting',
  'Stay on topic in discussions',
  false,
  3
);
*/

-- Warning #3: High severity
/*
INSERT INTO forum_warnings (
  user_id,
  issued_by,
  severity,
  reason,
  description,
  is_acknowledged,
  auto_ban_threshold
)
VALUES (
  'TEST_HARASSER_ID',
  'YOUR_USER_ID',
  'high',
  'Harassment of other users',
  'Second warning - next violation results in ban',
  false,
  3
);
*/

-- Warning #4: Critical severity
/*
INSERT INTO forum_warnings (
  user_id,
  issued_by,
  severity,
  reason,
  description,
  is_acknowledged,
  auto_ban_threshold
)
VALUES (
  'TEST_BANNED_ID',
  'YOUR_USER_ID',
  'critical',
  'Doxxing attempt',
  'Posting personal information of other users - final warning',
  false,
  3
);
*/

-- ========================================================
-- Step 7: Create moderator action history
-- ========================================================

-- Action #1: Delete thread
/*
INSERT INTO forum_moderator_actions (
  moderator_id,
  action_type,
  target_type,
  target_id,
  reason,
  details
)
VALUES (
  'YOUR_USER_ID',
  'delete_thread',
  'thread',
  'THREAD_ID',
  'Spam content',
  '{"deleted_posts": 5}'::jsonb
);
*/

-- Action #2: Warn user
/*
INSERT INTO forum_moderator_actions (
  moderator_id,
  action_type,
  target_type,
  target_id,
  reason,
  details
)
VALUES (
  'YOUR_USER_ID',
  'warn_user',
  'user',
  'TEST_HARASSER_ID',
  'Harassment',
  '{"severity": "high", "warning_count": 2}'::jsonb
);
*/

-- Action #3: Ban user
/*
INSERT INTO forum_moderator_actions (
  moderator_id,
  action_type,
  target_type,
  target_id,
  reason,
  details
)
VALUES (
  'YOUR_USER_ID',
  'ban_user',
  'user',
  'TEST_SPAMMER_ID',
  'Spam bot',
  '{"ban_type": "permanent"}'::jsonb
);
*/

-- ========================================================
-- Verification Queries
-- ========================================================

-- Check if you're a moderator
SELECT
  fm.*,
  p.email,
  p.full_name,
  fc.name as category_name
FROM forum_moderators fm
LEFT JOIN profiles p ON fm.user_id = p.id
LEFT JOIN forum_categories fc ON fm.category_id = fc.id
WHERE fm.is_active = true;

-- Check pending reports
SELECT
  fr.*,
  reporter.email as reporter_email,
  reported.email as reported_email
FROM forum_reports fr
LEFT JOIN profiles reporter ON fr.reporter_id = reporter.id
LEFT JOIN profiles reported ON fr.reported_user_id = reported.id
WHERE fr.status = 'pending'
ORDER BY fr.created_at DESC;

-- Check active bans
SELECT
  fb.*,
  banned_user.email as banned_email,
  moderator.email as moderator_email
FROM forum_bans fb
LEFT JOIN profiles banned_user ON fb.user_id = banned_user.id
LEFT JOIN profiles moderator ON fb.banned_by = moderator.id
WHERE fb.is_active = true
ORDER BY fb.created_at DESC;

-- Check recent warnings
SELECT
  fw.*,
  warned_user.email as warned_email,
  moderator.email as moderator_email
FROM forum_warnings fw
LEFT JOIN profiles warned_user ON fw.user_id = warned_user.id
LEFT JOIN profiles moderator ON fw.issued_by = moderator.id
ORDER BY fw.created_at DESC
LIMIT 10;

-- Check moderator actions
SELECT
  fma.*,
  moderator.email as moderator_email
FROM forum_moderator_actions fma
LEFT JOIN profiles moderator ON fma.moderator_id = moderator.id
ORDER BY fma.created_at DESC
LIMIT 20;

-- ========================================================
-- Quick Test Data Cleanup
-- ========================================================

-- WARNING: Only run these if you want to remove ALL test data

-- Delete all test reports
-- DELETE FROM forum_reports WHERE reporter_id = 'YOUR_USER_ID';

-- Delete all test bans
-- DELETE FROM forum_bans WHERE banned_by = 'YOUR_USER_ID';

-- Delete all test warnings
-- DELETE FROM forum_warnings WHERE issued_by = 'YOUR_USER_ID';

-- Delete all test actions
-- DELETE FROM forum_moderator_actions WHERE moderator_id = 'YOUR_USER_ID';

-- Remove yourself as moderator
-- DELETE FROM forum_moderators WHERE user_id = 'YOUR_USER_ID';

-- ========================================================
-- END OF SCRIPT
-- ========================================================

-- INSTRUCTIONS:
-- 1. Replace all 'YOUR_USER_ID' with your actual auth.users.id
-- 2. Create test users via Supabase Auth dashboard
-- 3. Get a category_id from forum_categories table
-- 4. Uncomment sections one at a time
-- 5. Run each section and note the returned IDs
-- 6. Use those IDs in subsequent sections
-- 7. Run verification queries to confirm data
-- 8. Navigate to /admin → Moderation tab to see results
