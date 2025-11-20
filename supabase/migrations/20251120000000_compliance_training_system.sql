-- Compliance Training System Migration
-- Role-based training assignment, certification tracking, auto-reminders, audit reporting

-- =====================================================
-- COMPLIANCE REQUIREMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('training', 'certification', 'policy_acknowledgment', 'assessment')),

  -- Content linkage
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assessment_id UUID,

  -- Frequency & renewal
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'annual', 'bi_annual', 'quarterly', 'custom')),
  renewal_period_days INTEGER DEFAULT 365,
  grace_period_days INTEGER DEFAULT 14, -- Days after expiry before marked critical

  -- Targeting
  target_roles TEXT[] DEFAULT '{}', -- admin, instructor, learner, etc.
  target_departments TEXT[] DEFAULT '{}',
  is_mandatory BOOLEAN DEFAULT TRUE,

  -- Regulatory info
  regulatory_body TEXT, -- OSHA, GDPR, SOC2, etc.
  legal_reference TEXT,
  compliance_code TEXT, -- Internal reference code

  -- Passing criteria
  passing_score INTEGER DEFAULT 80,
  max_attempts INTEGER DEFAULT 3,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE DEFAULT CURRENT_DATE,
  sunset_date DATE, -- When requirement becomes obsolete

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- USER COMPLIANCE STATUS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_compliance_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'completed', 'expired', 'overdue', 'exempted'
  )),

  -- Dates
  assigned_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  started_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ, -- When current completion expires

  -- Results
  score INTEGER,
  attempts INTEGER DEFAULT 0,
  certificate_id UUID,

  -- Renewal tracking
  is_renewal BOOLEAN DEFAULT FALSE,
  previous_completion_id UUID REFERENCES user_compliance_status(id),

  -- Exemption
  exemption_reason TEXT,
  exempted_by UUID REFERENCES auth.users(id),
  exemption_date TIMESTAMPTZ,

  -- Reminders
  reminder_7_day_sent BOOLEAN DEFAULT FALSE,
  reminder_14_day_sent BOOLEAN DEFAULT FALSE,
  reminder_30_day_sent BOOLEAN DEFAULT FALSE,
  escalation_sent BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_requirement UNIQUE (user_id, requirement_id, is_renewal, assigned_date)
);

-- =====================================================
-- COMPLIANCE AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID REFERENCES auth.users(id),
  requirement_id UUID REFERENCES compliance_requirements(id),
  status_id UUID REFERENCES user_compliance_status(id),

  -- Action details
  action TEXT NOT NULL CHECK (action IN (
    'requirement_created', 'requirement_updated', 'requirement_archived',
    'assigned', 'started', 'completed', 'failed', 'expired', 'renewed',
    'exempted', 'exemption_revoked', 'escalated', 'reminder_sent'
  )),

  -- State change
  status_before TEXT,
  status_after TEXT,

  -- Context
  reason TEXT,
  actioned_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTENT VERSION CONTROL
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,

  -- Version info
  version_number INTEGER NOT NULL,
  version_label TEXT, -- e.g., "2024 Q1 Update"

  -- Content snapshot
  content_hash TEXT, -- SHA256 of content for change detection
  change_summary TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('minor', 'major', 'critical')),

  -- Impact
  requires_retraining BOOLEAN DEFAULT FALSE, -- If true, invalidate previous completions
  affected_user_count INTEGER DEFAULT 0,

  -- Who and when
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  effective_date DATE DEFAULT CURRENT_DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_requirement_version UNIQUE (requirement_id, version_number)
);

-- =====================================================
-- ESCALATION RULES
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE CASCADE,

  -- Escalation trigger
  days_overdue INTEGER NOT NULL,
  escalation_level INTEGER NOT NULL DEFAULT 1, -- 1 = manager, 2 = HR, 3 = executive

  -- Action
  escalate_to_role TEXT, -- manager, hr_admin, department_head, etc.
  notification_template TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_escalation_rule UNIQUE (requirement_id, days_overdue, escalation_level)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_compliance_req_active ON compliance_requirements(is_active);
CREATE INDEX idx_compliance_req_roles ON compliance_requirements USING GIN(target_roles);
CREATE INDEX idx_compliance_req_departments ON compliance_requirements USING GIN(target_departments);

CREATE INDEX idx_user_compliance_user ON user_compliance_status(user_id);
CREATE INDEX idx_user_compliance_requirement ON user_compliance_status(requirement_id);
CREATE INDEX idx_user_compliance_status ON user_compliance_status(status);
CREATE INDEX idx_user_compliance_due ON user_compliance_status(due_date);
CREATE INDEX idx_user_compliance_expiry ON user_compliance_status(expiry_date);

