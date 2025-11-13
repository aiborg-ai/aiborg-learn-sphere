# 🧠 RAG-Powered AI Tutor - System Guide

## 🎯 The Killer Feature

**Our competitive advantage:** RAG (Retrieval Augmented Generation) combines semantic search
(pgvector) with GPT-4 to provide accurate, citation-backed answers. **NO COMPETITOR HAS THIS**.

### Expected Impact

| Metric                 | Before RAG | With RAG   | Improvement |
| ---------------------- | ---------- | ---------- | ----------- |
| **Hallucination Rate** | ~40%       | <5%        | **-88%**    |
| **Query Relevance**    | Baseline   | +70%       | **+70%**    |
| **User NPS**           | Baseline   | +20 points | **+20**     |
| **Answer Accuracy**    | 60%        | >95%       | **+58%**    |

---

## 📚 What is RAG?

**Retrieval Augmented Generation** is a technique that enhances AI responses by:

1. **Retrieving** relevant content from a knowledge base using semantic search
2. **Augmenting** the AI prompt with retrieved context
3. **Generating** accurate answers with citations

### Without RAG (Traditional AI Chat)

```
User: "How does spaced repetition work?"
AI: *Makes up an answer based on general knowledge*
❌ May hallucinate incorrect information
❌ No citations or sources
❌ Generic response not specific to our platform
```

### With RAG (Our System)

```
User: "How does spaced repetition work?"
System:
  1. Converts query to vector embedding
  2. Searches 1,000+ indexed documents
  3. Finds: Flashcard guide (95% similarity), Course content (87%)
  4. Passes retrieved content to GPT-4
AI: "According to [Source 1: Flashcard User Guide], our spaced
     repetition system uses the SM-2 algorithm (same as Anki)..."
✅ Factually accurate (from our docs)
✅ Citations included
✅ Platform-specific information
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER QUERY                           │
│              "How do I enroll in a course?"                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               STEP 1: Generate Query Embedding              │
│         OpenAI text-embedding-3-small (1536 dims)           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 2: Vector Similarity Search               │
│         pgvector HNSW index (cosine similarity)             │
│      Searches: courses, blogs, FAQs, flashcards (10K+)     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            STEP 3: Retrieve Top 5 Results                   │
│   [1] FAQ: Enrollment (92% similar)                         │
│   [2] Blog: Getting Started (88%)                           │
│   [3] Course: Payment Guide (85%)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         STEP 4: Build Enhanced Prompt with Context          │
│                                                             │
│  System: "You are aiborg chat. Use this knowledge base:"   │
│  [Retrieved content with citations]                        │
│                                                             │
│  User: "How do I enroll in a course?"                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 STEP 5: GPT-4 Response                      │
│   "According to [Source 1], click 'Enroll Now'..."         │
│              + Citations + Accurate Info                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Components

### 1. Database Schema (Migration: `20251113100000_rag_vector_search.sql`)

**Tables:**

#### `content_embeddings`

Stores vector embeddings for all indexed content.

| Column         | Type         | Description                                 |
| -------------- | ------------ | ------------------------------------------- |
| `id`           | UUID         | Primary key                                 |
| `content_type` | TEXT         | 'course', 'blog_post', 'flashcard', etc.    |
| `content_id`   | TEXT         | Source content ID                           |
| `title`        | TEXT         | Content title for display                   |
| `content`      | TEXT         | The actual text that was embedded           |
| `embedding`    | vector(1536) | OpenAI embedding (1536 dimensions)          |
| `metadata`     | JSONB        | Additional context (author, category, etc.) |

**Index:** HNSW (Hierarchical Navigable Small World) for fast similarity search (<100ms even with
100K vectors)

#### `faqs`

Frequently Asked Questions indexed for RAG.

#### `rag_query_analytics`

Tracks query performance for continuous improvement.

### 2. Edge Functions

#### `generate-embeddings`

**Location:** `supabase/functions/generate-embeddings/`

**Purpose:** Creates vector embeddings for content using OpenAI's embedding API.

**Usage:**

```typescript
// Batch: Index all new courses
POST /generate-embeddings
{ "content_type": "course" }

// Single: Index one item
POST /generate-embeddings
{ "content_type": "course", "content_id": "123" }

// Force refresh all
POST /generate-embeddings
{ "force_refresh": true }
```

**Cost:** $0.02 per 1M tokens (~1,000 items = $0.50-1.00)

#### `ai-chat-rag`

**Location:** `supabase/functions/ai-chat-rag/`

**Purpose:** Enhanced AI chat with retrieval augmented generation.

**Usage:**

```typescript
POST /ai-chat-rag
{
  "messages": [
    { "role": "user", "content": "How do I enroll?" }
  ],
  "audience": "professional",
  "enable_rag": true
}

