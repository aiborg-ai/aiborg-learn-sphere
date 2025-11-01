/**
 * Workshop Realtime Hook
 * Manages WebSocket subscriptions for real-time workshop updates
 * Uses Supabase Realtime for instant updates without polling
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWorkshopRealtimeOptions {
  sessionId: string;
  enabled?: boolean;
  onStatusChange?: (status: RealtimeStatus) => void;
}

/**
 * Hook for managing real-time workshop session updates
 * Subscribes to:
 * - Session changes (stage updates, status changes)
 * - Participant changes (joins, leaves)
 * - Activity changes (messages, contributions)
 * - Stage submission changes
 */
export function useWorkshopRealtime({
  sessionId,
  enabled = true,
  onStatusChange,
}: UseWorkshopRealtimeOptions) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Update status and notify callback
  const updateStatus = useCallback(
    (newStatus: RealtimeStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      logger.info('[Realtime] Status changed', { sessionId, status: newStatus });
    },
    [sessionId, onStatusChange]
  );

  // Handle reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      logger.error('[Realtime] Max reconnection attempts reached', { sessionId });
      updateStatus('error');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    reconnectAttemptsRef.current += 1;

    logger.info('[Realtime] Scheduling reconnect', {
      sessionId,
      attempt: reconnectAttemptsRef.current,
      delay,
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      updateStatus('connecting');
      // The useEffect will recreate the channel
    }, delay);
  }, [sessionId, updateStatus]);

  // Clean up channel
  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      logger.info('[Realtime] Cleaning up channel', { sessionId });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!enabled || !sessionId) {
      cleanupChannel();
      return;
    }

    logger.info('[Realtime] Initializing subscriptions', { sessionId });

    // Create a unique channel for this session
    const channel = supabase.channel(`workshop-session:${sessionId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: sessionId },
      },
    });

    channelRef.current = channel;

    // Subscribe to workshop_sessions table changes
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workshop_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
          logger.info('[Realtime] Session updated', { payload });

          // Invalidate session query to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['workshop-session-detail', sessionId] });

          // Optimistic update if payload contains new data
          if (payload.new && payload.eventType !== 'DELETE') {
            queryClient.setQueryData(['workshop-session-detail', sessionId], (old: unknown) => {
              if (old && typeof old === 'object') {
                return { ...old, ...payload.new };
              }
              return old;
            });
          }
        }
      )
      // Subscribe to workshop_participants table changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workshop_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
          logger.info('[Realtime] Participants updated', { payload });
          queryClient.invalidateQueries({ queryKey: ['workshop-participants', sessionId] });
        }
      )
      // Subscribe to workshop_activities table changes
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workshop_activities',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
          logger.info('[Realtime] New activity', { payload });

          // Optimistically add the new activity
          queryClient.setQueryData(['workshop-activities', sessionId], (old: unknown) => {
            if (Array.isArray(old)) {
              return [...old, payload.new];
            }
            return old;
          });

          // Also invalidate to ensure consistency
          queryClient.invalidateQueries({ queryKey: ['workshop-activities', sessionId] });
        }
      )
      // Subscribe to workshop_stage_submissions table changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workshop_stage_submissions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
          logger.info('[Realtime] Stage submission updated', { payload });
          queryClient.invalidateQueries({ queryKey: ['workshop-stage-submissions', sessionId] });
        }
      )
      // Handle channel status
      .on('system', {}, payload => {
        logger.info('[Realtime] System event', { payload });
      })
      .subscribe(status => {
        logger.info('[Realtime] Subscription status', { status, sessionId });

        if (status === 'SUBSCRIBED') {
          updateStatus('connected');
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        } else if (status === 'CHANNEL_ERROR') {
          updateStatus('error');
          scheduleReconnect();
        } else if (status === 'TIMED_OUT') {
          updateStatus('disconnected');
          scheduleReconnect();
        } else if (status === 'CLOSED') {
          updateStatus('disconnected');
        }
      });

    // Cleanup function
    return () => {
      cleanupChannel();
    };
  }, [sessionId, enabled, queryClient, updateStatus, scheduleReconnect, cleanupChannel]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    logger.info('[Realtime] Manual reconnect triggered', { sessionId });
    reconnectAttemptsRef.current = 0;
    cleanupChannel();
    updateStatus('connecting');
    // The useEffect will recreate the channel
  }, [sessionId, cleanupChannel, updateStatus]);

  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
    isError: status === 'error',
    reconnect,
  };
}

/**
 * Hook for broadcasting presence in a workshop session
 * Shows who is currently active in the session
 */
export function useWorkshopPresence(sessionId: string, userId?: string, userName?: string) {
  const [presenceState, setPresenceState] = useState<Record<string, unknown>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const channel = supabase.channel(`presence:workshop-${sessionId}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPresenceState(state);
        logger.info('[Presence] State synced', { state });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        logger.info('[Presence] User joined', { key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        logger.info('[Presence] User left', { key, leftPresences });
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await channel.track({
            user_id: userId,
            user_name: userName || 'Anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, userId, userName]);

  const activeUsers = Object.keys(presenceState).length;

  return {
    presenceState,
    activeUsers,
  };
}

/**
 * Hook for broadcasting events to all session participants
 * Useful for instant notifications without database writes
 */
export function useWorkshopBroadcast(sessionId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [lastMessage, setLastMessage] = useState<{ event: string; payload: unknown } | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`broadcast:workshop-${sessionId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: '*' }, payload => {
        logger.info('[Broadcast] Message received', { payload });
        setLastMessage({ event: payload.event, payload: payload.payload });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId]);

  const broadcast = useCallback(async (event: string, payload: unknown) => {
    if (!channelRef.current) {
      logger.warn('[Broadcast] Channel not initialized');
      return;
    }

    const response = await channelRef.current.send({
      type: 'broadcast',
      event,
      payload,
    });

    logger.info('[Broadcast] Message sent', { event, payload, response });
    return response;
  }, []);

  return {
    broadcast,
    lastMessage,
  };
}
