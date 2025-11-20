-- ============================================================================
-- ADD TENANT_ID TO EXISTING TABLES
-- Migration: 20251120300001
-- Phase 3.3: Tenant Isolation - Part 2
-- ============================================================================

-- ============================================================================
-- 1. ADD TENANT_ID COLUMNS
-- ============================================================================

-- Profiles (user accounts)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- Courses
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Enrollments
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- User Progress
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Homework Assignments
ALTER TABLE public.homework_assignments
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Homework Submissions
ALTER TABLE public.homework_submissions
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- AI Assessment Attempts
ALTER TABLE public.ai_assessment_attempts
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- AI Assessment Results
ALTER TABLE public.ai_assessment_results
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Blog Posts (optional - can be shared across tenants or tenant-specific)
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- Shared Content
ALTER TABLE public.shared_content
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Learning Nuggets
ALTER TABLE public.learning_nuggets
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- User Learning Goals
ALTER TABLE public.user_learning_goals
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- User Career Goals
ALTER TABLE public.user_career_goals
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- User Study Plans
ALTER TABLE public.user_study_plans
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Flashcard Decks
ALTER TABLE public.flashcard_decks
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Flashcards
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Quiz Attempts
ALTER TABLE public.quiz_attempts
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Exercise Submissions
ALTER TABLE public.exercise_submissions
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Workshops
ALTER TABLE public.workshops
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Forum Categories
ALTER TABLE public.forum_categories
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Forum Threads
ALTER TABLE public.forum_threads
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Forum Posts
ALTER TABLE public.forum_posts
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Certificates
ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Achievements
ALTER TABLE public.user_achievements
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Reviews
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- AI Learning Paths
ALTER TABLE public.ai_learning_paths
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Compliance Requirements (from Phase 3.1)
ALTER TABLE public.compliance_requirements
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- User Compliance Status
ALTER TABLE public.user_compliance_status
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_tenant_id ON public.courses(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_tenant_id ON public.enrollments(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_progress_tenant_id ON public.user_progress(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_homework_assignments_tenant_id ON public.homework_assignments(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_homework_submissions_tenant_id ON public.homework_submissions(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_assessment_attempts_tenant_id ON public.ai_assessment_attempts(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_assessment_results_tenant_id ON public.ai_assessment_results(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_tenant_id ON public.blog_posts(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_content_tenant_id ON public.shared_content(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_nuggets_tenant_id ON public.learning_nuggets(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_learning_goals_tenant_id ON public.user_learning_goals(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_career_goals_tenant_id ON public.user_career_goals(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_study_plans_tenant_id ON public.user_study_plans(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_tenant_id ON public.flashcard_decks(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flashcards_tenant_id ON public.flashcards(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_tenant_id ON public.quiz_attempts(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercise_submissions_tenant_id ON public.exercise_submissions(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON public.events(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workshops_tenant_id ON public.workshops(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_categories_tenant_id ON public.forum_categories(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_threads_tenant_id ON public.forum_threads(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_posts_tenant_id ON public.forum_posts(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_certificates_tenant_id ON public.certificates(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_achievements_tenant_id ON public.user_achievements(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON public.reviews(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_learning_paths_tenant_id ON public.ai_learning_paths(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_tenant_id ON public.compliance_requirements(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_compliance_status_tenant_id ON public.user_compliance_status(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- 3. BACKFILL EXISTING DATA (Optional - Platform Tenant)
-- ============================================================================

-- Update existing records to belong to the platform tenant
-- This allows existing users to continue using the platform without disruption

UPDATE public.profiles
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE tenant_id IS NULL;

UPDATE public.courses
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE tenant_id IS NULL;

UPDATE public.enrollments
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE tenant_id IS NULL;

-- Note: Other tables can remain NULL if no data exists yet
-- They will inherit tenant_id from their parent records (courses, users, etc.)

-- ============================================================================
-- 4. ADD COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Courses by tenant and status
CREATE INDEX IF NOT EXISTS idx_courses_tenant_status ON public.courses(tenant_id, is_published, created_at DESC)
WHERE tenant_id IS NOT NULL;

-- Enrollments by tenant and user
CREATE INDEX IF NOT EXISTS idx_enrollments_tenant_user ON public.enrollments(tenant_id, user_id, enrolled_at DESC)
WHERE tenant_id IS NOT NULL;

-- Forum threads by tenant and category
CREATE INDEX IF NOT EXISTS idx_forum_threads_tenant_category ON public.forum_threads(tenant_id, category_id, created_at DESC)
WHERE tenant_id IS NOT NULL;

-- Events by tenant and date
CREATE INDEX IF NOT EXISTS idx_events_tenant_date ON public.events(tenant_id, start_date)
WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON COLUMN public.profiles.tenant_id IS 'Tenant/organization this user belongs to (NULL = platform-wide user)';
COMMENT ON COLUMN public.courses.tenant_id IS 'Tenant/organization that owns this course (NULL = platform-wide course)';
COMMENT ON COLUMN public.enrollments.tenant_id IS 'Tenant context for this enrollment (for multi-tenant isolation)';
