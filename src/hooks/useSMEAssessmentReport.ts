import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AssessmentReport } from '@/types/aiAssessment';

export const useSMEAssessmentReport = (assessmentId: string | undefined) => {
  return useQuery({
    queryKey: ['sme-assessment-report', assessmentId],
    queryFn: async (): Promise<AssessmentReport | null> => {
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
        ]);

        // Check for errors
        if (painPointsResult.error) throw painPointsResult.error;
        if (userImpactsResult.error) throw userImpactsResult.error;
        if (benefitsResult.error) throw benefitsResult.error;
        if (risksResult.error) throw risksResult.error;
        if (resourcesResult.error) throw resourcesResult.error;
        if (competitorsResult.error) throw competitorsResult.error;

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
        };
      } catch (error) {
        logger.error('Error fetching SME assessment report:', error);
        throw error;
      }
    },
    enabled: !!assessmentId,
  });
};
