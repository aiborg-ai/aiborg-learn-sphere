-- Add company_admin role to the system
-- This migration adds company_admin to profiles table and optionally to user_roles/role_permissions if they exist

-- ============================================================================
-- UPDATE PROFILES TABLE
-- ============================================================================

-- Drop existing role constraint and add new one with company_admin
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('super_admin', 'admin', 'instructor', 'student', 'user', 'guest', 'company_admin'));

-- Update comment
COMMENT ON COLUMN public.profiles.role IS 'User role: super_admin, admin, instructor, student, guest, company_admin';

-- ============================================================================
-- UPDATE USER_ROLES TABLE (IF EXISTS)
-- ============================================================================

-- Only update user_roles table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
        -- Drop existing role constraint and add new one with company_admin
        ALTER TABLE public.user_roles
        DROP CONSTRAINT IF EXISTS user_roles_role_check;

        ALTER TABLE public.user_roles
        ADD CONSTRAINT user_roles_role_check
        CHECK (role IN ('super_admin', 'admin', 'instructor', 'student', 'guest', 'company_admin'));

        RAISE NOTICE 'Updated user_roles table with company_admin role';
    ELSE
        RAISE NOTICE 'user_roles table does not exist, skipping';
    END IF;
END $$;

-- ============================================================================
-- ADD COMPANY_ADMIN PERMISSIONS (IF ROLE_PERMISSIONS TABLE EXISTS)
-- ============================================================================

-- Only insert permissions if role_permissions table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'role_permissions') THEN
        -- Insert permissions for company_admin role
        INSERT INTO public.role_permissions (role, resource, action) VALUES
            -- Company profile permissions
            ('company_admin', 'company_profile', 'create'),
            ('company_admin', 'company_profile', 'read'),
            ('company_admin', 'company_profile', 'update'),

            -- Assessment permissions
            ('company_admin', 'sme_assessment', 'create'),
            ('company_admin', 'sme_assessment', 'read'),
            ('company_admin', 'sme_assessment', 'update'),

            -- Course permissions (can view courses for training)
            ('company_admin', 'course', 'read'),
            ('company_admin', 'enrollment', 'create'),
            ('company_admin', 'enrollment', 'read'),

            -- Blog permissions
            ('company_admin', 'blog', 'read')
        ON CONFLICT (role, resource, action) DO NOTHING;

        RAISE NOTICE 'Added company_admin permissions to role_permissions table';
    ELSE
        RAISE NOTICE 'role_permissions table does not exist, skipping permissions setup';
    END IF;
END $$;
