# Knowledge Base Migration Instructions

## Quick Setup (5 minutes)

The knowledge base migration is ready to be applied to your Supabase database. Since the local
Supabase instance had Docker networking issues, we need to apply the migrations to your remote
database.

**IMPORTANT**: You need to apply **TWO migrations in order**:

1. Base `vault_content` table (creates the table)
2. Knowledge base extensions (adds KB-specific features)

### Option 1: Supabase Dashboard (Recommended - Easiest)

#### Step 1: Create the Base vault_content Table

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql/new
   - (Or navigate to your project → SQL Editor → New Query)

2. **Copy the base migration SQL**:
   - Open: `supabase/migrations/20251017120002_vault_content.sql`
   - Copy the entire contents (all 302 lines)

3. **Paste and Run**:
   - Paste the SQL into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - Wait for completion (should take ~10-15 seconds)

4. **Verify Success**:
   - You should see "Success. No rows returned"
   - Check that the `vault_content` table now exists in your database
   - Should have 10 sample content items inserted

#### Step 2: Apply Knowledge Base Extensions

5. **Open a NEW query** in SQL Editor

6. **Copy the KB migration SQL**:
   - Open: `supabase/migrations/20251226000000_knowledge_base.sql`
   - Copy the entire contents (all 283 lines)

7. **Paste and Run**:
   - Paste the SQL into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - Wait for completion (should take ~5-10 seconds)

8. **Verify Success**:
   - You should see "Success. No rows returned"
   - Check that these new columns exist on `vault_content` table:
     - `content` (text)
     - `is_knowledge_base` (boolean)
     - `kb_category` (text)
     - `kb_difficulty` (text)
     - `status` (text)
     - `metadata` (jsonb)

### Option 2: Command Line (Advanced)

If you have the database password:

```bash
# Set your database password
export PGPASSWORD="your-database-password-here"

# Apply migration
psql "postgresql://postgres.afrulkxxzcmngbrdfuzj:$PGPASSWORD@db.afrulkxxzcmngbrdfuzj.supabase.co:5432/postgres" \
  -f supabase/migrations/20251226000000_knowledge_base.sql
```

## What This Migration Does

### Database Changes:

✅ **Extends `vault_content` table** with KB-specific fields:

- `content` - Full article body (Markdown/HTML)
- `is_knowledge_base` - Flag to differentiate KB articles from premium vault content
- `kb_category` - Category (ai_fundamentals, ml_algorithms, practical_tools, etc.)
- `kb_difficulty` - Difficulty level (beginner, intermediate, advanced)
- `status` - Workflow status (draft, published, archived)
- `meta_title`, `meta_description`, `excerpt` - SEO fields
- `metadata` - JSONB for structured data (TOC, related articles, prerequisites, etc.)

✅ **Creates performance indexes**:

- GIN index for full-text search across title, content, and description
- Filtered indexes for KB-specific queries (category, difficulty, status)
- JSONB GIN index for metadata queries

✅ **Adds public RLS policy**:

- Public can view published KB articles (no authentication required)
- Premium vault content remains members-only

✅ **Creates helper functions**:

- `estimate_reading_time()` - Calculates reading time from word count
- `extract_toc_from_markdown()` - Parses H2/H3 headers into TOC
- `get_article_rating_stats()` - Aggregates article ratings

✅ **Auto-update trigger**:

- Automatically generates reading time and TOC when KB articles are saved
- Tracks last reviewed date on content changes

✅ **Creates `kb_article_ratings` table**:

- Tracks helpful/not helpful votes
- Supports anonymous and authenticated votes
- Prevents duplicate votes from same user

## After Migration

Once the migration is applied, you can proceed with:

1. ✅ Building the AI article generation edge function
2. ✅ Creating the admin UI for content management
3. ✅ Generating seed articles
4. ✅ Building the public knowledge base frontend
5. ✅ Integrating with the chatbot for RAG

## Troubleshooting

**Error: "relation 'vault_content' does not exist"**

- This means the main vault_content table hasn't been created yet
- Run migration: `20251017120002_vault_content.sql` first

**Error: "column already exists"**

- Some columns may already exist from previous attempts
- This is safe - the migration uses `IF NOT EXISTS` clauses

**Error: "permission denied"**

- Make sure you're logged into the Supabase Dashboard
- You need Owner or Admin role on the project

## Need Help?

If you encounter any issues:

1. Check the Supabase Dashboard → Database → Tables to verify `vault_content` exists
2. Look at the error message in the SQL Editor
3. Let me know the specific error and I can help troubleshoot

---

**Ready to continue building the Knowledge Base after the migration is applied!** 🚀
