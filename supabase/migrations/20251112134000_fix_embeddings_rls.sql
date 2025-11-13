-- Fix RLS Policy for Content Embeddings
-- Allow service to insert embeddings without authentication

-- Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Only admins can modify content embeddings" ON public.content_embeddings;

-- Create separate policies for INSERT and UPDATE/DELETE
-- Allow anyone to INSERT embeddings (for embedding generation)
CREATE POLICY "Service can insert content embeddings"
    ON public.content_embeddings FOR INSERT
    WITH CHECK (true);

-- Only admins can UPDATE or DELETE embeddings
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

-- Migration complete
