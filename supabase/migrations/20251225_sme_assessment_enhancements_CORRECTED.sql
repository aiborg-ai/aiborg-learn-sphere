-- SME Assessment Enhancements Migration
-- Created: 2025-12-25
-- Purpose: Add roadmap, ROI calculator, and lead nurturing features

-- ============================================================================
-- TABLE GROUP 1: Implementation Roadmap (3 tables)
-- ============================================================================

-- Table 1: Roadmap Items
CREATE TABLE IF NOT EXISTS sme_roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('quick_wins', 'short_term', 'medium_term', 'long_term')),
  phase_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  estimated_weeks INTEGER NOT NULL CHECK (estimated_weeks > 0),
  estimated_cost_usd INTEGER CHECK (estimated_cost_usd >= 0),
  required_resources TEXT[] DEFAULT '{}',
  dependencies TEXT[] DEFAULT '{}',
  success_metrics TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for roadmap items
CREATE INDEX IF NOT EXISTS idx_roadmap_items_assessment ON sme_roadmap_items(assessment_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_phase ON sme_roadmap_items(phase, phase_order);

-- Table 2: Roadmap Phases
CREATE TABLE IF NOT EXISTS sme_roadmap_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('quick_wins', 'short_term', 'medium_term', 'long_term')),
  start_week INTEGER NOT NULL CHECK (start_week >= 0),
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
  total_cost_usd INTEGER CHECK (total_cost_usd >= 0),
  completion_criteria TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, phase)
);

-- Index for roadmap phases
CREATE INDEX IF NOT EXISTS idx_roadmap_phases_assessment ON sme_roadmap_phases(assessment_id);

-- Table 3: Roadmap Milestones
CREATE TABLE IF NOT EXISTS sme_roadmap_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  target_week INTEGER NOT NULL CHECK (target_week >= 0),
  deliverables TEXT[] DEFAULT '{}',
  validation_criteria TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for roadmap milestones
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_assessment ON sme_roadmap_milestones(assessment_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_week ON sme_roadmap_milestones(assessment_id, target_week);

-- ============================================================================
-- TABLE GROUP 2: ROI Calculations (3 tables)
-- ============================================================================

-- Table 4: ROI Summary
CREATE TABLE IF NOT EXISTS sme_roi_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
  total_investment_usd INTEGER NOT NULL CHECK (total_investment_usd >= 0),
  total_annual_benefit_usd INTEGER NOT NULL CHECK (total_annual_benefit_usd >= 0),
  payback_months INTEGER NOT NULL CHECK (payback_months > 0),
  three_year_roi_percent NUMERIC(10, 2) NOT NULL,
  net_present_value_usd INTEGER,
  risk_adjusted_roi_percent NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id)
);

-- Index for ROI summary
CREATE INDEX IF NOT EXISTS idx_roi_summary_assessment ON sme_roi_summary(assessment_id);

-- Table 5: ROI Cost Breakdown
CREATE TABLE IF NOT EXISTS sme_roi_cost_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('implementation', 'licensing', 'training', 'infrastructure', 'ongoing_maintenance')),
  item_name TEXT NOT NULL,
  one_time_cost_usd INTEGER DEFAULT 0 CHECK (one_time_cost_usd >= 0),
  annual_cost_usd INTEGER DEFAULT 0 CHECK (annual_cost_usd >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ROI costs
CREATE INDEX IF NOT EXISTS idx_roi_costs_assessment ON sme_roi_cost_breakdown(assessment_id);
CREATE INDEX IF NOT EXISTS idx_roi_costs_category ON sme_roi_cost_breakdown(category);

-- Table 6: ROI Benefit Breakdown
CREATE TABLE IF NOT EXISTS sme_roi_benefit_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('efficiency_gains', 'cost_savings', 'revenue_growth', 'risk_mitigation', 'quality_improvement')),
  benefit_name TEXT NOT NULL,
  annual_value_usd INTEGER NOT NULL CHECK (annual_value_usd >= 0),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
  assumptions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ROI benefits
