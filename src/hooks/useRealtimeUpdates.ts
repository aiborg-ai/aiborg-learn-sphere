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
  onStudyPlanUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onNotificationUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onGoalUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onInsightUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onRecommendationUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
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

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    // Create a unique channel for this user
    const channelName = `user-updates-${userId}`;
    const channel = supabase.channel(channelName);

    // Subscribe to study plan updates
    if (callbacks.onStudyPlanUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_study_plans',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('Study plan update received:', payload);
          callbacks.onStudyPlanUpdate!(payload);
        }
      );
    }

    // Subscribe to notification updates
    if (callbacks.onNotificationUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('Notification update received:', payload);
          callbacks.onNotificationUpdate!(payload);
        }
      );
    }

    // Subscribe to goal updates
    if (callbacks.onGoalUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_learning_goals',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('Goal update received:', payload);
          callbacks.onGoalUpdate!(payload);
        }
      );
    }

    // Subscribe to insight updates
    if (callbacks.onInsightUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_learning_insights',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('Insight update received:', payload);
          callbacks.onInsightUpdate!(payload);
        }
      );
    }

    // Subscribe to recommendation updates
    if (callbacks.onRecommendationUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recommendation_history',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('Recommendation update received:', payload);
          callbacks.onRecommendationUpdate!(payload);
        }
      );
    }

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info(`Subscribed to real-time updates for user ${userId}`);
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('Error subscribing to real-time channel');
        if (callbacks.onError) {
          callbacks.onError(new Error('Failed to subscribe to real-time updates'));
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
  }, [userId, enabled, JSON.stringify(callbacks)]);

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
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void,
  enabled: boolean = true
) {
  return useRealtimeUpdates(
    userId,
    { onStudyPlanUpdate: onUpdate },
    enabled
  );
}

/**
 * Subscribe to notification updates only
 */
export function useNotificationUpdates(
  userId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void,
  enabled: boolean = true
) {
  return useRealtimeUpdates(
    userId,
    { onNotificationUpdate: onUpdate },
    enabled
  );
}

/**
 * Subscribe to goal updates only
 */
export function useGoalUpdates(
  userId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void,
  enabled: boolean = true
) {
  return useRealtimeUpdates(
    userId,
    { onGoalUpdate: onUpdate },
    enabled
  );
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
