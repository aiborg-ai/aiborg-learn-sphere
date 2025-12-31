/**
 * Assessment Tool Service
 * Business logic for assessment tool management
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { GAMIFICATION_CONFIG } from '@/config/gamification';
import type {
  AssessmentTool,
  AssessmentToolAttempt,
  AssessmentResults,
  CategoryPerformance,
  PooledQuestion,
  BadgeEarned,
} from '@/types/assessmentTools';

export class AssessmentToolService {
  /**
   * Get questions for an assessment tool
   */
  static async getQuestionsForTool(toolId: string): Promise<PooledQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('assessment_question_pools')
        .select(
          `
          question_id,
          is_active,
          weight,
          assessment_questions (
            question_text,
            question_type,
            difficulty_level,
            irt_difficulty,
            assessment_categories (
              name
            )
          )
        `
        )
        .eq('tool_id', toolId)
        .eq('is_active', true);

      if (error) throw error;

      return (data || []).map((item: unknown) => {
        const poolItem = item as {
          question_id: string;
          is_active: boolean;
          weight: number;
          assessment_questions: {
            question_text: string;
            question_type: string;
            difficulty_level: string;
            irt_difficulty: number;
            assessment_categories: { name: string };
          };
        };

        return {
          question_id: poolItem.question_id,
          question_text: poolItem.assessment_questions.question_text,
          question_type: poolItem.assessment_questions.question_type,
          difficulty_level: poolItem.assessment_questions.difficulty_level,
          irt_difficulty: poolItem.assessment_questions.irt_difficulty,
          category_name: poolItem.assessment_questions.assessment_categories.name,
          is_active_in_pool: poolItem.is_active,
          weight: poolItem.weight,
        } as PooledQuestion;
      });
    } catch (_error) {
      logger._error('Error fetching questions for tool:', _error);
      throw error;
    }
  }

  /**
   * Calculate assessment results and generate recommendations
   */
  static async generateAssessmentResults(
    attempt: AssessmentToolAttempt,
    tool: AssessmentTool
  ): Promise<AssessmentResults> {
    try {
      // Parse performance by category
      const performanceByCategory: CategoryPerformance[] = attempt.performance_by_category
        ? Object.entries(attempt.performance_by_category).map(([name, perf]) => {
            const catPerf = perf as CategoryPerformance;
            return {
              category_name: name,
              questions_answered: catPerf.questions_answered,
              correct_answers: catPerf.correct_answers,
              score_percentage: catPerf.score_percentage,
            };
          })
        : [];

      // Calculate percentile rank (compare to other users)
      const percentileRank = await this.calculatePercentileRank(tool.id, attempt.score_percentage);

      // Generate personalized recommendations
      const recommendations = this.generateRecommendations(attempt, tool, performanceByCategory);

      // Determine badges earned from this assessment
      const badgesEarned = await this.determineAssessmentBadges(attempt, tool, percentileRank);

      return {
        attempt,
        tool,
        performance_by_category: performanceByCategory,
        percentile_rank: percentileRank,
        recommendations,
        badges_earned: badgesEarned,
      };
    } catch (_error) {
      logger._error('Error generating assessment results:', _error);
      throw error;
    }
  }

  /**
   * Determine which badges the user earned from this assessment
   */
  private static async determineAssessmentBadges(
    attempt: AssessmentToolAttempt,
    tool: AssessmentTool,
    percentileRank: number
  ): Promise<BadgeEarned[]> {
    const badgesEarned: BadgeEarned[] = [];
    const scorePercentage = attempt.score_percentage;
    const passingScore = tool.passing_score_percentage;
    const badges = GAMIFICATION_CONFIG.BADGES;

    try {
      // Get user's existing badges to check which are new
      const { data: existingBadges } = await supabase
        .from('user_achievements')
        .select('achievement:achievements(name)')
        .eq('user_id', attempt.user_id);

      const earnedBadgeNames = new Set(
        existingBadges?.map(b => (b.achievement as { name: string })?.name) || []
      );

      // Get count of completed assessments for this user
      const { count: assessmentCount } = await supabase
        .from('assessment_tool_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', attempt.user_id)
        .eq('is_completed', true);

      const totalAssessments = assessmentCount || 0;

      // Helper to add badge if eligible
      const addBadgeIfEligible = (badge: typeof badges.FIRST_ASSESSMENT, isEligible: boolean) => {
        if (isEligible) {
          const isNew = !earnedBadgeNames.has(badge.name);
          badgesEarned.push({
            id: badge.id,
            name: badge.name,
            icon: badge.icon,
            description: badge.description,
            rarity: badge.rarity as BadgeEarned['rarity'],
            points: badge.points,
            isNew,
          });
        }
      };

      // First assessment badge
      addBadgeIfEligible(badges.FIRST_ASSESSMENT, totalAssessments === 1);

      // Assessment streak badge (3 assessments)
      addBadgeIfEligible(badges.ASSESSMENT_STREAK_3, totalAssessments >= 3);

      // Score-based tier badges
      addBadgeIfEligible(badges.ASSESSMENT_BRONZE, scorePercentage >= 60);
      addBadgeIfEligible(badges.ASSESSMENT_SILVER, scorePercentage >= 75);
      addBadgeIfEligible(badges.ASSESSMENT_GOLD, scorePercentage >= 90);
      addBadgeIfEligible(badges.ASSESSMENT_PLATINUM, scorePercentage >= 95);
      addBadgeIfEligible(badges.ASSESSMENT_PERFECT, scorePercentage === 100);

      // Top percentile badge
      addBadgeIfEligible(badges.TOP_PERCENTILE, percentileRank >= 90);

      // Tool-specific certification badges
      if (scorePercentage >= passingScore) {
        const toolCategory = tool.category_type?.toLowerCase();
        if (toolCategory === 'awareness' || tool.name?.toLowerCase().includes('awareness')) {
          addBadgeIfEligible(badges.AI_AWARENESS_CERTIFIED, true);
        }
        if (toolCategory === 'fluency' || tool.name?.toLowerCase().includes('fluency')) {
          addBadgeIfEligible(badges.AI_FLUENCY_CERTIFIED, true);
        }
      }

      // Award badges to database (only new ones)
      for (const badge of badgesEarned) {
        if (badge.isNew) {
          await this.awardBadgeToUser(attempt.user_id, badge, {
            assessment_id: attempt.assessment_id,
            attempt_id: attempt.id,
            score_percentage: scorePercentage,
            tool_name: tool.name,
          });
        }
      }

      logger.log(`Awarded ${badgesEarned.filter(b => b.isNew).length} new badges for assessment`);
      return badgesEarned;
    } catch (_error) {
      logger._error('Error determining assessment badges:', _error);
      return [];
    }
  }

  /**
   * Award a badge to a user in the database
   */
  private static async awardBadgeToUser(
    userId: string,
    badge: BadgeEarned,
    evidence: Record<string, unknown>
  ): Promise<void> {
    try {
      // First, find or create the achievement in the database
      let { data: achievement } = await supabase
        .from('achievements')
        .select('id')
        .eq('name', badge.name)
        .single();

      if (!achievement) {
        // Create the achievement if it doesn't exist
        const { data: newAchievement, error: createError } = await supabase
          .from('achievements')
          .insert({
            name: badge.name,
            description: badge.description,
            icon_emoji: badge.icon,
            category: 'milestone',
            rarity: badge.rarity,
            criteria: {},
            points: badge.points,
            auto_allocate: true,
          })
          .select('id')
          .single();

        if (createError) {
          logger.error('Error creating achievement:', createError);
          return;
        }
        achievement = newAchievement;
      }

      // Award to user (ignore duplicates)
      const { error: awardError } = await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
        evidence,
      });

      // Ignore unique constraint violations (user already has badge)
      if (awardError && awardError.code !== '23505') {
        logger.error('Error awarding badge:', awardError);
      }
    } catch (_error) {
      logger._error('Error in awardBadgeToUser:', _error);
    }
  }

  /**
   * Calculate percentile rank compared to other users
   */
  private static async calculatePercentileRank(toolId: string, userScore: number): Promise<number> {
    try {
      // Get all completed attempts for this tool
      const { data, error } = await supabase
        .from('assessment_tool_attempts')
        .select('score_percentage')
        .eq('tool_id', toolId)
        .eq('is_completed', true);

      if (error) throw error;
      if (!data || data.length === 0) return 50; // Default to 50th percentile if no data

      // Count how many scores are below the user's score
      const scoresBelow = data.filter(
        (attempt: { score_percentage: number }) => attempt.score_percentage < userScore
      ).length;

      const percentile = (scoresBelow / data.length) * 100;
      return Math.round(percentile);
    } catch (_error) {
      logger._error('Error calculating percentile rank:', _error);
      return 50; // Default fallback
    }
  }

  /**
   * Generate personalized recommendations based on performance
   */
  private static generateRecommendations(
    attempt: AssessmentToolAttempt,
    tool: AssessmentTool,
    performanceByCategory: CategoryPerformance[]
  ): string[] {
    const recommendations: string[] = [];
    const scorePercentage = attempt.score_percentage;
    const passingScore = tool.passing_score_percentage;

    // Overall performance
    if (scorePercentage >= 90) {
      recommendations.push('Excellent work! You demonstrate expert-level knowledge.');
      recommendations.push(
        'Consider sharing your expertise by mentoring others or contributing to the community.'
      );
    } else if (scorePercentage >= passingScore) {
      recommendations.push(
        `Great job! You passed the assessment with a score of ${scorePercentage.toFixed(1)}%.`
      );
      recommendations.push('Keep practicing to reach expert level.');
    } else {
      recommendations.push(
        `You scored ${scorePercentage.toFixed(1)}%, below the passing threshold of ${passingScore}%.`
      );
      recommendations.push('Review the material and try again to improve your score.');
    }

    // Category-specific recommendations
    const weakCategories = performanceByCategory
      .filter(cat => cat.score_percentage < 60)
      .sort((a, b) => a.score_percentage - b.score_percentage)
      .slice(0, 3);

    if (weakCategories.length > 0) {
      recommendations.push('Focus on improving these areas:');
      weakCategories.forEach(cat => {
        recommendations.push(
          `• ${cat.category_name}: ${cat.score_percentage.toFixed(1)}% - Review fundamental concepts`
        );
      });
    }

    // Ability-specific recommendations
    const abilityEstimate = attempt.ability_estimate;
    if (abilityEstimate < -1) {
      recommendations.push('Start with foundational courses to build a strong base.');
    } else if (abilityEstimate < 0) {
      recommendations.push(
        'Practice with intermediate-level exercises to solidify your knowledge.'
      );
    } else if (abilityEstimate < 1) {
      recommendations.push('Challenge yourself with advanced topics and real-world applications.');
    } else {
      recommendations.push('Explore cutting-edge developments and contribute to the field.');
    }

    // Tool-specific recommendations
    if (tool.category_type === 'awareness') {
      recommendations.push(
        'Next step: Take the AI-Fluency Assessment to test your practical skills.'
      );
    } else if (tool.category_type === 'fluency') {
      recommendations.push('Apply your skills in real projects to gain hands-on experience.');
    } else if (tool.category_type === 'readiness') {
      recommendations.push(
        'Develop an AI implementation roadmap based on your assessment results.'
      );
    }

    return recommendations;
  }

  /**
   * Link an assessment to a tool attempt
   */
  static async linkAssessmentToAttempt(attemptId: string, assessmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assessment_tool_attempts')
        .update({ assessment_id: assessmentId })
        .eq('id', attemptId);

      if (error) throw error;

      logger.log(`Linked assessment ${assessmentId} to attempt ${attemptId}`);
    } catch (_error) {
      logger._error('Error linking assessment to attempt:', _error);
      throw error;
    }
  }

  /**
   * Get recommended next tools based on completion
   */
  static getRecommendedNextTools(
    completedTool: AssessmentTool,
    allTools: AssessmentTool[]
  ): AssessmentTool[] {
    const recommendations: AssessmentTool[] = [];

    // Progression: Awareness → Fluency
    if (completedTool.category_type === 'awareness') {
      const fluencyTools = allTools.filter(t => t.category_type === 'fluency' && t.is_active);
      recommendations.push(...fluencyTools);
    }

    // For business users: Readiness assessment
    if (
      completedTool.target_audiences.includes('business') &&
      completedTool.category_type !== 'readiness'
    ) {
      const readinessTools = allTools.filter(t => t.category_type === 'readiness' && t.is_active);
      recommendations.push(...readinessTools);
    }

    return recommendations.slice(0, 2); // Return top 2 recommendations
  }
}
