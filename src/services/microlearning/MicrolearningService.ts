/**
 * Microlearning Service
 *
 * Service for managing bite-sized learning content:
 * - Learning nuggets (2-10 min lessons)
 * - Daily learning goals
 * - Spaced repetition for nuggets
 * - Just-in-time recommendations
 * - Streak tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface LearningNugget {
  id: string;
  course_id: string | null;
  title: string;
  description: string;
  content_type: 'video' | 'reading' | 'quiz' | 'exercise' | 'flashcard' | 'summary';
  content: Record<string, unknown>;
  duration_minutes: number;
  difficulty: string;
  skill_tags: string[];
  order_index: number;
}

export interface NuggetProgress {
  id: string;
  nugget_id: string;
  nugget?: LearningNugget;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  progress_percentage: number;
  score: number | null;
  time_spent_seconds: number;
  completed_at: string | null;
  next_review_date: string | null;
}

export interface LearningGoals {
  id: string;
  daily_minutes_goal: number;
  daily_nuggets_goal: number;
  preferred_learning_times: string[];
  notification_enabled: boolean;
  notification_times: string[];
}

export interface DailyLearning {
  id: string;
  date: string;
  minutes_learned: number;
  nuggets_completed: number;
  points_earned: number;
  goal_achieved: boolean;
}

export interface LearningStreak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_learning_days: number;
  freeze_days_remaining: number;
}

export interface LearningRecommendation {
  id: string;
  nugget_id: string;
  nugget?: LearningNugget;
  recommendation_type: string;
  priority_score: number;
  reason: string;
}

class MicrolearningServiceClass {
  /**
   * Get all learning nuggets
   */
  async getNuggets(options?: {
    course_id?: string;
    content_type?: string;
    difficulty?: string;
    skill_tag?: string;
    limit?: number;
  }): Promise<LearningNugget[]> {
    try {
      let query = supabase
        .from('learning_nuggets')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (options?.course_id) {
        query = query.eq('course_id', options.course_id);
      }

      if (options?.content_type) {
        query = query.eq('content_type', options.content_type);
      }

      if (options?.difficulty) {
        query = query.eq('difficulty', options.difficulty);
      }

      if (options?.skill_tag) {
        query = query.contains('skill_tags', [options.skill_tag]);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching nuggets:', _error);
      throw error;
    }
  }

  /**
   * Get a single nugget by ID
   */
  async getNugget(nuggetId: string): Promise<LearningNugget | null> {
    try {
      const { data, error } = await supabase
        .from('learning_nuggets')
        .select('*')
        .eq('id', nuggetId)
        .single();

      if (error) throw error;
      return data;
    } catch (_error) {
      logger.error('Error fetching nugget:', _error);
      throw error;
    }
  }

  /**
   * Get user's nugget progress
   */
  async getUserProgress(userId: string): Promise<NuggetProgress[]> {
    try {
      const { data, error } = await supabase
        .from('user_nugget_progress')
        .select(
          `
          *,
          nugget:learning_nuggets(*)
        `
        )
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching user progress:', _error);
      throw error;
    }
  }

  /**
   * Get nuggets due for review (spaced repetition)
   */
  async getDueNuggets(
    userId: string,
    limit: number = 10
  ): Promise<
    Array<{
      nugget_id: string;
      title: string;
      content_type: string;
      duration_minutes: number;
      days_overdue: number;
    }>
  > {
    try {
      const { data, error } = await supabase.rpc('get_due_nuggets', {
        p_user_id: userId,
        p_limit: limit,
      });

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching due nuggets:', _error);
      throw error;
    }
  }

  /**
   * Start or update nugget progress
   */
  async updateProgress(
    userId: string,
    nuggetId: string,
    data: {
      status?: string;
      progress_percentage?: number;
      score?: number;
      time_spent_seconds?: number;
    }
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        user_id: userId,
        nugget_id: nuggetId,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data,
      };

      if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase.from('user_nugget_progress').upsert(updateData, {
        onConflict: 'user_id,nugget_id',
      });

      if (error) throw error;
    } catch (_error) {
      logger.error('Error updating progress:', _error);
      throw error;
    }
  }

  /**
   * Complete a nugget and update daily learning
   */
  async completeNugget(
    userId: string,
    nuggetId: string,
    timeSpentSeconds: number,
    score?: number
  ): Promise<{
    streak_updated: boolean;
    new_streak: number;
    goal_achieved: boolean;
    points_earned: number;
  }> {
    try {
      // Update progress
      await this.updateProgress(userId, nuggetId, {
        status: 'completed',
        progress_percentage: 100,
        time_spent_seconds: timeSpentSeconds,
        score,
      });

      // Get nugget duration
      const nugget = await this.getNugget(nuggetId);
      const minutes = nugget?.duration_minutes || Math.ceil(timeSpentSeconds / 60);

      // Update daily learning and streak
      const { data, error } = await supabase.rpc('update_daily_learning', {
        p_user_id: userId,
        p_minutes: minutes,
        p_nugget_id: nuggetId,
      });

      if (error) throw error;

      return (
        data?.[0] || {
          streak_updated: false,
          new_streak: 0,
          goal_achieved: false,
          points_earned: 0,
        }
      );
    } catch (_error) {
      logger.error('Error completing nugget:', _error);
      throw error;
    }
  }

  /**
   * Submit review for spaced repetition
   */
  async submitReview(
    userId: string,
    nuggetId: string,
    quality: number // 0-5, like SM-2
  ): Promise<void> {
    try {
      // Get current progress
      const { data: progress, error: fetchError } = await supabase
        .from('user_nugget_progress')
        .select('easiness_factor, review_count')
        .eq('user_id', userId)
        .eq('nugget_id', nuggetId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const ef = progress?.easiness_factor || 2.5;
      const rep = progress?.review_count || 0;

      // Calculate next review
      const { data: reviewData, error: calcError } = await supabase.rpc('calculate_next_review', {
        p_easiness_factor: ef,
        p_repetition_count: rep,
        p_quality: quality,
      });

      if (calcError) throw calcError;

      const result = reviewData?.[0];

      // Update progress with new review data
      const { error: updateError } = await supabase.from('user_nugget_progress').upsert(
        {
          user_id: userId,
          nugget_id: nuggetId,
          easiness_factor: result.new_easiness,
          review_count: result.new_repetition,
          next_review_date: result.next_date,
          status: quality >= 4 ? 'mastered' : 'completed',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,nugget_id',
        }
      );

      if (updateError) throw updateError;
    } catch (_error) {
      logger.error('Error submitting review:', _error);
      throw error;
    }
  }

  /**
   * Get user's learning goals
   */
  async getLearningGoals(userId: string): Promise<LearningGoals | null> {
    try {
      const { data, error } = await supabase
        .from('user_learning_goals')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (_error) {
      logger.error('Error fetching learning goals:', _error);
      throw error;
    }
  }

  /**
   * Update user's learning goals
   */
  async updateLearningGoals(userId: string, goals: Partial<LearningGoals>): Promise<void> {
    try {
      const { error } = await supabase.from('user_learning_goals').upsert(
        {
          user_id: userId,
          ...goals,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

      if (error) throw error;
    } catch (_error) {
      logger.error('Error updating learning goals:', _error);
      throw error;
    }
  }

  /**
   * Get today's learning activity
   */
  async getTodayLearning(userId: string): Promise<DailyLearning | null> {
    try {
      const { data, error } = await supabase
        .from('user_daily_learning')
        .select('*')
        .eq('user_id', userId)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (_error) {
      logger.error('Error fetching today learning:', _error);
      throw error;
    }
  }

  /**
   * Get learning history
   */
  async getLearningHistory(userId: string, days: number = 30): Promise<DailyLearning[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('user_daily_learning')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching learning history:', _error);
      throw error;
    }
  }

  /**
   * Get user's learning streak
   */
  async getStreak(userId: string): Promise<LearningStreak> {
    try {
      const { data, error } = await supabase
        .from('user_learning_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return (
        data || {
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
          total_learning_days: 0,
          freeze_days_remaining: 0,
        }
      );
    } catch (_error) {
      logger.error('Error fetching streak:', _error);
      throw error;
    }
  }

  /**
   * Get learning recommendations
   */
  async getRecommendations(userId: string): Promise<LearningRecommendation[]> {
    try {
      // Generate fresh recommendations
      await supabase.rpc('generate_daily_recommendations', { p_user_id: userId });

      // Fetch recommendations
      const { data, error } = await supabase
        .from('learning_recommendations')
        .select(
          `
          *,
          nugget:learning_nuggets(*)
        `
        )
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .eq('is_completed', false)
        .order('priority_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching recommendations:', _error);
      throw error;
    }
  }

  /**
   * Dismiss a recommendation
   */
  async dismissRecommendation(recommendationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('learning_recommendations')
        .update({ is_dismissed: true })
        .eq('id', recommendationId);

      if (error) throw error;
    } catch (_error) {
      logger.error('Error dismissing recommendation:', _error);
      throw error;
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(userId: string): Promise<{
    today: DailyLearning | null;
    streak: LearningStreak;
    goals: LearningGoals | null;
    dueCount: number;
    recommendationCount: number;
  }> {
    try {
      const [today, streak, goals, dueNuggets, recommendations] = await Promise.all([
        this.getTodayLearning(userId),
        this.getStreak(userId),
        this.getLearningGoals(userId),
        this.getDueNuggets(userId, 100),
        this.getRecommendations(userId),
      ]);

      return {
        today,
        streak,
        goals,
        dueCount: dueNuggets.length,
        recommendationCount: recommendations.length,
      };
    } catch (_error) {
      logger.error('Error fetching dashboard summary:', _error);
      throw error;
    }
  }
}

export const MicrolearningService = new MicrolearningServiceClass();
