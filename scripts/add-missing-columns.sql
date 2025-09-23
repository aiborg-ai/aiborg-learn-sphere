-- Add Missing Columns to Existing Tables
-- Run this if you get column not found errors

-- 1. Add missing columns to courses table
DO $$
BEGIN
    -- Add start_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'courses' AND column_name = 'start_date') THEN
        ALTER TABLE courses ADD COLUMN start_date DATE;
        RAISE NOTICE 'Added start_date column to courses';
    END IF;

    -- Add end_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'courses' AND column_name = 'end_date') THEN
        ALTER TABLE courses ADD COLUMN end_date DATE;
        RAISE NOTICE 'Added end_date column to courses';
    END IF;

    -- Add max_capacity if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'courses' AND column_name = 'max_capacity') THEN
        ALTER TABLE courses ADD COLUMN max_capacity INTEGER DEFAULT 30;
        RAISE NOTICE 'Added max_capacity column to courses';
    END IF;

    -- Add enrollment_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'courses' AND column_name = 'enrollment_count') THEN
        ALTER TABLE courses ADD COLUMN enrollment_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added enrollment_count column to courses';
    END IF;

    -- Add category if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'courses' AND column_name = 'category') THEN
        ALTER TABLE courses ADD COLUMN category TEXT;
        RAISE NOTICE 'Added category column to courses';
    END IF;

    -- Add level if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'courses' AND column_name = 'level') THEN
        ALTER TABLE courses ADD COLUMN level TEXT;
        RAISE NOTICE 'Added level column to courses';
    END IF;

    -- Add sort_order if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'courses' AND column_name = 'sort_order') THEN
        ALTER TABLE courses ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added sort_order column to courses';
    END IF;
END $$;

-- 2. Add missing columns to events table
DO $$
BEGIN
    -- Add event_time if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'events' AND column_name = 'event_time') THEN
        ALTER TABLE events ADD COLUMN event_time TIME;
        RAISE NOTICE 'Added event_time column to events';
    END IF;

    -- Add max_capacity if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'events' AND column_name = 'max_capacity') THEN
        ALTER TABLE events ADD COLUMN max_capacity INTEGER DEFAULT 50;
        RAISE NOTICE 'Added max_capacity column to events';
    END IF;

    -- Add registration_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'events' AND column_name = 'registration_count') THEN
        ALTER TABLE events ADD COLUMN registration_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added registration_count column to events';
    END IF;

    -- Add event_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'events' AND column_name = 'event_type') THEN
        ALTER TABLE events ADD COLUMN event_type TEXT DEFAULT 'workshop';
        RAISE NOTICE 'Added event_type column to events';
    END IF;
END $$;

-- 3. Add missing columns to announcements table
DO $$
BEGIN
    -- Add audience if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'announcements' AND column_name = 'audience') THEN
        ALTER TABLE announcements ADD COLUMN audience TEXT DEFAULT 'all';
        RAISE NOTICE 'Added audience column to announcements';
    END IF;
END $$;

-- 4. Add missing columns to achievements table
DO $$
BEGIN
    -- Add requirement_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'achievements' AND column_name = 'requirement_type') THEN
        ALTER TABLE achievements ADD COLUMN requirement_type TEXT;
        RAISE NOTICE 'Added requirement_type column to achievements';
    END IF;

    -- Add requirement_value if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'achievements' AND column_name = 'requirement_value') THEN
        ALTER TABLE achievements ADD COLUMN requirement_value INTEGER;
        RAISE NOTICE 'Added requirement_value column to achievements';
    END IF;

    -- Add max_progress if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'achievements' AND column_name = 'max_progress') THEN
        ALTER TABLE achievements ADD COLUMN max_progress INTEGER;
        RAISE NOTICE 'Added max_progress column to achievements';
    END IF;

    -- Add sort_order if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'achievements' AND column_name = 'sort_order') THEN
        ALTER TABLE achievements ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added sort_order column to achievements';
    END IF;
END $$;

-- 5. Add missing columns to blog_posts table
DO $$
BEGIN
    -- Add featured_image if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'blog_posts' AND column_name = 'featured_image') THEN
        ALTER TABLE blog_posts ADD COLUMN featured_image TEXT;
        RAISE NOTICE 'Added featured_image column to blog_posts';
    END IF;

    -- Add tags if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'blog_posts' AND column_name = 'tags') THEN
        ALTER TABLE blog_posts ADD COLUMN tags TEXT[];
        RAISE NOTICE 'Added tags column to blog_posts';
    END IF;

    -- Add category if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'blog_posts' AND column_name = 'category') THEN
        ALTER TABLE blog_posts ADD COLUMN category TEXT;
        RAISE NOTICE 'Added category column to blog_posts';
    END IF;

    -- Add view_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'blog_posts' AND column_name = 'view_count') THEN
        ALTER TABLE blog_posts ADD COLUMN view_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added view_count column to blog_posts';
    END IF;

    -- Add meta_title if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'blog_posts' AND column_name = 'meta_title') THEN
        ALTER TABLE blog_posts ADD COLUMN meta_title TEXT;
        RAISE NOTICE 'Added meta_title column to blog_posts';
    END IF;

    -- Add meta_description if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'blog_posts' AND column_name = 'meta_description') THEN
        ALTER TABLE blog_posts ADD COLUMN meta_description TEXT;
        RAISE NOTICE 'Added meta_description column to blog_posts';
    END IF;
END $$;

-- 6. Show current table structures after updates
SELECT 'Courses Table Structure' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'courses' AND table_schema = 'public'
ORDER BY ordinal_position;