# Quick Start Guide - 500 Blog Articles

## ⚡ TL;DR - Deploy in 3 Steps

```bash
# Step 1: Navigate to deployment directory
cd /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts

# Step 2: Execute master script
./insert_all_blog_articles.sh

# Step 3: Verify success
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -f quick_stats.sql
```

**Done!** You now have 500 AI blog articles in your database.

---

## 📦 What You're Getting

- **500 articles** across 4 audiences
- **657,200 words** of content
- **10 batches** of 50 articles each
- **Full SEO metadata** included
- **Staggered publish dates** over 500 days

---

## 🎯 Content Breakdown

| Audience              | Count | Topics                                |
| --------------------- | ----- | ------------------------------------- |
| Young Learners (8-12) | 100   | AI basics, fun apps, robots, safety   |
| Teenagers (13-18)     | 100   | Social media, gaming, careers, ethics |
| Professionals         | 150   | Productivity, career, industry tools  |
| Business Owners       | 150   | Strategy, ROI, operations, finance    |

---

## ⏱️ Expected Timeline

- **Execution time**: 5-10 minutes
- **Database load**: Moderate
- **Success rate**: ~100% (with rollback on error)

---

## ✅ Pre-Flight Checklist

Before running the script, verify:

1. [ ] Database connection works
2. [ ] Blog tables exist (run migrations if needed)
3. [ ] Categories exist (young-learners, teenagers, professionals, business-owners)
4. [ ] Tags table has some entries
5. [ ] You have write permissions

### Quick Test

```bash
# Test database connection
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -c "SELECT NOW();"
```

If this works, you're ready to deploy!

---

## 🚀 Deployment Options

### Option A: Full Deployment (Recommended)

```bash
./insert_all_blog_articles.sh
```

Inserts all 500 articles sequentially. If any batch fails, it stops and shows the error.

### Option B: Test First (Cautious)

```bash
# Insert only batch 1 (50 articles)
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -f batch_01_blog_articles.sql

# Verify
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -c "SELECT COUNT(*) FROM blog_posts;"

# If successful, run full deployment
./insert_all_blog_articles.sh
```

### Option C: Custom Batches

```bash
# Insert specific batches only
for batch in 01 02 03; do
  PGPASSWORD='hirendra$1234ABCD' psql \
    -h aws-0-ap-south-1.pooler.supabase.com \
    -p 5432 \
    -U postgres.afrulkxxzcmngbrdfuzj \
    -d postgres \
    -f batch_${batch}_blog_articles.sql
done
```

---

## 📊 Verification

After deployment, check your success:

### Quick Stats

```bash
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -f quick_stats.sql
```

**Expected output:**

```
Total Articles: 500
Published Articles: 500
Young Learners Articles: 100
Teenagers Articles: 100
Professionals Articles: 150
Business Owners Articles: 150
```

### Full Verification

```bash
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -f verify_articles.sql
```

Checks for:

- Duplicate slugs (should be 0)
- Missing fields (should be 0)
- Category distribution
- Tag associations
- Reading time averages

---

## 🎨 Frontend Testing

After successful database insertion:

1. **Visit your blog page**
   - URL: https://aiborg-ai-web.vercel.app/blog (or your local dev URL)

2. **Check filters work**
   - Filter by Young Learners category
   - Filter by Professionals category
   - Test search functionality

3. **Verify article pages**
   - Click on a few articles
   - Check content renders properly
   - Verify images load
   - Test social sharing buttons

4. **SEO verification**
   - View page source
   - Check meta tags are present
   - Verify Open Graph tags

---

## 🔧 Troubleshooting

### "Connection refused"

**Fix**: Check database credentials and network connectivity

### "Relation does not exist"

**Fix**: Run blog table migrations first

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -f supabase/migrations/20241216_create_blog_tables.sql
```

### "Duplicate key violation"

**Fix**: Articles already exist. Either:

- Delete existing: `DELETE FROM blog_posts;`
- Or skip duplicates (scripts handle this)

### Batch fails mid-way

**No problem!** Each batch uses transactions, so partial inserts automatically rollback. Just re-run
the failed batch.

---

## 📁 File Reference

### Essential Files

- `insert_all_blog_articles.sh` - Master deployment script
- `batch_01_blog_articles.sql` - First batch (Young Learners 1-50)
- `batch_10_blog_articles.sql` - Last batch (Business 451-500)
- `verify_articles.sql` - Verification queries
- `quick_stats.sql` - Quick statistics

### Documentation

- `README.md` - Full documentation
- `QUICK_START.md` - This file
- `../BLOG_ARTICLES_PROJECT_SUMMARY.md` - Project overview
- `../CONTENT_INVENTORY.csv` - Spreadsheet of all articles

---

## 💡 Pro Tips

1. **Run during off-peak hours** - Less database load
2. **Test with batch 1 first** - Verify everything works
3. **Monitor the first few batches** - Watch for errors
4. **Keep verification output** - Save for documentation
5. **Backup before inserting** - Just in case (optional)

---

## 🎉 Success Indicators

You'll know it worked when:

- ✅ All 10 batches complete without errors
- ✅ Quick stats shows 500 articles
- ✅ Blog page displays articles
- ✅ Search and filters work
- ✅ Article pages render correctly

---

## 📞 Need Help?

- Check `README.md` for detailed troubleshooting
- Review `verify_articles.sql` output for data issues
- Consult `BLOG_ARTICLES_PROJECT_SUMMARY.md` for project details
- Check database logs for connection issues

---

## 🚀 Ready? Let's Go!

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts
./insert_all_blog_articles.sh
```

**Time to complete**: ☕ Get a coffee, this will take 5-10 minutes!

---

**Generated**: October 12, 2025 **Articles**: 500 **Batches**: 10 **Audiences**: 4
