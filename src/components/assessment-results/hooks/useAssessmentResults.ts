import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AssessmentResult, CategoryInsight, Benchmark, Tool } from '../types';

interface UseAssessmentResultsReturn {
  loading: boolean;
  assessment: AssessmentResult | null;
  insights: CategoryInsight[];
  benchmarks: Benchmark[];
  toolRecommendations: Tool[];
  fetchResults: () => Promise<void>;
}

export function useAssessmentResults(assessmentId: string | undefined): UseAssessmentResultsReturn {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [toolRecommendations, setToolRecommendations] = useState<Tool[]>([]);

  const fetchResults = async () => {
    if (!assessmentId) return;

    try {
      setLoading(true);

      // Fetch assessment result
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('user_ai_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Fetch category insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('assessment_insights')
        .select(
          `
          *,
          assessment_categories (
            name,
            icon
          )
        `
        )
        .eq('assessment_id', assessmentId);

      if (insightsError) throw insightsError;

      const processedInsights =
        insightsData?.map(insight => ({
          category_name: insight.assessment_categories?.name || 'Unknown',
          category_score: insight.category_score,
          category_max_score: insight.category_max_score,
          strength_level: insight.strength_level,
          recommendations: insight.recommendations || [],
          percentage: (insight.category_score / insight.category_max_score) * 100,
        })) || [];

      setInsights(processedInsights);

      // Fetch benchmark comparisons
      if (assessmentData.audience_type) {
        const { data: benchmarkData } = await supabase
          .from('assessment_benchmarks')
          .select('*')
          .eq('audience_type', assessmentData.audience_type);

        // Calculate user's percentile for each category
        const benchmarkComparisons = processedInsights.map(insight => {
          const benchmark = benchmarkData?.find(
            b =>
              b.category_id ===
              insightsData?.find(i => i.assessment_categories?.name === insight.category_name)
                ?.category_id
          );

          let percentile = 50;
          if (benchmark) {
            if (insight.percentage >= benchmark.percentile_90) percentile = 95;
            else if (insight.percentage >= benchmark.percentile_75) percentile = 85;
            else if (insight.percentage >= benchmark.median_score) percentile = 60;
            else if (insight.percentage >= benchmark.percentile_25) percentile = 35;
            else percentile = 15;
          }

          return {
            category_name: insight.category_name,
            user_score: insight.percentage,
            average_score: benchmark?.average_score || 50,
            percentile,
          };
        });

        setBenchmarks(benchmarkComparisons);
      }

      // Fetch tool recommendations based on weak areas
      const weakAreas = processedInsights.filter(
        i => i.strength_level === 'weak' || i.strength_level === 'developing'
      );

      if (weakAreas.length > 0) {
        // Fetch recommended tools for improvement
        const { data: toolsData } = await supabase
          .from('ai_tools')
          .select('name, description, website_url, difficulty_level')
          .eq('is_active', true)
          .eq('difficulty_level', 'beginner')
          .limit(5);

        setToolRecommendations(toolsData || []);
      }
    } catch (_error) {
      logger._error('Error fetching assessment results:', _error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    assessment,
    insights,
    benchmarks,
    toolRecommendations,
    fetchResults,
  };
}
