# RAG System Debug & Fix Guide

## 🔍 Issue Identified

**Problem:** The `ai-chat-rag` edge function has a **BOOT_ERROR** - it fails to start.

**Root Cause:** The function has complex dependencies (question-classifier.ts, prompts.ts,
domain-knowledge.ts) that may be causing startup issues, OR the OpenAI API key is not configured in
the Supabase Edge Functions environment.

## ✅ What's Working

- ✅ Database: 177 embeddings exist (126 courses, 41 blog posts, 10 FAQs)
- ✅ `generate-embeddings` function works
- ✅ `content_embeddings` table with HNSW vector index
- ✅ `rag_query_analytics` table (7 queries logged)
- ✅ All dependency files exist and have correct exports

## ❌ What's Not Working

- ❌ `ai-chat-rag` function returns 503 BOOT_ERROR
- ❌ `search_content_by_similarity` RPC times out (network issue)

## 🛠️ Fix Steps

### Step 1: Configure OpenAI API Key in Supabase

**CRITICAL:** The edge functions need the OpenAI API key to be configured in Supabase.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj)
2. Navigate to: **Edge Functions** → **Secrets**
3. Add secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
4. Save

### Step 2: Deploy the Simplified RAG Function

I've created a simplified version without complex dependencies: `ai-chat-simple`

**Option A: Deploy via Supabase Dashboard (Easiest)**

1. Go to Supabase Dashboard → Edge Functions
2. Create new function: `ai-chat-simple`
3. Copy the code from `/supabase/functions/ai-chat-simple/index.ts`
4. Paste and deploy

**Option B: Deploy via CLI (Recommended)**

```bash
# Navigate to project
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Deploy the simplified function
npx supabase functions deploy ai-chat-simple --project-ref afrulkxxzcmngbrdfuzj

# If Docker issues persist, fix with:
sudo systemctl restart docker
# OR
docker network prune
```

### Step 3: Test the Simplified Function

Run the test script:

```bash
npx tsx scripts/test-simple-rag.ts
```

Or manually test:

```typescript
const { data, error } = await supabase.functions.invoke('ai-chat-simple', {
  body: {
    messages: [{ role: 'user', content: 'How do I enroll in a course?' }],
    enable_rag: true,
  },
});
```

### Step 4: Fix the Original ai-chat-rag Function (Optional)

**Option A: Redeploy** the original function after confirming OpenAI API key is set:

```bash
npx supabase functions deploy ai-chat-rag --project-ref afrulkxxzcmngbrdfuzj
```

**Option B: Replace with simplified version:**

```bash
# Backup original
mv supabase/functions/ai-chat-rag supabase/functions/ai-chat-rag-backup

# Use simple version
cp -r supabase/functions/ai-chat-simple supabase/functions/ai-chat-rag

# Deploy
npx supabase functions deploy ai-chat-rag --project-ref afrulkxxzcmngbrdfuzj
```

### Step 5: Fix Docker Network Issues (If Needed)

If you get Docker network errors when deploying:

```bash
# Option 1: Restart Docker
sudo systemctl restart docker

# Option 2: Prune networks
docker network prune -f

# Option 3: Remove specific network
docker network ls
docker network rm <network-id>

# Option 4: Restart system (last resort)
sudo reboot
```

## 📋 Testing Checklist

After deploying, verify:

- [ ] OpenAI API key is configured in Supabase Dashboard
- [ ] `ai-chat-simple` (or `ai-chat-rag`) deploys without errors
- [ ] Function returns 200 status (not 503)
- [ ] RAG search finds relevant content from 177 embeddings
- [ ] Response includes sources from knowledge base
- [ ] Analytics are logged to `rag_query_analytics` table

## 🧪 Test Scripts Available

1. **`scripts/diagnose-rag-system.ts`** - Comprehensive system check
2. **`scripts/test-simple-rag.ts`** - Test the simplified function (create this)
3. **`scripts/check-embeddings.ts`** - View embeddings by type
4. **`scripts/get-rag-error.ts`** - Get detailed error messages

## 🚀 Next Steps After Fix

Once RAG chat is working:

1. **Add Assessment Questions** (43 available)
   - Expand embeddable_content view
   - Run batch indexing
   - ~$0.0002 cost

2. **Set Up Queue Processing**
   - Deploy `process-embedding-queue` function
   - Configure Supabase cron (every 15 min)
   - Enable auto-updates

3. **Implement Enhancements**
   - Content chunking for long blog posts
   - Hybrid search (vector + keyword)
   - Streaming responses
   - Admin UI improvements

## 💰 Cost Summary

- Current embeddings: $0.0004 (177 items)
- Adding assessments: ~$0.0002 (43 items)
- **Total: <$0.001** (less than a penny!)
- Monthly ongoing: ~$3/month

## 📞 Support

If issues persist:

- Check Supabase logs: Dashboard → Logs → Edge Functions
- Verify API key is valid: Test with `curl https://api.openai.com/v1/models`
- Contact Supabase support if BOOT_ERROR continues

---

## Files Created

- ✅ `supabase/functions/ai-chat-simple/index.ts` - Simplified RAG function
- ✅ `supabase/functions/batch-index-content/index.ts` - Batch embedding indexing
- ✅ `scripts/diagnose-rag-system.ts` - System diagnostic tool
- ✅ `scripts/check-embeddings.ts` - View embedding stats
- ✅ `scripts/get-rag-error.ts` - Get detailed errors
- ✅ Migration: `20251230000000_queue_enhancements.sql` - Queue table with retry logic

## Quick Reference

```bash
# Check current state
npx tsx scripts/diagnose-rag-system.ts

# Deploy simple RAG
npx supabase functions deploy ai-chat-simple --project-ref afrulkxxzcmngbrdfuzj

# Test after deployment
npx tsx scripts/test-simple-rag.ts

# View embeddings
npx tsx scripts/check-embeddings.ts
```

Done! 🎉
