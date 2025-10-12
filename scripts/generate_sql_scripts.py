#!/usr/bin/env python3
"""
SQL Script Generator for Blog Articles
Creates PostgreSQL INSERT statements for all 500 articles
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List

def escape_sql_string(text: str) -> str:
    """Escape string for PostgreSQL"""
    if text is None:
        return 'NULL'
    # Escape single quotes
    escaped = text.replace("'", "''")
    # Escape backslashes
    escaped = escaped.replace("\\", "\\\\")
    return f"E'{escaped}'"

def generate_sql_insert(article: Dict, batch_num: int, index_in_batch: int) -> str:
    """Generate SQL INSERT statement for a single article"""

    # Calculate published date (staggered over past 500 days)
    days_ago = article.get('days_ago', 0)
    published_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d %H:%M:%S')

    # Build INSERT statement
    sql = f"""
-- Article {index_in_batch + 1}: {article['title']}
INSERT INTO blog_posts (
    title, slug, content, excerpt, category_id, author_id,
    status, is_featured, published_at, reading_time,
    meta_title, meta_description, seo_keywords,
    og_title, og_description, featured_image,
    created_at, updated_at
) VALUES (
    {escape_sql_string(article['title'])},
    {escape_sql_string(article['slug'])},
    {escape_sql_string(article['content'])},
    {escape_sql_string(article['excerpt'])},
    (SELECT id FROM blog_categories WHERE slug = {escape_sql_string(article['category'])} LIMIT 1),
    '00000000-0000-0000-0000-000000000000', -- Default system author
    'published',
    {str(index_in_batch == 0).lower()}, -- First article in each batch is featured
    TIMESTAMP '{published_date}',
    {article.get('reading_time', 5)},
    {escape_sql_string(article.get('meta_title', article['title']))},
    {escape_sql_string(article.get('meta_description', article['excerpt']))},
    {escape_sql_string(article.get('seo_keywords', ''))},
    {escape_sql_string(article.get('title', article['title']))},
    {escape_sql_string(article.get('excerpt', article['excerpt']))},
    {escape_sql_string(article.get('featured_image', ''))},
    TIMESTAMP '{published_date}',
    TIMESTAMP '{published_date}'
);
"""

    # Add tags if present
    if article.get('tags'):
        sql += f"\n-- Add tags for: {article['title']}\n"
        sql += "WITH last_post AS (SELECT id FROM blog_posts WHERE slug = " + escape_sql_string(article['slug']) + " LIMIT 1)\n"

        tag_inserts = []
        for tag in article['tags']:
            tag_slug = tag.lower().replace(' ', '-')
            tag_inserts.append(f"""
INSERT INTO blog_post_tags (post_id, tag_id)
SELECT
    (SELECT id FROM last_post),
    (SELECT id FROM blog_tags WHERE slug = {escape_sql_string(tag_slug)} LIMIT 1)
WHERE EXISTS (SELECT 1 FROM blog_tags WHERE slug = {escape_sql_string(tag_slug)})
ON CONFLICT (post_id, tag_id) DO NOTHING;
""")

        sql += '\n'.join(tag_inserts)

    return sql

def generate_batch_file(articles: List[Dict], batch_num: int, batch_size: int = 50) -> str:
    """Generate complete SQL file for a batch"""

    start_idx = (batch_num - 1) * batch_size
    end_idx = min(start_idx + batch_size, len(articles))
    batch_articles = articles[start_idx:end_idx]

    # Determine audience for this batch
    if batch_articles:
        audience = batch_articles[0]['audience']
    else:
        audience = 'Mixed'

    # File header
    sql_parts = [
        f"-- ========================================",
        f"-- Batch {batch_num}: {audience} Articles",
        f"-- Total articles in batch: {len(batch_articles)}",
        f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"-- ========================================\n",
        f"-- Temporarily disable RLS for bulk insert",
        f"ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;",
        f"ALTER TABLE blog_post_tags DISABLE ROW LEVEL SECURITY;\n",
        f"-- Begin transaction",
        f"BEGIN;\n"
    ]

    # Generate INSERT statements
    for i, article in enumerate(batch_articles):
        sql_parts.append(generate_sql_insert(article, batch_num, i))

    # File footer
    sql_parts.extend([
        "\n-- Commit transaction",
        "COMMIT;\n",
        "-- Re-enable RLS",
        "ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;\n",
        f"-- Batch {batch_num} complete",
        f"-- Articles inserted: {len(batch_articles)}"
    ])

    return '\n'.join(sql_parts)

def create_master_script(num_batches: int) -> str:
    """Create master script to execute all batches"""

    script = r"""#!/bin/bash
