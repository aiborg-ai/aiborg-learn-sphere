# Batch Blog Scheduler - Setup Guide

This guide covers the setup and deployment of the Batch Blog Scheduler feature.

## Overview

The Batch Blog Scheduler is a comprehensive admin tool that enables:

- Batch creation of up to 50 blog posts with AI
- Smart scheduling with auto-distribution
- Template and campaign management
- Auto-publishing via cron jobs
- Real-time progress monitoring

## Prerequisites

- Supabase project with admin access
- Supabase CLI installed (`npm install -g supabase`)
- Admin user account in the application
- Ollama installed locally for AI generation (or OpenAI API key as fallback)

## Step 1: Apply Database Migration

The migration creates 4 new tables and supporting infrastructure.

```bash
# Navigate to project directory
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Apply the migration
npx supabase db push

# Or if using Supabase CLI directly
supabase db push
```

**Tables Created:**

- `blog_templates` - Reusable generation templates
- `blog_campaigns` - Campaign management
- `blog_post_campaigns` - Post-campaign associations
- `blog_batch_jobs` - Batch job tracking

**Verify Migration:**

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'blog_%';
```

## Step 2: Deploy Edge Functions

Deploy the 3 Edge Functions required for the feature.

```bash
# Deploy publish-scheduled-blogs (auto-publisher)
npx supabase functions deploy publish-scheduled-blogs

# Deploy generate-batch-blogs (batch generator)
npx supabase functions deploy generate-batch-blogs

# Deploy check-batch-status (progress checker)
npx supabase functions deploy check-batch-status
```

**Verify Deployment:**

```bash
# List all deployed functions
npx supabase functions list

# Test the auto-publisher manually
curl -X POST \
  https://[YOUR_PROJECT_REF].supabase.co/functions/v1/publish-scheduled-blogs \
  -H "Authorization: Bearer [YOUR_ANON_KEY]" \
  -H "Content-Type: application/json"
```

## Step 3: Set Up Auto-Publishing Cron Job

The auto-publisher needs to run every 15 minutes to publish scheduled posts.

### Option A: Supabase Edge Function Cron (Recommended)

Supabase supports native cron triggers for Edge Functions.

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **publish-scheduled-blogs**
3. Click **"Add Cron Trigger"**
4. Set schedule: `*/15 * * * *` (every 15 minutes)
5. Save the trigger

**Alternative - Using Supabase SQL:**

```sql
-- Create a cron job using pg_cron (if available)
SELECT cron.schedule(
  'publish-scheduled-blogs',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/publish-scheduled-blogs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verify cron job is scheduled
SELECT * FROM cron.job;
```

### Option B: GitHub Actions Cron

If Supabase cron is not available, use GitHub Actions.

Create `.github/workflows/auto-publish-blogs.yml`:

```yaml
name: Auto-Publish Scheduled Blogs

on:
  schedule:
    # Run every 15 minutes
    - cron: '*/15 * * * *'
  workflow_dispatch: # Allow manual triggering

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/publish-scheduled-blogs \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

**Required GitHub Secrets:**

- `SUPABASE_PROJECT_REF` - Your Supabase project reference
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Option C: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com).

**Setup:**

1. Sign up for the service
2. Create a new cron job
3. Set URL: `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/publish-scheduled-blogs`
4. Set schedule: Every 15 minutes
5. Add headers:
   - `Authorization: Bearer [YOUR_ANON_KEY]`
   - `Content-Type: application/json`
6. Method: POST

## Step 4: Configure Environment Variables

Ensure the following environment variables are set in your Supabase project:

```bash
# In Supabase Dashboard → Settings → Edge Functions → Environment Variables

# Ollama Configuration (if using local Ollama)
OLLAMA_BASE_URL=http://localhost:11434

# OpenAI Configuration (fallback)
OPENAI_API_KEY=sk-... # Optional

# Application URL
APP_URL=https://your-app-url.com
```

## Step 5: Update Admin Navigation

The route and navigation should already be configured. Verify by checking:

**Route in App.tsx (lines 311-320):**

```typescript
<Route
  path="/admin/batch-blog-scheduler"
  element={
    <RouteWrapper routeName="Batch Blog Scheduler">
      <Suspense fallback={<AdminSkeleton />}>
        <BatchBlogScheduler />
      </Suspense>
    </RouteWrapper>
  }
/>
```

**Navigation Link:** Add a link to the admin panel navigation at `/admin`:

```typescript
<Link to="/admin/batch-blog-scheduler">
  <Button variant="outline" className="w-full justify-start">
    <Sparkles className="h-4 w-4 mr-2" />
    Batch Blog Scheduler
  </Button>
</Link>
```

## Step 6: Test the Feature

### 6.1 Test Template Creation

1. Navigate to `/admin/batch-blog-scheduler`
2. Click **Templates** tab
3. Create a new template:
   - Name: "AI Tutorial Series"
   - Topic Template: "Understanding {topic} in Artificial Intelligence"
   - Audience: Professional
   - Tone: Technical
   - Length: Medium
4. Save and verify it appears in the list

### 6.2 Test Batch Generation

1. Click **Batch Creator** tab
2. Select "Manual Entry" input method
3. Enter topics (one per line):
   ```
   Machine Learning
   Neural Networks
   Natural Language Processing
   Computer Vision
   Reinforcement Learning
   ```
4. Set parameters:
   - Audience: Professional
   - Tone: Technical
   - Category: AI & Technology
