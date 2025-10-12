# Real-Time Collaboration - Deployment Guide

Complete guide to deploying the real-time classroom features to production.

---

## ✅ Prerequisites

Before deploying, ensure you have:

- [ ] Supabase project with PostgreSQL database
- [ ] Vercel account (for deployment)
- [ ] Git repository access
- [ ] Environment variables configured

---

## 📋 Step-by-Step Deployment

### Step 1: Database Migration ✅ COMPLETE

The SQL migration has already been applied successfully!

**Verification**:

```bash
# Connect to your Supabase database
psql -h your-db-host -U postgres -d your-db

# Check tables exist
\dt classroom*

# Expected output:
# classroom_sessions
# classroom_presence
# classroom_questions
# classroom_progress_events
# question_upvotes

# Check realtime is enabled
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
AND tablename LIKE 'classroom%';
```

**If you need to re-apply**:

```bash
psql -h your-db-host -U postgres -d your-db \
  -f supabase/migrations/20251012000000_realtime_classroom.sql
```

---

### Step 2: Build & Type Check

Ensure all code compiles without errors:

```bash
# Install dependencies (if needed)
npm install

# Type check
npm run typecheck

# Should output: No errors ✅

# Lint check
npm run lint

# Build for production
npm run build
```

---

### Step 3: Environment Variables

Verify your environment variables in Vercel:

```bash
# Required variables:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://your-domain.vercel.app
```

**To set in Vercel**:

1. Go to https://vercel.com/your-team/aiborg-ai-web/settings/environment-variables
2. Verify all three variables are set
3. They should be set for: Production, Preview, and Development

---

### Step 4: Deploy to Vercel

#### Option A: Automatic (via Git Push)

```bash
# Commit your changes
git add .
git commit -m "feat: Add real-time collaboration features"

# Push to main branch
git push origin main

# Vercel will auto-deploy
# Check status at: https://vercel.com/your-team/aiborg-ai-web/deployments
```

#### Option B: Manual (via Vercel CLI)

```bash
# Deploy to production
VERCEL_FORCE_NO_BUILD_CACHE=1 npx vercel --prod --token ogferIl3xcqkP9yIUXzMezgH --yes

# Check deployment status
npx vercel ls --token ogferIl3xcqkP9yIUXzMezgH
```

---

### Step 5: Post-Deployment Verification

#### 5.1 Check Deployment Status

1. Visit: https://aiborg-ai-web.vercel.app
2. Should load without errors
3. Check browser console for errors

#### 5.2 Test Database Connection

```bash
# In Supabase dashboard, run:
SELECT COUNT(*) FROM classroom_sessions;

# Should return: 0 (no errors)
```

#### 5.3 Test Realtime Connection

1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Navigate to any course page
4. Should see WebSocket connection established

---

## 🧪 Testing the Features

### Test as Student

1. **Navigate to a course**:
   - Go to `/course/:courseId` (replace with actual course ID)
   - Should see "Active Students" bar
   - Should see "Live Q&A" tab (if session active)

2. **Join classroom**:
   - Your avatar should appear in Active Students
   - Green pulse indicator shows you're online

3. **Ask a question**:
   - Click "Live Q&A" tab
   - Type a question
   - Click "Ask Question"
   - Question should appear instantly

4. **Upvote a question**:
   - Click thumbs up icon
   - Count should increment immediately

5. **Check progress sync**:
   - Watch your progress
   - Should auto-save every 30 seconds
   - Check database to verify:
     ```sql
     SELECT * FROM user_progress WHERE user_id = 'your-user-id';
     ```

### Test as Instructor

1. **Navigate to instructor dashboard**:
   - Go to `/instructor`
   - Should see list of your courses

2. **Open live classroom**:
   - Click "Live Classroom" button next to any course
   - Should redirect to `/instructor/classroom/:courseId`

3. **Start session**:
   - Click "Start Session" button
   - Dashboard should activate

4. **Monitor students**:
   - See active students count
   - View pending questions
   - Check progress stats

5. **Answer a question**:
   - Go to "Q&A Queue" tab
   - Click "Answer" on any question
   - Type answer and submit
   - Answer should appear for all students instantly

6. **View cohort progress**:
   - Go to "Progress" tab
   - See all students' progress bars
   - Sort by progress/activity/name

---

## 🔍 Troubleshooting

### Issue: Students not seeing each other

**Diagnosis**:

```sql
-- Check if session exists and is active
SELECT * FROM classroom_sessions WHERE is_active = true;

-- Check student presence
SELECT * FROM classroom_presence WHERE is_active = true;
```

**Fix**:

- Ensure instructor started a session
- Check WebSocket connection in browser DevTools
- Verify realtime is enabled:
  ```sql
  SELECT check_realtime_enabled('classroom_presence');
  ```

---

### Issue: Questions not appearing

**Diagnosis**:

1. Open browser console
2. Look for WebSocket errors
3. Check network tab for failed requests

