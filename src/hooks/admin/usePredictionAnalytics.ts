/**
 * Hook for fetching prediction analytics data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PredictionAnalytics {
  engagementIncreasing: number;
  engagementStable: number;
  engagementDeclining: number;
  engagementCritical: number;
  completionHigh: number;
  completionMedium: number;
  completionLow: number;
  avgCompletionDays: number;
  riskCritical: number;
  riskHigh: number;
  riskMedium: number;
  riskLow: number;
}

export function usePredictionAnalytics() {
  return useQuery({
    queryKey: ['prediction-analytics'],
    queryFn: async (): Promise<PredictionAnalytics> => {
      // Engagement trends
      const { count: increasing } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'engagement')
        .eq('engagement_trend', 'increasing');

      const { count: stable } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'engagement')
        .eq('engagement_trend', 'stable');

      const { count: declining } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'engagement')
        .eq('engagement_trend', 'declining');

      const { count: critical } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'engagement')
        .eq('engagement_trend', 'critical');

      // Completion predictions
      const { count: completionHigh } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'completion')
        .gte('completion_probability', 75);

      const { count: completionMedium } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'completion')
        .gte('completion_probability', 50)
        .lt('completion_probability', 75);

      const { count: completionLow } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'completion')
        .lt('completion_probability', 50);

      // Risk distribution
      const { count: riskCritical } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'at_risk')
        .eq('risk_level', 'critical');

      const { count: riskHigh } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'at_risk')
        .eq('risk_level', 'high');

      const { count: riskMedium } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'at_risk')
        .eq('risk_level', 'medium');

      const { count: riskLow } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'at_risk')
        .eq('risk_level', 'low');

      return {
        engagementIncreasing: increasing || 0,
        engagementStable: stable || 0,
        engagementDeclining: declining || 0,
        engagementCritical: critical || 0,
        completionHigh: completionHigh || 0,
        completionMedium: completionMedium || 0,
        completionLow: completionLow || 0,
        avgCompletionDays: 0, // Calculate from actual data
        riskCritical: riskCritical || 0,
        riskHigh: riskHigh || 0,
        riskMedium: riskMedium || 0,
        riskLow: riskLow || 0,
      };
    },
  });
}