CREATE INDEX IF NOT EXISTS idx_roi_benefits_assessment ON sme_roi_benefit_breakdown(assessment_id);
CREATE INDEX IF NOT EXISTS idx_roi_benefits_category ON sme_roi_benefit_breakdown(category);

-- ============================================================================
-- TABLE GROUP 3: Lead Nurturing (3 tables)
-- ============================================================================

-- Table 7: Nurturing Campaigns
CREATE TABLE IF NOT EXISTS sme_nurturing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_email TEXT NOT NULL,
  campaign_status TEXT DEFAULT 'active' CHECK (campaign_status IN ('active', 'paused', 'completed', 'cancelled')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  next_email_scheduled_at TIMESTAMPTZ,
  emails_sent INTEGER DEFAULT 0 CHECK (emails_sent >= 0),
  emails_opened INTEGER DEFAULT 0 CHECK (emails_opened >= 0),
  links_clicked INTEGER DEFAULT 0 CHECK (links_clicked >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id)
);

-- Indexes for nurturing campaigns
CREATE INDEX IF NOT EXISTS idx_nurturing_campaigns_assessment ON sme_nurturing_campaigns(assessment_id);
CREATE INDEX IF NOT EXISTS idx_nurturing_campaigns_user ON sme_nurturing_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_nurturing_campaigns_next_email ON sme_nurturing_campaigns(next_email_scheduled_at) WHERE campaign_status = 'active';
CREATE INDEX IF NOT EXISTS idx_nurturing_campaigns_status ON sme_nurturing_campaigns(campaign_status);

-- Table 8: Nurturing Emails
CREATE TABLE IF NOT EXISTS sme_nurturing_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES sme_nurturing_campaigns(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL CHECK (sequence_number BETWEEN 1 AND 7),
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'education', 'roadmap', 'roi', 'case_study', 'resources', 'consultation')),
  subject_line TEXT NOT NULL,
  email_body TEXT NOT NULL,
  scheduled_days_after_start INTEGER NOT NULL CHECK (scheduled_days_after_start >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, sequence_number)
);

-- Indexes for nurturing emails
CREATE INDEX IF NOT EXISTS idx_nurturing_emails_campaign ON sme_nurturing_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_nurturing_emails_status ON sme_nurturing_emails(status);
CREATE INDEX IF NOT EXISTS idx_nurturing_emails_sequence ON sme_nurturing_emails(campaign_id, sequence_number);