**Fix**:

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'classroom_questions';

-- Verify user can insert
INSERT INTO classroom_questions (session_id, user_id, question_text)
VALUES ('test-session-id', auth.uid(), 'Test question');
```

---

### Issue: Progress not syncing

**Diagnosis**:

```sql
-- Check if updates are reaching database
SELECT * FROM user_progress
WHERE user_id = 'your-user-id'
ORDER BY updated_at DESC
LIMIT 5;

-- Check progress events
SELECT * FROM classroom_progress_events
ORDER BY created_at DESC
LIMIT 10;
```

**Fix**:

- Ensure ProgressSync component is mounted
- Check `currentSession` is not null
- Verify 30-second debounce is working (not syncing too frequently)

---

### Issue: Realtime not working

**Diagnosis**:

```bash
# Check Supabase Realtime settings
# In Supabase dashboard → Database → Replication
```

**Fix**:

```sql
-- Re-enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE classroom_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE classroom_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE classroom_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE question_upvotes;
ALTER PUBLICATION supabase_realtime ADD TABLE classroom_progress_events;
```

---

## 📊 Monitoring

### Key Metrics to Track

1. **Active Sessions**:

   ```sql
   SELECT COUNT(*) FROM classroom_sessions WHERE is_active = true;
   ```

2. **Active Students**:

   ```sql
   SELECT COUNT(DISTINCT user_id)
   FROM classroom_presence
   WHERE is_active = true
   AND last_seen > NOW() - INTERVAL '5 minutes';
   ```

3. **Questions Per Day**:

   ```sql
   SELECT DATE(created_at), COUNT(*)
   FROM classroom_questions
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY DATE(created_at);
   ```

4. **Average Response Time**:
   ```sql
   SELECT AVG(
     EXTRACT(EPOCH FROM (answered_at - created_at))
   ) / 60 as avg_minutes
   FROM classroom_questions
   WHERE answered_at IS NOT NULL;
   ```

### Performance Monitoring

Use Supabase dashboard to monitor:

- Database connections
- Query performance
- Realtime connection count
- API request rate

---

## 🔒 Security Checklist

- [x] RLS policies enabled on all tables
- [x] Users can only see their own sessions
- [x] Only instructors can answer questions
- [x] Only authenticated users can access
- [x] No SQL injection vectors
- [x] WebSocket connections authenticated

---

## 🎯 Success Criteria

### Before going live, verify:

- [ ] ✅ Migration applied successfully
- [ ] ✅ Build passes with no errors
- [ ] ✅ TypeScript types all valid
- [ ] ✅ Deployment successful
- [ ] ✅ Students can join sessions
- [ ] ✅ Questions work both ways
- [ ] ✅ Progress auto-saves
- [ ] ✅ Instructors can monitor cohort
- [ ] ✅ No console errors
- [ ] ✅ WebSocket connections stable

---

## 📞 Support

If you encounter issues:

1. **Check logs**:
   - Vercel deployment logs
   - Browser console
   - Supabase logs

2. **Common fixes**:
   - Clear browser cache
   - Restart Supabase project
   - Re-deploy to Vercel
   - Check environment variables

3. **Documentation**:
   - `docs/REALTIME_COLLABORATION.md` - Full API docs
   - `docs/REALTIME_COMPONENTS_INDEX.md` - Component reference
   - `docs/REALTIME_IMPLEMENTATION_SUMMARY.md` - Technical details

---

## 🚀 Going Live

### Pre-Launch Checklist

1. **Database**:
   - [x] Migration applied
   - [ ] Backups configured
   - [ ] Monitoring enabled

2. **Application**:
   - [x] Build successful
   - [x] No TypeScript errors
   - [x] All imports valid

3. **Testing**:
   - [ ] Student flow tested
   - [ ] Instructor flow tested
   - [ ] Q&A working
   - [ ] Progress syncing

4. **Documentation**:
   - [x] User guide ready
   - [x] Troubleshooting guide ready
   - [x] API docs complete

### Launch Steps

1. **Announce to instructors**:
   - Send email about new features
   - Schedule training session
   - Provide quick start guide

2. **Soft launch**:
   - Enable for 1-2 pilot courses
   - Monitor closely for issues
   - Gather feedback

3. **Full launch**:
   - Enable for all courses
   - Monitor performance
   - Iterate based on usage

---

## 📈 Post-Launch

### Week 1

- Monitor error rates
- Check WebSocket connection stability
- Verify database performance
- Gather initial feedback

### Week 2-4

- Analyze usage patterns
- Identify popular features
- Optimize based on metrics
- Plan enhancements

### Future Enhancements

- Screen sharing for instructors
- Breakout rooms for study groups
- Live polls and quizzes
- Video chat integration
- Whiteboard collaboration

---

**Deployment Status**: ✅ READY TO DEPLOY

**Last Updated**: 2025-10-13

**Version**: 1.0.0
