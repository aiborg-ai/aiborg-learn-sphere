import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEvents, type Event } from '../useEvents';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useEvents', () => {
  const mockEvent: Event = {
    id: 1,
    title: 'AI Workshop',
    description: 'Learn AI fundamentals',
    location: 'London, UK',
    event_date: '2024-12-01',
    start_time: '10:00',
    end_time: '17:00',
    price: 100,
    activities: ['Workshop', 'Networking', 'Q&A'],
    category: 'technology',
    max_capacity: 50,
    current_registrations: 25,
    is_active: true,
    is_past: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should start with loading state', () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      expect(result.current.loading).toBe(true);
      expect(result.current.events).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should fetch events on mount', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockEvent],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0]?.id).toBe(1);
      expect(result.current.events[0]?.title).toBe('AI Workshop');
    });

    it('should only fetch active events', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [mockEvent],
        error: null,
      });

      const eqMock = vi.fn().mockReturnValue({
        order: orderMock,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      renderHook(() => useEvents());

      await waitFor(() => {
        expect(eqMock).toHaveBeenCalledWith('is_active', true);
      });
    });

    it('should order events by date ascending', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [mockEvent],
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: orderMock,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      renderHook(() => useEvents());

      await waitFor(() => {
        expect(orderMock).toHaveBeenCalledWith('event_date', { ascending: true });
      });
    });
  });

  describe('fetchEvents', () => {
    it('should handle multiple events', async () => {
      const events: Event[] = [
        { ...mockEvent, id: 1, title: 'Event 1' },
        { ...mockEvent, id: 2, title: 'Event 2' },
        { ...mockEvent, id: 3, title: 'Event 3' },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: events,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0]?.title).toBe('Event 1');
      expect(result.current.events[1]?.title).toBe('Event 2');
      expect(result.current.events[2]?.title).toBe('Event 3');
    });

    it('should handle empty event list', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle null data response', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Database error');
      expect(result.current.events).toEqual([]);
    });

    it('should handle network errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockRejectedValue(new Error('Network failure')),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network failure');
      expect(result.current.events).toEqual([]);
    });
  });

  describe('refetch', () => {
    it('should allow manual refetch', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockEvent],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initial fetch
      expect(mockFrom).toHaveBeenCalledTimes(1);

      // Manual refetch
      result.current.refetch();

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledTimes(2);
      });
    });

    it('should update loading state during refetch', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockEvent],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Refetch should complete successfully
      await result.current.refetch();

      // After refetch, loading should be false and events should still be loaded
      expect(result.current.loading).toBe(false);
      expect(result.current.events).toHaveLength(1);
    });
  });

  describe('event data structure', () => {
    it('should include all event fields', async () => {
      const completeEvent: Event = {
        ...mockEvent,
        photos: [
          {
            id: 'photo-1',
            event_id: 1,
            photo_url: 'https://example.com/photo.jpg',
            photo_caption: 'Event photo',
            display_order: 1,
            uploaded_by: 'admin',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [completeEvent],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const event = result.current.events[0];
      expect(event).toBeDefined();
      expect(event?.id).toBe(1);
      expect(event?.title).toBe('AI Workshop');
      expect(event?.description).toBe('Learn AI fundamentals');
      expect(event?.location).toBe('London, UK');
      expect(event?.event_date).toBe('2024-12-01');
      expect(event?.start_time).toBe('10:00');
      expect(event?.end_time).toBe('17:00');
      expect(event?.price).toBe(100);
      expect(event?.activities).toEqual(['Workshop', 'Networking', 'Q&A']);
      expect(event?.category).toBe('technology');
      expect(event?.max_capacity).toBe(50);
      expect(event?.current_registrations).toBe(25);
      expect(event?.is_active).toBe(true);
      expect(event?.is_past).toBe(false);
      expect(event?.photos).toHaveLength(1);
    });

    it('should handle events without max capacity', async () => {
      const eventWithoutCapacity: Event = {
        ...mockEvent,
        max_capacity: null,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [eventWithoutCapacity],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0]?.max_capacity).toBeNull();
    });

    it('should handle events with multiple activities', async () => {
      const eventWithActivities: Event = {
        ...mockEvent,
        activities: [
          'Keynote Speech',
          'Panel Discussion',
          'Networking',
          'Workshop',
          'Demo',
        ],
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [eventWithActivities],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0]?.activities).toHaveLength(5);
    });
  });

  describe('event filtering and ordering', () => {
    it('should return events in chronological order', async () => {
      const events: Event[] = [
        { ...mockEvent, id: 1, event_date: '2024-10-15', title: 'First Event' },
        { ...mockEvent, id: 2, event_date: '2024-11-20', title: 'Second Event' },
        { ...mockEvent, id: 3, event_date: '2024-12-25', title: 'Third Event' },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: events,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0]?.event_date).toBe('2024-10-15');
      expect(result.current.events[1]?.event_date).toBe('2024-11-20');
      expect(result.current.events[2]?.event_date).toBe('2024-12-25');
    });

    it('should include capacity information', async () => {
      const nearlyFullEvent: Event = {
        ...mockEvent,
        max_capacity: 100,
        current_registrations: 95,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [nearlyFullEvent],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const event = result.current.events[0];
      expect(event?.max_capacity).toBe(100);
      expect(event?.current_registrations).toBe(95);
      // Almost full - 95% capacity
      const capacityPercent = (event!.current_registrations / event!.max_capacity!) * 100;
      expect(capacityPercent).toBe(95);
    });
  });

  describe('error recovery', () => {
    it('should clear previous error on successful refetch', async () => {
      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          // First call - error
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Connection error'),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // Second call - success
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [mockEvent],
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.error).toBe('Connection error');
      });

      // Refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.events).toHaveLength(1);
      });
    });
  });
});
