# Blog Articles - Bulk Insert Scripts

## Overview

This directory contains SQL scripts to insert **500 AI-focused blog articles** into the Aiborg Learn
Sphere database.

### Content Distribution

- **Young Learners (8-12)**: 100 articles (Batches 1-2)
- **Teenagers (13-18)**: 100 articles (Batches 3-4)
- **Professionals**: 150 articles (Batches 5-7)
- **Business Owners/SMEs**: 150 articles (Batches 8-10)

**Total**: 500 articles across 10 batch files (50 articles per batch)

## Files Included

### Batch SQL Files

- `batch_01_blog_articles.sql` - Young Learners (Articles 1-50)
- `batch_02_blog_articles.sql` - Young Learners (Articles 51-100)
- `batch_03_blog_articles.sql` - Teenagers (Articles 101-150)
- `batch_04_blog_articles.sql` - Teenagers (Articles 151-200)
- `batch_05_blog_articles.sql` - Professionals (Articles 201-250)
- `batch_06_blog_articles.sql` - Professionals (Articles 251-300)
- `batch_07_blog_articles.sql` - Professionals (Articles 301-350)
- `batch_08_blog_articles.sql` - Business Owners (Articles 351-400)
- `batch_09_blog_articles.sql` - Business Owners (Articles 401-450)
- `batch_10_blog_articles.sql` - Business Owners (Articles 451-500)

### Utility Scripts

- `insert_all_blog_articles.sh` - Master script to insert all batches sequentially
- `verify_articles.sql` - Comprehensive verification queries
- `quick_stats.sql` - Quick statistics and counts
- `README.md` - This file

## Quick Start

### Option 1: Insert All Articles (Recommended)

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts
./insert_all_blog_articles.sh
```

This will:

1. Insert all 500 articles in 10 batches
2. Show progress for each batch
3. Verify successful insertion
4. Display total count

**Expected Duration**: 5-10 minutes

### Option 2: Insert Individual Batches

If you prefer to insert batches manually or test first:

```bash
# Insert a single batch (replace XX with batch number 01-10)
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -f batch_XX_blog_articles.sql
```

Example - Insert only batch 1:

```bash
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -f batch_01_blog_articles.sql
```

## Verification

### After Insertion

Run the verification queries to check data integrity:

```bash
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -f verify_articles.sql
```

### Quick Statistics

Get a quick overview of inserted articles:

```bash
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -f quick_stats.sql
```

Expected output:

```
           metric           | value
----------------------------+-------
 Total Articles             | 500
 Published Articles         | 500
 Young Learners Articles    | 100
 Teenagers Articles         | 100
 Professionals Articles     | 150
 Business Owners Articles   | 150
 Total Tags Used            | 10
 Average Reading Time (min) | 6.5
```

## Article Metadata

Each article includes:

- **Title**: SEO-optimized, audience-appropriate
- **Slug**: URL-friendly identifier
- **Content**: 800-3000 words (varies by audience)
- **Excerpt**: 150-200 character summary
- **Category**: Maps to blog_categories (young-learners, teenagers, professionals, business-owners)
- **Tags**: 3-5 relevant tags per article
- **SEO Metadata**: meta_title, meta_description, seo_keywords
- **Open Graph**: og_title, og_description for social sharing
- **Featured Image**: Unsplash URLs
- **Reading Time**: Auto-calculated based on word count
- **Published Date**: Staggered over past 500 days for realistic timeline

## Database Structure

Articles are inserted into these tables:

1. **blog_posts**: Main article content
2. **blog_post_tags**: Junction table linking articles to tags
3. **blog_categories**: Categories (must exist before insertion)
4. **blog_tags**: Tags (must exist before insertion)

## Prerequisites

Before running the scripts, ensure:

1. ✅ Database connection is working
2. ✅ `blog_categories` table has the required categories:
   - `young-learners`
   - `teenagers`
   - `professionals`
   - `business-owners`
3. ✅ `blog_tags` table has common tags
4. ✅ RLS policies allow insertion (scripts temporarily disable RLS)

### Check Prerequisites

```sql
-- Check categories exist
SELECT slug, name FROM blog_categories
WHERE slug IN ('young-learners', 'teenagers', 'professionals', 'business-owners');

-- Check tags exist
SELECT slug, name FROM blog_tags LIMIT 10;
```

If categories or tags are missing, run the setup script first:

```bash
psql -f ../setup-blog-categories.sql
```

## Safety Features

Each batch script:

- Uses transactions (BEGIN/COMMIT) for atomicity
- Temporarily disables RLS for bulk insert efficiency
- Re-enables RLS after insertion
- Uses `ON CONFLICT DO NOTHING` for tag associations
- Validates category existence with subqueries

## Troubleshooting

### Error: "Tenant or user not found"

**Cause**: Database credentials are incorrect or database is inaccessible.

**Solution**: Verify connection details in the script or contact database administrator.

### Error: "relation blog_categories does not exist"

**Cause**: Blog tables haven't been created yet.

**Solution**: Run the blog table migration first:

```bash
psql -f ../supabase/migrations/20241216_create_blog_tables.sql
```

### Error: "duplicate key value violates unique constraint"

**Cause**: Articles with same slugs already exist.

**Solution**: Either:

1. Delete existing articles: `DELETE FROM blog_posts WHERE slug LIKE '%';`
2. Modify slugs in the JSON manifest before regenerating scripts

### Partial Insertion

If a batch fails mid-way, the transaction will rollback, ensuring no partial data.

To resume:

1. Identify which batches were successful
2. Run only the remaining batches manually
3. Or re-run the master script (it will show errors for duplicates but continue)

## Performance

- **Batch Size**: 50 articles per batch
- **Insertion Speed**: ~30 seconds per batch
- **Total Time**: 5-10 minutes for all 500 articles
- **Database Load**: Moderate (indexes are updated incrementally)

## Post-Insertion Steps

After successful insertion:

1. **Verify Frontend**: Visit your blog page to ensure articles display correctly
2. **Check SEO**: Verify meta tags are rendering
3. **Test Search**: Ensure search functionality works with new content
4. **Review Featured**: Check that featured articles appear on homepage
5. **Monitor Performance**: Ensure page load times are acceptable

## Maintenance

### Adding More Articles Later

To add more articles:

1. Update `article_manifest.json` with new topics
2. Run `content_generator.py` to generate content
3. Run `generate_sql_scripts.py` to create new batch files
4. Execute the new batches

### Updating Existing Articles

Use SQL UPDATE statements:

```sql
UPDATE blog_posts
SET content = 'new content here'
WHERE slug = 'article-slug';
```

## Support

For issues or questions:

- Check the verification queries output
- Review database logs
- Consult the main project CLAUDE.md file

---

**Generated**: 2025-10-12 **Total Articles**: 500 **Script Version**: 1.0 **Database**: Supabase
PostgreSQL
