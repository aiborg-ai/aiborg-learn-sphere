-- ============================================================================
-- TEAM COURSE ASSIGNMENTS SYSTEM
-- ============================================================================
-- This migration creates tables for assigning courses to team members
-- with due dates, progress tracking, and automatic enrollment.
--
-- Tables:
-- - team_course_assignments: Course assignments with metadata and settings
-- - team_assignment_users: Individual user assignments and progress tracking
--
-- Features:
-- - Assign courses to individuals, departments, or entire teams
-- - Mandatory vs optional assignments
-- - Due date tracking with reminders
-- - Automatic enrollment (optional)
-- - Progress percentage tracking
-- - Status tracking (assigned, started, completed, overdue)
-- - RLS policies for data security
-- ============================================================================

-- ============================================================================
-- TABLE: team_course_assignments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,

    -- Assignment metadata
    title TEXT NOT NULL,
    description TEXT,
    assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Assignment settings
    is_mandatory BOOLEAN DEFAULT false,
    due_date TIMESTAMP WITH TIME ZONE,
    notify_before_days INTEGER DEFAULT 3, -- Send reminder X days before due date
    auto_enroll BOOLEAN DEFAULT true, -- Automatically enroll assigned users

    -- Statistics (computed periodically)
    total_assigned INTEGER DEFAULT 0,
    total_started INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    total_overdue INTEGER DEFAULT 0,
    avg_completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_due_date CHECK (due_date IS NULL OR due_date > created_at),
    CONSTRAINT valid_notify_before CHECK (notify_before_days >= 0 AND notify_before_days <= 30)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_assignments_organization_id
    ON public.team_course_assignments(organization_id);

CREATE INDEX IF NOT EXISTS idx_team_assignments_course_id
    ON public.team_course_assignments(course_id);

CREATE INDEX IF NOT EXISTS idx_team_assignments_assigned_by
    ON public.team_course_assignments(assigned_by);

CREATE INDEX IF NOT EXISTS idx_team_assignments_due_date
    ON public.team_course_assignments(due_date)
    WHERE due_date IS NOT NULL;

-- ============================================================================
-- TABLE: team_assignment_users
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_assignment_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.team_course_assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Status tracking
    status TEXT CHECK (status IN ('assigned', 'started', 'completed', 'overdue')) DEFAULT 'assigned',

    -- Progress tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,

    -- Timestamps
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enrolled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    UNIQUE(assignment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_assignment_users_assignment_id
    ON public.team_assignment_users(assignment_id);

CREATE INDEX IF NOT EXISTS idx_team_assignment_users_user_id
    ON public.team_assignment_users(user_id);

CREATE INDEX IF NOT EXISTS idx_team_assignment_users_status
    ON public.team_assignment_users(status);

CREATE INDEX IF NOT EXISTS idx_team_assignment_users_completed_at
    ON public.team_assignment_users(completed_at)
    WHERE completed_at IS NOT NULL;

-- Composite index for finding assignments due soon (for reminders)
CREATE INDEX IF NOT EXISTS idx_team_assignment_users_reminders
    ON public.team_assignment_users(assignment_id, status, reminder_sent_at)
    WHERE status IN ('assigned', 'started');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.team_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assignment_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: team_course_assignments
-- ============================================================================

-- Organization members can view assignments for their org
CREATE POLICY "Organization members can view assignments"
    ON public.team_course_assignments FOR SELECT
    USING (
        organization_id IN (
            SELECT om.organization_id
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
        )
    );

-- Organization admins/managers can create assignments
CREATE POLICY "Organization admins can create assignments"
    ON public.team_course_assignments FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT om.organization_id
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager', 'owner')
        )
        AND assigned_by = auth.uid()
    );

-- Organization admins/managers can update assignments
CREATE POLICY "Organization admins can update assignments"
    ON public.team_course_assignments FOR UPDATE
    USING (
        organization_id IN (
            SELECT om.organization_id
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager', 'owner')
        )
    );

