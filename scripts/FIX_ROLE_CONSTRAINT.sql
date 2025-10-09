-- ============================================================================
-- FIX PROFILES ROLE CONSTRAINT
-- Run this in Supabase SQL Editor to fix role update issues
-- ============================================================================

-- Drop the old constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with all supported roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('super_admin', 'admin', 'instructor', 'student', 'user', 'guest'));

-- Update the default value
ALTER TABLE public.profiles
ALTER COLUMN role SET DEFAULT 'student';

-- Update any existing 'user' roles to 'student' for consistency
UPDATE public.profiles
SET role = 'student'
WHERE role = 'user';

-- Add comment
COMMENT ON COLUMN public.profiles.role IS 'User role: super_admin, admin, instructor, student, guest';

-- Verify the fix
SELECT
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'profiles_role_check';

-- Show current role distribution
SELECT
    role,
    COUNT(*) as user_count
FROM public.profiles
GROUP BY role
ORDER BY user_count DESC;
