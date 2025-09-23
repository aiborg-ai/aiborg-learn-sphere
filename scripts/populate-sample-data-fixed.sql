-- Sample Data Population Script (Fixed Version)
-- This version adapts to your actual table structure

-- First, let's check what columns the courses table actually has
-- and insert data accordingly

-- 1. Insert sample courses (adapted to actual columns)
-- Try with minimal required fields first
DO $$
BEGIN
    -- Check if courses table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        -- Try to insert with only essential columns
        INSERT INTO courses (title, description, price, display, is_active)
        VALUES
            ('Introduction to AI', 'Learn the basics of Artificial Intelligence', 299, true, true),
            ('Machine Learning Fundamentals', 'Deep dive into ML algorithms', 399, true, true),
            ('Deep Learning with Python', 'Advanced neural networks course', 499, true, true),
            ('Natural Language Processing', 'Text analysis and NLP techniques', 449, true, true)
        ON CONFLICT (title) DO NOTHING;

        RAISE NOTICE 'Courses inserted successfully';
    ELSE
        RAISE NOTICE 'Courses table does not exist';
    END IF;
END $$;

-- 2. Insert sample announcements (if table exists)
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1;

    IF admin_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
        INSERT INTO announcements (title, content, priority, is_active, created_by)
        VALUES
            ('Welcome to AI Learning Platform', 'We are excited to launch our new AI learning platform!', 3, true, admin_id),
            ('New Courses Available', 'Check out our latest Machine Learning courses', 2, true, admin_id),
            ('System Maintenance', 'Scheduled maintenance on Sunday 2 AM - 4 AM', 1, true, admin_id)
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Announcements inserted successfully';
    ELSE
        RAISE NOTICE 'Announcements table does not exist or admin user not found';
    END IF;
END $$;

-- 3. Insert sample events (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        INSERT INTO events (title, description, event_date, location, display, is_active)
        VALUES
            ('AI Workshop 2024', 'Hands-on workshop on AI basics', '2024-12-15', 'Online', true, true),
            ('Machine Learning Seminar', 'Expert talks on ML trends', '2024-12-20', 'Virtual Conference', true, true),
            ('Deep Learning Bootcamp', 'Intensive 2-day bootcamp', '2025-01-10', 'Tech Hub', true, true)
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Events inserted successfully';
    ELSE
        RAISE NOTICE 'Events table does not exist';
    END IF;
END $$;

-- 4. Insert sample achievements (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
        INSERT INTO achievements (name, description, icon, category, points, is_active)
        VALUES
            ('First Steps', 'Complete your first course', '🎯', 'learning', 10, true),
            ('Knowledge Seeker', 'Complete 5 courses', '📚', 'learning', 50, true),
            ('AI Explorer', 'Complete all AI courses', '🤖', 'learning', 100, true),
            ('Active Learner', 'Login 7 days in a row', '🔥', 'engagement', 25, true),
            ('Community Helper', 'Help 10 other students', '🤝', 'social', 30, true)
        ON CONFLICT (name) DO NOTHING;

        RAISE NOTICE 'Achievements inserted successfully';
    ELSE
        RAISE NOTICE 'Achievements table does not exist';
    END IF;
END $$;

-- 5. Insert sample blog posts (if table exists)
DO $$
DECLARE
    author_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO author_id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1;

    IF author_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
        INSERT INTO blog_posts (
            title, slug, excerpt, content, author_id,
            status, published_at
        )
        VALUES
            (
                'Getting Started with AI Learning',
                'getting-started-with-ai',
                'A comprehensive guide to beginning your AI journey',
                '# Getting Started with AI Learning\n\nArtificial Intelligence is transforming the world. In this guide, we will explore the fundamentals of AI and how you can start your learning journey.\n\n## What is AI?\n\nAI refers to the simulation of human intelligence in machines...',
                author_id,
                'published',
                NOW()
            ),
            (
                'Top 10 Machine Learning Algorithms',
                'top-10-ml-algorithms',
                'Essential ML algorithms every data scientist should know',
                '# Top 10 Machine Learning Algorithms\n\n1. **Linear Regression** - The foundation of predictive modeling\n2. **Logistic Regression** - For classification problems\n3. **Decision Trees** - Intuitive and interpretable\n4. **Random Forests** - Ensemble learning at its best...',
                author_id,
                'published',
                NOW()
            )
        ON CONFLICT (slug) DO NOTHING;

        RAISE NOTICE 'Blog posts inserted successfully';
    ELSE
        RAISE NOTICE 'Blog posts table does not exist or admin user not found';
    END IF;
END $$;

-- 6. Grant admin role (ensure it's set)
UPDATE profiles
SET role = 'admin'
WHERE email = 'hirendra.vikram@aiborg.ai';

-- 7. Show summary of what was inserted
SELECT 'Data Population Summary' as info;

SELECT 'Profiles with Admin Role' as category, COUNT(*) as count
FROM profiles WHERE role = 'admin'
UNION ALL
SELECT 'Total Courses', COUNT(*) FROM courses WHERE 1=1
UNION ALL
SELECT 'Total Events', COUNT(*) FROM events WHERE 1=1
UNION ALL
SELECT 'Total Announcements', COUNT(*) FROM announcements WHERE 1=1
UNION ALL
SELECT 'Total Achievements', COUNT(*) FROM achievements WHERE 1=1
UNION ALL
SELECT 'Total Blog Posts', COUNT(*) FROM blog_posts WHERE 1=1;

-- 8. Show admin users
SELECT
    email,
    display_name,
    role,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;