export type AIAdoptionLevel = 'none' | 'experimentation' | 'partial' | 'full-scale';

export interface AIOpportunityAssessment {
  id: string;
  user_id: string;
  company_name: string;
  company_mission?: string;
  ai_enhancement_description?: string;
  strategic_alignment_rating?: number;

  // AI Capabilities
  current_ai_adoption_level?: AIAdoptionLevel;
  internal_ai_expertise?: number;
  data_availability_rating?: number;
  additional_ai_capabilities?: string;

  // Overall ratings
  overall_opportunity_rating?: number;
  ai_adoption_benefit_summary?: string;

  // Metadata
  completed_by?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  is_completed: boolean;
}

export interface AssessmentPainPoint {
  id: string;
  assessment_id: string;
  pain_point: string;
  current_impact: number;
  ai_capability_to_address: string;
  impact_after_ai: number;
  created_at: string;
}

export interface AssessmentUserImpact {
  id: string;
  assessment_id: string;
  user_group: string;
  satisfaction_rating: number;
  user_pain_points: string;
  ai_improvements: string;
  impact_rating: number;
  created_at: string;
}

export interface AssessmentBenefit {
  id: string;
  assessment_id: string;
  benefit_area: string;
  current_status: string;
  ai_improvement: string;
  impact_rating: number;
  created_at: string;
}

export interface AssessmentRisk {
  id: string;
  assessment_id: string;
  risk_factor: string;
  specific_risk: string;
  likelihood: number;
  impact_rating: number;
  mitigation_strategy: string;
  created_at: string;
}

export interface AssessmentResource {
  id: string;
  assessment_id: string;
  resource_type: string;
  is_available: boolean;
  additional_requirements?: string;
  created_at: string;
}

export interface AssessmentCompetitor {
  id: string;
  assessment_id: string;
  competitor_name: string;
  ai_use_case: string;
  advantage: string;
  threat_level: number;
  created_at: string;
}

export interface AssessmentActionPlan {
  id: string;
  assessment_id: string;
  recommended_next_steps: string[];
  created_at: string;
}

export interface AssessmentStakeholder {
  id: string;
  assessment_id: string;
  name: string;
  department: string;
  role: string;
  signature_date?: string;
  created_at: string;
}

export interface AssessmentFormData {
  // Section 1: Company Mission and AI Alignment
  companyName: string;
  companyMission: string;
  aiEnhancementDescription: string;
  strategicAlignmentRating: number;

  // Section 2: AI Capabilities Assessment
  currentAIAdoptionLevel: AIAdoptionLevel;
  internalAIExpertise: number;
  dataAvailabilityRating: number;
  additionalAICapabilities: string;

  // Section 3: Pain Points and AI Opportunities
  painPoints: Array<{
    painPoint: string;
    currentImpact: number;
    aiCapabilityToAddress: string;
    impactAfterAI: number;
  }>;

  // Section 4: User Impact and AI Benefits
  userImpacts: Array<{
    userGroup: string;
    satisfactionRating: number;
    userPainPoints: string;
    aiImprovements: string;
    impactRating: number;
  }>;

  // Section 5: Benefits Analysis
  benefits: Array<{
    benefitArea: string;
    currentStatus: string;
    aiImprovement: string;
    impactRating: number;
  }>;

  // Section 6: Risk Analysis and Mitigation
  risks: Array<{
    riskFactor: string;
    specificRisk: string;
    likelihood: number;
    impactRating: number;
    mitigationStrategy: string;
  }>;

  // Section 7: Resource Requirements
  resources: Array<{
    resourceType: string;
    isAvailable: boolean;
    additionalRequirements: string;
  }>;

  // Section 8: Competitive Analysis
  competitors: Array<{
    competitorName: string;
    aiUseCase: string;
    advantage: string;
    threatLevel: number;
  }>;

  // Section 9: Implementation Decision
  aiAdoptionBenefitSummary: string;
  overallOpportunityRating: number;
  recommendedNextSteps: string[];
  completedBy: string;
}

export interface AssessmentReport {
  assessment: AIOpportunityAssessment;
  painPoints: AssessmentPainPoint[];
  userImpacts: AssessmentUserImpact[];
  benefits: AssessmentBenefit[];
  risks: AssessmentRisk[];
  resources: AssessmentResource[];
  competitors: AssessmentCompetitor[];
  actionPlan?: AssessmentActionPlan;
  stakeholders: AssessmentStakeholder[];
}

