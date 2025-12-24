// ============================================================================
// AI Readiness Assessment Zod Schemas
// Runtime validation for forms and API requests
// ============================================================================

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const assessmentTierSchema = z.enum(['freemium', 'premium', 'enterprise']);

export const maturityLevelSchema = z.enum([
  'awareness',
  'experimenting',
  'adopting',
  'optimizing',
  'leading',
]);

export const stakeholderRoleSchema = z.enum([
  'ceo',
  'cto',
  'cfo',
  'operations',
  'hr',
  'marketing',
  'it',
  'other',
]);

export const recommendationPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const recommendationTimeframeSchema = z.enum([
  'quick_win',
  'short_term',
  'medium_term',
  'long_term',
]);

export const dimensionTypeSchema = z.enum([
  'overall',
  'strategic',
  'data',
  'tech',
  'human',
  'process',
  'change',
]);

// ============================================================================
// RATING SCALE VALIDATOR
// ============================================================================

// 1-5 rating scale (required for most questions)
export const ratingSchema = z
  .number()
  .int()
  .min(1, 'Rating must be between 1 and 5')
  .max(5, 'Rating must be between 1 and 5');

// Optional rating (for partial saves)
export const optionalRatingSchema = ratingSchema.optional();

// ============================================================================
// DIMENSION RESPONSE SCHEMAS
// ============================================================================

export const strategicAlignmentSchema = z.object({
  executive_buy_in: optionalRatingSchema,
  budget_allocated: optionalRatingSchema,
  clear_use_cases: optionalRatingSchema,
  kpis_defined: optionalRatingSchema,
  change_champions: optionalRatingSchema,
  competitive_pressure: optionalRatingSchema,
  innovation_culture: optionalRatingSchema,
  strategic_roadmap: optionalRatingSchema,
  roi_expectations: z.string().max(500).optional(),
  priority_use_cases: z.array(z.string().max(200)).max(10).optional(),
});

export const dataMaturitySchema = z.object({
  data_quality: optionalRatingSchema,
  data_accessibility: optionalRatingSchema,
  data_governance: optionalRatingSchema,
  data_documentation: optionalRatingSchema,
  privacy_compliance: optionalRatingSchema,
  security_posture: optionalRatingSchema,
  data_integration: optionalRatingSchema,
  master_data_mgmt: optionalRatingSchema,
  data_volume_adequacy: optionalRatingSchema,
  data_silos: optionalRatingSchema,
  key_data_sources: z.array(z.string().max(100)).max(15).optional(),
  data_challenges: z.string().max(500).optional(),
});

export const techInfrastructureSchema = z.object({
  cloud_readiness: optionalRatingSchema,
  it_systems_capability: optionalRatingSchema,
  api_availability: optionalRatingSchema,
  security_infrastructure: optionalRatingSchema,
  scalability: optionalRatingSchema,
  integration_capability: optionalRatingSchema,
  vendor_ecosystem: optionalRatingSchema,
  it_support_capacity: optionalRatingSchema,
  current_tech_stack: z.string().max(500).optional(),
  planned_upgrades: z.array(z.string().max(200)).max(10).optional(),
});

export const humanCapitalSchema = z.object({
  executive_ai_literacy: optionalRatingSchema,
  technical_team_skills: optionalRatingSchema,
  business_team_literacy: optionalRatingSchema,
  training_budget: optionalRatingSchema,
  hiring_capability: optionalRatingSchema,
  external_expertise: optionalRatingSchema,
  learning_culture: optionalRatingSchema,
  skills_gap_awareness: optionalRatingSchema,
  retention_capability: optionalRatingSchema,
  change_management: optionalRatingSchema,
  critical_skill_gaps: z.array(z.string().max(100)).max(15).optional(),
  training_priorities: z.string().max(500).optional(),
});

export const processMaturitySchema = z.object({
  process_documentation: optionalRatingSchema,
  process_standardization: optionalRatingSchema,
  automation_level: optionalRatingSchema,
  performance_metrics: optionalRatingSchema,
  continuous_improvement: optionalRatingSchema,
  workflow_efficiency: optionalRatingSchema,
  decision_making_speed: optionalRatingSchema,
  quality_control: optionalRatingSchema,
  automation_opportunities: z.array(z.string().max(200)).max(10).optional(),
  process_pain_points: z.string().max(500).optional(),
});

