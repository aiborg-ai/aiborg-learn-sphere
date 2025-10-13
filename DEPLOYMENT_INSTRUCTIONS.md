# Quiz, Exercise & Workshop System - Deployment Instructions

**Date:** 2025-10-13 **Status:** Ready for Deployment **Estimated Time:** 30-45 minutes

---

## 🎯 Pre-Deployment Checklist

### Prerequisites

- [ ] Supabase project access (admin credentials)
- [ ] Database backup completed
- [ ] Staging environment available (recommended)
- [ ] Vercel project access
- [ ] Git repository access

### Required Information

- **Supabase Project URL:** `https://[your-project].supabase.co`
- **Database Host:** `aws-0-ap-south-1.pooler.supabase.com`
- **Database Name:** `postgres`
- **Database User:** `postgres.[your-project-id]`
- **Database Password:** [From Supabase Dashboard]

---

## 📋 Step-by-Step Deployment

### Step 1: Backup Production Database ⚠️

**CRITICAL: Always backup before migrations!**

```bash
# Option A: Using Supabase Dashboard
# 1. Go to Supabase Dashboard
# 2. Navigate to Database → Backups
# 3. Click "Create Backup"
# 4. Wait for completion

# Option B: Using pg_dump (if you have direct access)
pg_dump -h aws-0-ap-south-1.pooler.supabase.com \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -f backup_quiz_system_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file exists and has content
ls -lh backup_quiz_system_*.sql
```

---

### Step 2: Review Migration File

**Migration File:** `supabase/migrations/20251013000000_quizzes_exercises_workshops.sql`

**What it contains:**

- 12 new tables (quiz, exercise, workshop systems)
- 15 performance indexes
- RLS policies for all tables
- Helper functions (calculate_quiz_score, award_activity_points)
- Triggers for auto-timestamps

**Verify the file:**

```bash
# Check file exists
ls -l supabase/migrations/20251013000000_quizzes_exercises_workshops.sql

# Count lines (should be ~650)
wc -l supabase/migrations/20251013000000_quizzes_exercises_workshops.sql

# Quick syntax check (optional)
head -50 supabase/migrations/20251013000000_quizzes_exercises_workshops.sql
```

---

### Step 3: Test on Staging (Recommended) 🧪

**If you have a staging environment:**

```bash
# Set staging credentials
export STAGING_HOST="your-staging-host"
export STAGING_DB="postgres"
export STAGING_USER="postgres.your-staging-id"
export PGPASSWORD="your-staging-password"

# Run migration on staging
psql -h $STAGING_HOST \
  -U $STAGING_USER \
  -d $STAGING_DB \
  -f supabase/migrations/20251013000000_quizzes_exercises_workshops.sql

# Verify tables were created
psql -h $STAGING_HOST \
  -U $STAGING_USER \
  -d $STAGING_DB \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE 'quiz%' OR table_name LIKE 'exercise%' OR table_name LIKE 'workshop%');"

# Expected output: 12 tables
# quiz_banks, quiz_questions, quiz_options, quiz_attempts, quiz_responses
# exercises, exercise_submissions
# workshops, workshop_sessions, workshop_participants, workshop_stage_submissions, workshop_activities
```

---

### Step 4: Run Migration on Production 🚀

**IMPORTANT: Run during low-traffic period!**

#### Option A: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to: `https://app.supabase.com/project/[your-project]/sql`

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy Migration SQL**

   ```bash
   # Open the migration file
   cat supabase/migrations/20251013000000_quizzes_exercises_workshops.sql
   ```

   - Copy entire contents
   - Paste into Supabase SQL Editor

4. **Execute**
   - Click "Run" button
   - Wait for completion (should take 5-10 seconds)
   - Check for any error messages

5. **Verify Success**
   - Run this verification query in SQL Editor:

   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema='public'
   AND (table_name LIKE 'quiz%'
     OR table_name LIKE 'exercise%'
     OR table_name LIKE 'workshop%')
   ORDER BY table_name;
   ```

   - Should return 12 rows

#### Option B: Using psql Command Line

```bash
# Set production credentials
export PGHOST="aws-0-ap-south-1.pooler.supabase.com"
export PGPORT="5432"
export PGDATABASE="postgres"
export PGUSER="postgres.afrulkxxzcmngbrdfuzj"
export PGPASSWORD="hirendra\$1234ABCD"

