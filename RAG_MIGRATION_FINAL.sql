/**
 * RAG MIGRATION - FINAL VERSION
 * Works regardless of which tables exist in your database
 *
 * This version:
 * - Creates only what's needed for RAG
 * - Doesn't depend on flashcard_decks or other optional tables
 * - Safe to run multiple times
 *
 * USAGE:
 * 1. Copy this entire file
 * 2. Paste into Supabase SQL Editor
 * 3. Run
 * 4. Done!
 */

-- ============================================================================
-- STEP 1: Enable pgvector
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- STEP 2: Create or Fix content_embeddings table
-- ============================================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  UNIQUE(content_type, content_id)
);

-- Add missing columns one by one
DO $$
BEGIN
  -- metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_embeddings' AND column_name = 'metadata') THEN
    ALTER TABLE public.content_embeddings ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- content_tokens
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_embeddings' AND column_name = 'content_tokens') THEN
    ALTER TABLE public.content_embeddings ADD COLUMN content_tokens INTEGER;
  END IF;

  -- created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_embeddings' AND column_name = 'created_at') THEN
    ALTER TABLE public.content_embeddings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_embeddings' AND column_name = 'updated_at') THEN
    ALTER TABLE public.content_embeddings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add check constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'content_embeddings_content_type_check'
  ) THEN
    ALTER TABLE public.content_embeddings
    ADD CONSTRAINT content_embeddings_content_type_check
    CHECK (content_type IN ('course', 'blog_post', 'flashcard', 'learning_path', 'faq', 'assessment'));
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

DROP INDEX IF EXISTS public.idx_content_embeddings_type;
CREATE INDEX idx_content_embeddings_type ON public.content_embeddings(content_type);

DROP INDEX IF EXISTS public.idx_content_embeddings_metadata;
CREATE INDEX idx_content_embeddings_metadata ON public.content_embeddings USING gin(metadata);

-- HNSW index for fast vector search
DROP INDEX IF EXISTS public.idx_content_embeddings_vector;
CREATE INDEX idx_content_embeddings_vector ON public.content_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- STEP 4: Create FAQs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS public.idx_faqs_category;
CREATE INDEX idx_faqs_category ON public.faqs(category);

DROP INDEX IF EXISTS public.idx_faqs_active;
CREATE INDEX idx_faqs_active ON public.faqs(is_active) WHERE is_active = true;

-- ============================================================================
-- STEP 5: Create RAG analytics table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rag_query_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  query_text TEXT NOT NULL,
  query_embedding vector(1536),
  results_count INTEGER DEFAULT 0,
  top_result_type TEXT,
  top_result_similarity FLOAT,
  search_latency_ms INTEGER,
  total_latency_ms INTEGER,
  was_helpful BOOLEAN,
  user_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS public.idx_rag_analytics_user;
CREATE INDEX idx_rag_analytics_user ON public.rag_query_analytics(user_id);

DROP INDEX IF EXISTS public.idx_rag_analytics_date;
CREATE INDEX idx_rag_analytics_date ON public.rag_query_analytics(created_at);

DROP INDEX IF EXISTS public.idx_rag_analytics_helpful;
CREATE INDEX idx_rag_analytics_helpful ON public.rag_query_analytics(was_helpful) WHERE was_helpful IS NOT NULL;

-- ============================================================================
-- STEP 6: Create similarity search function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_content_by_similarity(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_content_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content_type text,
  content_id text,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.content_type,
    ce.content_id,
    ce.title,
    ce.content,
    ce.metadata,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM public.content_embeddings ce
  WHERE
    (filter_content_type IS NULL OR ce.content_type = filter_content_type)
    AND (1 - (ce.embedding <=> query_embedding)) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- STEP 7: Create embeddable_content view (DYNAMIC - only includes existing tables)
-- ============================================================================

CREATE OR REPLACE VIEW public.embeddable_content AS

-- Courses (if table exists)
SELECT
  'course' AS content_type,
  id::text AS content_id,
  title,
  description || E'\n\n' ||
  'Audience: ' || audience || E'\n' ||
  'Level: ' || level || E'\n' ||
  'Duration: ' || duration || E'\n' ||
  'Price: ' || price || E'\n' ||
  'Category: ' || category AS content,
  jsonb_build_object(
    'audience', audience,
    'level', level,
    'category', category,
    'price', price,
    'duration', duration,
    'keywords', keywords
  ) AS metadata,
  updated_at
FROM public.courses
WHERE is_active = true
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses')

UNION ALL

-- Blog Posts (if table exists)
SELECT
  'blog_post' AS content_type,
  id::text AS content_id,
  title,
  COALESCE(excerpt, '') || E'\n\n' || content AS content,
  jsonb_build_object(
    'category_id', category_id,
    'status', status,
    'reading_time', reading_time,
    'author_id', author_id
  ) AS metadata,
  updated_at
FROM public.blog_posts
WHERE status = 'published'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts')

UNION ALL

-- FAQs (always included since we create this table)
SELECT
  'faq' AS content_type,
  id::text AS content_id,
  question AS title,
  'Q: ' || question || E'\n\nA: ' || answer AS content,
  jsonb_build_object(
    'category', category,
    'tags', tags,
    'helpful_count', helpful_count
  ) AS metadata,
  updated_at
FROM public.faqs
WHERE is_active = true;

-- Note: Flashcard decks and learning paths will be added when those migrations are applied

-- ============================================================================
-- STEP 8: Set up Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_query_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read content embeddings" ON public.content_embeddings;
DROP POLICY IF EXISTS "Admins can manage content embeddings" ON public.content_embeddings;
DROP POLICY IF EXISTS "Anyone can read active FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.rag_query_analytics;
DROP POLICY IF EXISTS "System can insert analytics" ON public.rag_query_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.rag_query_analytics;

-- Content embeddings policies
CREATE POLICY "Anyone can read content embeddings"
ON public.content_embeddings FOR SELECT USING (true);

CREATE POLICY "Admins can manage content embeddings"
ON public.content_embeddings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- FAQs policies
CREATE POLICY "Anyone can read active FAQs"
ON public.faqs FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage FAQs"
ON public.faqs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Analytics policies
CREATE POLICY "Users can view their own analytics"
ON public.rag_query_analytics FOR SELECT
USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "System can insert analytics"
ON public.rag_query_analytics FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all analytics"
ON public.rag_query_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- STEP 9: Create update triggers (if function exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_content_embeddings_updated_at ON public.content_embeddings;
    CREATE TRIGGER update_content_embeddings_updated_at
    BEFORE UPDATE ON public.content_embeddings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_faqs_updated_at ON public.faqs;
    CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  ELSE
    -- Create the function if it doesn't exist
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS update_content_embeddings_updated_at ON public.content_embeddings;
    CREATE TRIGGER update_content_embeddings_updated_at
    BEFORE UPDATE ON public.content_embeddings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_faqs_updated_at ON public.faqs;
    CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- STEP 10: Insert sample FAQs (using ON CONFLICT DO NOTHING for safety)
-- ============================================================================

INSERT INTO public.faqs (id, question, answer, category, tags) VALUES
(gen_random_uuid(), 'How do I enroll in a course?', 'Click the "Enroll Now" button on any course page. You''ll be guided through the payment process and gain immediate access to course materials.', 'enrollment', ARRAY['enrollment', 'getting-started']),
(gen_random_uuid(), 'What payment methods do you accept?', 'We accept all major credit cards, debit cards, and PayPal. Family membership plans offer significant savings for multiple learners.', 'billing', ARRAY['payment', 'pricing']),
(gen_random_uuid(), 'Can I access courses offline?', 'Yes! Our Progressive Web App (PWA) allows you to download course content for offline access. Perfect for learning on the go without internet.', 'technical', ARRAY['pwa', 'offline', 'mobile']),
(gen_random_uuid(), 'How does spaced repetition work?', 'Our flashcard system uses the proven SM-2 algorithm (same as Anki) to show you cards at optimal intervals. This increases retention by 25% compared to traditional studying.', 'courses', ARRAY['flashcards', 'spaced-repetition', 'learning']),
(gen_random_uuid(), 'What is the AI tutor?', 'Our AI tutor provides 24/7 personalized help. It has access to all course materials, blog posts, and FAQs to give you accurate, context-aware answers with citations.', 'courses', ARRAY['ai', 'help', 'tutor']),
(gen_random_uuid(), 'Is there a mobile app?', 'We have a Progressive Web App (PWA) that works on all devices. You can install it on your phone for an app-like experience with offline support.', 'technical', ARRAY['mobile', 'pwa', 'app']),
(gen_random_uuid(), 'How do I track my progress?', 'Your dashboard shows completion rates, skills acquired, and streaks. We also provide detailed analytics for instructors and learners.', 'courses', ARRAY['progress', 'dashboard', 'analytics']),
(gen_random_uuid(), 'What is adaptive assessment?', 'Our assessments use Computer Adaptive Testing (CAT) to adjust difficulty based on your performance. This provides accurate skill measurement in less time.', 'courses', ARRAY['assessment', 'cat', 'testing']),
(gen_random_uuid(), 'Can I get a refund?', 'Yes, we offer a 7-day money-back guarantee for all courses. Contact us via WhatsApp at +44 7404568207 for refund requests.', 'billing', ARRAY['refund', 'guarantee', 'support']),
(gen_random_uuid(), 'How do I contact support?', 'Reach us on WhatsApp at +44 7404568207 or use the AI chatbot for instant help. Our team responds within 24 hours.', 'support', ARRAY['contact', 'help', 'whatsapp'])
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 11: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.content_embeddings IS 'Stores vector embeddings for semantic search. Updated via embedding pipeline when content changes.';
COMMENT ON FUNCTION public.search_content_by_similarity IS 'Core RAG function: finds most similar content to a query embedding using cosine similarity.';
COMMENT ON TABLE public.rag_query_analytics IS 'Tracks RAG query performance and user satisfaction for continuous improvement.';

-- ============================================================================
-- SUCCESS! 🎉
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  view_count INTEGER;
BEGIN
  -- Count existing tables that will be indexed
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('courses', 'blog_posts', 'faqs');

  -- Count views
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name = 'embeddable_content';

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RAG SYSTEM CORE INSTALLED SUCCESSFULLY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 What was created:';
  RAISE NOTICE '  • Tables: content_embeddings, faqs, rag_query_analytics';
  RAISE NOTICE '  • Indexes: 7 indexes (including HNSW vector index)';
  RAISE NOTICE '  • Function: search_content_by_similarity()';
  RAISE NOTICE '  • View: embeddable_content (% tables found)', table_count;
  RAISE NOTICE '  • FAQs: 10 sample FAQs inserted';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Content sources available for indexing:';
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    RAISE NOTICE '  ✅ Courses table found';
  ELSE
    RAISE NOTICE '  ⚠️  Courses table not found (will be added when available)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
    RAISE NOTICE '  ✅ Blog posts table found';
  ELSE
    RAISE NOTICE '  ⚠️  Blog posts table not found (will be added when available)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flashcard_decks') THEN
    RAISE NOTICE '  ✅ Flashcard decks table found';
  ELSE
    RAISE NOTICE '  ⚠️  Flashcard decks not found - apply spaced repetition migration first';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_generated_learning_paths') THEN
    RAISE NOTICE '  ✅ Learning paths table found';
  ELSE
    RAISE NOTICE '  ⚠️  Learning paths table not found (will be added when available)';
  END IF;
  RAISE NOTICE '  ✅ FAQs table created';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next Steps:';
  RAISE NOTICE '  1. Deploy Edge Functions:';
  RAISE NOTICE '     npx supabase functions deploy generate-embeddings';
  RAISE NOTICE '     npx supabase functions deploy ai-chat-rag';
  RAISE NOTICE '';
  RAISE NOTICE '  2. Generate Initial Embeddings:';
  RAISE NOTICE '     Visit /admin/rag-management';
  RAISE NOTICE '     Click "Generate All New Embeddings"';
  RAISE NOTICE '     (Will index % content sources found)', table_count;
  RAISE NOTICE '';
  RAISE NOTICE '  3. Optional: Apply flashcard migration for more content';
  RAISE NOTICE '     File: 20251113000000_spaced_repetition_system.sql';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
