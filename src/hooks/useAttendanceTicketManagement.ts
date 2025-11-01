import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AttendanceTicket } from './useAttendanceTickets';

interface UseAttendanceTicketManagementState {
  tickets: AttendanceTicket[];
  loading: boolean;
  error: string | null;
}

export const useAttendanceTicketManagement = () => {
  const [state, setState] = useState<UseAttendanceTicketManagementState>({
    tickets: [],
    loading: true,
    error: null,
  });

  const fetchAllTickets = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      logger.log('🔄 Fetching all attendance tickets (admin)...');

      const { data, error } = await supabase
        .from('attendance_tickets')
        .select(
          `
          *,
          events(title, event_date),
          courses(title),
          profiles:user_id(display_name, email)
        `
        )
        .order('session_date', { ascending: false });

      if (error) throw error;

      logger.log(`✅ Fetched ${data?.length || 0} attendance tickets`);

      setState({
        tickets: data || [],
        loading: false,
        error: null,
      });

      return data || [];
    } catch (err) {
      logger.error('❌ Error fetching attendance tickets:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tickets';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const issueTicket = useCallback(
    async (ticketData: {
      user_id: string;
      ticket_type: 'event' | 'course_session';
      event_id?: number;
      course_id?: number;
      session_title: string;
      session_date: string;
      session_time?: string;
      location?: string;
      badge_color?: 'gold' | 'silver' | 'bronze' | 'blue' | 'green';
      notes?: string;
    }) => {
      try {
        logger.log('🎫 Issuing attendance ticket...', ticketData);

        const { data, error } = await supabase
          .from('attendance_tickets')
          .insert({
            ...ticketData,
            badge_color: ticketData.badge_color || 'silver',
            is_verified: false,
          })
          .select(
            `
            *,
            events(title, event_date),
            courses(title),
            profiles:user_id(display_name, email)
          `
          )
          .single();

        if (error) throw error;

        logger.log('✅ Attendance ticket issued:', data.ticket_number);

        // Refresh tickets
        await fetchAllTickets();

        return data;
      } catch (err) {
        logger.error('❌ Error issuing ticket:', err);
        throw err;
      }
    },
    [fetchAllTickets]
  );

  const bulkIssueTickets = useCallback(
    async (
      userIds: string[],
      ticketData: {
        ticket_type: 'event' | 'course_session';
        event_id?: number;
        course_id?: number;
        session_title: string;
        session_date: string;
        session_time?: string;
        location?: string;
        badge_color?: 'gold' | 'silver' | 'bronze' | 'blue' | 'green';
        notes?: string;
      }
    ) => {
      try {
        logger.log('🎫 Bulk issuing attendance tickets...', {
          userCount: userIds.length,
          ...ticketData,
        });

        // Create tickets for each user
        const tickets = userIds.map(user_id => ({
          user_id,
          ...ticketData,
          badge_color: ticketData.badge_color || 'silver',
          is_verified: false,
        }));

        const { data, error } = await supabase.from('attendance_tickets').insert(tickets).select();

        if (error) throw error;

        logger.log(`✅ Issued ${data?.length || 0} attendance tickets`);

        // Refresh tickets
        await fetchAllTickets();

        return data;
      } catch (err) {
        logger.error('❌ Error bulk issuing tickets:', err);
        throw err;
      }
    },
    [fetchAllTickets]
  );

  const verifyTicket = useCallback(async (ticketId: string) => {
    try {
      logger.log('✓ Verifying ticket...', { ticketId });

      const { data, error } = await supabase
        .from('attendance_tickets')
        .update({ is_verified: true })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      logger.log('✅ Ticket verified');

      // Update local state
      setState(prev => ({
        ...prev,
        tickets: prev.tickets.map(t => (t.id === ticketId ? { ...t, is_verified: true } : t)),
      }));

      return data;
    } catch (err) {
      logger.error('❌ Error verifying ticket:', err);
      throw err;
    }
  }, []);

  const revokeTicket = useCallback(async (ticketId: string) => {
    try {
      logger.log('🗑️ Revoking ticket...', { ticketId });

      const { error } = await supabase.from('attendance_tickets').delete().eq('id', ticketId);

      if (error) throw error;

      logger.log('✅ Ticket revoked');

      // Update local state
      setState(prev => ({
        ...prev,
        tickets: prev.tickets.filter(t => t.id !== ticketId),
      }));
    } catch (err) {
      logger.error('❌ Error revoking ticket:', err);
      throw err;
    }
  }, []);

  const updateTicket = useCallback(
    async (
      ticketId: string,
      updates: Partial<{
        session_title: string;
        session_date: string;
        session_time: string;
        location: string;
        badge_color: 'gold' | 'silver' | 'bronze' | 'blue' | 'green';
        notes: string;
        is_verified: boolean;
      }>
    ) => {
      try {
        logger.log('📝 Updating ticket...', { ticketId, updates });

        const { data, error } = await supabase
          .from('attendance_tickets')
          .update(updates)
          .eq('id', ticketId)
          .select(
            `
            *,
            events(title, event_date),
            courses(title),
            profiles:user_id(display_name, email)
          `
          )
          .single();

        if (error) throw error;

        logger.log('✅ Ticket updated');

        // Update local state
        setState(prev => ({
          ...prev,
          tickets: prev.tickets.map(t => (t.id === ticketId ? data : t)),
        }));

        return data;
      } catch (err) {
        logger.error('❌ Error updating ticket:', err);
        throw err;
      }
    },
    []
  );

  const getTicketStatistics = useCallback(async () => {
    try {
      logger.log('📊 Fetching ticket statistics...');

      const { data, error } = await supabase.rpc('get_admin_ticket_statistics');

      if (error) {
        logger.warn('Statistics RPC not available, calculating manually');
        // Fallback: Calculate from local state
        return {
          total_tickets: state.tickets.length,
          total_events: state.tickets.filter(t => t.ticket_type === 'event').length,
          total_sessions: state.tickets.filter(t => t.ticket_type === 'course_session').length,
          total_verified: state.tickets.filter(t => t.is_verified).length,
          unique_users: new Set(state.tickets.map(t => t.user_id)).size,
        };
      }

      logger.log('✅ Fetched statistics');
      return data;
    } catch (err) {
      logger.error('❌ Error fetching statistics:', err);
      // Return default stats
      return {
        total_tickets: state.tickets.length,
        total_events: state.tickets.filter(t => t.ticket_type === 'event').length,
        total_sessions: state.tickets.filter(t => t.ticket_type === 'course_session').length,
        total_verified: state.tickets.filter(t => t.is_verified).length,
        unique_users: new Set(state.tickets.map(t => t.user_id)).size,
      };
    }
  }, [state.tickets]);

  // Initial fetch
  useEffect(() => {
    fetchAllTickets();
  }, [fetchAllTickets]);

  // Set up real-time subscriptions
  useEffect(() => {
    logger.log('👂 Setting up admin ticket subscriptions...');

    const channel = supabase
      .channel('admin-attendance-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_tickets',
        },
        payload => {
          logger.log('🔔 Ticket change detected:', payload.eventType);
          fetchAllTickets();
        }
      )
      .subscribe(status => {
        logger.log('📡 Admin ticket subscription status:', status);
      });

    return () => {
      logger.log('🔌 Cleaning up admin ticket subscriptions');
      supabase.removeChannel(channel);
    };
  }, [fetchAllTickets]);

  return {
    tickets: state.tickets,
    loading: state.loading,
    error: state.error,
    fetchAllTickets,
    issueTicket,
    bulkIssueTickets,
    verifyTicket,
    revokeTicket,
    updateTicket,
    getTicketStatistics,
  };
};
