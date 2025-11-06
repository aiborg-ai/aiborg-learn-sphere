import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

export interface EventSessionTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  event_id: number;
  session_id: string;
  status: 'active' | 'cancelled' | 'attended' | 'missed';
  qr_code: string;
  claimed_at: string;
  checked_in_at: string | null;
  check_in_method: string | null;
  checked_in_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  event_sessions?: {
    id: string;
    title: string;
    session_date: string;
    start_time: string;
    end_time: string;
    location: string | null;
    meeting_url: string | null;
    status: string;
    check_in_window_start: string;
    check_in_window_end: string;
  };
  events?: {
    id: number;
    title: string;
    series_name: string;
  };
}

/**
 * Hook to fetch all event session tickets for the current user
 */
export function useEventSessionTickets(options?: { includeCompleted?: boolean }) {
  return useQuery({
    queryKey: ['eventSessionTickets', options],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      let query = supabase
        .from('event_session_tickets')
        .select(
          `
          *,
          event_sessions (
            id,
            title,
            session_date,
            start_time,
            end_time,
            location,
            meeting_url,
            status,
            check_in_window_start,
            check_in_window_end
          ),
          events (
            id,
            title,
            series_name
          )
        `
        )
        .eq('user_id', user.id);

      if (!options?.includeCompleted) {
        query = query.in('status', ['active', 'attended']);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching event session tickets:', error);
        throw error;
      }

      return data as EventSessionTicket[];
    },
  });
}

/**
 * Hook to fetch upcoming event session tickets
 */
export function useUpcomingEventTickets() {
  return useQuery({
    queryKey: ['upcomingEventTickets'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('event_session_tickets')
        .select(
          `
          *,
          event_sessions!inner (
            id,
            title,
            session_date,
            start_time,
            end_time,
            location,
            meeting_url,
            status,
            check_in_window_start,
            check_in_window_end
          ),
          events (
            id,
            title,
            series_name
          )
        `
        )
        .eq('user_id', user.id)
        .in('status', ['active', 'attended'])
        .gte('event_sessions.session_date', today)
        .order('event_sessions(session_date)', { ascending: true })
        .limit(10);

      if (error) {
        logger.error('Error fetching upcoming tickets:', error);
        throw error;
      }

      return data as EventSessionTicket[];
    },
  });
}

/**
 * Hook to check in to an event session
 */
export function useCheckInEventSession() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      sessionId,
      qrCode,
      method = 'manual',
    }: {
      ticketId?: string;
      sessionId?: string;
      qrCode?: string;
      method?: 'manual' | 'qr_scan' | 'host' | 'auto';
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-in-event-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ticketId,
            sessionId,
            qrCode,
            method,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check in');
      }

      return result;
    },
    onSuccess: data => {
      toast({
        title: 'Checked In Successfully',
        description: data.alreadyCheckedIn
          ? 'You were already checked in'
          : 'You have been checked in to the session',
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['eventSessionTickets'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingEventTickets'] });
    },
    onError: (error: Error) => {
      logger.error('Check-in error:', error);
      toast({
        title: 'Check-In Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to manage event session tickets (cancel, reactivate)
 */
export function useManageEventTicket() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      ticketId,
      sessionId,
      eventId,
      notes,
    }: {
      action: 'cancel' | 'reactivate' | 'claim';
      ticketId?: string;
      sessionId?: string;
      eventId?: number;
      notes?: string;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-event-session-tickets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action,
            ticketId,
            sessionId,
            eventId,
            notes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} ticket`);
      }

      return result;
    },
    onSuccess: (data, variables) => {
      const actionText =
        variables.action === 'cancel'
          ? 'cancelled'
          : variables.action === 'reactivate'
            ? 'reactivated'
            : 'claimed';

      toast({
        title: 'Success',
        description: `Ticket ${actionText} successfully`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['eventSessionTickets'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingEventTickets'] });
    },
    onError: (error: Error) => {
      logger.error('Manage ticket error:', error);
      toast({
        title: 'Operation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
