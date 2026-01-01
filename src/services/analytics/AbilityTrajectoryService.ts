/**
 * Ability Trajectory Service
 *
 * Tracks and visualizes ability over time with confidence bands.
 * Provides velocity calculation and forecasting.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  AbilitySnapshot,
  AbilityTrajectory,
  AbilityForecast,
} from '../feedback-loop/FeedbackLoopTypes';

interface TrajectoryAnalysis {
  trajectory: AbilityTrajectory;
  insights: AbilityInsight[];
  chartData: AbilityChartPoint[];
}

interface AbilityInsight {
  type: 'improvement' | 'plateau' | 'decline' | 'breakthrough' | 'consistency';
  title: string;
  description: string;
  significance: 'low' | 'medium' | 'high';
}

interface AbilityChartPoint {
  date: string;
  ability: number;
  confidenceLower: number;
  confidenceUpper: number;
  standardError: number;
  isForecast: boolean;
}

export class AbilityTrajectoryService {
  /**
   * Record ability snapshot after assessment
   */
  async recordAbilitySnapshot(
    userId: string,
    categoryId: string | null,
    ability: number,
    standardError: number,
    assessmentId?: string
  ): Promise<AbilitySnapshot | null> {
    try {
      const confidenceInterval = 1.96 * standardError; // 95% CI

      const snapshot: Omit<AbilitySnapshot, 'id'> = {
        userId,
        categoryId: categoryId || undefined,
        abilityEstimate: ability,
        standardError,
        confidenceLower: ability - confidenceInterval,
        confidenceUpper: ability + confidenceInterval,
        sourceAssessmentId: assessmentId,
        recordedAt: new Date(),
      };

      const { data, error } = await supabase
        .from('ability_trajectory')
        .insert({
          user_id: snapshot.userId,
          category_id: snapshot.categoryId,
          ability_estimate: snapshot.abilityEstimate,
          standard_error: snapshot.standardError,
          confidence_lower: snapshot.confidenceLower,
          confidence_upper: snapshot.confidenceUpper,
          source_assessment_id: snapshot.sourceAssessmentId,
          recorded_at: snapshot.recordedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to record ability snapshot:', error);
        return null;
      }

      return { ...snapshot, id: data.id };
    } catch (_error) {
      logger.error('Error recording ability snapshot:', _error);
      return null;
    }
  }

  /**
   * Get ability trajectory analysis
   */
  async getAbilityTrajectory(
    userId: string,
    categoryId?: string,
    weeks: number = 12
  ): Promise<TrajectoryAnalysis | null> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - weeks * 7);

      let query = supabase
        .from('ability_trajectory')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data: snapshots, error } = await query;

      if (error || !snapshots || snapshots.length < 2) {
        logger.info('Not enough data for trajectory analysis', {
          userId,
          count: snapshots?.length,
        });
        return null;
      }

      // Build trajectory
      const trajectory = this.buildTrajectory(userId, categoryId, snapshots);

      // Generate insights
      const insights = this.generateInsights(trajectory);

      // Build chart data with forecast
      const chartData = this.buildChartData(trajectory, 4); // 4 weeks forecast

      return {
        trajectory,
        insights,
        chartData,
      };
    } catch (_error) {
      logger.error('Error getting ability trajectory:', _error);
      return null;
    }
  }

  /**
   * Calculate learning velocity (ability change per week)
   */
  async calculateLearningVelocity(
    userId: string,
    categoryId?: string
  ): Promise<{ velocity: number; trend: 'accelerating' | 'stable' | 'decelerating' } | null> {
    try {
      const trajectory = await this.getAbilityTrajectory(userId, categoryId, 8);
      if (!trajectory) return null;

      const velocity = trajectory.trajectory.velocity;

      // Calculate second derivative (change in velocity)
      const snapshots = trajectory.trajectory.snapshots;
      if (snapshots.length < 4) {
        return { velocity, trend: 'stable' };
      }

      const midpoint = Math.floor(snapshots.length / 2);
      const firstHalf = snapshots.slice(0, midpoint);
      const secondHalf = snapshots.slice(midpoint);

      const firstVelocity = this.calculateSegmentVelocity(firstHalf);
      const secondVelocity = this.calculateSegmentVelocity(secondHalf);

      let trend: 'accelerating' | 'stable' | 'decelerating';
      if (secondVelocity > firstVelocity + 0.05) {
        trend = 'accelerating';
      } else if (secondVelocity < firstVelocity - 0.05) {
        trend = 'decelerating';
      } else {
        trend = 'stable';
      }

      return { velocity, trend };
    } catch (_error) {
      logger.error('Error calculating learning velocity:', _error);
      return null;
    }
  }

  /**
   * Forecast ability at future date
   */
  async forecastAbility(
    userId: string,
    categoryId: string | undefined,
    weeksAhead: number
  ): Promise<AbilityForecast | null> {
    try {
      const trajectory = await this.getAbilityTrajectory(userId, categoryId, 12);
      if (!trajectory) return null;

      const currentAbility = trajectory.trajectory.currentAbility;
      const velocity = trajectory.trajectory.velocity;
      const volatility = trajectory.trajectory.volatility;

      // Linear projection
      const predictedAbility = currentAbility + velocity * weeksAhead;

      // Confidence interval widens with time
      const uncertaintyGrowth = volatility * Math.sqrt(weeksAhead);
      const confidenceInterval: [number, number] = [
        predictedAbility - 1.96 * uncertaintyGrowth,
        predictedAbility + 1.96 * uncertaintyGrowth,
      ];

      // Reliability decreases with forecast horizon
      const reliability = Math.max(0.3, 1 - weeksAhead * 0.1);

      return {
        predictedAbility,
        confidenceInterval,
        weeksAhead,
        reliability,
      };
    } catch (_error) {
      logger.error('Error forecasting ability:', _error);
      return null;
    }
  }

  /**
   * Get weekly velocity snapshots for trending
   */
  async getWeeklyVelocitySnapshots(userId: string, categoryId?: string, weeks: number = 8) {
    try {
      let query = supabase
        .from('learning_velocity_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })
        .limit(weeks);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching velocity snapshots:', error);
        return [];
      }

      return data || [];
    } catch (_error) {
      logger.error('Error getting velocity snapshots:', _error);
      return [];
    }
  }

  /**
   * Build trajectory from snapshots
   */
  private buildTrajectory(
    userId: string,
    categoryId: string | undefined,
    snapshots: Array<{
      id: string;
      user_id: string;
      category_id: string | null;
      ability_estimate: number;
      standard_error: number;
      confidence_lower: number;
      confidence_upper: number;
      source_assessment_id?: string;
      recorded_at: string;
    }>
  ): AbilityTrajectory {
    const mappedSnapshots: AbilitySnapshot[] = snapshots.map(s => ({
      id: s.id,
      userId: s.user_id,
      categoryId: s.category_id,
      abilityEstimate: s.ability_estimate,
      standardError: s.standard_error,
      confidenceLower: s.confidence_lower,
      confidenceUpper: s.confidence_upper,
      sourceAssessmentId: s.source_assessment_id,
      recordedAt: new Date(s.recorded_at),
    }));

    const currentAbility = mappedSnapshots[mappedSnapshots.length - 1].abilityEstimate;
    const velocity = this.calculateSegmentVelocity(mappedSnapshots);
    const volatility = this.calculateVolatility(mappedSnapshots);
    const trend = this.determineTrend(mappedSnapshots);

    return {
      userId,
      categoryId,
      snapshots: mappedSnapshots,
      currentAbility,
      trend,
      velocity,
      volatility,
      forecast: {
        predictedAbility: currentAbility + velocity * 4,
        confidenceInterval: [
          currentAbility + velocity * 4 - volatility * 2,
          currentAbility + velocity * 4 + volatility * 2,
        ],
        weeksAhead: 4,
        reliability: 0.7,
      },
    };
  }

  /**
   * Calculate velocity for a segment of snapshots
   */
  private calculateSegmentVelocity(snapshots: AbilitySnapshot[]): number {
    if (snapshots.length < 2) return 0;

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const weeksDiff =
      (last.recordedAt.getTime() - first.recordedAt.getTime()) / (7 * 24 * 60 * 60 * 1000);

    if (weeksDiff < 0.1) return 0;

    return (last.abilityEstimate - first.abilityEstimate) / weeksDiff;
  }

  /**
   * Calculate volatility (standard deviation of changes)
   */
  private calculateVolatility(snapshots: AbilitySnapshot[]): number {
    if (snapshots.length < 3) return 0.5;

    const changes: number[] = [];
    for (let i = 1; i < snapshots.length; i++) {
      changes.push(snapshots[i].abilityEstimate - snapshots[i - 1].abilityEstimate);
    }

    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const squaredDiffs = changes.map(c => (c - mean) ** 2);
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / changes.length;

    return Math.sqrt(variance);
  }

  /**
   * Determine trend from snapshots
   */
  private determineTrend(snapshots: AbilitySnapshot[]): 'improving' | 'stable' | 'declining' {
    if (snapshots.length < 3) return 'stable';

    const velocity = this.calculateSegmentVelocity(snapshots);

    if (velocity > 0.05) return 'improving';
    if (velocity < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Generate insights from trajectory
   */
  private generateInsights(trajectory: AbilityTrajectory): AbilityInsight[] {
    const insights: AbilityInsight[] = [];
    const { velocity, volatility, trend, snapshots } = trajectory;

    // Improvement insight
    if (trend === 'improving' && velocity > 0.1) {
      insights.push({
        type: 'improvement',
        title: 'Strong Progress',
        description: `Your ability is improving at ${(velocity * 100).toFixed(0)}% per week. Keep up the great work!`,
        significance: velocity > 0.2 ? 'high' : 'medium',
      });
    }

    // Plateau insight
    if (trend === 'stable' && volatility < 0.1 && snapshots.length > 5) {
      insights.push({
        type: 'plateau',
        title: 'Learning Plateau',
        description:
          'Your ability has stabilized. Consider more challenging material to continue growing.',
        significance: 'medium',
      });
    }

    // Decline insight
    if (trend === 'declining' && velocity < -0.05) {
      insights.push({
        type: 'decline',
        title: 'Review Needed',
        description:
          'Recent performance shows some regression. A review session might help solidify knowledge.',
        significance: Math.abs(velocity) > 0.1 ? 'high' : 'low',
      });
    }

    // Breakthrough insight
    const recentSnapshots = snapshots.slice(-3);
    if (recentSnapshots.length >= 3) {
      const recentImprovement =
        recentSnapshots[2].abilityEstimate - recentSnapshots[0].abilityEstimate;
      if (recentImprovement > 0.3) {
        insights.push({
          type: 'breakthrough',
          title: 'Learning Breakthrough!',
          description:
            "You've made exceptional progress recently. Your understanding is advancing rapidly.",
          significance: 'high',
        });
      }
    }

    // Consistency insight
    if (volatility < 0.15 && trend === 'improving') {
      insights.push({
        type: 'consistency',
        title: 'Consistent Learner',
        description:
          'Your steady progress shows great learning habits. Consistency is key to mastery.',
        significance: 'medium',
      });
    }

    return insights;
  }

  /**
   * Build chart data with forecast
   */
  private buildChartData(
    trajectory: AbilityTrajectory,
    forecastWeeks: number
  ): AbilityChartPoint[] {
    const chartData: AbilityChartPoint[] = [];

    // Historical data
    for (const snapshot of trajectory.snapshots) {
      chartData.push({
        date: snapshot.recordedAt.toISOString().split('T')[0],
        ability: snapshot.abilityEstimate,
        confidenceLower: snapshot.confidenceLower,
        confidenceUpper: snapshot.confidenceUpper,
        standardError: snapshot.standardError,
        isForecast: false,
      });
    }

    // Forecast data
    const lastSnapshot = trajectory.snapshots[trajectory.snapshots.length - 1];
    const velocity = trajectory.velocity;
    const volatility = trajectory.volatility;

    for (let week = 1; week <= forecastWeeks; week++) {
      const forecastDate = new Date(lastSnapshot.recordedAt);
      forecastDate.setDate(forecastDate.getDate() + week * 7);

      const forecastAbility = lastSnapshot.abilityEstimate + velocity * week;
      const uncertainty = volatility * Math.sqrt(week);

      chartData.push({
        date: forecastDate.toISOString().split('T')[0],
        ability: forecastAbility,
        confidenceLower: forecastAbility - 1.96 * uncertainty,
        confidenceUpper: forecastAbility + 1.96 * uncertainty,
        standardError: uncertainty,
        isForecast: true,
      });
    }

    return chartData;
  }
}

export const abilityTrajectoryService = new AbilityTrajectoryService();