-- Table 9: Nurturing Analytics
CREATE TABLE IF NOT EXISTS sme_nurturing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES sme_nurturing_emails(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  link_clicked TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for nurturing analytics
CREATE INDEX IF NOT EXISTS idx_nurturing_analytics_email ON sme_nurturing_analytics(email_id);
CREATE INDEX IF NOT EXISTS idx_nurturing_analytics_event ON sme_nurturing_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_nurturing_analytics_timestamp ON sme_nurturing_analytics(event_timestamp);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE sme_roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_roadmap_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_roadmap_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_roi_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_roi_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_roi_benefit_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_nurturing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_nurturing_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_nurturing_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: Roadmap Tables
-- ============================================================================

-- Roadmap Items Policies
CREATE POLICY "Users can view their own roadmap items"
  ON sme_roadmap_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = sme_roadmap_items.assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert roadmap items"
  ON sme_roadmap_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

-- Roadmap Phases Policies
CREATE POLICY "Users can view their own roadmap phases"
  ON sme_roadmap_phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = sme_roadmap_phases.assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert roadmap phases"
  ON sme_roadmap_phases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

-- Roadmap Milestones Policies
CREATE POLICY "Users can view their own roadmap milestones"
  ON sme_roadmap_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = sme_roadmap_milestones.assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert roadmap milestones"
  ON sme_roadmap_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: ROI Tables
-- ============================================================================

-- ROI Summary Policies
CREATE POLICY "Users can view their own ROI summary"
  ON sme_roi_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = sme_roi_summary.assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert ROI summary"
  ON sme_roi_summary FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

-- ROI Cost Breakdown Policies
CREATE POLICY "Users can view their own ROI costs"
  ON sme_roi_cost_breakdown FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = sme_roi_cost_breakdown.assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert ROI costs"
  ON sme_roi_cost_breakdown FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

-- ROI Benefit Breakdown Policies
CREATE POLICY "Users can view their own ROI benefits"
  ON sme_roi_benefit_breakdown FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = sme_roi_benefit_breakdown.assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert ROI benefits"
  ON sme_roi_benefit_breakdown FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_opportunity_assessments
      WHERE ai_opportunity_assessments.id = assessment_id
      AND ai_opportunity_assessments.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: Nurturing Tables
-- ============================================================================

-- Nurturing Campaigns Policies
CREATE POLICY "Users can view their own nurturing campaigns"
  ON sme_nurturing_campaigns FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all nurturing campaigns"
  ON sme_nurturing_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "System can insert nurturing campaigns"
  ON sme_nurturing_campaigns FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update nurturing campaigns"
  ON sme_nurturing_campaigns FOR UPDATE
  USING (user_id = auth.uid());

-- Nurturing Emails Policies
CREATE POLICY "Users can view their own nurturing emails"
  ON sme_nurturing_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sme_nurturing_campaigns
      WHERE sme_nurturing_campaigns.id = sme_nurturing_emails.campaign_id
      AND sme_nurturing_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all nurturing emails"
  ON sme_nurturing_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "System can insert nurturing emails"
  ON sme_nurturing_emails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sme_nurturing_campaigns
      WHERE sme_nurturing_campaigns.id = campaign_id
      AND sme_nurturing_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "System can update nurturing emails"
  ON sme_nurturing_emails FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sme_nurturing_campaigns
      WHERE sme_nurturing_campaigns.id = campaign_id
      AND sme_nurturing_campaigns.user_id = auth.uid()
    )
  );

-- Nurturing Analytics Policies (admin-only for privacy)
CREATE POLICY "Admins can view nurturing analytics"
  ON sme_nurturing_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "System can insert nurturing analytics"
  ON sme_nurturing_analytics FOR INSERT
  WITH CHECK (true); -- Allow system to track events

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE sme_roadmap_items IS 'Implementation roadmap items for SME assessments, organized by phase';
COMMENT ON TABLE sme_roadmap_phases IS 'Phases of the implementation roadmap (quick wins, short/medium/long term)';
COMMENT ON TABLE sme_roadmap_milestones IS 'Key milestones in the implementation roadmap';
COMMENT ON TABLE sme_roi_summary IS 'High-level ROI metrics for SME assessments';
COMMENT ON TABLE sme_roi_cost_breakdown IS 'Detailed cost breakdown for ROI calculation';
COMMENT ON TABLE sme_roi_benefit_breakdown IS 'Detailed benefit breakdown for ROI calculation';
COMMENT ON TABLE sme_nurturing_campaigns IS 'Lead nurturing email campaigns for SME assessments';
COMMENT ON TABLE sme_nurturing_emails IS '7-email sequence for nurturing campaigns';
COMMENT ON TABLE sme_nurturing_analytics IS 'Email engagement analytics (opens, clicks, etc.)';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON sme_roadmap_items TO authenticated;
GRANT SELECT, INSERT ON sme_roadmap_phases TO authenticated;
GRANT SELECT, INSERT ON sme_roadmap_milestones TO authenticated;
GRANT SELECT, INSERT ON sme_roi_summary TO authenticated;
GRANT SELECT, INSERT ON sme_roi_cost_breakdown TO authenticated;
GRANT SELECT, INSERT ON sme_roi_benefit_breakdown TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sme_nurturing_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sme_nurturing_emails TO authenticated;
GRANT SELECT, INSERT ON sme_nurturing_analytics TO authenticated;
