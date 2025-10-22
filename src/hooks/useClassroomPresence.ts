import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export interface ClassroomStudent {
  id: string;
  user_id: string;
  session_id: string;
  joined_at: string;
  last_seen: string;
  is_active: boolean;
  current_position?: string;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
    email?: string;
  };
}

export interface ClassroomSession {
  id: string;
  course_id: number;
  lesson_id?: string;
  lesson_title?: string;
  instructor_id: string;
  started_at: string;
  is_active: boolean;
}

interface UseClassroomPresenceOptions {
  courseId: number;
  lessonId?: string;
  autoJoin?: boolean;
  updateInterval?: number; // milliseconds
}

/**
 * Hook for managing real-time classroom presence
 *
 * Features:
 * - Join/leave classroom sessions
 * - See active students in real-time
 * - Auto-update presence heartbeat
 * - Handle reconnections
 *
 * @example
 * ```tsx
 * const { students, joinSession, leaveSession, updatePosition } = useClassroomPresence({
 *   courseId: 123,
 *   lessonId: 'intro-to-ai',
 *   autoJoin: true
 * });
 * ```
 */
export const useClassroomPresence = ({
  courseId,
  lessonId,
  autoJoin = false,
  updateInterval = 30000, // 30 seconds
}: UseClassroomPresenceOptions) => {
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [currentSession, setCurrentSession] = useState<ClassroomSession | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch or create active session for the course/lesson
   */
  const getOrCreateSession = useCallback(async () => {
    try {
      // First, try to find an active session
      const { data: existingSession, error: fetchError } = await supabase
        .from('classroom_sessions')
        .select('*')
        .eq('course_id', courseId)
        .eq('lesson_id', lessonId || '')
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingSession) {
        setCurrentSession(existingSession);
        return existingSession;
      }

      // If no active session and user is instructor, create one
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role === 'instructor' || profile?.role === 'admin') {
        const { data: newSession, error: createError } = await supabase
          .from('classroom_sessions')
          .insert({
            course_id: courseId,
            lesson_id: lessonId || '',
            instructor_id: user.id,
            is_active: true,
          })
          .select()
          .single();

        if (createError) throw createError;

        setCurrentSession(newSession);
        return newSession;
      }

      throw new Error('No active session found');
    } catch (err) {
      logger.error('Failed to get or create session', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to get session');
      return null;
    }
  }, [courseId, lessonId]);

  /**
   * Fetch active students with their profiles
   */
  const fetchActiveStudents = useCallback(async (sessionId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('classroom_presence')
        .select(
          `
          *,
          user_profile:profiles!classroom_presence_user_id_fkey (
            display_name,
            avatar_url,
            email
          )
        `
        )
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (fetchError) throw fetchError;

      setStudents(data || []);
    } catch (err) {
      logger.error('Failed to fetch active students', { error: err });
    }
  }, []);

  /**
   * Join a classroom session
   */
  const joinSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const session = await getOrCreateSession();
      if (!session) return;

      // Insert or update presence
      const { data: presence, error: presenceError } = await supabase
        .from('classroom_presence')
        .upsert(
          {
            session_id: session.id,
            user_id: user.id,
            is_active: true,
            last_seen: new Date().toISOString(),
          },
          {
            onConflict: 'session_id,user_id',
          }
        )
        .select()
        .single();

      if (presenceError) throw presenceError;

      presenceIdRef.current = presence.id;
      setIsJoined(true);

      // Subscribe to realtime updates
      subscribeToPresence(session.id);

      // Start heartbeat to keep presence alive
      startHeartbeat();

      // Fetch initial students
      await fetchActiveStudents(session.id);

      logger.info('Joined classroom session', { sessionId: session.id });
    } catch (err) {
      logger.error('Failed to join session', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startHeartbeat and subscribeToPresence are stable
  }, [getOrCreateSession, fetchActiveStudents]);

  /**
   * Leave the classroom session
   */
  const leaveSession = useCallback(async () => {
    try {
      if (!presenceIdRef.current) return;

      // Mark presence as inactive
      await supabase
        .from('classroom_presence')
        .update({ is_active: false })
        .eq('id', presenceIdRef.current);

      // Unsubscribe from realtime
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Stop heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      setIsJoined(false);
      presenceIdRef.current = null;

      logger.info('Left classroom session');
    } catch (err) {
      logger.error('Failed to leave session', { error: err });
    }
  }, []);

  /**
   * Update current position in lesson (e.g., video timestamp)
   */
  const updatePosition = useCallback(async (position: string) => {
    try {
      if (!presenceIdRef.current) return;

      await supabase
        .from('classroom_presence')
        .update({
          current_position: position,
          last_seen: new Date().toISOString(),
        })
        .eq('id', presenceIdRef.current);
    } catch (err) {
      logger.error('Failed to update position', { error: err });
    }
  }, []);

  /**
   * Subscribe to real-time presence changes
   */
  const subscribeToPresence = useCallback(
    (sessionId: string) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`classroom:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'classroom_presence',
            filter: `session_id=eq.${sessionId}`,
          },
          payload => {
            logger.debug('Presence change detected', { payload });
            // Refetch active students
            fetchActiveStudents(sessionId);
          }
        )
        .subscribe(status => {
          logger.info('Realtime subscription status', { status });
        });

      channelRef.current = channel;
    },
    [fetchActiveStudents]
  );

  /**
   * Start heartbeat to keep presence alive
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(async () => {
      if (!presenceIdRef.current) return;

      try {
        await supabase
          .from('classroom_presence')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', presenceIdRef.current);
      } catch (err) {
        logger.error('Heartbeat failed', { error: err });
      }
    }, updateInterval);
  }, [updateInterval]);

  /**
   * Auto-join if enabled
   */
  useEffect(() => {
    if (autoJoin && !isJoined) {
      joinSession();
    }
  }, [autoJoin, isJoined, joinSession]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isJoined) {
        leaveSession();
      }
    };
  }, [isJoined, leaveSession]);

  return {
    students,
    currentSession,
    isJoined,
    loading,
    error,
    joinSession,
    leaveSession,
    updatePosition,
    activeCount: students.filter(s => s.is_active).length,
  };
};
