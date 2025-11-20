-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR TENANT ISOLATION
-- Migration: 20251120300002
-- Phase 3.3: Security - Critical for tenant data isolation
-- ============================================================================

-- ============================================================================
-- 1. TENANTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Tenant owners full access" ON public.tenants;
DROP POLICY IF EXISTS "Tenant admins can view" ON public.tenants;
DROP POLICY IF EXISTS "Super admins view all tenants" ON public.tenants;

-- Tenant owners can manage their tenant
CREATE POLICY "Tenant owners full access"
ON public.tenants
FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Tenant admins can view their tenant (read-only)
CREATE POLICY "Tenant admins can view"
ON public.tenants
FOR SELECT
USING (
    id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager', 'owner')
        AND status = 'active'
    )
);

-- Super admins can view and manage all tenants
CREATE POLICY "Super admins full access"
ON public.tenants
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);

-- ============================================================================
-- 2. TENANT MEMBERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Tenant admins manage members" ON public.tenant_members;
DROP POLICY IF EXISTS "Super admins full access members" ON public.tenant_members;

-- Users can view their own memberships
CREATE POLICY "Users can view their memberships"
ON public.tenant_members
FOR SELECT
USING (user_id = auth.uid());

-- Tenant owners/admins can manage members in their tenant
CREATE POLICY "Tenant admins manage members"
ON public.tenant_members
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
);

-- Super admins can manage all memberships
CREATE POLICY "Super admins full access members"
ON public.tenant_members
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);

-- ============================================================================
-- 3. TENANT DOMAINS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Tenant admins manage domains" ON public.tenant_domains;
DROP POLICY IF EXISTS "Super admins full access domains" ON public.tenant_domains;

-- Tenant owners/admins can manage their tenant's domains
CREATE POLICY "Tenant admins manage domains"
ON public.tenant_domains
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
);

-- Super admins can manage all domains
CREATE POLICY "Super admins full access domains"
ON public.tenant_domains
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);

-- ============================================================================
-- 4. TENANT EMAIL TEMPLATES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Tenant admins manage email templates" ON public.tenant_email_templates;

-- Tenant owners/admins can manage their tenant's email templates
CREATE POLICY "Tenant admins manage email templates"
ON public.tenant_email_templates
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
);

-- ============================================================================
-- 5. COURSES TABLE POLICIES (Updated for Multi-Tenancy)
-- ============================================================================

-- Drop old course policies
DROP POLICY IF EXISTS "Users can view courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can create courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can delete own courses" ON public.courses;

-- Users can view courses in their tenant OR platform-wide courses (tenant_id IS NULL)
CREATE POLICY "Users can view tenant courses"
ON public.courses
FOR SELECT
USING (
    tenant_id IS NULL -- Platform-wide courses
    OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

-- Instructors/admins can create courses in their tenant
CREATE POLICY "Tenant instructors create courses"
ON public.courses
FOR INSERT
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('instructor', 'admin', 'owner')
        AND status = 'active'
    )
);

-- Instructors can update their own courses OR admins can update any course in their tenant
CREATE POLICY "Tenant instructors update courses"
ON public.courses
FOR UPDATE
USING (
    (instructor_id = auth.uid() AND tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid() AND status = 'active'
    ))
    OR
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
        AND status = 'active'
    )
)
WITH CHECK (
    (instructor_id = auth.uid() AND tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid() AND status = 'active'
    ))
    OR
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
        AND status = 'active'
    )
);

-- Instructors can delete their own courses OR admins can delete any course in their tenant
CREATE POLICY "Tenant instructors delete courses"
ON public.courses
FOR DELETE
USING (
    (instructor_id = auth.uid() AND tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid() AND status = 'active'
    ))
    OR
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
        AND status = 'active'
    )
);

-- ============================================================================
-- 6. ENROLLMENTS TABLE POLICIES (Updated for Multi-Tenancy)
-- ============================================================================

DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can enroll" ON public.enrollments;
DROP POLICY IF EXISTS "Instructors view course enrollments" ON public.enrollments;

-- Users can view their own enrollments
CREATE POLICY "Users view own enrollments"
ON public.enrollments
FOR SELECT
USING (
    user_id = auth.uid()
    OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('instructor', 'admin', 'owner')
        AND status = 'active'
    )
);

-- Users can enroll in courses within their tenant
CREATE POLICY "Users enroll in tenant courses"
ON public.enrollments
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND (
        tenant_id IS NULL -- Platform courses
        OR tenant_id IN (
            SELECT tenant_id FROM public.tenant_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    )
);

-- Admins can manage enrollments in their tenant
CREATE POLICY "Tenant admins manage enrollments"
ON public.enrollments
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
        AND status = 'active'
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
        AND status = 'active'
    )
);

-- ============================================================================
-- 7. USER PROGRESS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users update own progress" ON public.user_progress;

-- Users can view their own progress
CREATE POLICY "Users view own progress"
ON public.user_progress
FOR SELECT
USING (
    user_id = auth.uid()
    OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND role IN ('instructor', 'admin', 'owner')
        AND status = 'active'
    )
);

-- Users can update their own progress
CREATE POLICY "Users update own progress"
ON public.user_progress
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 8. PROFILES TABLE POLICIES (Enhanced for Multi-Tenancy)
-- ============================================================================

-- Note: Profiles already has RLS enabled, just adding tenant-aware policy

DROP POLICY IF EXISTS "Users view profiles in tenant" ON public.profiles;

-- Users can view profiles within their tenant
CREATE POLICY "Users view profiles in tenant"
ON public.profiles
FOR SELECT
USING (
    user_id = auth.uid() -- Own profile
    OR tenant_id IS NULL -- Platform-wide profiles
    OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

-- ============================================================================
-- 9. GENERIC TENANT-SCOPED POLICIES PATTERN
-- ============================================================================

-- For other tables with tenant_id, apply similar pattern:
-- - Users can view/manage records in their tenant
-- - Admins have full access within their tenant
-- - Super admins have full access across all tenants

-- Apply to remaining tables...

-- Homework Assignments
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view homework"
ON public.homework_assignments
FOR SELECT
USING (
    tenant_id IS NULL
    OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Forum Categories
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view forum categories"
ON public.forum_categories
FOR SELECT
USING (
    tenant_id IS NULL
    OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Forum Threads
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members access forum threads"
ON public.forum_threads
FOR ALL
USING (
    tenant_id IS NULL
    OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
)
WITH CHECK (
    tenant_id IS NULL
    OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view events"
ON public.events
FOR SELECT
USING (
    tenant_id IS NULL
    OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Workshops
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view workshops"
ON public.workshops
FOR SELECT
USING (
    tenant_id IS NULL
    OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- ============================================================================
-- 10. SUPER ADMIN BYPASS (Critical)
-- ============================================================================

-- Super admins should bypass all tenant restrictions
-- Apply this pattern to all tenant-scoped tables

CREATE POLICY "Super admins bypass tenant restrictions courses"
ON public.courses
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Super admins bypass tenant restrictions enrollments"
ON public.enrollments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Super admins bypass tenant restrictions progress"
ON public.user_progress
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================================================
-- MIGRATION COMPLETE - TENANT ISOLATION SECURED
-- ============================================================================

-- Verification query (run manually to test):
-- SELECT * FROM public.tenants WHERE id NOT IN (
--     SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
-- );
-- Should return 0 rows for non-super-admin users

COMMENT ON POLICY "Tenant owners full access" ON public.tenants IS 'Owners have full control over their tenant configuration';
COMMENT ON POLICY "Users can view tenant courses" ON public.courses IS 'Users can only view courses in their tenant or platform-wide courses';
COMMENT ON POLICY "Tenant members view homework" ON public.homework_assignments IS 'Homework is isolated per tenant for data privacy';
