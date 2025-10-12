import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export interface StudentProgress {
  user_id: string;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
    email?: string;
  };
  progress_percentage: number;
  time_spent_minutes: number;
  last_accessed: string;
  completed_at?: string;
  current_position?: string;
}

export interface ProgressEvent {
  id: string;
  session_id: string;
  user_id: string;
  event_type: 'milestone_reached' | 'lesson_completed' | 'quiz_passed' | 'stuck' | 'help_needed';
  event_data: Record<string, unknown>;
  created_at: string;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface UseRealtimeProgressOptions {
  sessionId: string | null;
  courseId: number | null;
  autoSubscribe?: boolean;
}

/**
 * Hook for tracking real-time student progress
 *
 * Features:
 * - Monitor cohort progress in real-time
 * - Broadcast progress milestones
 * - Identify students who need help
 * - Track engagement metrics
 *
 * @example
 * ```tsx
 * const { studentProgress, recentEvents, broadcastEvent } = useRealtimeProgress({
 *   sessionId: session.id,
 *   courseId: 123,
 *   autoSubscribe: true
 * });
 * ```
 */
export const useRealtimeProgress = ({
  sessionId,
  courseId,
  autoSubscribe = true,
}: UseRealtimeProgressOptions) => {
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [recentEvents, setRecentEvents] = useState<ProgressEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Fetch progress for all students in the course
   */
  const fetchCohortProgress = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_progress')
        .select(
          `
          user_id,
          progress_percentage,
          time_spent_minutes,
          last_accessed,
          completed_at,
          current_position,
          user_profile:profiles!user_progress_user_id_fkey (
            display_name,
            avatar_url,
            email
          )
        `
        )
        .eq('course_id', courseId)
        .order('progress_percentage', { ascending: false });

      if (fetchError) throw fetchError;

      setStudentProgress(data || []);
    } catch (err) {
      logger.error('Failed to fetch cohort progress', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  /**
   * Fetch recent progress events for the session
   */
  const fetchRecentEvents = useCallback(async () => {
    if (!sessionId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('classroom_progress_events')
        .select(
          `
          *,
          user_profile:profiles!classroom_progress_events_user_id_fkey (
            display_name,
            avatar_url
          )
        `
        )
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setRecentEvents(data || []);
    } catch (err) {
      logger.error('Failed to fetch recent events', { error: err });
    }
  }, [sessionId]);

  /**
   * Broadcast a progress event
   */
  const broadcastEvent = useCallback(
    async (
      eventType: ProgressEvent['event_type'],
      eventData: Record<string, unknown> = {}
    ): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error: insertError } = await supabase.from('classroom_progress_events').insert({
          session_id: sessionId,
          user_id: user.id,
          event_type: eventType,
          event_data: eventData,
        });

        if (insertError) throw insertError;

        logger.info('Progress event broadcast', { eventType, eventData });
        return true;
      } catch (err) {
        logger.error('Failed to broadcast event', { error: err });
        return false;
      }
    },
    [sessionId]
  );

  /**
   * Update own progress (with debouncing handled by caller)
   */
  const updateProgress = useCallback(
    async (
      progressPercentage: number,
      timeSpentMinutes: number,
      currentPosition?: string
    ): Promise<boolean> => {
      if (!courseId) return false;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const updateData: {
          progress_percentage: number;
          time_spent_minutes: number;
          last_accessed: string;
          current_position?: string;
          completed_at?: string;
        } = {
          progress_percentage: progressPercentage,
          time_spent_minutes: timeSpentMinutes,
          last_accessed: new Date().toISOString(),
        };

        if (currentPosition) {
          updateData.current_position = currentPosition;
        }

        if (progressPercentage === 100) {
          updateData.completed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase.from('user_progress').upsert(
          {
            user_id: user.id,
            course_id: courseId,
            ...updateData,
          },
          {
            onConflict: 'user_id,course_id',
          }
        );

        if (updateError) throw updateError;

        // Broadcast milestone events
        if (progressPercentage === 100 && sessionId) {
          await broadcastEvent('lesson_completed', {
            course_id: courseId,
            progress_percentage: progressPercentage,
          });
        } else if ([25, 50, 75].includes(Math.floor(progressPercentage)) && sessionId) {
          await broadcastEvent('milestone_reached', {
            course_id: courseId,
            milestone: `${Math.floor(progressPercentage)}%`,
          });
        }

        return true;
      } catch (err) {
        logger.error('Failed to update progress', { error: err });
        return false;
      }
    },
    [courseId, sessionId, broadcastEvent]
  );

  /**
   * Signal that you need help
   */
  const requestHelp = useCallback(
    async (reason?: string): Promise<boolean> => {
      return broadcastEvent('help_needed', { reason });
    },
    [broadcastEvent]
  );

  /**
   * Subscribe to real-time progress updates
   */
  const subscribeToProgress = useCallback(() => {
    if (!courseId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`progress:${courseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `course_id=eq.${courseId}`,
        },
        payload => {
          logger.debug('Progress update detected', { payload });
          fetchCohortProgress();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'classroom_progress_events',
          filter: sessionId ? `session_id=eq.${sessionId}` : undefined,
        },
        payload => {
          logger.debug('Progress event detected', { payload });
          if (sessionId) {
            fetchRecentEvents();
          }
        }
      )
      .subscribe(status => {
        logger.info('Progress realtime subscription status', { status });
      });

    channelRef.current = channel;
  }, [courseId, sessionId, fetchCohortProgress, fetchRecentEvents]);

  /**
   * Get statistics about cohort progress
   */
  const getProgressStats = useCallback(() => {
    if (studentProgress.length === 0) {
      return {
        averageProgress: 0,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 0,
        totalStudents: 0,
      };
    }

    const completed = studentProgress.filter(s => s.progress_percentage === 100).length;
    const inProgress = studentProgress.filter(
      s => s.progress_percentage > 0 && s.progress_percentage < 100
    ).length;
    const notStarted = studentProgress.filter(s => s.progress_percentage === 0).length;
    const avgProgress =
      studentProgress.reduce((sum, s) => sum + s.progress_percentage, 0) / studentProgress.length;

    return {
      averageProgress: Math.round(avgProgress),
      completedCount: completed,
      inProgressCount: inProgress,
      notStartedCount: notStarted,
      totalStudents: studentProgress.length,
    };
  }, [studentProgress]);

  /**
   * Get students who might need help (low progress, long time stuck)
   */
  const getStudentsNeedingHelp = useCallback(() => {
    const now = new Date();
    return studentProgress.filter(student => {
      const lastAccessed = new Date(student.last_accessed);
      const hoursSinceAccess = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60);

      // Student hasn't accessed in 24+ hours but hasn't completed
      const inactive = hoursSinceAccess > 24 && student.progress_percentage < 100;

      // Student has low progress relative to time spent
      const inefficient = student.time_spent_minutes > 60 && student.progress_percentage < 25;

      return inactive || inefficient;
    });
  }, [studentProgress]);

  /**
   * Initialize
   */
  useEffect(() => {
    if (courseId) {
      fetchCohortProgress();
    }

    if (sessionId) {
      fetchRecentEvents();
    }

    if (autoSubscribe && courseId) {
      subscribeToProgress();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    courseId,
    sessionId,
    autoSubscribe,
    fetchCohortProgress,
    fetchRecentEvents,
    subscribeToProgress,
  ]);

  return {
    studentProgress,
    recentEvents,
    loading,
    error,
    updateProgress,
    broadcastEvent,
    requestHelp,
    refetch: fetchCohortProgress,
    stats: getProgressStats(),
    studentsNeedingHelp: getStudentsNeedingHelp(),
  };
};
