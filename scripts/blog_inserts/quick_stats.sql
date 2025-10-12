-- Quick Statistics
SELECT
    'Total Articles' AS metric,
    COUNT(*)::TEXT AS value
FROM blog_posts

UNION ALL

SELECT
    'Published Articles',
    COUNT(*)::TEXT
FROM blog_posts
WHERE status = 'published'

UNION ALL

SELECT
    'Young Learners Articles',
    COUNT(*)::TEXT
FROM blog_posts bp
JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bc.slug = 'young-learners'

UNION ALL

SELECT
    'Teenagers Articles',
    COUNT(*)::TEXT
FROM blog_posts bp
JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bc.slug = 'teenagers'

UNION ALL

SELECT
    'Professionals Articles',
    COUNT(*)::TEXT
FROM blog_posts bp
JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bc.slug = 'professionals'

UNION ALL

SELECT
    'Business Owners Articles',
    COUNT(*)::TEXT
FROM blog_posts bp
JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bc.slug = 'business-owners'

UNION ALL

SELECT
    'Total Tags Used',
    COUNT(DISTINCT tag_id)::TEXT
FROM blog_post_tags

UNION ALL

SELECT
    'Average Reading Time (minutes)',
    ROUND(AVG(reading_time), 1)::TEXT
FROM blog_posts;
