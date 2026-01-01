/**
 * Adaptive Assessment Engagement Service
 * Tracks and monitors user engagement with the adaptive assessment feature
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AlertItem } from '@/types/assessment';

/**
 * Engagement metrics for adaptive assessments
 */
export interface AdaptiveEngagementMetrics {
  // Overall metrics
  totalAssessments: number;
  completedAssessments: number;
  abandonedAssessments: number;
  completionRate: number;

  // Time metrics
  averageCompletionTime: number; // minutes
  medianCompletionTime: number;
  averageTimePerQuestion: number; // seconds

  // Question metrics
  averageQuestionsAnswered: number;
  earlyStopRate: number; // Stopped before max questions
  maxQuestionsRate: number; // Reached maximum questions

  // Performance metrics
  averageAbilityScore: number;
  averageConfidence: number; // 0-100%
  abilityDistribution: Record<string, number>; // Beginner, Intermediate, Advanced, Expert

  // Engagement indicators
  quickExitRate: number; // Exited in first 2 questions
  engagementScore: number; // 0-100 composite score
  returnRate: number; // Users who retake assessment
}

/**
 * Individual user engagement data
 */
export interface UserEngagementData {
  userId: string;
  displayName: string | null;
  email: string | null;
  totalAttempts: number;
  completedAttempts: number;
  latestAbilityScore: number | null;
  latestAssessmentDate: string | null;
  averageTimePerAssessment: number;
  engagementLevel: 'high' | 'medium' | 'low';
}

/**
 * Time-series data for trending
 */
export interface EngagementTimeSeries {
  date: string;
  completions: number;
  abandons: number;
  averageAbility: number;
  averageQuestions: number;
}

/**
 * Service class for tracking adaptive assessment engagement
 */
export class AdaptiveAssessmentEngagementService {
  /**
   * Get overall engagement metrics for adaptive assessments
   */
  static async getEngagementMetrics(
    startDate?: string,
    endDate?: string
  ): Promise<AdaptiveEngagementMetrics | null> {
    try {
      let query = supabase.from('user_ai_assessments').select('*').eq('is_adaptive', true);

      if (startDate) {
        query = query.gte('started_at', startDate);
      }
      if (endDate) {
        query = query.lte('started_at', endDate);
      }

      const { data: assessments, error } = await query;

      if (error) {
        logger.error('Error fetching engagement metrics:', error);
        return null;
      }

      if (!assessments || assessments.length === 0) {
        return this.getEmptyMetrics();
      }

      // Calculate metrics
      const total = assessments.length;
      const completed = assessments.filter(a => a.is_complete).length;
      const abandoned = total - completed;

      // Time metrics (for completed assessments)
      const completedWithTime = assessments.filter(
        a => a.is_complete && a.started_at && a.completed_at
      );

      const completionTimes = completedWithTime.map(a => {
        const start = new Date(a.started_at).getTime();
        const end = new Date(a.completed_at).getTime();
        return (end - start) / 60000; // Convert to minutes
      });

      const avgCompletionTime =
        completionTimes.length > 0
          ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
          : 0;

      const medianCompletionTime = this.calculateMedian(completionTimes);

      // Question metrics
      const questionsAnswered = assessments
        .filter(a => a.questions_answered_count > 0)
        .map(a => a.questions_answered_count);

      const avgQuestions =
        questionsAnswered.length > 0
          ? questionsAnswered.reduce((sum, q) => sum + q, 0) / questionsAnswered.length
          : 0;

      const earlyStops = assessments.filter(
        a => a.is_complete && a.questions_answered_count < 15
      ).length;

      const maxQuestionsReached = assessments.filter(a => a.questions_answered_count >= 15).length;

      // Ability metrics
      const abilityScores = assessments
        .filter(a => a.current_ability_estimate !== null)
        .map(a => a.current_ability_estimate);

      const avgAbility =
        abilityScores.length > 0
          ? abilityScores.reduce((sum, a) => sum + a, 0) / abilityScores.length
          : 0;

      // Confidence metrics
      const confidenceScores = assessments
        .filter(a => a.ability_standard_error !== null)
        .map(a => {
          const sem = a.ability_standard_error;
          return Math.max(0, Math.min(100, (1 - sem / 1.5) * 100)); // Convert SEM to confidence %
        });

      const avgConfidence =
        confidenceScores.length > 0
          ? confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length
          : 0;

      // Ability distribution
      const abilityDistribution = this.calculateAbilityDistribution(abilityScores);

      // Engagement indicators
      const quickExits = assessments.filter(
        a => !a.is_complete && a.questions_answered_count <= 2
      ).length;

      // Return rate - users who have multiple attempts
      const userCounts = new Map<string, number>();
      assessments.forEach(a => {
        userCounts.set(a.user_id, (userCounts.get(a.user_id) || 0) + 1);
      });
      const returningUsers = Array.from(userCounts.values()).filter(count => count > 1).length;
      const uniqueUsers = userCounts.size;

      // Engagement score (composite)
      const engagementScore = this.calculateEngagementScore({
        completionRate: completed / total,
        avgTimePerQuestion: avgCompletionTime / avgQuestions,
        quickExitRate: quickExits / total,
        returnRate: returningUsers / uniqueUsers,
      });

      return {
        totalAssessments: total,
        completedAssessments: completed,
        abandonedAssessments: abandoned,
        completionRate: completed / total,
        averageCompletionTime: avgCompletionTime,
        medianCompletionTime,
        averageTimePerQuestion: (avgCompletionTime * 60) / avgQuestions,
        averageQuestionsAnswered: avgQuestions,
        earlyStopRate: earlyStops / Math.max(1, completed),
        maxQuestionsRate: maxQuestionsReached / total,
        averageAbilityScore: avgAbility,
        averageConfidence: avgConfidence,
        abilityDistribution,
        quickExitRate: quickExits / total,
        engagementScore,
        returnRate: returningUsers / uniqueUsers,
      };
    } catch (_error) {
      logger.error('Error calculating engagement metrics:', _error);
      return null;
    }
  }