# Run migration
psql -f supabase/migrations/20251013000000_quizzes_exercises_workshops.sql

# Verify
psql -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE 'quiz%' OR table_name LIKE 'exercise%' OR table_name LIKE 'workshop%');"
```

**Expected Output:**

```
 table_count
-------------
          12
(1 row)
```

---

### Step 5: Verify Database Schema ✅

Run these verification queries in Supabase SQL Editor:

```sql
-- 1. Check all tables exist
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema='public'
AND (table_name LIKE 'quiz%' OR table_name LIKE 'exercise%' OR table_name LIKE 'workshop%')
ORDER BY table_name;

-- 2. Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND (tablename LIKE 'quiz%' OR tablename LIKE 'exercise%' OR tablename LIKE 'workshop%');
-- All should show 't' (true) for rowsecurity

-- 3. Check indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND (tablename LIKE 'quiz%' OR tablename LIKE 'exercise%' OR tablename LIKE 'workshop%')
ORDER BY tablename, indexname;
-- Should show 15+ indexes

-- 4. Verify functions exist
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN ('calculate_quiz_score', 'award_activity_points', 'update_updated_at_column');
-- Should return 3 functions

-- 5. Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename LIKE 'quiz%' OR tablename LIKE 'exercise%' OR tablename LIKE 'workshop%')
ORDER BY tablename;
-- Should return 20+ policies
```

---

### Step 6: Create Sample Quiz Data 📝

**Create a test quiz to verify system works:**

```sql
-- 1. Create a test quiz bank
INSERT INTO quiz_banks (
  course_id,
  title,
  description,
  difficulty_level,
  pass_percentage,
  time_limit_minutes,
  max_attempts,
  is_published
) VALUES (
  1, -- Replace with actual course_id
  'Test Quiz: System Verification',
  'This is a test quiz to verify the quiz system is working correctly',
  'beginner',
  70,
  10,
  3,
  true
) RETURNING id;

-- Copy the returned ID for next steps
-- Let's say it returns: '550e8400-e29b-41d4-a716-446655440000'

-- 2. Add a multiple choice question
INSERT INTO quiz_questions (
  quiz_bank_id,
  question_text,
  question_type,
  points,
  explanation,
  order_index
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', -- Use ID from step 1
  'What is 2 + 2?',
  'multiple_choice',
  1,
  '2 + 2 equals 4',
  0
) RETURNING id;

-- Copy the returned question ID
-- Let's say it returns: '660e8400-e29b-41d4-a716-446655440001'

-- 3. Add options for the question
INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '3', false, 0),
  ('660e8400-e29b-41d4-a716-446655440001', '4', true, 1),
  ('660e8400-e29b-41d4-a716-446655440001', '5', false, 2),
  ('660e8400-e29b-41d4-a716-446655440001', '6', false, 3);

-- 4. Add a true/false question
INSERT INTO quiz_questions (
  quiz_bank_id,
  question_text,
  question_type,
  points,
  explanation,
  order_index
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'The sky is blue.',
  'true_false',
  1,
  'Yes, the sky appears blue due to Rayleigh scattering',
  1
) RETURNING id;

-- Copy the returned ID
-- Let's say: '660e8400-e29b-41d4-a716-446655440002'

-- 5. Add true/false options
INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
  ('660e8400-e29b-41d4-a716-446655440002', 'True', true, 0),
  ('660e8400-e29b-41d4-a716-446655440002', 'False', false, 1);

-- 6. Verify the quiz was created
SELECT
  qb.title,
  qb.is_published,
  COUNT(qq.id) as question_count,
  SUM(qq.points) as total_points
FROM quiz_banks qb
LEFT JOIN quiz_questions qq ON qq.quiz_bank_id = qb.id
WHERE qb.title = 'Test Quiz: System Verification'
GROUP BY qb.id, qb.title, qb.is_published;

-- Should show: 1 quiz, 2 questions, 2 total points
```

---

### Step 7: Deploy Frontend to Vercel 🌐

**Your frontend code is already ready! Just need to commit and push:**

```bash
# 1. Stage all changes
git add .

# 2. Create commit
git commit -m "feat: complete quiz system implementation

- Added database migration for quiz, exercise, workshop tables
- Implemented QuizService and QuizAttemptService
- Created custom React hooks for quiz data management
- Built comprehensive UI components (QuizTaker, QuizResults, QuizReview)
- Added quiz routes to App.tsx
- Integrated gamification (automatic points award)
- Full TypeScript coverage with proper types
- RLS policies for secure data access
- 15 performance indexes
- Complete documentation

