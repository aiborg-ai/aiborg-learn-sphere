import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface AttendanceTicket {
  id: string;
  user_id: string;
  ticket_type: 'event' | 'course_session';
  event_id: number | null;
  course_id: number | null;
  session_title: string;
  session_date: string;
  session_time: string | null;
  location: string | null;
  ticket_number: string;
  badge_color: 'gold' | 'silver' | 'bronze' | 'blue' | 'green';
  is_verified: boolean;
  issued_by: string | null;
  issued_at: string;
  notes: string | null;
  created_at: string;

  // Joined data
  events?: {
    title: string;
    event_date: string;
  } | null;
  courses?: {
    title: string;
  } | null;
}

export interface TicketStatistics {
  total_tickets: number;
  event_tickets: number;
  course_session_tickets: number;
  verified_tickets: number;
}

interface UseAttendanceTicketsState {
  tickets: AttendanceTicket[];
  statistics: TicketStatistics;
  loading: boolean;
  error: string | null;
}

export const useAttendanceTickets = (userId?: string) => {
  const [state, setState] = useState<UseAttendanceTicketsState>({
    tickets: [],
    statistics: {
      total_tickets: 0,
      event_tickets: 0,
      course_session_tickets: 0,
      verified_tickets: 0,
    },
    loading: true,
    error: null,
  });

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setState({
        tickets: [],
        statistics: {
          total_tickets: 0,
          event_tickets: 0,
          course_session_tickets: 0,
          verified_tickets: 0,
        },
        loading: false,
        error: 'No user ID provided',
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      logger.log('🎫 Fetching attendance tickets...', { userId });

      // Fetch tickets with related data
      const { data: tickets, error: ticketsError } = await supabase
        .from('attendance_tickets')
        .select(`
          *,
          events(title, event_date),
          courses(title)
        `)
        .eq('user_id', userId)
        .order('session_date', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Fetch statistics
      const { data: stats, error: statsError } = await supabase
        .rpc('get_user_ticket_stats', { p_user_id: userId })
        .single();

      if (statsError) {
        logger.error('Error fetching ticket statistics:', statsError);
        // Continue without stats - non-critical
      }

      const statistics: TicketStatistics = stats || {
        total_tickets: tickets?.length || 0,
        event_tickets: tickets?.filter(t => t.ticket_type === 'event').length || 0,
        course_session_tickets: tickets?.filter(t => t.ticket_type === 'course_session').length || 0,
        verified_tickets: tickets?.filter(t => t.is_verified).length || 0,
      };

      logger.log(`✅ Fetched ${tickets?.length || 0} attendance tickets`);

      setState({
        tickets: tickets || [],
        statistics,
        loading: false,
        error: null,
      });
    } catch (err) {
      logger.error('❌ Error fetching attendance tickets:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tickets';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [userId]);

  const filterByType = useCallback(
    (type: 'event' | 'course_session' | 'all') => {
      if (type === 'all') {
        return state.tickets;
      }
      return state.tickets.filter(ticket => ticket.ticket_type === type);
    },
    [state.tickets]
  );

  const searchTickets = useCallback(
    (searchTerm: string) => {
      if (!searchTerm) return state.tickets;

      const term = searchTerm.toLowerCase();
      return state.tickets.filter(
        ticket =>
          ticket.session_title.toLowerCase().includes(term) ||
          ticket.ticket_number.toLowerCase().includes(term) ||
          ticket.location?.toLowerCase().includes(term) ||
          ticket.events?.title.toLowerCase().includes(term) ||
          ticket.courses?.title.toLowerCase().includes(term)
      );
    },
    [state.tickets]
  );

  const refetch = useCallback(() => {
    logger.log('🔄 Manual refetch triggered');
    return fetchTickets();
  }, [fetchTickets]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    logger.log('👂 Setting up attendance ticket subscriptions...');

    const channel = supabase
      .channel(`attendance-tickets-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_tickets',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          logger.log('🔔 Attendance ticket change detected:', payload.eventType);
          fetchTickets();
        }
      )
      .subscribe(status => {
        logger.log('📡 Attendance ticket subscription status:', status);
      });

    return () => {
      logger.log('🔌 Cleaning up attendance ticket subscriptions');
      supabase.removeChannel(channel);
    };
  }, [userId, fetchTickets]);

  // Initial fetch
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets: state.tickets,
    statistics: state.statistics,
    loading: state.loading,
    error: state.error,
    refetch,
    filterByType,
    searchTickets,
  };
};
