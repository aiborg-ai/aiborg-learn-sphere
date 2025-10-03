-- Admin Management Panel - Phase 1: Foundation
-- Database schema for audit logging, payment transactions, and refund requests

-- =====================================================
-- 1. ADMIN AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL, -- e.g., 'user_role_changed', 'enrollment_created', 'refund_processed'
  entity_type VARCHAR(50) NOT NULL, -- e.g., 'user', 'enrollment', 'payment', 'course'
  entity_id TEXT NOT NULL, -- ID of the affected entity
  old_value JSONB, -- Previous state (if applicable)
  new_value JSONB, -- New state
  metadata JSONB, -- Additional context (IP address, user agent, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON admin_audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON admin_audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- RLS Policies for audit logs (admin only)
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 2. PAYMENT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50), -- e.g., 'card', 'upi', 'netbanking', 'wallet'
  payment_gateway VARCHAR(50), -- e.g., 'stripe', 'razorpay', 'paypal'
  transaction_id VARCHAR(255) UNIQUE, -- Gateway transaction ID
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded', 'partially_refunded'
  payment_date TIMESTAMPTZ,
  metadata JSONB, -- Gateway response, additional details
  invoice_number VARCHAR(100),
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_enrollment_id ON payment_transactions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_course_id ON payment_transactions(course_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);

-- RLS Policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment transactions"
  ON payment_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 3. REFUND REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
  refund_amount DECIMAL(10, 2) NOT NULL,
  refund_reason TEXT,
  refund_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed', 'completed'
  requested_by UUID NOT NULL REFERENCES auth.users(id), -- User who requested (could be admin or user)
  approved_by UUID REFERENCES auth.users(id), -- Admin who approved
  processed_by UUID REFERENCES auth.users(id), -- Admin who processed
  refund_transaction_id VARCHAR(255), -- Gateway refund transaction ID
  refund_date TIMESTAMPTZ,
  admin_notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_payment_id ON refund_requests(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_enrollment_id ON refund_requests(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(refund_status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at DESC);

-- RLS Policies
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refund requests"
  ON refund_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create refund requests for their purchases"
  ON refund_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all refund requests"
  ON refund_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update refund requests"
  ON refund_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 4. UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to payment_transactions
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to refund_requests
CREATE TRIGGER update_refund_requests_updated_at
  BEFORE UPDATE ON refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. HELPER FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Function to get revenue by date range
CREATE OR REPLACE FUNCTION get_revenue_by_date_range(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_revenue DECIMAL,
  total_transactions BIGINT,
  successful_transactions BIGINT,
  failed_transactions BIGINT,
  refunded_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
    COUNT(*)::BIGINT as total_transactions,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END)::BIGINT as successful_transactions,
    COUNT(CASE WHEN payment_status = 'failed' THEN 1 END)::BIGINT as failed_transactions,
    COALESCE(SUM(CASE WHEN payment_status IN ('refunded', 'partially_refunded') THEN amount ELSE 0 END), 0) as refunded_amount
  FROM payment_transactions
  WHERE payment_date >= start_date AND payment_date <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get enrollment stats by date range
CREATE OR REPLACE FUNCTION get_enrollment_stats_by_date_range(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_enrollments BIGINT,
  unique_students BIGINT,
  total_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_enrollments,
    COUNT(DISTINCT user_id)::BIGINT as unique_students,
    COALESCE(SUM(payment_amount), 0) as total_revenue
  FROM enrollments
  WHERE enrolled_at >= start_date AND enrolled_at <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_revenue_by_date_range TO authenticated;
GRANT EXECUTE ON FUNCTION get_enrollment_stats_by_date_range TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE admin_audit_logs IS 'Audit log for all admin actions in the system';
COMMENT ON TABLE payment_transactions IS 'Comprehensive payment transaction history';
COMMENT ON TABLE refund_requests IS 'Refund requests and their processing status';
COMMENT ON FUNCTION get_revenue_by_date_range IS 'Get revenue statistics for a date range';
COMMENT ON FUNCTION get_enrollment_stats_by_date_range IS 'Get enrollment statistics for a date range';
