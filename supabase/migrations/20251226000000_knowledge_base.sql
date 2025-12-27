-- ============================================================================
-- KNOWLEDGE BASE EXTENSION FOR VAULT CONTENT
-- ============================================================================
-- Extends vault_content table to support public AI Knowledge Base articles
-- Created: December 26, 2025
-- ============================================================================

-- Add content column for article body (markdown/HTML content)
-- This is needed since KB articles store full text content, not just URLs
ALTER TABLE public.vault_content
  ADD COLUMN IF NOT EXISTS content TEXT;

-- Add Knowledge Base specific fields
ALTER TABLE public.vault_content
  ADD COLUMN IF NOT EXISTS is_knowledge_base BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS kb_category TEXT,
  ADD COLUMN IF NOT EXISTS kb_difficulty TEXT CHECK (kb_difficulty IN ('beginner', 'intermediate', 'advanced'));

-- Add status field for content workflow (draft, published, archived)
ALTER TABLE public.vault_content
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));

-- Add SEO fields for knowledge base articles
ALTER TABLE public.vault_content
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- Add structured metadata JSONB for KB-specific data
ALTER TABLE public.vault_content
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update metadata column with default structure for existing rows
UPDATE public.vault_content
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

-- Create indexes for Knowledge Base filtering and searching
CREATE INDEX IF NOT EXISTS idx_vault_content_kb
  ON public.vault_content(is_knowledge_base)
  WHERE is_knowledge_base = true;

CREATE INDEX IF NOT EXISTS idx_vault_content_kb_category
  ON public.vault_content(kb_category)
  WHERE is_knowledge_base = true;

CREATE INDEX IF NOT EXISTS idx_vault_content_kb_difficulty
  ON public.vault_content(kb_difficulty)
  WHERE is_knowledge_base = true;

CREATE INDEX IF NOT EXISTS idx_vault_content_status
  ON public.vault_content(status);

-- Full-text search index for KB articles
CREATE INDEX IF NOT EXISTS idx_vault_content_kb_search
  ON public.vault_content USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '') || ' ' || description))
  WHERE is_knowledge_base = true;

-- Metadata JSONB index for efficient querying
CREATE INDEX IF NOT EXISTS idx_vault_content_metadata
  ON public.vault_content USING GIN(metadata)
  WHERE is_knowledge_base = true;

-- ============================================================================
-- RLS POLICIES FOR PUBLIC KNOWLEDGE BASE
-- ============================================================================

-- Public KB articles are viewable by everyone (not just members)
CREATE POLICY "Public KB articles are viewable by everyone"
  ON public.vault_content
  FOR SELECT
  USING (
    is_knowledge_base = true
    AND status = 'published'
  );

-- Note: The existing "Members can view published vault content" policy
-- (from 20251017120002_vault_content.sql) will handle premium vault content.
-- These two policies work together - KB articles are public, vault content is members-only.

-- ============================================================================
-- HELPER FUNCTIONS FOR KNOWLEDGE BASE
-- ============================================================================