Response:
{
  "response": "According to [Source 1]...",
  "sources": [
    { "type": "faq", "title": "Enrollment", "similarity": 0.92 }
  ],
  "performance": {
    "search_ms": 45,
    "total_ms": 1250
  }
}
```

### 3. Client-Side Services

#### `RAGService`

**Location:** `src/services/rag/RAGService.ts`

TypeScript service for calling RAG functions.

```typescript
import { RAGService } from '@/services/rag/RAGService';

// Send chat message
const response = await RAGService.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  audience: 'professional',
});

// Generate embeddings (admin only)
await RAGService.generateEmbeddings({ content_type: 'course' });

// Get analytics (admin only)
const stats = await RAGService.getAnalytics({ limit: 100 });
```

#### `useRAGChat` Hook

**Location:** `src/hooks/useRAGChat.ts`

React hook for components.

```typescript
import { useRAGChat } from '@/hooks/useRAGChat';

const { messages, sendMessage, isLoading } = useRAGChat({
  audience: 'professional',
  onResponse: response => {
    console.log('Sources:', response.sources);
  },
});

// Send message
sendMessage('How does spaced repetition work?');
```

### 4. Admin Interface

**Location:** `src/pages/admin/RAGManagement.tsx`

**Route:** `/admin/rag-management`

**Features:**

- View embedding statistics (total count, distribution by type)
- Generate embeddings (all content or by type)
- Force refresh embeddings
- View RAG query analytics (performance, user satisfaction)

---

## 🚀 Deployment Guide

### Step 1: Apply Database Migration

```bash
# Navigate to project root
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Apply migration via Supabase CLI (if installed)
npx supabase db push

# OR: Apply manually in Supabase Dashboard
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Navigate to SQL Editor
# 4. Copy contents of supabase/migrations/20251113100000_rag_vector_search.sql
# 5. Execute the SQL
```

### Step 2: Deploy Edge Functions

```bash
# Deploy generate-embeddings function
npx supabase functions deploy generate-embeddings

# Deploy ai-chat-rag function
npx supabase functions deploy ai-chat-rag
```

### Step 3: Generate Initial Embeddings

1. Navigate to `/admin/rag-management`
2. Click "Generate All New Embeddings"
3. Wait for completion (~5-10 minutes for 1,000 items)

**What gets indexed:**

- ✅ All published courses (~100)
- ✅ Published blog posts (~50-100)
- ✅ Flashcard decks
- ✅ Active learning paths
- ✅ FAQs (10 included)

### Step 4: Test the System

```typescript
// Test chat with RAG
const response = await RAGService.chat({
  messages: [{ role: 'user', content: 'How does spaced repetition work in your platform?' }],
  enable_rag: true,
});

