-- Phase 3.2: Advanced Integrations
-- SSO, HR System Sync, Enterprise Tools (Slack, Teams, Webhooks)

-- =============================================================================
-- SSO CONFIGURATIONS
-- =============================================================================

-- SSO provider configurations per organization
CREATE TABLE IF NOT EXISTS sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Provider type
  provider_type TEXT NOT NULL CHECK (provider_type IN (
    'saml', 'oidc', 'azure_ad', 'okta', 'google_workspace', 'onelogin'
  )),

  -- Display name
  display_name TEXT NOT NULL,

  -- SAML Configuration
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  saml_slo_url TEXT,
  saml_certificate TEXT, -- X.509 certificate (PEM format)
  saml_signature_algorithm TEXT DEFAULT 'sha256',
  saml_name_id_format TEXT DEFAULT 'emailAddress',

  -- OIDC Configuration
  oidc_issuer TEXT,
  oidc_client_id TEXT,
  oidc_client_secret_encrypted TEXT, -- Encrypted with organization key
  oidc_authorization_endpoint TEXT,
  oidc_token_endpoint TEXT,
  oidc_userinfo_endpoint TEXT,
  oidc_scopes TEXT[] DEFAULT ARRAY['openid', 'profile', 'email'],

  -- Attribute Mapping
  attribute_mapping JSONB DEFAULT '{
    "email": "email",
    "firstName": "given_name",
    "lastName": "family_name",
    "department": "department",
    "role": "role"
  }'::jsonb,

  -- Settings
  allow_idp_initiated BOOLEAN DEFAULT false,
  auto_create_users BOOLEAN DEFAULT true,
  default_role TEXT DEFAULT 'student',
  enforce_sso BOOLEAN DEFAULT false, -- Require SSO for all users
  allowed_domains TEXT[] DEFAULT '{}', -- Restrict to specific email domains

  -- Status
  is_active BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(organization_id, provider_type)
);

-- SSO sessions for tracking
CREATE TABLE IF NOT EXISTS sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sso_config_id UUID NOT NULL REFERENCES sso_configurations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session data
  session_index TEXT, -- SAML SessionIndex
  name_id TEXT, -- User identifier from IdP

  -- Timestamps
  authenticated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  logged_out_at TIMESTAMPTZ,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- HR SYSTEM INTEGRATIONS
-- =============================================================================

-- HR system configurations
CREATE TABLE IF NOT EXISTS hr_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Provider
  provider TEXT NOT NULL CHECK (provider IN (
    'workday', 'bamboohr', 'adp', 'namely', 'gusto', 'rippling', 'custom_api'
  )),

  display_name TEXT NOT NULL,

  -- API Configuration
  api_url TEXT NOT NULL,
  api_version TEXT,

  -- Authentication
  auth_type TEXT NOT NULL CHECK (auth_type IN ('api_key', 'oauth2', 'basic')),
  credentials_encrypted TEXT, -- Encrypted JSON with auth details

  -- Sync Settings
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN (
    'realtime', 'hourly', 'daily', 'weekly'
  )),
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,

  -- Field Mapping
  field_mapping JSONB DEFAULT '{
    "employee_id": "employeeId",
    "email": "workEmail",
    "first_name": "firstName",
    "last_name": "lastName",
    "department": "department",
    "job_title": "jobTitle",
    "manager_id": "managerId",
    "start_date": "startDate",
    "termination_date": "terminationDate",
    "status": "employmentStatus"
  }'::jsonb,

  -- Auto-enrollment rules
  auto_enroll_enabled BOOLEAN DEFAULT false,
  enrollment_rules JSONB DEFAULT '[]'::jsonb,
  /* Example enrollment rules:
  [
    {
      "condition": {"department": "Engineering"},
      "courses": ["course-id-1", "course-id-2"],
      "learning_paths": ["path-id-1"]
    }
  ]
  */

  -- Auto-termination
  auto_unenroll_on_termination BOOLEAN DEFAULT true,
  termination_grace_days INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  connection_status TEXT DEFAULT 'pending' CHECK (connection_status IN (
    'pending', 'connected', 'error', 'disconnected'
  )),
  last_error TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(organization_id, provider)
);

-- HR sync logs
CREATE TABLE IF NOT EXISTS hr_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_integration_id UUID NOT NULL REFERENCES hr_integrations(id) ON DELETE CASCADE,

  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Results
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
    'running', 'completed', 'failed', 'partial'
  )),

  -- Counts
  users_created INTEGER DEFAULT 0,
  users_updated INTEGER DEFAULT 0,
  users_deactivated INTEGER DEFAULT 0,
  enrollments_created INTEGER DEFAULT 0,
  enrollments_removed INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,

  -- Details
  error_details JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- WEBHOOK SYSTEM
