-- Role-Based Access Control (RBAC) Setup
-- This migration creates the necessary tables and policies for RBAC

-- ============================================================================
-- USER ROLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'instructor', 'student', 'guest')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Ensure one active role per user
    UNIQUE(user_id, is_active) WHERE is_active = true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;

-- ============================================================================
-- ROLE PERMISSIONS TABLE (Optional - for dynamic permissions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    UNIQUE(role, resource, action)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    allowed BOOLEAN NOT NULL,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON security_audit_log(resource);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON security_audit_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view their own role"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON user_roles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can manage roles"
    ON user_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
            AND is_active = true
        )
    );

-- Role permissions policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view permissions"
    ON role_permissions FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Audit log policies
CREATE POLICY "Users can view their own audit logs"
    ON security_audit_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
    ON security_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
            AND is_active = true
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's active role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM user_roles
    WHERE user_id = p_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;

    RETURN COALESCE(v_role, 'guest');
END;
$$;

-- Function to check permission
CREATE OR REPLACE FUNCTION check_permission(
    p_user_id UUID,
    p_action TEXT,
    p_resource TEXT,
    p_resource_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
    v_allowed BOOLEAN := false;
BEGIN
    -- Get user role
    v_role := get_user_role(p_user_id);

    -- Super admin always has access
    IF v_role = 'super_admin' THEN
        v_allowed := true;
    ELSE
        -- Check role permissions
        SELECT EXISTS (
            SELECT 1
            FROM role_permissions
            WHERE role = v_role
            AND resource = p_resource
            AND action = p_action
        ) INTO v_allowed;
    END IF;

    -- Log the access attempt
    INSERT INTO security_audit_log (
        user_id,
        action,
        resource,
        resource_id,
        allowed
    ) VALUES (
        p_user_id,
        p_action,
        p_resource,
        p_resource_id,
        v_allowed
    );

    RETURN v_allowed;
END;
$$;

-- Function to grant role to user
CREATE OR REPLACE FUNCTION grant_user_role(
    p_user_id UUID,
    p_role TEXT,
    p_granted_by UUID,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role_id UUID;
BEGIN
    -- Check if granter has permission
    IF NOT check_permission(p_granted_by, 'manage', 'user_role') THEN
        RAISE EXCEPTION 'Permission denied: cannot grant roles';
    END IF;

    -- Deactivate existing roles
    UPDATE user_roles
    SET is_active = false,
        updated_at = now()
    WHERE user_id = p_user_id
    AND is_active = true;

    -- Create new role
    INSERT INTO user_roles (
        user_id,
        role,
        granted_by,
        expires_at
    ) VALUES (
        p_user_id,
        p_role,
        p_granted_by,
        p_expires_at
    ) RETURNING id INTO v_role_id;

    RETURN v_role_id;
END;
$$;

-- ============================================================================
-- DEFAULT ROLE PERMISSIONS
-- ============================================================================

-- Insert default permissions for each role
INSERT INTO role_permissions (role, resource, action) VALUES
    -- Student permissions
    ('student', 'course', 'read'),
    ('student', 'enrollment', 'create'),
    ('student', 'enrollment', 'read'),
    ('student', 'assignment', 'read'),
    ('student', 'assignment', 'update'),
    ('student', 'blog', 'read'),
    ('student', 'review', 'create'),
    ('student', 'review', 'read'),
    ('student', 'payment', 'create'),

    -- Instructor permissions
    ('instructor', 'course', 'create'),
    ('instructor', 'course', 'read'),
    ('instructor', 'course', 'update'),
    ('instructor', 'assignment', 'create'),
    ('instructor', 'assignment', 'read'),
    ('instructor', 'assignment', 'update'),
    ('instructor', 'assignment', 'delete'),
    ('instructor', 'enrollment', 'read'),
    ('instructor', 'blog', 'create'),
    ('instructor', 'blog', 'read'),
    ('instructor', 'blog', 'update'),
    ('instructor', 'review', 'read'),

    -- Admin permissions
    ('admin', 'course', 'create'),
    ('admin', 'course', 'read'),
    ('admin', 'course', 'update'),
    ('admin', 'course', 'publish'),
    ('admin', 'enrollment', 'read'),
    ('admin', 'enrollment', 'update'),
    ('admin', 'enrollment', 'approve'),
    ('admin', 'blog', 'create'),
    ('admin', 'blog', 'read'),
    ('admin', 'blog', 'update'),
    ('admin', 'blog', 'delete'),
    ('admin', 'blog', 'publish'),
    ('admin', 'user', 'read'),
    ('admin', 'user', 'update'),
    ('admin', 'admin_panel', 'read'),
    ('admin', 'analytics', 'read')
ON CONFLICT (role, resource, action) DO NOTHING;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INITIAL SETUP
-- ============================================================================

-- Grant default student role to all existing users
INSERT INTO user_roles (user_id, role)
SELECT id, 'student'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles WHERE is_active = true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE user_roles IS 'User role assignments for RBAC';
COMMENT ON TABLE role_permissions IS 'Permission matrix for roles';
COMMENT ON TABLE security_audit_log IS 'Security audit trail for permission checks';
COMMENT ON FUNCTION get_user_role IS 'Get the active role for a user';
COMMENT ON FUNCTION check_permission IS 'Check if a user has permission to perform an action';
COMMENT ON FUNCTION grant_user_role IS 'Grant a role to a user with proper authorization';