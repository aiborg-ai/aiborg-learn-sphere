-- Season 2 Reviews / Testimonials
-- Only verified registrants can submit reviews

-- Add review token to registrations for secure review access
ALTER TABLE season2_registrations
ADD COLUMN IF NOT EXISTS review_token UUID DEFAULT gen_random_uuid();

-- Create index for review token lookups
CREATE INDEX IF NOT EXISTS idx_season2_reg_review_token ON season2_registrations(review_token);

-- Reviews table
CREATE TABLE IF NOT EXISTS season2_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to registration
  registration_id UUID NOT NULL REFERENCES season2_registrations(id) ON DELETE CASCADE,

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  testimonial TEXT NOT NULL CHECK (char_length(testimonial) >= 20 AND char_length(testimonial) <= 1000),

  -- Display preferences
  display_name TEXT NOT NULL, -- How they want to be shown (e.g., "John D." or "John from India")
  show_country BOOLEAN DEFAULT true,

  -- Program info (captured at review time)
  program TEXT NOT NULL CHECK (program IN ('under14', 'professionals')),

  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  rejection_reason TEXT,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One review per registration
  UNIQUE(registration_id)
);

-- Indexes
CREATE INDEX idx_season2_reviews_status ON season2_reviews(status);
CREATE INDEX idx_season2_reviews_program ON season2_reviews(program);
CREATE INDEX idx_season2_reviews_rating ON season2_reviews(rating);
CREATE INDEX idx_season2_reviews_approved ON season2_reviews(status, approved_at DESC) WHERE status = 'approved';

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_season2_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER season2_reviews_updated_at
  BEFORE UPDATE ON season2_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_season2_reviews_updated_at();

-- RLS Policies
ALTER TABLE season2_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews (for testimonials display)
CREATE POLICY "Anyone can view approved reviews"
  ON season2_reviews
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Service role has full access (for edge functions)
CREATE POLICY "Service role has full access to reviews"
  ON season2_reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can view and manage all reviews
CREATE POLICY "Admins can view all reviews"
  ON season2_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update reviews"
  ON season2_reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Comments
COMMENT ON TABLE season2_reviews IS 'Testimonials from verified Season 2 participants';
COMMENT ON COLUMN season2_registrations.review_token IS 'Secure token for submitting reviews - sent via email';
COMMENT ON COLUMN season2_reviews.display_name IS 'Public name shown with testimonial (e.g., "Sarah M." or "Parent of Alex")';
