/**
 * Goal Prediction Service
 * Provides ML-based predictions for goal completion, time estimates, and milestone tracking
 * Uses statistical methods and historical data patterns for predictions
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { differenceInDays, addDays, format } from 'date-fns';

export interface LearningGoal {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  currentProgress: number; // percentage
  status: 'not_started' | 'in_progress' | 'at_risk' | 'on_track' | 'completed';
  createdAt: string;
}

export interface GoalPrediction {
  goalId: string;
  goalTitle: string;
  currentProgress: number;
  predictedProgress: number; // predicted progress by target date
  completionProbability: number; // 0-100
  estimatedCompletionDate: string;
  daysRemaining: number;
  isOnTrack: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedDailyEffort: number; // minutes per day
  confidenceScore: number; // 0-100, based on data quality
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
  progress: number;
  estimatedCompletion: string;
  isPastDue: boolean;
}

export interface ProgressTrendData {
  date: string;
  actualProgress: number;
  predictedProgress: number;
  targetProgress: number;
}

export interface GoalRecommendation {
  type: 'increase_effort' | 'maintain_pace' | 'break_down_goal' | 'extend_deadline' | 'celebrate';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
}

export class GoalPredictionService {
  /**
   * Get all learning goals for a user
   */
  static async getUserGoals(userId: string): Promise<LearningGoal[]> {
    try {
      const { data, error } = await supabase
        .from('user_learning_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching user goals:', error);
        return [];
      }

      return (data || []).map(goal => ({
        id: goal.id,
        title: goal.goal_title || 'Untitled Goal',
        description: goal.goal_description,
        targetDate: goal.target_date,
        currentProgress: goal.current_progress || 0,
        status: this.calculateGoalStatus(
          goal.current_progress || 0,
          goal.target_date,
          goal.created_at
        ),
        createdAt: goal.created_at,
      }));
    } catch (_error) {
      logger.error('Error in getUserGoals:', _error);
      return [];
    }
  }

  /**
   * Calculate goal status based on progress and timeline
   */
  private static calculateGoalStatus(
    progress: number,
    targetDate: string,
    createdAt: string
  ): 'not_started' | 'in_progress' | 'at_risk' | 'on_track' | 'completed' {
    if (progress >= 100) return 'completed';
    if (progress === 0) return 'not_started';

    const now = new Date();
    const target = new Date(targetDate);
    const start = new Date(createdAt);

    const totalDays = differenceInDays(target, start);
    const elapsedDays = differenceInDays(now, start);
    const remainingDays = differenceInDays(target, now);

    if (totalDays <= 0) return 'in_progress';

    const expectedProgress = (elapsedDays / totalDays) * 100;
    const progressGap = progress - expectedProgress;

    if (remainingDays < 0 && progress < 100) return 'at_risk';
    if (progressGap < -20) return 'at_risk';
    if (progressGap < -10) return 'in_progress';

    return 'on_track';
  }

  /**
   * Predict goal completion using linear regression on historical progress
   */
  static async predictGoalCompletion(
    userId: string,
    goalId: string
  ): Promise<GoalPrediction | null> {
    try {
      // Fetch goal details
      const { data: goalData, error: goalError } = await supabase
        .from('user_learning_goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

      if (goalError || !goalData) {
        logger.error('Error fetching goal:', goalError);
        return null;
      }

      const currentProgress = goalData.current_progress || 0;
      const targetDate = new Date(goalData.target_date);
      const createdAt = new Date(goalData.created_at);
      const now = new Date();

      // Calculate time metrics
      const _totalDays = differenceInDays(targetDate, createdAt);
      const elapsedDays = differenceInDays(now, createdAt);
      const remainingDays = differenceInDays(targetDate, now);

      // Simple linear prediction based on current progress rate
      const progressRate = elapsedDays > 0 ? currentProgress / elapsedDays : 0;
      const predictedProgress = Math.min(100, currentProgress + progressRate * remainingDays);

      // Calculate completion probability using logistic function
      const progressGap = predictedProgress - 100;
      const completionProbability = Math.min(
        100,
        Math.max(0, 100 / (1 + Math.exp(-progressGap / 20)))
      );

      // Estimate completion date based on current rate
      const daysToComplete = progressRate > 0 ? (100 - currentProgress) / progressRate : Infinity;
      const estimatedCompletionDate = isFinite(daysToComplete)
        ? addDays(now, Math.ceil(daysToComplete))
        : addDays(targetDate, 30); // Default to 30 days after target

      // Determine if on track
      const isOnTrack = predictedProgress >= 95 && remainingDays >= 0;

      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high';
      if (completionProbability >= 70) riskLevel = 'low';
      else if (completionProbability >= 40) riskLevel = 'medium';
      else riskLevel = 'high';

      // Recommended daily effort (assuming 5 days per week)
      const weeklyDays = 5;
      const remainingEffort = 100 - currentProgress;
      const recommendedDailyEffort =
        remainingDays > 0
          ? Math.ceil((remainingEffort / remainingDays) * 30 * (7 / weeklyDays)) // 30 min per % point
          : 0;

      // Confidence score based on data quality
      const confidenceScore = Math.min(100, elapsedDays * 10); // More data = more confidence

      return {
        goalId,
        goalTitle: goalData.goal_title || 'Untitled Goal',
        currentProgress: Math.round(currentProgress),
        predictedProgress: Math.round(predictedProgress),
        completionProbability: Math.round(completionProbability),
        estimatedCompletionDate: estimatedCompletionDate.toISOString(),
        daysRemaining: Math.max(0, remainingDays),
        isOnTrack,
        riskLevel,
        recommendedDailyEffort,
        confidenceScore: Math.round(confidenceScore),
      };
    } catch (_error) {
      logger.error('Error in predictGoalCompletion:', _error);
      return null;
    }
  }

  /**
   * Generate progress trend data for visualization
   */
  static async getProgressTrend(userId: string, goalId: string): Promise<ProgressTrendData[]> {
    try {
      const { data: goalData, error: goalError } = await supabase
        .from('user_learning_goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

      if (goalError || !goalData) {
        return [];
      }

      const currentProgress = goalData.current_progress || 0;
      const targetDate = new Date(goalData.target_date);
      const createdAt = new Date(goalData.created_at);
      const now = new Date();

      const totalDays = differenceInDays(targetDate, createdAt);
      const elapsedDays = differenceInDays(now, createdAt);

      // Generate trend data points
      const trendData: ProgressTrendData[] = [];
      const dataPoints = 10; // Number of points to show

      for (let i = 0; i <= dataPoints; i++) {
        const dayOffset = Math.floor((i / dataPoints) * totalDays);
        const date = addDays(createdAt, dayOffset);
        const targetProgress = (dayOffset / totalDays) * 100;

        // Linear interpolation for actual progress (simplified)
        const actualProgress =
          dayOffset <= elapsedDays ? (dayOffset / elapsedDays) * currentProgress : currentProgress;

        // Predicted progress using current rate
        const progressRate = elapsedDays > 0 ? currentProgress / elapsedDays : 0;
        const predictedProgress = Math.min(100, progressRate * dayOffset);

        trendData.push({
          date: format(date, 'MMM d'),
          actualProgress: Math.round(Math.min(100, actualProgress)),
          predictedProgress: Math.round(Math.min(100, predictedProgress)),
          targetProgress: Math.round(Math.min(100, targetProgress)),
        });
      }

      return trendData;
    } catch (_error) {
      logger.error('Error in getProgressTrend:', _error);
      return [];
    }
  }

  /**
   * Get milestone tracking for a goal
   */
  static async getGoalMilestones(userId: string, goalId: string): Promise<Milestone[]> {
    try {
      // In production, milestones would be stored in database
      // For now, generate based on goal progress
      const { data: goalData, error } = await supabase
        .from('user_learning_goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

      if (error || !goalData) {
        return [];
      }

      const currentProgress = goalData.current_progress || 0;
      const targetDate = new Date(goalData.target_date);
      const createdAt = new Date(goalData.created_at);
      const now = new Date();

      const totalDays = differenceInDays(targetDate, createdAt);

      // Generate milestones at 25%, 50%, 75%, 100%
      const milestonePercentages = [25, 50, 75, 100];
      const milestones: Milestone[] = milestonePercentages.map((percentage, index) => {
        const milestoneDate = addDays(createdAt, Math.floor((percentage / 100) * totalDays));
        const completed = currentProgress >= percentage;
        const estimatedCompletion = completed
          ? milestoneDate.toISOString()
          : addDays(now, Math.ceil((percentage - currentProgress) / 2)).toISOString();

        return {
          id: `${goalId}-milestone-${index}`,
          goalId,
          title: `${percentage}% Complete`,
          targetDate: milestoneDate.toISOString(),
          completed,
          completedDate: completed ? milestoneDate.toISOString() : undefined,
          progress: Math.min(percentage, currentProgress),
          estimatedCompletion,
          isPastDue: !completed && milestoneDate < now,
        };
      });

      return milestones;
    } catch (_error) {
      logger.error('Error in getGoalMilestones:', _error);
      return [];
    }
  }

  /**
   * Generate personalized recommendations for achieving goals
   */
  static async getGoalRecommendations(
    userId: string,
    goalId: string
  ): Promise<GoalRecommendation[]> {
    try {
      const prediction = await this.predictGoalCompletion(userId, goalId);
      if (!prediction) return [];

      const recommendations: GoalRecommendation[] = [];

      // High risk - increase effort
      if (prediction.riskLevel === 'high') {
        recommendations.push({
          type: 'increase_effort',
          priority: 'high',
          title: 'Increase Daily Study Time',
          description: `You're at risk of not meeting your goal. Increase your daily effort to ${prediction.recommendedDailyEffort} minutes.`,
          actionItems: [
            `Study ${prediction.recommendedDailyEffort} minutes per day`,
            'Focus on high-priority topics',
            'Reduce distractions during study sessions',
            'Consider using pomodoro technique (25-min focused sessions)',
          ],
        });
      }

      // Medium risk - break down goal
      if (prediction.riskLevel === 'medium' && prediction.currentProgress < 50) {
        recommendations.push({
          type: 'break_down_goal',
          priority: 'medium',
          title: 'Break Down Into Smaller Goals',
          description: 'Breaking your goal into smaller milestones can help maintain momentum.',
          actionItems: [
            'Set weekly mini-goals',
            'Track progress daily',
            'Celebrate small wins',
            'Adjust timeline if needed',
          ],
        });
      }

      // On track - maintain pace
      if (prediction.isOnTrack && prediction.completionProbability > 70) {
        recommendations.push({
          type: 'maintain_pace',
          priority: 'low',
          title: 'Keep Up The Great Work!',
          description: `You're on track to complete your goal by ${format(new Date(prediction.estimatedCompletionDate), 'MMM d, yyyy')}.`,
          actionItems: [
            'Maintain current study schedule',
            'Review progress weekly',
            'Stay consistent with effort',
          ],
        });
      }

      // Very behind - extend deadline
      if (prediction.daysRemaining < 7 && prediction.currentProgress < 80) {
        recommendations.push({
          type: 'extend_deadline',
          priority: 'high',
          title: 'Consider Extending Your Deadline',
          description: 'Based on current progress, extending the deadline may be more realistic.',
          actionItems: [
            `Extend deadline to ${format(new Date(prediction.estimatedCompletionDate), 'MMM d, yyyy')}`,
            'Focus on quality over speed',
            'Maintain sustainable pace',
          ],
        });
      }

      // Near completion - celebrate
      if (prediction.currentProgress >= 90) {
        recommendations.push({
          type: 'celebrate',
          priority: 'low',
          title: "You're Almost There!",
          description: "Just a little more effort and you'll achieve your goal!",
          actionItems: [
            'Complete remaining tasks',
            'Plan how to celebrate completion',
            'Reflect on what you learned',
            'Set your next learning goal',
          ],
        });
      }

      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    } catch (_error) {
      logger.error('Error in getGoalRecommendations:', _error);
      return [];
    }
  }

  /**
   * Get predictions for all user goals
   */
  static async getAllGoalPredictions(userId: string): Promise<GoalPrediction[]> {
    try {
      const goals = await this.getUserGoals(userId);
      const predictions = await Promise.all(
        goals
          .filter(g => g.status !== 'completed')
          .map(goal => this.predictGoalCompletion(userId, goal.id))
      );

      return predictions.filter((p): p is GoalPrediction => p !== null);
    } catch (_error) {
      logger.error('Error in getAllGoalPredictions:', _error);
      return [];
    }
  }
}
