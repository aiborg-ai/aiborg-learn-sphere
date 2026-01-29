-- Season 2 Simple Registrations Table
-- No login required, admin confirmation via email

CREATE TABLE IF NOT EXISTS season2_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Registrant Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,

  -- Program Selection
  program TEXT NOT NULL CHECK (program IN ('under14', 'professionals')),
  age_group TEXT NOT NULL CHECK (age_group IN ('under14', '14-18', '18-25', '25-40', '40+')),
  occupation TEXT NOT NULL CHECK (occupation IN ('student', 'professional', 'business_owner', 'educator', 'other')),
  occupation_details TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),

  -- Confirmation tracking
  confirmation_token UUID DEFAULT gen_random_uuid(),
  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,
  rejection_reason TEXT,

  -- Email tracking
  notification_sent_at TIMESTAMPTZ,
  confirmation_email_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,

  -- Metadata
  registration_source TEXT DEFAULT 'web',
  ip_address TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_season2_reg_email ON season2_registrations(email);
CREATE INDEX idx_season2_reg_program ON season2_registrations(program);
CREATE INDEX idx_season2_reg_status ON season2_registrations(status);
CREATE INDEX idx_season2_reg_token ON season2_registrations(confirmation_token);
CREATE INDEX idx_season2_reg_created ON season2_registrations(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_season2_reg_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER season2_reg_updated_at
  BEFORE UPDATE ON season2_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_season2_reg_updated_at();

-- RLS Policies
ALTER TABLE season2_registrations ENABLE ROW LEVEL SECURITY;

-- Allow public insert (no auth required for registration)
CREATE POLICY "Anyone can register for Season 2"
  ON season2_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view/update
CREATE POLICY "Admins can view all registrations"
  ON season2_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update registrations"
  ON season2_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role has full access"
  ON season2_registrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE season2_registrations IS 'Season 2 free AI classes registrations - no login required';
COMMENT ON COLUMN season2_registrations.confirmation_token IS 'Token for admin email confirmation CTA';
COMMENT ON COLUMN season2_registrations.program IS 'under14 = AI Explorers, professionals = AI Mastery';
