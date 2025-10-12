-- Verification Queries for Blog Articles
-- Run these after insertion to verify data integrity

-- 1. Count articles by category
SELECT
    bc.name AS category,
    COUNT(bp.id) AS article_count
FROM blog_categories bc
LEFT JOIN blog_posts bp ON bc.id = bp.category_id
GROUP BY bc.name
ORDER BY article_count DESC;

-- 2. Check for duplicate slugs
SELECT slug, COUNT(*) as count
FROM blog_posts
GROUP BY slug
HAVING COUNT(*) > 1;

-- 3. Verify all articles have required fields
SELECT
    COUNT(*) FILTER (WHERE title IS NULL OR title = '') AS missing_title,
    COUNT(*) FILTER (WHERE content IS NULL OR content = '') AS missing_content,
    COUNT(*) FILTER (WHERE slug IS NULL OR slug = '') AS missing_slug,
    COUNT(*) FILTER (WHERE excerpt IS NULL OR excerpt = '') AS missing_excerpt,
    COUNT(*) FILTER (WHERE category_id IS NULL) AS missing_category
FROM blog_posts;

-- 4. Articles by status
SELECT status, COUNT(*) as count
FROM blog_posts
GROUP BY status;

-- 5. Recent articles (last 30 days)
SELECT title, published_at, reading_time
FROM blog_posts
WHERE published_at >= NOW() - INTERVAL '30 days'
ORDER BY published_at DESC
LIMIT 20;

-- 6. Check tag associations
SELECT
    t.name AS tag,
    COUNT(pt.post_id) AS usage_count
FROM blog_tags t
LEFT JOIN blog_post_tags pt ON t.id = pt.tag_id
GROUP BY t.name
ORDER BY usage_count DESC;

-- 7. Articles without tags (should investigate)
SELECT COUNT(*)
FROM blog_posts bp
LEFT JOIN blog_post_tags bpt ON bp.id = bpt.post_id
WHERE bpt.post_id IS NULL;

-- 8. Average reading time by category
SELECT
    bc.name AS category,
    AVG(bp.reading_time) AS avg_reading_time,
    MIN(bp.reading_time) AS min_reading_time,
    MAX(bp.reading_time) AS max_reading_time
FROM blog_posts bp
JOIN blog_categories bc ON bp.category_id = bc.id
GROUP BY bc.name;

-- 9. Total word count estimate (based on reading time)
SELECT
    SUM(reading_time * 200) AS estimated_total_words,
    AVG(reading_time) AS avg_reading_time_minutes,
    COUNT(*) AS total_articles
FROM blog_posts;

-- 10. Featured articles
SELECT title, category_id, published_at
FROM blog_posts
WHERE is_featured = true
ORDER BY published_at DESC;
