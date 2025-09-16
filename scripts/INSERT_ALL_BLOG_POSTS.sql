-- Master SQL Script to Insert All Blog Posts into Supabase
-- This script inserts blog posts in batches for all audience segments
-- Total: 500 articles (will be added progressively)

-- First, ensure categories exist
INSERT INTO blog_categories (name, slug, description, color, is_active, sort_order) VALUES
('Young Learners', 'young-learners', 'AI content for kids aged 8-12 with simple language and fun concepts', '#FF6B6B', true, 1),
('Teenagers', 'teenagers', 'Tech content for teens aged 13-18 focused on social media, gaming, and career', '#4ECDC4', true, 2),
('Professionals', 'professionals', 'Career advancement and productivity content for working professionals', '#45B7D1', true, 3),
('Business Owners', 'business-owners', 'Practical AI implementation and ROI-focused content for SMEs', '#96CEB4', true, 4),
('AI Basics', 'ai-basics', 'Fundamental AI concepts and introductory content', '#FFEAA7', true, 5),
('Industry Trends', 'industry-trends', 'Latest AI developments and market insights', '#DDA0DD', true, 6),
('How-To Guides', 'how-to-guides', 'Step-by-step tutorials and practical guides', '#98D8C8', true, 7),
('Case Studies', 'case-studies', 'Real-world AI implementation stories', '#F7DC6F', true, 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  is_active = EXCLUDED.is_active;

-- Create some common tags
INSERT INTO blog_tags (name, slug) VALUES
('AI', 'ai'),
('Machine Learning', 'machine-learning'),
('Automation', 'automation'),
('ChatGPT', 'chatgpt'),
('Productivity', 'productivity'),
('Education', 'education'),
('Gaming', 'gaming'),
('Social Media', 'social-media'),
('Business', 'business'),
('Career', 'career'),
('Ethics', 'ethics'),
('Future Tech', 'future-tech'),
('Tutorial', 'tutorial'),
('Beginner Friendly', 'beginner-friendly'),
('Advanced', 'advanced'),
('Case Study', 'case-study'),
('How To', 'how-to'),
('Industry News', 'industry-news'),
('Best Practices', 'best-practices'),
('Tools', 'tools')
ON CONFLICT (slug) DO NOTHING;

-- Function to safely insert blog posts without duplicates
CREATE OR REPLACE FUNCTION safe_insert_blog_post(
    p_title TEXT,
    p_slug TEXT,
    p_content TEXT,
    p_excerpt TEXT,
    p_category_slug TEXT,
    p_featured_image TEXT,
    p_reading_time INT,
    p_is_featured BOOLEAN,
    p_days_ago INT
) RETURNS void AS $$
BEGIN
    INSERT INTO blog_posts (
        title, slug, content, excerpt, category_id, author_id, status, is_featured,
        published_at, meta_title, meta_description, featured_image, reading_time, created_at, updated_at
    )
    SELECT
        p_title,
        p_slug,
        p_content,
        p_excerpt,
        (SELECT id FROM blog_categories WHERE slug = p_category_slug),
        '00000000-0000-0000-0000-000000000000'::uuid,
        'published',
        p_is_featured,
        NOW() - (p_days_ago || ' days')::INTERVAL,
        p_title,
        p_excerpt,
        p_featured_image,
        p_reading_time,
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM blog_posts WHERE slug = p_slug
    );
END;
$$ LANGUAGE plpgsql;

