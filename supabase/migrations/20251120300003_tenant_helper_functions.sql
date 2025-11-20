-- ============================================================================
-- TENANT HELPER FUNCTIONS
-- Migration: 20251120300003
-- Phase 3.3: Utility Functions for Tenant Operations
-- ============================================================================

-- ============================================================================
-- 1. GET CURRENT USER'S TENANT ID
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the tenant_id of the currently authenticated user
    SELECT tenant_id INTO v_tenant_id
    FROM public.tenant_members
    WHERE user_id = auth.uid()
    AND status = 'active'
    ORDER BY joined_at DESC -- Most recent membership if multiple
    LIMIT 1;

    -- Fallback to profile tenant_id if not in tenant_members
    IF v_tenant_id IS NULL THEN
        SELECT tenant_id INTO v_tenant_id
        FROM public.profiles
        WHERE user_id = auth.uid();
    END IF;

    RETURN v_tenant_id;
END;
$$;

COMMENT ON FUNCTION public.get_user_tenant_id() IS 'Returns the tenant_id of the currently authenticated user';

-- ============================================================================
-- 2. CHECK IF USER IS TENANT ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_tenant_id UUID := COALESCE(p_tenant_id, get_user_tenant_id());
    v_is_admin BOOLEAN := FALSE;
BEGIN
    -- Check if user is owner, admin, or manager in the tenant
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_members
        WHERE user_id = auth.uid()
        AND tenant_id = v_tenant_id
        AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
    ) INTO v_is_admin;

    -- Also check if user is super admin
    IF NOT v_is_admin THEN
        SELECT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        ) INTO v_is_admin;
    END IF;

    RETURN v_is_admin;
END;
$$;

COMMENT ON FUNCTION public.is_tenant_admin(UUID) IS 'Checks if the current user is an admin in the specified tenant (or their current tenant if not specified)';

-- ============================================================================
-- 3. GET TENANT BRANDING CONFIGURATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_tenant_branding(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_branding JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'name', display_name,
        'slug', slug,
        'logo_url', logo_url,
        'favicon_url', favicon_url,
        'primary_color', primary_color,
        'secondary_color', secondary_color,
        'accent_color', accent_color,
        'background_color', background_color,
        'text_color', text_color,
        'font_family', font_family,
        'theme_mode', theme_mode,
        'custom_css', custom_css,
        'show_powered_by', show_powered_by,
        'custom_footer_text', custom_footer_text,
        'custom_welcome_message', custom_welcome_message
    ) INTO v_branding
    FROM public.tenants
    WHERE id = p_tenant_id
    AND status = 'active';

    RETURN v_branding;
END;
$$;

COMMENT ON FUNCTION public.get_tenant_branding(UUID) IS 'Returns the complete branding configuration for a tenant as JSON';