CREATE INDEX idx_compliance_audit_user ON compliance_audit_log(user_id);
CREATE INDEX idx_compliance_audit_requirement ON compliance_audit_log(requirement_id);
CREATE INDEX idx_compliance_audit_action ON compliance_audit_log(action);
CREATE INDEX idx_compliance_audit_date ON compliance_audit_log(created_at DESC);

CREATE INDEX idx_content_versions_requirement ON compliance_content_versions(requirement_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_compliance_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_escalation_rules ENABLE ROW LEVEL SECURITY;

-- Requirements: Admins can manage, all users can view active
CREATE POLICY compliance_req_admin_policy ON compliance_requirements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr_admin'))
  );

CREATE POLICY compliance_req_view_policy ON compliance_requirements
  FOR SELECT USING (is_active = TRUE);

-- User status: Users can view their own, admins/managers can view all
CREATE POLICY user_compliance_own_policy ON user_compliance_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_compliance_admin_policy ON user_compliance_status
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr_admin', 'manager'))
  );

-- Audit log: Admins only
CREATE POLICY compliance_audit_admin_policy ON compliance_audit_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr_admin'))
  );

-- Content versions: Same as requirements
CREATE POLICY content_versions_admin_policy ON compliance_content_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr_admin'))
  );

CREATE POLICY content_versions_view_policy ON compliance_content_versions
  FOR SELECT USING (TRUE);

