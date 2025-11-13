# Embedding Generation Guide

**Complete guide to generating embeddings for AI-powered semantic search**

---

## 📋 Overview

This guide explains how to generate vector embeddings for all content in the platform to enable intelligent semantic search. Embeddings allow the search system to understand natural language queries and find relevant content even when exact keywords don't match.

**✨ NEW**: Now supports **Ollama** for **FREE local embeddings**! See `OLLAMA_EMBEDDINGS_GUIDE.md` for details.

---

## 🎯 What You'll Enable

**With embeddings generated, users can search like this:**

| Query | What It Finds |
|-------|---------------|
| "ML basics" | Machine Learning courses, even if titled "Introduction to AI" |
| "learn python" | All Python courses, regardless of exact title wording |
| "data science beginner" | Courses ranked by difficulty + topic relevance |

---

## 💰 Cost Estimate

**OpenAI API Pricing** (text-embedding-3-small model):
- **Rate**: $0.00002 per 1,000 tokens
- **Average**: ~50 tokens per content item
- **Estimated Total Cost**: **$5-10** for ~1,000-2,000 items

### Cost Breakdown by Content Type:
| Content Type | Estimated Items | Est. Tokens | Est. Cost |
|--------------|----------------|-------------|-----------|
| Courses | ~500-1,000 | ~25,000-50,000 | $0.50-$1.00 |
| Learning Paths | ~200-500 | ~10,000-25,000 | $0.20-$0.50 |
| Blog Posts | ~100-300 | ~5,000-15,000 | $0.10-$0.30 |
| **TOTAL** | **~800-1,800** | **~40,000-90,000** | **$0.80-$1.80** |

*Note: Actual costs may vary based on content length and quantity.*

---

## ⚙️ Prerequisites

### 1. OpenAI API Key

**Get an API key from OpenAI:**
1. Visit: https://platform.openai.com/api-keys
2. Sign in or create an OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. Add billing information if needed

### 2. Environment Setup

**Add to `.env.local`:**
```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-your-key-here
```

**For production (Vercel):**
1. Go to: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/settings/environment-variables
2. Add: `VITE_OPENAI_API_KEY` = your OpenAI API key
3. Save and redeploy

### 3. Database Setup

**Already configured!** ✅
- ✅ `content_embeddings` table exists
- ✅ `find_similar_content()` function exists
- ✅ pgvector extension enabled
- ✅ Proper indexes created

---

## 🚀 Generation Methods

### Method 1: Browser Console (Recommended for Testing)

**Best for:** Initial testing with small datasets

```typescript
// Open browser console (F12) on your app
import { EmbeddingService } from '@/services/ai/EmbeddingService';

// Generate for all content types
const results = await EmbeddingService.updateAllEmbeddings();
console.log('Generation complete:', results);

// Or generate individually:
const courses = await EmbeddingService.updateCourseEmbeddings();
const paths = await EmbeddingService.updateLearningPathEmbeddings();
const blogs = await EmbeddingService.updateBlogPostEmbeddings();
```

### Method 2: Admin Dashboard (Coming Soon)

**Best for:** Production use, ongoing updates

A dedicated admin panel with:
- One-click batch generation
- Progress tracking
- Cost estimation
- Individual content type controls
- Regeneration for updated content

*See "Future Enhancements" section for implementation details.*

### Method 3: Supabase Edge Function (Coming Soon)

**Best for:** Scheduled batch jobs, automation

Deploy an edge function to run generation on a schedule or trigger.

---

## 📊 Generation Process

### What Happens During Generation:

1. **Fetch Content**
   - Retrieves all items from database
   - Includes: title, description, tags, category

2. **Prepare Embedding Text**
   - Combines metadata into searchable text:
     ```
     {title}

     {description}

     Category: {category}

     Tags: {tag1}, {tag2}, {tag3}
     ```

3. **Generate Embeddings**
   - Batches items (100 per request)
   - Calls OpenAI API with text-embedding-3-small
   - Returns 1536-dimension vectors
   - Rate limited: 5,000 requests/minute

4. **Save to Database**
   - Stores in `content_embeddings` table
   - Upserts (updates existing, inserts new)
   - Includes quality metadata

5. **Return Statistics**
   ```typescript
   {
     total: 150,       // Total items processed
     success: 148,     // Successfully generated
     failed: 2,        // Failures
     totalTokens: 7500,
     estimatedCost: 0.15
   }
   ```

---

## 🛠️ Troubleshooting

### Error: "OpenAI API key not configured"

**Solution:**
```bash
# Check if key is set
echo $VITE_OPENAI_API_KEY

# If empty, add to .env.local:
VITE_OPENAI_API_KEY=sk-your-key-here

# Restart dev server
npm run dev
```

### Error: "Failed to generate embedding"

**Possible causes:**
1. **Invalid API key**: Check key is correct and active
2. **Insufficient credits**: Add billing to OpenAI account
3. **Rate limit exceeded**: Wait and retry (auto-handled)
4. **Network error**: Check internet connection

### Error: "Failed to save content embedding"

**Possible causes:**
1. **Database connection**: Check Supabase is accessible
2. **Table doesn't exist**: Run Phase 6 database migrations
3. **Permission denied**: Check RLS policies allow inserts

### Slow Generation

**Expected behavior:**
- **Batches of 100**: ~2-3 seconds per batch
- **Total time**: ~5-10 minutes for 1,000 items
- **Rate limiting**: Automatic delays between batches

---

## 🔄 Re-generating Embeddings

### When to Re-generate:

1. **Content Updated**: Title, description, tags changed
2. **Model Upgrade**: OpenAI releases better embedding models
3. **Quality Issues**: Search results not accurate enough

### How to Re-generate:

