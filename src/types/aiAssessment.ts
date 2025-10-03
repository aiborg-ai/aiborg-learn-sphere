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
