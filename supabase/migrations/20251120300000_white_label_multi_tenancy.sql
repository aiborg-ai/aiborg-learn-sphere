-- ============================================================================
-- WHITE-LABEL & MULTI-TENANCY SYSTEM
-- Migration: 20251120300000
-- Phase 3.3: Enterprise Features
-- ============================================================================

-- ============================================================================
-- 1. TENANTS TABLE (Core Organization/Tenant Configuration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Information
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-safe identifier (acmecorp, techschool)
    display_name TEXT NOT NULL,
    description TEXT,

    -- Tenant Type & Status
    tier TEXT CHECK (tier IN ('free', 'startup', 'growth', 'enterprise', 'white_label')) DEFAULT 'free',
    status TEXT CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')) DEFAULT 'trial',

    -- Domain Configuration
    custom_domain TEXT UNIQUE, -- learn.acmecorp.com
    domain_verified BOOLEAN DEFAULT false,
    domain_verification_token TEXT,
    subdomain TEXT UNIQUE, -- acmecorp.aiborg.com

    -- Branding Assets
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#D4AF37', -- Gold
    secondary_color TEXT DEFAULT '#000000',
    accent_color TEXT DEFAULT '#FFD700',
    background_color TEXT,
    text_color TEXT,

    -- Advanced Branding
    font_family TEXT DEFAULT 'Inter',
    theme_mode TEXT CHECK (theme_mode IN ('light', 'dark', 'system', 'custom')) DEFAULT 'system',
    custom_css TEXT, -- Advanced customization

    -- White-Label Options
    show_powered_by BOOLEAN DEFAULT true,
    custom_footer_text TEXT,
    custom_welcome_message TEXT,

    -- Resource Limits
    max_users INTEGER DEFAULT 10,
    max_courses INTEGER DEFAULT 5,
    max_storage_gb INTEGER DEFAULT 5,
    current_users INTEGER DEFAULT 0,
    current_courses INTEGER DEFAULT 0,
    current_storage_mb INTEGER DEFAULT 0,

    -- Subscription & Billing
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    billing_email TEXT,

    -- Contact Information
    owner_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    admin_email TEXT,
    admin_phone TEXT,
    support_email TEXT,

    -- Metadata
    settings JSONB DEFAULT '{}', -- Flexible settings storage
    features JSONB DEFAULT '{}', -- Feature flags per tenant
    integrations JSONB DEFAULT '{}', -- SSO, HR systems, etc.

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_tier ON public.tenants(tier);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_tenants_updated_at();

-- ============================================================================
-- 2. TENANT MEMBERS (User membership within tenants)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Role within tenant
    role TEXT CHECK (role IN ('owner', 'admin', 'manager', 'instructor', 'student', 'guest')) DEFAULT 'student',

    -- Additional metadata
    department TEXT,
    job_title TEXT,
    custom_permissions JSONB DEFAULT '{}',

    -- Status & Invitation
    status TEXT CHECK (status IN ('active', 'invited', 'suspended', 'removed')) DEFAULT 'active',
    invited_by UUID REFERENCES auth.users(id),
    invitation_token TEXT UNIQUE,
    invitation_expires_at TIMESTAMPTZ,

    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_role ON public.tenant_members(role);
CREATE INDEX IF NOT EXISTS idx_tenant_members_invitation_token ON public.tenant_members(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_members_status ON public.tenant_members(status);

-- ============================================================================
-- 3. TENANT DOMAINS (Custom domain management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Domain Configuration
    domain TEXT UNIQUE NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    verification_method TEXT CHECK (verification_method IN ('dns_txt', 'dns_cname', 'http_file')) DEFAULT 'dns_txt',

    -- SSL Configuration
    ssl_enabled BOOLEAN DEFAULT false,
    ssl_certificate TEXT,
    ssl_certificate_expires_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant_id ON public.tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON public.tenant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_verified ON public.tenant_domains(is_verified);

-- ============================================================================
-- 4. TENANT EMAIL TEMPLATES (Per-tenant email customization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Template Identification
    template_type TEXT NOT NULL CHECK (template_type IN (
        'welcome', 'password_reset', 'course_enrollment',
        'certificate', 'reminder', 'notification',
        'invitation', 'compliance_due', 'custom'
    )),
    name TEXT NOT NULL,

    -- Template Content
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,

    -- Variables support ({{user_name}}, {{course_title}}, etc.)
    available_variables TEXT[],

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- System default fallback

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, template_type, name)
);

CREATE INDEX IF NOT EXISTS idx_tenant_email_templates_tenant_id ON public.tenant_email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_email_templates_type ON public.tenant_email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_tenant_email_templates_active ON public.tenant_email_templates(is_active);

-- ============================================================================
-- 5. TENANT PRICING MODELS (Flexible pricing per tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_pricing_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Pricing Configuration
    model_type TEXT CHECK (model_type IN ('per_user', 'per_course', 'flat_rate', 'custom')) NOT NULL,
    currency TEXT DEFAULT 'GBP',

    -- Per-user pricing
    price_per_user_monthly DECIMAL(10,2),
    price_per_user_annual DECIMAL(10,2),

    -- Per-course pricing
    price_per_course DECIMAL(10,2),

    -- Flat rate
    monthly_fee DECIMAL(10,2),
    annual_fee DECIMAL(10,2),

    -- Custom pricing
    custom_pricing_rules JSONB,

    -- Discounts
    volume_discounts JSONB, -- [{min_users: 50, discount_percent: 10}, ...]

    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_until TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_pricing_tenant_id ON public.tenant_pricing_models(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pricing_active ON public.tenant_pricing_models(is_active);

-- ============================================================================
-- 6. CREATE DEFAULT PLATFORM TENANT
-- ============================================================================

-- Insert default "Platform" tenant for existing users (backward compatibility)
INSERT INTO public.tenants (
    id,
    slug,
    name,
    display_name,
    tier,
    status,
    subdomain,
    show_powered_by,
    max_users,
    max_courses,
    max_storage_gb
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'platform',
    'AiBorg Platform',
    'AiBorg Learn Sphere',
    'enterprise',
    'active',
    'www',
    true,
    999999,
    999999,
    999999
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tenant tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_pricing_models ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_domains TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_email_templates TO authenticated;
GRANT SELECT ON public.tenant_pricing_models TO authenticated;

-- Service role gets full access (for edge functions)
GRANT ALL ON public.tenants TO service_role;
GRANT ALL ON public.tenant_members TO service_role;
GRANT ALL ON public.tenant_domains TO service_role;
GRANT ALL ON public.tenant_email_templates TO service_role;
GRANT ALL ON public.tenant_pricing_models TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE public.tenants IS 'Core tenant/organization configuration for white-label multi-tenancy';
COMMENT ON TABLE public.tenant_members IS 'User membership within tenants with roles and permissions';
COMMENT ON TABLE public.tenant_domains IS 'Custom domain management and verification for tenants';
COMMENT ON TABLE public.tenant_email_templates IS 'Per-tenant email template customization';
COMMENT ON TABLE public.tenant_pricing_models IS 'Flexible pricing models for tenant subscriptions';
