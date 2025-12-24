// ============================================================================
// AI Readiness Assessment Types
// TypeScript definitions matching database schema
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type AssessmentTier = 'freemium' | 'premium' | 'enterprise';

export type MaturityLevel =
  | 'awareness' // 0-20: Just exploring AI
  | 'experimenting' // 21-40: Running pilot projects
  | 'adopting' // 41-60: Scaling AI initiatives
  | 'optimizing' // 61-80: AI-first operations
  | 'leading'; // 81-100: AI innovation leader

export type StakeholderRole =
  | 'ceo'
  | 'cto'
  | 'cfo'
  | 'operations'
  | 'hr'
  | 'marketing'
  | 'it'
  | 'other';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export type RecommendationTimeframe =
  | 'quick_win' // 0-3 months
  | 'short_term' // 3-6 months
  | 'medium_term' // 6-12 months
  | 'long_term'; // 12+ months

export type DimensionType =
  | 'overall'
  | 'strategic'
  | 'data'
  | 'tech'
  | 'human'
  | 'process'
  | 'change';

// ============================================================================
// CORE ASSESSMENT
// ============================================================================

export interface AIReadinessAssessment {
  id: string;
  user_id: string;
  company_id?: string;

  // Assessment metadata
  assessment_tier: AssessmentTier;
  assessment_name?: string;

  // Company info (snapshot at assessment time)
  company_name?: string;
  industry?: string;
  company_size?: string;

  // Overall scores (calculated)
  overall_readiness_score?: number; // 0-100
  maturity_level?: MaturityLevel;

  // Dimension scores (0-100 each)
  strategic_alignment_score?: number;
  data_maturity_score?: number;
  tech_infrastructure_score?: number;
  human_capital_score?: number;
  process_maturity_score?: number;
  change_readiness_score?: number;

  // Dimension weights (for custom weighting)
  strategic_weight: number;
  data_weight: number;
  tech_weight: number;
  human_weight: number;
  process_weight: number;
  change_weight: number;

  // Multi-stakeholder tracking
  is_multi_stakeholder: boolean;
  invited_stakeholder_count: number;
  completed_stakeholder_count: number;

  // Benchmarking
  industry_percentile?: number; // 0-100
  size_percentile?: number; // 0-100

  // Report generation
  report_generated_at?: string;
  report_url?: string;
  roadmap_generated_at?: string;

  // Status
  is_completed: boolean;
  completed_at?: string;
  last_saved_section: number;

  // Consultation (premium tier)
  consultation_scheduled: boolean;
  consultation_completed: boolean;
  consultation_notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DIMENSION RESPONSES
// ============================================================================

export interface StrategicAlignmentResponse {
  id: string;
  assessment_id: string;

  // Questions (1-5 scale)
  executive_buy_in?: number;
  budget_allocated?: number;
  clear_use_cases?: number;
  kpis_defined?: number;
  change_champions?: number;
  competitive_pressure?: number;
  innovation_culture?: number;
  strategic_roadmap?: number;

  // Open text
  roi_expectations?: string;
  priority_use_cases?: string[]; // Array of use cases

  created_at: string;
}

export interface DataMaturityResponse {
  id: string;
  assessment_id: string;

  data_quality?: number;
  data_accessibility?: number;
  data_governance?: number;
  data_documentation?: number;
  privacy_compliance?: number;
  security_posture?: number;
  data_integration?: number;
  master_data_mgmt?: number;
  data_volume_adequacy?: number;
  data_silos?: number;

  key_data_sources?: string[];
  data_challenges?: string;

  created_at: string;
}

export interface TechInfrastructureResponse {
  id: string;
  assessment_id: string;

  cloud_readiness?: number;
  it_systems_capability?: number;
  api_availability?: number;
  security_infrastructure?: number;
  scalability?: number;
  integration_capability?: number;
  vendor_ecosystem?: number;
  it_support_capacity?: number;

  current_tech_stack?: string;
  planned_upgrades?: string[];

