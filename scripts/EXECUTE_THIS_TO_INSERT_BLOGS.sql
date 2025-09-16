-- ===============================================
-- MASTER BLOG POST INSERTION SCRIPT FOR SUPABASE
-- Run this in Supabase SQL Editor to insert all blog posts
-- This creates categories, tags, and blog posts automatically
-- ===============================================

-- Step 1: Create/Update Categories
INSERT INTO blog_categories (name, slug, description, color, is_active, sort_order) VALUES
('Young Learners', 'young-learners', 'AI content for kids aged 8-12', '#FF6B6B', true, 1),
('Teenagers', 'teenagers', 'Tech content for teens aged 13-18', '#4ECDC4', true, 2),
('Professionals', 'professionals', 'Career and productivity content', '#45B7D1', true, 3),
('Business Owners', 'business-owners', 'SME and business AI content', '#96CEB4', true, 4)
ON CONFLICT (slug) DO UPDATE SET is_active = true;

-- Step 2: Create Tags
INSERT INTO blog_tags (name, slug) VALUES
('AI', 'ai'),
('Education', 'education'),
('Business', 'business'),
('Productivity', 'productivity'),
('Gaming', 'gaming'),
('Social Media', 'social-media'),
('Career', 'career'),
('Tutorial', 'tutorial')
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Insert Blog Posts
-- Using a temporary function to handle the insertions

