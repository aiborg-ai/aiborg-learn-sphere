# Ollama Embeddings Guide

**Generate embeddings for FREE using your local Ollama installation!**

---

## 🎉 Benefits of Using Ollama

✅ **100% FREE** - No API costs
✅ **Privacy** - All data stays on your machine
✅ **Fast** - No network latency
✅ **Unlimited** - No rate limits or quotas
✅ **Works Offline** - No internet required

---

## ⚙️ Configuration

### Already Configured! ✅

Your `.env.local` is set to use Ollama:
```bash
VITE_EMBEDDING_PROVIDER=ollama
VITE_OLLAMA_HOST=http://localhost:11434
VITE_OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

###  Available Ollama Embedding Models

| Model | Dimensions | Size | Best For |
|-------|------------|------|----------|
| **nomic-embed-text** | 768 | 137M | ✅ Recommended - Fast, accurate |
| mxbai-embed-large | 1024 | 334M | Higher quality, slower |

**Current model**: `nomic-embed-text` (768 dimensions)

---

## 🚀 Generate Embeddings

### Method 1: Browser Console (Recommended)

1. **Start the dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Open your browser** at http://localhost:8080

3. **Open DevTools Console** (F12 or Right-click → Inspect → Console)

4. **Run the generation command**:
   ```javascript
   // Import the service
   const { EmbeddingService } = await import('./src/services/ai/EmbeddingService.ts');

   // Generate embeddings for ALL content types
   console.log('Starting embedding generation with Ollama...');
   const results = await EmbeddingService.updateAllEmbeddings();

   console.log('✅ Generation complete!');
   console.log('Results:', results);
   ```

5. **Wait for completion** - This will take 10-30 minutes depending on content count

### Method 2: Generate Individual Content Types

```javascript
// Import service
const { EmbeddingService } = await import('./src/services/ai/EmbeddingService.ts');

// Generate only for courses
const courses = await EmbeddingService.updateCourseEmbeddings();
console.log('Courses:', courses);

// Generate only for learning paths
const paths = await EmbeddingService.updateLearningPathEmbeddings();
console.log('Learning paths:', paths);

// Generate only for blog posts
const blogs = await EmbeddingService.updateBlogPostEmbeddings();
console.log('Blog posts:', blogs);
```

---

## 📊 What to Expect

### Generation Time Estimates

| Content Type | Est. Items | Time per Item | Total Time |
|--------------|------------|---------------|------------|
| Courses | 500-1,000 | ~1-2 sec | 8-35 min |
| Learning Paths | 200-500 | ~1-2 sec | 3-17 min |
| Blog Posts | 100-300 | ~1-2 sec | 2-10 min |
| **TOTAL** | **800-1,800** | - | **13-62 min** |

*Times vary based on your CPU and Ollama performance.*

### Console Output Example

```
[INFO] Starting batch embedding generation for all content...
[INFO] Processing 523 texts with Ollama (one at a time)
[INFO] Processing item 1/523
[INFO] Generating embedding using ollama (nomic-embed-text)
[INFO] Processing item 2/523
[INFO] Generating embedding using ollama (nomic-embed-text)
...
[INFO] Course embeddings update complete: { total: 523, success: 521, failed: 2 }
[INFO] Processing 287 texts with Ollama (one at a time)
...
[INFO] Learning path embeddings update complete: { total: 287, success: 287, failed: 0 }
...
[INFO] Blog post embeddings update complete: { total: 156, success: 156, failed: 0 }
[INFO] Batch embedding generation complete
```

### Final Results

```javascript
{
  courses: { total: 523, success: 521, failed: 2 },
  learningPaths: { total: 287, success: 287, failed: 0 },
  blogPosts: { total: 156, success: 156, failed: 0 },
  totalTokens: 48200,
  estimatedCost: 0  // FREE with Ollama!
}
```

---

## 🔍 Verification

### Check Embeddings in Database

```javascript
// Count embeddings by type
const { supabase } = await import('./src/integrations/supabase/client.ts');

const { data, error } = await supabase
  .from('content_embeddings')
  .select('content_type, id')
  .then(res => {
    const counts = {};
    res.data?.forEach(row => {
      counts[row.content_type] = (counts[row.content_type] || 0) + 1;
    });
    return { data: counts, error: res.error };
  });

console.log('Embeddings by type:', data);
// Expected output: { course: 521, learning_path: 287, blog_post: 156 }
```

### Test Semantic Search

```javascript
// Test with a natural language query
const { SearchService } = await import('./src/services/search/SearchService.ts');

const results = await SearchService.search('learn machine learning basics', {
  contentTypes: ['course'],
  useSemanticSearch: true,
  limit: 10
});

console.log('Search results:', results);
// Should return relevant ML courses even without exact keyword matches
```

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"

**Cause**: Ollama is not running

**Solution**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start Ollama
ollama serve
```

### Error: "Model not found"

**Cause**: Embedding model not pulled

