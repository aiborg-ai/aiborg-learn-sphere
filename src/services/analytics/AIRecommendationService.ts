/**
 * AI Recommendation Service
 * Handles AI-powered recommendations and their lifecycle
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AIRecommendation } from './types';

export class AIRecommendationService {
  /**
   * Generate AI-powered recommendations
   */
  static async generateRecommendations(userId: string): Promise<AIRecommendation[]> {
    try {
      const { data, error } = await supabase.rpc('generate_ai_recommendations', {
        p_user_id: userId,
      });

      if (error) throw error;

      // Also insert into ai_recommendations table
      if (data && data.length > 0) {
        const { error: insertError } = await supabase.from('ai_recommendations').upsert(data, {
          onConflict: 'id',
          ignoreDuplicates: true,
        });

        if (insertError) {
          logger.warn('Error inserting recommendations:', insertError);
        }
      }

      return data || [];
    } catch (_error) {
      logger._error('Error generating recommendations:', _error);
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
    } catch (_error) {
      logger._error('Error getting active recommendations:', _error);
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
    } catch (_error) {
      logger._error('Error marking recommendation viewed:', _error);
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
    } catch (_error) {
      logger._error('Error marking recommendation clicked:', _error);
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
    } catch (_error) {
      logger._error('Error dismissing recommendation:', _error);
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
    } catch (_error) {
      logger._error('Error rating recommendation:', _error);
    }
  }
}
