-- ========================================
-- Fix Author ID Issue for Blog Posts
-- ========================================
-- This script addresses the foreign key constraint error when inserting blog posts
-- Option 1: Make author_id nullable (recommended)
-- Option 2: Create a system user (if you want to track authorship)

-- OPTION 1: Make author_id nullable (RECOMMENDED)
-- This allows blog posts to exist without an author
ALTER TABLE blog_posts ALTER COLUMN author_id DROP NOT NULL;

-- OPTION 2: Create a system user (alternative)
-- Uncomment if you want all articles to have a "System" author
-- INSERT INTO auth.users (
--     id,
--     email,
--     encrypted_password,
--     email_confirmed_at,
--     created_at,
--     updated_at
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     'system@aiborg.ai',
--     crypt('system-password-change-this', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW()
-- ) ON CONFLICT (id) DO NOTHING;

-- After running this, you can proceed with batch_01 through batch_10
