-- ====================================================================
-- CHECK BLOG POSTS CONTENT
-- This script checks which blog posts have actual content vs empty/placeholder
-- ====================================================================

-- STEP 1: Count total blog posts by status
SELECT
  status,
  COUNT(*) as post_count
FROM blog_posts
GROUP BY status
ORDER BY post_count DESC;

-- Expected: Shows how many posts are draft, published, scheduled, etc.

-- ====================================================================

-- STEP 2: Check published posts and their content length
SELECT
  id,
  title,
  slug,
  LENGTH(content) as content_length,
  LENGTH(excerpt) as excerpt_length,
  published_at,
  created_at,
  CASE
    WHEN LENGTH(content) = 0 THEN '❌ EMPTY'
    WHEN LENGTH(content) < 100 THEN '⚠️ TOO SHORT'
    WHEN LENGTH(content) < 500 THEN '⚠️ MINIMAL'
    WHEN LENGTH(content) >= 500 THEN '✅ HAS CONTENT'
  END as content_status
FROM blog_posts
WHERE status = 'published'
ORDER BY published_at DESC;

-- Expected: List of published posts with content length analysis

-- ====================================================================

-- STEP 3: Find posts with empty or minimal content
SELECT
  title,
  slug,
  status,
  LENGTH(content) as content_length,
  LEFT(content, 100) as content_preview
FROM blog_posts
WHERE LENGTH(content) < 500
ORDER BY status, content_length;

-- Expected: Posts that need content added

-- ====================================================================

-- STEP 4: Summary statistics
SELECT
  'TOTAL POSTS' as metric,
  COUNT(*) as count
FROM blog_posts

UNION ALL

SELECT
  'PUBLISHED POSTS' as metric,
  COUNT(*) as count
FROM blog_posts
WHERE status = 'published'

UNION ALL

SELECT
  'PUBLISHED WITH CONTENT (>500 chars)' as metric,
  COUNT(*) as count
FROM blog_posts
WHERE status = 'published' AND LENGTH(content) >= 500

UNION ALL

SELECT
  'PUBLISHED BUT EMPTY/MINIMAL' as metric,
  COUNT(*) as count
FROM blog_posts
WHERE status = 'published' AND LENGTH(content) < 500

UNION ALL

SELECT
  'DRAFT POSTS' as metric,
  COUNT(*) as count
FROM blog_posts
WHERE status = 'draft';

-- Expected: Overall summary of blog content status

-- ====================================================================

-- STEP 5: Check posts by category with content status
SELECT
  bc.name as category,
  COUNT(bp.id) as total_posts,
  COUNT(CASE WHEN bp.status = 'published' THEN 1 END) as published,
  COUNT(CASE WHEN bp.status = 'published' AND LENGTH(bp.content) >= 500 THEN 1 END) as published_with_content,
  COUNT(CASE WHEN bp.status = 'published' AND LENGTH(bp.content) < 500 THEN 1 END) as published_needs_content
FROM blog_categories bc
LEFT JOIN blog_posts bp ON bc.id = bp.category_id
GROUP BY bc.name
ORDER BY total_posts DESC;

-- Expected: Breakdown by category

-- ====================================================================

-- STEP 6: List ALL published posts with details
SELECT
  bp.title,
  bp.slug,
  bc.name as category,
  LENGTH(bp.content) as content_chars,
  bp.reading_time,
  bp.view_count,
  bp.published_at,
  CASE
    WHEN LENGTH(bp.content) >= 2000 THEN '✅ FULL ARTICLE'
    WHEN LENGTH(bp.content) >= 500 THEN '✅ HAS CONTENT'
    WHEN LENGTH(bp.content) > 0 THEN '⚠️ NEEDS MORE CONTENT'
    ELSE '❌ EMPTY'
  END as status
FROM blog_posts bp
LEFT JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bp.status = 'published'
ORDER BY bp.published_at DESC;

-- Expected: Complete list of published posts with quality assessment

-- ====================================================================

-- STEP 7: Find potential placeholder content
SELECT
  title,
  slug,
  content,
  LENGTH(content) as length
FROM blog_posts
WHERE status = 'published'
  AND (
    content ILIKE '%lorem ipsum%'
    OR content ILIKE '%placeholder%'
    OR content ILIKE '%coming soon%'
    OR content ILIKE '%to be written%'
    OR LENGTH(content) < 200
  );

-- Expected: Posts that might have placeholder text

-- ====================================================================

-- STEP 8: Check for duplicate content
SELECT
  content,
  COUNT(*) as duplicate_count,
  array_agg(title) as titles_with_same_content
FROM blog_posts
WHERE status = 'published'
GROUP BY content
HAVING COUNT(*) > 1;

-- Expected: Any posts that have identical content (likely placeholders)

-- ====================================================================
-- INTERPRETATION:
--
-- ✅ FULL ARTICLE (>2000 chars): Well-written, complete blog post
-- ✅ HAS CONTENT (500-2000 chars): Acceptable content, may need expansion
-- ⚠️ NEEDS MORE CONTENT (1-499 chars): Has text but too short
-- ❌ EMPTY (0 chars): No content at all
--
-- ACTION ITEMS:
-- 1. Review posts marked as ⚠️ or ❌
-- 2. Add content to empty posts or change status to 'draft'
-- 3. Expand short posts to at least 500 words (~2500-3000 chars)
-- 4. Remove any placeholder text
-- ====================================================================

-- Created: October 9, 2025
-- Purpose: Audit blog posts content quality