Ready for testing and production deployment."

# 3. Push to main (triggers Vercel auto-deploy)
git push origin main

# 4. Monitor deployment
# Go to: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/deployments
# Watch for successful build (usually takes 2-3 minutes)
```

**Verify Deployment:**

- ✅ Build completes successfully
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Deployment goes live

---

### Step 8: Test Quiz System End-to-End 🧪

**Manual Testing Checklist:**

#### A. Test as Student

1. **Access Quiz List**
   - [ ] Go to a course page
   - [ ] Click "Quizzes" tab
   - [ ] Verify test quiz appears
   - [ ] Check quiz details (title, difficulty, time limit, points)

2. **Start Quiz**
   - [ ] Click "Take Quiz" button
   - [ ] Verify you're redirected to `/quiz/[quiz-id]`
   - [ ] Check timer starts (if timed quiz)
   - [ ] Verify quiz instructions display

3. **Answer Questions**
   - [ ] Answer first question (multiple choice)
   - [ ] Verify answer is saved (check browser network tab)
   - [ ] Click "Next" to go to second question
   - [ ] Answer second question (true/false)
   - [ ] Verify "Previous" button works
   - [ ] Check progress indicator updates

4. **Submit Quiz**
   - [ ] Click "Submit Quiz" button
   - [ ] Verify confirmation dialog appears
   - [ ] Confirm submission
   - [ ] Wait for grading (should be instant)
   - [ ] Verify redirect to results page

5. **View Results**
   - [ ] Check score is correct (2/2 if answered correctly)
   - [ ] Verify percentage is 100%
   - [ ] Check "PASSED" badge shows
   - [ ] Verify AIBORG points were awarded
   - [ ] Check time taken displays
   - [ ] Verify attempt number is 1

6. **Review Answers**
   - [ ] Click "Review Answers" button
   - [ ] Verify each question shows
   - [ ] Check correct answers are highlighted
   - [ ] Verify explanations display
   - [ ] Test navigation between questions

7. **Try Again (if failed)**
   - [ ] Go back to course page
   - [ ] Start quiz again
   - [ ] Verify attempt number is 2
   - [ ] Complete and check results

#### B. Test as Instructor (using Supabase)

1. **Create Quiz**
   - [ ] Run SQL to create quiz bank
   - [ ] Add questions with options
   - [ ] Publish quiz
   - [ ] Verify appears in course

2. **View Statistics**
   - [ ] Check quiz_attempts table
   - [ ] Verify responses recorded
   - [ ] Check points awarded in learning_activity_points

#### C. Test Permissions

1. **Unenrolled Student**
   - [ ] Access quiz URL directly
   - [ ] Verify RLS blocks access
   - [ ] Check appropriate error message

2. **Unpublished Quiz**
   - [ ] Set is_published = false
   - [ ] Verify quiz doesn't appear in list
   - [ ] Direct URL access blocked

3. **Max Attempts**
   - [ ] Complete quiz 3 times (max_attempts = 3)
   - [ ] Verify 4th attempt is blocked
   - [ ] Check error message is clear

#### D. Test Timer (Timed Quiz)

1. **Countdown**
   - [ ] Create quiz with 2-minute time limit
   - [ ] Start quiz, verify timer counts down
   - [ ] Check warning at 5 minutes (need longer quiz)
   - [ ] Check critical alert at 1 minute

2. **Timeout**
   - [ ] Let timer run to zero
   - [ ] Verify auto-submit happens
   - [ ] Check status = 'timed_out'
   - [ ] Verify partial scoring

---

### Step 9: Monitor Production 📊

**After deployment, monitor:**

```sql
-- 1. Check quiz activity
SELECT
  DATE(created_at) as date,
  COUNT(*) as attempts,
  AVG(percentage) as avg_score,
  COUNT(CASE WHEN passed THEN 1 END) as passed_count
FROM quiz_attempts
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;

-- 2. Check points awarded
SELECT
  activity_type,
  COUNT(*) as count,
  SUM(points_earned) as total_points,
  AVG(points_earned) as avg_points
FROM learning_activity_points
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY activity_type;

-- 3. Check for errors
SELECT
  status,
  COUNT(*) as count
FROM quiz_attempts
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY status;

