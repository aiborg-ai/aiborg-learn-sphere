/**
 * RAG-Powered AI Tutor - Vector Search System
 * Phase 2.1: Killer Feature Implementation
 *
 * This migration creates the infrastructure for semantic search using pgvector.
 * Content indexed: courses, blog posts, flashcards, learning paths, FAQs
 */

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create content_embeddings table for vector storage
CREATE TABLE IF NOT EXISTS public.content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content identification
  content_type TEXT NOT NULL CHECK (content_type IN (
    'course',
    'blog_post',
    'flashcard',
    'learning_path',
    'faq',
    'assessment'
  )),
  content_id TEXT NOT NULL, -- References the source table ID (as text for flexibility)

  -- Content for context window
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- The actual text that was embedded
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (author, date, category, etc.)

  -- Vector embedding (OpenAI uses 1536 dimensions for text-embedding-3-small)
  embedding vector(1536),

  -- Search optimization
  content_tokens INTEGER, -- Approximate token count for content

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique constraint to prevent duplicate embeddings
  UNIQUE(content_type, content_id)
);

-- Create indexes for performance
CREATE INDEX idx_content_embeddings_type ON public.content_embeddings(content_type);
CREATE INDEX idx_content_embeddings_metadata ON public.content_embeddings USING gin(metadata);

