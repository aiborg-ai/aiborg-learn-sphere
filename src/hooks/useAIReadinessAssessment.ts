// ============================================================================
// AI-Readiness Assessment Hooks
// React Query hooks for managing AI-Readiness assessments
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  AIReadinessAssessment,
  AIReadinessFormData,
  DimensionType,
} from '@/types/aiReadiness';
import { calculateScores } from '@/services/ai-readiness/ScoringEngine';
import { createAllBenchmarkComparisons } from '@/services/ai-readiness/BenchmarkingService';
import { generateRecommendations } from '@/services/ai-readiness/RecommendationGenerator';

// ============================================================================
// CREATE ASSESSMENT
// ============================================================================

export interface CreateAssessmentParams {
  company_name?: string;
  industry?: string;
  company_size?: string;
  assessment_tier?: 'freemium' | 'premium' | 'enterprise';
  is_multi_stakeholder?: boolean;
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAssessmentParams) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_readiness_assessments')
        .insert({
          user_id: user.id,
          company_name: params.company_name,
          industry: params.industry,
          company_size: params.company_size,
          assessment_tier: params.assessment_tier || 'freemium',
          is_multi_stakeholder: params.is_multi_stakeholder || false,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data as AIReadinessAssessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-readiness-assessments'] });
    },
  });
}

// ============================================================================
// FETCH ASSESSMENT
// ============================================================================

export function useAssessment(assessmentId: string | null) {
  return useQuery({
    queryKey: ['ai-readiness-assessment', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;

      const { data, error } = await supabase
        .from('ai_readiness_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (error) throw error;
      return data as AIReadinessAssessment;
    },
    enabled: !!assessmentId,
  });
}

// ============================================================================
// SAVE SECTION
// ============================================================================

export interface SaveSectionParams {
  assessmentId: string;
  section: DimensionType;
  responses: Record<string, unknown>;
}

export function useSaveSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assessmentId, section, responses }: SaveSectionParams) => {
      // Map section to table name
      const tableMap: Record<DimensionType, string> = {
        overall: 'ai_readiness_assessments',
        strategic: 'readiness_strategic_alignment',
        data: 'readiness_data_maturity',
        tech: 'readiness_tech_infrastructure',
        human: 'readiness_human_capital',
        process: 'readiness_process_maturity',
        change: 'readiness_change_readiness',
      };

      const tableName = tableMap[section];
      if (!tableName || section === 'overall') {
        throw new Error(`Invalid section: ${section}`);
      }

      // Check if record exists
      const { data: existing } = await supabase
        .from(tableName)
        .select('id')
        .eq('assessment_id', assessmentId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from(tableName)
          .update(responses)
          .eq('assessment_id', assessmentId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from(tableName).insert({
          assessment_id: assessmentId,
          ...responses,
        });

        if (error) throw error;
      }

      // Update last modified on main assessment
      const { error: updateError } = await supabase
        .from('ai_readiness_assessments')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', assessmentId);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['ai-readiness-assessment', variables.assessmentId],
      });
    },
  });
}

// ============================================================================
// COMPLETE ASSESSMENT
// ============================================================================

export interface CompleteAssessmentParams {
  assessmentId: string;
  formData: AIReadinessFormData;
}

export function useCompleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assessmentId, formData }: CompleteAssessmentParams) => {
      // Calculate scores
      const scoreCalculation = calculateScores(formData);

      // Fetch benchmarks for comparison
      const { data: assessment } = await supabase
        .from('ai_readiness_assessments')
        .select('industry, company_size')
        .eq('id', assessmentId)
        .single();

      const industry = assessment?.industry || 'technology';
      const companySize = assessment?.company_size || '1-50';

      // Fetch benchmark data
      const { data: benchmarksData } = await supabase
        .from('readiness_benchmarks')
        .select('*')
        .eq('industry', industry)
        .eq('company_size', companySize);

      // Create benchmark map
      const benchmarks: Record<DimensionType, any> = {
        overall: benchmarksData?.find(b => b.dimension === 'overall'),
        strategic: benchmarksData?.find(b => b.dimension === 'strategic'),
        data: benchmarksData?.find(b => b.dimension === 'data'),
        tech: benchmarksData?.find(b => b.dimension === 'tech'),
        human: benchmarksData?.find(b => b.dimension === 'human'),
        process: benchmarksData?.find(b => b.dimension === 'process'),
        change: benchmarksData?.find(b => b.dimension === 'change'),
      };

      // Create benchmark comparisons
      const benchmarkComparisons = createAllBenchmarkComparisons(
        scoreCalculation.dimension_scores,
        benchmarks,
        scoreCalculation.overall_score
      );

      // Generate recommendations
      const recommendations = generateRecommendations(
        scoreCalculation.dimension_scores,
        benchmarkComparisons
      );

      // Update main assessment with scores
      const { error: updateError } = await supabase
        .from('ai_readiness_assessments')
        .update({
          overall_readiness_score: scoreCalculation.overall_score,
          maturity_level: scoreCalculation.maturity_level,
          strategic_alignment_score: scoreCalculation.dimension_scores.find(
            d => d.dimension === 'strategic'
          )?.score,
          data_maturity_score: scoreCalculation.dimension_scores.find(d => d.dimension === 'data')
            ?.score,
          tech_infrastructure_score: scoreCalculation.dimension_scores.find(
            d => d.dimension === 'tech'
          )?.score,
          human_capital_score: scoreCalculation.dimension_scores.find(d => d.dimension === 'human')
            ?.score,
          process_maturity_score: scoreCalculation.dimension_scores.find(
            d => d.dimension === 'process'
          )?.score,
          change_readiness_score: scoreCalculation.dimension_scores.find(
            d => d.dimension === 'change'
          )?.score,
          industry_percentile: benchmarkComparisons.overall?.percentile_rank,
          size_percentile: benchmarkComparisons.overall?.percentile_rank,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', assessmentId);

      if (updateError) throw updateError;

      // Save recommendations
      if (recommendations.length > 0) {
        const recommendationsWithAssessmentId = recommendations.map(rec => ({
          ...rec,
          assessment_id: assessmentId,
        }));

        const { error: recError } = await supabase
          .from('readiness_recommendations')
          .insert(recommendationsWithAssessmentId);

        if (recError) throw recError;
      }

      return { success: true, assessmentId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['ai-readiness-assessment', variables.assessmentId],
      });
      queryClient.invalidateQueries({ queryKey: ['ai-readiness-assessments'] });
    },
  });
}

// ============================================================================
// FETCH USER ASSESSMENTS
// ============================================================================

export function useUserAssessments() {
  return useQuery({
    queryKey: ['ai-readiness-assessments'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_readiness_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIReadinessAssessment[];
    },
  });
}