-- 4. Most popular quizzes
SELECT
  qb.title,
  COUNT(qa.id) as attempts,
  AVG(qa.percentage) as avg_score
FROM quiz_banks qb
LEFT JOIN quiz_attempts qa ON qa.quiz_bank_id = qb.id
WHERE qa.created_at > NOW() - INTERVAL '7 days'
GROUP BY qb.id, qb.title
ORDER BY attempts DESC
LIMIT 10;
```

**Vercel Logs:**

```bash
# View recent logs
npx vercel logs --token ogferIl3xcqkP9yIUXzMezgH

# Filter for errors
npx vercel logs --token ogferIl3xcqkP9yIUXzMezgH | grep ERROR
```

**Browser Console:**

- Check for React errors
- Monitor network requests
- Verify no 500 errors

---

### Step 10: Rollback Plan (If Needed) 🔄

**If something goes wrong:**

#### Database Rollback

```sql
-- Drop all quiz tables (CAREFUL!)
DROP TABLE IF EXISTS quiz_responses CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_options CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quiz_banks CASCADE;

DROP TABLE IF EXISTS exercise_submissions CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;

DROP TABLE IF EXISTS workshop_activities CASCADE;
DROP TABLE IF EXISTS workshop_stage_submissions CASCADE;
DROP TABLE IF EXISTS workshop_participants CASCADE;
DROP TABLE IF EXISTS workshop_sessions CASCADE;
DROP TABLE IF EXISTS workshops CASCADE;

DROP TABLE IF EXISTS learning_activity_points CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_quiz_score CASCADE;
DROP FUNCTION IF EXISTS award_activity_points CASCADE;

-- Restore from backup
-- Use Supabase Dashboard → Database → Backups → Restore
-- OR
psql -f backup_quiz_system_YYYYMMDD_HHMMSS.sql
```

#### Frontend Rollback

```bash
# Revert git commit
git revert HEAD

# Push to trigger redeploy
git push origin main

# OR use Vercel dashboard to redeploy previous version
```

---

## ✅ Post-Deployment Verification

**Checklist:**

- [ ] Database migration successful (12 tables created)
- [ ] RLS policies active (all tables show 't')
- [ ] Indexes created (15+ indexes)
- [ ] Functions created (3 functions)
- [ ] Sample quiz created and accessible
- [ ] Frontend deployed to Vercel
- [ ] Quiz system accessible at `/quiz/[id]`
- [ ] Can take quiz end-to-end
- [ ] Results display correctly
- [ ] Points awarded successfully
- [ ] No console errors
- [ ] No 500 errors in logs
- [ ] RLS permissions working (unenrolled blocked)
- [ ] Timer works (for timed quizzes)
- [ ] Review answers works

---

## 🎉 Success Criteria

**System is ready when:**

- ✅ All 12 tables exist in database
- ✅ Can create quiz via SQL
- ✅ Can take quiz as student
- ✅ Results display correctly
- ✅ Points are awarded
- ✅ Review functionality works
- ✅ No errors in logs
- ✅ Performance is good (<2s page load)

---

## 🆘 Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution:** Tables already exist, check if previous migration ran

```sql
SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'quiz%';
```

### Issue: RLS blocks all access

**Solution:** Check policies exist and user is enrolled

```sql
-- Check enrollment
SELECT * FROM enrollments WHERE user_id = 'YOUR_USER_ID' AND course_id = YOUR_COURSE_ID;

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'quiz_banks';
```

### Issue: Quiz doesn't appear in list

**Solution:** Check if published and enrollment

```sql
-- Check quiz status
SELECT id, title, is_published, course_id FROM quiz_banks;

-- Check if user is enrolled in that course
SELECT * FROM enrollments WHERE user_id = 'YOUR_USER_ID' AND course_id = THE_COURSE_ID;
```

### Issue: Points not awarded

**Solution:** Check learning_activity_points table

```sql
SELECT * FROM learning_activity_points WHERE activity_type = 'quiz' ORDER BY created_at DESC LIMIT 10;
```

### Issue: Frontend build fails

**Solution:** Check TypeScript errors

```bash
npm run typecheck
npm run lint
```

---

## 📞 Support

**If you encounter issues:**

1. Check this troubleshooting section
2. Review browser console for errors
3. Check Supabase logs
4. Check Vercel deployment logs
5. Review database query results

---

**Deployment Complete! 🚀**

_Proceed to Phase B: Building Exercise System_
