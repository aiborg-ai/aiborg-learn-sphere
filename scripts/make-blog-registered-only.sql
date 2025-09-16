-- OPTIONAL: If you want to restrict blog posts to ONLY registered users
-- (Currently, published posts are visible to everyone including anonymous users)

-- This script modifies the RLS policy to require authentication to view blog posts

-- Step 1: Drop the existing public view policy
DROP POLICY IF EXISTS "Public can view published posts" ON blog_posts;

-- Step 2: Create new policy that requires authentication
CREATE POLICY "Registered users can view published posts"
    ON blog_posts FOR SELECT
    USING (
        auth.uid() IS NOT NULL  -- ✅ User must be logged in
        AND status = 'published'
        AND published_at <= NOW()
    );

-- Step 3: Verify the policy change
SELECT
    'Blog posts are now restricted to REGISTERED USERS ONLY' as status,
    'Users must be logged in to view any blog posts' as requirement;

-- To REVERT back to public access (if needed):
-- DROP POLICY IF EXISTS "Registered users can view published posts" ON blog_posts;
-- CREATE POLICY "Public can view published posts"
--     ON blog_posts FOR SELECT
--     USING (status = 'published' AND published_at <= NOW());