/**
 * Real-Time Updates Hook
 * Subscribes to Supabase Realtime for live updates
 * Handles study plans, tasks, milestones, and notifications
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export type RealtimeTable =
  | 'ai_study_plans'
  | 'notifications'
  | 'user_learning_goals'
  | 'ai_learning_insights'
  | 'recommendation_history';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeUpdateCallbacks {
  onStudyPlanUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onNotificationUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onGoalUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onInsightUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onRecommendationUpdate?: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void;
  onError?: (error: Error) => void;
}

/**
 * Subscribe to real-time updates for a specific table
 */
export function useRealtimeUpdates(
  userId: string,
  callbacks: RealtimeUpdateCallbacks,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    // Create a unique channel for this user
    const channelName = `user-updates-${userId}`;
    const channel = supabase.channel(channelName);

    // Subscribe to study plan updates
    if (callbacksRef.current.onStudyPlanUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_study_plans',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          logger.info('Study plan update received:', payload);
          callbacksRef.current.onStudyPlanUpdate!(payload);
        }
      );
    }

    // Subscribe to notification updates
    if (callbacksRef.current.onNotificationUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          logger.info('Notification update received:', payload);
          callbacksRef.current.onNotificationUpdate!(payload);
        }
      );
    }

    // Subscribe to goal updates
    if (callbacksRef.current.onGoalUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_learning_goals',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          logger.info('Goal update received:', payload);
          callbacksRef.current.onGoalUpdate!(payload);
        }
      );
    }

    // Subscribe to insight updates
    if (callbacksRef.current.onInsightUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_learning_insights',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          logger.info('Insight update received:', payload);
          callbacksRef.current.onInsightUpdate!(payload);
        }
      );
    }

    // Subscribe to recommendation updates
    if (callbacksRef.current.onRecommendationUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recommendation_history',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          logger.info('Recommendation update received:', payload);
          callbacksRef.current.onRecommendationUpdate!(payload);
        }
      );
    }

    // Subscribe to the channel
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        logger.info(`Subscribed to real-time updates for user ${userId}`);
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('Error subscribing to real-time channel');
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(new Error('Failed to subscribe to real-time updates'));
        }
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        logger.info('Unsubscribing from real-time updates');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled]);

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    },
  };
}

/**
 * Subscribe to study plan updates only
 */
export function useStudyPlanUpdates(
  userId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  enabled: boolean = true
) {
  return useRealtimeUpdates(userId, { onStudyPlanUpdate: onUpdate }, enabled);
}

/**
 * Subscribe to notification updates only
 */
export function useNotificationUpdates(
  userId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  enabled: boolean = true
) {
  return useRealtimeUpdates(userId, { onNotificationUpdate: onUpdate }, enabled);
}

/**
 * Subscribe to goal updates only
 */
export function useGoalUpdates(
  userId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  enabled: boolean = true
) {
  return useRealtimeUpdates(userId, { onGoalUpdate: onUpdate }, enabled);
}

/**
 * Subscribe to multiple table updates with automatic refresh
 */
export function useAutoRefreshUpdates(
  userId: string,
  tables: RealtimeTable[],
  onUpdate: () => void,
  enabled: boolean = true
) {
  const callbacks: RealtimeUpdateCallbacks = {};

  if (tables.includes('ai_study_plans')) {
    callbacks.onStudyPlanUpdate = () => onUpdate();
  }
  if (tables.includes('notifications')) {
    callbacks.onNotificationUpdate = () => onUpdate();
  }
  if (tables.includes('user_learning_goals')) {
    callbacks.onGoalUpdate = () => onUpdate();
  }
  if (tables.includes('ai_learning_insights')) {
    callbacks.onInsightUpdate = () => onUpdate();
  }
  if (tables.includes('recommendation_history')) {
    callbacks.onRecommendationUpdate = () => onUpdate();
  }

  return useRealtimeUpdates(userId, callbacks, enabled);
}
