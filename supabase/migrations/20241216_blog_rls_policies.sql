-- Enable Row Level Security on all blog tables
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_bookmarks ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = $1
        AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BLOG CATEGORIES POLICIES
-- Anyone can view active categories
CREATE POLICY "Public can view active categories"
    ON blog_categories FOR SELECT
    USING (is_active = true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories"
    ON blog_categories FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- BLOG POSTS POLICIES
-- Anyone can view published posts
CREATE POLICY "Public can view published posts"
    ON blog_posts FOR SELECT
    USING (status = 'published' AND published_at <= NOW());

-- Authors can view their own drafts
CREATE POLICY "Authors can view own drafts"
    ON blog_posts FOR SELECT
    USING (author_id = auth.uid());

-- Admins can view all posts
CREATE POLICY "Admins can view all posts"
    ON blog_posts FOR SELECT
    USING (is_admin(auth.uid()));

-- Admins can create posts
CREATE POLICY "Admins can create posts"
    ON blog_posts FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

-- Admins can update any post
CREATE POLICY "Admins can update posts"
    ON blog_posts FOR UPDATE
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Authors can update their own drafts
CREATE POLICY "Authors can update own drafts"
    ON blog_posts FOR UPDATE
    USING (author_id = auth.uid() AND status = 'draft')
    WITH CHECK (author_id = auth.uid());

-- Admins can delete posts
CREATE POLICY "Admins can delete posts"
    ON blog_posts FOR DELETE
    USING (is_admin(auth.uid()));

-- BLOG TAGS POLICIES
-- Anyone can view tags
CREATE POLICY "Public can view tags"
    ON blog_tags FOR SELECT
    USING (true);

-- Only admins can manage tags
CREATE POLICY "Admins can manage tags"
    ON blog_tags FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- BLOG POST TAGS POLICIES
-- Anyone can view post tags
CREATE POLICY "Public can view post tags"
    ON blog_post_tags FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM blog_posts
        WHERE blog_posts.id = blog_post_tags.post_id
        AND (blog_posts.status = 'published' OR blog_posts.author_id = auth.uid() OR is_admin(auth.uid()))
    ));

-- Admins and authors can manage post tags
CREATE POLICY "Admins and authors can manage post tags"
    ON blog_post_tags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = blog_post_tags.post_id
            AND (blog_posts.author_id = auth.uid() OR is_admin(auth.uid()))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = blog_post_tags.post_id
            AND (blog_posts.author_id = auth.uid() OR is_admin(auth.uid()))
        )
    );

-- BLOG COMMENTS POLICIES
-- Anyone can view approved comments on published posts
CREATE POLICY "Public can view approved comments"
    ON blog_comments FOR SELECT
    USING (
        is_approved = true AND
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = blog_comments.post_id
            AND blog_posts.status = 'published'
        )
    );

-- Users can view their own comments
CREATE POLICY "Users can view own comments"
    ON blog_comments FOR SELECT
    USING (user_id = auth.uid());

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
    ON blog_comments FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = post_id
            AND blog_posts.status = 'published'
            AND blog_posts.allow_comments = true
        )
    );

-- Users can update their own comments within 15 minutes
CREATE POLICY "Users can update own recent comments"
    ON blog_comments FOR UPDATE
    USING (
        user_id = auth.uid() AND
        created_at > NOW() - INTERVAL '15 minutes'
    )
    WITH CHECK (
        user_id = auth.uid() AND
        created_at > NOW() - INTERVAL '15 minutes'
    );

-- Users can delete their own comments within 15 minutes
CREATE POLICY "Users can delete own recent comments"
    ON blog_comments FOR DELETE
    USING (
        user_id = auth.uid() AND
        created_at > NOW() - INTERVAL '15 minutes'
    );

-- Admins can manage all comments
CREATE POLICY "Admins can manage all comments"
    ON blog_comments FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- BLOG LIKES POLICIES
-- Anyone can view likes count (through aggregation)
CREATE POLICY "Public can view likes"
    ON blog_likes FOR SELECT
    USING (true);

-- Authenticated users can like posts
CREATE POLICY "Authenticated users can like posts"
    ON blog_likes FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = post_id
            AND blog_posts.status = 'published'
        )
    );

-- Users can remove their own likes
CREATE POLICY "Users can remove own likes"
    ON blog_likes FOR DELETE
    USING (user_id = auth.uid());

-- BLOG SHARES POLICIES
-- Admins can view all shares (for analytics)
CREATE POLICY "Admins can view shares"
    ON blog_shares FOR SELECT
    USING (is_admin(auth.uid()));

-- Anyone can create share records
CREATE POLICY "Anyone can track shares"
    ON blog_shares FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = post_id
            AND blog_posts.status = 'published'
        )
    );

-- BLOG BOOKMARKS POLICIES
-- Users can view their own bookmarks
CREATE POLICY "Users can view own bookmarks"
    ON blog_bookmarks FOR SELECT
    USING (user_id = auth.uid());

-- Authenticated users can create bookmarks
CREATE POLICY "Authenticated users can bookmark posts"
    ON blog_bookmarks FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = post_id
            AND blog_posts.status = 'published'
        )
    );

-- Users can remove their own bookmarks
CREATE POLICY "Users can remove own bookmarks"
    ON blog_bookmarks FOR DELETE
    USING (user_id = auth.uid());

-- Create view for public blog posts with author info
CREATE OR REPLACE VIEW public_blog_posts AS
SELECT
    bp.*,
    p.display_name as author_name,
    p.avatar_url as author_avatar,
    bc.name as category_name,
    bc.slug as category_slug,
    bc.color as category_color,
    (SELECT COUNT(*) FROM blog_likes WHERE post_id = bp.id) as like_count,
    (SELECT COUNT(*) FROM blog_comments WHERE post_id = bp.id AND is_approved = true) as comment_count,
    (SELECT COUNT(*) FROM blog_shares WHERE post_id = bp.id) as share_count,
    (SELECT array_agg(
        json_build_object(
            'id', bt.id,
            'name', bt.name,
            'slug', bt.slug
        )
    ) FROM blog_post_tags bpt
    JOIN blog_tags bt ON bt.id = bpt.tag_id
    WHERE bpt.post_id = bp.id) as tags
FROM blog_posts bp
LEFT JOIN profiles p ON p.user_id = bp.author_id
LEFT JOIN blog_categories bc ON bc.id = bp.category_id
WHERE bp.status = 'published' AND bp.published_at <= NOW();

-- Grant access to the view
GRANT SELECT ON public_blog_posts TO anon, authenticated;