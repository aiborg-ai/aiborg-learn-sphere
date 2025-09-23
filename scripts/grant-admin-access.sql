-- Grant Admin Access Script
-- Run this in Supabase SQL Editor after signing up with any email

-- Step 1: Find your user ID (replace with your actual email)
SELECT id, email, created_at
FROM auth.users
WHERE email = 'your-actual-email@gmail.com';

-- Step 2: Copy the ID from above and use it below
-- Grant admin role to your user (replace 'your-user-id' with actual ID)
INSERT INTO user_roles (user_id, role, is_active)
VALUES ('your-user-id-here', 'admin', true)
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;

-- Alternative: Grant admin to most recent user (if you just signed up)
INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;

-- Verify admin role was granted
SELECT
    u.email,
    ur.role,
    ur.is_active,
    u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;