/**
 * Analytics Service
 * Provides advanced analytics, insights, and AI-powered recommendations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface LearningVelocityMetrics {
  abilityChange: number;
  learningRate: number;
  improvementTrend: 'accelerating' | 'steady' | 'plateauing' | 'declining';
  timeToNextLevel: number;
  streakDays: number;
  engagementScore: number;
  recentAccuracy: number;
}

export interface SkillGap {
  categoryName: string;
  currentProficiency: number;
  targetProficiency: number;
  gapSize: number;
  priorityScore: number;
  predictedProficiency30d: number;
  predictedProficiency90d: number;
  estimatedHoursToClose: number;
  recommendedAction: string;
  businessImpact: 'critical' | 'high' | 'medium' | 'low';
}

export interface CompetencySnapshot {
  id: string;
  userId: string;
  competencyMatrix: Record<string, {
    score: number;
    percentile: number;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
  overallCompetency: number;
  overallPercentile: number;
  topStrengths: string[];
  topWeaknesses: string[];
  snapshotDate: string;
}

export interface AIRecommendation {
  id: string;
  userId: string;
  recommendationType: 'course' | 'practice' | 'resource' | 'strategy';
  categoryId?: string;
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: string;
  confidenceScore: number;
  relevanceScore: number;
  urgency: 'immediate' | 'short_term' | 'long_term';
  resourceUrl?: string;
  estimatedTimeMinutes: number;
  difficultyLevel: string;
  viewedAt?: string;
  clickedAt?: string;
  completedAt?: string;
  dismissedAt?: string;
  feedbackRating?: number;
}

export interface PerformanceBenchmark {
  benchmarkType: string;
  dimension: string;
  audienceType: string;
  sampleSize: number;
  meanScore: number;
  medianScore: number;
  stdDeviation: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
  percentile95: number;
}

export class AnalyticsService {
  /**
   * Calculate learning velocity for a user
   */
  static async calculateLearningVelocity(userId: string): Promise<LearningVelocityMetrics | null> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_learning_velocity', { p_user_id: userId });

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];

      // Get additional metrics from recent assessments
      const { data: assessments } = await supabase
        .from('user_ai_assessments')
        .select('*')
        .eq('user_id', userId)
        .eq('is_complete', true)
        .order('completed_at', { ascending: false })
        .limit(10);

      const recentAccuracy = assessments?.length
        ? assessments.reduce((acc, a) => acc + (a.total_score / a.max_possible_score || 0), 0) / assessments.length * 100
        : 0;

      return {
        abilityChange: result.ability_change || 0,
        learningRate: result.learning_rate || 0,
        improvementTrend: result.improvement_trend || 'steady',
        timeToNextLevel: result.time_to_next_level || 999,
        streakDays: 0, // Calculate from assessment dates
        engagementScore: recentAccuracy,
        recentAccuracy,
      };
    } catch (error) {
      logger.error('Error calculating learning velocity:', error);
      return null;
    }
  }

  /**
   * Analyze skill gaps for a user
   */
  static async analyzeSkillGaps(userId: string): Promise<SkillGap[]> {
    try {
      const { data, error } = await supabase
        .rpc('analyze_skill_gaps', { p_user_id: userId });

      if (error) throw error;

      return (data || []).map((gap: any) => ({
        categoryName: gap.category_name,
        currentProficiency: gap.current_proficiency || 0,
        targetProficiency: 100,
        gapSize: gap.gap_size || 0,
        priorityScore: gap.priority_score || 0,
        predictedProficiency30d: Math.min(100, (gap.current_proficiency || 0) + 15),
        predictedProficiency90d: Math.min(100, (gap.current_proficiency || 0) + 35),
        estimatedHoursToClose: Math.ceil((gap.gap_size || 0) / 2),
        recommendedAction: gap.recommended_action || '',
        businessImpact: gap.gap_size > 60 ? 'critical' : gap.gap_size > 40 ? 'high' : 'medium',
      }));
    } catch (error) {
      logger.error('Error analyzing skill gaps:', error);
      return [];
    }
  }

  /**
   * Get competency matrix for heat map visualization
   */
  static async getCompetencyMatrix(userId: string): Promise<CompetencySnapshot | null> {
    try {
      const { data: matrix, error: matrixError } = await supabase
        .rpc('get_competency_matrix', { p_user_id: userId });

      if (matrixError) throw matrixError;

      // Create snapshot
      const { data: snapshotId, error: snapshotError } = await supabase
        .rpc('create_competency_snapshot', { p_user_id: userId });

      if (snapshotError) throw snapshotError;

      // Get full snapshot
      const { data: snapshot, error } = await supabase
        .from('competency_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (!snapshot) return null;

      // Extract top strengths and weaknesses
      const scores = Object.entries(snapshot.competency_matrix as any || {})
        .map(([cat, data]: [string, any]) => ({ category: cat, score: data.score }))
        .sort((a, b) => b.score - a.score);

      return {
        id: snapshot.id,
        userId: snapshot.user_id,
        competencyMatrix: snapshot.competency_matrix as any,
        overallCompetency: snapshot.overall_competency || 0,
        overallPercentile: snapshot.overall_percentile || 50,
        topStrengths: scores.slice(0, 3).map(s => s.category),
        topWeaknesses: scores.slice(-3).map(s => s.category).reverse(),
        snapshotDate: snapshot.snapshot_date,
      };
    } catch (error) {
      logger.error('Error getting competency matrix:', error);
      return null;
    }
  }

  /**
   * Get time-series performance data
   */
  static async getPerformanceTimeSeries(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('competency_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting performance time series:', error);
      return [];
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  static async generateRecommendations(userId: string): Promise<AIRecommendation[]> {
    try {
      const { data, error } = await supabase
        .rpc('generate_ai_recommendations', { p_user_id: userId });

      if (error) throw error;

      // Also insert into ai_recommendations table
      if (data && data.length > 0) {
        const { error: insertError } = await supabase
          .from('ai_recommendations')
          .upsert(data, {
            onConflict: 'id',
            ignoreDuplicates: true
          });

        if (insertError) {
          logger.warn('Error inserting recommendations:', insertError);
        }
      }

      return data || [];
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Get active recommendations for a user
   */
  static async getActiveRecommendations(userId: string): Promise<AIRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .is('dismissed_at', null)
        .is('completed_at', null)
        .gte('expires_at', new Date().toISOString())
        .order('relevance_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting active recommendations:', error);
      return [];
    }
  }

  /**
   * Mark recommendation as viewed
   */
  static async markRecommendationViewed(recommendationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', recommendationId)
        .is('viewed_at', null);

      if (error) throw error;
    } catch (error) {
      logger.error('Error marking recommendation viewed:', error);
    }
  }

  /**
   * Mark recommendation as clicked
   */
  static async markRecommendationClicked(recommendationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ clicked_at: new Date().toISOString() })
        .eq('id', recommendationId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error marking recommendation clicked:', error);
    }
  }

  /**
   * Dismiss recommendation
   */
  static async dismissRecommendation(recommendationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', recommendationId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error dismissing recommendation:', error);
    }
  }

  /**
   * Rate recommendation
   */
  static async rateRecommendation(recommendationId: string, rating: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ feedback_rating: rating })
        .eq('id', recommendationId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error rating recommendation:', error);
    }
  }

  /**
   * Get performance benchmarks
   */
  static async getPerformanceBenchmarks(
    audienceType: string,
    benchmarkType: string = 'category'
  ): Promise<PerformanceBenchmark[]> {
    try {
      const { data, error } = await supabase
        .from('performance_benchmarks')
        .select('*')
        .eq('audience_type', audienceType)
        .eq('benchmark_type', benchmarkType)
        .order('calculated_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting performance benchmarks:', error);
      return [];
    }
  }
}
