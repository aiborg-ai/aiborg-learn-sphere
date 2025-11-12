# How to Fix Blog Articles SQL Schema Issue

## Problem

The original SQL files were created with incorrect column names that don't match your actual
database schema:

**Original (Wrong)**:

- `reading_time_minutes` → Should be `reading_time`
- `category` (text) → Should be `category_id` (UUID reference)
- `tags` (array) → Should use `blog_post_tags` junction table

## Solution

I've created a fixed version of Part 1. For Part 2, you have two options:

---

## Option 1: Use Fixed Part 1 + Simple Import Script (Recommended)

### Step 1: Use the Fixed File

Use `blog-articles-fixed-part1.sql` instead of the original.

This file includes:

- Correct schema matching your database
- Automatic category and tag creation
- Proper UUID references
- Junction table inserts

### Step 2: Create Simplified Version for Remaining Articles

Since Part 2 is large (197KB), I'll create a Python script to generate proper SQL:

```bash
# Coming next: generate-remaining-articles.py
```

---

## Option 2: Use AI Blog Workflow (Easiest)

Since your app has an AI Blog Workflow (`/ai-blog-workflow`), you can:

1. **Import the 2 complete articles** from `blog-articles-fixed-part1.sql`
2. **Use AI Blog Workflow** to generate the remaining 48 articles using the topics from
   `50_AI_BLOG_ARTICLES_NOV_2024.md`

This gives you:

- Full control over each article
- Ability to customize content
- Direct publishing to your blog
- No SQL schema issues

---

## Option 3: Manual Schema Fix (Technical)

If you want to fix the existing SQL files manually:

### What Needs to Change

1. **Column name**: `reading_time_minutes` → `reading_time`

2. **Category**: Instead of:

   ```sql
   category, tags,
   ...
   'AI News', ARRAY['OpenAI', 'ChatGPT'],
   ```

   Use:

   ```sql
   category_id,
   ...
   (SELECT id FROM blog_categories WHERE slug = 'ai-news'),
   ```

3. **Tags**: Remove from main INSERT, add after:
   ```sql
   -- After inserting post, add tags
   INSERT INTO blog_post_tags (post_id, tag_id)
   SELECT v_post_id, id FROM blog_tags WHERE slug IN ('openai', 'chatgpt');
   ```

---

## Database Schema Reference

Your actual `blog_posts` table structure:

```sql
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    author_id UUID REFERENCES auth.users(id) NOT NULL,
    category_id UUID REFERENCES blog_categories(id),  -- ← Not "category"
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    reading_time INTEGER DEFAULT 0,  -- ← Not "reading_time_minutes"
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    allow_comments BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Categories and tags are in separate tables with junction table for tags.

---

## Quick Start: Import First 2 Articles

1. **Get your author ID**:

   ```sql
   SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;
   ```

2. **Replace in blog-articles-fixed-part1.sql**: Change all `'YOUR_AUTHOR_ID'` to your actual UUID

3. **Run the fixed SQL**:
   - Open Supabase SQL Editor
   - Copy/paste `blog-articles-fixed-part1.sql`
   - Click "Run"

4. **Verify**:
   ```sql
   SELECT
     bp.title,
     bc.name as category,
     ARRAY_AGG(bt.name) as tags
   FROM blog_posts bp
   LEFT JOIN blog_categories bc ON bp.category_id = bc.id
   LEFT JOIN blog_post_tags bpt ON bp.id = bpt.post_id
   LEFT JOIN blog_tags bt ON bpt.tag_id = bt.id
   WHERE bp.created_at > NOW() - INTERVAL '5 minutes'
   GROUP BY bp.id, bp.title, bc.name;
   ```

---

## Recommended Path Forward

**For quickest results:**

1. ✅ Import 2 articles from `blog-articles-fixed-part1.sql`
2. ✅ Use AI Blog Workflow for remaining 48 articles
3. ✅ Use topics from `50_AI_BLOG_ARTICLES_NOV_2024.md` as prompts

**For complete automation:**

1. Wait for me to create a proper generation script
2. Script will create all 50 articles with correct schema
3. Import everything at once

Which approach would you prefer?

---

## Files

- ✅ `blog-articles-fixed-part1.sql` - Ready to use (2 articles)
- ⏳ `blog-articles-fixed-part2.sql` - Needs to be generated with correct schema
- 📋 `50_AI_BLOG_ARTICLES_NOV_2024.md` - All 50 topics for AI Blog Workflow

Let me know if you want me to:

1. Generate the fixed Part 2 SQL file
2. Create a Python script to generate proper SQL
3. Something else
