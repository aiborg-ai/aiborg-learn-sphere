# Manual Deployment Guide - RAG System

This guide provides step-by-step instructions for deploying the RAG system components via the
Supabase Dashboard, bypassing Docker CLI issues.

## 🎯 Overview

Due to Docker network issues on the local machine, we'll deploy all edge functions manually through
the Supabase Dashboard. This guide covers:

1. ✅ Configuring the OpenAI API key
2. ✅ Deploying edge functions
3. ✅ Applying database migrations
4. ✅ Configuring cron triggers
5. ✅ Testing the deployment

## 📋 Prerequisites

- Access to Supabase Dashboard: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
- OpenAI API key with credits available
- Admin access to the project

---

## Step 1: Configure OpenAI API Key

**CRITICAL**: The edge functions require the OpenAI API key to function.

### 1.1 Navigate to Secrets

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
2. Click **Edge Functions** in the left sidebar
3. Click **Secrets** tab

### 1.2 Add OpenAI API Key

1. Click **Add Secret** or **New Secret**
2. Enter:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)
3. Click **Save**

### 1.3 Verify

The secret should appear in the list as `OPENAI_API_KEY` (value hidden).

---

## Step 2: Deploy ai-chat-simple Edge Function

This is the simplified RAG chat function without complex dependencies.

### 2.1 Create Function

1. Go to: **Edge Functions** → **Functions** tab
2. Click **Create Function** or **New Function**
3. Enter function name: `ai-chat-simple`
4. Click **Create**

### 2.2 Copy Function Code

1. Open local file:
   `/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/ai-chat-simple/index.ts`
2. Copy the entire contents (130 lines)
3. Paste into the Supabase editor

### 2.3 Deploy

1. Click **Deploy** button
2. Wait for deployment to complete (status should show "Active")
3. Note the function URL (e.g.,
   `https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/ai-chat-simple`)

### 2.4 Test Deployment

Run this from your local machine:

```bash
npx tsx scripts/test-simple-rag.ts
```

Expected output: ✅ Success with AI responses and source counts

---

## Step 3: Deploy process-embedding-queue Edge Function

This function processes the embedding update queue automatically.

### 3.1 Create Function

1. Go to: **Edge Functions** → **Functions** tab
2. Click **Create Function** or **New Function**
3. Enter function name: `process-embedding-queue`
4. Click **Create**

### 3.2 Copy Function Code

1. Open local file:
   `/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/process-embedding-queue/index.ts`
2. Copy the entire contents (206 lines)
3. Paste into the Supabase editor

### 3.3 Deploy

1. Click **Deploy** button
2. Wait for deployment to complete

### 3.4 Test Manually

```bash
# Test with curl
curl -X POST \
  https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/process-embedding-queue \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Expected: `{"success":true,"message":"Queue is empty","processed":0,"errors":0}`

---

## Step 4: Apply Database Migrations

Apply the two new migrations to enable assessment questions and queue enhancements.

### 4.1 Navigate to SQL Editor

1. Go to: **SQL Editor** in the left sidebar
2. Click **New Query**

### 4.2 Apply Queue Enhancements Migration

1. Open local file:
   `/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/migrations/20251230000000_queue_enhancements.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click **Run** or press Ctrl+Enter
5. Verify success (no errors in output)

### 4.3 Apply Assessment Questions Migration

1. Open local file:
   `/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/migrations/20251231000000_add_assessment_to_embeddings.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click **Run**
5. Verify success

### 4.4 Verify Migrations

Run this query in SQL Editor:

```sql
-- Check embeddable_content view includes assessments
SELECT content_type, COUNT(*) as count
FROM embeddable_content
GROUP BY content_type
ORDER BY content_type;
```

Expected output should include:

- `assessment` - 43 (or similar count)
- `blog_post` - 41
- `course` - 126
- `faq` - 10
- Plus any learning_path and flashcard entries

---

## Step 5: Configure Cron Trigger

Set up automated queue processing every 15 minutes.

### 5.1 Navigate to Edge Functions Cron

1. Go to: **Edge Functions** → **Cron** tab (or **Schedules**)
2. Click **Add Cron Job** or **New Schedule**

### 5.2 Configure Schedule

Enter the following:

- **Name**: `process-embedding-queue`
- **Function**: Select `process-embedding-queue` from dropdown
- **Cron Expression**: `*/15 * * * *` (every 15 minutes)
- **Time Zone**: UTC (or your preferred timezone)
- **Enabled**: ✅ Check this box

### 5.3 Save

Click **Save** or **Create**

### 5.4 Verify

The cron job should appear in the list with:

- Status: Enabled
- Next run time displayed

---

## Step 6: Index Assessment Questions

Now that migrations are applied, index the 43 assessment questions.

### 6.1 Deploy batch-index-content Function (Optional)

**Option A**: Use existing generate-embeddings function directly

**Option B**: Deploy batch-index-content for better progress tracking:

1. Create new function: `batch-index-content`
2. Copy code from:
   `/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/batch-index-content/index.ts`
3. Deploy

### 6.2 Trigger Indexing

**Via generate-embeddings** (simpler):

```bash
# Index all assessments
npx tsx -e "
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://afrulkxxzcmngbrdfuzj.supabase.co',
  'YOUR_SERVICE_ROLE_KEY'
);

const { data, error } = await supabase.functions.invoke('generate-embeddings', {
  body: { content_type: 'assessment' }
});

