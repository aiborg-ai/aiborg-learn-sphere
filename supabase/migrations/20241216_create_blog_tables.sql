-- Create blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
    color VARCHAR(7) DEFAULT '#6B46C1',
    icon VARCHAR(50),
    post_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
    published_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    meta_title VARCHAR(160),
    meta_description VARCHAR(320),
    reading_time INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    allow_comments BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog tags table
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog post tags junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, tag_id)
);

-- Create blog comments table
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog likes table
CREATE TABLE IF NOT EXISTS blog_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create blog shares table
CREATE TABLE IF NOT EXISTS blog_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(20) CHECK (platform IN ('email', 'whatsapp', 'twitter', 'facebook', 'linkedin', 'copy_link')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog bookmarks table
CREATE TABLE IF NOT EXISTS blog_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_user ON blog_comments(user_id);
CREATE INDEX idx_blog_likes_post ON blog_likes(post_id);
CREATE INDEX idx_blog_bookmarks_user ON blog_bookmarks(user_id);

-- Create full-text search index
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_blog_posts_search ON blog_posts USING gin(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, ''))
);

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(content TEXT)
RETURNS INTEGER AS $$
BEGIN
    -- Average reading speed is 200 words per minute
    RETURN CEIL(array_length(string_to_array(content, ' '), 1) / 200.0);
END;
$$ LANGUAGE plpgsql;

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION blog_posts_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate slug if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.title);
        -- Ensure uniqueness by appending timestamp if needed
        WHILE EXISTS (SELECT 1 FROM blog_posts WHERE slug = NEW.slug AND id != NEW.id) LOOP
            NEW.slug := NEW.slug || '-' || extract(epoch from now())::text;
        END LOOP;
    END IF;

    -- Calculate reading time
    NEW.reading_time := calculate_reading_time(NEW.content);

    -- Set published_at if status is being set to published
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
        NEW.published_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_before_insert_trigger
    BEFORE INSERT ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION blog_posts_before_insert();

-- Trigger to update post count in categories
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_categories
        SET post_count = post_count + 1
        WHERE id = NEW.category_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_categories
        SET post_count = post_count - 1
        WHERE id = OLD.category_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
            UPDATE blog_categories
            SET post_count = post_count - 1
            WHERE id = OLD.category_id;
            UPDATE blog_categories
            SET post_count = post_count + 1
            WHERE id = NEW.category_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_post_count_trigger
    AFTER INSERT OR DELETE OR UPDATE OF category_id ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_category_post_count();

-- Trigger to update tag post count
CREATE OR REPLACE FUNCTION update_tag_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_tags
        SET post_count = post_count + 1
        WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_tags
        SET post_count = post_count - 1
        WHERE id = OLD.tag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tag_post_count_trigger
    AFTER INSERT OR DELETE ON blog_post_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_post_count();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert default categories
INSERT INTO blog_categories (slug, name, description, color, icon, sort_order) VALUES
    ('technology', 'Technology', 'Latest tech trends and AI innovations', '#6B46C1', 'Cpu', 1),
    ('tutorials', 'Tutorials', 'Step-by-step guides and how-tos', '#F97316', 'BookOpen', 2),
    ('industry-insights', 'Industry Insights', 'Expert analysis and market trends', '#0EA5E9', 'TrendingUp', 3),
    ('case-studies', 'Case Studies', 'Real-world AI implementation stories', '#10B981', 'FileText', 4),
    ('news', 'News & Updates', 'Latest updates from Aiborg', '#EF4444', 'Newspaper', 5),
    ('community', 'Community', 'Stories from our learning community', '#8B5CF6', 'Users', 6)
ON CONFLICT (slug) DO NOTHING;