  created_at: string;
}

export interface HumanCapitalResponse {
  id: string;
  assessment_id: string;

  executive_ai_literacy?: number;
  technical_team_skills?: number;
  business_team_literacy?: number;
  training_budget?: number;
  hiring_capability?: number;
  external_expertise?: number;
  learning_culture?: number;
  skills_gap_awareness?: number;
  retention_capability?: number;
  change_management?: number;

  critical_skill_gaps?: string[];
  training_priorities?: string;

  created_at: string;
}

export interface ProcessMaturityResponse {
  id: string;
  assessment_id: string;

  process_documentation?: number;
  process_standardization?: number;
  automation_level?: number;
  performance_metrics?: number;
  continuous_improvement?: number;
  workflow_efficiency?: number;
  decision_making_speed?: number;
  quality_control?: number;

  automation_opportunities?: string[];
  process_pain_points?: string;

  created_at: string;
}

export interface ChangeReadinessResponse {
  id: string;
  assessment_id: string;

  leadership_commitment?: number;
  employee_sentiment?: number;
  communication_plan?: number;
  pilot_approach?: number;
  risk_tolerance?: number;
  change_history?: number;
  resistance_management?: number;
  success_celebration?: number;

  anticipated_resistance?: string;
  mitigation_strategies?: string[];

  created_at: string;
}

// ============================================================================
// FORM DATA (UI STATE)
// ============================================================================

export interface AIReadinessFormData {
  // Section 1: Strategic Alignment
  strategic: {
    executive_buy_in: number;
    budget_allocated: number;
    clear_use_cases: number;
    kpis_defined: number;
    change_champions: number;
    competitive_pressure: number;
    innovation_culture: number;
    strategic_roadmap: number;
    roi_expectations: string;
    priority_use_cases: string[];
  };

  // Section 2: Data Maturity
  data: {
    data_quality: number;
    data_accessibility: number;
    data_governance: number;
    data_documentation: number;
    privacy_compliance: number;
    security_posture: number;
    data_integration: number;
    master_data_mgmt: number;
    data_volume_adequacy: number;
    data_silos: number;
    key_data_sources: string[];
    data_challenges: string;
  };

  // Section 3: Tech Infrastructure
  tech: {
    cloud_readiness: number;
    it_systems_capability: number;
    api_availability: number;
    security_infrastructure: number;
    scalability: number;
    integration_capability: number;
    vendor_ecosystem: number;
    it_support_capacity: number;
    current_tech_stack: string;
    planned_upgrades: string[];
  };

  // Section 4: Human Capital
  human: {
    executive_ai_literacy: number;
    technical_team_skills: number;
    business_team_literacy: number;
    training_budget: number;
    hiring_capability: number;
    external_expertise: number;
    learning_culture: number;
    skills_gap_awareness: number;
    retention_capability: number;
    change_management: number;
    critical_skill_gaps: string[];
    training_priorities: string;
  };

  // Section 5: Process Maturity
  process: {
    process_documentation: number;
    process_standardization: number;
    automation_level: number;
    performance_metrics: number;
    continuous_improvement: number;
    workflow_efficiency: number;
    decision_making_speed: number;
    quality_control: number;
    automation_opportunities: string[];
    process_pain_points: string;
  };