export const changeReadinessSchema = z.object({
  leadership_commitment: optionalRatingSchema,
  employee_sentiment: optionalRatingSchema,
  communication_plan: optionalRatingSchema,
  pilot_approach: optionalRatingSchema,
  risk_tolerance: optionalRatingSchema,
  change_history: optionalRatingSchema,
  resistance_management: optionalRatingSchema,
  success_celebration: optionalRatingSchema,
  anticipated_resistance: z.string().max(500).optional(),
  mitigation_strategies: z.array(z.string().max(200)).max(10).optional(),
});

// ============================================================================
// COMPLETE FORM DATA SCHEMA
// ============================================================================

export const aiReadinessFormDataSchema = z.object({
  strategic: strategicAlignmentSchema,
  data: dataMaturitySchema,
  tech: techInfrastructureSchema,
  human: humanCapitalSchema,
  process: processMaturitySchema,
  change: changeReadinessSchema,
});

// Strict version for final submission (all ratings required)
export const aiReadinessFormDataStrictSchema = z.object({
  strategic: z.object({
    executive_buy_in: ratingSchema,
    budget_allocated: ratingSchema,
    clear_use_cases: ratingSchema,
    kpis_defined: ratingSchema,
    change_champions: ratingSchema,
    competitive_pressure: ratingSchema,
    innovation_culture: ratingSchema,
    strategic_roadmap: ratingSchema,
    roi_expectations: z.string().max(500).optional(),
    priority_use_cases: z.array(z.string().max(200)).max(10).optional(),
  }),
  data: z.object({
    data_quality: ratingSchema,
    data_accessibility: ratingSchema,
    data_governance: ratingSchema,
    data_documentation: ratingSchema,
    privacy_compliance: ratingSchema,
    security_posture: ratingSchema,
    data_integration: ratingSchema,
    master_data_mgmt: ratingSchema,
    data_volume_adequacy: ratingSchema,
    data_silos: ratingSchema,
    key_data_sources: z.array(z.string().max(100)).max(15).optional(),
    data_challenges: z.string().max(500).optional(),
  }),
  tech: z.object({
    cloud_readiness: ratingSchema,
    it_systems_capability: ratingSchema,
    api_availability: ratingSchema,
    security_infrastructure: ratingSchema,
    scalability: ratingSchema,
    integration_capability: ratingSchema,
    vendor_ecosystem: ratingSchema,
    it_support_capacity: ratingSchema,
    current_tech_stack: z.string().max(500).optional(),
    planned_upgrades: z.array(z.string().max(200)).max(10).optional(),
  }),
  human: z.object({
    executive_ai_literacy: ratingSchema,
    technical_team_skills: ratingSchema,
    business_team_literacy: ratingSchema,
    training_budget: ratingSchema,
    hiring_capability: ratingSchema,
    external_expertise: ratingSchema,
    learning_culture: ratingSchema,
    skills_gap_awareness: ratingSchema,
    retention_capability: ratingSchema,
    change_management: ratingSchema,
    critical_skill_gaps: z.array(z.string().max(100)).max(15).optional(),
    training_priorities: z.string().max(500).optional(),
  }),
  process: z.object({
    process_documentation: ratingSchema,
    process_standardization: ratingSchema,
    automation_level: ratingSchema,
    performance_metrics: ratingSchema,
    continuous_improvement: ratingSchema,
    workflow_efficiency: ratingSchema,
    decision_making_speed: ratingSchema,
    quality_control: ratingSchema,
    automation_opportunities: z.array(z.string().max(200)).max(10).optional(),
    process_pain_points: z.string().max(500).optional(),
  }),
  change: z.object({
    leadership_commitment: ratingSchema,
    employee_sentiment: ratingSchema,
    communication_plan: ratingSchema,
    pilot_approach: ratingSchema,
    risk_tolerance: ratingSchema,
    change_history: ratingSchema,
    resistance_management: ratingSchema,
    success_celebration: ratingSchema,
    anticipated_resistance: z.string().max(500).optional(),
    mitigation_strategies: z.array(z.string().max(200)).max(10).optional(),
  }),
});

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const createAssessmentRequestSchema = z.object({
  assessment_tier: assessmentTierSchema,
  company_name: z.string().min(1).max(255).optional(),
  industry: z.string().max(100).optional(),
  company_size: z.string().max(50).optional(),
  is_multi_stakeholder: z.boolean().optional(),
});

export const saveAssessmentRequestSchema = z.object({
  assessment_id: z.string().uuid(),
  section: z.enum(['strategic', 'data', 'tech', 'human', 'process', 'change']),
  responses: z.record(z.any()),
  is_draft: z.boolean().optional(),
});

export const completeAssessmentRequestSchema = z.object({
  assessment_id: z.string().uuid(),
  form_data: aiReadinessFormDataStrictSchema,
});

