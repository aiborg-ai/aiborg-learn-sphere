# Deploy 500 Articles NOW - Step by Step

## ⚡ Quick Deploy via Supabase Dashboard

This is the **fastest and most reliable** method. Follow these exact steps:

---

## Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. **Sign in** to your account
3. **Select your project**: `aiborg-learn-sphere` (or your project name)
4. Click **"SQL Editor"** in the left sidebar

---

## Step 2: Deploy Batch 1 (Test Run)

### Copy Batch 1 Content

Open your terminal and run:

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts
cat batch_01_blog_articles.sql
```

Or use the helper:

```bash
./view_batch.sh 01
```

### Paste and Execute

1. **Select all** the SQL output (Ctrl+A / Cmd+A)
2. **Copy** (Ctrl+C / Cmd+C)
3. Go to Supabase SQL Editor
4. **Paste** the SQL (Ctrl+V / Cmd+V)
5. Click the **"Run"** button (or press Ctrl+Enter)
6. **Wait ~30 seconds** for completion
7. You should see: **"Success. No rows returned"**

### Verify Batch 1

In the SQL Editor, run:

```sql
SELECT COUNT(*) as total FROM blog_posts;
```

**Expected result:** 50 (or your current total + 50)

✅ **If you see 50+ articles, continue to Step 3!**

---

## Step 3: Deploy Remaining Batches (02-10)

Repeat the same process for each batch:

### Batch 2:

```bash
./view_batch.sh 02
```

Copy → Paste → Run → Wait 30s

### Batch 3:

```bash
./view_batch.sh 03
```

Copy → Paste → Run → Wait 30s

### Continue for Batches 4-10...

**Pro tip:** Open batches in separate terminal tabs for faster copying!

---

## Step 4: Final Verification

After all 10 batches, run this in SQL Editor:

```sql
-- Total count
SELECT COUNT(*) as total_articles FROM blog_posts;
-- Should show: 500

-- Distribution by category
SELECT
    bc.name as category,
    COUNT(bp.id) as article_count
FROM blog_categories bc
LEFT JOIN blog_posts bp ON bc.id = bp.category_id
WHERE bp.status = 'published'
GROUP BY bc.name
ORDER BY article_count DESC;
```

**Expected Results:**

- Total articles: **500**
- Young Learners: **100**
- Teenagers: **100**
- Professionals: **150**
- Business Owners: **150**

---

## Step 5: Check Your Blog Page

1. Open your website: **https://aiborg-ai-web.vercel.app/blog**
2. You should now see **500 articles** displayed!
3. Test filtering by category
4. Test search functionality
5. Click on an article to view it

---

## 🎯 Quick Reference Commands

### View any batch:

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts
./view_batch.sh <batch_number>
```

Examples:

```bash
./view_batch.sh 01  # View batch 1
./view_batch.sh 05  # View batch 5
./view_batch.sh 10  # View batch 10
```

### List all batches:

```bash
ls -lh batch_*.sql
```

---

## ⏱️ Time Estimate

- **Batch 1 (test):** 2 minutes
- **Batches 2-10:** 15 minutes (1.5 min each)
- **Verification:** 2 minutes
- **Total:** ~20 minutes

---

## 🚨 Troubleshooting

### "Category not found" error

Run this SQL first:

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere
cat scripts/setup-blog-categories.sql
```

Copy and run in SQL Editor to create categories.

### "Relation blog_posts does not exist"

Run the blog tables migration:

```bash
cat supabase/migrations/20241216_create_blog_tables.sql
```

Copy and run in SQL Editor.

### SQL Editor timeout

If batches are too large:

- Try splitting the batch file into 2 parts
- Or deploy 25 articles at a time instead of 50
- Or use Supabase CLI (see alternative methods below)

---

## 🔄 Alternative Method: Supabase CLI

If you prefer automation:

### Install Supabase CLI:

```bash
npm install -g supabase
```

### Login and link:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Deploy all batches:

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts

for batch in batch_*.sql; do
  echo "Deploying $batch..."
  supabase db execute --file "$batch"
  echo "✓ $batch complete"
done
```

---

## ✅ Admin Controls (Already Available!)

Once articles are deployed, admins can:

1. **Go to:** https://aiborg-ai-web.vercel.app/admin (or /admin on your domain)
2. **Click:** "Blog Management" tab
3. **See all 500 articles** in a table
4. **Change status** for any article:
   - `published` - Visible on blog
   - `archived` - Hidden from blog
   - `draft` - Hidden from blog
   - `scheduled` - For future publishing

### To Hide Articles in Bulk:

Run in SQL Editor:

```sql
-- Hide all Young Learners articles
UPDATE blog_posts
SET status = 'archived'
WHERE category_id = (
  SELECT id FROM blog_categories WHERE slug = 'young-learners'
);

-- Hide articles older than 100 days
UPDATE blog_posts
SET status = 'archived'
WHERE published_at < NOW() - INTERVAL '100 days';

-- Re-publish all archived articles
UPDATE blog_posts
SET status = 'published'
WHERE status = 'archived';
```

---

## 📊 Post-Deployment Checklist

- [ ] All 500 articles show in database count
- [ ] Articles appear on blog page
- [ ] Category filtering works
- [ ] Search functionality works
- [ ] Article pages render correctly
- [ ] Admin can see all articles
- [ ] Admin can change article status
- [ ] Archived articles don't show on blog

---

## 🎉 You're Ready!

**Start with Step 1** and work through each batch. The whole process takes about **20 minutes**.

Once done, you'll have:

- ✅ 500 live articles on your blog
- ✅ Full admin control over visibility
- ✅ SEO-optimized content ready to rank
- ✅ Months of content marketing material

**Questions?** Check `DEPLOYMENT_INSTRUCTIONS.md` for more details.

---

**Let's do this! Start with Batch 1 now! 🚀**
