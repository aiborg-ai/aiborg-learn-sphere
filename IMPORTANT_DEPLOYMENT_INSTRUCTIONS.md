# ⚠️ CRITICAL: How to Deploy Blog Articles

## The Error You're Seeing

```
relation "last_post" does not exist
```

**This happens when you don't copy the ENTIRE batch file!**

---

## ✅ CORRECT Way to Deploy

### Step 1: Copy the ENTIRE File

The batch files are **transactions** - they must run completely from `BEGIN;` to `COMMIT;`

**Run this to see the complete file:**

```bash
cat /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts/batch_01_blog_articles.sql
```

**IMPORTANT:**

- The output is **~2700 lines** - that's normal!
- Select **ALL of it** (Ctrl+A in terminal, or scroll to top first)
- Copy **everything** (Ctrl+C)

### Step 2: Paste and Run in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. **Paste the ENTIRE file** (Ctrl+V)
4. Scroll down - you should see:
   - Starts with `BEGIN;`
   - Ends with `COMMIT;`
   - Many INSERT statements
5. Click **"Run"**
6. Wait ~60 seconds

---

## Why This Happens

Each article looks like this:

```sql
-- Insert the article
INSERT INTO blog_posts (...) VALUES (...);

-- Get the ID of the article we just inserted
WITH last_post AS (
    SELECT id FROM blog_posts
    WHERE slug = 'the-article-slug'
    LIMIT 1
)

-- Add tags using that ID
INSERT INTO blog_post_tags (post_id, tag_id)
SELECT
    (SELECT id FROM last_post),  -- ← References the CTE above
    (SELECT id FROM blog_tags WHERE slug = 'tag-name')
...
```

**If you copy only part of the file:**

- The `WITH last_post` statement runs WITHOUT the INSERT above it
- The post doesn't exist yet
- Error: "relation last_post does not exist"

**If you copy the entire file:**

- Everything runs in order within the transaction
- Each post is inserted THEN tagged
- Works perfectly ✅

---

## 🚀 Full Deployment Process

### Step 0: Fix Constraint (If not done)

```sql
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
ALTER TABLE blog_posts ALTER COLUMN author_id DROP NOT NULL;
```

### Step 1: Deploy Batch 01

```bash
cat /home/vik/aiborg_CC/aiborg-learn-sphere/scripts/blog_inserts/batch_01_blog_articles.sql
```

- Copy **ALL** output (scroll to top first!)
- Paste in Supabase SQL Editor
- Run
- Wait ~60 seconds
- Should see "Success"

### Step 2: Verify Batch 01

```sql
SELECT COUNT(*) FROM blog_posts;
```

Should show ~50 posts

### Step 3: Repeat for Batches 02-10

Same process for each:

- `cat batch_02_blog_articles.sql` → Copy all → Run
- `cat batch_03_blog_articles.sql` → Copy all → Run
- ... continue through batch_10

---

## 💡 Pro Tips

### Make Sure You Copy Everything

**Check you got it all:**

- File starts with: `-- Batch X: ...` and `BEGIN;`
- File ends with: `COMMIT;` and `-- Re-enable RLS`
- File is ~2000-3000 lines (yes, it's long!)

### Terminal Selection Tips

**Method 1: Ctrl+A**

```bash
cat batch_01_blog_articles.sql
# Press Ctrl+A to select all terminal output
# Press Ctrl+C to copy
```

**Method 2: Output to clipboard (if you have xclip)**

```bash
cat batch_01_blog_articles.sql | xclip -selection clipboard
# Automatically copied - just paste in Supabase
```

**Method 3: Scroll to top first**

```bash
cat batch_01_blog_articles.sql
# Scroll to the very top of output
# Click and drag to select all
# Ctrl+C to copy
```

### Speed Up Deployment

1. Open **3-4 Supabase SQL Editor tabs**
2. Prepare multiple batches:
   - Tab 1: Paste batch_01
   - Tab 2: Paste batch_02
   - Tab 3: Paste batch_03
3. Run them all in quick succession
4. While they run, prepare the next batches

Can reduce total time to **~10 minutes**!

---

## ✅ Success Checklist

After deploying all 10 batches:

```sql
-- Should show ~500
SELECT COUNT(*) FROM blog_posts;

-- Should show distribution across categories
SELECT
    bc.name,
    COUNT(bp.id) as posts
FROM blog_categories bc
LEFT JOIN blog_posts bp ON bc.id = bp.category_id
GROUP BY bc.name;
```

Then check: **https://www.aiborg.ai/admin** → Blog Management

- Should show **~500 total posts**
- Pagination controls visible
- Can browse all articles

---

## 🐛 Troubleshooting

### "Query too large" error

- Your browser/Supabase has a size limit
- Solution: Split the batch in half manually
- Or: Use smaller terminal buffer and re-cat

### Still getting "last_post" error

- You're not copying the complete file
- Make sure you scroll to the TOP before selecting
- Check the paste includes `BEGIN;` at start

### Duplicate key errors

- Some articles might already exist
- That's OK - SQL has `ON CONFLICT DO NOTHING`
- Check final count to verify

---

## Summary

1. ✅ Copy **ENTIRE** batch file (all ~2700 lines)
2. ✅ Paste **COMPLETE** file in Supabase
3. ✅ Run and wait
4. ✅ Verify count
5. ✅ Repeat for all 10 batches

**The key is copying the COMPLETE file - don't try to run it in parts!** 🚀
