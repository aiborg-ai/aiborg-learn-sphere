-- Add Missing Constraints to Tables
-- Run this if you want to use ON CONFLICT clauses

-- 1. Add unique constraint to courses title (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'courses_title_unique'
    ) THEN
        ALTER TABLE courses ADD CONSTRAINT courses_title_unique UNIQUE (title);
        RAISE NOTICE 'Added unique constraint to courses.title';
    ELSE
        RAISE NOTICE 'Unique constraint on courses.title already exists';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add constraint to courses.title: %', SQLERRM;
END $$;

-- 2. Add unique constraint to achievements name (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'achievements_name_unique'
    ) THEN
        ALTER TABLE achievements ADD CONSTRAINT achievements_name_unique UNIQUE (name);
        RAISE NOTICE 'Added unique constraint to achievements.name';
    ELSE
        RAISE NOTICE 'Unique constraint on achievements.name already exists';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add constraint to achievements.name: %', SQLERRM;
END $$;

-- 3. Add unique constraint to blog_posts slug (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'blog_posts_slug_unique'
    ) THEN
        ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);
        RAISE NOTICE 'Added unique constraint to blog_posts.slug';
    ELSE
        RAISE NOTICE 'Unique constraint on blog_posts.slug already exists';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add constraint to blog_posts.slug: %', SQLERRM;
END $$;

-- 4. List all constraints on main tables
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('courses', 'events', 'announcements', 'achievements', 'blog_posts', 'profiles')
ORDER BY tc.table_name, tc.constraint_type;