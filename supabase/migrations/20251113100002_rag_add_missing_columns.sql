/**
 * RAG Migration - Add Missing Columns
 * This fixes partial table creation by adding any missing columns
 */

-- Add missing columns to content_embeddings if they don't exist
DO $$
BEGIN
  -- Add metadata column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'content_embeddings'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.content_embeddings ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added metadata column';
  END IF;

  -- Add content_tokens column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'content_embeddings'
    AND column_name = 'content_tokens'
  ) THEN
    ALTER TABLE public.content_embeddings ADD COLUMN content_tokens INTEGER;
    RAISE NOTICE 'Added content_tokens column';
  END IF;

  -- Add created_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'content_embeddings'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.content_embeddings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'content_embeddings'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.content_embeddings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;

  RAISE NOTICE 'All columns verified!';
END $$;

-- Now run the rest of the safe migration
-- Create indexes (safe - with DROP IF EXISTS)
DROP INDEX IF EXISTS public.idx_content_embeddings_type;
CREATE INDEX IF NOT EXISTS idx_content_embeddings_type ON public.content_embeddings(content_type);

DROP INDEX IF EXISTS public.idx_content_embeddings_metadata;
CREATE INDEX IF NOT EXISTS idx_content_embeddings_metadata ON public.content_embeddings USING gin(metadata);

DROP INDEX IF EXISTS public.idx_content_embeddings_vector;
CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector ON public.content_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Recreate the view (handles missing metadata column)
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

-- Flashcard Decks
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Missing columns added successfully!';
  RAISE NOTICE 'Run the safe migration (20251113100001) or continue with edge function deployment.';
END $$;
