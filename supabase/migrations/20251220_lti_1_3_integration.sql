-- LTI 1.3 Integration Tables
-- Enables Learning Tools Interoperability with Canvas, Moodle, Blackboard, etc.

-- ============================================================================
-- LTI Platforms (LMS configurations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lti_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Platform identification
  name VARCHAR(200) NOT NULL,
  platform_type VARCHAR(50) DEFAULT 'generic', -- canvas, moodle, blackboard, d2l, schoology, generic

  -- OIDC Configuration (from LMS)
  issuer TEXT NOT NULL,
  client_id TEXT NOT NULL,
  deployment_id TEXT,

  -- Platform URLs
  auth_login_url TEXT NOT NULL,
  auth_token_url TEXT NOT NULL,
  jwks_url TEXT NOT NULL,

  -- Platform public key (alternative to JWKS)
  platform_public_key TEXT,

  -- Tool keys (our keys for signing)
  tool_private_key TEXT NOT NULL,
  tool_public_key TEXT NOT NULL,
  tool_kid VARCHAR(100), -- Key ID for JWKS

  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),

  -- Constraints
  UNIQUE(issuer, client_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_lti_platforms_issuer ON lti_platforms(issuer);
CREATE INDEX IF NOT EXISTS idx_lti_platforms_tenant ON lti_platforms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lti_platforms_active ON lti_platforms(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- LTI Resource Links (course/content mappings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lti_resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES lti_platforms(id) ON DELETE CASCADE,

  -- LTI Resource Link identifiers
  resource_link_id TEXT NOT NULL,
  context_id TEXT, -- LMS course/context ID
  context_title TEXT,
  context_label TEXT,

  -- Mapping to our content
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id INTEGER, -- Optional: specific lesson mapping

  -- Deep linking data
  content_items JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(platform_id, resource_link_id)
);

CREATE INDEX IF NOT EXISTS idx_lti_resource_links_platform ON lti_resource_links(platform_id);
CREATE INDEX IF NOT EXISTS idx_lti_resource_links_course ON lti_resource_links(course_id);
CREATE INDEX IF NOT EXISTS idx_lti_resource_links_context ON lti_resource_links(context_id);

-- ============================================================================
-- LTI Launches (launch history and session tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lti_launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES lti_platforms(id) ON DELETE CASCADE,
  resource_link_id UUID REFERENCES lti_resource_links(id) ON DELETE SET NULL,

  -- User mapping
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lti_user_id TEXT NOT NULL, -- User ID from LMS

  -- Launch details
  launch_type VARCHAR(50) NOT NULL, -- resource_link, deep_linking, submission_review
  message_type VARCHAR(100), -- LtiResourceLinkRequest, LtiDeepLinkingRequest, etc.

  -- LTI Claims (stored for reference)
  claims JSONB NOT NULL DEFAULT '{}',

  -- Context information
  context_id TEXT,
  context_title TEXT,

  -- Roles from LMS
  roles TEXT[] DEFAULT '{}',

  -- Session tracking
  session_id TEXT,
  expires_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_lti_launches_platform ON lti_launches(platform_id);
CREATE INDEX IF NOT EXISTS idx_lti_launches_user ON lti_launches(user_id);
CREATE INDEX IF NOT EXISTS idx_lti_launches_lti_user ON lti_launches(lti_user_id);
CREATE INDEX IF NOT EXISTS idx_lti_launches_created ON lti_launches(created_at DESC);

-- ============================================================================
-- LTI User Mappings (link LMS users to our users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lti_user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES lti_platforms(id) ON DELETE CASCADE,

  -- LMS user information
  lti_user_id TEXT NOT NULL,
  lti_email TEXT,
  lti_name TEXT,
  lti_given_name TEXT,
  lti_family_name TEXT,
  lti_picture TEXT,

  -- Our user mapping
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(platform_id, lti_user_id)
);

CREATE INDEX IF NOT EXISTS idx_lti_user_mappings_platform ON lti_user_mappings(platform_id);
CREATE INDEX IF NOT EXISTS idx_lti_user_mappings_user ON lti_user_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_lti_user_mappings_lti_user ON lti_user_mappings(platform_id, lti_user_id);

-- ============================================================================
-- LTI Grade Passback (Assignment and Grade Services)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lti_grade_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES lti_platforms(id) ON DELETE CASCADE,
  resource_link_id UUID REFERENCES lti_resource_links(id) ON DELETE SET NULL,

  -- User
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lti_user_id TEXT NOT NULL,

  -- Grade data
  score_given DECIMAL(10, 4),
  score_maximum DECIMAL(10, 4) DEFAULT 100,
  activity_progress VARCHAR(50), -- Initialized, Started, InProgress, Submitted, Completed
  grading_progress VARCHAR(50), -- FullyGraded, Pending, PendingManual, Failed, NotReady

  -- AGS endpoint info
  lineitem_url TEXT,

  -- Submission tracking
  submitted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ,
  sync_status VARCHAR(50) DEFAULT 'pending', -- pending, synced, failed
  sync_error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lti_grade_submissions_platform ON lti_grade_submissions(platform_id);
CREATE INDEX IF NOT EXISTS idx_lti_grade_submissions_user ON lti_grade_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_lti_grade_submissions_sync ON lti_grade_submissions(sync_status) WHERE sync_status = 'pending';

-- ============================================================================
-- LTI Nonce Storage (replay attack prevention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lti_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT NOT NULL,
  platform_id UUID REFERENCES lti_platforms(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  UNIQUE(nonce, platform_id)
);

CREATE INDEX IF NOT EXISTS idx_lti_nonces_expires ON lti_nonces(expires_at);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to clean up expired nonces
CREATE OR REPLACE FUNCTION cleanup_expired_lti_nonces()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM lti_nonces WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate nonce (checks if unused and not expired)
CREATE OR REPLACE FUNCTION validate_lti_nonce(
  p_nonce TEXT,
  p_platform_id UUID,
  p_expiry_minutes INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  nonce_exists BOOLEAN;
BEGIN
  -- Check if nonce already exists (replay attack)
  SELECT EXISTS(
    SELECT 1 FROM lti_nonces
    WHERE nonce = p_nonce
    AND platform_id = p_platform_id
  ) INTO nonce_exists;

  IF nonce_exists THEN
    RETURN FALSE;
  END IF;

  -- Store nonce to prevent replay
  INSERT INTO lti_nonces (nonce, platform_id, expires_at)
  VALUES (p_nonce, p_platform_id, NOW() + (p_expiry_minutes || ' minutes')::INTERVAL);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find or create user from LTI claims
CREATE OR REPLACE FUNCTION find_or_create_lti_user(
  p_platform_id UUID,
  p_lti_user_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_given_name TEXT DEFAULT NULL,
  p_family_name TEXT DEFAULT NULL,
  p_picture TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_existing_mapping UUID;
BEGIN
  -- Check for existing mapping
  SELECT user_id INTO v_user_id
  FROM lti_user_mappings
  WHERE platform_id = p_platform_id AND lti_user_id = p_lti_user_id;

  IF v_user_id IS NOT NULL THEN
    -- Update last login
    UPDATE lti_user_mappings
    SET last_login_at = NOW(),
        lti_email = COALESCE(p_email, lti_email),
        lti_name = COALESCE(p_name, lti_name)
    WHERE platform_id = p_platform_id AND lti_user_id = p_lti_user_id;

    RETURN v_user_id;
  END IF;

  -- Try to find existing user by email
  IF p_email IS NOT NULL THEN
    SELECT id INTO v_user_id
    FROM profiles
    WHERE email = p_email
    LIMIT 1;
  END IF;

  -- If no user found, we'll return NULL - the application layer should handle user creation
  -- since it requires auth.users integration

  IF v_user_id IS NOT NULL THEN
    -- Create mapping for existing user
    INSERT INTO lti_user_mappings (
      platform_id, lti_user_id, lti_email, lti_name,
      lti_given_name, lti_family_name, lti_picture, user_id
    ) VALUES (
      p_platform_id, p_lti_user_id, p_email, p_name,
      p_given_name, p_family_name, p_picture, v_user_id
    );
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE lti_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lti_resource_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE lti_launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE lti_user_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lti_grade_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lti_nonces ENABLE ROW LEVEL SECURITY;

-- Policies for lti_platforms (admin only)
CREATE POLICY "Admins can manage LTI platforms"
  ON lti_platforms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policies for lti_resource_links
CREATE POLICY "Admins can manage resource links"
  ON lti_resource_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policies for lti_launches (users can see their own)
CREATE POLICY "Users can view their own launches"
  ON lti_launches FOR SELECT
  USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all launches"
  ON lti_launches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Service role can insert launches (from edge functions)
CREATE POLICY "Service role can insert launches"
  ON lti_launches FOR INSERT
  WITH CHECK (TRUE);

-- Policies for lti_user_mappings
CREATE POLICY "Users can view their own mappings"
  ON lti_user_mappings FOR SELECT
  USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage mappings"
  ON lti_user_mappings FOR ALL
  USING (TRUE);

-- Policies for lti_grade_submissions
CREATE POLICY "Users can view their own grades"
  ON lti_grade_submissions FOR SELECT
  USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage grades"
  ON lti_grade_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- Policies for lti_nonces (service role only)
CREATE POLICY "Service role can manage nonces"
  ON lti_nonces FOR ALL
  USING (TRUE);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_lti_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lti_platforms_updated_at
  BEFORE UPDATE ON lti_platforms
  FOR EACH ROW EXECUTE FUNCTION update_lti_updated_at();

CREATE TRIGGER update_lti_resource_links_updated_at
  BEFORE UPDATE ON lti_resource_links
  FOR EACH ROW EXECUTE FUNCTION update_lti_updated_at();

CREATE TRIGGER update_lti_user_mappings_updated_at
  BEFORE UPDATE ON lti_user_mappings
  FOR EACH ROW EXECUTE FUNCTION update_lti_updated_at();

CREATE TRIGGER update_lti_grade_submissions_updated_at
  BEFORE UPDATE ON lti_grade_submissions
  FOR EACH ROW EXECUTE FUNCTION update_lti_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE lti_platforms IS 'LTI 1.3 platform configurations (Canvas, Moodle, Blackboard, etc.)';
COMMENT ON TABLE lti_resource_links IS 'Mappings between LTI resource links and our courses/lessons';
COMMENT ON TABLE lti_launches IS 'History of LTI launches for auditing and session tracking';
COMMENT ON TABLE lti_user_mappings IS 'Links between LMS users and our user accounts';
COMMENT ON TABLE lti_grade_submissions IS 'Grade passback queue for Assignment and Grade Services (AGS)';
COMMENT ON TABLE lti_nonces IS 'Nonce storage for replay attack prevention';
