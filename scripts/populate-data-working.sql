-- Working Sample Data Script
-- This version handles missing constraints properly

-- 1. First ensure admin role is set
UPDATE profiles
SET role = 'admin'
WHERE email = 'hirendra.vikram@aiborg.ai';

-- 2. Insert sample courses (without ON CONFLICT)
DO $$
BEGIN
    -- Check if courses table exists and insert data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        -- Delete existing test data first (optional)
        DELETE FROM courses WHERE title IN (
            'Introduction to AI',
            'Machine Learning Fundamentals',
            'Deep Learning with Python',
            'Natural Language Processing'
        );

        -- Insert fresh data
        INSERT INTO courses (title, description, price, display, is_active)
        VALUES
            ('Introduction to AI', 'Learn the basics of Artificial Intelligence', 299, true, true),
            ('Machine Learning Fundamentals', 'Deep dive into ML algorithms', 399, true, true),
            ('Deep Learning with Python', 'Advanced neural networks course', 499, true, true),
            ('Natural Language Processing', 'Text analysis and NLP techniques', 449, true, true);

        RAISE NOTICE 'Courses inserted successfully';
    ELSE
        RAISE NOTICE 'Courses table does not exist';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting courses: %', SQLERRM;
END $$;

-- 3. Insert sample announcements
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1;

    IF admin_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
        -- Delete existing test data
        DELETE FROM announcements WHERE title IN (
            'Welcome to AI Learning Platform',
            'New Courses Available',
            'System Maintenance'
        );

        -- Insert fresh data
        INSERT INTO announcements (title, content, priority, is_active, created_by)
        VALUES
            ('Welcome to AI Learning Platform', 'We are excited to launch our new AI learning platform!', 3, true, admin_id),
            ('New Courses Available', 'Check out our latest Machine Learning courses', 2, true, admin_id),
            ('System Maintenance', 'Scheduled maintenance on Sunday 2 AM - 4 AM', 1, true, admin_id);

        RAISE NOTICE 'Announcements inserted successfully';
    ELSE
        RAISE NOTICE 'Announcements table does not exist or admin user not found';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting announcements: %', SQLERRM;
END $$;

-- 4. Insert sample events
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        -- Delete existing test data
        DELETE FROM events WHERE title IN (
            'AI Workshop 2024',
            'Machine Learning Seminar',
            'Deep Learning Bootcamp'
        );

        -- Insert fresh data
        INSERT INTO events (title, description, event_date, location, display, is_active)
        VALUES
            ('AI Workshop 2024', 'Hands-on workshop on AI basics', '2024-12-15', 'Online', true, true),
            ('Machine Learning Seminar', 'Expert talks on ML trends', '2024-12-20', 'Virtual Conference', true, true),
            ('Deep Learning Bootcamp', 'Intensive 2-day bootcamp', '2025-01-10', 'Tech Hub', true, true);

        RAISE NOTICE 'Events inserted successfully';
    ELSE
        RAISE NOTICE 'Events table does not exist';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting events: %', SQLERRM;
END $$;

-- 5. Insert sample achievements
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
        -- Delete existing test data
        DELETE FROM achievements WHERE name IN (
            'First Steps',
            'Knowledge Seeker',
            'AI Explorer',
            'Active Learner',
            'Community Helper'
        );

        -- Insert fresh data
        INSERT INTO achievements (name, description, icon, category, points, is_active)
        VALUES
            ('First Steps', 'Complete your first course', '🎯', 'learning', 10, true),
            ('Knowledge Seeker', 'Complete 5 courses', '📚', 'learning', 50, true),
            ('AI Explorer', 'Complete all AI courses', '🤖', 'learning', 100, true),
            ('Active Learner', 'Login 7 days in a row', '🔥', 'engagement', 25, true),
            ('Community Helper', 'Help 10 other students', '🤝', 'social', 30, true);

        RAISE NOTICE 'Achievements inserted successfully';
    ELSE
        RAISE NOTICE 'Achievements table does not exist';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting achievements: %', SQLERRM;
END $$;