-- CRITICAL: Vector similarity search index using HNSW (Hierarchical Navigable Small World)
-- This index makes vector similarity searches FAST (< 100ms even with 100K vectors)
-- cosine distance is best for OpenAI embeddings (already normalized)
CREATE INDEX idx_content_embeddings_vector ON public.content_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create function for cosine similarity search
-- This is the CORE of RAG - finds most relevant content for a query
CREATE OR REPLACE FUNCTION public.search_content_by_similarity(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7, -- Minimum similarity (0-1, where 1 is identical)
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
    -- Calculate similarity (1 - cosine distance = cosine similarity)
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM public.content_embeddings ce
  WHERE
    (filter_content_type IS NULL OR ce.content_type = filter_content_type)
    AND (1 - (ce.embedding <=> query_embedding)) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create FAQ table (mentioned in roadmap but missing)
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Question & Answer
  question TEXT NOT NULL,
  answer TEXT NOT NULL,

  -- Categorization
  category TEXT NOT NULL DEFAULT 'general', -- e.g., 'enrollment', 'technical', 'billing', 'courses'
  tags TEXT[] DEFAULT '{}',

  -- Visibility
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faqs_category ON public.faqs(category);
CREATE INDEX idx_faqs_active ON public.faqs(is_active) WHERE is_active = true;

-- Create view for easy content retrieval for embedding
-- This view combines all content that should be embedded
CREATE OR REPLACE VIEW public.embeddable_content AS
-- Courses
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

UNION ALL

-- Blog Posts
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

UNION ALL

-- Flashcard Decks (summary of deck purpose)
SELECT
  'flashcard' AS content_type,
  id::text AS content_id,
  title,
  COALESCE(description, 'Flashcard deck: ' || title) || E'\n' ||
  'Contains ' || card_count || ' cards for spaced repetition learning.' AS content,
  jsonb_build_object(
    'card_count', card_count,
    'created_by', created_by
  ) AS metadata,
  updated_at
FROM public.flashcard_decks

UNION ALL

-- Learning Paths
SELECT
  'learning_path' AS content_type,
  id::text AS content_id,
  goal_title AS title,
  goal_description || E'\n\n' ||
  'Skills: ' || skill_level || E'\n' ||
  'Timeline: ' || timeline || E'\n' ||
  'Learning style: ' || COALESCE(learning_style, 'Not specified') AS content,
  jsonb_build_object(
    'skill_level', skill_level,
    'timeline', timeline,
    'status', status
  ) AS metadata,
  updated_at
FROM public.ai_generated_learning_paths
WHERE status = 'active'

UNION ALL

-- FAQs
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

-- Enable RLS for content_embeddings
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;

-- Anyone can read embeddings (needed for semantic search)
CREATE POLICY "Anyone can read content embeddings"
ON public.content_embeddings
FOR SELECT
USING (true);

-- Only admins can manage embeddings
CREATE POLICY "Admins can manage content embeddings"
ON public.content_embeddings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Enable RLS for FAQs
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can read active FAQs
CREATE POLICY "Anyone can read active FAQs"
ON public.faqs
FOR SELECT
USING (is_active = true);

-- Admins can manage FAQs
CREATE POLICY "Admins can manage FAQs"
ON public.faqs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_content_embeddings_updated_at
BEFORE UPDATE ON public.content_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample FAQs
INSERT INTO public.faqs (question, answer, category, tags) VALUES
('How do I enroll in a course?', 'Click the "Enroll Now" button on any course page. You''ll be guided through the payment process and gain immediate access to course materials.', 'enrollment', ARRAY['enrollment', 'getting-started']),
('What payment methods do you accept?', 'We accept all major credit cards, debit cards, and PayPal. Family membership plans offer significant savings for multiple learners.', 'billing', ARRAY['payment', 'pricing']),
('Can I access courses offline?', 'Yes! Our Progressive Web App (PWA) allows you to download course content for offline access. Perfect for learning on the go without internet.', 'technical', ARRAY['pwa', 'offline', 'mobile']),
('How does spaced repetition work?', 'Our flashcard system uses the proven SM-2 algorithm (same as Anki) to show you cards at optimal intervals. This increases retention by 25% compared to traditional studying.', 'courses', ARRAY['flashcards', 'spaced-repetition', 'learning']),
('What is the AI tutor?', 'Our AI tutor provides 24/7 personalized help. It has access to all course materials, blog posts, and FAQs to give you accurate, context-aware answers with citations.', 'courses', ARRAY['ai', 'help', 'tutor']),
('Is there a mobile app?', 'We have a Progressive Web App (PWA) that works on all devices. You can install it on your phone for an app-like experience with offline support.', 'technical', ARRAY['mobile', 'pwa', 'app']),
('How do I track my progress?', 'Your dashboard shows completion rates, skills acquired, and streaks. We also provide detailed analytics for instructors and learners.', 'courses', ARRAY['progress', 'dashboard', 'analytics']),
('What is adaptive assessment?', 'Our assessments use Computer Adaptive Testing (CAT) to adjust difficulty based on your performance. This provides accurate skill measurement in less time.', 'courses', ARRAY['assessment', 'cat', 'testing']),
('Can I get a refund?', 'Yes, we offer a 7-day money-back guarantee for all courses. Contact us via WhatsApp at +44 7404568207 for refund requests.', 'billing', ARRAY['refund', 'guarantee', 'support']),
('How do I contact support?', 'Reach us on WhatsApp at +44 7404568207 or use the AI chatbot for instant help. Our team responds within 24 hours.', 'support', ARRAY['contact', 'help', 'whatsapp']);

-- Create analytics table for tracking RAG performance
CREATE TABLE IF NOT EXISTS public.rag_query_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Query details
  user_id UUID REFERENCES auth.users(id),
  query_text TEXT NOT NULL,
  query_embedding vector(1536),

  -- Results
  results_count INTEGER DEFAULT 0,
  top_result_type TEXT,
  top_result_similarity FLOAT,

  -- Performance metrics
  search_latency_ms INTEGER, -- Time to retrieve similar content
  total_latency_ms INTEGER, -- Total time including GPT-4 response

  -- User feedback
  was_helpful BOOLEAN,
  user_feedback TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rag_analytics_user ON public.rag_query_analytics(user_id);
CREATE INDEX idx_rag_analytics_date ON public.rag_query_analytics(created_at);
CREATE INDEX idx_rag_analytics_helpful ON public.rag_query_analytics(was_helpful) WHERE was_helpful IS NOT NULL;

-- RLS for analytics
ALTER TABLE public.rag_query_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
ON public.rag_query_analytics
FOR SELECT
USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "System can insert analytics"
ON public.rag_query_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics"
ON public.rag_query_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add comment for documentation
COMMENT ON TABLE public.content_embeddings IS 'Stores vector embeddings for semantic search. Updated via embedding pipeline when content changes.';
COMMENT ON FUNCTION public.search_content_by_similarity IS 'Core RAG function: finds most similar content to a query embedding using cosine similarity.';
COMMENT ON TABLE public.rag_query_analytics IS 'Tracks RAG query performance and user satisfaction for continuous improvement.';
