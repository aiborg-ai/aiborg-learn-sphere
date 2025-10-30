-- Migration: Create email_logs table
-- Feature: 001-create-a-free (Free Introductory AI Session)
-- Purpose: Audit trail for all emails sent (compliance, debugging, analytics)

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys (soft relationships - no FK constraints to preserve logs)
  session_id UUID,
  registration_id UUID,

  -- Email Details
  email_type TEXT NOT NULL CHECK (
    email_type IN (
      'confirmation',
      'waitlist_promotion',
      'reminder_24h',
      'reminder_1h',
      'post_session',
      'parent_consent',
      'cancellation',
      'admin_notification'
    )
  ),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,

  -- Resend Integration
  resend_email_id TEXT,
  resend_status TEXT CHECK (
    resend_status IN ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed')
  ),

  -- Delivery Tracking
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,

  -- Metadata
  template_version TEXT,
  locale TEXT DEFAULT 'en-GB',

  -- Error Handling
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_session ON public.email_logs(session_id, email_type)
  WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_registration ON public.email_logs(registration_id)
  WHERE registration_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend ON public.email_logs(resend_email_id)
  WHERE resend_email_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(resend_status, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_failures ON public.email_logs(sent_at DESC)
  WHERE resend_status IN ('bounced', 'failed');

-- Comment on table
COMMENT ON TABLE public.email_logs IS 'Immutable audit trail for all emails sent via Resend with delivery tracking';