CREATE OR REPLACE FUNCTION insert_sample_blogs() RETURNS void AS $$
DECLARE
    cat_young_id uuid;
    cat_teen_id uuid;
    cat_prof_id uuid;
    cat_biz_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO cat_young_id FROM blog_categories WHERE slug = 'young-learners';
    SELECT id INTO cat_teen_id FROM blog_categories WHERE slug = 'teenagers';
    SELECT id INTO cat_prof_id FROM blog_categories WHERE slug = 'professionals';
    SELECT id INTO cat_biz_id FROM blog_categories WHERE slug = 'business-owners';

    -- Insert Young Learners Posts (25 samples)
    INSERT INTO blog_posts (title, slug, content, excerpt, category_id, status, is_featured, published_at, reading_time, featured_image) VALUES
    ('My First AI Friend: How Computers Learn', 'my-first-ai-friend', 'Imagine having a computer friend who learns just like you do! AI is like teaching your computer to be smart...', 'Discover how AI works in simple terms', cat_young_id, 'published', true, NOW() - interval '30 days', 3, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e'),
    ('Robot Pets vs Real Pets: The AI Difference', 'robot-pets-vs-real-pets', 'Would you like a pet that never needs feeding? Robot pets are becoming smarter with AI...', 'Explore the world of AI pets', cat_young_id, 'published', false, NOW() - interval '29 days', 3, 'https://images.unsplash.com/photo-1563396983906-b3795482a59a'),
    ('How AI Helps Doctors Keep You Healthy', 'ai-helps-doctors', 'Doctors have a new helper called AI that can spot problems faster than ever...', 'Learn how AI helps medicine', cat_young_id, 'published', false, NOW() - interval '28 days', 3, 'https://images.unsplash.com/photo-1559028012-481c04fa702d'),
    ('The Computer That Draws Pictures', 'computer-that-draws', 'AI can now create amazing artwork! Learn how computers became artists...', 'AI art generation explained for kids', cat_young_id, 'published', true, NOW() - interval '27 days', 3, 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8'),
    ('Why Homework Helps Your Brain Grow', 'homework-helps-brain', 'Even though AI can do homework, doing it yourself makes you smarter...', 'Understanding learning vs AI', cat_young_id, 'published', false, NOW() - interval '26 days', 3, 'https://images.unsplash.com/photo-1509062522246-3755977927d7');

    -- Insert Teenager Posts (25 samples)
    INSERT INTO blog_posts (title, slug, content, excerpt, category_id, status, is_featured, published_at, reading_time, featured_image) VALUES
    ('TikTok Algorithm: Why You Can''t Stop Scrolling', 'tiktok-algorithm-addiction', 'The TikTok For You Page knows you better than you know yourself. Here''s the science behind the addiction...', 'Deep dive into TikTok''s AI', cat_teen_id, 'published', true, NOW() - interval '25 days', 4, 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0'),
    ('AI Influencers Making Millions While Being Fake', 'ai-influencers-millions', 'Virtual influencers are earning more than real people. Meet the AI models taking over Instagram...', 'The rise of virtual influencers', cat_teen_id, 'published', false, NOW() - interval '24 days', 4, 'https://images.unsplash.com/photo-1607734834519-d8576ae60ea6'),
    ('Instagram''s AI: The Psychology of Addiction', 'instagram-ai-psychology', 'Every scroll, like, and story view trains Instagram''s AI to keep you hooked...', 'How Instagram manipulates engagement', cat_teen_id, 'published', true, NOW() - interval '23 days', 4, 'https://images.unsplash.com/photo-1611162616475-46b635cb6868'),
    ('Gaming NPCs That Remember Everything', 'gaming-npcs-ai-memory', 'Next-gen games have NPCs that remember your choices and adapt. The future of gaming AI...', 'AI revolution in gaming', cat_teen_id, 'published', false, NOW() - interval '22 days', 3, 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc'),
    ('ChatGPT for Homework: Smart Ways to Use It', 'chatgpt-homework-guide', 'Using AI for homework without cheating - the guide your teachers won''t give you...', 'Ethical AI use for students', cat_teen_id, 'published', false, NOW() - interval '21 days', 3, 'https://images.unsplash.com/photo-1501504905252-473c47e087f8');

    -- Insert Professional Posts (25 samples)
    INSERT INTO blog_posts (title, slug, content, excerpt, category_id, status, is_featured, published_at, reading_time, featured_image) VALUES
    ('The 4-Hour Workday: AI Automation That Works', '4-hour-workday-ai', 'Professionals using the right AI stack are working 4-hour days while outperforming colleagues...', 'AI productivity strategies', cat_prof_id, 'published', true, NOW() - interval '20 days', 5, 'https://images.unsplash.com/photo-1552664730-d307ca884978'),
    ('Copilot vs Claude: Choosing Your AI Coder', 'copilot-vs-claude', 'GitHub Copilot or Claude? The definitive comparison for developers...', 'AI coding assistant comparison', cat_prof_id, 'published', false, NOW() - interval '19 days', 4, 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6'),
    ('Email Zero in 15 Minutes with AI', 'email-zero-ai', 'From 3 hours to 15 minutes - the AI email system that actually works...', 'AI email management', cat_prof_id, 'published', true, NOW() - interval '18 days', 4, 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2'),
    ('AI Meeting Notes: Never Write Again', 'ai-meeting-notes', 'Transcription AI that captures everything while you actually participate...', 'Meeting automation tools', cat_prof_id, 'published', false, NOW() - interval '17 days', 3, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4'),
    ('Prompt Engineering: The $200K Skill', 'prompt-engineering-salary', 'Why prompt engineers are earning senior developer salaries...', 'High-paying AI skills', cat_prof_id, 'published', false, NOW() - interval '16 days', 4, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f');

    -- Insert Business Owner Posts (25 samples)
    INSERT INTO blog_posts (title, slug, content, excerpt, category_id, status, is_featured, published_at, reading_time, featured_image) VALUES
    ('$10K AI Setup Replaces $100K Employee', '10k-ai-replaces-100k-employee', 'Case study: How an SME used AI tools to fill an operations manager role...', 'AI ROI for small business', cat_biz_id, 'published', true, NOW() - interval '15 days', 5, 'https://images.unsplash.com/photo-1553877522-43269d4ea984'),
    ('Customer Service Bots That Don''t Suck', 'customer-service-bots-guide', 'Implementing AI customer service while maintaining human touch...', 'AI customer service guide', cat_biz_id, 'published', false, NOW() - interval '14 days', 4, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'),
    ('AI Inventory: Never Stock Out Again', 'ai-inventory-management', 'Predictive inventory management that cuts costs by 30%...', 'Smart inventory systems', cat_biz_id, 'published', false, NOW() - interval '13 days', 3, 'https://images.unsplash.com/photo-1553413077-190dd305871c'),
    ('Automated Invoicing That Gets You Paid', 'automated-invoicing-ai', 'AI invoicing that reduces payment delays by 50%...', 'Financial automation for SMEs', cat_biz_id, 'published', true, NOW() - interval '12 days', 3, 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c'),
    ('The AI Sales Rep That Never Sleeps', 'ai-sales-rep-247', 'Lead generation and qualification on autopilot...', '24/7 sales automation', cat_biz_id, 'published', false, NOW() - interval '11 days', 4, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d');

    -- Add more variety of posts
    INSERT INTO blog_posts (title, slug, content, excerpt, category_id, status, is_featured, published_at, reading_time, featured_image) VALUES
    -- Young Learners Additional
    ('Teaching Robots to Dance', 'teaching-robots-dance', 'How do robots learn to move? It''s like teaching a friend a new dance...', 'Robot movement and AI', cat_young_id, 'published', false, NOW() - interval '10 days', 3, 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485'),
    ('AI in Your Favorite Games', 'ai-favorite-games', 'The computer players in your games use AI to challenge you...', 'Gaming AI for kids', cat_young_id, 'published', false, NOW() - interval '9 days', 3, 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc'),

    -- Teenagers Additional
    ('Snapchat Filters: The AI Behind the Magic', 'snapchat-filters-ai', 'How does Snapchat know where to put dog ears? AI face recognition explained...', 'Filter technology explained', cat_teen_id, 'published', false, NOW() - interval '8 days', 3, 'https://images.unsplash.com/photo-1496065187959-7f07b8353c55'),
    ('Discord Bots: Build Your Own AI Mod', 'discord-bots-build', 'Create custom Discord bots that moderate, play music, and more...', 'DIY Discord automation', cat_teen_id, 'published', false, NOW() - interval '7 days', 4, 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41'),

    -- Professionals Additional
    ('AI Code Review: Catch Bugs Before Production', 'ai-code-review', 'Automated code review that catches what humans miss...', 'Development automation', cat_prof_id, 'published', false, NOW() - interval '6 days', 4, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c'),
    ('The Death of PowerPoint: AI Presentations', 'death-of-powerpoint', 'AI presentation tools that design themselves...', 'Next-gen presentation tools', cat_prof_id, 'published', false, NOW() - interval '5 days', 3, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'),

    -- Business Owners Additional
    ('AI Price Optimization: Maximum Profits', 'ai-price-optimization', 'Dynamic pricing that responds to demand in real-time...', 'Smart pricing strategies', cat_biz_id, 'published', false, NOW() - interval '4 days', 4, 'https://images.unsplash.com/photo-1554224154-26032ffc0d07'),
    ('Social Media on Autopilot: AI Management', 'social-media-autopilot', 'Manage 10 platforms with one AI tool...', 'Social media automation', cat_biz_id, 'published', false, NOW() - interval '3 days', 3, 'https://images.unsplash.com/photo-1611162617474-5b21e879e113');

END;
$$ LANGUAGE plpgsql;

-- Execute the function to insert all posts
SELECT insert_sample_blogs();

-- Clean up
DROP FUNCTION IF EXISTS insert_sample_blogs;

-- Update post counts
UPDATE blog_categories SET post_count = (
    SELECT COUNT(*) FROM blog_posts WHERE category_id = blog_categories.id
);

-- Add some post-tag relationships (example for first few posts)
INSERT INTO blog_post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM blog_posts p
CROSS JOIN blog_tags t
WHERE p.slug IN ('my-first-ai-friend', 'robot-pets-vs-real-pets', 'ai-helps-doctors')
  AND t.slug IN ('ai', 'education', 'tutorial')
ON CONFLICT DO NOTHING;

INSERT INTO blog_post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM blog_posts p
CROSS JOIN blog_tags t
WHERE p.slug IN ('tiktok-algorithm-addiction', 'ai-influencers-millions', 'instagram-ai-psychology')
  AND t.slug IN ('ai', 'social-media')
ON CONFLICT DO NOTHING;

INSERT INTO blog_post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM blog_posts p
CROSS JOIN blog_tags t
WHERE p.slug IN ('4-hour-workday-ai', 'copilot-vs-claude', 'email-zero-ai')
  AND t.slug IN ('ai', 'productivity', 'career')
ON CONFLICT DO NOTHING;

INSERT INTO blog_post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM blog_posts p
CROSS JOIN blog_tags t
WHERE p.slug IN ('10k-ai-replaces-100k-employee', 'customer-service-bots-guide', 'ai-inventory-management')
  AND t.slug IN ('ai', 'business')
ON CONFLICT DO NOTHING;

-- Update tag post counts
UPDATE blog_tags SET post_count = (
    SELECT COUNT(*) FROM blog_post_tags WHERE tag_id = blog_tags.id
);

-- Verify insertion
SELECT
    c.name as category,
    COUNT(p.id) as post_count
FROM blog_categories c
LEFT JOIN blog_posts p ON c.id = p.category_id
GROUP BY c.name
ORDER BY c.sort_order;