// ============================================================================
// SME Assessment Enhancements - Roadmap Types
// ============================================================================

export type RoadmapPhase = 'quick_wins' | 'short_term' | 'medium_term' | 'long_term';
export type RoadmapPriority = 'critical' | 'high' | 'medium' | 'low';

export interface SMERoadmapItem {
  id: string;
  assessment_id: string;
  phase: RoadmapPhase;
  phase_order: number;
  title: string;
  description: string;
  priority: RoadmapPriority;
  estimated_weeks: number;
  estimated_cost_usd?: number;
  required_resources: string[];
  dependencies: string[];
  success_metrics: string[];
  created_at: string;
}

export interface SMERoadmapPhase {
  id: string;
  assessment_id: string;
  phase: RoadmapPhase;
  start_week: number;
  duration_weeks: number;
  total_cost_usd?: number;
  completion_criteria: string[];
  created_at: string;
}

export interface SMERoadmapMilestone {
  id: string;
  assessment_id: string;
  milestone_name: string;
  target_week: number;
  deliverables: string[];
  validation_criteria: string[];
  created_at: string;
}

// ============================================================================
// SME Assessment Enhancements - ROI Types
// ============================================================================

export type ROICostCategory =
  | 'implementation'
  | 'licensing'
  | 'training'
  | 'infrastructure'
  | 'ongoing_maintenance';

export type ROIBenefitCategory =
  | 'efficiency_gains'
  | 'cost_savings'
  | 'revenue_growth'
  | 'risk_mitigation'
  | 'quality_improvement';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface SMEROISummary {
  id: string;
  assessment_id: string;
  total_investment_usd: number;
  total_annual_benefit_usd: number;
  payback_months: number;
  three_year_roi_percent: number;
  net_present_value_usd?: number;
  risk_adjusted_roi_percent?: number;
  created_at: string;
}

export interface SMEROICostBreakdown {
  id: string;
  assessment_id: string;
  category: ROICostCategory;
  item_name: string;
  one_time_cost_usd: number;
  annual_cost_usd: number;
  notes?: string;
  created_at: string;
}

export interface SMEROIBenefitBreakdown {
  id: string;
  assessment_id: string;
  category: ROIBenefitCategory;
  benefit_name: string;
  annual_value_usd: number;
  confidence_level: ConfidenceLevel;
  assumptions: string[];
  created_at: string;
}

// ============================================================================
// SME Assessment Enhancements - Lead Nurturing Types
// ============================================================================

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type EmailType =
  | 'welcome'
  | 'education'
  | 'roadmap'
  | 'roi'
  | 'case_study'
  | 'resources'
  | 'consultation';

export type EmailStatus = 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';

export type AnalyticsEventType = 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';

export interface SMENurturingCampaign {
  id: string;
  assessment_id: string;
  user_id: string;
  company_email: string;
  campaign_status: CampaignStatus;
  start_date: string;
  next_email_scheduled_at?: string;
  emails_sent: number;
  emails_opened: number;
  links_clicked: number;
  created_at: string;
  updated_at: string;
  sme_nurturing_emails?: SMENurturingEmail[];
}

export interface SMENurturingEmail {
  id: string;
  campaign_id: string;
  sequence_number: number;
  email_type: EmailType;
  subject_line: string;
  email_body: string;
  scheduled_days_after_start: number;
  status: EmailStatus;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
}

export interface SMENurturingAnalytics {
  id: string;
  email_id: string;
  event_type: AnalyticsEventType;
  event_timestamp: string;
  user_agent?: string;
  ip_address?: string;
  link_clicked?: string;
  created_at: string;
}

// ============================================================================
// Extended Assessment Report with Enhancements
// ============================================================================

export interface ExtendedAssessmentReport extends AssessmentReport {
  // Roadmap data
  roadmapItems?: SMERoadmapItem[];
  roadmapPhases?: SMERoadmapPhase[];
  roadmapMilestones?: SMERoadmapMilestone[];

  // ROI data
  roiSummary?: SMEROISummary;
  roiCosts?: SMEROICostBreakdown[];
  roiBenefits?: SMEROIBenefitBreakdown[];

  // Nurturing campaign data
  nurturingCampaign?: SMENurturingCampaign;
}
