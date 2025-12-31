/**
 * Real-time Analytics Hook
 *
 * Master hook combining all analytics services.
 * Provides ability trajectory, study effectiveness, and goal predictions.
 * Supports real-time updates via Supabase subscriptions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  abilityTrajectoryService,
  studyEffectivenessService,
  enhancedGoalPredictionService,
} from '@/services/analytics';
import {
  AbilityTrajectory,
  StudyPatternInsight,
  EnhancedGoalPrediction,
  OptimalStudySchedule,
} from '@/services/feedback-loop/FeedbackLoopTypes';

interface AbilityChartPoint {
  date: string;
  ability: number;
  confidenceLower: number;
  confidenceUpper: number;
  standardError: number;
  isForecast: boolean;
}

interface AbilityInsight {
  type: 'improvement' | 'plateau' | 'decline' | 'breakthrough' | 'consistency';
  title: string;
  description: string;
  significance: 'low' | 'medium' | 'high';
}

interface TrajectoryAnalysis {
  trajectory: AbilityTrajectory;
  insights: AbilityInsight[];
  chartData: AbilityChartPoint[];
}

interface StudyStats {
  totalSessions: number;
  totalMinutes: number;
  totalQuestions: number;
  overallAccuracy: number;
  averageSessionLength: number;
  averageFocusScore: number;
  abilityGain: number;
  studyStreak: number;
}

interface RealTimeAnalyticsData {
  // Ability trajectory
  abilityTrajectory: TrajectoryAnalysis | null;
  learningVelocity: { velocity: number; trend: 'accelerating' | 'stable' | 'decelerating' } | null;

  // Study effectiveness
  studyInsights: StudyPatternInsight[];
  optimalSchedule: OptimalStudySchedule | null;
  studyStats: StudyStats | null;

  // Goal predictions
  goalPredictions: EnhancedGoalPrediction[];
  goalsAtRisk: EnhancedGoalPrediction[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  subscribeToUpdates: () => () => void;
}

export function useRealTimeAnalytics(
  categoryId?: string,
  autoRefreshInterval?: number
): RealTimeAnalyticsData {
  const { user } = useAuth();
  const userId = user?.id;

  // State
  const [abilityTrajectory, setAbilityTrajectory] = useState<TrajectoryAnalysis | null>(null);
  const [learningVelocity, setLearningVelocity] = useState<{
    velocity: number;
    trend: 'accelerating' | 'stable' | 'decelerating';
  } | null>(null);
  const [studyInsights, setStudyInsights] = useState<StudyPatternInsight[]>([]);
  const [optimalSchedule, setOptimalSchedule] = useState<OptimalStudySchedule | null>(null);
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [goalPredictions, setGoalPredictions] = useState<EnhancedGoalPrediction[]>([]);
  const [goalsAtRisk, setGoalsAtRisk] = useState<EnhancedGoalPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all analytics data
   */
  const fetchAnalytics = useCallback(
    async (isRefresh = false) => {
      if (!userId) return;

      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        // Fetch all analytics in parallel
        const [
          trajectoryData,
          velocityData,
          insightsData,
          scheduleData,
          statsData,
          predictionsData,
          atRiskData,
        ] = await Promise.all([
          abilityTrajectoryService.getAbilityTrajectory(userId, categoryId, 12),
          abilityTrajectoryService.calculateLearningVelocity(userId, categoryId),
          studyEffectivenessService.generateStudyInsights(userId),
          studyEffectivenessService.generateOptimalSchedule(userId),
          studyEffectivenessService.getStudyStatsSummary(userId, 30),
          enhancedGoalPredictionService.predictAllGoals(userId),
          enhancedGoalPredictionService.getGoalsAtRisk(userId),
        ]);

        setAbilityTrajectory(trajectoryData);
        setLearningVelocity(velocityData);
        setStudyInsights(insightsData);
        setOptimalSchedule(scheduleData);
        setStudyStats(statsData);
        setGoalPredictions(predictionsData);
        setGoalsAtRisk(atRiskData);
      } catch (err) {
        logger.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId, categoryId]
  );

  /**
   * Fetch comparison data wrapper
   */
  const fetchComparisonData = useCallback(
    (isRefresh: boolean) => {
      return fetchAnalytics(isRefresh);
    },
    [fetchAnalytics]
  );

  /**
   * Subscribe to real-time updates
   */
  const subscribeToUpdates = useCallback(() => {
    if (!userId) return () => {};

    const channel = supabase
      .channel(`analytics:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ability_trajectory',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          logger.info('Ability trajectory updated, refreshing...');
          fetchComparisonData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_session_analytics',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          logger.info('Study session recorded, refreshing...');
          fetchComparisonData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'learning_goals',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          logger.info('Learning goals updated, refreshing...');
          fetchComparisonData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchComparisonData]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval < 30000) return;

    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchAnalytics]);

  return {
    abilityTrajectory,
    learningVelocity,
    studyInsights,
    optimalSchedule,
    studyStats,
    goalPredictions,
    goalsAtRisk,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchAnalytics(true),
    subscribeToUpdates,
  };
}

/**
 * Hook for ability trajectory only
 */
export function useAbilityTrajectory(categoryId?: string) {
  const { user } = useAuth();
  const userId = user?.id;

  const [trajectory, setTrajectory] = useState<TrajectoryAnalysis | null>(null);
  const [velocity, setVelocity] = useState<{
    velocity: number;
    trend: 'accelerating' | 'stable' | 'decelerating';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const [trajectoryData, velocityData] = await Promise.all([
          abilityTrajectoryService.getAbilityTrajectory(userId, categoryId, 12),
          abilityTrajectoryService.calculateLearningVelocity(userId, categoryId),
        ]);
        setTrajectory(trajectoryData);
        setVelocity(velocityData);
      } catch (_error) {
        logger._error('Error fetching ability trajectory:', _error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, categoryId]);

  return { trajectory, velocity, isLoading };
}

/**
 * Hook for study effectiveness only
 */
export function useStudyEffectiveness() {
  const { user } = useAuth();
  const userId = user?.id;

  const [insights, setInsights] = useState<StudyPatternInsight[]>([]);
  const [schedule, setSchedule] = useState<OptimalStudySchedule | null>(null);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const [insightsData, scheduleData, statsData] = await Promise.all([
          studyEffectivenessService.generateStudyInsights(userId),
          studyEffectivenessService.generateOptimalSchedule(userId),
          studyEffectivenessService.getStudyStatsSummary(userId, 30),
        ]);
        setInsights(insightsData);
        setSchedule(scheduleData);
        setStats(statsData);
      } catch (_error) {
        logger._error('Error fetching study effectiveness:', _error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { insights, schedule, stats, isLoading };
}

/**
 * Hook for goal predictions only
 */
export function useGoalPredictions() {
  const { user } = useAuth();
  const userId = user?.id;

  const [predictions, setPredictions] = useState<EnhancedGoalPrediction[]>([]);
  const [atRisk, setAtRisk] = useState<EnhancedGoalPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const [predictionsData, atRiskData] = await Promise.all([
          enhancedGoalPredictionService.predictAllGoals(userId),
          enhancedGoalPredictionService.getGoalsAtRisk(userId),
        ]);
        setPredictions(predictionsData);
        setAtRisk(atRiskData);
      } catch (_error) {
        logger._error('Error fetching goal predictions:', _error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { predictions, atRisk, isLoading };
}

interface FeedbackEventData {
  id: string;
  user_id: string;
  assessment_id: string;
  event_type: string;
  ability_before: number;
  ability_after: number;
  triggers_fired: string[];
  trigger_data: Record<string, unknown>;
  created_at: string;
}

/**
 * Hook for feedback loop data
 */
export function useFeedbackLoop() {
  const { user } = useAuth();
  const userId = user?.id;

  const [feedbackEvents, setFeedbackEvents] = useState<FeedbackEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('feedback_loop_events')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error) {
          setFeedbackEvents(data || []);
        }
      } catch (_error) {
        logger._error('Error fetching feedback events:', _error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { feedbackEvents, isLoading };
}

export default useRealTimeAnalytics;
