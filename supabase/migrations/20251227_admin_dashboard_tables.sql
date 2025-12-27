-- Admin Dashboard Enhancement Tables
-- Created: 2025-12-27
-- Purpose: Support new admin dashboard features (System Health, Background Jobs, Compliance)

-- =============================================================================
-- BACKGROUND JOBS TABLE
-- Tracks background processing tasks (email, sync, reports, etc.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'pending_retry', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for background jobs
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_type ON background_jobs(type);
CREATE INDEX IF NOT EXISTS idx_background_jobs_created_at ON background_jobs(created_at DESC);

-- RLS for background jobs (admin only)
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all background jobs"
  ON background_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert background jobs"
  ON background_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update background jobs"
  ON background_jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- SYSTEM HEALTH METRICS TABLE
-- Stores periodic health check results for monitoring
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  response_time_ms INTEGER,
  value DECIMAL(10,2),
  details JSONB,
  error_message TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for health metrics
CREATE INDEX IF NOT EXISTS idx_health_metrics_name ON system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_health_metrics_recorded ON system_health_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_status ON system_health_metrics(status);

-- RLS for health metrics (admin only)
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view health metrics"
  ON system_health_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert health metrics"
  ON system_health_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================================================
-- CERTIFICATIONS TABLE
-- Tracks compliance certifications (SOC2, ISO, GDPR, etc.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_type VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'certified', 'expired')),
  total_controls INTEGER DEFAULT 0,
  completed_controls INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  certified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CERTIFICATION CONTROLS TABLE
-- Individual control items within each certification
-- =============================================================================

CREATE TABLE IF NOT EXISTS certification_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id UUID REFERENCES certifications(id) ON DELETE CASCADE,
  control_id VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'passed', 'failed', 'not_applicable')),
  evidence_notes TEXT,
  evidence_links JSONB DEFAULT '[]',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(certification_id, control_id)
);

-- Indexes for certification controls
CREATE INDEX IF NOT EXISTS idx_cert_controls_cert_id ON certification_controls(certification_id);
CREATE INDEX IF NOT EXISTS idx_cert_controls_status ON certification_controls(status);
CREATE INDEX IF NOT EXISTS idx_cert_controls_category ON certification_controls(category);

-- RLS for certifications (admin only)
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage certifications"
  ON certifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage certification controls"
  ON certification_controls FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- ADMIN SETTINGS TABLE
-- System-wide configuration settings
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type VARCHAR(50) DEFAULT 'string',
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin settings
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);

-- RLS for admin settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view non-sensitive settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (
    (NOT is_sensitive) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage all settings"
  ON admin_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- =============================================================================
-- ACTIVITY EVENTS TABLE
-- Stores user activity for the live activity feed
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  location VARCHAR(255),
  device VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for activity events
CREATE INDEX IF NOT EXISTS idx_activity_events_type ON activity_events(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_events_user ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created ON activity_events(created_at DESC);

-- RLS for activity events
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity events"
  ON activity_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert activity events"
  ON activity_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================================================
-- INSERT DEFAULT CERTIFICATIONS
-- =============================================================================

INSERT INTO certifications (certification_type, name, description, status, total_controls)
VALUES
  ('soc2', 'SOC 2 Type II', 'Service Organization Control 2 - Security, Availability, Processing Integrity', 'not_started', 64),
  ('iso27001', 'ISO 27001', 'Information Security Management System', 'not_started', 114),
  ('iso42001', 'ISO 42001', 'AI Management System - Responsible AI Development', 'not_started', 42),
  ('gdpr', 'GDPR Compliance', 'General Data Protection Regulation - EU Privacy', 'not_started', 28)
ON CONFLICT (certification_type) DO NOTHING;

-- =============================================================================
-- INSERT DEFAULT ADMIN SETTINGS
-- =============================================================================

INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description)
VALUES
  ('site_name', '"AiBorg Learn Sphere"', 'string', 'general', 'The name of the platform'),
  ('site_description', '"AI-Powered Learning Management System"', 'string', 'general', 'Platform description'),
  ('support_email', '"support@aiborg.ai"', 'string', 'general', 'Support contact email'),
  ('timezone', '"Europe/London"', 'string', 'general', 'Default timezone'),
  ('language', '"en"', 'string', 'general', 'Default language'),
  ('maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode'),
  ('registration_enabled', 'true', 'boolean', 'general', 'Allow new user registrations'),
  ('session_timeout', '24', 'number', 'security', 'Session timeout in hours'),
  ('password_min_length', '8', 'number', 'security', 'Minimum password length'),
  ('max_login_attempts', '5', 'number', 'security', 'Maximum failed login attempts before lockout'),
  ('audit_log_retention', '90', 'number', 'security', 'Days to retain audit logs'),
  ('enable_blog', 'true', 'boolean', 'features', 'Enable blog feature'),
  ('enable_forum', 'true', 'boolean', 'features', 'Enable forum feature'),
  ('enable_chatbot', 'true', 'boolean', 'features', 'Enable AI chatbot'),
  ('enable_gamification', 'true', 'boolean', 'features', 'Enable gamification features'),
  ('enable_family_pass', 'true', 'boolean', 'features', 'Enable family membership'),
  ('enable_assessments', 'true', 'boolean', 'features', 'Enable AI assessments'),
  ('enable_lingo', 'true', 'boolean', 'features', 'Enable AIBORGLingo'),
  ('enable_workshops', 'true', 'boolean', 'features', 'Enable workshops')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update certification completion percentage
CREATE OR REPLACE FUNCTION update_certification_completion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE certifications
  SET
    completed_controls = (
      SELECT COUNT(*)
      FROM certification_controls
      WHERE certification_id = NEW.certification_id
      AND status IN ('passed', 'not_applicable')
    ),
    completion_percentage = (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE status IN ('passed', 'not_applicable'))::DECIMAL /
         NULLIF(COUNT(*), 0)) * 100, 2
      )
      FROM certification_controls
      WHERE certification_id = NEW.certification_id
    ),
    updated_at = NOW()
  WHERE id = NEW.certification_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update certification completion on control status change
DROP TRIGGER IF EXISTS trigger_update_cert_completion ON certification_controls;
CREATE TRIGGER trigger_update_cert_completion
  AFTER INSERT OR UPDATE OF status ON certification_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_certification_completion();

-- Function to log activity events
CREATE OR REPLACE FUNCTION log_activity_event(
  p_event_type VARCHAR(50),
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_name VARCHAR(255);
  v_user_email VARCHAR(255);
  v_event_id UUID;
BEGIN
  -- Get current user info
  SELECT id, full_name, email INTO v_user_id, v_user_name, v_user_email
  FROM profiles
  WHERE id = auth.uid();

  -- Insert event
  INSERT INTO activity_events (event_type, user_id, user_name, user_email, description, metadata)
  VALUES (p_event_type, v_user_id, v_user_name, v_user_email, p_description, p_metadata)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_activity_event TO authenticated;
