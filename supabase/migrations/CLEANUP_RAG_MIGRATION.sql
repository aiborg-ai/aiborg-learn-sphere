/**
 * CLEANUP SCRIPT - RAG Vector Search System
 *
 * Use this ONLY if you need to completely remove the RAG system and start fresh.
 * WARNING: This will delete all embeddings and analytics data!
 *
 * To use:
 * 1. Copy this entire file
 * 2. Run in Supabase SQL Editor
 * 3. Then run the safe migration: 20251113100001_rag_vector_search_safe.sql
 */

-- Drop analytics table
DROP TABLE IF EXISTS public.rag_query_analytics CASCADE;

-- Drop embeddings table
DROP TABLE IF EXISTS public.content_embeddings CASCADE;

-- Drop FAQs table (optional - comment out if you want to keep FAQs)
-- DROP TABLE IF EXISTS public.faqs CASCADE;

-- Drop view
DROP VIEW IF EXISTS public.embeddable_content CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS public.search_content_by_similarity CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RAG system cleaned up successfully!';
  RAISE NOTICE 'You can now run the safe migration: 20251113100001_rag_vector_search_safe.sql';
END $$;
