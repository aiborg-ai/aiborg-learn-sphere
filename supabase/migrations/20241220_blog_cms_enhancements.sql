-- ===============================================
-- BLOG CMS ENHANCEMENTS
-- Adds media management, revisions, and engagement tracking
-- ===============================================

-- Create blog media table for image/file management
CREATE TABLE IF NOT EXISTS blog_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog post revisions table for version control
CREATE TABLE IF NOT EXISTS blog_post_revisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    meta_title VARCHAR(160),
    meta_description VARCHAR(320),
    revision_number INTEGER NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog post likes table
CREATE TABLE IF NOT EXISTS blog_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create blog post bookmarks table
CREATE TABLE IF NOT EXISTS blog_post_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create blog analytics table
CREATE TABLE IF NOT EXISTS blog_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    avg_time_seconds INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, date)
);

-- Create blog drafts table for auto-save functionality
CREATE TABLE IF NOT EXISTS blog_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(500),
    content TEXT,
    excerpt TEXT,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    featured_image TEXT,
    meta_title VARCHAR(160),
    meta_description VARCHAR(320),
    tags JSONB DEFAULT '[]',
    is_auto_save BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to existing blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS
    seo_keywords TEXT,
    ADD COLUMN IF NOT EXISTS og_image TEXT,
    ADD COLUMN IF NOT EXISTS og_title VARCHAR(160),
    ADD COLUMN IF NOT EXISTS og_description VARCHAR(320),
    ADD COLUMN IF NOT EXISTS canonical_url TEXT,
    ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bookmark_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS is_sticky BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS custom_css TEXT,
    ADD COLUMN IF NOT EXISTS custom_js TEXT;

-- Add new columns to blog_comments table for moderation
ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'deleted')),
    ADD COLUMN IF NOT EXISTS ip_address INET,
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS flagged_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_media_post_id ON blog_media(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_media_uploaded_by ON blog_media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_post_id ON blog_post_revisions(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_post_id ON blog_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_user_id ON blog_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_bookmarks_user_id ON blog_post_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_post_date ON blog_analytics(post_id, date);
CREATE INDEX IF NOT EXISTS idx_blog_drafts_author_id ON blog_drafts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_sticky_published ON blog_posts(is_sticky, published_at DESC);

-- Create triggers for auto-updating counts
CREATE OR REPLACE FUNCTION update_post_engagement_counts() RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'blog_post_likes' THEN
        UPDATE blog_posts
        SET like_count = (SELECT COUNT(*) FROM blog_post_likes WHERE post_id = COALESCE(NEW.post_id, OLD.post_id))
        WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    ELSIF TG_TABLE_NAME = 'blog_post_bookmarks' THEN
        UPDATE blog_posts
        SET bookmark_count = (SELECT COUNT(*) FROM blog_post_bookmarks WHERE post_id = COALESCE(NEW.post_id, OLD.post_id))
        WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    ELSIF TG_TABLE_NAME = 'blog_comments' THEN
        UPDATE blog_posts
        SET comment_count = (SELECT COUNT(*) FROM blog_comments WHERE post_id = COALESCE(NEW.post_id, OLD.post_id) AND status = 'approved')
        WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_likes_count ON blog_post_likes;
CREATE TRIGGER update_likes_count
    AFTER INSERT OR DELETE ON blog_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_engagement_counts();

DROP TRIGGER IF EXISTS update_bookmarks_count ON blog_post_bookmarks;
CREATE TRIGGER update_bookmarks_count
    AFTER INSERT OR DELETE ON blog_post_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_post_engagement_counts();

DROP TRIGGER IF EXISTS update_comments_count ON blog_comments;
CREATE TRIGGER update_comments_count
    AFTER INSERT OR UPDATE OR DELETE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_engagement_counts();

-- Create function for creating post revisions
CREATE OR REPLACE FUNCTION create_post_revision() RETURNS TRIGGER AS $$
DECLARE
    v_revision_number INTEGER;
BEGIN
    -- Only create revision if content or title changed
    IF OLD.title != NEW.title OR OLD.content != NEW.content THEN
        -- Get next revision number
        SELECT COALESCE(MAX(revision_number), 0) + 1 INTO v_revision_number
        FROM blog_post_revisions
        WHERE post_id = NEW.id;

        -- Insert revision
        INSERT INTO blog_post_revisions (
            post_id, title, content, excerpt,
            meta_title, meta_description, revision_number, author_id
        ) VALUES (
            NEW.id, OLD.title, OLD.content, OLD.excerpt,
            OLD.meta_title, OLD.meta_description, v_revision_number, NEW.last_modified_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post revisions
DROP TRIGGER IF EXISTS create_revision_on_update ON blog_posts;
CREATE TRIGGER create_revision_on_update
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION create_post_revision();

-- RLS Policies for new tables
ALTER TABLE blog_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_drafts ENABLE ROW LEVEL SECURITY;

-- Media policies
CREATE POLICY "Public can view published post media" ON blog_media
    FOR SELECT USING (
        post_id IN (SELECT id FROM blog_posts WHERE status = 'published')
        OR uploaded_by = auth.uid()
    );

CREATE POLICY "Authenticated users can upload media" ON blog_media
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own media" ON blog_media
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own media" ON blog_media
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Likes policies
CREATE POLICY "Public can view likes" ON blog_post_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts" ON blog_post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON blog_post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON blog_post_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can bookmark posts" ON blog_post_bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" ON blog_post_bookmarks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own bookmarks" ON blog_post_bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- Analytics policies (admin only)
CREATE POLICY "Admin can view analytics" ON blog_analytics
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai')
    );

-- Drafts policies
CREATE POLICY "Users can view their own drafts" ON blog_drafts
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create drafts" ON blog_drafts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own drafts" ON blog_drafts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own drafts" ON blog_drafts
    FOR DELETE USING (auth.uid() = author_id);

-- Revisions policies
CREATE POLICY "Authors can view post revisions" ON blog_post_revisions
    FOR SELECT USING (
        post_id IN (SELECT id FROM blog_posts WHERE author_id = auth.uid())
        OR auth.uid() IN (SELECT id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai')
    );