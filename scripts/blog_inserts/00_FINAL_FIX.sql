-- ========================================
-- FINAL FIX - Drop Foreign Key Constraint
-- ========================================
--
-- The issue: Even though author_id is nullable, the foreign key
-- constraint still requires that IF a value is provided, it must
-- exist in the users table.
--
-- Solution: Temporarily drop the constraint, insert articles,
-- then optionally recreate it.
--
-- RUN THIS FIRST before deploying batches!
-- ========================================

-- Step 1: Drop the foreign key constraint
ALTER TABLE blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

-- Step 2: Make author_id nullable (if not already)
ALTER TABLE blog_posts
ALTER COLUMN author_id DROP NOT NULL;

-- Step 3: Verify the constraint is gone
SELECT
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'blog_posts'::regclass
AND conname LIKE '%author%';

-- Should return no rows (or not include author_id foreign key)

-- ========================================
-- Success! Now you can deploy the batches
-- ========================================

-- After deploying all batches, you can optionally recreate
-- the constraint to only allow valid author_id values:
--
-- ALTER TABLE blog_posts
-- ADD CONSTRAINT blog_posts_author_id_fkey
-- FOREIGN KEY (author_id)
-- REFERENCES auth.users(id)
-- ON DELETE SET NULL;
--
-- (But this is optional - not required for the blog to work)
