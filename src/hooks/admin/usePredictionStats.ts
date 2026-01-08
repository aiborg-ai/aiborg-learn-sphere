/**
 * Hook for fetching prediction statistics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PredictionStats {
  atRiskCount: number;
  criticalCount: number;
  decliningEngagement: number;
  activeInterventions: number;
  modelAccuracy: number;
}

export function usePredictionStats() {
  return useQuery({
    queryKey: ['prediction-stats'],
    queryFn: async (): Promise<PredictionStats> => {
      // Fetch at-risk count
      const { count: atRiskCount } = await supabase
        .from('at_risk_alerts')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'investigating']);

      // Fetch critical count
      const { count: criticalCount } = await supabase
        .from('at_risk_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .in('status', ['open', 'investigating']);

      // Fetch declining engagement count
      const { count: decliningCount } = await supabase
        .from('learner_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'engagement')
        .in('engagement_trend', ['declining', 'critical']);

      // Fetch active interventions count
      const { count: interventionsCount } = await supabase
        .from('learner_interventions')
        .select('*', { count: 'exact', head: true })
        .is('completed_at', null);

      return {
        atRiskCount: atRiskCount || 0,
        criticalCount: criticalCount || 0,
        decliningEngagement: decliningCount || 0,
        activeInterventions: interventionsCount || 0,
        modelAccuracy: 0, // To be calculated from model_performance table
      };
    },
  });
}
