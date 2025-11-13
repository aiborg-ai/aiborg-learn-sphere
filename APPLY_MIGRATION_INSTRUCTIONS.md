# Apply Embeddings Migration

**Status**: Migration ready to apply ✅
**File**: `supabase/migrations/20251112133000_content_embeddings_only.sql`
**Changes**: Creates ONLY content_embeddings table with 768 dimensions for Ollama

**Note**: The error `"relation unique_user_preferences already exists"` means some tables were already created. This new migration adds ONLY the missing content_embeddings table.

---

## Quick Option: Supabase Dashboard SQL Editor (Recommended)

This is the **fastest and easiest** way to apply the migration:

### Steps:

1. **Open Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql/new
   ```

2. **Copy the migration SQL** from:
   ```
   supabase/migrations/20251112133000_content_embeddings_only.sql
   ```

   This is a minimal migration that creates ONLY the content_embeddings table.

3. **Paste into SQL Editor** and click **"Run"**

4. **Verify success**: Should show "Success. No rows returned"

---

## What This Migration Creates

This minimal migration creates:

### Tables:
1. **content_embeddings** - Stores 768-dim vectors for Ollama embeddings

### Functions:
1. **find_similar_content()** - Vector similarity search (768 dimensions)

### Extensions:
- **pgvector** - Vector similarity search support

### RLS Policies:
- Anyone can read embeddings
- Only admins can write embeddings

**Note**: Other AI recommendation tables (user_preferences_ai, recommendation_history, etc.) already exist in your database.

---

## After Migration is Applied

Once the migration is applied, run these commands in the browser console to generate and save embeddings:

### Step 1: Open Browser Console
1. Start dev server (if not running): `npm run dev`
2. Open http://localhost:8081 in browser
3. Press F12 to open DevTools Console

### Step 2: Generate Embeddings
```javascript
// Import the service
const { EmbeddingService } = await import('./src/services/ai/EmbeddingService.ts');

// Generate embeddings for ALL content types
console.log('🚀 Starting embedding generation with Ollama...');
const results = await EmbeddingService.updateAllEmbeddings();

console.log('✅ Generation complete!');
console.log('📊 Results:', results);
```

### Expected Output:
```javascript
{
  courses: { total: 120, success: 120, failed: 0 },
  learningPaths: { total: 0, success: 0, failed: 0 },
  blogPosts: { total: 41, success: 41, failed: 0 },
  totalTokens: 8050,
  estimatedCost: 0  // FREE with Ollama!
}
```

---

## Verification

### Check Embeddings in Database
```javascript
const { supabase } = await import('./src/integrations/supabase/client.ts');

// Count embeddings by type
const { data, error } = await supabase
  .from('content_embeddings')
  .select('content_type, id');

const counts = {};
data?.forEach(row => {
  counts[row.content_type] = (counts[row.content_type] || 0) + 1;
});

console.log('📊 Embeddings by type:', counts);
// Expected: { course: 120, blog_post: 41 }
```

### Test Semantic Search
```javascript
const { SearchService } = await import('./src/services/search/SearchService.ts');

// Test with natural language query
const results = await SearchService.search('learn machine learning basics', {
  contentTypes: ['course'],
  useSemanticSearch: true,
  limit: 10
});

console.log('🔍 Search results:', results);
// Should return relevant ML courses even without exact keyword matches
```

---

## Troubleshooting

### Error: "relation 'content_embeddings' does not exist"
**Solution**: Migration hasn't been applied yet. Follow steps above to apply via Supabase Dashboard.

### Error: "dimension mismatch"
**Solution**: Check that `.env.local` has:
```bash
VITE_EMBEDDING_PROVIDER=ollama
VITE_OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

### Slow Generation
**Expected**: Ollama processes ~1-2 items/second (~40 seconds for 161 items)

---

## Summary

**Before**:
- ❌ No content_embeddings table
- ❌ Cannot save embeddings
- ❌ No semantic search

**After**:
- ✅ content_embeddings table with 768-dim vector support
- ✅ Can save Ollama embeddings
- ✅ Semantic search enabled
- ✅ AI-powered recommendations ready

---

**Next Step**: Apply the migration via Supabase Dashboard SQL Editor, then run embedding generation!
