# Deployment Instructions - 500 Blog Articles

## Current Status

✅ **All files are generated and ready!**

- 500 articles with full content
- 10 SQL batch files (5.4 MB)
- Master deployment script
- Verification queries

❌ **Database Connection Issue** The automated deployment script cannot connect to the database from
the current environment due to authentication/network restrictions.

---

## Solution: Two Deployment Options

### Option 1: Deploy via Supabase Dashboard (Easiest)

1. **Navigate to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `aiborg-learn-sphere`
   - Click "SQL Editor" in left sidebar

2. **Copy and Execute Each Batch**

   For each batch (01 through 10):

   ```bash
   # On your local machine, copy batch content:
   cat /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts/batch_01_blog_articles.sql
   ```

   - Copy the entire SQL output
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - Wait for success message (~30 seconds per batch)
   - Repeat for batches 02 through 10

3. **Verify**

   After all batches, run in SQL Editor:

   ```sql
   SELECT COUNT(*) FROM blog_posts;
   -- Should return: 500

   SELECT
       bc.name AS category,
       COUNT(bp.id) AS article_count
   FROM blog_categories bc
   LEFT JOIN blog_posts bp ON bc.id = bp.category_id
   GROUP BY bc.name
   ORDER BY article_count DESC;
   ```

---

### Option 2: Deploy from Environment with DB Access

If you have a machine/environment with proper database access:

1. **Transfer the files**

   ```bash
   # Copy the entire blog_inserts directory to the machine with DB access
   scp -r /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts/ user@target-machine:/path/
   ```

2. **Run the deployment script**

   ```bash
   cd /path/to/blog_inserts/
   ./insert_all_blog_articles.sh
   ```

3. **Verify**
   ```bash
   ./quick_stats.sql
   ./verify_articles.sql
   ```

---

### Option 3: Use Supabase CLI (Recommended for Large Batches)

1. **Install Supabase CLI** (if not already installed)

   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**

   ```bash
   supabase login
   ```

3. **Link your project**

   ```bash
   cd /home/vik/aiborg_CC/aiborg-learn-sphere
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Execute SQL files**

   ```bash
   cd scripts/blog_inserts

   for batch in batch_*.sql; do
     echo "Executing $batch..."
     supabase db execute --file "$batch"
     echo "✓ $batch completed"
   done
   ```

---

## Quick Manual Deployment (Copy-Paste Method)

If you prefer to deploy manually right now:

### Step 1: Open Supabase SQL Editor

Navigate to: https://supabase.com/dashboard → Your Project → SQL Editor

### Step 2: Copy Batch Files

Each batch file is located here:

- `/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts/batch_01_blog_articles.sql`
- `/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts/batch_02_blog_articles.sql`
- ... through batch_10_blog_articles.sql

### Step 3: Execute Commands

```bash
# View a batch file to copy:
cat batch_01_blog_articles.sql

