/**
 * Enhanced Goal Prediction Service
 *
 * Multi-factor ML-based goal completion prediction.
 * Uses Monte Carlo simulation for confidence intervals.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  EnhancedGoalPrediction,
  RiskFactor,
  AccelerationFactor,
} from '../feedback-loop/FeedbackLoopTypes';

interface GoalData {
  id: string;
  userId: string;
  title: string;
  targetDate: Date;
  targetProgress: number;
  currentProgress: number;
  createdAt: Date;
}

interface HistoricalProgress {
  date: Date;
  progress: number;
}

interface PredictionFactors {
  consistency: number; // 0-1
  difficultyAlignment: number; // 0-1
  velocity: number; // progress per day
  trend: 'improving' | 'stable' | 'declining';
  recentMomentum: number; // 0-1
}

export class EnhancedGoalPredictionService {
  private readonly SIMULATION_RUNS = 1000;

  /**
   * Get enhanced goal prediction with Monte Carlo simulation
   */
  async predictGoalCompletionEnhanced(
    userId: string,
    goalId: string
  ): Promise<EnhancedGoalPrediction | null> {
    try {
      // Fetch goal data
      const goalData = await this.fetchGoalData(userId, goalId);
      if (!goalData) {
        logger.warn('Goal not found:', { userId, goalId });
        return null;
      }

      // Fetch historical progress
      const historicalProgress = await this.fetchHistoricalProgress(userId, goalId);

      // Calculate prediction factors
      const factors = this.calculatePredictionFactors(goalData, historicalProgress);

      // Run Monte Carlo simulation
      const simulation = this.runMonteCarloSimulation(goalData, factors);

      // Calculate risk and acceleration factors
      const riskFactors = this.identifyRiskFactors(factors, goalData);
      const accelerationFactors = this.identifyAccelerationFactors(factors, goalData);

      // Determine trajectory status
      const trajectory = this.determineTrajectory(goalData, factors, simulation);

      // Calculate required daily progress
      const daysRemaining = Math.max(
        1,
        Math.ceil((goalData.targetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      );
      const progressRemaining = Math.max(0, goalData.targetProgress - goalData.currentProgress);
      const requiredDailyProgress = progressRemaining / daysRemaining;

      return {
        goalId,
        userId,
        completionProbability: simulation.probability,
        predictedCompletionDate: simulation.predictedDate,
        confidenceInterval: simulation.confidenceInterval,
        riskFactors,
        accelerationFactors,
        trajectory,
        daysRemaining,
        requiredDailyProgress,
        currentDailyProgress: factors.velocity,
      };
    } catch (error) {
      logger.error('Error predicting goal completion:', error);
      return null;
    }
  }

  /**
   * Get predictions for all user goals
   */
  async predictAllGoals(userId: string): Promise<EnhancedGoalPrediction[]> {
    try {
      const { data: goals, error } = await supabase
        .from('learning_goals')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error || !goals) {
        return [];
      }

      const predictions = await Promise.all(
        goals.map(goal => this.predictGoalCompletionEnhanced(userId, goal.id))
      );

      return predictions.filter((p): p is EnhancedGoalPrediction => p !== null);
    } catch (error) {
      logger.error('Error predicting all goals:', error);
      return [];
    }
  }

  /**
   * Get goals at risk (< 50% probability)
   */
  async getGoalsAtRisk(userId: string): Promise<EnhancedGoalPrediction[]> {
    const predictions = await this.predictAllGoals(userId);
    return predictions.filter(p => p.completionProbability < 0.5);
  }

  /**
   * Fetch goal data from database
   */
  private async fetchGoalData(userId: string, goalId: string): Promise<GoalData | null> {
    // Try learning_goals table first
    const { data: goal, error } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (error || !goal) {
      // Try ai_study_plans as fallback
      const { data: plan } = await supabase
        .from('ai_study_plans')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

      if (!plan) return null;

      return {
        id: plan.id,
        userId: plan.user_id,
        title: plan.name,
        targetDate: new Date(plan.end_date),
        targetProgress: 100,
        currentProgress: plan.completion_percentage || 0,
        createdAt: new Date(plan.created_at),
      };
    }

    return {
      id: goal.id,
      userId: goal.user_id,
      title: goal.title,
      targetDate: new Date(goal.target_date),
      targetProgress: goal.target_progress || 100,
      currentProgress: goal.current_progress || 0,
      createdAt: new Date(goal.created_at),
    };
  }

  /**
   * Fetch historical progress data
   */
  private async fetchHistoricalProgress(
    userId: string,
    goalId: string
  ): Promise<HistoricalProgress[]> {
    const { data, error } = await supabase
      .from('goal_progress_history')
      .select('recorded_at, progress')
      .eq('goal_id', goalId)
      .order('recorded_at', { ascending: true });

    if (error || !data) {
      // Generate synthetic data from goal creation
      const goal = await this.fetchGoalData(userId, goalId);
      if (!goal) return [];

      return [
        { date: goal.createdAt, progress: 0 },
        { date: new Date(), progress: goal.currentProgress },
      ];
    }

    return data.map(d => ({
      date: new Date(d.recorded_at),
      progress: d.progress,
    }));
  }

  /**
   * Calculate prediction factors from historical data
   */
  private calculatePredictionFactors(
    goal: GoalData,
    history: HistoricalProgress[]
  ): PredictionFactors {
    // Calculate velocity (progress per day)
    let velocity = 0;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const daysDiff = Math.max(
        1,
        (last.date.getTime() - first.date.getTime()) / (24 * 60 * 60 * 1000)
      );
      velocity = (last.progress - first.progress) / daysDiff;
    } else {
      const daysSinceStart = Math.max(
        1,
        (Date.now() - goal.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      );
      velocity = goal.currentProgress / daysSinceStart;
    }

    // Calculate consistency (coefficient of variation of daily progress)
    let consistency = 0.5; // default
    if (history.length >= 5) {
      const dailyChanges: number[] = [];
      for (let i = 1; i < history.length; i++) {
        const daysDiff = Math.max(
          1,
          (history[i].date.getTime() - history[i - 1].date.getTime()) / (24 * 60 * 60 * 1000)
        );
        const dailyChange = (history[i].progress - history[i - 1].progress) / daysDiff;
        dailyChanges.push(dailyChange);
      }

      if (dailyChanges.length > 0) {
        const mean = dailyChanges.reduce((a, b) => a + b, 0) / dailyChanges.length;
        const variance =
          dailyChanges.reduce((sum, c) => sum + (c - mean) ** 2, 0) / dailyChanges.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean !== 0 ? stdDev / Math.abs(mean) : 1;
        consistency = Math.max(0, Math.min(1, 1 - cv));
      }
    }

    // Calculate trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (history.length >= 4) {
      const midpoint = Math.floor(history.length / 2);
      const firstHalf = history.slice(0, midpoint);
      const secondHalf = history.slice(midpoint);

      const firstVelocity = this.calculateSegmentVelocity(firstHalf);
      const secondVelocity = this.calculateSegmentVelocity(secondHalf);

      if (secondVelocity > firstVelocity * 1.2) {
        trend = 'improving';
      } else if (secondVelocity < firstVelocity * 0.8) {
        trend = 'declining';
      }
    }

    // Calculate recent momentum (last 7 days vs overall)
    let recentMomentum = 0.5;
    const recentHistory = history.filter(
      h => h.date.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    if (recentHistory.length >= 2) {
      const recentVelocity = this.calculateSegmentVelocity(recentHistory);
      if (velocity > 0) {
        recentMomentum = Math.min(1, recentVelocity / velocity);
      }
    }

    // Calculate difficulty alignment (how well current pace matches required pace)
    const daysRemaining = Math.max(
      1,
      (goal.targetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    const requiredVelocity = (goal.targetProgress - goal.currentProgress) / daysRemaining;
    const difficultyAlignment =
      requiredVelocity > 0 ? Math.min(1, velocity / requiredVelocity) : velocity >= 0 ? 1 : 0;

    return {
      consistency,
      difficultyAlignment,
      velocity,
      trend,
      recentMomentum,
    };
  }

  /**
   * Calculate velocity for a segment of history
   */
  private calculateSegmentVelocity(segment: HistoricalProgress[]): number {
    if (segment.length < 2) return 0;

    const first = segment[0];
    const last = segment[segment.length - 1];
    const daysDiff = Math.max(
      1,
      (last.date.getTime() - first.date.getTime()) / (24 * 60 * 60 * 1000)
    );
    return (last.progress - first.progress) / daysDiff;
  }

  /**
   * Run Monte Carlo simulation for completion probability
   */
  private runMonteCarloSimulation(
    goal: GoalData,
    factors: PredictionFactors
  ): {
    probability: number;
    predictedDate: Date;
    confidenceInterval: [Date, Date];
  } {
    const daysRemaining = Math.max(
      1,
      (goal.targetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );

    const completionDays: number[] = [];
    let successCount = 0;

    // Base velocity with noise
    const baseVelocity = factors.velocity;
    const velocityStdDev = baseVelocity * (1 - factors.consistency) * 0.5;

    for (let i = 0; i < this.SIMULATION_RUNS; i++) {
      let progress = goal.currentProgress;
      let days = 0;

      // Simulate day by day
      while (progress < goal.targetProgress && days < daysRemaining * 2) {
        // Random daily velocity with trend adjustment
        let dailyVelocity = baseVelocity + this.randomNormal() * velocityStdDev;

        // Apply trend factor
        if (factors.trend === 'improving') {
          dailyVelocity *= 1 + 0.01 * days; // Accelerating
        } else if (factors.trend === 'declining') {
          dailyVelocity *= 1 - 0.005 * days; // Decelerating
        }

        // Apply momentum factor
        dailyVelocity *= 0.5 + factors.recentMomentum * 0.5;

        progress += Math.max(0, dailyVelocity);
        days++;
      }

      if (progress >= goal.targetProgress) {
        completionDays.push(days);
        if (days <= daysRemaining) {
          successCount++;
        }
      }
    }

    const probability = successCount / this.SIMULATION_RUNS;

    // Calculate predicted completion date
    let predictedDate: Date;
    if (completionDays.length > 0) {
      completionDays.sort((a, b) => a - b);
      const medianDays = completionDays[Math.floor(completionDays.length / 2)];
      predictedDate = new Date(Date.now() + medianDays * 24 * 60 * 60 * 1000);
    } else {
      // If never completed in simulation, estimate based on velocity
      const estimatedDays =
        factors.velocity > 0
          ? (goal.targetProgress - goal.currentProgress) / factors.velocity
          : daysRemaining * 3;
      predictedDate = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);
    }

    // Calculate confidence interval (10th and 90th percentile)
    let lowerBound: Date;
    let upperBound: Date;
    if (completionDays.length >= 10) {
      const p10 = completionDays[Math.floor(completionDays.length * 0.1)];
      const p90 = completionDays[Math.floor(completionDays.length * 0.9)];
      lowerBound = new Date(Date.now() + p10 * 24 * 60 * 60 * 1000);
      upperBound = new Date(Date.now() + p90 * 24 * 60 * 60 * 1000);
    } else {
      // Wide interval if insufficient data
      lowerBound = new Date(predictedDate.getTime() - 14 * 24 * 60 * 60 * 1000);
      upperBound = new Date(predictedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    return {
      probability,
      predictedDate,
      confidenceInterval: [lowerBound, upperBound],
    };
  }

  /**
   * Generate random number from normal distribution
   */
  private randomNormal(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(factors: PredictionFactors, goal: GoalData): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Consistency risk
    if (factors.consistency < 0.4) {
      risks.push({
        type: 'consistency',
        severity: factors.consistency < 0.2 ? 'high' : 'medium',
        description: 'Inconsistent study patterns may affect goal completion.',
        mitigation: 'Try to establish a regular study schedule.',
      });
    }

    // Difficulty alignment risk
    if (factors.difficultyAlignment < 0.5) {
      risks.push({
        type: 'difficulty',
        severity: factors.difficultyAlignment < 0.25 ? 'high' : 'medium',
        description: 'Current pace is below required pace for on-time completion.',
        mitigation: 'Increase study time or adjust goal deadline.',
      });
    }

    // Time risk
    const daysRemaining = (goal.targetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    const progressRemaining = goal.targetProgress - goal.currentProgress;
    if (daysRemaining < 7 && progressRemaining > 30) {
      risks.push({
        type: 'time',
        severity: 'high',
        description: 'Limited time remaining with significant progress needed.',
        mitigation: 'Consider intensive study sessions or deadline extension.',
      });
    }

    // Trend risk
    if (factors.trend === 'declining') {
      risks.push({
        type: 'engagement',
        severity: factors.recentMomentum < 0.3 ? 'high' : 'medium',
        description: 'Recent progress is slowing down.',
        mitigation: 'Review motivation and consider changing study approach.',
      });
    }

    return risks;
  }

  /**
   * Identify acceleration factors
   */
  private identifyAccelerationFactors(
    factors: PredictionFactors,
    _goal: GoalData
  ): AccelerationFactor[] {
    const accelerators: AccelerationFactor[] = [];

    // Momentum factor
    if (factors.recentMomentum > 0.8) {
      accelerators.push({
        type: 'momentum',
        strength: factors.recentMomentum > 1.2 ? 'high' : 'medium',
        description: 'Strong recent momentum is accelerating progress.',
        leverage: 'Maintain current study intensity to ride the momentum.',
      });
    }

    // Trend factor
    if (factors.trend === 'improving') {
      accelerators.push({
        type: 'momentum',
        strength: 'medium',
        description: 'Learning curve is improving over time.',
        leverage: 'Building on foundational knowledge is paying off.',
      });
    }

    // Efficiency factor
    if (factors.velocity > 0 && factors.difficultyAlignment > 1.2) {
      accelerators.push({
        type: 'efficiency',
        strength: factors.difficultyAlignment > 1.5 ? 'high' : 'medium',
        description: 'Progressing faster than required pace.',
        leverage: 'Consider adding stretch goals or deeper content.',
      });
    }

    // Consistency factor
    if (factors.consistency > 0.8) {
      accelerators.push({
        type: 'dedication',
        strength: factors.consistency > 0.9 ? 'high' : 'medium',
        description: 'Excellent consistency in study habits.',
        leverage: 'Reliable habits create compounding benefits.',
      });
    }

    return accelerators;
  }

  /**
   * Determine trajectory status
   */
  private determineTrajectory(
    goal: GoalData,
    factors: PredictionFactors,
    simulation: { probability: number }
  ): 'on_track' | 'at_risk' | 'ahead' | 'behind' {
    if (simulation.probability > 0.9 && factors.difficultyAlignment > 1.2) {
      return 'ahead';
    }
    if (simulation.probability > 0.7) {
      return 'on_track';
    }
    if (simulation.probability > 0.4) {
      return 'at_risk';
    }
    return 'behind';
  }
}

export const enhancedGoalPredictionService = new EnhancedGoalPredictionService();