-- Organization admins/managers can delete assignments
CREATE POLICY "Organization admins can delete assignments"
    ON public.team_course_assignments FOR DELETE
    USING (
        organization_id IN (
            SELECT om.organization_id
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager', 'owner')
        )
    );

-- Super admins can do everything
CREATE POLICY "Super admins can manage all assignments"
    ON public.team_course_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- ============================================================================
-- RLS POLICIES: team_assignment_users
-- ============================================================================

-- Users can view their own assignments
CREATE POLICY "Users can view own assignments"
    ON public.team_assignment_users FOR SELECT
    USING (user_id = auth.uid());

-- Organization admins can view all assignments for their org
CREATE POLICY "Organization admins can view all user assignments"
    ON public.team_assignment_users FOR SELECT
    USING (
        assignment_id IN (
            SELECT tca.id
            FROM public.team_course_assignments tca
            WHERE tca.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_members om
                WHERE om.user_id = auth.uid()
                AND om.role IN ('admin', 'manager', 'owner')
            )
        )
    );

-- System can insert assignment users
CREATE POLICY "System can insert assignment users"
    ON public.team_assignment_users FOR INSERT
    WITH CHECK (true);

-- Users can update their own assignment progress
CREATE POLICY "Users can update own assignment progress"
    ON public.team_assignment_users FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Organization admins can update all assignments
CREATE POLICY "Organization admins can update user assignments"
    ON public.team_assignment_users FOR UPDATE
    USING (
        assignment_id IN (
            SELECT tca.id
            FROM public.team_course_assignments tca
            WHERE tca.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_members om
                WHERE om.user_id = auth.uid()
                AND om.role IN ('admin', 'manager', 'owner')
            )
        )
    );

