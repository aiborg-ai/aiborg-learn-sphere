-- Debug Admin Access Issues
-- Run these queries in Supabase SQL Editor to diagnose the problem

-- 1. Check if user_roles table exists and has data
SELECT
    u.email,
    u.id as user_id,
    ur.role,
    ur.is_active,
    u.last_sign_in_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'hirendra.vikram@aiborg.ai';

-- 2. Check profiles table
SELECT
    id,
    user_id,
    email,
    display_name,
    role,
    created_at
FROM profiles
WHERE email = 'hirendra.vikram@aiborg.ai';

-- 3. Check if there are any courses in the database
SELECT COUNT(*) as total_courses FROM courses;

-- 4. Check if there are any enrollments
SELECT COUNT(*) as total_enrollments FROM enrollments;

-- 5. Check if there are any announcements
SELECT COUNT(*) as total_announcements FROM announcements;

-- 6. List all tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 7. Grant admin role if missing (just in case)
INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'hirendra.vikram@aiborg.ai'
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;

-- 8. Update profile role to admin if needed
UPDATE profiles
SET role = 'admin'
WHERE email = 'hirendra.vikram@aiborg.ai';

-- 9. Verify the update
SELECT * FROM profiles WHERE email = 'hirendra.vikram@aiborg.ai';
SELECT * FROM user_roles WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'hirendra.vikram@aiborg.ai'
);