  // Section 6: Change Readiness
  change: {
    leadership_commitment: number;
    employee_sentiment: number;
    communication_plan: number;
    pilot_approach: number;
    risk_tolerance: number;
    change_history: number;
    resistance_management: number;
    success_celebration: number;
    anticipated_resistance: string;
    mitigation_strategies: string[];
  };
}

// Default values for form initialization
export const defaultFormData: AIReadinessFormData = {
  strategic: {
    executive_buy_in: 3,
    budget_allocated: 3,
    clear_use_cases: 3,
    kpis_defined: 3,
    change_champions: 3,
    competitive_pressure: 3,
    innovation_culture: 3,
    strategic_roadmap: 3,
    roi_expectations: '',
    priority_use_cases: [],
  },
  data: {
    data_quality: 3,
    data_accessibility: 3,
    data_governance: 3,
    data_documentation: 3,
    privacy_compliance: 3,
    security_posture: 3,
    data_integration: 3,
    master_data_mgmt: 3,
    data_volume_adequacy: 3,
    data_silos: 3,
    key_data_sources: [],
    data_challenges: '',
  },
  tech: {
    cloud_readiness: 3,
    it_systems_capability: 3,
    api_availability: 3,
    security_infrastructure: 3,
    scalability: 3,
    integration_capability: 3,
    vendor_ecosystem: 3,
    it_support_capacity: 3,
    current_tech_stack: '',
    planned_upgrades: [],
  },
  human: {
    executive_ai_literacy: 3,
    technical_team_skills: 3,
    business_team_literacy: 3,
    training_budget: 3,
    hiring_capability: 3,
    external_expertise: 3,
    learning_culture: 3,
    skills_gap_awareness: 3,
    retention_capability: 3,
    change_management: 3,
    critical_skill_gaps: [],
    training_priorities: '',
  },
  process: {
    process_documentation: 3,
    process_standardization: 3,
    automation_level: 3,
    performance_metrics: 3,
    continuous_improvement: 3,
    workflow_efficiency: 3,
    decision_making_speed: 3,
    quality_control: 3,
    automation_opportunities: [],
    process_pain_points: '',
  },
  change: {
    leadership_commitment: 3,
    employee_sentiment: 3,
    communication_plan: 3,
    pilot_approach: 3,
    risk_tolerance: 3,
    change_history: 3,
    resistance_management: 3,
    success_celebration: 3,
    anticipated_resistance: '',
    mitigation_strategies: [],
  },
};

// ============================================================================
// STAKEHOLDER SYSTEM
// ============================================================================

export interface StakeholderInvite {
  id: string;
  assessment_id: string;

  email: string;
  stakeholder_role: StakeholderRole;
  stakeholder_name?: string;

  invite_token: string;
  invited_at: string;
  invited_by?: string;

  is_completed: boolean;
  completed_at?: string;
  reminder_sent_count: number;
  last_reminder_at?: string;
}

export interface StakeholderResponse {
  id: string;
  assessment_id: string;
  invite_id?: string;

  stakeholder_email: string;
  stakeholder_role: StakeholderRole;

  // Responses stored as JSONB
  strategic_responses: Record<string, any>;
  data_responses: Record<string, any>;
  tech_responses: Record<string, any>;
  human_responses: Record<string, any>;
  process_responses: Record<string, any>;
  change_responses: Record<string, any>;

  // Calculated scores for this stakeholder
  strategic_score?: number;
  data_score?: number;
  tech_score?: number;
  human_score?: number;
  process_score?: number;
  change_score?: number;

  completed_at: string;
}

// ============================================================================
// BENCHMARKING
// ============================================================================

export interface ReadinessBenchmark {
  id: string;

  industry?: string;
  company_size?: string;
  dimension: DimensionType;

  sample_size: number;
  avg_score: number;
  median_score?: number;
  std_dev?: number;

  percentile_25?: number;
  percentile_50?: number;
  percentile_75?: number;
  percentile_90?: number;

  last_updated: string;
}

export interface BenchmarkComparison {
  your_score: number;
  industry_avg: number;
  industry_median: number;
  percentile_rank: number;
  performance_level: 'below_average' | 'average' | 'above_average' | 'excellent';
  gap_to_75th: number; // Points to reach 75th percentile
}

// ============================================================================
// MATURITY LEVELS
// ============================================================================

export interface MaturityConfig {
  id: string;
  level: MaturityLevel;
  level_order: number;
  min_score: number;
  max_score: number;

  display_name: string;
  description: string;
  badge_color?: string;
  badge_icon?: string;

  characteristics?: string[];
  typical_challenges?: string[];
  next_level_focus?: string[];

