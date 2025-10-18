-- ============================================================================
-- TEAM INVITATIONS SYSTEM
-- ============================================================================
-- This migration creates tables for inviting and managing team members
-- within organizations.
--
-- Tables:
-- - team_invitations: Invitation records with tokens and status
-- - team_invitation_history: Audit trail for invitation actions
--
-- Features:
-- - Email-based invitations with secure tokens
-- - Role assignment during invitation
-- - Department assignment
-- - Expiration handling (7 days default)
-- - Complete audit trail
-- - RLS policies for data security
-- ============================================================================

-- ============================================================================
-- TABLE: team_invitations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Invitee information
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT CHECK (role IN ('member', 'manager', 'admin')) DEFAULT 'member',
    department TEXT,

    -- Invitation metadata
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
    custom_message TEXT,

    -- Status tracking
    status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_organization_id
    ON public.team_invitations(organization_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_email
    ON public.team_invitations(email);

CREATE INDEX IF NOT EXISTS idx_team_invitations_invite_token
    ON public.team_invitations(invite_token);

CREATE INDEX IF NOT EXISTS idx_team_invitations_status
    ON public.team_invitations(status);

CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at
    ON public.team_invitations(expires_at)
    WHERE status = 'pending';

-- ============================================================================
-- TABLE: team_invitation_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_invitation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.team_invitations(id) ON DELETE CASCADE,

    -- Action details
    action TEXT NOT NULL CHECK (action IN ('sent', 'resent', 'accepted', 'expired', 'cancelled')),
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,

    -- Metadata (for debugging/analytics)
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_invitation_history_invitation_id
    ON public.team_invitation_history(invitation_id);

CREATE INDEX IF NOT EXISTS idx_team_invitation_history_action
    ON public.team_invitation_history(action);

CREATE INDEX IF NOT EXISTS idx_team_invitation_history_created_at
    ON public.team_invitation_history(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitation_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: team_invitations
-- ============================================================================

-- Organization admins/managers can view invitations for their org
CREATE POLICY "Organization admins can view org invitations"
    ON public.team_invitations FOR SELECT
    USING (
        organization_id IN (
            SELECT om.organization_id
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager', 'owner')
        )
    );

-- Organization admins/managers can create invitations for their org
CREATE POLICY "Organization admins can create invitations"
    ON public.team_invitations FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT om.organization_id
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager', 'owner')
        )
        AND invited_by = auth.uid()
    );

-- Organization admins/managers can update invitations for their org
CREATE POLICY "Organization admins can update invitations"
    ON public.team_invitations FOR UPDATE
    USING (
        organization_id IN (
            SELECT om.organization_id
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager', 'owner')
        )
    );

-- Users can view invitations sent to their email (for acceptance)
CREATE POLICY "Users can view invitations to their email"
    ON public.team_invitations FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR email IN (SELECT email FROM auth.identities WHERE user_id = auth.uid())
    );

-- Super admins can view all invitations
CREATE POLICY "Super admins can view all invitations"
    ON public.team_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- ============================================================================
-- RLS POLICIES: team_invitation_history
-- ============================================================================

-- Organization admins can view history for their org's invitations
CREATE POLICY "Organization admins can view invitation history"
    ON public.team_invitation_history FOR SELECT
    USING (
        invitation_id IN (
            SELECT ti.id
            FROM public.team_invitations ti
            WHERE ti.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_members om
                WHERE om.user_id = auth.uid()
                AND om.role IN ('admin', 'manager', 'owner')
            )
        )
    );

-- System can insert history records
CREATE POLICY "System can insert history"
    ON public.team_invitation_history FOR INSERT
    WITH CHECK (true);

-- Super admins can view all history
CREATE POLICY "Super admins can view all history"
    ON public.team_invitation_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically log invitation actions
CREATE OR REPLACE FUNCTION public.log_invitation_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log based on the change
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.team_invitation_history (invitation_id, action, performed_by, notes)
        VALUES (NEW.id, 'sent', NEW.invited_by, 'Invitation created');
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO public.team_invitation_history (invitation_id, action, performed_by, notes)
            VALUES (
                NEW.id,
                NEW.status,
                auth.uid(),
                CASE NEW.status
                    WHEN 'accepted' THEN 'Invitation accepted'
                    WHEN 'expired' THEN 'Invitation expired'
                    WHEN 'cancelled' THEN 'Invitation cancelled'
                    ELSE 'Status changed to ' || NEW.status
                END
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for automatic logging
DROP TRIGGER IF EXISTS trigger_log_invitation_action ON public.team_invitations;
CREATE TRIGGER trigger_log_invitation_action
    AFTER INSERT OR UPDATE ON public.team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.log_invitation_action();

-- ============================================================================
-- Function to expire old invitations
-- This should be run daily via a cron job (Supabase Edge Function)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired invitations
    UPDATE public.team_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;

    RETURN expired_count;
END;
$$;

-- ============================================================================
-- Function to accept an invitation and add user to organization
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_team_invitation(
    p_invite_token TEXT,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation public.team_invitations%ROWTYPE;
    v_user_email TEXT;
    v_result JSONB;
BEGIN
    -- Get user's email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = p_user_id;

    IF v_user_email IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    -- Get invitation
    SELECT * INTO v_invitation
    FROM public.team_invitations
    WHERE invite_token = p_invite_token
    AND status = 'pending';

    IF v_invitation.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired invitation'
        );
    END IF;

    -- Check if invitation is expired
    IF v_invitation.expires_at < NOW() THEN
        UPDATE public.team_invitations
        SET status = 'expired'
        WHERE id = v_invitation.id;

        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invitation has expired'
        );
    END IF;

    -- Check if email matches
    IF v_invitation.email != v_user_email THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email does not match invitation'
        );
    END IF;

    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = v_invitation.organization_id
        AND user_id = p_user_id
    ) THEN
        -- Mark as accepted anyway
        UPDATE public.team_invitations
        SET status = 'accepted',
            accepted_at = NOW()
        WHERE id = v_invitation.id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'You are already a member of this organization'
        );
    END IF;

    -- Add user to organization
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        department
    ) VALUES (
        v_invitation.organization_id,
        p_user_id,
        v_invitation.role,
        v_invitation.department
    );

    -- Update invitation status
    UPDATE public.team_invitations
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
        'success', true,
        'organization_id', v_invitation.organization_id,
        'role', v_invitation.role,
        'department', v_invitation.department
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.team_invitations IS 'Invitation records for adding team members to organizations';
COMMENT ON TABLE public.team_invitation_history IS 'Audit trail for invitation actions';

COMMENT ON COLUMN public.team_invitations.invite_token IS 'Secure token for invitation acceptance (used in invitation link)';
COMMENT ON COLUMN public.team_invitations.expires_at IS 'Expiration timestamp (default 7 days from creation)';
COMMENT ON COLUMN public.team_invitations.custom_message IS 'Optional custom message from inviter to invitee';

COMMENT ON FUNCTION public.expire_old_invitations() IS 'Marks pending invitations as expired if past expiration date. Run daily via cron.';
COMMENT ON FUNCTION public.accept_team_invitation(TEXT, UUID) IS 'Accepts an invitation and adds user to organization. Returns success status.';