-- Insert Young Learners Articles (1-10)
SELECT safe_insert_blog_post(
    'My First AI Friend: How Computers Learn to Think',
    'my-first-ai-friend-how-computers-learn-to-think',
    E'Have you ever wondered how computers can be smart like your best friend? Today, we''re going on an amazing adventure to discover how artificial intelligence works - and it''s way cooler than you think!\n\n## What Makes a Computer Smart?\n\nImagine teaching your dog a new trick. You show them what to do, give them treats when they get it right, and after lots of practice, they learn! AI works in a similar way. Computer scientists are like pet trainers, but instead of teaching dogs to sit or fetch, they''re teaching computers to recognize pictures, understand words, and even play games.\n\nThink about your favorite video game character. They know when to jump over obstacles, when to collect coins, and when to avoid enemies. That''s AI in action! The game developers taught the computer character how to make these decisions, just like you learned how to ride a bike or tie your shoes.\n\n## The Secret Behind AI Learning\n\nHere''s something super cool: AI learns from examples, just like you do! Remember when you were learning to read? You looked at lots of books, sounded out words, and gradually got better. AI does the same thing but much faster.\n\nLet''s say we want to teach a computer to recognize cats. We show it thousands of cat pictures - fluffy cats, sleepy cats, playful cats, grumpy cats. The AI starts noticing patterns: "Hey, these things called cats usually have pointy ears, whiskers, and cute little noses!" After seeing enough examples, it can spot a cat even in pictures it''s never seen before.\n\n## Your AI Friends Are Already Here\n\nGuess what? You probably already have AI friends helping you every day! When you ask Alexa or Siri a question, that''s AI listening to your voice and figuring out what you mean. When Netflix suggests a new show you might like, that''s AI remembering what you''ve watched before and finding similar stuff.\n\nEven your favorite photo apps use AI! Those funny filters that give you dog ears or make you look like a cartoon? That''s AI recognizing your face and knowing exactly where to put those silly decorations. It''s like having an invisible artist who can draw on your pictures instantly!\n\n## Fun AI Activities You Can Try\n\nWant to see AI in action right now? Here are some awesome things you can try:\n\n1. **Google Quick Draw**: You doodle something, and AI tries to guess what it is. It''s like Pictionary with a computer!\n\n2. **Akinator the Genie**: Think of any character, and this AI will guess who it is by asking you questions. It''s almost like magic!\n\n3. **Story Time with AI**: Ask your voice assistant to tell you a story or a joke. The AI creates responses just for you!\n\n## Why AI Needs Kids Like You\n\nHere''s a secret grown-ups don''t always tell you: AI isn''t perfect, and it needs creative kids like you to make it better! While AI can do math super fast and remember millions of facts, it can''t imagine new worlds like you can when you''re playing. It can''t come up with silly jokes that make your friends laugh. It can''t dream about being an astronaut or invent a new game at recess.\n\nAs you grow up, you might become someone who teaches AI new tricks. Maybe you''ll help create AI that protects endangered animals, or builds amazing video games, or helps doctors cure diseases. The possibilities are endless!\n\n## Your AI Adventure Starts Now\n\nRemember, AI is just a tool - like a really smart calculator or a helpful robot assistant. It''s here to make life more fun and interesting, not to replace the amazing things that make you special. Your creativity, your kindness, your imagination - these are superpowers that no computer can copy.\n\nSo next time you talk to Siri, play a video game, or use a fun filter, remember: you''re interacting with AI! And who knows? Maybe one day, you''ll be the one teaching computers their next amazing trick!\n\n*Ready for more AI adventures? Check out our next article about robot pets and AI companions!*',
    'Have you ever wondered how computers can be smart like your best friend? Today, we''re going on an amazing adventure...',
    'young-learners',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    3,
    true,
    25
);

-- Continue with all other articles...
-- Note: Due to length, I'm showing the pattern. In production, all 500 articles would be inserted here

-- After all inserts, add tags to posts
-- This would be done for all posts, showing example for first post
INSERT INTO blog_post_tags (post_id, tag_id)
SELECT
    (SELECT id FROM blog_posts WHERE slug = 'my-first-ai-friend-how-computers-learn-to-think'),
    id
FROM blog_tags
WHERE slug IN ('ai', 'education', 'beginner-friendly', 'tutorial')
ON CONFLICT DO NOTHING;

-- Update post counts for categories
UPDATE blog_categories SET post_count = (
    SELECT COUNT(*) FROM blog_posts WHERE category_id = blog_categories.id
);

-- Update post counts for tags
UPDATE blog_tags SET post_count = (
    SELECT COUNT(*) FROM blog_post_tags WHERE tag_id = blog_tags.id
);

-- Clean up the function
DROP FUNCTION IF EXISTS safe_insert_blog_post;