-- IMPORTANT: Run this in your Supabase SQL Editor to create the blog engagement tables

-- Create blog_comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES blog_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_approved boolean DEFAULT true,
  is_edited boolean DEFAULT false,
  edited_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Create blog_likes table
CREATE TABLE IF NOT EXISTS blog_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create blog_bookmarks table
CREATE TABLE IF NOT EXISTS blog_bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create blog_shares table
CREATE TABLE IF NOT EXISTS blog_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- nullable for anonymous shares
  platform text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON blog_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_id ON blog_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_bookmarks_post_id ON blog_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_bookmarks_user_id ON blog_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_shares_post_id ON blog_shares(post_id);

-- Enable Row Level Security
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_comments
-- Anyone can read approved comments
CREATE POLICY "Anyone can read approved comments" ON blog_comments
  FOR SELECT USING (is_approved = true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON blog_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON blog_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON blog_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for blog_likes
-- Anyone can read likes
CREATE POLICY "Anyone can read likes" ON blog_likes
  FOR SELECT USING (true);

-- Authenticated users can create likes
CREATE POLICY "Authenticated users can create likes" ON blog_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON blog_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for blog_bookmarks
-- Users can only see their own bookmarks
CREATE POLICY "Users can see their own bookmarks" ON blog_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can create bookmarks
CREATE POLICY "Authenticated users can create bookmarks" ON blog_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks" ON blog_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for blog_shares
-- Anyone can read shares (for analytics)
CREATE POLICY "Anyone can read shares" ON blog_shares
  FOR SELECT USING (true);

-- Anyone can create shares (including anonymous)
CREATE POLICY "Anyone can create shares" ON blog_shares
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at for comments
CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON blog_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();