-- Escalation rules: Admins only
CREATE POLICY escalation_rules_admin_policy ON compliance_escalation_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr_admin'))
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Assign compliance requirement to user
CREATE OR REPLACE FUNCTION assign_compliance_requirement(
  p_user_id UUID,
  p_requirement_id UUID,
  p_due_date TIMESTAMPTZ DEFAULT NULL,
  p_assigned_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_status_id UUID;
  v_requirement RECORD;
  v_calculated_due TIMESTAMPTZ;
BEGIN
  -- Get requirement details
  SELECT * INTO v_requirement
  FROM compliance_requirements
  WHERE id = p_requirement_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requirement not found';
  END IF;

  -- Calculate due date if not provided
  v_calculated_due := COALESCE(p_due_date, NOW() + (v_requirement.renewal_period_days || ' days')::INTERVAL);

  -- Insert status record
  INSERT INTO user_compliance_status (
    user_id,
    requirement_id,
    status,
    due_date
  ) VALUES (
    p_user_id,
    p_requirement_id,
    'not_started',
    v_calculated_due
  ) RETURNING id INTO v_status_id;

  -- Log the assignment
  INSERT INTO compliance_audit_log (
    user_id,
    requirement_id,
    status_id,
    action,
    status_after,
    actioned_by,
    metadata
  ) VALUES (
    p_user_id,
    p_requirement_id,
    v_status_id,
    'assigned',
    'not_started',
    p_assigned_by,
    jsonb_build_object('due_date', v_calculated_due)
  );

  RETURN v_status_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-assign requirements based on role
CREATE OR REPLACE FUNCTION auto_assign_by_role(
  p_user_id UUID,
  p_role TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_req RECORD;
BEGIN
  -- Find all active requirements targeting this role
  FOR v_req IN
    SELECT id
    FROM compliance_requirements
    WHERE is_active = TRUE
      AND p_role = ANY(target_roles)
      AND NOT EXISTS (
        SELECT 1 FROM user_compliance_status
        WHERE user_id = p_user_id
          AND requirement_id = compliance_requirements.id
          AND status NOT IN ('expired')
      )
  LOOP
    PERFORM assign_compliance_requirement(p_user_id, v_req.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process expiries and generate renewals
CREATE OR REPLACE FUNCTION process_compliance_expiries()
RETURNS TABLE (
  expired_count INTEGER,
  renewals_created INTEGER,
  escalations_sent INTEGER
) AS $$
DECLARE
  v_expired INTEGER := 0;
  v_renewals INTEGER := 0;
  v_escalations INTEGER := 0;
  v_status RECORD;
BEGIN
  -- Mark expired statuses
  FOR v_status IN
    SELECT ucs.*, cr.renewal_period_days, cr.is_active
    FROM user_compliance_status ucs
    JOIN compliance_requirements cr ON ucs.requirement_id = cr.id
    WHERE ucs.status = 'completed'
      AND ucs.expiry_date < NOW()
      AND cr.is_active = TRUE
  LOOP
    -- Update to expired
    UPDATE user_compliance_status
    SET status = 'expired', updated_at = NOW()
    WHERE id = v_status.id;

    v_expired := v_expired + 1;

    -- Create renewal assignment
    INSERT INTO user_compliance_status (
      user_id,
      requirement_id,
      status,
      due_date,
      is_renewal,
      previous_completion_id
    ) VALUES (
      v_status.user_id,
      v_status.requirement_id,
      'not_started',
      NOW() + (v_status.renewal_period_days || ' days')::INTERVAL,
      TRUE,
      v_status.id
    );

    v_renewals := v_renewals + 1;

    -- Log the renewal
    INSERT INTO compliance_audit_log (
      user_id, requirement_id, action, status_before, status_after
    ) VALUES (
      v_status.user_id, v_status.requirement_id, 'renewed', 'expired', 'not_started'
    );
  END LOOP;

  -- Mark overdue statuses
  UPDATE user_compliance_status
  SET status = 'overdue', updated_at = NOW()
  WHERE status IN ('not_started', 'in_progress')
    AND due_date < NOW();

  RETURN QUERY SELECT v_expired, v_renewals, v_escalations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get users due for reminders
CREATE OR REPLACE FUNCTION get_compliance_reminders(p_days_ahead INTEGER)
RETURNS TABLE (
  status_id UUID,
  user_id UUID,
  requirement_id UUID,
  requirement_title TEXT,
  due_date TIMESTAMPTZ,
  days_until_due INTEGER,
  reminder_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ucs.id,
    ucs.user_id,
    ucs.requirement_id,
    cr.title,
    ucs.due_date,
    EXTRACT(DAY FROM ucs.due_date - NOW())::INTEGER,
    CASE
      WHEN EXTRACT(DAY FROM ucs.due_date - NOW()) <= 7 AND NOT ucs.reminder_7_day_sent THEN '7_day'
      WHEN EXTRACT(DAY FROM ucs.due_date - NOW()) <= 14 AND NOT ucs.reminder_14_day_sent THEN '14_day'
      WHEN EXTRACT(DAY FROM ucs.due_date - NOW()) <= 30 AND NOT ucs.reminder_30_day_sent THEN '30_day'
    END
  FROM user_compliance_status ucs
  JOIN compliance_requirements cr ON ucs.requirement_id = cr.id
  WHERE ucs.status IN ('not_started', 'in_progress')
    AND ucs.due_date > NOW()
    AND ucs.due_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
    AND (
      (EXTRACT(DAY FROM ucs.due_date - NOW()) <= 7 AND NOT ucs.reminder_7_day_sent) OR
      (EXTRACT(DAY FROM ucs.due_date - NOW()) <= 14 AND NOT ucs.reminder_14_day_sent) OR
      (EXTRACT(DAY FROM ucs.due_date - NOW()) <= 30 AND NOT ucs.reminder_30_day_sent)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get compliance dashboard summary
CREATE OR REPLACE FUNCTION get_compliance_summary(p_organization_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_requirements INTEGER,
  total_users INTEGER,
  compliant_count INTEGER,
  non_compliant_count INTEGER,
  overdue_count INTEGER,
  expiring_soon_count INTEGER,
  compliance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(DISTINCT ucs.requirement_id) as total_req,
      COUNT(DISTINCT ucs.user_id) as total_users,
      COUNT(CASE WHEN ucs.status = 'completed' THEN 1 END) as compliant,
      COUNT(CASE WHEN ucs.status IN ('not_started', 'in_progress') THEN 1 END) as non_compliant,
      COUNT(CASE WHEN ucs.status = 'overdue' THEN 1 END) as overdue,
      COUNT(CASE WHEN ucs.status = 'completed' AND ucs.expiry_date <= NOW() + '30 days'::INTERVAL THEN 1 END) as expiring
    FROM user_compliance_status ucs
    JOIN compliance_requirements cr ON ucs.requirement_id = cr.id
    WHERE cr.is_active = TRUE
  )
  SELECT
    total_req::INTEGER,
    total_users::INTEGER,
    compliant::INTEGER,
    non_compliant::INTEGER,
    overdue::INTEGER,
    expiring::INTEGER,
    CASE WHEN (compliant + non_compliant + overdue) > 0
      THEN ROUND((compliant::NUMERIC / (compliant + non_compliant + overdue) * 100), 1)
      ELSE 0
    END
  FROM stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's compliance status
CREATE OR REPLACE FUNCTION get_user_compliance(p_user_id UUID)
RETURNS TABLE (
  status_id UUID,
  requirement_id UUID,
  title TEXT,
  category TEXT,
  status TEXT,
  due_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  score INTEGER,
  is_overdue BOOLEAN,
  is_expiring_soon BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ucs.id,
    cr.id,
    cr.title,
    cr.category,
    ucs.status,
    ucs.due_date,
    ucs.expiry_date,
    ucs.score,
    ucs.status = 'overdue' OR (ucs.status IN ('not_started', 'in_progress') AND ucs.due_date < NOW()),
    ucs.status = 'completed' AND ucs.expiry_date <= NOW() + '30 days'::INTERVAL
  FROM user_compliance_status ucs
  JOIN compliance_requirements cr ON ucs.requirement_id = cr.id
  WHERE ucs.user_id = p_user_id
    AND cr.is_active = TRUE
  ORDER BY
    CASE ucs.status
      WHEN 'overdue' THEN 1
      WHEN 'not_started' THEN 2
      WHEN 'in_progress' THEN 3
      WHEN 'completed' THEN 4
      WHEN 'exempted' THEN 5
      ELSE 6
    END,
    ucs.due_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate compliance report
CREATE OR REPLACE FUNCTION generate_compliance_report(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
  requirement_title TEXT,
  total_assigned INTEGER,
  completed INTEGER,
  in_progress INTEGER,
  overdue INTEGER,
  completion_rate NUMERIC,
  avg_score NUMERIC,
  avg_completion_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.title,
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN ucs.status = 'completed' THEN 1 END)::INTEGER,
    COUNT(CASE WHEN ucs.status = 'in_progress' THEN 1 END)::INTEGER,
    COUNT(CASE WHEN ucs.status = 'overdue' THEN 1 END)::INTEGER,
    ROUND(COUNT(CASE WHEN ucs.status = 'completed' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1),
    ROUND(AVG(ucs.score), 1),
    ROUND(AVG(EXTRACT(DAY FROM ucs.completed_date - ucs.assigned_date)), 1)
  FROM user_compliance_status ucs
  JOIN compliance_requirements cr ON ucs.requirement_id = cr.id
  WHERE (p_start_date IS NULL OR ucs.assigned_date >= p_start_date)
    AND (p_end_date IS NULL OR ucs.assigned_date <= p_end_date)
  GROUP BY cr.id, cr.title
  ORDER BY cr.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_compliance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_compliance_req_timestamp
  BEFORE UPDATE ON compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION update_compliance_timestamp();

CREATE TRIGGER update_user_compliance_timestamp
  BEFORE UPDATE ON user_compliance_status
  FOR EACH ROW EXECUTE FUNCTION update_compliance_timestamp();

-- Log status changes
CREATE OR REPLACE FUNCTION log_compliance_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO compliance_audit_log (
      user_id,
      requirement_id,
      status_id,
      action,
      status_before,
      status_after
    ) VALUES (
      NEW.user_id,
      NEW.requirement_id,
      NEW.id,
      CASE NEW.status
        WHEN 'in_progress' THEN 'started'
        WHEN 'completed' THEN 'completed'
        WHEN 'expired' THEN 'expired'
        WHEN 'overdue' THEN 'escalated'
        WHEN 'exempted' THEN 'exempted'
        ELSE 'assigned'
      END,
      OLD.status,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_compliance_changes
  AFTER UPDATE ON user_compliance_status
  FOR EACH ROW EXECUTE FUNCTION log_compliance_status_change();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample compliance requirements
INSERT INTO compliance_requirements (
  title, description, category, frequency, renewal_period_days, target_roles, regulatory_body, passing_score
) VALUES
  (
    'Information Security Awareness',
    'Annual training on cybersecurity best practices, phishing awareness, and data protection',
    'training',
    'annual',
    365,
    ARRAY['admin', 'instructor', 'learner'],
    'ISO 27001',
    80
  ),
  (
    'GDPR Data Privacy Training',
    'Understanding GDPR requirements, data subject rights, and privacy principles',
    'training',
    'annual',
    365,
    ARRAY['admin', 'instructor'],
    'GDPR',
    85
  ),
  (
    'Workplace Harassment Prevention',
    'Recognizing and preventing workplace harassment and discrimination',
    'training',
    'bi_annual',
    730,
    ARRAY['admin', 'instructor', 'learner'],
    'EEOC',
    80
  ),
  (
    'Code of Conduct Acknowledgment',
    'Annual acknowledgment of company code of conduct and ethics policy',
    'policy_acknowledgment',
    'annual',
    365,
    ARRAY['admin', 'instructor', 'learner'],
    NULL,
    100
  ),
  (
    'Fire Safety & Emergency Procedures',
    'Emergency evacuation procedures, fire safety, and first aid basics',
    'training',
    'annual',
    365,
    ARRAY['admin', 'instructor', 'learner'],
    'OSHA',
    75
  );

COMMENT ON TABLE compliance_requirements IS 'Compliance training requirements with frequency and targeting';
COMMENT ON TABLE user_compliance_status IS 'Individual user compliance status tracking';
COMMENT ON TABLE compliance_audit_log IS 'Audit trail for all compliance actions';
COMMENT ON TABLE compliance_content_versions IS 'Version control for compliance content changes';
COMMENT ON TABLE compliance_escalation_rules IS 'Rules for escalating overdue compliance';