# Master script to insert all 500 blog articles
# Usage: ./insert_all_blog_articles.sh

set -e  # Exit on error

echo "========================================="
echo "Blog Articles Bulk Insert Script"
echo "========================================="
echo ""

# Database connection details
DB_HOST="aws-0-ap-south-1.pooler.supabase.com"
DB_PORT="5432"
DB_USER="postgres.afrulkxxzcmngbrdfuzj"
DB_NAME="postgres"
DB_PASSWORD="hirendra$1234ABCD"

echo "Database: $DB_HOST"
echo "User: $DB_USER"
echo ""

# Function to execute SQL file
execute_batch() {
    local batch_num=$1
    local filename="batch_${batch_num}_blog_articles.sql"

    echo "Executing Batch $batch_num: $filename"

    PGPASSWORD="$DB_PASSWORD" psql \\
        -h "$DB_HOST" \\
        -p "$DB_PORT" \\
        -U "$DB_USER" \\
        -d "$DB_NAME" \\
        -f "$filename" \\
        --quiet

    if [ $? -eq 0 ]; then
        echo "✓ Batch $batch_num completed successfully"
    else
        echo "✗ Batch $batch_num failed"
        exit 1
    fi

    echo ""
}

# Execute all batches
"""

    for i in range(1, num_batches + 1):
        script += f"execute_batch {i}\n"

    script += """
echo "========================================="
echo "All batches completed successfully!"
echo "========================================="
echo ""
echo "Verifying insertion..."

# Count total articles
TOTAL=$(PGPASSWORD="$DB_PASSWORD" psql \\
    -h "$DB_HOST" \\
    -p "$DB_PORT" \\
    -U "$DB_USER" \\
    -d "$DB_NAME" \\
    -t -c "SELECT COUNT(*) FROM blog_posts;")

echo "Total articles in database: $TOTAL"
echo ""
echo "Done!"
"""

    return script

def create_verification_queries() -> str:
    """Create SQL file with verification queries"""

    return """-- Verification Queries for Blog Articles
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
"""

def create_quick_stats_query() -> str:
    """Create quick statistics query"""

    return """-- Quick Statistics
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
"""

if __name__ == '__main__':
    # Load articles with content
    with open('/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/articles_with_content.json', 'r') as f:
        articles = json.load(f)

    print(f"Generating SQL scripts for {len(articles)} articles...")
    print("")

    # Create output directory
    output_dir = '/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts'
    os.makedirs(output_dir, exist_ok=True)

    # Generate batch files (50 articles per batch)
    batch_size = 50
    num_batches = (len(articles) + batch_size - 1) // batch_size

    for batch_num in range(1, num_batches + 1):
        batch_sql = generate_batch_file(articles, batch_num, batch_size)

        filename = f'{output_dir}/batch_{batch_num:02d}_blog_articles.sql'
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(batch_sql)

        articles_in_batch = min(batch_size, len(articles) - (batch_num - 1) * batch_size)
        print(f"  ✓ Generated batch {batch_num:02d}: {articles_in_batch} articles")

    # Create master execution script
    master_script = create_master_script(num_batches)
    with open(f'{output_dir}/insert_all_blog_articles.sh', 'w') as f:
        f.write(master_script)
    os.chmod(f'{output_dir}/insert_all_blog_articles.sh', 0o755)
    print(f"\n  ✓ Created master execution script")

    # Create verification queries
    verification_sql = create_verification_queries()
    with open(f'{output_dir}/verify_articles.sql', 'w') as f:
        f.write(verification_sql)
    print(f"  ✓ Created verification queries")

    # Create quick stats
    stats_sql = create_quick_stats_query()
    with open(f'{output_dir}/quick_stats.sql', 'w') as f:
        f.write(stats_sql)
    print(f"  ✓ Created quick stats query")

    print("")
    print("========================================")
    print("✅ All SQL scripts generated successfully!")
    print("========================================")
    print(f"Location: {output_dir}/")
    print(f"")
    print(f"Files created:")
    print(f"  - {num_batches} batch SQL files (50 articles each)")
    print(f"  - insert_all_blog_articles.sh (master script)")
    print(f"  - verify_articles.sql (verification queries)")
    print(f"  - quick_stats.sql (quick statistics)")
    print(f"")
    print(f"To insert all articles:")
    print(f"  cd {output_dir}")
    print(f"  ./insert_all_blog_articles.sh")