  /**
   * Get engagement data for individual users
   */
  static async getUserEngagementData(limit: number = 100): Promise<UserEngagementData[]> {
    try {
      const { data: assessments, error } = await supabase
        .from('user_ai_assessments')
        .select('user_id, is_complete, current_ability_estimate, started_at, completed_at')
        .eq('is_adaptive', true);

      if (error) {
        logger.error('Error fetching user engagement data:', error);
        return [];
      }

      // Get user profiles
      const userIds = [...new Set(assessments?.map(a => a.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Aggregate by user
      const userMap = new Map<string, Record<string, unknown>>();

      assessments?.forEach(assessment => {
        const userId = assessment.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            totalAttempts: 0,
            completedAttempts: 0,
            abilityScores: [],
            completionTimes: [],
            latestDate: null,
          });
        }

        const userData = userMap.get(userId);
        userData.totalAttempts++;

        if (assessment.is_complete) {
          userData.completedAttempts++;
          if (assessment.current_ability_estimate !== null) {
            userData.abilityScores.push(assessment.current_ability_estimate);
          }
        }

        if (assessment.started_at && assessment.completed_at) {
          const start = new Date(assessment.started_at).getTime();
          const end = new Date(assessment.completed_at).getTime();
          userData.completionTimes.push((end - start) / 60000);
        }

        if (
          !userData.latestDate ||
          new Date(assessment.started_at) > new Date(userData.latestDate)
        ) {
          userData.latestDate = assessment.started_at;
        }
      });

      // Transform to UserEngagementData
      const result: UserEngagementData[] = Array.from(userMap.entries())
        .map(([userId, data]) => {
          const profile = profileMap.get(userId);
          const latestAbility =
            data.abilityScores.length > 0
              ? data.abilityScores[data.abilityScores.length - 1]
              : null;
          const avgTime =
            data.completionTimes.length > 0
              ? data.completionTimes.reduce((sum: number, t: number) => sum + t, 0) /
                data.completionTimes.length
              : 0;

          const completionRate = data.completedAttempts / data.totalAttempts;
          let engagementLevel: 'high' | 'medium' | 'low' = 'low';
          if (completionRate >= 0.8 && data.totalAttempts >= 2) {
            engagementLevel = 'high';
          } else if (completionRate >= 0.5 || data.totalAttempts >= 2) {
            engagementLevel = 'medium';
          }

          return {
            userId,
            displayName: profile?.display_name || null,
            email: profile?.email || null,
            totalAttempts: data.totalAttempts,
            completedAttempts: data.completedAttempts,
            latestAbilityScore: latestAbility,
            latestAssessmentDate: data.latestDate,
            averageTimePerAssessment: avgTime,
            engagementLevel,
          };
        })
        .sort((a, b) => b.totalAttempts - a.totalAttempts)
        .slice(0, limit);

      return result;
    } catch (_error) {
      logger.error('Error fetching user engagement data:', _error);
      return [];
    }
  }

  /**
   * Get time-series data for engagement trending
   */
  static async getEngagementTimeSeries(days: number = 30): Promise<EngagementTimeSeries[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: assessments, error } = await supabase
        .from('user_ai_assessments')
        .select('started_at, is_complete, current_ability_estimate, questions_answered_count')
        .eq('is_adaptive', true)
        .gte('started_at', startDate.toISOString());

      if (error || !assessments) {
        logger.error('Error fetching time series data:', error);
        return [];
      }

      // Group by date
      const dateMap = new Map<string, Record<string, unknown>>();

