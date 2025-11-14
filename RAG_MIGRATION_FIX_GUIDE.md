# 🔧 RAG Migration Error Fix Guide

## Error You Encountered

```
ERROR: 42P07: relation "idx_content_embeddings_type" already exists
```

This means the original migration (`20251113100000_rag_vector_search.sql`) was **partially applied** - some objects were created, but the migration didn't complete successfully.

---

## ✅ Solution: Use the Safe Migration

I've created a **safe, idempotent migration** that checks for existing objects before creating them.

### Option 1: Apply Safe Migration (Recommended)

**Location:** `supabase/migrations/20251113100001_rag_vector_search_safe.sql`

**Steps:**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Navigate to: **SQL Editor**

2. **Copy Safe Migration**
   - Open: `supabase/migrations/20251113100001_rag_vector_search_safe.sql`
   - Copy **entire contents**

3. **Run in SQL Editor**
   - Paste into SQL Editor
   - Click **Run**
   - ✅ Should complete successfully this time!

**What the safe migration does:**
- ✅ Uses `CREATE IF NOT EXISTS` for tables
- ✅ Uses `DROP INDEX IF EXISTS` before creating indexes
- ✅ Uses `DROP POLICY IF EXISTS` before creating policies
- ✅ Won't fail if objects already exist
- ✅ Will create missing objects

---

## Option 2: Clean Slate (If Safe Migration Fails)

If the safe migration still has issues, start completely fresh:

### Step 1: Run Cleanup Script

**Location:** `supabase/migrations/CLEANUP_RAG_MIGRATION.sql`

1. Open Supabase SQL Editor
2. Copy contents of `CLEANUP_RAG_MIGRATION.sql`
3. Run in SQL Editor
4. This will **delete all RAG tables and data**

⚠️ **WARNING:** This removes:
- All embeddings
- All RAG analytics
- All FAQs (optional - commented out by default)

### Step 2: Apply Safe Migration

After cleanup, apply the safe migration from Option 1 above.

---

## What Each File Does

### `20251113100000_rag_vector_search.sql` (Original)
- The first version of the migration
- ❌ Not idempotent (fails if run twice)
- ✅ Complete and correct schema
- Use this ONLY on a fresh database

### `20251113100001_rag_vector_search_safe.sql` (Safe Version)
- ✅ Idempotent (can run multiple times)
- ✅ Won't fail on existing objects
- ✅ Creates missing objects
- ✅ **Use this to fix your error**

### `CLEANUP_RAG_MIGRATION.sql` (Nuclear Option)
- Removes all RAG system objects
- Use ONLY if safe migration fails
- Allows starting from scratch

---

## Verification After Migration

After running the safe migration, verify it worked:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('content_embeddings', 'faqs', 'rag_query_analytics');

-- Expected: 3 rows

-- Check indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename = 'content_embeddings';

-- Expected: 3 indexes (type, metadata, vector)

-- Check function exists
SELECT proname
FROM pg_proc
WHERE proname = 'search_content_by_similarity';

-- Expected: 1 row

-- Check FAQs were inserted
SELECT COUNT(*) FROM public.faqs;

-- Expected: 10 rows
```

---

## Next Steps After Successful Migration

Once the migration completes successfully:

### 1. Deploy Edge Functions

```bash
# Deploy embedding generation
npx supabase functions deploy generate-embeddings

# Deploy RAG chat
npx supabase functions deploy ai-chat-rag
```

### 2. Generate Embeddings

Visit: `https://your-domain.com/admin/rag-management`
- Click **"Generate All New Embeddings"**
- Wait 5-10 minutes
- Cost: ~$0.50-1.00 one-time

### 3. Test the System

```typescript
import { RAGService } from '@/services/rag/RAGService';

const response = await RAGService.chat({
  messages: [{ role: 'user', content: 'How does spaced repetition work?' }],
  enable_rag: true,
});

console.log('Response:', response.response);
console.log('Sources:', response.sources); // Should show sources!
```

---

## Common Issues & Solutions

### Issue: "pgvector extension not available"

**Solution:**
```sql
-- Run this first
CREATE EXTENSION IF NOT EXISTS vector;
```

If that fails, pgvector might not be installed on your Supabase instance. Contact Supabase support or check your plan includes pgvector.

### Issue: "Function update_updated_at_column does not exist"

**Solution:**
The safe migration handles this gracefully. The trigger won't be created, but everything else works. To fix:

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Issue: "No data in embeddable_content view"

**Cause:** No courses/blogs/flashcards exist yet.

**Solution:** The view is correct, you just need to create content first.

---

## Why Did This Happen?

**Most likely causes:**

1. **Network interruption** during original migration
2. **Timeout** (migration is large, took too long)
3. **Permission issue** partway through
4. **Manually ran original migration twice** accidentally

The safe migration prevents this from being an issue in the future.

---

## Need More Help?

**Check Supabase Logs:**
1. Supabase Dashboard → Logs
2. Filter by: SQL errors
3. Look for specific error messages

**Verify Permissions:**
```sql
-- Check if you're admin
SELECT role FROM public.profiles WHERE user_id = auth.uid();
-- Should return 'admin'
```

**Test Vector Extension:**
```sql
-- Test pgvector is working
SELECT '[1,2,3]'::vector;
-- Should return: [1,2,3]
```

---

## Summary

**To Fix Your Error:**

1. ✅ **BEST:** Apply `20251113100001_rag_vector_search_safe.sql` in Supabase SQL Editor
2. ⚠️ **If that fails:** Run `CLEANUP_RAG_MIGRATION.sql`, then apply safe migration
3. ✅ **Verify:** Check tables, indexes, and function exist
4. 🚀 **Deploy:** Edge functions
5. 📊 **Generate:** Initial embeddings
6. 🧪 **Test:** RAG chat system

**The safe migration is idempotent and safe to run multiple times!**

---

**Need the original clean migration?**

If you're setting up a NEW environment (not fixing the error), you can use the original:
- `20251113100000_rag_vector_search.sql`

But the safe version (`20251113100001`) works for both cases.
