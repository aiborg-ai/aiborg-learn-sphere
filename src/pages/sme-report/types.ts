import type {
  AIOpportunityAssessment,
  AssessmentPainPoint,
  AssessmentUserImpact,
  AssessmentBenefit,
  AssessmentRisk,
  AssessmentResource,
  AssessmentCompetitor,
  AssessmentActionPlan,
} from '@/types/aiAssessment';

export interface ReportSectionProps {
  assessment: AIOpportunityAssessment;
}

export interface PainPointsSectionProps {
  painPoints: AssessmentPainPoint[];
}

export interface UserImpactsSectionProps {
  userImpacts: AssessmentUserImpact[];
}

export interface BenefitsSectionProps {
  benefits: AssessmentBenefit[];
}

export interface RisksSectionProps {
  risks: AssessmentRisk[];
}

export interface ResourcesSectionProps {
  resources: AssessmentResource[];
}

export interface CompetitorsSectionProps {
  competitors: AssessmentCompetitor[];
}

export interface ActionPlanSectionProps {
  actionPlan?: AssessmentActionPlan;
}

export interface ExecutiveSummaryProps {
  assessment: AIOpportunityAssessment;
  painPoints: AssessmentPainPoint[];
  benefits: AssessmentBenefit[];
  risks: AssessmentRisk[];
}

export interface ReportHeaderProps {
  companyName: string;
  onShare: () => void;
  onPrint: () => void;
  onExportPDF: () => void;
  isExportingPDF: boolean;
}

export interface PrintHeaderProps {
  companyName: string;
  completedAt: string;
}

export interface MetadataSectionProps {
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
  assessmentId: string;
}

export interface CallToActionProps {
  onViewPrograms: () => void;
}