      assessments.forEach(assessment => {
        const date = assessment.started_at.split('T')[0]; // Get YYYY-MM-DD
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            completions: 0,
            abandons: 0,
            abilityScores: [],
            questionCounts: [],
          });
        }

        const dayData = dateMap.get(date);

        if (assessment.is_complete) {
          dayData.completions++;
          if (assessment.current_ability_estimate !== null) {
            dayData.abilityScores.push(assessment.current_ability_estimate);
          }
          if (assessment.questions_answered_count > 0) {
            dayData.questionCounts.push(assessment.questions_answered_count);
          }
        } else {
          dayData.abandons++;
        }
      });

      // Transform to time series format
      const result: EngagementTimeSeries[] = Array.from(dateMap.values())
        .map(dayData => ({
          date: dayData.date,
          completions: dayData.completions,
          abandons: dayData.abandons,
          averageAbility:
            dayData.abilityScores.length > 0
              ? dayData.abilityScores.reduce((sum: number, s: number) => sum + s, 0) /
                dayData.abilityScores.length
              : 0,
          averageQuestions:
            dayData.questionCounts.length > 0
              ? dayData.questionCounts.reduce((sum: number, q: number) => sum + q, 0) /
                dayData.questionCounts.length
              : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return result;
    } catch (_error) {
      logger.error('Error fetching time series data:', _error);
      return [];
    }
  }

  /**
   * Track a specific engagement event
   */
  static async trackEvent(
    userId: string,
    eventType:
      | 'assessment_started'
      | 'assessment_completed'
      | 'assessment_abandoned'
      | 'question_answered'
      | 'early_exit',
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase.from('engagement_events').insert({
        user_id: userId,
        event_type: eventType,
        event_source: 'adaptive_assessment',
        metadata,
        created_at: new Date().toISOString(),
      });
    } catch (_error) {
      logger.error('Error tracking engagement event:', _error);
    }
  }

  /**
   * Get alerts for engagement issues
   */
  static async getEngagementAlerts(): Promise<
    {
      type: 'warning' | 'critical';
      message: string;
      metric: string;
      value: number;
    }[]
  > {
    const alerts: AlertItem[] = [];
    const metrics = await this.getEngagementMetrics();

    if (!metrics) return alerts;

    // Check completion rate
    if (metrics.completionRate < 0.5) {
      alerts.push({
        type: 'critical',
        message: 'Low completion rate detected',
        metric: 'completionRate',
        value: metrics.completionRate,
      });
    } else if (metrics.completionRate < 0.7) {
      alerts.push({
        type: 'warning',
        message: 'Completion rate below target',
        metric: 'completionRate',
        value: metrics.completionRate,
      });
    }

    // Check quick exit rate
    if (metrics.quickExitRate > 0.3) {
      alerts.push({
        type: 'critical',
        message: 'High quick exit rate - users leaving early',
        metric: 'quickExitRate',
        value: metrics.quickExitRate,
      });
    }

    // Check average confidence
    if (metrics.averageConfidence < 60) {
      alerts.push({
        type: 'warning',
        message: 'Low confidence levels - assessment may need tuning',
        metric: 'averageConfidence',
        value: metrics.averageConfidence,
      });
    }

    // Check engagement score
    if (metrics.engagementScore < 50) {
      alerts.push({
        type: 'critical',
        message: 'Overall engagement score is low',
        metric: 'engagementScore',
        value: metrics.engagementScore,
      });
    }

    return alerts;
  }

  // ========== Helper Methods ==========

  private static getEmptyMetrics(): AdaptiveEngagementMetrics {
    return {
      totalAssessments: 0,
      completedAssessments: 0,
      abandonedAssessments: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      medianCompletionTime: 0,
      averageTimePerQuestion: 0,
      averageQuestionsAnswered: 0,
      earlyStopRate: 0,
      maxQuestionsRate: 0,
      averageAbilityScore: 0,
      averageConfidence: 0,
      abilityDistribution: {},
      quickExitRate: 0,
      engagementScore: 0,
      returnRate: 0,
    };
  }

  private static calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private static calculateAbilityDistribution(abilityScores: number[]): Record<string, number> {
    const distribution: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
    };

    abilityScores.forEach(score => {
      if (score < -1.0) distribution.beginner++;
      else if (score < 0.5) distribution.intermediate++;
      else if (score < 1.5) distribution.advanced++;
      else distribution.expert++;
    });

    return distribution;
  }

  private static calculateEngagementScore(factors: {
    completionRate: number;
    avgTimePerQuestion: number;
    quickExitRate: number;
    returnRate: number;
  }): number {
    // Weighted composite score
    const weights = {
      completion: 0.4,
      timePerQuestion: 0.2,
      quickExit: 0.2,
      return: 0.2,
    };

    // Normalize time per question (optimal range: 20-60 seconds)
    const timeScore = Math.max(
      0,
      Math.min(100, 100 - Math.abs(factors.avgTimePerQuestion - 40) * 2)
    );

    const score =
      factors.completionRate * 100 * weights.completion +
      timeScore * weights.timePerQuestion +
      (1 - factors.quickExitRate) * 100 * weights.quickExit +
      factors.returnRate * 100 * weights.return;

    return Math.round(score);
  }
}
