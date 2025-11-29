/**
 * Study Assistant Orchestrator
 * Central coordination service for AI-powered study assistant features
 * Combines recommendations, progress forecasts, study plans, and insights
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { RecommendationEngineService } from './RecommendationEngineService';
import { ProgressForecastService } from '../recommendations/ProgressForecastService';
import { GoalPredictionService } from '../analytics/GoalPredictionService';
import type { LearningGoal, GoalPrediction } from '../analytics/GoalPredictionService';

// Cache duration in milliseconds
const CACHE_DURATION = {
  USER_CONTEXT: 5 * 60 * 1000, // 5 minutes
  RECOMMENDATIONS: 30 * 60 * 1000, // 30 minutes
  PROGRESS_FORECAST: 60 * 60 * 1000, // 1 hour
  INSIGHTS: 15 * 60 * 1000, // 15 minutes
};

// Simple in-memory cache (in production, use Redis/Upstash)
const cache = new Map<string, { data: any; timestamp: number }>();

export interface UserStudyContext {
  user_id: string;
  current_courses: Array<{
    course_id: string;
    course_title: string;
    progress_percentage: number;
    last_accessed: string;
  }>;
  recent_assessments: Array<{
    category: string;
    ability_estimate: number;
    confidence: number;
    questions_count: number;
  }>;
  skill_gaps: Array<{
    category: string;
    current_level: string;
    target_level: string;
    priority: number;
  }>;
  learning_goals: LearningGoal[];
  study_statistics: {
    total_study_time_minutes: number;
    average_daily_time: number;
    current_streak: number;
    completion_rate: number;
  };
}

export interface CourseRecommendation {
  course_id: string;
  course_title: string;
  course_description: string;
  difficulty_level: string;
  estimated_hours: number;
  score: number;
  reason: string;
  topics: string[];
  prerequisites: string[];
}

export interface StudyInsight {
  id: string;
  insight_type: 'strength' | 'weakness' | 'pattern' | 'achievement' | 'suggestion';
  category: string;
  title: string;
  description: string;
  confidence_score: number;
  actionable: boolean;
  action_items?: string[];
  created_at: string;
}

export interface PersonalizedDashboard {
  user_context: UserStudyContext;
  recommended_courses: CourseRecommendation[];
  progress_forecast?: {
    current_ability: number;
    target_ability: number;
    estimated_weeks: number;
    confidence_level: 'low' | 'medium' | 'high';
    on_track: boolean;
    recommendation: string;
  };
  active_study_plan?: {
    id: string;
    name: string;
    completion_percentage: number;
    today_tasks: Array<{
      task: string;
      estimated_minutes: number;
      completed: boolean;
    }>;
    upcoming_milestones: Array<{
      title: string;
      due_date: string;
      progress: number;
    }>;
  };
  recent_insights: StudyInsight[];
  next_best_actions: Array<{
    action: string;
    priority: number;
    reason: string;
  }>;
}

export class StudyAssistantOrchestrator {
  /**
   * Get cached data or fetch if expired
   */
  private static async getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    duration: number
  ): Promise<T> {
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < duration) {
      logger.debug('Cache hit', { key });
      return cached.data as T;
    }

    logger.debug('Cache miss', { key });
    const data = await fetcher();
    cache.set(key, { data, timestamp: now });
    return data;
  }

  /**
   * Invalidate cache for a user
   */
  static invalidateUserCache(userId: string): void {
    const keys = Array.from(cache.keys()).filter((key) => key.includes(userId));
    keys.forEach((key) => cache.delete(key));
    logger.info('Cache invalidated for user', { userId, keysCleared: keys.length });
  }

  /**
   * Get comprehensive user study context
   */
  static async getUserStudyContext(userId: string): Promise<UserStudyContext> {
    const cacheKey = `user_context:${userId}`;

    return this.getCached(
      cacheKey,
      async () => {
        // Call existing database function
        const { data, error } = await supabase.rpc('get_user_study_context', {
          p_user_id: userId,
        });

        if (error) {
          logger.error('Error fetching user study context:', error);
          throw new Error('Failed to fetch user study context');
        }

        // Enhance with learning goals
        const goals = await GoalPredictionService.getUserGoals(userId);

        return {
          ...data,
          learning_goals: goals,
        };
      },
      CACHE_DURATION.USER_CONTEXT
    );
  }

  /**
   * Get course recommendations with explanations
   */
  static async getCourseRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<CourseRecommendation[]> {
    const cacheKey = `recommendations:${userId}:${limit}`;

    return this.getCached(
      cacheKey,
      async () => {
        try {
          // Get user context for personalization
          const context = await this.getUserStudyContext(userId);

          // Get recommendations from RecommendationEngineService
          const recommendations = await RecommendationEngineService.getRecommendations(
            userId,
            'course',
            limit
          );

          // Enhance with reasoning
          const enhanced = recommendations.map((rec: any) => ({
            course_id: rec.content_id,
            course_title: rec.title || rec.content_title,
            course_description: rec.description,
            difficulty_level: rec.difficulty_level || 'intermediate',
            estimated_hours: rec.estimated_hours || 0,
            score: rec.score,
            reason: this.generateRecommendationReason(rec, context),
            topics: rec.metadata?.topics || [],
            prerequisites: rec.metadata?.prerequisites || [],
          }));

          return enhanced;
        } catch (error) {
          logger.error('Error getting course recommendations:', error);
          return [];
        }
      },
      CACHE_DURATION.RECOMMENDATIONS
    );
  }

  /**
   * Generate human-readable recommendation reason
   */
  private static generateRecommendationReason(
    recommendation: any,
    context: UserStudyContext
  ): string {
    const reasons: string[] = [];

    // Check for skill gap match
    const matchingGap = context.skill_gaps?.find(
      (gap) =>
        recommendation.metadata?.topics?.some((topic: string) =>
          gap.category.toLowerCase().includes(topic.toLowerCase())
        )
    );

    if (matchingGap) {
      reasons.push(`Helps bridge your skill gap in ${matchingGap.category}`);
    }

    // Check for high similarity score
    if (recommendation.score > 0.8) {
      reasons.push('Highly relevant to your learning profile');
    }

    // Check for difficulty match
    const avgAbility =
      context.recent_assessments?.reduce((sum, a) => sum + a.ability_estimate, 0) /
        (context.recent_assessments?.length || 1) || 0;

    if (recommendation.difficulty_level === 'beginner' && avgAbility < -0.5) {
      reasons.push('Perfect for building foundations');
    } else if (recommendation.difficulty_level === 'intermediate' && Math.abs(avgAbility) < 0.5) {
      reasons.push('Matches your current skill level');
    } else if (recommendation.difficulty_level === 'advanced' && avgAbility > 0.5) {
      reasons.push('Challenges you to reach the next level');
    }

    // Check for goal alignment
    if (context.learning_goals?.length > 0) {
      const matchingGoal = context.learning_goals.find((goal) =>
        goal.description?.toLowerCase().includes(recommendation.content_title?.toLowerCase())
      );
      if (matchingGoal) {
        reasons.push(`Aligns with your goal: ${matchingGoal.title}`);
      }
    }

    // Default reason if none found
    if (reasons.length === 0) {
      reasons.push('Recommended based on your learning history');
    }

    return reasons.join('. ');
  }

  /**
   * Get recent AI-generated insights
   */
  static async getRecentInsights(userId: string, limit: number = 5): Promise<StudyInsight[]> {
    const cacheKey = `insights:${userId}:${limit}`;

    return this.getCached(
      cacheKey,
      async () => {
        try {
          const { data, error } = await supabase
            .from('ai_learning_insights')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (error) {
            logger.error('Error fetching insights:', error);
            return [];
          }

          return data || [];
        } catch (error) {
          logger.error('Error in getRecentInsights:', error);
          return [];
        }
      },
      CACHE_DURATION.INSIGHTS
    );
  }

  /**
   * Get active study plan with today's tasks
   */
  static async getActiveStudyPlan(userId: string) {
    try {
      const { data, error } = await supabase
        .from('ai_study_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      // Parse plan_data to extract today's tasks
      const planData = data.plan_data as any;
      const today = new Date().toISOString().split('T')[0];

      const todayTasks =
        planData?.daily_tasks?.[today] ||
        planData?.weekly_tasks?.[this.getCurrentWeek()] ||
        [];

      return {
        id: data.id,
        name: data.name || 'Study Plan',
        completion_percentage: data.completion_percentage || 0,
        today_tasks: todayTasks,
        upcoming_milestones: planData?.milestones || [],
      };
    } catch (error) {
      logger.error('Error getting active study plan:', error);
      return null;
    }
  }

  /**
   * Get current week string (e.g., "2025-W04")
   */
  private static getCurrentWeek(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Generate next best actions based on context
   */
  static async getNextBestActions(userId: string, context: UserStudyContext) {
    const actions: Array<{ action: string; priority: number; reason: string }> = [];

    // Check for incomplete assessments
    if (context.recent_assessments && context.recent_assessments.length < 3) {
      actions.push({
        action: 'Complete skill assessment',
        priority: 10,
        reason: 'Get personalized recommendations based on your skill level',
      });
    }

    // Check for skill gaps
    if (context.skill_gaps && context.skill_gaps.length > 0) {
      const topGap = context.skill_gaps[0];
      actions.push({
        action: `Study ${topGap.category}`,
        priority: 9,
        reason: `Bridge the gap from ${topGap.current_level} to ${topGap.target_level}`,
      });
    }

    // Check for low study time
    if (context.study_statistics?.average_daily_time < 30) {
      actions.push({
        action: 'Increase daily study time',
        priority: 8,
        reason: 'Aim for at least 30 minutes per day for optimal learning',
      });
    }

    // Check for stagnant courses
    if (context.current_courses && context.current_courses.length > 0) {
      const stagnantCourse = context.current_courses.find((c) => {
        const lastAccessed = new Date(c.last_accessed);
        const daysSince = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 7 && c.progress_percentage < 100;
      });

      if (stagnantCourse) {
        actions.push({
          action: `Resume "${stagnantCourse.course_title}"`,
          priority: 7,
          reason: "You haven't accessed this course in over a week",
        });
      }
    }

    // Check for learning goals without study plans
    if (context.learning_goals && context.learning_goals.length > 0) {
      const goalWithoutPlan = context.learning_goals.find((g) => g.status !== 'completed');
      if (goalWithoutPlan) {
        actions.push({
          action: 'Create study plan',
          priority: 6,
          reason: `Turn your goal "${goalWithoutPlan.title}" into actionable steps`,
        });
      }
    }

    return actions.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }

  /**
   * Get personalized dashboard data
   * Central method that orchestrates all AI study assistant features
   */
  static async getPersonalizedDashboard(userId: string): Promise<PersonalizedDashboard> {
    try {
      // Fetch all data in parallel for performance
      const [context, recommendations, insights, studyPlan] = await Promise.all([
        this.getUserStudyContext(userId),
        this.getCourseRecommendations(userId, 5),
        this.getRecentInsights(userId, 5),
        this.getActiveStudyPlan(userId),
      ]);

      // Generate progress forecast if user has goals
      let progressForecast;
      if (context.learning_goals && context.learning_goals.length > 0) {
        const activeGoal = context.learning_goals.find((g) => g.status !== 'completed');
        if (activeGoal) {
          try {
            const prediction = await GoalPredictionService.predictGoalCompletion(
              userId,
              activeGoal.id
            );

            if (prediction) {
              progressForecast = {
                current_ability: prediction.currentProgress,
                target_ability: 100,
                estimated_weeks: Math.ceil(prediction.daysRemaining / 7),
                confidence_level: (prediction.confidenceScore > 70
                  ? 'high'
                  : prediction.confidenceScore > 40
                    ? 'medium'
                    : 'low') as 'low' | 'medium' | 'high',
                on_track: prediction.isOnTrack,
                recommendation:
                  prediction.riskLevel === 'high'
                    ? `Increase daily study time to ${prediction.recommendedDailyEffort} minutes`
                    : prediction.isOnTrack
                      ? 'Keep up the great work!'
                      : 'Consider adjusting your schedule to stay on track',
              };
            }
          } catch (error) {
            logger.error('Error generating progress forecast:', error);
          }
        }
      }

      // Generate next best actions
      const nextBestActions = await this.getNextBestActions(userId, context);

      return {
        user_context: context,
        recommended_courses: recommendations,
        progress_forecast: progressForecast,
        active_study_plan: studyPlan,
        recent_insights: insights,
        next_best_actions: nextBestActions,
      };
    } catch (error) {
      logger.error('Error getting personalized dashboard:', error);
      throw new Error('Failed to generate personalized dashboard');
    }
  }
}
