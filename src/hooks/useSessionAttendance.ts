// Hook for managing session attendance (instructor view)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SessionAttendance {
  id: string;
  session_id: string;
  user_id: string;
  ticket_id?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  check_in_time?: string;
  check_out_time?: string;
  duration_minutes?: number;
  participation_score?: number;
  instructor_notes?: string;
  marked_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceListItem {
  user_id: string;
  user_name: string;
  user_email: string;
  ticket_number: string;
  status: string;
  check_in_time?: string;
  duration_minutes?: number;
  participation_score?: number;
  instructor_notes?: string;
}

export interface CourseAttendanceReport {
  user_id: string;
  user_name: string;
  total_sessions: number;
  attended: number;
  missed: number;
  excused: number;
  late: number;
  attendance_rate: number;
}

export function useSessionAttendance(sessionId?: string, courseId?: number) {
  const queryClient = useQueryClient();

  // Fetch attendance list for a session
  const {
    data: attendanceList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sessionAttendance', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase.rpc('get_session_attendance_list', {
        p_session_id: sessionId,
      });

      if (error) throw error;
      return data as AttendanceListItem[];
    },
    enabled: !!sessionId,
  });

  // Fetch course attendance report
  const { data: courseReport } = useQuery({
    queryKey: ['courseAttendanceReport', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase.rpc('get_course_attendance_report', {
        p_course_id: courseId,
      });

      if (error) throw error;
      return data as CourseAttendanceReport[];
    },
    enabled: !!courseId,
  });

  // Mark attendance for a single user
  const markAttendance = useMutation({
    mutationFn: async ({
      userId,
      status,
      notes,
      participationScore,
    }: {
      sessionId: string;
      userId: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      notes?: string;
      participationScore?: number;
    }) => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Get the ticket for this user/session
      const { data: ticket } = await supabase
        .from('session_tickets')
        .select('id')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .single();

      const { data, error } = await supabase
        .from('session_attendance')
        .upsert(
          {
            session_id: sessionId,
            user_id: userId,
            ticket_id: ticket?.id,
            status,
            instructor_notes: notes,
            participation_score: participationScore,
            marked_by: currentUser.id,
            check_in_time:
              status === 'present' || status === 'late' ? new Date().toISOString() : undefined,
          },
          {
            onConflict: 'session_id,user_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionAttendance', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['courseAttendanceReport', courseId] });
    },
  });

  // Bulk mark attendance
  const bulkMarkAttendance = useMutation({
    mutationFn: async (
      attendanceData: Array<{
        userId: string;
        status: 'present' | 'absent' | 'late' | 'excused';
        notes?: string;
        participationScore?: number;
      }>
    ) => {
      if (!sessionId) throw new Error('Session ID required');

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Prepare bulk insert data
      const attendanceRecords = await Promise.all(
        attendanceData.map(async record => {
          const { data: ticket } = await supabase
            .from('session_tickets')
            .select('id')
            .eq('user_id', record.userId)
            .eq('session_id', sessionId)
            .single();

          return {
            session_id: sessionId,
            user_id: record.userId,
            ticket_id: ticket?.id,
            status: record.status,
            instructor_notes: record.notes,
            participation_score: record.participationScore,
            marked_by: currentUser.id,
            check_in_time:
              record.status === 'present' || record.status === 'late'
                ? new Date().toISOString()
                : undefined,
          };
        })
      );

      const { data, error } = await supabase
        .from('session_attendance')
        .upsert(attendanceRecords, {
          onConflict: 'session_id,user_id',
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionAttendance', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['courseAttendanceReport', courseId] });
    },
  });

  // Mark all as present
  const markAllPresent = useMutation({
    mutationFn: async () => {
      if (!sessionId || !attendanceList) throw new Error('Session ID and attendance list required');

      const attendanceData = attendanceList.map(student => ({
        userId: student.user_id,
        status: 'present' as const,
      }));

      return bulkMarkAttendance.mutateAsync(attendanceData);
    },
  });

  // Mark missed sessions (scheduled job - manual trigger)
  const markMissedSessions = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('mark_missed_sessions');

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['courseAttendanceReport'] });
    },
  });

  return {
    attendanceList,
    courseReport,
    isLoading,
    error,
    markAttendance,
    bulkMarkAttendance,
    markAllPresent,
    markMissedSessions,
  };
}
