/**
 * Hook for fetching at-risk learners data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AtRiskLearner {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  course_id: number | null;
  course_title: string | null;
  risk_score: number | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  dropout_probability: number | null;
  engagement_score: number | null;
  engagement_trend: string | null;
  severity: string;
  status: string;
  triggered_at: string;
  days_since_alert: number;
  contributing_factors: string[];
  interventions_attempted: number;
  last_intervention_date: string | null;
}

export function useAtRiskLearners() {
  return useQuery({
    queryKey: ['at-risk-learners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('at_risk_learners_summary')
        .select('*')
        .order('risk_score', { ascending: false });

      if (error) throw error;
      return data as AtRiskLearner[];
    },
  });
}
