import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AssessmentResult, Achievement } from '../types';

interface UseAchievementsReturn {
  achievements: Achievement[];
  checkAchievements: (assessmentData: AssessmentResult) => Promise<void>;
}

export function useAchievements(userId: string | undefined): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const checkAchievements = async (assessmentData: AssessmentResult) => {
    if (!userId) return;

    try {
      // Check if user earned any achievements
      const scorePercentage =
        (assessmentData.total_score / assessmentData.max_possible_score) * 100;

      const { data: achievementsData } = await supabase
        .from('assessment_achievements')
        .select('*')
        .eq('is_active', true);

      const newAchievements: Achievement[] = [];

      for (const achievement of achievementsData || []) {
        // Check if user already has this achievement
        const { data: existing } = await supabase
          .from('user_assessment_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', achievement.id)
          .single();

        if (!existing) {
          // Check if user qualifies for this achievement
          let qualified = false;

          if (
            achievement.criteria_type === 'score' &&
            scorePercentage >= achievement.criteria_value
          ) {
            qualified = true;
          }
          // Add more criteria checks as needed

          if (qualified) {
            // Award achievement
            await supabase.from('user_assessment_achievements').insert({
              user_id: userId,
              achievement_id: achievement.id,
              assessment_id: assessmentData.id,
            });

            newAchievements.push({
              id: achievement.id,
              name: achievement.name,
              description: achievement.description,
              icon: achievement.icon,
              criteria_type: achievement.criteria_type,
              criteria_value: achievement.criteria_value,
            });
          }
        }
      }

      setAchievements(newAchievements);
    } catch (error) {
      logger.error('Error checking achievements:', error);
    }
  };

  return {
    achievements,
    checkAchievements,
  };
}