**Solution**:
```bash
# Pull the embedding model
ollama pull nomic-embed-text

# Verify it's available
ollama list | grep nomic-embed-text
```

### Slow Generation

**Expected**: Ollama processes one item at a time (no batch API)

**Tips to speed up**:
1. **Use smaller model**: Already using nomic-embed-text (fastest)
2. **Close other apps**: Free up CPU/RAM
3. **Check GPU**: Ensure Ollama is using GPU if available
4. **Generate incrementally**: Do one content type at a time

### Some Items Failed

**Normal**: A few items may fail due to empty content or DB errors

**What to do**:
- Check console logs for specific errors
- Re-run generation (it will skip existing embeddings)
- Verify database connection is stable

---

## 🔄 Re-generating Embeddings

### When to Re-generate

1. **Content updated**: Title, description, or tags changed
2. **Model upgrade**: Switch to better embedding model
3. **Dimension mismatch**: Changed from 768 to 1024 dims

### How to Re-generate

```javascript
// Re-run the generation (uses upsert - safe to run multiple times)
const results = await EmbeddingService.updateAllEmbeddings();
```

**Note**: Existing embeddings will be updated, not duplicated.

---

## 🎯 Performance Comparison

### Ollama vs OpenAI

| Aspect | Ollama (nomic-embed-text) | OpenAI (text-embedding-3-small) |
|--------|---------------------------|----------------------------------|
| **Cost** | $0 (FREE) ✅ | ~$1-2 for all content |
| **Speed** | 1-2 sec/item | 0.1 sec/item (batched) |
| **Quality** | Very good (768 dims) | Excellent (1536 dims) |
| **Privacy** | 100% local ✅ | Data sent to OpenAI |
| **Offline** | Yes ✅ | No |
| **Total Time** | 15-60 min | 2-5 min |

**Recommendation**: Use Ollama for development and testing, consider OpenAI for production if speed matters.

---

## 🔧 Advanced Configuration

### Switch to Larger Model

If you want higher quality embeddings:

1. **Pull the larger model**:
   ```bash
   ollama pull mxbai-embed-large
   ```

2. **Update `.env.local`**:
   ```bash
   VITE_OLLAMA_EMBEDDING_MODEL=mxbai-embed-large
   ```

3. **Regenerate embeddings**:
   ```javascript
   const results = await EmbeddingService.updateAllEmbeddings();
   ```

**Note**: Larger model = slower but potentially better search results.

### Switch to OpenAI

If you want faster generation and have an API key:

1. **Get OpenAI API key**: https://platform.openai.com/api-keys

2. **Update `.env.local`**:
   ```bash
   VITE_EMBEDDING_PROVIDER=openai
   VITE_OPENAI_API_KEY=sk-your-key-here
   ```

3. **Regenerate embeddings**:
   ```javascript
   const results = await EmbeddingService.updateAllEmbeddings();
   ```

---

## 📈 Search Quality

### What Ollama Embeddings Enable

**Before** (keyword only):
```
Query: "ML basics"
Results: Only courses with exact "ML" or "basics" in title
```

**After** (with Ollama embeddings):
```
Query: "ML basics"
Results:
  ✅ Machine Learning Fundamentals
  ✅ Introduction to AI
  ✅ Data Science Starter Course
  ✅ Neural Networks 101
  ✅ Deep Learning Basics
```

### Test Queries to Try

```javascript
// Natural language queries that work with semantic search
const queries = [
  "learn python programming",
  "web development for beginners",
  "data science",
  "ML fundamentals",
  "react course",
  "database tutorial"
];

for (const query of queries) {
  const results = await SearchService.search(query, {
    useSemanticSearch: true,
    limit: 5
  });
  console.log(`"${query}":`, results.length, 'results');
}
```

---

## ✅ Quick Start Checklist

- [ ] Ollama is installed and running
- [ ] nomic-embed-text model is pulled
- [ ] `.env.local` configured with Ollama settings
- [ ] Dev server is running (npm run dev)
- [ ] Opened browser console at localhost:8080
- [ ] Ran embedding generation command
- [ ] Waited for completion (15-60 min)
- [ ] Verified embeddings in database
- [ ] Tested semantic search functionality

---

## 🎉 You're Done!

Once embeddings are generated, your search system will automatically use them for semantic search. No additional configuration needed!

**Test it out**:
1. Go to http://localhost:8080/search
2. Try a natural language query
3. See AI-powered results!

---

## 📚 Additional Resources

- **EmbeddingService Source**: `/src/services/ai/EmbeddingService.ts`
- **Search Service Source**: `/src/services/search/SearchService.ts`
- **Ollama Documentation**: https://ollama.ai/docs
- **Nomic Embed Text**: https://huggingface.co/nomic-ai/nomic-embed-text-v1.5

---

**Status**: Ready to generate! ✅
**Cost**: $0 (FREE with Ollama) 💰
**Time**: 15-60 minutes ⏱️
**Quality**: Excellent for semantic search 🎯
