-- Grant Admin Access to Specific User
-- Run this in Supabase SQL Editor

-- Option 1: Grant admin to a specific email (replace with actual email)
INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'hirendra.vikram@gmail.com'  -- Replace with your email
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;

-- Option 2: Grant admin to multiple emails at once
INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
WHERE email IN (
    'hirendra.vikram@gmail.com',
    'hellomail@gmail.com',
    'testmail555@gmail.com'
)
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;

-- Option 3: Grant admin to the most recently created user
INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;

-- Verify admin roles
SELECT
    u.id,
    u.email,
    u.created_at,
    ur.role,
    ur.is_active,
    u.last_sign_in_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;