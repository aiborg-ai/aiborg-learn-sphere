-- Update profiles table role constraint to support all role types
-- This aligns the profiles table with the user_roles RBAC system

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