console.log('Result:', data, error);
"
```

**Or via SQL** (insert into queue for cron to process):

```sql
-- Queue all assessments for embedding
INSERT INTO embedding_update_queue (content_type, content_id, action)
SELECT 'assessment', id::text, 'create'
FROM assessment_questions
WHERE is_active = true
ON CONFLICT DO NOTHING;
```

Then wait for the cron job to process (next 15-min cycle).

---

## Step 7: Testing & Verification

### 7.1 Test RAG Chat

```bash
npx tsx scripts/test-simple-rag.ts
```

Expected output:

```
🧪 Testing Simplified RAG Chat
======================================================================

📝 Query: "How do I enroll in a course?"
   RAG: Enabled
----------------------------------------------------------------------
   ✅ Success!
   Response: To enroll in a course, visit the course page...
   Sources: 3 found
```

### 7.2 Check Embeddings Count

SQL Editor:

```sql
SELECT content_type, COUNT(*) as count, MAX(created_at) as latest
FROM content_embeddings
GROUP BY content_type
ORDER BY content_type;
```

Expected:

- `assessment` - 43
- `blog_post` - 41
- `course` - 126
- `faq` - 10
- **Total**: ~220 embeddings

### 7.3 Test Queue Processing

1. Update a course title in the database
2. Verify it appears in `embedding_update_queue`:

```sql
SELECT * FROM embedding_update_queue
WHERE processed_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

3. Wait 15 minutes (or trigger manually via curl)
4. Verify `processed_at` is set

### 7.4 Test Search Quality

```bash
# Run diagnostic
npx tsx scripts/diagnose-rag-system.ts
```

All tests should pass (7/7).

---

## 🎯 Success Checklist

After completing all steps, verify:

- [ ] `OPENAI_API_KEY` is configured in Supabase Secrets
- [ ] `ai-chat-simple` function deployed and returns 200 (not 503)
- [ ] `process-embedding-queue` function deployed
- [ ] Queue enhancements migration applied (retry columns exist)
- [ ] Assessment migration applied (43 assessments in embeddable_content)
- [ ] Cron trigger configured (every 15 minutes)
- [ ] Assessment questions indexed (~43 new embeddings)
- [ ] RAG chat returns relevant sources from knowledge base
- [ ] Queue processes automatically (test by updating content)
- [ ] Total embeddings: ~220+ (was 177, added ~43)

---

## 🐛 Troubleshooting

### Issue: ai-chat-simple returns 503 BOOT_ERROR

**Check**:

1. OpenAI API key is configured correctly
2. View logs in Dashboard → Edge Functions → Logs
3. Common issue: Invalid API key format

**Fix**: Verify API key starts with `sk-` and has credits available

### Issue: Queue not processing

**Check**:

1. Cron trigger is enabled
2. View cron logs in Dashboard → Edge Functions → Cron → Logs
3. Verify `process-embedding-queue` function is deployed

**Fix**: Manually trigger via curl to test

### Issue: Assessment embeddings not created

**Check**:

1. Migration applied: `SELECT * FROM embeddable_content WHERE content_type = 'assessment' LIMIT 1;`
2. Should return rows

**Fix**: Re-run migration Step 4.3

### Issue: Search returns no results

**Check**:

1. Embeddings exist: `SELECT COUNT(*) FROM content_embeddings;`
2. HNSW index exists: `\d+ content_embeddings` (check for idx_content_embeddings_vector)

**Fix**: Re-index content using generate-embeddings

---

## 📞 Support Resources

- **Supabase Logs**: Dashboard → Logs → Edge Functions
- **Test OpenAI Key**: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`
- **Local Diagnostics**: `npx tsx scripts/diagnose-rag-system.ts`
- **RAG Debug Guide**: See `/home/vik/aiborg_CC/aiborg-learn-sphere/RAG_DEBUG_GUIDE.md`

---

## 💰 Cost Estimate

After completing this deployment:

- **Initial indexing**: $0.0004 (existing) + $0.0002 (assessments) = **$0.0006**
- **Monthly ongoing**: ~$3/month (100 updates/day)
- **Vector search**: $0 (database-based, no API cost)

---

## 🚀 Next Steps After Deployment

Once the basic RAG system is working:

1. **Monitor Performance**: Check Dashboard → Edge Functions → Metrics
2. **Review Analytics**: Query `rag_query_analytics` table for insights
3. **Optimize Threshold**: Adjust `match_threshold` in ai-chat-simple (currently 0.6)
4. **Add Content Chunking**: Implement Phase 4 from the main plan
5. **Enable Hybrid Search**: Implement Phase 5 (vector + keyword)
6. **Add Streaming**: Implement Phase 6 for real-time responses
7. **Enhance Admin UI**: Implement Phase 7 for better monitoring

---

## 📁 Files Created for Manual Deployment

All files are ready in the repository:

- ✅ `/supabase/functions/ai-chat-simple/index.ts` (130 lines)
- ✅ `/supabase/functions/process-embedding-queue/index.ts` (206 lines)
- ✅ `/supabase/functions/batch-index-content/index.ts` (243 lines)
- ✅ `/supabase/migrations/20251230000000_queue_enhancements.sql`
- ✅ `/supabase/migrations/20251231000000_add_assessment_to_embeddings.sql`
- ✅ `/scripts/test-simple-rag.ts`
- ✅ `/scripts/diagnose-rag-system.ts`
- ✅ `/scripts/check-embeddings.ts`

Simply copy-paste from these files into the Supabase Dashboard.

---

**Estimated Time**: 30-45 minutes for complete deployment and testing

**Difficulty**: Easy (no CLI required, all GUI-based)

Done! 🎉
