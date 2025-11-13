-- Fix Content Embeddings to support both INTEGER and UUID content IDs
-- Courses use INTEGER IDs, but blog posts use UUIDs

-- Drop the existing table (safe since we haven't successfully saved any data yet)
DROP TABLE IF EXISTS public.content_embeddings CASCADE;

-- Recreate with TEXT content_id to support both integers and UUIDs
CREATE TABLE IF NOT EXISTS public.content_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT NOT NULL, -- Changed from UUID to TEXT to support both integer and UUID IDs
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('course', 'learning_path', 'blog_post', 'assessment')),

    -- Vector embedding (768 dimensions for Ollama nomic-embed-text)
    embedding vector(768) NOT NULL,

    -- Metadata for better matching
    title TEXT,
    description TEXT,
    tags TEXT[],
    difficulty_level VARCHAR(20),

    -- Source text used for embedding
    embedding_text TEXT NOT NULL,

    -- Embedding metadata
    model_version VARCHAR(50) DEFAULT 'nomic-embed-text',
    embedding_quality_score DECIMAL(3, 2),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one embedding per content item
    CONSTRAINT unique_content_embedding UNIQUE (content_id, content_type)
);

-- Create indexes for fast similarity search
CREATE INDEX IF NOT EXISTS idx_content_embeddings_type
    ON public.content_embeddings(content_type);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector
    ON public.content_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_content_id
    ON public.content_embeddings(content_id);

COMMENT ON TABLE public.content_embeddings IS 'Vector embeddings for content similarity search (768 dims - Ollama). content_id is TEXT to support both integer and UUID IDs.';

-- ============================================================================
-- Helper Function for Vector Similarity Search
-- ============================================================================

-- Drop existing function first (return type is changing from UUID to TEXT)
DROP FUNCTION IF EXISTS find_similar_content(vector(768), VARCHAR, INTEGER, DECIMAL);

-- Function to find similar content using vector similarity (768 dimensions)
CREATE OR REPLACE FUNCTION find_similar_content(
    query_embedding vector(768),
    content_type_filter VARCHAR(50) DEFAULT NULL,
    limit_count INTEGER DEFAULT 10,
    min_similarity DECIMAL DEFAULT 0.5
)
RETURNS TABLE (
    content_id TEXT,
    content_type VARCHAR(50),
    title TEXT,
    similarity DECIMAL,
    tags TEXT[],
    difficulty_level VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.content_id,
        ce.content_type,
        ce.title,
        (1 - (ce.embedding <=> query_embedding))::DECIMAL AS similarity,
        ce.tags,
        ce.difficulty_level
    FROM public.content_embeddings ce
    WHERE
        (content_type_filter IS NULL OR ce.content_type = content_type_filter)
        AND (1 - (ce.embedding <=> query_embedding)) >= min_similarity
    ORDER BY ce.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Content Embeddings - Public read, anyone can insert, only admins can update/delete
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view content embeddings"
    ON public.content_embeddings FOR SELECT
    USING (true);

CREATE POLICY "Service can insert content embeddings"
    ON public.content_embeddings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Only admins can update content embeddings"
    ON public.content_embeddings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete content embeddings"
    ON public.content_embeddings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION find_similar_content(vector(768), VARCHAR, INTEGER, DECIMAL) TO authenticated;

-- Migration complete
