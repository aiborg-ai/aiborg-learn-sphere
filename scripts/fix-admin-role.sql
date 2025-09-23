-- Quick Fix for Admin Role
-- This script uses the profiles table which already exists

-- 1. Check current profiles
SELECT
    p.id,
    p.user_id,
    p.email,
    p.display_name,
    p.role,
    u.last_sign_in_at
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.email = 'hirendra.vikram@aiborg.ai';

-- 2. Update role to admin in profiles table
UPDATE profiles
SET role = 'admin'
WHERE email = 'hirendra.vikram@aiborg.ai';

-- 3. Also update for any test accounts you want to use as admin
UPDATE profiles
SET role = 'admin'
WHERE email IN (
    'hirendra.vikram@aiborg.ai',
    'testmail555@gmail.com'  -- Add any other emails you want as admin
);

-- 4. Verify the update
SELECT
    email,
    display_name,
    role,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 5. Check all users and their roles
SELECT
    p.email,
    p.display_name,
    p.role,
    p.created_at,
    CASE
        WHEN p.role = 'admin' THEN '✅ Admin Access'
        ELSE '❌ Regular User'
    END as access_level
FROM profiles p
ORDER BY
    CASE WHEN p.role = 'admin' THEN 0 ELSE 1 END,
    p.created_at DESC;