-- Organization admins can delete assignment users
CREATE POLICY "Organization admins can delete user assignments"
    ON public.team_assignment_users FOR DELETE
    USING (
        assignment_id IN (
            SELECT tca.id
            FROM public.team_course_assignments tca
            WHERE tca.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_members om
                WHERE om.user_id = auth.uid()
                AND om.role IN ('admin', 'manager', 'owner')
            )
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_team_assignment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_team_assignment_updated_at ON public.team_course_assignments;
CREATE TRIGGER trigger_update_team_assignment_updated_at
    BEFORE UPDATE ON public.team_course_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_assignment_updated_at();

-- ============================================================================
-- Function to auto-enroll users when they're assigned
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_enroll_assigned_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_assignment public.team_course_assignments%ROWTYPE;
    v_enrollment_id UUID;
BEGIN
    -- Get assignment details
    SELECT * INTO v_assignment
    FROM public.team_course_assignments
    WHERE id = NEW.assignment_id;

    -- Only auto-enroll if enabled
    IF v_assignment.auto_enroll = true THEN
        -- Check if user is already enrolled
        SELECT id INTO v_enrollment_id
        FROM public.enrollments
        WHERE user_id = NEW.user_id
        AND course_id = v_assignment.course_id;

        -- If not enrolled, create enrollment
        IF v_enrollment_id IS NULL THEN
            INSERT INTO public.enrollments (user_id, course_id, created_at)
            VALUES (NEW.user_id, v_assignment.course_id, NOW())
            RETURNING id INTO v_enrollment_id;

            -- Update assignment user with enrollment_id
            NEW.enrollment_id = v_enrollment_id;
            NEW.enrolled_at = NOW();
        ELSE
            -- Link existing enrollment
            NEW.enrollment_id = v_enrollment_id;
            NEW.enrolled_at = (
                SELECT created_at FROM public.enrollments WHERE id = v_enrollment_id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_enroll_assigned_users ON public.team_assignment_users;
CREATE TRIGGER trigger_auto_enroll_assigned_users
    BEFORE INSERT ON public.team_assignment_users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_enroll_assigned_users();

-- ============================================================================
-- Function to sync progress from enrollments
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_assignment_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update assignment progress from enrollment
    UPDATE public.team_assignment_users
    SET
        progress_percentage = COALESCE(NEW.progress_percentage, 0),
        status = CASE
            WHEN NEW.completed_at IS NOT NULL THEN 'completed'
            WHEN NEW.progress_percentage > 0 THEN 'started'
            ELSE status
        END,
        started_at = CASE
            WHEN started_at IS NULL AND NEW.progress_percentage > 0 THEN NOW()
            ELSE started_at
        END,
        completed_at = NEW.completed_at,
        last_activity_at = NOW()
    WHERE enrollment_id = NEW.id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_assignment_progress ON public.enrollments;
CREATE TRIGGER trigger_sync_assignment_progress
    AFTER UPDATE ON public.enrollments
    FOR EACH ROW
    WHEN (
        OLD.progress_percentage IS DISTINCT FROM NEW.progress_percentage
        OR OLD.completed_at IS DISTINCT FROM NEW.completed_at
    )
    EXECUTE FUNCTION public.sync_assignment_progress();

-- ============================================================================
-- Function to update assignment statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_assignment_statistics(p_assignment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.team_course_assignments
    SET
        total_assigned = (
            SELECT COUNT(*)
            FROM public.team_assignment_users
            WHERE assignment_id = p_assignment_id
        ),
        total_started = (
            SELECT COUNT(*)
            FROM public.team_assignment_users
            WHERE assignment_id = p_assignment_id
            AND status IN ('started', 'completed')
        ),
        total_completed = (
            SELECT COUNT(*)
            FROM public.team_assignment_users
            WHERE assignment_id = p_assignment_id
            AND status = 'completed'
        ),
        total_overdue = (
            SELECT COUNT(*)
            FROM public.team_assignment_users
            WHERE assignment_id = p_assignment_id
            AND status = 'overdue'
        ),
        avg_completion_percentage = (
            SELECT COALESCE(AVG(progress_percentage), 0)
            FROM public.team_assignment_users
            WHERE assignment_id = p_assignment_id
        )
    WHERE id = p_assignment_id;
END;
$$;

-- Trigger to update statistics when assignment users change
CREATE OR REPLACE FUNCTION public.trigger_update_assignment_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.update_assignment_statistics(OLD.assignment_id);
    ELSE
        PERFORM public.update_assignment_statistics(NEW.assignment_id);
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_statistics_after_user_change ON public.team_assignment_users;
CREATE TRIGGER trigger_update_statistics_after_user_change
    AFTER INSERT OR UPDATE OR DELETE ON public.team_assignment_users
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_assignment_statistics();

-- ============================================================================
-- Function to mark overdue assignments
-- This should be run daily via a cron job (Supabase Edge Function)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_overdue_assignments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Mark assignments as overdue if past due date and not completed
    UPDATE public.team_assignment_users tau
    SET status = 'overdue'
    FROM public.team_course_assignments tca
    WHERE tau.assignment_id = tca.id
    AND tca.due_date IS NOT NULL
    AND tca.due_date < NOW()
    AND tau.status IN ('assigned', 'started')
    AND tau.completed_at IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    -- Update statistics for affected assignments
    PERFORM public.update_assignment_statistics(DISTINCT assignment_id)
    FROM public.team_assignment_users
    WHERE status = 'overdue'
    AND assignment_id IN (
        SELECT id FROM public.team_course_assignments
        WHERE due_date IS NOT NULL AND due_date < NOW()
    );

    RETURN updated_count;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.team_course_assignments IS 'Course assignments created by organization admins for team members';
COMMENT ON TABLE public.team_assignment_users IS 'Individual user assignments linking users to course assignments with progress tracking';

COMMENT ON COLUMN public.team_course_assignments.auto_enroll IS 'If true, users are automatically enrolled in the course when assigned';
COMMENT ON COLUMN public.team_course_assignments.notify_before_days IS 'Number of days before due date to send reminder notification';
COMMENT ON COLUMN public.team_assignment_users.enrollment_id IS 'Link to the actual course enrollment (if auto-enrolled or manually enrolled)';

COMMENT ON FUNCTION public.mark_overdue_assignments() IS 'Marks assignments as overdue if past due date. Run daily via cron job.';
COMMENT ON FUNCTION public.update_assignment_statistics(UUID) IS 'Recalculates and updates statistics for a specific assignment';
