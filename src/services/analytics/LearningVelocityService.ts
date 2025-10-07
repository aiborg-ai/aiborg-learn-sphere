/**
 * Learning Velocity Service
 * Handles learning velocity calculation and metrics
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { LearningVelocityMetrics } from './types';

export class LearningVelocityService {
  /**
   * Calculate learning velocity for a user
   */
  static async calculateLearningVelocity(userId: string): Promise<LearningVelocityMetrics | null> {
    try {
      const { data, error } = await supabase.rpc('calculate_learning_velocity', {
        p_user_id: userId,
      });

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
        ? (assessments.reduce((acc, a) => acc + (a.total_score / a.max_possible_score || 0), 0) /
            assessments.length) *
          100
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
}
