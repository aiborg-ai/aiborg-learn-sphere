-- Security Hardening Migration
-- Adds RLS policies, audit logging, and security constraints

-- ============================================================================
-- AUDIT LOGGING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- RLS for audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- ENHANCED RLS POLICIES FOR DASHBOARD VIEWS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only update own dashboards" ON public.custom_dashboard_views;
DROP POLICY IF EXISTS "Cannot delete published templates" ON public.custom_dashboard_views;

-- Ensure users can only update their own dashboards
CREATE POLICY "Users can only update own dashboards"
ON public.custom_dashboard_views
FOR UPDATE
USING (auth.uid() = user_id);

-- Prevent deletion of published templates
CREATE POLICY "Cannot delete published templates"
ON public.custom_dashboard_views
FOR DELETE
USING (
  auth.uid() = user_id
  AND id NOT IN (SELECT dashboard_view_id FROM public.shared_dashboard_templates WHERE dashboard_view_id IS NOT NULL)
);

-- ============================================================================
-- RATE LIMITING FOR SHARE LINKS
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Rate limit share link creation" ON public.dashboard_share_links;

-- Limit share link creation rate (10 per hour per user)
CREATE POLICY "Rate limit share link creation"
ON public.dashboard_share_links
FOR INSERT
WITH CHECK (
  (SELECT COUNT(*)
   FROM public.dashboard_share_links sl
   JOIN public.custom_dashboard_views cdv ON sl.dashboard_view_id = cdv.id
   WHERE cdv.user_id = auth.uid()
   AND sl.created_at > NOW() - INTERVAL '1 hour'
  ) < 10
);

-- ============================================================================
-- TEMPLATE RATINGS SECURITY
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can only modify own ratings" ON public.dashboard_template_ratings;

-- Ensure users can only modify their own ratings
CREATE POLICY "Users can only modify own ratings"
ON public.dashboard_template_ratings
FOR ALL
USING (user_id = auth.uid());

-- Add constraint to ensure ratings are between 1 and 5
ALTER TABLE public.dashboard_template_ratings
DROP CONSTRAINT IF EXISTS rating_range_check;

ALTER TABLE public.dashboard_template_ratings
ADD CONSTRAINT rating_range_check CHECK (rating >= 1 AND rating <= 5);

-- ============================================================================
-- DASHBOARD VIEW LIMITS
-- ============================================================================

-- Add trigger to limit dashboard views per user (max 50)
CREATE OR REPLACE FUNCTION check_dashboard_view_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.custom_dashboard_views WHERE user_id = NEW.user_id) >= 50 THEN
    RAISE EXCEPTION 'Maximum dashboard views limit (50) reached for this user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dashboard_view_limit_trigger ON public.custom_dashboard_views;

CREATE TRIGGER dashboard_view_limit_trigger
BEFORE INSERT ON public.custom_dashboard_views
FOR EACH ROW
EXECUTE FUNCTION check_dashboard_view_limit();

-- ============================================================================
-- SHARE LINK SECURITY
-- ============================================================================

-- Add trigger to auto-cleanup expired share links
CREATE OR REPLACE FUNCTION cleanup_expired_share_links()
RETURNS void AS $$
BEGIN
  DELETE FROM public.dashboard_share_links
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function to validate share link usage
CREATE OR REPLACE FUNCTION validate_share_link_usage(link_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  link_record RECORD;
BEGIN
  SELECT * INTO link_record
  FROM public.dashboard_share_links
  WHERE token = link_token;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check expiration
  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;

  -- Check max uses
  IF link_record.max_uses IS NOT NULL AND link_record.use_count >= link_record.max_uses THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TEMPLATE PUBLISHING LIMITS
-- ============================================================================

-- Add trigger to limit templates per user (max 20 published templates)
CREATE OR REPLACE FUNCTION check_template_publish_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*)
      FROM public.shared_dashboard_templates st
      JOIN public.custom_dashboard_views cdv ON st.dashboard_view_id = cdv.id
      WHERE cdv.user_id = auth.uid()
  ) >= 20 THEN
    RAISE EXCEPTION 'Maximum published templates limit (20) reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_publish_limit_trigger ON public.shared_dashboard_templates;

CREATE TRIGGER template_publish_limit_trigger
BEFORE INSERT ON public.shared_dashboard_templates
FOR EACH ROW
EXECUTE FUNCTION check_template_publish_limit();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.dashboard_share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON public.dashboard_share_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.shared_dashboard_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.shared_dashboard_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_view_count ON public.shared_dashboard_templates(view_count DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Audit trail for sensitive operations';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (e.g., DASHBOARD_CREATED)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource affected';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN public.audit_logs.details IS 'Additional details about the action';

COMMENT ON FUNCTION check_dashboard_view_limit() IS 'Enforces maximum of 50 dashboard views per user';
COMMENT ON FUNCTION check_template_publish_limit() IS 'Enforces maximum of 20 published templates per user';
COMMENT ON FUNCTION validate_share_link_usage(TEXT) IS 'Validates if a share link token is still valid';
COMMENT ON FUNCTION cleanup_expired_share_links() IS 'Removes expired share links from the database';
