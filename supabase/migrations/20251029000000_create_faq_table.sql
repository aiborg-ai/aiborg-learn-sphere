-- FAQ Table with Vector Support
-- Created: 2025-10-29
-- Purpose: Store frequently asked questions for AI chatbot context and semantic search

-- ============================================================================
-- TABLE: faqs
-- Purpose: Store FAQ questions and answers with support for vector embeddings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'enrollment',
    'pricing',
    'technical',
    'learning_paths',
    'ai_concepts',
    'courses',
    'support',
    'general'
  )),

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  audience TEXT CHECK (audience IN ('primary', 'secondary', 'professional', 'business', 'all')),

  -- Analytics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Vector embedding support (for future Pinecone/pgvector integration)
  pinecone_embedding_id TEXT, -- ID in Pinecone vector database
  embedding_updated_at TIMESTAMPTZ,

  -- Management
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: faq_feedback
-- Purpose: Track user feedback on FAQ helpfulness
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.faq_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id UUID NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous users

  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_faqs_audience ON public.faqs(audience) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_faqs_tags ON public.faqs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON public.faqs(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_helpful ON public.faqs(helpful_count DESC) WHERE is_published = TRUE;

-- Full-text search index on questions and answers
CREATE INDEX IF NOT EXISTS idx_faqs_search ON public.faqs
  USING GIN(to_tsvector('english', question || ' ' || answer))
  WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_faq_feedback_faq_id ON public.faq_feedback(faq_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_faqs_updated_at ON public.faqs;
CREATE TRIGGER trg_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_faqs_updated_at();

-- ============================================================================
-- TRIGGER: Update view/helpful counts from feedback
-- ============================================================================
CREATE OR REPLACE FUNCTION update_faq_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_helpful THEN
    UPDATE public.faqs
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.faq_id;
  ELSE
    UPDATE public.faqs
    SET not_helpful_count = not_helpful_count + 1
    WHERE id = NEW.faq_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_faq_counts ON public.faq_feedback;
CREATE TRIGGER trg_update_faq_counts
  AFTER INSERT ON public.faq_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_counts();

-- ============================================================================
-- FUNCTION: Search FAQs with relevance ranking
-- ============================================================================
CREATE OR REPLACE FUNCTION search_faqs(
  p_query TEXT,
  p_category TEXT DEFAULT NULL,
  p_audience TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  category TEXT,
  tags TEXT[],
  helpful_count INTEGER,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    f.category,
    f.tags,
    f.helpful_count,
    ts_rank(
      to_tsvector('english', f.question || ' ' || f.answer),
      plainto_tsquery('english', p_query)
    ) AS relevance
  FROM public.faqs f
  WHERE f.is_published = TRUE
    AND (p_category IS NULL OR f.category = p_category)
    AND (p_audience IS NULL OR f.audience = p_audience OR f.audience = 'all')
    AND to_tsvector('english', f.question || ' ' || f.answer) @@ plainto_tsquery('english', p_query)
  ORDER BY relevance DESC, f.helpful_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get top FAQs by category
-- ============================================================================
CREATE OR REPLACE FUNCTION get_top_faqs(
  p_category TEXT DEFAULT NULL,
  p_audience TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  category TEXT,
  tags TEXT[],
  helpful_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    f.category,
    f.tags,
    f.helpful_count
  FROM public.faqs f
  WHERE f.is_published = TRUE
    AND (p_category IS NULL OR f.category = p_category)
    AND (f.audience = p_audience OR f.audience = 'all')
  ORDER BY f.helpful_count DESC, f.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_feedback ENABLE ROW LEVEL SECURITY;

-- Everyone can view published FAQs
CREATE POLICY "Anyone can view published FAQs"
  ON public.faqs FOR SELECT
  USING (is_published = TRUE);

-- Admin can manage all FAQs
CREATE POLICY "Admin can manage FAQs"
  ON public.faqs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can submit feedback
CREATE POLICY "Authenticated users can submit feedback"
  ON public.faq_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Anonymous users can also submit feedback (with session_id)
CREATE POLICY "Anonymous users can submit feedback"
  ON public.faq_feedback FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- Service role has full access (for edge functions)
CREATE POLICY "Service role can access faqs"
  ON public.faqs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Grant Permissions
-- ============================================================================
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT INSERT ON public.faq_feedback TO anon, authenticated;
GRANT ALL ON public.faqs TO service_role;
GRANT ALL ON public.faq_feedback TO service_role;

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================
COMMENT ON TABLE public.faqs IS 'Frequently asked questions with support for semantic search and vector embeddings';
COMMENT ON TABLE public.faq_feedback IS 'User feedback on FAQ helpfulness for continuous improvement';
COMMENT ON COLUMN public.faqs.pinecone_embedding_id IS 'Reference ID for vector embedding in Pinecone (for future RAG implementation)';
COMMENT ON FUNCTION search_faqs IS 'Full-text search FAQs with relevance ranking';
COMMENT ON FUNCTION get_top_faqs IS 'Get most helpful FAQs by category and audience';