-- ============================================================================
-- 4. GET TENANT BY DOMAIN OR SUBDOMAIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(p_domain TEXT)
RETURNS TABLE (
    id UUID,
    slug TEXT,
    display_name TEXT,
    tier TEXT,
    status TEXT,
    branding JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.slug,
        t.display_name,
        t.tier,
        t.status,
        jsonb_build_object(
            'logo_url', t.logo_url,
            'favicon_url', t.favicon_url,
            'primary_color', t.primary_color,
            'secondary_color', t.secondary_color,
            'accent_color', t.accent_color,
            'theme_mode', t.theme_mode,
            'custom_css', t.custom_css,
            'show_powered_by', t.show_powered_by,
            'custom_footer_text', t.custom_footer_text
        ) AS branding
    FROM public.tenants t
    WHERE (t.custom_domain = p_domain OR t.subdomain = p_domain)
    AND t.status = 'active'
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_tenant_by_domain(TEXT) IS 'Resolves a tenant by custom domain or subdomain';

-- ============================================================================
-- 5. VERIFY TENANT DOMAIN OWNERSHIP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_tenant_domain(
    p_domain TEXT,
    p_verification_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_verified BOOLEAN := FALSE;
    v_tenant_id UUID;
BEGIN
    -- Update domain verification status
    UPDATE public.tenant_domains
    SET is_verified = TRUE,
        verified_at = NOW()
    WHERE domain = p_domain
    AND verification_token = p_verification_token
    AND is_verified = FALSE
    RETURNING tenant_id INTO v_tenant_id;

    v_verified := FOUND;

    -- Also update the tenant's custom_domain if this is the primary domain
    IF v_verified AND v_tenant_id IS NOT NULL THEN
        UPDATE public.tenants
        SET custom_domain = p_domain,
            domain_verified = TRUE
        WHERE id = v_tenant_id
        AND (custom_domain IS NULL OR custom_domain = p_domain);
    END IF;

    RETURN v_verified;
END;
$$;

COMMENT ON FUNCTION public.verify_tenant_domain(TEXT, TEXT) IS 'Verifies domain ownership using a verification token';

-- ============================================================================
-- 6. GET TENANT USAGE STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_tenant_usage_stats(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_stats JSONB;
    v_user_count INTEGER;
    v_course_count INTEGER;
    v_enrollment_count INTEGER;
    v_storage_mb INTEGER;
BEGIN
    -- Count active users in tenant
    SELECT COUNT(DISTINCT user_id) INTO v_user_count
    FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
    AND status = 'active';

    -- Count courses in tenant
    SELECT COUNT(*) INTO v_course_count
    FROM public.courses
    WHERE tenant_id = p_tenant_id;

    -- Count enrollments in tenant
    SELECT COUNT(*) INTO v_enrollment_count
    FROM public.enrollments
    WHERE tenant_id = p_tenant_id;

    -- Calculate storage usage (approximation based on content)
    -- This is a simplified calculation - in production, track actual storage
    SELECT COALESCE(SUM(
        CASE
            WHEN content_type LIKE 'video%' THEN 100 -- Assume 100MB per video
            WHEN content_type LIKE 'image%' THEN 5   -- Assume 5MB per image
            ELSE 1 -- 1MB for text content
        END
    ), 0) INTO v_storage_mb
    FROM public.shared_content
    WHERE tenant_id = p_tenant_id;

    v_stats := jsonb_build_object(
        'user_count', v_user_count,
        'course_count', v_course_count,
        'enrollment_count', v_enrollment_count,
        'storage_mb', v_storage_mb
    );

    -- Update tenant's current usage
    UPDATE public.tenants
    SET current_users = v_user_count,
        current_courses = v_course_count,
        current_storage_mb = v_storage_mb,
        last_active_at = NOW()
    WHERE id = p_tenant_id;

    RETURN v_stats;
END;
$$;

COMMENT ON FUNCTION public.get_tenant_usage_stats(UUID) IS 'Calculates and updates current usage statistics for a tenant';

-- ============================================================================
-- 7. CHECK TENANT LIMITS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_tenant_limit(
    p_tenant_id UUID,
    p_limit_type TEXT, -- 'users', 'courses', 'storage'
    p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_current INTEGER;
    v_max INTEGER;
    v_within_limit BOOLEAN := FALSE;
BEGIN
    CASE p_limit_type
        WHEN 'users' THEN
            SELECT current_users, max_users INTO v_current, v_max
            FROM public.tenants WHERE id = p_tenant_id;
        WHEN 'courses' THEN
            SELECT current_courses, max_courses INTO v_current, v_max
            FROM public.tenants WHERE id = p_tenant_id;
        WHEN 'storage' THEN
            SELECT current_storage_mb / 1024, max_storage_gb INTO v_current, v_max
            FROM public.tenants WHERE id = p_tenant_id;
        ELSE
            RETURN FALSE;
    END CASE;

    v_within_limit := (v_current + p_increment) <= v_max;

    RETURN v_within_limit;
END;
$$;

COMMENT ON FUNCTION public.check_tenant_limit(UUID, TEXT, INTEGER) IS 'Checks if a tenant is within their resource limits before adding new resources';

-- ============================================================================
-- 8. CREATE TENANT INVITATION TOKEN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_tenant_invitation(
    p_tenant_id UUID,
    p_invited_by UUID,
    p_role TEXT DEFAULT 'student',
    p_email TEXT DEFAULT NULL,
    p_expires_in_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    invitation_token TEXT,
    invitation_url TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
    v_expires_at TIMESTAMPTZ;
    v_subdomain TEXT;
    v_url TEXT;
BEGIN
    -- Generate unique invitation token
    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;

    -- Get tenant subdomain
    SELECT subdomain INTO v_subdomain
    FROM public.tenants
    WHERE id = p_tenant_id;

    -- Build invitation URL
    v_url := format('https://%s.aiborg.com/invite/%s', v_subdomain, v_token);

    -- Insert placeholder tenant_member record (pending invitation)
    -- Note: user_id will be filled when invitation is accepted
    INSERT INTO public.tenant_members (
        tenant_id,
        user_id,
        role,
        status,
        invited_by,
        invitation_token,
        invitation_expires_at
    ) VALUES (
        p_tenant_id,
        '00000000-0000-0000-0000-000000000000', -- Placeholder until accepted
        p_role,
        'invited',
        p_invited_by,
        v_token,
        v_expires_at
    );

    RETURN QUERY SELECT v_token, v_url, v_expires_at;
END;
$$;

COMMENT ON FUNCTION public.create_tenant_invitation(UUID, UUID, TEXT, TEXT, INTEGER) IS 'Creates an invitation token for joining a tenant';

-- ============================================================================
-- 9. GRANT EXECUTE PERMISSIONS
-- ============================================================================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_branding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_by_domain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_tenant_domain(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_usage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_tenant_limit(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_invitation(UUID, UUID, TEXT, TEXT, INTEGER) TO authenticated;

-- Allow service role full access (for edge functions)
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tenant_branding(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tenant_by_domain(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_tenant_domain(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tenant_usage_stats(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_tenant_limit(UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_tenant_invitation(UUID, UUID, TEXT, TEXT, INTEGER) TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE - HELPER FUNCTIONS READY
-- ============================================================================

-- Test queries (run manually to verify):
-- SELECT get_user_tenant_id();
-- SELECT is_tenant_admin();
-- SELECT * FROM get_tenant_by_domain('www.aiborg.com');
-- SELECT get_tenant_branding('00000000-0000-0000-0000-000000000000');