export const inviteStakeholderRequestSchema = z.object({
  assessment_id: z.string().uuid(),
  email: z.string().email('Invalid email address'),
  stakeholder_role: stakeholderRoleSchema,
  stakeholder_name: z.string().max(255).optional(),
});

export const generateReportRequestSchema = z.object({
  assessment_id: z.string().uuid(),
  include_benchmarks: z.boolean().optional(),
  include_roadmap: z.boolean().optional(),
});

// ============================================================================
// FREEMIUM FORM SCHEMA (Subset of questions)
// ============================================================================

// Freemium: 5 questions per dimension (30 total)
export const freemiumFormDataSchema = z.object({
  strategic: z.object({
    executive_buy_in: ratingSchema,
    budget_allocated: ratingSchema,
    clear_use_cases: ratingSchema,
    innovation_culture: ratingSchema,
    strategic_roadmap: ratingSchema,
  }),
  data: z.object({
    data_quality: ratingSchema,
    data_accessibility: ratingSchema,
    data_governance: ratingSchema,
    privacy_compliance: ratingSchema,
    security_posture: ratingSchema,
  }),
  tech: z.object({
    cloud_readiness: ratingSchema,
    it_systems_capability: ratingSchema,
    api_availability: ratingSchema,
    security_infrastructure: ratingSchema,
    scalability: ratingSchema,
  }),
  human: z.object({
    executive_ai_literacy: ratingSchema,
    technical_team_skills: ratingSchema,
    training_budget: ratingSchema,
    learning_culture: ratingSchema,
    change_management: ratingSchema,
  }),
  process: z.object({
    process_documentation: ratingSchema,
    automation_level: ratingSchema,
    performance_metrics: ratingSchema,
    continuous_improvement: ratingSchema,
    workflow_efficiency: ratingSchema,
  }),
  change: z.object({
    leadership_commitment: ratingSchema,
    employee_sentiment: ratingSchema,
    communication_plan: ratingSchema,
    risk_tolerance: ratingSchema,
    change_history: ratingSchema,
  }),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateSection(
  section: 'strategic' | 'data' | 'tech' | 'human' | 'process' | 'change',
  data: any
): { success: boolean; errors?: Record<string, string[]> } {
  const schemas = {
    strategic: strategicAlignmentSchema,
    data: dataMaturitySchema,
    tech: techInfrastructureSchema,
    human: humanCapitalSchema,
    process: processMaturitySchema,
    change: changeReadinessSchema,
  };

  const result = schemas[section].safeParse(data);

  if (result.success) {
    return { success: true };
  }

  const errors: Record<string, string[]> = {};
  result.error.issues.forEach(issue => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  });

  return { success: false, errors };
}

export function calculateCompletionPercentage(
  formData: Partial<z.infer<typeof aiReadinessFormDataSchema>>
): number {
  let totalQuestions = 0;
  let answeredQuestions = 0;

  // Count strategic questions
  if (formData.strategic) {
    const questions = Object.keys(formData.strategic);
    totalQuestions += 8; // Number of rating questions
    answeredQuestions += questions.filter(
      q => formData.strategic?.[q as keyof typeof formData.strategic] !== undefined
    ).length;
  }

  // Count data questions
  if (formData.data) {
    const questions = Object.keys(formData.data);
    totalQuestions += 10; // Number of rating questions
    answeredQuestions += questions.filter(
      q => formData.data?.[q as keyof typeof formData.data] !== undefined
    ).length;
  }

  // Count tech questions
  if (formData.tech) {
    const questions = Object.keys(formData.tech);
    totalQuestions += 8;
    answeredQuestions += questions.filter(
      q => formData.tech?.[q as keyof typeof formData.tech] !== undefined
    ).length;
  }

  // Count human questions
  if (formData.human) {
    const questions = Object.keys(formData.human);
    totalQuestions += 10;
    answeredQuestions += questions.filter(
      q => formData.human?.[q as keyof typeof formData.human] !== undefined
    ).length;
  }

  // Count process questions
  if (formData.process) {
    const questions = Object.keys(formData.process);
    totalQuestions += 8;
    answeredQuestions += questions.filter(
      q => formData.process?.[q as keyof typeof formData.process] !== undefined
    ).length;
  }

  // Count change questions
  if (formData.change) {
    const questions = Object.keys(formData.change);
    totalQuestions += 8;
    answeredQuestions += questions.filter(
      q => formData.change?.[q as keyof typeof formData.change] !== undefined
    ).length;
  }

  return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
}