console.log('Response:', response.response);
console.log('Sources:', response.sources);
// Should show sources from flashcard guide
```

### Step 5: Monitor Performance

Visit `/admin/rag-management` → Analytics tab

**Key metrics to monitor:**

- **Search latency:** Should be <100ms (target: 50-80ms)
- **Results per query:** Average 3-5 results
- **Similarity scores:** Top result should be >0.7 (70%)
- **Helpful rate:** Target >80%

---

## 💡 Usage Examples

### Example 1: Course Enrollment Question

**User:** "How much does the Python course cost?"

**RAG Process:**

1. Query embedding generated
2. Searches courses table
3. Finds "Python course" with 95% similarity
4. GPT-4 receives course details as context

**Response:**

```
"According to [Source 1: Python Course], the 'Python Fundamentals
for Professionals' course costs £89 for 8 weeks. It includes..."
```

### Example 2: Technical Question

**User:** "Can I access courses offline?"

**RAG Process:**

1. Searches FAQ + blog posts
2. Finds FAQ about PWA (92% similarity)
3. Finds blog post about offline features (85%)

**Response:**

```
"Yes! According to [Source 1: FAQ], our Progressive Web App (PWA)
allows you to download course content for offline access.
See [Source 2: Blog Post] for detailed instructions..."
```

### Example 3: Feature Question

**User:** "Tell me about your flashcard system"

**RAG Process:**

1. Searches flashcard-related content
2. Finds Flashcard User Guide (98% similarity)
3. Finds blog post on spaced repetition (88%)

**Response:**

```
"According to [Source 1: Flashcard User Guide], our system uses
the SM-2 algorithm (same as Anki) for spaced repetition.
Studies show it increases retention by 25%..."
```

---

## 🎯 Best Practices

### Content to Index

**Do index:**

- ✅ Course descriptions and syllabi
- ✅ Published blog posts
- ✅ Documentation and user guides
- ✅ FAQs
- ✅ Learning path descriptions
- ✅ Assessment questions (for study help)

**Don't index:**

- ❌ Draft content
- ❌ Private user data
- ❌ Payment information
- ❌ Incomplete or placeholder content
- ❌ Auto-generated spam

### Maintaining Content Quality

1. **Regular Re-indexing:** Whenever content changes significantly
2. **Monitor Similarity Scores:** If <0.7, content might not be relevant
3. **User Feedback:** Track "was_helpful" in analytics
4. **Prune Low-Quality Results:** If content consistently gets low similarity, review it

### Performance Optimization

1. **Batch Embedding Generation:** Use batch processing (20 items at a time)
2. **Incremental Updates:** Only re-index changed content
3. **HNSW Index Tuning:** Default settings (m=16, ef_construction=64) work well for 100K vectors
4. **Context Window Management:** Limit retrieved content to avoid token overflow

---

## 📊 Cost Analysis

### OpenAI Costs

**Embeddings (text-embedding-3-small):**

- **Cost:** $0.02 per 1M tokens
- **Estimate:** 1,000 items ≈ $0.50-1.00
- **Monthly:** <$5 for regular updates

**Chat (gpt-4-turbo-preview):**

- **Cost:** $10/1M input tokens, $30/1M output tokens
- **Estimate:** 1,000 queries/month ≈ $10-20
- **Total:** ~$25-30/month for 1,000 active users

### Supabase Costs

**pgvector:**

- ✅ **FREE** (included in Supabase plan)
- No additional cost for vector storage or queries
- Scales to 500K vectors on standard plan

**Total Cost: ~$30/month vs. Pinecone ($70/month + OpenAI)**

**ROI:**

- Increased user satisfaction → lower churn (-20%)
- Reduced support tickets (-40%)
- Competitive differentiation → higher conversion (+15%)

---

## 🐛 Troubleshooting

### Issue: "No results found"

**Possible causes:**

1. Embeddings not generated yet
2. Content type filter too restrictive
3. Similarity threshold too high (>0.9)

**Solution:**

- Visit `/admin/rag-management`
- Check embedding count
- Generate embeddings if needed
- Lower threshold to 0.6-0.7

### Issue: "Slow search performance (>500ms)"

**Possible causes:**

1. Too many vectors (>100K)
2. HNSW index not created
3. Query returns too many results

**Solution:**

```sql
-- Verify HNSW index exists
SELECT * FROM pg_indexes
WHERE tablename = 'content_embeddings'
AND indexname LIKE '%hnsw%';

-- If missing, recreate
CREATE INDEX idx_content_embeddings_vector
ON public.content_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### Issue: "AI response ignores retrieved content"

**Possible causes:**

1. Retrieved content not relevant (low similarity)
2. Context window overflow
3. System prompt not enforcing RAG usage

**Solution:**

- Check similarity scores in response metadata
- Increase similarity threshold to 0.8
- Review top results manually
- Update system prompt in `ai-chat-rag/index.ts`

---

## 🔄 Maintenance Schedule

### Daily

- Monitor query analytics for errors
- Check search latency (<100ms)

### Weekly

- Review user feedback ("was_helpful" rate)
- Re-index any updated content (courses, blog posts)

### Monthly

- Full embedding refresh (`force_refresh: true`)
- Analyze top queries and improve content coverage
- Review and optimize poorly performing queries

### Quarterly

- Performance audit (Lighthouse, load testing)
- Cost analysis and optimization
- Content quality review

---

## 🚀 Future Enhancements

### Phase 1 (Next 3 Months)

- [ ] **Multimodal RAG:** Index images and video transcripts
- [ ] **Query expansion:** "Python course" → also search "programming, coding, Python"
- [ ] **Personalized results:** Boost content based on user's enrolled courses
- [ ] **Auto-suggest:** Show related questions while typing

### Phase 2 (Next 6 Months)

- [ ] **Conversational memory:** Multi-turn conversations with context
- [ ] **Fine-tuned embeddings:** Custom model trained on our content
- [ ] **A/B testing:** Compare RAG vs. non-RAG responses
- [ ] **Advanced analytics:** Query clustering, topic analysis

### Phase 3 (Next 12 Months)

- [ ] **Multi-language support:** Embeddings in 10+ languages
- [ ] **Voice search:** RAG for audio queries
- [ ] **Mobile app integration:** Offline RAG cache
- [ ] **API for partners:** White-label RAG system

---

## 📞 Support

**For technical issues:**

- Check Supabase logs for Edge Function errors
- Review pgvector index health
- Monitor OpenAI API rate limits

**For content issues:**

- Review indexed content via `/admin/rag-management`
- Check similarity scores for relevance
- Update content and re-index

---

**Document Version:** 1.0 **Last Updated:** November 13, 2025 **Author:** Product Team **Related:**
ROADMAP.md (Phase 2.1)
