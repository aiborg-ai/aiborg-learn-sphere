/**
 * Add Assessment Questions to RAG System
 *
 * Adds assessment questions (43 available) as an embeddable content type
 * for the RAG knowledge base.
 */

-- Update the embeddable_content view to include assessment questions
DROP VIEW IF EXISTS public.embeddable_content;

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
WHERE is_active = true

UNION ALL

-- Assessment Questions (NEW!)
SELECT
  'assessment' AS content_type,
  id::text AS content_id,
  question_text AS title,
  'Assessment Question: ' || question_text || E'\n\n' ||
  COALESCE('Help: ' || help_text, '') || E'\n\n' ||
  'Category: ' || (SELECT name FROM public.assessment_categories WHERE id = category_id) ||
  E'\n' ||
  'Type: ' || question_type AS content,
  jsonb_build_object(
    'category_id', category_id,
    'question_type', question_type,
    'difficulty', points_value,
    'audience_filters', audience_filters
  ) AS metadata,
  updated_at
FROM public.assessment_questions
WHERE is_active = true;

-- Update content_embeddings table constraint to allow 'assessment' type
ALTER TABLE public.content_embeddings
DROP CONSTRAINT IF EXISTS content_embeddings_content_type_check;

ALTER TABLE public.content_embeddings
ADD CONSTRAINT content_embeddings_content_type_check
CHECK (content_type IN (
  'course',
  'blog_post',
  'flashcard',
  'learning_path',
  'faq',
  'assessment'  -- NEW!
));

-- Add trigger for assessment questions auto-update
-- (if the queue_embedding_update function exists from earlier migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'queue_embedding_update'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_assessment_embedding_update ON assessment_questions;

    CREATE TRIGGER trigger_assessment_embedding_update
      AFTER INSERT OR UPDATE OF question_text, help_text ON assessment_questions
      FOR EACH ROW
      WHEN (NEW.is_active = TRUE)
      EXECUTE FUNCTION queue_embedding_update('assessment');

    DROP TRIGGER IF EXISTS trigger_assessment_embedding_delete ON assessment_questions;

    CREATE TRIGGER trigger_assessment_embedding_delete
      AFTER DELETE OR UPDATE OF is_active ON assessment_questions
      FOR EACH ROW
      EXECUTE FUNCTION queue_embedding_update('assessment');
  END IF;
END $$;

-- Add helpful comment
COMMENT ON VIEW public.embeddable_content IS
'Aggregates all content for RAG embedding: courses, blog_posts, flashcards, learning_paths, faqs, and assessment questions';
