// Hook for managing course sessions
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseSession {
  id: string;
  course_id: number;
  session_number: number;
  title: string;
  description?: string;
  session_type: 'scheduled' | 'extra' | 'makeup';
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_url?: string;
  instructor_notes?: string;
  max_capacity?: number;
  current_attendance: number;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  check_in_enabled: boolean;
  check_in_window_start?: string;
  check_in_window_end?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionStats {
  total_sessions: number;
  completed_sessions: number;
  upcoming_sessions: number;
  cancelled_sessions: number;
  avg_attendance: number;
}

export function useCourseSessions(courseId?: number) {
  const queryClient = useQueryClient();

  // Fetch sessions for a course
  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['courseSessions', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as CourseSession[];
    },
    enabled: !!courseId,
  });

  // Fetch upcoming sessions
  const { data: upcomingSessions } = useQuery({
    queryKey: ['upcomingCourseSessions', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase.rpc('get_upcoming_course_sessions', {
        p_course_id: courseId,
        p_limit: 10,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Fetch session statistics
  const { data: sessionStats } = useQuery({
    queryKey: ['courseSessionStats', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const { data, error } = await supabase.rpc('get_course_session_stats', {
        p_course_id: courseId,
      });

      if (error) throw error;
      return data?.[0] as SessionStats;
    },
    enabled: !!courseId,
  });

  // Create a new session
  const createSession = useMutation({
    mutationFn: async (sessionData: Partial<CourseSession>) => {
      const { data, error } = await supabase
        .from('course_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseSessions', courseId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingCourseSessions', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseSessionStats', courseId] });
    },
  });

  // Update a session
  const updateSession = useMutation({
    mutationFn: async ({
      sessionId,
      updates,
    }: {
      sessionId: string;
      updates: Partial<CourseSession>;
    }) => {
      const { data, error } = await supabase
        .from('course_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseSessions', courseId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingCourseSessions', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseSessionStats', courseId] });
    },
  });

  // Delete a session
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('course_sessions').delete().eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseSessions', courseId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingCourseSessions', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseSessionStats', courseId] });
    },
  });

  // Bulk create sessions (recurring)
  const bulkCreateSessions = useMutation({
    mutationFn: async (params: {
      courseId: number;
      startDate: string;
      endDate: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      frequency: 'weekly' | 'biweekly';
      title?: string;
      description?: string;
      location?: string;
      meetingUrl?: string;
      maxCapacity?: number;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('bulk-create-sessions', {
        body: params,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseSessions', courseId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingCourseSessions', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseSessionStats', courseId] });
    },
  });

  return {
    sessions,
    upcomingSessions,
    sessionStats,
    isLoading,
    error,
    createSession,
    updateSession,
    deleteSession,
    bulkCreateSessions,
  };
}
