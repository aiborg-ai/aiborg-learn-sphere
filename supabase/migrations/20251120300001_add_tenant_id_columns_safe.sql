-- ============================================================================
-- ADD TENANT_ID TO EXISTING TABLES (SAFE VERSION)
-- Migration: 20251120300001
-- Phase 3.3: Tenant Isolation - Part 2
-- Only adds columns to tables that exist
-- ============================================================================

-- ============================================================================
-- 1. ADD TENANT_ID COLUMNS (with existence checks)
-- ============================================================================

DO $$
BEGIN
    -- Profiles (user accounts)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Courses
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
        ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_courses_tenant_id ON public.courses(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Enrollments
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollments') THEN
        ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_enrollments_tenant_id ON public.enrollments(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- User Progress
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress') THEN
        ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_user_progress_tenant_id ON public.user_progress(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Homework Assignments
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'homework_assignments') THEN
        ALTER TABLE public.homework_assignments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_homework_assignments_tenant_id ON public.homework_assignments(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Homework Submissions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'homework_submissions') THEN
        ALTER TABLE public.homework_submissions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_homework_submissions_tenant_id ON public.homework_submissions(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Blog Posts
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
        ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_blog_posts_tenant_id ON public.blog_posts(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Shared Content
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shared_content') THEN
        ALTER TABLE public.shared_content ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_shared_content_tenant_id ON public.shared_content(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Learning Nuggets
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learning_nuggets') THEN
        ALTER TABLE public.learning_nuggets ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_learning_nuggets_tenant_id ON public.learning_nuggets(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- User Learning Goals
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_learning_goals') THEN
        ALTER TABLE public.user_learning_goals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_user_learning_goals_tenant_id ON public.user_learning_goals(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- User Career Goals
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_career_goals') THEN
        ALTER TABLE public.user_career_goals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_user_career_goals_tenant_id ON public.user_career_goals(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- User Study Plans
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_study_plans') THEN
        ALTER TABLE public.user_study_plans ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_user_study_plans_tenant_id ON public.user_study_plans(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Flashcard Decks
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flashcard_decks') THEN
        ALTER TABLE public.flashcard_decks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_flashcard_decks_tenant_id ON public.flashcard_decks(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Flashcards
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flashcards') THEN
        ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_flashcards_tenant_id ON public.flashcards(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Quiz Attempts
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_attempts') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_tenant_id ON public.quiz_attempts(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Exercise Submissions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exercise_submissions') THEN
        ALTER TABLE public.exercise_submissions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_exercise_submissions_tenant_id ON public.exercise_submissions(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Events
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON public.events(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Workshops
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workshops') THEN
        ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_workshops_tenant_id ON public.workshops(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Forum Categories
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_categories') THEN
        ALTER TABLE public.forum_categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_forum_categories_tenant_id ON public.forum_categories(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Forum Threads
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_threads') THEN
        ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_forum_threads_tenant_id ON public.forum_threads(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Forum Posts
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_posts') THEN
        ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_forum_posts_tenant_id ON public.forum_posts(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Certificates
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') THEN
        ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_certificates_tenant_id ON public.certificates(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- User Achievements
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_achievements') THEN
        ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_user_achievements_tenant_id ON public.user_achievements(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Reviews
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON public.reviews(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Notifications
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- AI Learning Paths
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_learning_paths') THEN
        ALTER TABLE public.ai_learning_paths ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_ai_learning_paths_tenant_id ON public.ai_learning_paths(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- Compliance Requirements
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compliance_requirements') THEN
        ALTER TABLE public.compliance_requirements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_compliance_requirements_tenant_id ON public.compliance_requirements(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;

    -- User Compliance Status
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_compliance_status') THEN
        ALTER TABLE public.user_compliance_status ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_user_compliance_status_tenant_id ON public.user_compliance_status(tenant_id) WHERE tenant_id IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- 2. BACKFILL EXISTING DATA (Platform Tenant)
-- ============================================================================

DO $$
BEGIN
    -- Update existing records to belong to the platform tenant
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        UPDATE public.profiles SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
        UPDATE public.courses SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollments') THEN
        UPDATE public.enrollments SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
    END IF;
END $$;

-- ============================================================================
-- 3. ADD COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

DO $$
BEGIN
    -- Courses by tenant and status
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
        CREATE INDEX IF NOT EXISTS idx_courses_tenant_status ON public.courses(tenant_id, is_published, created_at DESC)
        WHERE tenant_id IS NOT NULL;
    END IF;

    -- Enrollments by tenant and user
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollments') THEN
        CREATE INDEX IF NOT EXISTS idx_enrollments_tenant_user ON public.enrollments(tenant_id, user_id, enrolled_at DESC)
        WHERE tenant_id IS NOT NULL;
    END IF;

    -- Forum threads by tenant and category
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_threads') THEN
        CREATE INDEX IF NOT EXISTS idx_forum_threads_tenant_category ON public.forum_threads(tenant_id, category_id, created_at DESC)
        WHERE tenant_id IS NOT NULL;
    END IF;

    -- Events by tenant and date
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        CREATE INDEX IF NOT EXISTS idx_events_tenant_date ON public.events(tenant_id, start_date)
        WHERE tenant_id IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- 4. ADD COMMENTS
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        COMMENT ON COLUMN public.profiles.tenant_id IS 'Tenant/organization this user belongs to (NULL = platform-wide user)';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
        COMMENT ON COLUMN public.courses.tenant_id IS 'Tenant/organization that owns this course (NULL = platform-wide course)';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollments') THEN
        COMMENT ON COLUMN public.enrollments.tenant_id IS 'Tenant context for this enrollment (for multi-tenant isolation)';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
