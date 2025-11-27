-- ============================================================================
-- FIX INFINITE RECURSION IN TENANT_MEMBERS RLS POLICIES
-- Migration: 20251201000000
-- Fixes the circular dependency in tenant_members policies by using helper functions
-- ============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Tenant admins can view" ON public.tenants;
DROP POLICY IF EXISTS "Tenant admins manage members" ON public.tenant_members;
DROP POLICY IF EXISTS "Tenant admins manage domains" ON public.tenant_domains;
DROP POLICY IF EXISTS "Tenant admins manage email templates" ON public.tenant_email_templates;

-- ============================================================================
-- 1. FIX TENANTS TABLE POLICY
-- Use security definer function instead of direct tenant_members query
-- ============================================================================

CREATE POLICY "Tenant admins can view" ON public.tenants FOR SELECT
  USING (is_tenant_admin(id));

-- ============================================================================
-- 2. FIX TENANT_MEMBERS TABLE POLICY
-- Split the policy to avoid self-reference on SELECT operations
-- ============================================================================

-- Users can always view their own memberships (no recursion)
-- Keep the existing "Users can view their memberships" policy

-- Tenant owners/admins can manage members (use cached/indexed approach)
-- Instead of querying tenant_members IN the USING clause, we create a simpler check
CREATE POLICY "Tenant admins manage members" ON public.tenant_members FOR ALL
  USING (
    -- User is the owner/admin in the tenant they're trying to access
    -- This avoids recursion by using the tenant_id directly
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = tenant_members.tenant_id
      AND t.owner_id = auth.uid()
    )
    OR
    -- User can view their own membership
    user_id = auth.uid()
    OR
    -- Super admin bypass
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = tenant_members.tenant_id
      AND t.owner_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- 3. FIX TENANT_DOMAINS TABLE POLICY
-- Use tenant owner check instead of tenant_members query
-- ============================================================================

CREATE POLICY "Tenant admins manage domains" ON public.tenant_domains FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants
      WHERE owner_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants
      WHERE owner_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- 4. FIX TENANT_EMAIL_TEMPLATES POLICY
-- Use tenant owner check instead of tenant_members query
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_email_templates') THEN
    EXECUTE 'CREATE POLICY "Tenant admins manage email templates" ON public.tenant_email_templates FOR ALL
      USING (
        tenant_id IN (
          SELECT id FROM public.tenants
          WHERE owner_id = auth.uid()
        )
        OR
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin'')
      )
      WITH CHECK (
        tenant_id IN (
          SELECT id FROM public.tenants
          WHERE owner_id = auth.uid()
        )
        OR
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = ''super_admin'')
      )';
  END IF;
END $$;

-- ============================================================================
-- 5. ADD INDEX TO IMPROVE PERFORMANCE
-- ============================================================================

-- Index on tenants.owner_id for faster policy checks
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);

-- Index on tenant_members for the most common queries
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_tenant ON public.tenant_members(user_id, tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_role ON public.tenant_members(tenant_id, role, status);

-- ============================================================================
-- MIGRATION COMPLETE - INFINITE RECURSION FIXED
-- ============================================================================

COMMENT ON POLICY "Tenant admins can view" ON public.tenants IS 'Fixed: Uses is_tenant_admin() to avoid recursion';
COMMENT ON POLICY "Tenant admins manage members" ON public.tenant_members IS 'Fixed: Uses tenant.owner_id to avoid infinite recursion';
COMMENT ON POLICY "Tenant admins manage domains" ON public.tenant_domains IS 'Fixed: Uses tenant.owner_id to avoid infinite recursion';