```typescript
// Re-run the generation (upserts automatically)
await EmbeddingService.updateAllEmbeddings();
```

The service uses **upsert** (update or insert), so it's safe to run multiple times.

---

## 📈 Monitoring & Verification

### Check Generation Status:

```sql
-- Count embeddings by type
SELECT
  content_type,
  COUNT(*) as count,
  AVG(embedding_quality_score) as avg_quality
FROM content_embeddings
GROUP BY content_type;
```

### Test Semantic Search:

```typescript
// Test with a sample query
import { SearchService } from '@/services/search/SearchService';

const results = await SearchService.search('machine learning', {
  contentTypes: ['course'],
  useSemanticSearch: true,
  limit: 10
});

console.log('Search results:', results);
```

---

## 🎨 Integration with Search

Once embeddings are generated, the search system automatically uses them:

### SearchService.ts Behavior:

```typescript
// Hybrid search (keyword + semantic)
const results = await SearchService.search('ML basics');

// Results include:
// - Keyword matches (fast, exact)
// - Semantic matches (AI-powered, understanding)
// - Merged and ranked by relevance
```

### What Changes:

**Before embeddings:**
- ✅ Keyword search only
- ❌ No "ML" → "Machine Learning" matching
- ❌ No natural language understanding

**After embeddings:**
- ✅ Keyword search (still works)
- ✅ Semantic search (AI-powered)
- ✅ Hybrid ranking (best of both)
- ✅ Natural language queries

---

## 🚀 Future Enhancements

### 1. Admin Dashboard UI

**Location**: `/admin/embeddings`

**Features:**
- One-click batch generation
- Progress bars with ETA
- Cost calculator
- Individual content type controls
- Regenerate individual items
- Quality metrics display

**Implementation:**
```typescript
// src/pages/admin/EmbeddingsManagement.tsx
- useState for progress tracking
- Real-time updates via polling
- Cost estimation before generation
- Cancel/pause functionality
```

### 2. Automatic Embedding Updates

**Trigger on content changes:**
```typescript
// When course is created/updated
const handleCourseSave = async (course) => {
  await saveCourse(course);

  // Auto-generate embedding
  const text = EmbeddingService.generateEmbeddingText(course);
  const { embedding } = await EmbeddingService.generateEmbedding(text);
  await EmbeddingService.saveContentEmbedding({
    content_id: course.id,
    content_type: 'course',
    embedding,
    ...
  });
};
```

### 3. Quality Monitoring Dashboard

**Track embedding quality:**
- Search success rate
- User click-through rate
- Relevance feedback
- A/B testing: keyword vs semantic

### 4. Multi-Language Support

**Generate embeddings for multiple languages:**
```typescript
// Support for Spanish, French, etc.
const embeddingMultiLang = await EmbeddingService.generateEmbedding(
  translatedText,
  { language: 'es' }
);
```

---

## 📚 API Reference

### EmbeddingService Methods

```typescript
class EmbeddingService {
  // Check if configured
  static isConfigured(): boolean;

  // Single embedding
  static async generateEmbedding(text: string): Promise<EmbeddingResult>;

  // Batch embeddings
  static async generateBatchEmbeddings(texts: string[]): Promise<Map<number, EmbeddingResult>>;

  // Content-specific batch generation
  static async updateCourseEmbeddings(): Promise<Stats>;
  static async updateLearningPathEmbeddings(): Promise<Stats>;
  static async updateBlogPostEmbeddings(): Promise<Stats>;
  static async updateAllEmbeddings(): Promise<Summary>;

  // Search
  static async findSimilarContent(
    embedding: number[],
    contentType?: string,
    limit?: number,
    minSimilarity?: number
  ): Promise<any[]>;

  // Utility
  static generateEmbeddingText(content: ContentMetadata): string;
  static async saveContentEmbedding(embedding: ContentEmbedding): Promise<string>;
  static async getContentEmbedding(contentId: string, contentType: string): Promise<ContentEmbedding | null>;
}
```

---

## ✅ Verification Checklist

Before considering embeddings "complete":

- [ ] OpenAI API key configured and working
- [ ] Generated embeddings for courses
- [ ] Generated embeddings for learning paths
- [ ] Generated embeddings for blog posts
- [ ] Verified embeddings saved in database
- [ ] Tested semantic search with natural language queries
- [ ] Compared keyword vs semantic search results
- [ ] Documented estimated costs
- [ ] Set up monitoring/alerts for failures

---

## 🎯 Quick Start (5-Minute Setup)

**Fastest way to get started:**

```bash
# 1. Add API key to .env.local
echo "VITE_OPENAI_API_KEY=sk-your-key-here" >> .env.local

# 2. Restart dev server
npm run dev

# 3. Open browser console at localhost:8080
# 4. Run in console:
```

```typescript
const { EmbeddingService } = await import('./src/services/ai/EmbeddingService.ts');
const results = await EmbeddingService.updateAllEmbeddings();
console.log('Done!', results);
```

**That's it!** 🎉 Your semantic search is now enabled.

---

## 🆘 Support & Questions

**Issues with generation?**
1. Check the [Troubleshooting](#troubleshooting) section
2. Review console logs for detailed errors
3. Verify database migrations are applied
4. Test with a small batch first

**Need help?**
- Check the [EmbeddingService.ts](/src/services/ai/EmbeddingService.ts) source code
- Review the [Phase 6 Implementation](/PHASE_6_AI_RECOMMENDATIONS_COMPLETE.md) doc
- See the [Search System Documentation](/FEATURE_INTELLIGENT_SEARCH_COMPLETE.md)

---

**Status**: Ready for production! ✅
**Last Updated**: November 12, 2025
**Version**: 1.0.0
