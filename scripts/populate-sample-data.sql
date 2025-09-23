-- Sample Data Population Script
-- Run this to add sample data for testing the admin dashboard

-- 1. Insert sample courses
INSERT INTO courses (title, description, price, start_date, end_date, max_capacity, display, is_active, enrollment_count)
VALUES
    ('Introduction to AI', 'Learn the basics of Artificial Intelligence', 299, '2024-01-01', '2024-03-01', 30, true, true, 0),
    ('Machine Learning Fundamentals', 'Deep dive into ML algorithms', 399, '2024-02-01', '2024-04-01', 25, true, true, 0),
    ('Deep Learning with Python', 'Advanced neural networks course', 499, '2024-03-01', '2024-05-01', 20, true, true, 0),
    ('Natural Language Processing', 'Text analysis and NLP techniques', 449, '2024-04-01', '2024-06-01', 25, true, true, 0)
ON CONFLICT (title) DO NOTHING;

-- 2. Insert sample announcements
INSERT INTO announcements (title, content, priority, is_active, created_by, audience)
VALUES
    ('Welcome to AI Learning Platform', 'We are excited to launch our new AI learning platform!', 3, true,
     (SELECT id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1), 'all'),
    ('New Courses Available', 'Check out our latest Machine Learning courses', 2, true,
     (SELECT id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1), 'students'),
    ('System Maintenance', 'Scheduled maintenance on Sunday 2 AM - 4 AM', 1, true,
     (SELECT id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1), 'all')
ON CONFLICT DO NOTHING;

-- 3. Insert sample events
INSERT INTO events (title, description, event_date, event_time, location, max_capacity, registration_count, display, is_active, event_type)
VALUES
    ('AI Workshop 2024', 'Hands-on workshop on AI basics', '2024-12-15', '10:00', 'Online', 50, 0, true, true, 'workshop'),
    ('Machine Learning Seminar', 'Expert talks on ML trends', '2024-12-20', '14:00', 'Virtual Conference', 100, 0, true, true, 'seminar'),
    ('Deep Learning Bootcamp', 'Intensive 2-day bootcamp', '2025-01-10', '09:00', 'Tech Hub', 30, 0, true, true, 'bootcamp')
ON CONFLICT DO NOTHING;

-- 4. Insert sample achievements
INSERT INTO achievements (
    name, description, icon, category, points, requirement_type,
    requirement_value, max_progress, is_active, sort_order
)
VALUES
    ('First Steps', 'Complete your first course', '🎯', 'learning', 10, 'course_completion', 1, 1, true, 1),
    ('Knowledge Seeker', 'Complete 5 courses', '📚', 'learning', 50, 'course_completion', 5, 5, true, 2),
    ('AI Explorer', 'Complete all AI courses', '🤖', 'learning', 100, 'course_category', 'ai', 10, true, 3),
    ('Active Learner', 'Login 7 days in a row', '🔥', 'engagement', 25, 'login_streak', 7, 7, true, 4),
    ('Community Helper', 'Help 10 other students', '🤝', 'social', 30, 'help_count', 10, 10, true, 5)
ON CONFLICT (name) DO NOTHING;

-- 5. Create some sample blog posts
INSERT INTO blog_posts (
    title, slug, excerpt, content, author_id, featured_image,
    tags, category, status, published_at, meta_title, meta_description
)
VALUES
    (
        'Getting Started with AI Learning',
        'getting-started-with-ai',
        'A comprehensive guide to beginning your AI journey',
        '# Getting Started with AI Learning\n\nArtificial Intelligence is transforming the world...',
        (SELECT id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1),
        'https://images.unsplash.com/photo-1677442136019-21780ecad995',
        ARRAY['ai', 'beginners', 'tutorial'],
        'tutorials',
        'published',
        NOW(),
        'Getting Started with AI - Complete Guide',
        'Learn how to begin your journey in Artificial Intelligence with our comprehensive guide'
    ),
    (
        'Top 10 Machine Learning Algorithms',
        'top-10-ml-algorithms',
        'Essential ML algorithms every data scientist should know',
        '# Top 10 Machine Learning Algorithms\n\n1. Linear Regression\n2. Logistic Regression...',
        (SELECT id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1),
        'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
        ARRAY['machine-learning', 'algorithms', 'data-science'],
        'technical',
        'published',
        NOW(),
        'Top 10 ML Algorithms - Must Know List',
        'Discover the most important machine learning algorithms for data science'
    )
ON CONFLICT (slug) DO NOTHING;

-- 6. Add sample reviews (only if courses exist)
INSERT INTO reviews (user_id, course_id, rating, comment, display, approved)
SELECT
    (SELECT id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1),
    c.id,
    5,
    'Excellent course! Highly recommended.',
    true,
    true
FROM courses c
WHERE c.title = 'Introduction to AI'
ON CONFLICT DO NOTHING;

-- 7. Verify data insertion
SELECT 'Courses' as table_name, COUNT(*) as count FROM courses
UNION ALL
SELECT 'Announcements', COUNT(*) FROM announcements
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Achievements', COUNT(*) FROM achievements
UNION ALL
SELECT 'Blog Posts', COUNT(*) FROM blog_posts
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews;