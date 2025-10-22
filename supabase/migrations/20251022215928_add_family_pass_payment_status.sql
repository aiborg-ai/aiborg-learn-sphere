-- ============================================================================
-- ADD FAMILY PASS PAYMENT STATUS
-- ============================================================================
-- Adds support for 'family_pass' payment status for Family Pass enrollments
-- Created: October 22, 2025
-- ============================================================================

-- Add comment to document all valid payment_status values
COMMENT ON COLUMN public.enrollments.payment_status IS
  'Payment status values: pending, completed, failed, family_pass, refunded';

-- Add index for family pass enrollments (for analytics and reporting)
CREATE INDEX IF NOT EXISTS idx_enrollments_family_pass
  ON public.enrollments(payment_status)
  WHERE payment_status = 'family_pass';

-- Add comment to clarify family pass enrollments
COMMENT ON INDEX idx_enrollments_family_pass IS
  'Index for Family Pass enrollments - used for analytics and member reporting';