-- 6. Insert sample blog posts
DO $$
DECLARE
    author_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO author_id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1;

    IF author_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
        -- Delete existing test data
        DELETE FROM blog_posts WHERE slug IN (
            'getting-started-with-ai',
            'top-10-ml-algorithms'
        );

        -- Insert fresh data
        INSERT INTO blog_posts (
            title, slug, excerpt, content, author_id,
            status, published_at
        )
        VALUES
            (
                'Getting Started with AI Learning',
                'getting-started-with-ai',
                'A comprehensive guide to beginning your AI journey',
                E'# Getting Started with AI Learning\n\nArtificial Intelligence is transforming the world. In this guide, we will explore the fundamentals of AI and how you can start your learning journey.\n\n## What is AI?\n\nAI refers to the simulation of human intelligence in machines that are programmed to think and learn like humans.\n\n## Key Concepts\n\n1. **Machine Learning**: Algorithms that improve through experience\n2. **Neural Networks**: Systems inspired by the human brain\n3. **Deep Learning**: Multi-layered neural networks\n4. **Natural Language Processing**: Understanding human language\n\n## Getting Started\n\n### Step 1: Build Foundation\nStart with mathematics and statistics basics.\n\n### Step 2: Learn Programming\nPython is the most popular language for AI.\n\n### Step 3: Take Courses\nEnroll in our structured AI courses.\n\n### Step 4: Practice\nWork on real-world projects.',
                author_id,
                'published',
                NOW()
            ),
            (
                'Top 10 Machine Learning Algorithms',
                'top-10-ml-algorithms',
                'Essential ML algorithms every data scientist should know',
                E'# Top 10 Machine Learning Algorithms\n\nMaster these fundamental algorithms to excel in machine learning.\n\n## 1. Linear Regression\nThe foundation of predictive modeling. Used for predicting continuous values.\n\n## 2. Logistic Regression\nPerfect for binary classification problems.\n\n## 3. Decision Trees\nIntuitive and interpretable algorithm for both classification and regression.\n\n## 4. Random Forests\nEnsemble learning method that combines multiple decision trees.\n\n## 5. Support Vector Machines (SVM)\nPowerful for high-dimensional spaces.\n\n## 6. K-Nearest Neighbors (KNN)\nSimple yet effective for classification and regression.\n\n## 7. K-Means Clustering\nUnsupervised learning for grouping similar data.\n\n## 8. Naive Bayes\nProbabilistic classifier based on Bayes theorem.\n\n## 9. Gradient Boosting\nSequential ensemble technique for improved accuracy.\n\n## 10. Neural Networks\nThe backbone of deep learning.\n\n## Conclusion\nMastering these algorithms provides a solid foundation for any ML project.',
                author_id,
                'published',
                NOW()
            );

        RAISE NOTICE 'Blog posts inserted successfully';
    ELSE
        RAISE NOTICE 'Blog posts table does not exist or admin user not found';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting blog posts: %', SQLERRM;
END $$;

-- 7. Create some sample reviews if courses exist
DO $$
DECLARE
    user_id UUID;
    course_id UUID;
BEGIN
    -- Get admin user and first course
    SELECT id INTO user_id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai' LIMIT 1;
    SELECT id INTO course_id FROM courses WHERE title = 'Introduction to AI' LIMIT 1;

    IF user_id IS NOT NULL AND course_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        -- Delete existing review if any
        DELETE FROM reviews WHERE user_id = user_id AND course_id = course_id;

        -- Insert new review
        INSERT INTO reviews (user_id, course_id, rating, comment, display, approved)
        VALUES (user_id, course_id, 5, 'Excellent course! The content is well-structured and easy to understand. Highly recommended for beginners.', true, true);

        RAISE NOTICE 'Review inserted successfully';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting review: %', SQLERRM;
END $$;

-- 8. Display summary of inserted data
SELECT 'Data Population Complete!' as status;

SELECT 'Table' as name, 'Row Count' as count
UNION ALL
SELECT 'Profiles (Admin)', COUNT(*)::text FROM profiles WHERE role = 'admin'
UNION ALL
SELECT 'Courses', COUNT(*)::text FROM courses
UNION ALL
SELECT 'Events', COUNT(*)::text FROM events
UNION ALL
SELECT 'Announcements', COUNT(*)::text FROM announcements
UNION ALL
SELECT 'Achievements', COUNT(*)::text FROM achievements
UNION ALL
SELECT 'Blog Posts', COUNT(*)::text FROM blog_posts
UNION ALL
SELECT 'Reviews', COUNT(*)::text FROM reviews;

-- 9. Show admin users
SELECT
    'Admin Users:' as info,
    email,
    display_name,
    role
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;