  created_at: string;
}

export interface MaturityAnalysis {
  current_level: MaturityLevel;
  current_score: number;
  level_config: MaturityConfig;

  // Distance to next level
  next_level?: MaturityLevel;
  points_to_next_level?: number;

  // Strengths and weaknesses
  top_strengths: Array<{ dimension: DimensionType; score: number }>;
  top_gaps: Array<{ dimension: DimensionType; score: number; gap_to_avg: number }>;
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export interface ReadinessRecommendation {
  id: string;
  assessment_id: string;

  dimension: DimensionType;
  priority: RecommendationPriority;
  timeframe: RecommendationTimeframe;

  title: string;
  description: string;
  expected_impact?: string;

  estimated_effort?: string; // 'low', 'medium', 'high'
  estimated_cost_range?: string; // '£0-5K', '£5-25K', etc.
  required_resources?: string[];
  success_metrics?: string[];

  prerequisite_recommendations?: string[]; // Array of recommendation IDs

  is_ai_generated: boolean;
  user_notes?: string;
  marked_complete: boolean;

  created_at: string;
  updated_at: string;
}

export interface Roadmap {
  quick_wins: ReadinessRecommendation[]; // 0-3 months
  short_term: ReadinessRecommendation[]; // 3-6 months
  medium_term: ReadinessRecommendation[]; // 6-12 months
  long_term: ReadinessRecommendation[]; // 12+ months
}

// ============================================================================
// COMPLETE REPORT
// ============================================================================

export interface AIReadinessReport {
  assessment: AIReadinessAssessment;

  // Dimension details
  strategic: StrategicAlignmentResponse;
  data: DataMaturityResponse;
  tech: TechInfrastructureResponse;
  human: HumanCapitalResponse;
  process: ProcessMaturityResponse;
  change: ChangeReadinessResponse;

  // Analysis
  maturity_analysis: MaturityAnalysis;
  benchmark_comparisons: Record<DimensionType, BenchmarkComparison>;

  // Recommendations
  recommendations: ReadinessRecommendation[];
  roadmap: Roadmap;

  // Stakeholder data (if multi-stakeholder)
  stakeholder_invites?: StakeholderInvite[];
  stakeholder_responses?: StakeholderResponse[];
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface CreateAssessmentRequest {
  assessment_tier: AssessmentTier;
  company_name?: string;
  industry?: string;
  company_size?: string;
  is_multi_stakeholder?: boolean;
}

export interface CreateAssessmentResponse {
  assessment_id: string;
  success: boolean;
  message?: string;
}

export interface SaveAssessmentRequest {
  assessment_id: string;
  section: 'strategic' | 'data' | 'tech' | 'human' | 'process' | 'change';
  responses: Record<string, any>;
  is_draft?: boolean;
}

export interface CompleteAssessmentRequest {
  assessment_id: string;
  form_data: AIReadinessFormData;
}

export interface InviteStakeholderRequest {
  assessment_id: string;
  email: string;
  stakeholder_role: StakeholderRole;
  stakeholder_name?: string;
}

export interface GenerateReportRequest {
  assessment_id: string;
  include_benchmarks?: boolean;
  include_roadmap?: boolean;
}

export interface GenerateReportResponse {
  report_url: string;
  success: boolean;
  message?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface DimensionScore {
  dimension: DimensionType;
  score: number;
  weight: number;
  weighted_score: number;
}

export interface ScoreCalculation {
  dimension_scores: DimensionScore[];
  overall_score: number;
  maturity_level: MaturityLevel;
}

// Question metadata for dynamic rendering
export interface QuestionMeta {
  key: string;
  label: string;
  type: 'rating' | 'text' | 'textarea' | 'array';
  required: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  helpText?: string;
}

export interface SectionMeta {
  section: 'strategic' | 'data' | 'tech' | 'human' | 'process' | 'change';
  title: string;
  description: string;
  icon: string;
  order: number;
  questions: QuestionMeta[];
}
