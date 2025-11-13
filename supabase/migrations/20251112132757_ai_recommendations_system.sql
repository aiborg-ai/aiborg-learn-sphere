-- Migration: AI Recommendations System
-- Phase 6: AI-Powered Personalized Recommendations
-- Created: 2025-11-12

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Content Embeddings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('course', 'learning_path', 'blog_post', 'assessment')),

    -- Vector embedding (768 dimensions for Ollama nomic-embed-text, 1536 for OpenAI text-embedding-3-small)
    -- Using 768 as default for Ollama compatibility
    embedding vector(768) NOT NULL,

    -- Metadata for better matching
    title TEXT,
    description TEXT,
    tags TEXT[],
    difficulty_level VARCHAR(20),

    -- Source text used for embedding
    embedding_text TEXT NOT NULL,

    -- Embedding metadata
    model_version VARCHAR(50) DEFAULT 'text-embedding-3-small',
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

COMMENT ON TABLE public.content_embeddings IS 'Vector embeddings for content similarity search and recommendations';

-- ============================================================================
-- User Preferences Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences_ai (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Learning goals and interests
    learning_goals TEXT[],
    interested_topics TEXT[],
    preferred_difficulty_level VARCHAR(20),
    preferred_learning_style VARCHAR(50),

    -- Time preferences
    available_hours_per_week INTEGER,
    preferred_course_duration VARCHAR(20),

    -- Career goals
    career_goals TEXT[],
    target_skills TEXT[],

    -- Preferences for recommendations
    show_recommendations BOOLEAN DEFAULT true,
    recommendation_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One preference record per user
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_ai_user_id
    ON public.user_preferences_ai(user_id);

COMMENT ON TABLE public.user_preferences_ai IS 'User learning preferences for AI-powered recommendations';

-- ============================================================================
-- Recommendation History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Recommendation details
    recommendation_type VARCHAR(50) NOT NULL, -- course, learning_path, content
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,

    -- Scoring and ranking
    confidence_score DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000
    rank_position INTEGER NOT NULL,

    -- Recommendation context
    context_type VARCHAR(50), -- dashboard, course_page, search, etc.
    recommendation_reason JSONB, -- Why this was recommended

    -- User interaction
    shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clicked_at TIMESTAMPTZ,
    enrolled_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,

    -- A/B testing
    experiment_id VARCHAR(100),
    variant VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_id
    ON public.recommendation_history(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_history_content
    ON public.recommendation_history(content_id, content_type);

CREATE INDEX IF NOT EXISTS idx_recommendation_history_shown_at
    ON public.recommendation_history(shown_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_history_clicked
    ON public.recommendation_history(clicked_at)
    WHERE clicked_at IS NOT NULL;

COMMENT ON TABLE public.recommendation_history IS 'Track all recommendations shown to users and their interactions';

-- ============================================================================
-- Recommendation Feedback Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL REFERENCES public.recommendation_history(id) ON DELETE CASCADE,

    -- Feedback
    is_helpful BOOLEAN,
    feedback_type VARCHAR(50), -- relevant, not_interested, already_taken, too_difficult, too_easy
    feedback_text TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One feedback per recommendation
    CONSTRAINT unique_recommendation_feedback UNIQUE (recommendation_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_id
    ON public.recommendation_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_recommendation_id
    ON public.recommendation_feedback(recommendation_id);

COMMENT ON TABLE public.recommendation_feedback IS 'User feedback on recommendations quality';

-- ============================================================================
-- Recommendation Batch Jobs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Job details
    job_type VARCHAR(50) NOT NULL, -- generate_embeddings, update_recommendations
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed

    -- Processing stats
    items_total INTEGER,
    items_processed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Error tracking
    error_message TEXT,
    error_details JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_batch_jobs_status
    ON public.recommendation_batch_jobs(status);

CREATE INDEX IF NOT EXISTS idx_recommendation_batch_jobs_created_at
    ON public.recommendation_batch_jobs(created_at DESC);

COMMENT ON TABLE public.recommendation_batch_jobs IS 'Track batch processing jobs for embeddings and recommendations';

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to find similar content using vector similarity
-- Updated to support 768 dimensions (Ollama nomic-embed-text)
CREATE OR REPLACE FUNCTION find_similar_content(
    query_embedding vector(768),
    content_type_filter VARCHAR(50) DEFAULT NULL,
    limit_count INTEGER DEFAULT 10,
    min_similarity DECIMAL DEFAULT 0.5
)
RETURNS TABLE (
    content_id UUID,
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

-- Function to get user's learning history for recommendations
CREATE OR REPLACE FUNCTION get_user_learning_history(target_user_id UUID)
RETURNS TABLE (
    course_id UUID,
    course_title TEXT,
    completion_percentage INTEGER,
    avg_assessment_score DECIMAL,
    topics TEXT[],
    difficulty_level VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS course_id,
        c.title AS course_title,
        COALESCE(up.completion_percentage, 0) AS completion_percentage,
        COALESCE(AVG(ar.score), 0)::DECIMAL AS avg_assessment_score,
        ARRAY_AGG(DISTINCT c.category) FILTER (WHERE c.category IS NOT NULL) AS topics,
        c.difficulty_level
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    LEFT JOIN user_progress up ON up.user_id = e.user_id AND up.course_id = c.id
    LEFT JOIN assessment_results ar ON ar.user_id = e.user_id
    WHERE e.user_id = target_user_id
    GROUP BY c.id, c.title, up.completion_percentage, c.difficulty_level;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to calculate recommendation confidence score
CREATE OR REPLACE FUNCTION calculate_recommendation_score(
    vector_similarity DECIMAL,
    skill_match_score DECIMAL DEFAULT 0.5,
    difficulty_match_score DECIMAL DEFAULT 0.5,
    popularity_score DECIMAL DEFAULT 0.5
)
RETURNS DECIMAL AS $$
BEGIN
    -- Weighted scoring algorithm
    RETURN (
        0.4 * vector_similarity +
        0.3 * skill_match_score +
        0.2 * difficulty_match_score +
        0.1 * popularity_score
    )::DECIMAL(5, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to record recommendation impression
CREATE OR REPLACE FUNCTION record_recommendation_impression(
    target_user_id UUID,
    rec_type VARCHAR(50),
    target_content_id UUID,
    target_content_type VARCHAR(50),
    confidence DECIMAL,
    rank_pos INTEGER,
    context VARCHAR(50) DEFAULT NULL,
    reason JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO public.recommendation_history (
        user_id,
        recommendation_type,
        content_id,
        content_type,
        confidence_score,
        rank_position,
        context_type,
        recommendation_reason
    ) VALUES (
        target_user_id,
        rec_type,
        target_content_id,
        target_content_type,
        confidence,
        rank_pos,
        context,
        reason
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Content Embeddings - Public read, admin write
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view content embeddings"
    ON public.content_embeddings FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify content embeddings"
    ON public.content_embeddings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- User Preferences - Users can manage their own
ALTER TABLE public.user_preferences_ai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
    ON public.user_preferences_ai FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON public.user_preferences_ai FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON public.user_preferences_ai FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Recommendation History - Users can view their own, admins can view all
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendation history"
    ON public.recommendation_history FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Service can insert recommendations"
    ON public.recommendation_history FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own recommendation interactions"
    ON public.recommendation_history FOR UPDATE
    USING (auth.uid() = user_id);

-- Recommendation Feedback - Users can manage their own
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
    ON public.recommendation_feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can submit feedback"
    ON public.recommendation_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
    ON public.recommendation_feedback FOR UPDATE
    USING (auth.uid() = user_id);

-- Recommendation Batch Jobs - Admin only
ALTER TABLE public.recommendation_batch_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view batch jobs"
    ON public.recommendation_batch_jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Service can manage batch jobs"
    ON public.recommendation_batch_jobs FOR ALL
    USING (true);

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION find_similar_content(vector(768), VARCHAR, INTEGER, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_learning_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_recommendation_score(DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION record_recommendation_impression(UUID, VARCHAR, UUID, VARCHAR, DECIMAL, INTEGER, VARCHAR, JSONB) TO authenticated;

-- Migration complete
