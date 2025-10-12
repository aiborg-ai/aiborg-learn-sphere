-- ========================================
-- RUN THIS FIRST - Fix Author ID Constraint
-- ========================================
--
-- This MUST be run before deploying any blog article batches
-- It fixes the foreign key constraint error you're seeing
--
-- Copy and paste this entire file into Supabase SQL Editor
-- Then click RUN
--
-- After this succeeds, you can run batch_01 through batch_10
-- ========================================

-- Make author_id nullable so blog posts can exist without an author
ALTER TABLE blog_posts ALTER COLUMN author_id DROP NOT NULL;

-- Verify the change worked
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'blog_posts'
AND column_name = 'author_id';

-- You should see: author_id | YES | uuid
-- The "YES" means it's now nullable (can be NULL)

-- ========================================
-- Success! Now you can deploy the batches
-- ========================================
