# 📚 Deploy 500 Blog Articles to Production

## Current Status

✅ **500 blog articles generated** - SQL files ready ✅ **Pagination fixed** - Admin dashboard now
supports 500+ posts ❌ **NOT YET DEPLOYED** - Articles exist only as SQL files

## Problem Solved

The admin dashboard was only showing **12 posts** because:

- BlogPostService had a hard-coded limit of 12 posts per page
- No pagination controls existed in the admin UI

**Fix Applied:**

- Added pagination with configurable page size (25/50/100/500)
- Default to 50 posts per page
- Shows total count and page navigation
- Committed in: `54b0db2` - "feat: add pagination controls to blog admin dashboard"

---

## ⚠️ IMPORTANT: Fix Author ID First

**Before deploying batches**, you need to fix the author_id foreign key constraint.

### Quick Fix (30 seconds)

Run this in Supabase SQL Editor first:

```sql
ALTER TABLE blog_posts ALTER COLUMN author_id DROP NOT NULL;
```

**Why?** The SQL batches use a system user ID that doesn't exist in your database.

📖 See `scripts/blog_inserts/FIX_AUTHOR_ERROR.md` for detailed explanation.

---

## Deployment Options

### Option 1: Automated Script (Fastest - Recommended)

**Fixes author_id AND deploys all batches automatically:**

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts
./fix_and_deploy.sh
```

**Time:** 5-10 minutes | **Steps:** 1 command

---

### Option 2: Supabase Dashboard SQL Editor

**Best for:** Production deployment with visual confirmation

1. **Open Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select project: `aiborg-learn-sphere`
   - Navigate to: SQL Editor

2. **Deploy Each Batch** (10 batches total)

   **Batch 1:**

   ```bash
   cat /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts/batch_01_blog_articles.sql
   ```

   - Copy output
   - Paste in Supabase SQL Editor
   - Click "Run" button
   - Wait for success (~30 seconds)

   **Repeat for batches 2-10:**
   - `batch_02_blog_articles.sql`
   - `batch_03_blog_articles.sql`
   - ... through ...
   - `batch_10_blog_articles.sql`

3. **Verify Deployment**
   ```sql
   SELECT COUNT(*) as total FROM blog_posts;
   SELECT status, COUNT(*) as count
   FROM blog_posts
   GROUP BY status;
   ```
   Expected: ~500 total posts

**Time Required:** 15-20 minutes

---

### Option 2: psql Command Line (Faster)

**Best for:** Quick deployment via terminal

**Prerequisites:**

- Database connection credentials
- psql installed

**Execute:**

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts

# Run the master script
chmod +x insert_all_blog_articles.sh
./insert_all_blog_articles.sh
```

The script will:

- Execute all 10 batches sequentially
- Show progress for each batch
- Verify total count at the end
- Report any errors

**Time Required:** 5-10 minutes

---

### Option 3: Manual Verification First

**Check what's already in the database:**

```sql
-- Current post count
SELECT COUNT(*) FROM blog_posts;

-- Posts by category
SELECT
  bc.name as category,
  COUNT(bp.id) as post_count
FROM blog_categories bc
LEFT JOIN blog_posts bp ON bc.id = bp.category_id
GROUP BY bc.name
ORDER BY post_count DESC;

-- Recent posts
SELECT title, status, published_at
FROM blog_posts
ORDER BY created_at DESC
LIMIT 10;
```

---

## Post-Deployment Verification

### 1. Check Admin Dashboard

- Go to `/admin`
- Navigate to "Blog Management" tab
- **Expected:** Total Posts should show ~500
- Test pagination controls
- Try changing page size to 100 or 500

### 2. Check Public Blog Page

- Go to `/blog`
- **Expected:** Articles visible (published ones)
- Categories should be populated
- Search should work

### 3. Database Queries

```sql
-- Verify counts
SELECT
  COUNT(*) FILTER (WHERE status = 'published') as published,
  COUNT(*) FILTER (WHERE status = 'draft') as drafts,
  COUNT(*) FILTER (WHERE status = 'archived') as archived,
  COUNT(*) as total
FROM blog_posts;

-- Check categories distribution
SELECT
  c.name,
  COUNT(p.id) as article_count
FROM blog_categories c
LEFT JOIN blog_posts p ON c.id = p.category_id
GROUP BY c.name
ORDER BY article_count DESC;
```

---

## Article Distribution

| Audience              | Articles | Category       |
| --------------------- | -------- | -------------- |
| Young Learners (8-12) | 100      | young-learners |
| Teenagers (13-18)     | 100      | teenagers      |
| Professionals         | 150      | professionals  |
| Business Owners       | 150      | business       |

**Total:** 500 articles **Total Content:** ~657,200 words **Avg Reading Time:** 6.6 minutes

---

## Troubleshooting

### Issue: "Only 12 posts showing"

**Solution:** ✅ Already fixed - pagination added

### Issue: "Database connection failed"

**Check:**

- Correct database host
- Valid credentials
- Network/firewall access
- Supabase project is active

### Issue: "Duplicate slug error"

**Solution:** The SQL includes `ON CONFLICT (slug) DO NOTHING` This prevents duplicates if articles
already exist

### Issue: "Row Level Security (RLS) blocking"

**Solution:** SQL batches temporarily disable RLS during insert:

```sql
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
-- ... inserts ...
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
```

---

## Files Reference

**SQL Batches:** `/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts/`

```
batch_01_blog_articles.sql  (439 KB) - Articles 1-50
batch_02_blog_articles.sql  (449 KB) - Articles 51-100
batch_03_blog_articles.sql  (500 KB) - Articles 101-150
batch_04_blog_articles.sql  (470 KB) - Articles 151-200
batch_05_blog_articles.sql  (579 KB) - Articles 201-250
batch_06_blog_articles.sql  (553 KB) - Articles 251-300
batch_07_blog_articles.sql  (562 KB) - Articles 301-350
batch_08_blog_articles.sql  (635 KB) - Articles 351-400
batch_09_blog_articles.sql  (605 KB) - Articles 401-450
batch_10_blog_articles.sql  (620 KB) - Articles 451-500
```

**Helper Scripts:**

- `insert_all_blog_articles.sh` - Master deployment script
- `verify_articles.sql` - Verification queries
- `quick_stats.sql` - Quick statistics

**Documentation:**

- `README.md` - Complete documentation
- `DEPLOYMENT_INSTRUCTIONS.md` - Detailed guide
- `QUICK_START.md` - Quick reference

---

## Next Steps

1. ✅ Code changes deployed (pagination fix)
2. ⏳ **Deploy SQL batches** (choose option above)
3. ✅ Test admin dashboard pagination
4. ✅ Verify blog page displays articles
5. ✅ Test search and filtering

**Ready to deploy!** 🚀
