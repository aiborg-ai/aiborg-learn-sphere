-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR TENANT ISOLATION (SAFE VERSION)
-- Migration: 20251120300002
-- Phase 3.3: Security - Critical for tenant data isolation
-- Only creates policies for tables that exist
-- ============================================================================

DO $$
BEGIN
    -- ========================================================================
    -- 1. TENANTS TABLE POLICIES
    -- ========================================================================

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
        -- Drop existing policies if any
        DROP POLICY IF EXISTS "Tenant owners full access" ON public.tenants;
        DROP POLICY IF EXISTS "Tenant admins can view" ON public.tenants;
        DROP POLICY IF EXISTS "Super admins full access" ON public.tenants;

        -- Tenant owners can manage their tenant
        EXECUTE 'CREATE POLICY "Tenant owners full access" ON public.tenants FOR ALL
                 USING (owner_id = auth.uid())
                 WITH CHECK (owner_id = auth.uid())';

        -- Tenant admins can view their tenant
        EXECUTE 'CREATE POLICY "Tenant admins can view" ON public.tenants FOR SELECT
                 USING (id IN (SELECT tenant_id FROM public.tenant_members
                               WHERE user_id = auth.uid() AND role IN (''admin'', ''manager'', ''owner'') AND status = ''active''))';

        -- Super admins can view and manage all tenants
        EXECUTE 'CREATE POLICY "Super admins full access" ON public.tenants FOR ALL
                 USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))
                 WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))';
    END IF;

    -- ========================================================================
    -- 2. TENANT MEMBERS TABLE POLICIES
    -- ========================================================================

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_members') THEN
        DROP POLICY IF EXISTS "Users can view their memberships" ON public.tenant_members;
        DROP POLICY IF EXISTS "Tenant admins manage members" ON public.tenant_members;
        DROP POLICY IF EXISTS "Super admins full access members" ON public.tenant_members;

        EXECUTE 'CREATE POLICY "Users can view their memberships" ON public.tenant_members FOR SELECT
                 USING (user_id = auth.uid())';

        EXECUTE 'CREATE POLICY "Tenant admins manage members" ON public.tenant_members FOR ALL
                 USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                      WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'') AND status = ''active''))
                 WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                           WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'') AND status = ''active''))';

        EXECUTE 'CREATE POLICY "Super admins full access members" ON public.tenant_members FOR ALL
                 USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))
                 WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))';
    END IF;

    -- ========================================================================
    -- 3. TENANT DOMAINS TABLE POLICIES
    -- ========================================================================

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_domains') THEN
        DROP POLICY IF EXISTS "Tenant admins manage domains" ON public.tenant_domains;
        DROP POLICY IF EXISTS "Super admins full access domains" ON public.tenant_domains;

        EXECUTE 'CREATE POLICY "Tenant admins manage domains" ON public.tenant_domains FOR ALL
                 USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                      WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'') AND status = ''active''))
                 WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                           WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'') AND status = ''active''))';

        EXECUTE 'CREATE POLICY "Super admins full access domains" ON public.tenant_domains FOR ALL
                 USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))
                 WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))';
    END IF;

    -- ========================================================================
    -- 4. TENANT EMAIL TEMPLATES POLICIES
    -- ========================================================================

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_email_templates') THEN
        DROP POLICY IF EXISTS "Tenant admins manage email templates" ON public.tenant_email_templates;

        EXECUTE 'CREATE POLICY "Tenant admins manage email templates" ON public.tenant_email_templates FOR ALL
                 USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                      WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'') AND status = ''active''))
                 WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                           WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'') AND status = ''active''))';
    END IF;

    -- ========================================================================
    -- 5. COURSES TABLE POLICIES
    -- ========================================================================

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'tenant_id') THEN

        DROP POLICY IF EXISTS "Users can view courses" ON public.courses;
        DROP POLICY IF EXISTS "Users can view tenant courses" ON public.courses;
        DROP POLICY IF EXISTS "Tenant instructors create courses" ON public.courses;
        DROP POLICY IF EXISTS "Tenant instructors update courses" ON public.courses;
        DROP POLICY IF EXISTS "Tenant instructors delete courses" ON public.courses;
        DROP POLICY IF EXISTS "Super admins bypass tenant restrictions courses" ON public.courses;

        EXECUTE 'CREATE POLICY "Users can view tenant courses" ON public.courses FOR SELECT
                 USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                                           WHERE user_id = auth.uid() AND status = ''active''))';

        EXECUTE 'CREATE POLICY "Super admins bypass tenant restrictions courses" ON public.courses FOR ALL
                 USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))
                 WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))';
    END IF;

    -- ========================================================================
    -- 6. ENROLLMENTS TABLE POLICIES
    -- ========================================================================

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollments')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'tenant_id') THEN

        DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
        DROP POLICY IF EXISTS "Users enroll in tenant courses" ON public.enrollments;
        DROP POLICY IF EXISTS "Tenant admins manage enrollments" ON public.enrollments;
        DROP POLICY IF EXISTS "Super admins bypass tenant restrictions enrollments" ON public.enrollments;

        EXECUTE 'CREATE POLICY "Users view own enrollments" ON public.enrollments FOR SELECT
                 USING (user_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                                              WHERE user_id = auth.uid() AND role IN (''instructor'', ''admin'', ''owner'') AND status = ''active''))';

        EXECUTE 'CREATE POLICY "Super admins bypass tenant restrictions enrollments" ON public.enrollments FOR ALL
                 USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))
                 WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))';
    END IF;

    -- ========================================================================
    -- 7. USER PROGRESS TABLE POLICIES
    -- ========================================================================

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_progress' AND column_name = 'tenant_id') THEN

        DROP POLICY IF EXISTS "Users view own progress" ON public.user_progress;
        DROP POLICY IF EXISTS "Users update own progress" ON public.user_progress;
        DROP POLICY IF EXISTS "Super admins bypass tenant restrictions progress" ON public.user_progress;

        EXECUTE 'CREATE POLICY "Users view own progress" ON public.user_progress FOR SELECT
                 USING (user_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                                              WHERE user_id = auth.uid() AND role IN (''instructor'', ''admin'', ''owner'') AND status = ''active''))';

        EXECUTE 'CREATE POLICY "Users update own progress" ON public.user_progress FOR ALL
                 USING (user_id = auth.uid())
                 WITH CHECK (user_id = auth.uid())';

        EXECUTE 'CREATE POLICY "Super admins bypass tenant restrictions progress" ON public.user_progress FOR ALL
                 USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))
                 WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin''))';
    END IF;

    -- ========================================================================
    -- 8. PROFILES TABLE POLICIES
    -- ========================================================================

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'tenant_id') THEN

        DROP POLICY IF EXISTS "Users view profiles in tenant" ON public.profiles;

        EXECUTE 'CREATE POLICY "Users view profiles in tenant" ON public.profiles FOR SELECT
                 USING (user_id = auth.uid() OR tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                                                                    WHERE user_id = auth.uid() AND status = ''active''))';
    END IF;

    -- ========================================================================
    -- 9. GENERIC TENANT-SCOPED TABLES
    -- ========================================================================

    -- Homework Assignments
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'homework_assignments')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'homework_assignments' AND column_name = 'tenant_id') THEN

        ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Tenant members view homework" ON public.homework_assignments;

        EXECUTE 'CREATE POLICY "Tenant members view homework" ON public.homework_assignments FOR SELECT
                 USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                                           WHERE user_id = auth.uid() AND status = ''active''))';
    END IF;

    -- Forum Categories
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_categories')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'forum_categories' AND column_name = 'tenant_id') THEN

        ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Tenant members view forum categories" ON public.forum_categories;

        EXECUTE 'CREATE POLICY "Tenant members view forum categories" ON public.forum_categories FOR SELECT
                 USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                                           WHERE user_id = auth.uid() AND status = ''active''))';
    END IF;

    -- Forum Threads
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_threads')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'forum_threads' AND column_name = 'tenant_id') THEN

        ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Tenant members access forum threads" ON public.forum_threads;

        EXECUTE 'CREATE POLICY "Tenant members access forum threads" ON public.forum_threads FOR ALL
                 USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                                           WHERE user_id = auth.uid() AND status = ''active''))
                 WITH CHECK (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                                                WHERE user_id = auth.uid() AND status = ''active''))';
    END IF;

    -- Events
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'tenant_id') THEN

        ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Tenant members view events" ON public.events;

        EXECUTE 'CREATE POLICY "Tenant members view events" ON public.events FOR SELECT
                 USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                                           WHERE user_id = auth.uid() AND status = ''active''))';
    END IF;

    -- Workshops
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workshops')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'workshops' AND column_name = 'tenant_id') THEN

        ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Tenant members view workshops" ON public.workshops;

        EXECUTE 'CREATE POLICY "Tenant members view workshops" ON public.workshops FOR SELECT
                 USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM public.tenant_members
                                                           WHERE user_id = auth.uid() AND status = ''active''))';
    END IF;

END $$;

-- ============================================================================
-- MIGRATION COMPLETE - TENANT ISOLATION SECURED
-- ============================================================================
