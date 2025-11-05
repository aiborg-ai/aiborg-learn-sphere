// Hook for managing session tickets
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SessionTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  course_id: number;
  session_id: string;
  status: 'active' | 'cancelled' | 'attended' | 'missed';
  qr_code: string;
  claimed_at: string;
  checked_in_at?: string;
  check_in_method?: 'qr_scan' | 'manual' | 'instructor' | 'auto';
  checked_in_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSessionStats {
  total_sessions: number;
  attended_sessions: number;
  missed_sessions: number;
  cancelled_sessions: number;
  attendance_rate: number;
}

export function useSessionTickets(courseId?: number) {
  const queryClient = useQueryClient();

  // Fetch user's tickets for a course
  const {
    data: tickets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sessionTickets', courseId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !courseId) return [];

      const { data, error } = await supabase.rpc('get_user_course_tickets', {
        p_user_id: user.id,
        p_course_id: courseId,
        p_include_past: true,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Fetch user's attendance statistics
  const { data: stats } = useQuery({
    queryKey: ['userSessionStats', courseId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !courseId) return null;

      const { data, error } = await supabase.rpc('get_user_session_stats', {
        p_user_id: user.id,
        p_course_id: courseId,
      });

      if (error) throw error;
      return data?.[0] as UserSessionStats;
    },
    enabled: !!courseId,
  });

  // Check if user can check in to a session
  const canCheckIn = useMutation({
    mutationFn: async (sessionId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('can_check_in_to_session', {
        p_user_id: user.id,
        p_session_id: sessionId,
      });

      if (error) throw error;
      return data?.[0];
    },
  });

  // Check in to a session
  const checkInToSession = useMutation({
    mutationFn: async ({
      sessionId,
      method = 'manual',
      qrData,
    }: {
      sessionId: string;
      method?: 'qr_scan' | 'manual' | 'instructor';
      qrData?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('check-in-session', {
        body: {
          sessionId,
          userId: user.id,
          method,
          qrData,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionTickets', courseId] });
      queryClient.invalidateQueries({ queryKey: ['userSessionStats', courseId] });
    },
  });

  // Claim a ticket for an extra session
  const claimTicket = useMutation({
    mutationFn: async ({ sessionId, notes }: { sessionId: string; notes?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('manage-session-tickets', {
        body: {
          action: 'claim',
          sessionId,
          userId: user.id,
          notes,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionTickets', courseId] });
    },
  });

  // Cancel a ticket
  const cancelTicket = useMutation({
    mutationFn: async (ticketId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('manage-session-tickets', {
        body: {
          action: 'cancel',
          ticketId,
          userId: user.id,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionTickets', courseId] });
    },
  });

  // Reactivate a cancelled ticket
  const reactivateTicket = useMutation({
    mutationFn: async (ticketId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('manage-session-tickets', {
        body: {
          action: 'reactivate',
          ticketId,
          userId: user.id,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionTickets', courseId] });
    },
  });

  // Get QR code for a ticket
  const getTicketQRCode = async (ticketId: string): Promise<string> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await supabase.functions.invoke('generate-qr-code', {
      body: { ticketId, format: 'data-url' },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (response.error) throw response.error;
    return response.data.qrCodeDataUrl;
  };

  return {
    tickets,
    stats,
    isLoading,
    error,
    canCheckIn,
    checkInToSession,
    claimTicket,
    cancelTicket,
    reactivateTicket,
    getTicketQRCode,
  };
}
