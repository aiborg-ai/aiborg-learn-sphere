/**
 * ReviewsDataService Tests
 * Tests for reviews data fetching, caching, and real-time subscriptions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataService, reviewsCache, subscribeToReviewChanges } from '../ReviewsDataService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

describe('ReviewsCache', () => {
  beforeEach(() => {
    reviewsCache.invalidate(); // Clear cache before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const testData = { id: '1', content: 'Test review' };
      reviewsCache.set('test-key', testData);

      const retrieved = reviewsCache.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent key', () => {
      const result = reviewsCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should expire data after TTL', () => {
      vi.useFakeTimers();
      const testData = { id: '1', content: 'Test review' };
      reviewsCache.set('test-key', testData, 1000); // 1 second TTL

      // Data should be available immediately
      expect(reviewsCache.get('test-key')).toEqual(testData);

      // Advance time past TTL
      vi.advanceTimersByTime(1001);

      // Data should be expired
      expect(reviewsCache.get('test-key')).toBeNull();

      vi.useRealTimers();
    });

    it('should use default TTL of 5 minutes', () => {
      vi.useFakeTimers();
      const testData = { id: '1', content: 'Test review' };
      reviewsCache.set('test-key', testData);

      // Should still be available after 4 minutes
      vi.advanceTimersByTime(4 * 60 * 1000);
      expect(reviewsCache.get('test-key')).toEqual(testData);

      // Should expire after 5 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(reviewsCache.get('test-key')).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('invalidate', () => {
    it('should clear all cache when called without pattern', () => {
      reviewsCache.set('key1', { data: 1 });
      reviewsCache.set('key2', { data: 2 });
      reviewsCache.set('key3', { data: 3 });

      reviewsCache.invalidate();

      expect(reviewsCache.get('key1')).toBeNull();
      expect(reviewsCache.get('key2')).toBeNull();
      expect(reviewsCache.get('key3')).toBeNull();
    });

    it('should clear only matching keys when pattern provided', () => {
      reviewsCache.set('user-reviews-1', { data: 1 });
      reviewsCache.set('user-reviews-2', { data: 2 });
      reviewsCache.set('approved-reviews', { data: 3 });

      reviewsCache.invalidate('user-reviews');

      expect(reviewsCache.get('user-reviews-1')).toBeNull();
      expect(reviewsCache.get('user-reviews-2')).toBeNull();
      expect(reviewsCache.get('approved-reviews')).toEqual({ data: 3 });
    });

    it('should handle pattern with no matches', () => {
      reviewsCache.set('key1', { data: 1 });

      reviewsCache.invalidate('non-matching-pattern');

      expect(reviewsCache.get('key1')).toEqual({ data: 1 });
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired key', () => {
      reviewsCache.set('test-key', { data: 1 });
      expect(reviewsCache.has('test-key')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(reviewsCache.has('non-existent')).toBe(false);
    });

    it('should return false for expired key', () => {
      vi.useFakeTimers();
      reviewsCache.set('test-key', { data: 1 }, 1000);

      vi.advanceTimersByTime(1001);

      expect(reviewsCache.has('test-key')).toBe(false);

      vi.useRealTimers();
    });
  });
});

describe('DataService', () => {
  beforeEach(() => {
    reviewsCache.invalidate();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getApprovedReviews', () => {
    const mockReviews = [
      {
        id: 'review-1',
        user_id: 'user-1',
        course_id: 'course-1',
        rating: 5,
        comment: 'Great course!',
        approved: true,
        created_at: '2025-12-29T12:00:00Z',
      },
      {
        id: 'review-2',
        user_id: 'user-2',
        course_id: 'course-2',
        rating: 4,
        comment: 'Good content',
        approved: true,
        created_at: '2025-12-28T12:00:00Z',
      },
    ];

    it('should fetch approved reviews and enrich with course and profile data', async () => {
      // Mock reviews query
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockReviews,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { title: 'Course Title' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { display_name: 'John Doe' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await DataService.getApprovedReviews();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(mockFrom).toHaveBeenCalledWith('reviews');
    });

    it('should use cached data on second call', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockReviews,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { title: 'Course Title' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { display_name: 'John Doe' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      // First call - should hit database
      const result1 = await DataService.getApprovedReviews();
      const firstCallCount = mockFrom.mock.calls.length;

      // Second call - should use cache
      const result2 = await DataService.getApprovedReviews();
      const secondCallCount = mockFrom.mock.calls.length;

      expect(result1).toEqual(result2);
      expect(secondCallCount).toBe(firstCallCount); // No additional calls
    });

    it('should throw error when reviews query fails', async () => {
      const mockError = new Error('Database error');
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(DataService.getApprovedReviews()).rejects.toThrow('Database error');
    });

    it('should handle enrichment failures gracefully', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [mockReviews[0]],
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'courses') {
          // Course query fails
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockRejectedValue(new Error('Course fetch failed')),
              }),
            }),
          };
        } else if (table === 'profiles') {
          // Profile query succeeds
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { display_name: 'John Doe' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await DataService.getApprovedReviews();

      // Should still return result even with partial failures
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty reviews array', async () => {
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

      const result = await DataService.getApprovedReviews();

      expect(result).toEqual([]);
    });
  });

  describe('getUserReviews', () => {
    const mockUserReviews = [
      {
        id: 'review-1',
        user_id: 'user-123',
        course_id: 'course-1',
        rating: 5,
        comment: 'My review',
        approved: true,
        created_at: '2025-12-29T12:00:00Z',
      },
    ];

    it('should fetch user reviews and enrich with course data', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockUserReviews,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { title: 'Course Title' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await DataService.getUserReviews('user-123');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(mockFrom).toHaveBeenCalledWith('reviews');
    });

    it('should use cached data on second call for same user', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockUserReviews,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { title: 'Course Title' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      // First call
      const result1 = await DataService.getUserReviews('user-123');
      const firstCallCount = mockFrom.mock.calls.length;

      // Second call - should use cache
      const result2 = await DataService.getUserReviews('user-123');
      const secondCallCount = mockFrom.mock.calls.length;

      expect(result1).toEqual(result2);
      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should use different cache for different users', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockUserReviews,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { title: 'Course Title' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await DataService.getUserReviews('user-123');
      const firstUserCalls = mockFrom.mock.calls.length;

      await DataService.getUserReviews('user-456');
      const secondUserCalls = mockFrom.mock.calls.length;

      // Should make new calls for different user
      expect(secondUserCalls).toBeGreaterThan(firstUserCalls);
    });

    it('should throw error when user reviews query fails', async () => {
      const mockError = new Error('Query failed');
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(DataService.getUserReviews('user-123')).rejects.toThrow('Query failed');
    });

    it('should handle empty user reviews', async () => {
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

      const result = await DataService.getUserReviews('user-123');

      expect(result).toEqual([]);
    });

    it('should handle course enrichment failures gracefully', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockUserReviews,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockRejectedValue(new Error('Course not found')),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await DataService.getUserReviews('user-123');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('invalidateReviewsCache', () => {
    it('should invalidate all reviews-related cache entries', () => {
      reviewsCache.set('approved-reviews', { data: 1 });
      reviewsCache.set('user-reviews-123', { data: 2 });
      reviewsCache.set('other-cache', { data: 3 });

      DataService.invalidateReviewsCache();

      // Reviews-related entries should be cleared
      expect(reviewsCache.get('approved-reviews')).toBeNull();
      expect(reviewsCache.get('user-reviews-123')).toBeNull();

      // Non-reviews cache should remain
      expect(reviewsCache.get('other-cache')).toEqual({ data: 3 });
    });
  });
});

describe('subscribeToReviewChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set up real-time subscription for review changes', () => {
    const mockSubscribe = vi.fn().mockReturnValue({});
    const mockOn = vi.fn().mockReturnValue({
      subscribe: mockSubscribe,
    });
    const mockChannel = vi.fn().mockReturnValue({
      on: mockOn,
    });
    (supabase.channel as ReturnType<typeof vi.fn>) = mockChannel;

    const callback = vi.fn();
    subscribeToReviewChanges(callback);

    expect(mockChannel).toHaveBeenCalledWith('reviews-changes', expect.any(Object));
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reviews',
      },
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('should return unsubscribe function', () => {
    const mockSubscription = { id: 'subscription-1' };
    const mockSubscribe = vi.fn().mockReturnValue(mockSubscription);
    const mockOn = vi.fn().mockReturnValue({
      subscribe: mockSubscribe,
    });
    const mockChannel = vi.fn().mockReturnValue({
      on: mockOn,
    });
    (supabase.channel as ReturnType<typeof vi.fn>) = mockChannel;
    (supabase.removeChannel as ReturnType<typeof vi.fn>) = vi.fn();

    const callback = vi.fn();
    const unsubscribe = subscribeToReviewChanges(callback);

    expect(typeof unsubscribe).toBe('function');

    // Call unsubscribe
    unsubscribe();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockSubscription);
  });

  it('should invalidate cache and trigger callback on review changes', () => {
    let changeHandler: ((payload: unknown) => void) | undefined;

    const mockSubscribe = vi.fn().mockImplementation(callback => {
      // Simulate successful subscription
      callback('SUBSCRIBED', null);
      return {};
    });

    const mockOn = vi.fn().mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return {
        subscribe: mockSubscribe,
      };
    });

    const mockChannel = vi.fn().mockReturnValue({
      on: mockOn,
    });
    (supabase.channel as ReturnType<typeof vi.fn>) = mockChannel;

    const callback = vi.fn();
    reviewsCache.set('approved-reviews', { data: 1 });

    subscribeToReviewChanges(callback);

    // Verify cache has data
    expect(reviewsCache.get('approved-reviews')).toBeDefined();

    // Simulate a review change event
    if (changeHandler) {
      changeHandler({
        eventType: 'INSERT',
        new: { id: 'review-new' },
      });
    }

    // Cache should be invalidated
    expect(reviewsCache.get('approved-reviews')).toBeNull();

    // Callback should be triggered
    expect(callback).toHaveBeenCalled();
  });

  it('should handle subscription errors', () => {
    const mockSubscribe = vi.fn().mockImplementation(callback => {
      // Simulate error
      callback('CHANNEL_ERROR', new Error('Connection failed'));
      return {};
    });

    const mockOn = vi.fn().mockReturnValue({
      subscribe: mockSubscribe,
    });

    const mockChannel = vi.fn().mockReturnValue({
      on: mockOn,
    });
    (supabase.channel as ReturnType<typeof vi.fn>) = mockChannel;

    const callback = vi.fn();

    // Should not throw
    expect(() => subscribeToReviewChanges(callback)).not.toThrow();
  });

  it('should handle subscription timeout', () => {
    const mockSubscribe = vi.fn().mockImplementation(callback => {
      callback('TIMED_OUT', null);
      return {};
    });

    const mockOn = vi.fn().mockReturnValue({
      subscribe: mockSubscribe,
    });

    const mockChannel = vi.fn().mockReturnValue({
      on: mockOn,
    });
    (supabase.channel as ReturnType<typeof vi.fn>) = mockChannel;

    const callback = vi.fn();

    expect(() => subscribeToReviewChanges(callback)).not.toThrow();
  });
});