-- Function to generate reading time estimate (words per minute)
CREATE OR REPLACE FUNCTION public.estimate_reading_time(p_content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  word_count INTEGER;
  reading_speed INTEGER := 200; -- Average words per minute
BEGIN
  -- Count words (split by whitespace)
  word_count := array_length(regexp_split_to_array(p_content, '\s+'), 1);

  -- Return reading time in minutes (minimum 1 minute)
  RETURN GREATEST(1, ROUND(word_count::DECIMAL / reading_speed));
END;
$$;

-- Function to extract table of contents from markdown content
-- This parses H2 and H3 headers and returns structured TOC
CREATE OR REPLACE FUNCTION public.extract_toc_from_markdown(p_content TEXT)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  toc JSONB := '[]'::jsonb;
  lines TEXT[];
  line TEXT;
  heading_match TEXT[];
  heading_level INTEGER;
  heading_text TEXT;
  heading_anchor TEXT;
BEGIN
  -- Split content into lines
  lines := regexp_split_to_array(p_content, '\n');

  -- Iterate through lines looking for markdown headings
  FOREACH line IN ARRAY lines
  LOOP
    -- Match ## or ### at start of line
    IF line ~ '^#{2,3}\s+' THEN
      -- Extract heading level (2 or 3)
      heading_level := length(substring(line from '^#+'));

      -- Extract heading text (remove # and trim)
      heading_text := trim(regexp_replace(line, '^#+\s+', ''));

      -- Generate anchor (lowercase, replace spaces with hyphens)
      heading_anchor := lower(regexp_replace(heading_text, '\s+', '-', 'g'));
      heading_anchor := regexp_replace(heading_anchor, '[^a-z0-9-]', '', 'g');

      -- Add to TOC
      toc := toc || jsonb_build_object(
        'level', heading_level,
        'title', heading_text,
        'anchor', heading_anchor
      );
    END IF;
  END LOOP;

  RETURN toc;
END;
$$;

-- Trigger to auto-update metadata when KB article is saved
CREATE OR REPLACE FUNCTION public.update_kb_article_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process Knowledge Base articles
  IF NEW.is_knowledge_base = true AND NEW.content IS NOT NULL THEN
    -- Auto-generate reading time if not in metadata
    IF NEW.metadata ? 'reading_time_minutes' = false THEN
      NEW.metadata := NEW.metadata || jsonb_build_object(
        'reading_time_minutes', public.estimate_reading_time(NEW.content)
      );
    END IF;

    -- Auto-generate table of contents if not in metadata
    IF NEW.metadata ? 'table_of_contents' = false THEN
      NEW.metadata := NEW.metadata || jsonb_build_object(
        'table_of_contents', public.extract_toc_from_markdown(NEW.content)
      );
    END IF;

    -- Set last_reviewed_date if content changed
    IF OLD.content IS DISTINCT FROM NEW.content THEN
      NEW.metadata := NEW.metadata || jsonb_build_object(
        'last_reviewed_date', CURRENT_DATE
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_kb_article_metadata ON public.vault_content;
CREATE TRIGGER trigger_update_kb_article_metadata
  BEFORE INSERT OR UPDATE ON public.vault_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kb_article_metadata();

-- ============================================================================
-- KNOWLEDGE BASE ANALYTICS TABLE
-- ============================================================================

-- Track KB article ratings (helpful/not helpful votes)
CREATE TABLE IF NOT EXISTS public.kb_article_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.vault_content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous votes
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate votes from same user (if authenticated)
  CONSTRAINT unique_user_article_rating UNIQUE (article_id, user_id)
);

-- Create indexes
CREATE INDEX idx_kb_article_ratings_article_id ON public.kb_article_ratings(article_id);
CREATE INDEX idx_kb_article_ratings_created_at ON public.kb_article_ratings(created_at);

-- Enable RLS
ALTER TABLE public.kb_article_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view article ratings"
  ON public.kb_article_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert article ratings"
  ON public.kb_article_ratings
  FOR INSERT
  WITH CHECK (true);

-- Function to get article rating statistics
CREATE OR REPLACE FUNCTION public.get_article_rating_stats(p_article_id UUID)
RETURNS TABLE (
  total_votes INTEGER,
  helpful_votes INTEGER,
  unhelpful_votes INTEGER,
  helpful_percentage DECIMAL
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    COUNT(*)::INTEGER AS total_votes,
    COUNT(*) FILTER (WHERE is_helpful = true)::INTEGER AS helpful_votes,
    COUNT(*) FILTER (WHERE is_helpful = false)::INTEGER AS unhelpful_votes,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE is_helpful = true)::DECIMAL / COUNT(*)) * 100, 1)
      ELSE 0
    END AS helpful_percentage
  FROM public.kb_article_ratings
  WHERE article_id = p_article_id;
$$;

-- ============================================================================
-- KNOWLEDGE BASE CATEGORIES & METADATA
-- ============================================================================

-- Define standard KB categories (these can be referenced in application)
COMMENT ON COLUMN public.vault_content.kb_category IS 'Knowledge Base category: ai_fundamentals, ml_algorithms, practical_tools, prompt_engineering, business_ai, ai_ethics, deployment, or custom';

-- Document metadata JSONB structure
COMMENT ON COLUMN public.vault_content.metadata IS 'Structured metadata for KB articles:
{
  "table_of_contents": [{"level": 2, "title": "Introduction", "anchor": "intro"}],
  "related_articles": ["uuid-1", "uuid-2"],
  "prerequisites": ["basic-python", "statistics"],
  "reading_time_minutes": 15,
  "last_reviewed_date": "2025-01-15",
  "author_notes": "Updated with GPT-4 examples",
  "code_examples_url": "https://github.com/...",
  "external_references": [{"title": "Paper Title", "url": "https://..."}],
  "ai_generated": true,
  "generation_prompt": "Explain transformers"
}';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.vault_content.is_knowledge_base IS 'Set to true for public KB articles, false for premium vault content';
COMMENT ON COLUMN public.vault_content.content IS 'Full article content in Markdown or HTML format (for KB articles)';
COMMENT ON COLUMN public.vault_content.status IS 'Content workflow status: draft (not public), published (live), archived (hidden)';
COMMENT ON TABLE public.kb_article_ratings IS 'Tracks helpful/not helpful votes for knowledge base articles';
COMMENT ON FUNCTION public.estimate_reading_time IS 'Calculates estimated reading time based on word count (200 wpm)';
COMMENT ON FUNCTION public.extract_toc_from_markdown IS 'Extracts table of contents from markdown H2/H3 headers';
COMMENT ON FUNCTION public.get_article_rating_stats IS 'Returns aggregated rating statistics for a KB article';