-- =============================================================================

-- Webhook endpoints
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Endpoint details
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,

  -- Authentication
  auth_type TEXT DEFAULT 'none' CHECK (auth_type IN (
    'none', 'basic', 'bearer', 'signature', 'custom_header'
  )),
  auth_credentials_encrypted TEXT,
  signing_secret TEXT, -- For signature verification

  -- Event subscriptions
  events TEXT[] NOT NULL DEFAULT '{}',
  /* Available events:
    - user.created, user.updated, user.deleted
    - enrollment.created, enrollment.completed, enrollment.expired
    - course.published, course.updated
    - assessment.completed, assessment.passed, assessment.failed
    - certificate.issued
    - compliance.completed, compliance.overdue, compliance.expired
    - payment.completed, payment.failed
  */

  -- Settings
  is_active BOOLEAN DEFAULT true,
  content_type TEXT DEFAULT 'application/json',
  timeout_seconds INTEGER DEFAULT 30,

  -- Retry settings
  retry_enabled BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,

  -- Status
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Either organization or user must be set
  CONSTRAINT webhook_owner CHECK (
    (organization_id IS NOT NULL) OR (user_id IS NOT NULL)
  )
);

-- Webhook event deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL,
  event_id UUID NOT NULL, -- Unique identifier for the event
  payload JSONB NOT NULL,

  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'success', 'failed', 'retrying'
  )),

  -- HTTP details
  request_headers JSONB,
  response_status INTEGER,
  response_headers JSONB,
  response_body TEXT,
  response_time_ms INTEGER,

  -- Retry tracking
  attempt_number INTEGER DEFAULT 1,
  next_retry_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,

  -- Error details
  error_message TEXT
);

-- =============================================================================
-- NOTIFICATION CHANNELS (Slack, Teams, Email)
-- =============================================================================

-- Notification channel configurations
CREATE TABLE IF NOT EXISTS notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Channel type
  channel_type TEXT NOT NULL CHECK (channel_type IN (
    'slack', 'microsoft_teams', 'email', 'discord', 'custom_webhook'
  )),

  name TEXT NOT NULL,
  description TEXT,

  -- Slack configuration
  slack_webhook_url TEXT,
  slack_channel TEXT, -- e.g., #training-notifications
  slack_bot_token_encrypted TEXT,

  -- Microsoft Teams configuration
  teams_webhook_url TEXT,
  teams_channel_id TEXT,

  -- Email configuration
  email_recipients TEXT[] DEFAULT '{}',
  email_cc TEXT[] DEFAULT '{}',

  -- Event subscriptions (which events trigger this channel)
  subscribed_events TEXT[] DEFAULT '{}',

  -- Message templates
  templates JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "enrollment.completed": {
      "title": "Course Completed",
      "body": "{{user_name}} completed {{course_title}}"
    }
  }
  */

  -- Settings
  is_active BOOLEAN DEFAULT true,

  -- Rate limiting
  rate_limit_per_hour INTEGER DEFAULT 100,
  last_sent_at TIMESTAMPTZ,

  -- Status
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Notification delivery logs
CREATE TABLE IF NOT EXISTS notification_channel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL,
  event_data JSONB,

  -- Delivery status
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),

  -- Response
  response_status INTEGER,
  response_body TEXT,

  -- Error
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INTEGRATION AUDIT LOG
-- =============================================================================

-- Track all integration configuration changes
CREATE TABLE IF NOT EXISTS integration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- What was changed
  integration_type TEXT NOT NULL CHECK (integration_type IN (
    'sso', 'hr', 'webhook', 'notification_channel', 'api_key'
  )),
  integration_id UUID NOT NULL,

  -- Action
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'deleted', 'enabled', 'disabled',
    'connected', 'disconnected', 'synced', 'tested'
  )),

  -- Changes
  old_values JSONB,
  new_values JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- SSO indexes
