/**
 * useCalendarEvents Hook
 *
 * Custom hook for fetching and managing calendar events with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  fetchCalendarEvents,
  calculateCalendarStats,
} from '@/services/calendar/CalendarEventService';
import type { CalendarEvent, DateRange, CalendarStats, CalendarFilters } from '@/types/calendar';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

interface UseCalendarEventsOptions {
  /** User ID for filtering user-specific events */
  userId?: string;

  /** Initial date range (defaults to current month) */
  initialDateRange?: DateRange;

  /** Filter options */
  filters?: Partial<CalendarFilters>;

  /** Enable real-time subscriptions */
  enableRealtime?: boolean;
}

interface UseCalendarEventsReturn {
  /** All calendar events */
  events: CalendarEvent[];

  /** Filtered events based on current filters */
  filteredEvents: CalendarEvent[];

  /** Calendar statistics */
  stats: CalendarStats | null;

  /** Loading state */
  loading: boolean;

  /** Error state */
  error: Error | null;

  /** Current date range */
  dateRange: DateRange;

  /** Set new date range */
  setDateRange: (range: DateRange) => void;

  /** Navigate to specific month */
  goToMonth: (date: Date) => void;

  /** Navigate to next month */
  nextMonth: () => void;

  /** Navigate to previous month */
  previousMonth: () => void;

  /** Go to today */
  goToToday: () => void;

  /** Manually refresh events */
  refresh: () => void;

  /** Apply filters to events */
  applyFilters: (filters: Partial<CalendarFilters>) => void;

  /** Current active filters */
  activeFilters: Partial<CalendarFilters>;
}

export function useCalendarEvents(options: UseCalendarEventsOptions = {}): UseCalendarEventsReturn {
  const { userId, initialDateRange, filters: initialFilters = {}, enableRealtime = true } = options;

  const queryClient = useQueryClient();

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>(
    initialDateRange || {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }
  );

  // Filters state
  const [activeFilters, setActiveFilters] = useState<Partial<CalendarFilters>>(initialFilters);

  // Fetch events query
  const {
    data: events = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['calendar-events', dateRange, userId, activeFilters.eventTypes],
    queryFn: () => fetchCalendarEvents(dateRange, userId, activeFilters.eventTypes),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Calculate stats
  const [stats, setStats] = useState<CalendarStats | null>(null);

  useEffect(() => {
    if (events.length > 0) {
      setStats(calculateCalendarStats(events));
    } else {
      setStats(null);
    }
  }, [events]);

  // Apply filters to events
  const filteredEvents = useCallback(() => {
    let filtered = [...events];

    // Filter by course
    if (activeFilters.courseIds && activeFilters.courseIds.length > 0) {
      filtered = filtered.filter(
        event => event.courseId && activeFilters.courseIds!.includes(event.courseId)
      );
    }

    // Filter by status
    if (activeFilters.statuses && activeFilters.statuses.length > 0) {
      filtered = filtered.filter(event => activeFilters.statuses!.includes(event.status));
    }

    // Filter by user events only
    if (activeFilters.showOnlyUserEvents) {
      filtered = filtered.filter(event => event.userRelationship !== 'none');
    }

    // Filter by search query
    if (activeFilters.searchQuery && activeFilters.searchQuery.trim()) {
      const query = activeFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        event =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.courseTitle?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [events, activeFilters])();

  // Real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Subscribe to assignments changes
    const assignmentsChannel = supabase
      .channel('calendar-assignments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
        },
        payload => {
          logger.info('Assignment changed:', payload);
          refetch();
        }
      )
      .subscribe();

    channels.push(assignmentsChannel);

    // Subscribe to events changes
    const eventsChannel = supabase
      .channel('calendar-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        payload => {
          logger.info('Event changed:', payload);
          refetch();
        }
      )
      .subscribe();

    channels.push(eventsChannel);

    // Subscribe to workshop sessions changes
    const workshopChannel = supabase
      .channel('calendar-workshops')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workshop_sessions',
        },
        payload => {
          logger.info('Workshop session changed:', payload);
          refetch();
        }
      )
      .subscribe();

    channels.push(workshopChannel);

    // Subscribe to free sessions changes
    const sessionsChannel = supabase
      .channel('calendar-free-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'free_sessions',
        },
        payload => {
          logger.info('Free session changed:', payload);
          refetch();
        }
      )
      .subscribe();

    channels.push(sessionsChannel);

    // Subscribe to classroom sessions changes
    const classroomChannel = supabase
      .channel('calendar-classroom-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classroom_sessions',
        },
        payload => {
          logger.info('Classroom session changed:', payload);
          refetch();
        }
      )
      .subscribe();

    channels.push(classroomChannel);

    // Subscribe to submissions (affects assignment status)
    if (userId) {
      const submissionsChannel = supabase
        .channel('calendar-submissions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'submissions',
            filter: `user_id=eq.${userId}`,
          },
          payload => {
            logger.info('Submission changed:', payload);
            refetch();
          }
        )
        .subscribe();

      channels.push(submissionsChannel);
    }

    // Cleanup subscriptions on unmount
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [enableRealtime, userId, refetch]);

  // Navigation functions
  const goToMonth = useCallback((date: Date) => {
    setDateRange({
      start: startOfMonth(date),
      end: endOfMonth(date),
    });
  }, []);

  const nextMonth = useCallback(() => {
    setDateRange(prev => {
      const nextMonthDate = addMonths(prev.start, 1);
      return {
        start: startOfMonth(nextMonthDate),
        end: endOfMonth(nextMonthDate),
      };
    });
  }, []);

  const previousMonth = useCallback(() => {
    setDateRange(prev => {
      const prevMonthDate = subMonths(prev.start, 1);
      return {
        start: startOfMonth(prevMonthDate),
        end: endOfMonth(prevMonthDate),
      };
    });
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setDateRange({
      start: startOfMonth(today),
      end: endOfMonth(today),
    });
  }, []);

  const refresh = useCallback(() => {
    refetch();
    // Also invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
  }, [refetch, queryClient]);

  const applyFilters = useCallback((filters: Partial<CalendarFilters>) => {
    setActiveFilters(prev => ({
      ...prev,
      ...filters,
    }));
  }, []);

  return {
    events,
    filteredEvents,
    stats,
    loading,
    error: error as Error | null,
    dateRange,
    setDateRange,
    goToMonth,
    nextMonth,
    previousMonth,
    goToToday,
    refresh,
    applyFilters,
    activeFilters,
  };
}