# Or use this helper command to copy to clipboard (if available):
cat batch_01_blog_articles.sql | xclip -selection clipboard
```

Then paste into Supabase SQL Editor and run.

---

## Files Ready for Deployment

All files are in: `/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts/`

**Batch Files (ready to execute):**

```
batch_01_blog_articles.sql  (439 KB) - Young Learners 1-50
batch_02_blog_articles.sql  (449 KB) - Young Learners 51-100
batch_03_blog_articles.sql  (500 KB) - Teenagers 101-150
batch_04_blog_articles.sql  (470 KB) - Teenagers 151-200
batch_05_blog_articles.sql  (579 KB) - Professionals 201-250
batch_06_blog_articles.sql  (553 KB) - Professionals 251-300
batch_07_blog_articles.sql  (562 KB) - Professionals 301-350
batch_08_blog_articles.sql  (635 KB) - Business 351-400
batch_09_blog_articles.sql  (605 KB) - Business 401-450
batch_10_blog_articles.sql  (620 KB) - Business 451-500
```

**Total Size:** 5.4 MB of SQL

---

## Verification After Deployment

Run these queries in Supabase SQL Editor:

### Quick Stats

```sql
-- From quick_stats.sql
SELECT 'Total Articles' AS metric, COUNT(*)::TEXT AS value FROM blog_posts
UNION ALL
SELECT 'Published Articles', COUNT(*)::TEXT FROM blog_posts WHERE status = 'published'
UNION ALL
SELECT 'Young Learners Articles', COUNT(*)::TEXT
FROM blog_posts bp JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bc.slug = 'young-learners'
UNION ALL
SELECT 'Teenagers Articles', COUNT(*)::TEXT
FROM blog_posts bp JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bc.slug = 'teenagers'
UNION ALL
SELECT 'Professionals Articles', COUNT(*)::TEXT
FROM blog_posts bp JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bc.slug = 'professionals'
UNION ALL
SELECT 'Business Owners Articles', COUNT(*)::TEXT
FROM blog_posts bp JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bc.slug = 'business-owners';
```

**Expected Results:**

```
Total Articles: 500
Published Articles: 500
Young Learners Articles: 100
Teenagers Articles: 100
Professionals Articles: 150
Business Owners Articles: 150
```

### Data Integrity Check

```sql
-- Check for duplicates (should return 0)
SELECT slug, COUNT(*) as count
FROM blog_posts
GROUP BY slug
HAVING COUNT(*) > 1;

-- Check all articles have required fields
SELECT
    COUNT(*) FILTER (WHERE title IS NULL OR title = '') AS missing_title,
    COUNT(*) FILTER (WHERE content IS NULL OR content = '') AS missing_content,
    COUNT(*) FILTER (WHERE slug IS NULL OR slug = '') AS missing_slug
FROM blog_posts;
-- Should return all zeros
```

---

## Frontend Verification

After successful database insertion:

1. **Visit Blog Page**
   - Local: http://localhost:5173/blog
   - Production: https://aiborg-ai-web.vercel.app/blog

2. **Test Features**
   - ✅ Articles display correctly
   - ✅ Filtering by category works
   - ✅ Search functionality works
   - ✅ Article pages render
   - ✅ Images load
   - ✅ Reading time shows

3. **SEO Check**
   - View page source
   - Verify meta tags present
   - Check Open Graph tags

---

## Troubleshooting

### "Category not found"

Run the setup script first:

```bash
cat /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/setup-blog-categories.sql
```

Copy and run in Supabase SQL Editor.

### "Relation does not exist"

Run the blog tables migration:

```bash
cat /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/migrations/20241216_create_blog_tables.sql
```

Copy and run in Supabase SQL Editor.

### SQL Editor Timeout

If batches are too large for SQL Editor:

- Split each batch file into 2-3 smaller files
- Or use Supabase CLI method (Option 3)
- Or deploy from machine with direct DB access (Option 2)

---

## Alternative: Quick CLI Commands

If you have `psql` access from another machine:

```bash
# Set password
export PGPASSWORD='hirendra$1234ABCD'

# Execute all batches
for batch in batch_*.sql; do
  echo "Executing $batch..."
  psql -h aws-0-ap-south-1.pooler.supabase.com \
       -p 5432 \
       -U postgres.afrulkxxzcmngbrdfuzj \
       -d postgres \
       -f "$batch"
done

# Verify
psql -h aws-0-ap-south-1.pooler.supabase.com \
     -p 5432 \
     -U postgres.afrulkxxzcmngbrdfuzj \
     -d postgres \
     -c "SELECT COUNT(*) FROM blog_posts;"
```

---

## Summary

**✅ Everything is ready!**

- All 500 articles generated with full content
- All SQL scripts created and validated
- All documentation complete

**⚠️ Action Required:** Choose one of the deployment options above and execute the batch files in
your Supabase database.

**⏱️ Estimated Time:**

- Supabase Dashboard (manual): 15-20 minutes
- Supabase CLI: 10-15 minutes
- Direct psql: 5-10 minutes

---

**Need Help?** All files are ready at:
`/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts/`

Just choose your preferred deployment method and follow the steps above!