CREATE INDEX IF NOT EXISTS idx_sso_configurations_org ON sso_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_sso_configurations_active ON sso_configurations(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sso_sessions_user ON sso_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_config ON sso_sessions(sso_config_id);

-- HR integration indexes
CREATE INDEX IF NOT EXISTS idx_hr_integrations_org ON hr_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_hr_sync_logs_integration ON hr_sync_logs(hr_integration_id);
CREATE INDEX IF NOT EXISTS idx_hr_sync_logs_created ON hr_sync_logs(created_at DESC);

-- Webhook indexes
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_org ON webhook_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user ON webhook_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON webhook_endpoints(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(webhook_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status, next_retry_at) WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- Notification channel indexes
CREATE INDEX IF NOT EXISTS idx_notification_channels_org ON notification_channels(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_channels_active ON notification_channels(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_channel_logs_channel ON notification_channel_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_notification_channel_logs_created ON notification_channel_logs(created_at DESC);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_integration_audit_org ON integration_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_integration_audit_user ON integration_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_audit_type ON integration_audit_log(integration_type, integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_audit_created ON integration_audit_log(created_at DESC);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to get active SSO configuration for an organization
CREATE OR REPLACE FUNCTION get_active_sso_config(p_organization_id UUID)
RETURNS sso_configurations AS $$
  SELECT * FROM sso_configurations
  WHERE organization_id = p_organization_id
    AND is_active = true
    AND is_verified = true
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function to check if user should use SSO
CREATE OR REPLACE FUNCTION should_use_sso(p_email TEXT)
RETURNS TABLE (
  use_sso BOOLEAN,
  sso_config_id UUID,
  sso_url TEXT
) AS $$
DECLARE
  v_domain TEXT;
  v_config sso_configurations%ROWTYPE;
BEGIN
  -- Extract domain from email
  v_domain := split_part(p_email, '@', 2);

  -- Find matching SSO configuration
  SELECT sc.* INTO v_config
  FROM sso_configurations sc
  JOIN organizations o ON o.id = sc.organization_id
  WHERE sc.is_active = true
    AND sc.is_verified = true
    AND sc.enforce_sso = true
    AND (
      cardinality(sc.allowed_domains) = 0
      OR v_domain = ANY(sc.allowed_domains)
    )
  LIMIT 1;

  IF v_config.id IS NOT NULL THEN
    RETURN QUERY SELECT
      true,
      v_config.id,
      COALESCE(v_config.saml_sso_url, v_config.oidc_authorization_endpoint);
  ELSE
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to trigger webhook event
CREATE OR REPLACE FUNCTION trigger_webhook_event(
  p_event_type TEXT,
  p_payload JSONB,
  p_organization_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_endpoint webhook_endpoints%ROWTYPE;
  v_count INTEGER := 0;
BEGIN
  -- Find all matching webhook endpoints
  FOR v_endpoint IN
    SELECT * FROM webhook_endpoints
    WHERE is_active = true
      AND p_event_type = ANY(events)
      AND (
        organization_id = p_organization_id
        OR user_id = p_user_id
        OR (organization_id IS NULL AND user_id IS NULL)
      )
      AND consecutive_failures < 10 -- Skip endpoints with too many failures
  LOOP
    -- Create delivery record
    INSERT INTO webhook_deliveries (
      webhook_endpoint_id,
      event_type,
      event_id,
      payload,
      status
    ) VALUES (
      v_endpoint.id,
      p_event_type,
      gen_random_uuid(),
      p_payload,
      'pending'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to process HR sync
CREATE OR REPLACE FUNCTION start_hr_sync(
  p_integration_id UUID,
  p_sync_type TEXT DEFAULT 'incremental'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Create sync log entry
  INSERT INTO hr_sync_logs (
    hr_integration_id,
    sync_type,
    status
  ) VALUES (
    p_integration_id,
    p_sync_type,
    'running'
  )
  RETURNING id INTO v_log_id;

  -- Update last sync timestamp
  UPDATE hr_integrations
  SET last_sync_at = NOW()
  WHERE id = p_integration_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete HR sync
CREATE OR REPLACE FUNCTION complete_hr_sync(
  p_log_id UUID,
  p_status TEXT,
  p_created INTEGER DEFAULT 0,
  p_updated INTEGER DEFAULT 0,
  p_deactivated INTEGER DEFAULT 0,
  p_enrollments_created INTEGER DEFAULT 0,
  p_enrollments_removed INTEGER DEFAULT 0,
  p_errors JSONB DEFAULT '[]'::jsonb
)
RETURNS VOID AS $$
BEGIN
  UPDATE hr_sync_logs
  SET
    status = p_status,
    completed_at = NOW(),
    users_created = p_created,
    users_updated = p_updated,
    users_deactivated = p_deactivated,
    enrollments_created = p_enrollments_created,
    enrollments_removed = p_enrollments_removed,
    errors_count = jsonb_array_length(p_errors),
    error_details = p_errors
  WHERE id = p_log_id;

  -- Update integration status
  UPDATE hr_integrations
  SET
    connection_status = CASE WHEN p_status = 'completed' THEN 'connected' ELSE 'error' END,
    last_error = CASE WHEN p_status = 'failed' THEN p_errors->0->>'message' ELSE NULL END,
    next_sync_at = CASE
      WHEN sync_frequency = 'hourly' THEN NOW() + INTERVAL '1 hour'
      WHEN sync_frequency = 'daily' THEN NOW() + INTERVAL '1 day'
      WHEN sync_frequency = 'weekly' THEN NOW() + INTERVAL '1 week'
      ELSE NULL
    END
  WHERE id = (SELECT hr_integration_id FROM hr_sync_logs WHERE id = p_log_id);
END;
$$ LANGUAGE plpgsql;

-- Function to send notification to channel
CREATE OR REPLACE FUNCTION queue_channel_notification(
  p_channel_id UUID,
  p_event_type TEXT,
  p_event_data JSONB
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO notification_channel_logs (
    channel_id,
    event_type,
    event_data,
    status
  ) VALUES (
    p_channel_id,
    p_event_type,
    p_event_data,
    'pending'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log integration changes
CREATE OR REPLACE FUNCTION log_integration_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO integration_audit_log (
    organization_id,
    user_id,
    integration_type,
    integration_id,
    action,
    old_values,
    new_values
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(),
    TG_ARGV[0],
    COALESCE(NEW.id, OLD.id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
      ELSE 'updated'
    END,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Audit triggers for all integration tables
CREATE TRIGGER audit_sso_configurations
  AFTER INSERT OR UPDATE OR DELETE ON sso_configurations
  FOR EACH ROW EXECUTE FUNCTION log_integration_change('sso');

CREATE TRIGGER audit_hr_integrations
  AFTER INSERT OR UPDATE OR DELETE ON hr_integrations
  FOR EACH ROW EXECUTE FUNCTION log_integration_change('hr');

CREATE TRIGGER audit_webhook_endpoints
  AFTER INSERT OR UPDATE OR DELETE ON webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION log_integration_change('webhook');

CREATE TRIGGER audit_notification_channels
  AFTER INSERT OR UPDATE OR DELETE ON notification_channels
  FOR EACH ROW EXECUTE FUNCTION log_integration_change('notification_channel');

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_audit_log ENABLE ROW LEVEL SECURITY;

-- SSO configurations - org admins only
CREATE POLICY sso_configurations_org_admin ON sso_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = sso_configurations.organization_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- SSO sessions - users can see their own
CREATE POLICY sso_sessions_own ON sso_sessions
  FOR SELECT USING (user_id = auth.uid());

-- HR integrations - org admins only
CREATE POLICY hr_integrations_org_admin ON hr_integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = hr_integrations.organization_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- HR sync logs - org admins only
CREATE POLICY hr_sync_logs_org_admin ON hr_sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hr_integrations hi
      JOIN organization_members om ON om.organization_id = hi.organization_id
      WHERE hi.id = hr_sync_logs.hr_integration_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
    )
  );

-- Webhook endpoints - owners can manage
CREATE POLICY webhook_endpoints_owner ON webhook_endpoints
  FOR ALL USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = webhook_endpoints.organization_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- Webhook deliveries - endpoint owners can view
CREATE POLICY webhook_deliveries_owner ON webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM webhook_endpoints we
      WHERE we.id = webhook_deliveries.webhook_endpoint_id
        AND (
          we.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = we.organization_id
              AND user_id = auth.uid()
              AND role IN ('admin', 'owner')
          )
        )
    )
  );

-- Notification channels - org admins only
CREATE POLICY notification_channels_org_admin ON notification_channels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = notification_channels.organization_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- Notification channel logs - org admins only
CREATE POLICY notification_channel_logs_org_admin ON notification_channel_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notification_channels nc
      JOIN organization_members om ON om.organization_id = nc.organization_id
      WHERE nc.id = notification_channel_logs.channel_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
    )
  );

-- Audit log - org admins can view their org's logs
CREATE POLICY integration_audit_org_admin ON integration_audit_log
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = integration_audit_log.organization_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE sso_configurations IS 'SSO provider configurations (SAML 2.0, OIDC) per organization';
COMMENT ON TABLE sso_sessions IS 'Active SSO sessions for single logout support';
COMMENT ON TABLE hr_integrations IS 'HR system integrations (Workday, BambooHR, etc.)';
COMMENT ON TABLE hr_sync_logs IS 'HR synchronization history and results';
COMMENT ON TABLE webhook_endpoints IS 'Custom webhook endpoint subscriptions';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts and results';
COMMENT ON TABLE notification_channels IS 'Notification channel configs (Slack, Teams, etc.)';
COMMENT ON TABLE notification_channel_logs IS 'Notification delivery history';
COMMENT ON TABLE integration_audit_log IS 'Audit trail for all integration configuration changes';
