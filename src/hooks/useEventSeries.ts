import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

export interface EventSeries {
  id: number;
  title: string;
  description: string;
  location: string;
  event_date: string;
  start_time: string;
  end_time: string;
  price: string;
  category: string;
  max_capacity: number | null;
  current_registrations: number;
  is_active: boolean;
  is_series: boolean;
  series_name: string | null;
  meeting_url: string | null;
  recurrence_pattern: {
    day_of_week?: number;
    frequency?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface EventSession {
  id: string;
  event_id: number;
  session_number: number;
  title: string;
  description: string | null;
  session_type: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_url: string | null;
  max_capacity: number | null;
  current_registrations: number;
  status: string;
  check_in_enabled: boolean;
  check_in_window_start: string;
  check_in_window_end: string;
}

export interface EventSeriesRegistration {
  id: string;
  user_id: string;
  event_id: number;
  registered_at: string;
  payment_status: string;
  payment_amount: number;
}

/**
 * Hook to fetch all event series
 */
export function useEventSeries() {
  return useQuery({
    queryKey: ['eventSeries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_series', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching event series:', error);
        throw error;
      }

      return data as EventSeries[];
    },
  });
}

/**
 * Hook to fetch a single event series by ID with upcoming sessions
 */
export function useEventSeriesDetails(eventId: number | undefined) {
  return useQuery({
    queryKey: ['eventSeries', eventId],
    queryFn: async () => {
      if (!eventId) return null;

      // Fetch event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) {
        logger.error('Error fetching event series details:', eventError);
        throw eventError;
      }

      // Fetch upcoming sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('event_sessions')
        .select('*')
        .eq('event_id', eventId)
        .gte('session_date', new Date().toISOString().split('T')[0])
        .in('status', ['scheduled', 'in_progress'])
        .order('session_date', { ascending: true });

      if (sessionsError) {
        logger.warn('Error fetching sessions:', sessionsError);
      }

      return {
        event: event as EventSeries,
        upcomingSessions: (sessions || []) as EventSession[],
      };
    },
    enabled: !!eventId,
  });
}

/**
 * Hook to check if user is registered for an event series
 */
export function useEventSeriesRegistration(eventId: number | undefined) {
  return useQuery({
    queryKey: ['eventSeriesRegistration', eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await supabase
        .from('event_series_registrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" which is OK
        logger.error('Error checking registration:', error);
        throw error;
      }

      return data as EventSeriesRegistration | null;
    },
    enabled: !!eventId,
  });
}

/**
 * Hook to register for an event series
 */
export function useRegisterEventSeries() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      paymentMethod,
      notes,
    }: {
      eventId: number;
      paymentMethod?: string;
      notes?: string;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-event-series`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            eventId,
            paymentMethod,
            notes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register');
      }

      return result;
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Registration Successful',
        description: `You've been registered for the series. ${data.ticketsGenerated} tickets generated.`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['eventSeriesRegistration', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['eventSessionTickets'] });
      queryClient.invalidateQueries({ queryKey: ['eventSeries', variables.eventId] });
    },
    onError: (error: Error) => {
      logger.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to fetch sessions for an event series
 */
export function useEventSessions(
  eventId: number | undefined,
  options?: { includeCompleted?: boolean }
) {
  return useQuery({
    queryKey: ['eventSessions', eventId, options],
    queryFn: async () => {
      if (!eventId) return [];

      let query = supabase.from('event_sessions').select('*').eq('event_id', eventId);

      if (!options?.includeCompleted) {
        query = query.in('status', ['scheduled', 'draft', 'in_progress']);
      }

      const { data, error } = await query.order('session_date', { ascending: true });

      if (error) {
        logger.error('Error fetching event sessions:', error);
        throw error;
      }

      return data as EventSession[];
    },
    enabled: !!eventId,
  });
}
