/**
 * Skill Gap Service
 * Handles skill gap analysis
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { SkillGap } from './types';

export class SkillGapService {
  /**
   * Analyze skill gaps for a user
   */
  static async analyzeSkillGaps(userId: string): Promise<SkillGap[]> {
    try {
      const { data, error } = await supabase.rpc('analyze_skill_gaps', { p_user_id: userId });

      if (error) throw error;

      return (data || []).map((gap: Record<string, unknown>) => ({
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
}
