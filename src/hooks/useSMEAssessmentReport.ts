import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  ExtendedAssessmentReport,
  SMERoadmapItem,
  SMERoadmapPhase,
  SMERoadmapMilestone,
  SMEROISummary,
  SMEROICostBreakdown,
  SMEROIBenefitBreakdown,
  SMENurturingCampaign,
} from '@/types/aiAssessment';

/**
 * Hook to fetch roadmap data separately for independent loading state
 */
export const useSMERoadmapData = (assessmentId: string | undefined) => {
  return useQuery({
    queryKey: ['sme-roadmap', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;

      const [itemsResult, phasesResult, milestonesResult] = await Promise.all([
        supabase
          .from('sme_roadmap_items')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('phase_order'),
        supabase.from('sme_roadmap_phases').select('*').eq('assessment_id', assessmentId),
        supabase
          .from('sme_roadmap_milestones')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('target_week'),
      ]);

      return {
        items: itemsResult.data as SMERoadmapItem[] | null,
        phases: phasesResult.data as SMERoadmapPhase[] | null,
        milestones: milestonesResult.data as SMERoadmapMilestone[] | null,
      };
    },
    enabled: !!assessmentId,
  });
};

/**
 * Hook to fetch ROI data separately for independent loading state
 */
export const useSMEROIData = (assessmentId: string | undefined) => {
  return useQuery({
    queryKey: ['sme-roi', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;

      const [summaryResult, costsResult, benefitsResult] = await Promise.all([
        supabase.from('sme_roi_summary').select('*').eq('assessment_id', assessmentId).single(),
        supabase.from('sme_roi_cost_breakdown').select('*').eq('assessment_id', assessmentId),
        supabase.from('sme_roi_benefit_breakdown').select('*').eq('assessment_id', assessmentId),
      ]);

      return {
        summary: summaryResult.data as SMEROISummary | null,
        costs: costsResult.data as SMEROICostBreakdown[] | null,
        benefits: benefitsResult.data as SMEROIBenefitBreakdown[] | null,
      };
    },
    enabled: !!assessmentId,
  });
};

/**
 * Hook to fetch nurturing campaign data separately for independent loading state
 */
export const useSMENurturingData = (assessmentId: string | undefined) => {
  return useQuery({
    queryKey: ['sme-nurturing', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;

      const { data } = await supabase
        .from('sme_nurturing_campaigns')
        .select('*, sme_nurturing_emails(*)')
        .eq('assessment_id', assessmentId)
        .single();

      return data as SMENurturingCampaign | null;
    },
    enabled: !!assessmentId,
  });
};

/**
 * Main hook to fetch core assessment data
 */
export const useSMEAssessmentReport = (assessmentId: string | undefined) => {
  return useQuery({
    queryKey: ['sme-assessment-report', assessmentId],
    queryFn: async (): Promise<ExtendedAssessmentReport | null> => {
      if (!assessmentId) {
        throw new Error('Assessment ID is required');
      }

      try {
        // Fetch main assessment
        const { data: assessment, error: assessmentError } = await supabase
          .from('ai_opportunity_assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();

        if (assessmentError) throw assessmentError;
        if (!assessment) return null;

        // Fetch all related data in parallel
        const [
          painPointsResult,
          userImpactsResult,
          benefitsResult,
          risksResult,
          resourcesResult,
          competitorsResult,
          actionPlanResult,
          roadmapItemsResult,
          roadmapPhasesResult,
          roadmapMilestonesResult,
          roiSummaryResult,
          roiCostsResult,
          roiBenefitsResult,
          nurturingCampaignResult,
        ] = await Promise.all([
          supabase.from('assessment_pain_points').select('*').eq('assessment_id', assessmentId),
          supabase.from('assessment_user_impacts').select('*').eq('assessment_id', assessmentId),
          supabase.from('assessment_benefits').select('*').eq('assessment_id', assessmentId),
          supabase.from('assessment_risks').select('*').eq('assessment_id', assessmentId),
          supabase.from('assessment_resources').select('*').eq('assessment_id', assessmentId),
          supabase.from('assessment_competitors').select('*').eq('assessment_id', assessmentId),
          supabase
            .from('assessment_action_plans')
            .select('*')
            .eq('assessment_id', assessmentId)
            .single(),
          // New: Roadmap data
          supabase
            .from('sme_roadmap_items')
            .select('*')
            .eq('assessment_id', assessmentId)
            .order('phase_order'),
          supabase.from('sme_roadmap_phases').select('*').eq('assessment_id', assessmentId),
          supabase
            .from('sme_roadmap_milestones')
            .select('*')
            .eq('assessment_id', assessmentId)
            .order('target_week'),
          // New: ROI data
          supabase.from('sme_roi_summary').select('*').eq('assessment_id', assessmentId).single(),
          supabase.from('sme_roi_cost_breakdown').select('*').eq('assessment_id', assessmentId),
          supabase.from('sme_roi_benefit_breakdown').select('*').eq('assessment_id', assessmentId),
          // New: Nurturing campaign data
          supabase
            .from('sme_nurturing_campaigns')
            .select('*, sme_nurturing_emails(*)')
            .eq('assessment_id', assessmentId)
            .single(),
        ]);

        // Check for errors (basic data)
        if (painPointsResult.error) throw painPointsResult.error;
        if (userImpactsResult.error) throw userImpactsResult.error;
        if (benefitsResult.error) throw benefitsResult.error;
        if (risksResult.error) throw risksResult.error;
        if (resourcesResult.error) throw resourcesResult.error;
        if (competitorsResult.error) throw competitorsResult.error;

        // Check for errors (new data) - but don't fail if optional data is missing
        if (roadmapItemsResult.error && roadmapItemsResult.error.code !== 'PGRST116') {
          logger.warn('Error fetching roadmap items:', roadmapItemsResult.error);
        }
        if (roadmapPhasesResult.error && roadmapPhasesResult.error.code !== 'PGRST116') {
          logger.warn('Error fetching roadmap phases:', roadmapPhasesResult.error);
        }
        if (roadmapMilestonesResult.error && roadmapMilestonesResult.error.code !== 'PGRST116') {
          logger.warn('Error fetching roadmap milestones:', roadmapMilestonesResult.error);
        }
        if (roiCostsResult.error && roiCostsResult.error.code !== 'PGRST116') {
          logger.warn('Error fetching ROI costs:', roiCostsResult.error);
        }
        if (roiBenefitsResult.error && roiBenefitsResult.error.code !== 'PGRST116') {
          logger.warn('Error fetching ROI benefits:', roiBenefitsResult.error);
        }

        return {
          assessment,
          painPoints: painPointsResult.data || [],
          userImpacts: userImpactsResult.data || [],
          benefits: benefitsResult.data || [],
          risks: risksResult.data || [],
          resources: resourcesResult.data || [],
          competitors: competitorsResult.data || [],
          actionPlan: actionPlanResult.data || undefined,
          stakeholders: [], // Not implemented yet
          // New: Roadmap data
          roadmapItems: roadmapItemsResult.data || undefined,
          roadmapPhases: roadmapPhasesResult.data || undefined,
          roadmapMilestones: roadmapMilestonesResult.data || undefined,
          // New: ROI data
          roiSummary: roiSummaryResult.data || undefined,
          roiCosts: roiCostsResult.data || undefined,
          roiBenefits: roiBenefitsResult.data || undefined,
          // New: Nurturing campaign data
          nurturingCampaign: nurturingCampaignResult.data || undefined,
        };
      } catch (_error) {
        logger.error('Error fetching SME assessment report:', _error);
        throw error;
      }
    },
    enabled: !!assessmentId,
  });
};
