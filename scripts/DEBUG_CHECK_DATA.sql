-- Debug script to check what data exists
-- Run this FIRST to see what we have to work with

-- Check if we have any users
SELECT 'Users in auth.users:' as check_type, COUNT(*) as count
FROM auth.users;

-- Check if we have any profiles
SELECT 'Profiles in profiles:' as check_type, COUNT(*) as count
FROM profiles;

-- Check if we have any categories
SELECT 'Categories:' as check_type, COUNT(*) as count
FROM blog_categories;

-- Show categories if they exist
SELECT id, name, slug FROM blog_categories LIMIT 5;

-- Check existing blog posts
SELECT 'Existing blog posts:' as check_type, COUNT(*) as count
FROM blog_posts;

-- Show a sample blog post to see what author_id it uses
SELECT id, title, author_id, category_id
FROM blog_posts
LIMIT 3;

-- Check if the posts we want to create already exist
SELECT slug, title
FROM blog_posts
WHERE slug IN (
  'ai-voice-cloning-ethics',
  'quantum-computing-encryption-threat',
  'neuralink-brain-privacy',
  'ai-girlfriends-loneliness-economy',
  'china-ai-surveillance-global'
);