5. Enable **Auto-Schedule**:
   - Start Date: Tomorrow
   - Frequency: Weekly
   - Preferred Time: 09:00
6. Click **Generate Batch**
7. Monitor progress in the modal
8. Verify posts created in **History** tab

### 6.3 Test Publishing Calendar

1. Click **Calendar** tab
2. Verify scheduled posts appear
3. Test reschedule by clicking a post
4. Change date/time and save
5. Verify post updated

### 6.4 Test Auto-Publishing

1. Create a test post with `scheduled_for` = 2 minutes from now
2. Wait 15-20 minutes (next cron run)
3. Verify post status changed to `published`
4. Check `published_at` timestamp is set

**Manual Test:**

```bash
# Manually trigger the auto-publisher
curl -X POST \
  https://[YOUR_PROJECT_REF].supabase.co/functions/v1/publish-scheduled-blogs \
  -H "Authorization: Bearer [YOUR_ANON_KEY]" \
  -H "Content-Type: application/json"
```

## Step 7: Monitor and Debug

### Check Edge Function Logs

```bash
# View function logs in Supabase Dashboard
# Navigate to: Edge Functions → [function-name] → Logs

# Or use Supabase CLI
npx supabase functions logs publish-scheduled-blogs
npx supabase functions logs generate-batch-blogs
```

### Check Batch Job Status

```sql
-- View recent batch jobs
SELECT
  id,
  status,
  total_posts,
  completed_posts,
  failed_posts,
  created_at,
  completed_at
FROM blog_batch_jobs
ORDER BY created_at DESC
LIMIT 10;

-- Check error logs
SELECT
  id,
  error_log
FROM blog_batch_jobs
WHERE failed_posts > 0;
```

### Check Scheduled Posts

```sql
-- View scheduled posts
SELECT
  id,
  title,
  status,
  scheduled_for,
  published_at
FROM blog_posts
WHERE status = 'scheduled'
ORDER BY scheduled_for;

-- Check if auto-publisher is working
SELECT
  id,
  title,
  scheduled_for,
  published_at,
  (published_at - scheduled_for) as delay
FROM blog_posts
WHERE status = 'published'
  AND scheduled_for IS NOT NULL
ORDER BY published_at DESC
LIMIT 10;
```

## Troubleshooting

### Issue: Cron not running

**Check:**

1. Verify cron is configured correctly (schedule syntax)
2. Check Edge Function is deployed
3. Verify service role key has correct permissions
4. Check Supabase logs for errors

**Solution:**

```bash
# Re-deploy the function
npx supabase functions deploy publish-scheduled-blogs

# Verify it's accessible
curl -X POST https://[PROJECT].supabase.co/functions/v1/publish-scheduled-blogs \
  -H "Authorization: Bearer [ANON_KEY]"
```

### Issue: Batch generation fails

**Check:**

1. Ollama is running (`curl http://localhost:11434/api/tags`)
2. Model is available (`ollama list`)
3. Check Edge Function logs for errors
4. Verify database permissions (RLS policies)

**Solution:**

```bash
# Pull Ollama model
ollama pull llama3.1:8b

# Test generate-blog-post directly
curl -X POST https://[PROJECT].supabase.co/functions/v1/generate-blog-post \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Machine Learning Basics",
    "audience": "professional",
    "aiProvider": "ollama"
  }'
```

### Issue: Posts not auto-publishing

**Check:**

1. `scheduled_for` date is in the past
2. Post status is `scheduled` (not `draft`)
3. Cron is running every 15 minutes
4. Check auto-publisher logs

**Manual Fix:**

```sql
-- Manually publish overdue posts
UPDATE blog_posts
SET
  status = 'published',
  published_at = NOW()
WHERE
  status = 'scheduled'
  AND scheduled_for <= NOW();
```

### Issue: Permission denied

**Check:**

1. User has admin role
2. RLS policies are correctly configured
3. Auth token is valid

**Verify RLS:**

```sql
-- Check RLS policies for blog_templates
SELECT * FROM pg_policies WHERE tablename = 'blog_templates';

-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE blog_templates DISABLE ROW LEVEL SECURITY;
```

## Performance Optimization

### Index Verification

```sql
-- Verify indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename LIKE 'blog_%'
ORDER BY tablename, indexname;

-- Key indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_for
  ON blog_posts(scheduled_for)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_scheduled
  ON blog_posts(status)
  WHERE status = 'scheduled';
```

### Batch Job Cleanup

Periodically clean up old batch job records:

```sql
-- Archive old completed jobs (older than 90 days)
DELETE FROM blog_batch_jobs
WHERE
  status = 'completed'
  AND completed_at < NOW() - INTERVAL '90 days';
```

## Security Best Practices

1. **Never expose Service Role Key** - Only use for server-side cron
2. **Use Anon Key for client-side** - Let RLS handle permissions
3. **Admin-only access** - All batch features require admin role
4. **Rate limiting** - Limit batches to 50 posts max
5. **Input validation** - All forms use Zod validation
6. **Audit logging** - Batch jobs table serves as audit trail

## Next Steps

1. Create default templates for common use cases
2. Set up monitoring/alerting for failed batches
3. Configure backup strategy for batch job data
4. Train team on using the batch scheduler
5. Document content workflows and best practices

## Support

For issues or questions:

- Check Edge Function logs in Supabase Dashboard
- Review database query logs
- Check browser console for frontend errors
- Verify Ollama is running for AI generation

## Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/functions/schedule-functions)
- [Ollama Documentation](https://ollama.ai/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
