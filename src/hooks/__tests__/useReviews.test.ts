import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useReviews, type Review } from '../useReviews';
import { supabase } from '@/integrations/supabase/client';
import { DataService, subscribeToReviewChanges } from '@/services/ReviewsDataService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock ReviewsDataService
vi.mock('@/services/ReviewsDataService', () => ({
  DataService: {
    getApprovedReviews: vi.fn(),
    invalidateReviewsCache: vi.fn(),
  },
  subscribeToReviewChanges: vi.fn(),
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

describe('useReviews', () => {
  const mockReview: Review = {
    id: 'review-123',
    user_id: 'user-123',
    course_id: 1,
    display_name_option: 'full_name',
    review_type: 'written',
    written_review: 'Great course!',
    voice_review_url: null,
    video_review_url: null,
    course_period: '2024-Q1',
    course_mode: 'online',
    rating: 5,
    approved: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    profiles: {
      display_name: 'Test User',
    },
    courses: {
      title: 'Test Course',
    },
  };

  const mockProfile = {
    display_name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock subscribeToReviewChanges
    (subscribeToReviewChanges as ReturnType<typeof vi.fn>).mockReturnValue(() => {});

    // Mock DataService.getApprovedReviews
    (DataService.getApprovedReviews as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockReview,
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useReviews());

      expect(result.current.loading).toBe(true);
      expect(result.current.reviews).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should fetch reviews on mount', async () => {
      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(DataService.getApprovedReviews).toHaveBeenCalledTimes(1);
      expect(result.current.reviews).toHaveLength(1);
      expect(result.current.reviews[0]?.id).toBe('review-123');
    });

    it('should handle fetch errors', async () => {
      (DataService.getApprovedReviews as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.reviews).toEqual([]);
    });
  });

  describe('fetchReviews', () => {
    it('should not throttle manual refetch calls', async () => {
      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initial fetch
      expect(DataService.getApprovedReviews).toHaveBeenCalledTimes(1);

      // Manual refetch always bypasses throttling (force = true)
      await act(async () => {
        await result.current.refetch();
      });

      // Should call again because manual refetch bypasses throttle
      expect(DataService.getApprovedReviews).toHaveBeenCalledTimes(2);
    });

    it('should allow force refetch', async () => {
      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(DataService.getApprovedReviews).toHaveBeenCalledTimes(1);

      // Force refetch should bypass throttle
      await act(async () => {
        await result.current.refetch();
      });

      expect(DataService.getApprovedReviews).toHaveBeenCalledTimes(2);
    });

    it('should update lastFetched timestamp', async () => {
      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lastFetched).toBeGreaterThan(0);
    });
  });

  describe('submitReview', () => {
    it('should submit a written review', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockReview,
                id: 'new-review-123',
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      // Mock profile fetch
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockReview,
                id: 'new-review-123',
              },
              error: null,
            }),
          }),
        }),
      }).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const reviewData = {
        user_id: 'user-123',
        course_id: 1,
        display_name_option: 'full_name' as const,
        review_type: 'written' as const,
        written_review: 'Great course!',
        voice_review_url: null,
        video_review_url: null,
        course_period: '2024-Q1',
        course_mode: 'online' as const,
        rating: 5,
      };

      let submittedReview;
      await act(async () => {
        submittedReview = await result.current.submitReview(reviewData);
      });

      expect(submittedReview).toBeDefined();
      expect(DataService.invalidateReviewsCache).toHaveBeenCalled();
    });

    it('should submit a voice review', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockReview,
                review_type: 'voice',
                voice_review_url: 'https://example.com/voice.mp3',
                written_review: null,
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockReview,
                review_type: 'voice',
              },
              error: null,
            }),
          }),
        }),
      }).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const reviewData = {
        user_id: 'user-123',
        course_id: 1,
        display_name_option: 'full_name' as const,
        review_type: 'voice' as const,
        written_review: null,
        voice_review_url: 'https://example.com/voice.mp3',
        video_review_url: null,
        course_period: '2024-Q1',
        course_mode: 'online' as const,
        rating: 4,
      };

      await act(async () => {
        await result.current.submitReview(reviewData);
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'send-review-notification',
        expect.objectContaining({
          body: expect.objectContaining({
            reviewContent: 'Voice/Video review submitted',
          }),
        })
      );
    });

    it('should send notification email after submission', async () => {
      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockReview,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const reviewData = {
        user_id: 'user-123',
        course_id: 1,
        display_name_option: 'full_name' as const,
        review_type: 'written' as const,
        written_review: 'Excellent!',
        voice_review_url: null,
        video_review_url: null,
        course_period: '2024-Q1',
        course_mode: 'online' as const,
        rating: 5,
      };

      await act(async () => {
        await result.current.submitReview(reviewData);
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'send-review-notification',
        expect.objectContaining({
          body: expect.objectContaining({
            rating: 5,
            reviewContent: 'Excellent!',
          }),
        })
      );
    });

    it('should handle submission errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const reviewData = {
        user_id: 'user-123',
        course_id: 1,
        display_name_option: 'full_name' as const,
        review_type: 'written' as const,
        written_review: 'Test',
        voice_review_url: null,
        video_review_url: null,
        course_period: '2024-Q1',
        course_mode: 'online' as const,
        rating: 5,
      };

      await expect(
        act(async () => {
          await result.current.submitReview(reviewData);
        })
      ).rejects.toThrow();
    });

    it('should not fail submission if notification fails', async () => {
      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockReview,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Email service down')
      );

      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const reviewData = {
        user_id: 'user-123',
        course_id: 1,
        display_name_option: 'full_name' as const,
        review_type: 'written' as const,
        written_review: 'Test',
        voice_review_url: null,
        video_review_url: null,
        course_period: '2024-Q1',
        course_mode: 'online' as const,
        rating: 5,
      };

      let submittedReview;
      await act(async () => {
        submittedReview = await result.current.submitReview(reviewData);
      });

      // Should succeed despite notification failure
      expect(submittedReview).toBeDefined();
    });
  });

  describe('real-time subscriptions', () => {
    it('should set up review change subscriptions', () => {
      renderHook(() => useReviews());

      expect(subscribeToReviewChanges).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clean up subscriptions on unmount', () => {
      const unsubscribeMock = vi.fn();
      (subscribeToReviewChanges as ReturnType<typeof vi.fn>).mockReturnValue(
        unsubscribeMock
      );

      const { unmount } = renderHook(() => useReviews());

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should refetch when review changes are detected', async () => {
      let changeCallback: () => void = () => {};
      (subscribeToReviewChanges as ReturnType<typeof vi.fn>).mockImplementation(
        (callback) => {
          changeCallback = callback;
          return () => {};
        }
      );

      renderHook(() => useReviews());

      await waitFor(() => {
        expect(DataService.getApprovedReviews).toHaveBeenCalledTimes(1);
      });

      // Trigger a change
      act(() => {
        changeCallback();
      });

      await waitFor(() => {
        expect(DataService.getApprovedReviews).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('cache management', () => {
    it('should invalidate cache after submitting review', async () => {
      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockReview,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const reviewData = {
        user_id: 'user-123',
        course_id: 1,
        display_name_option: 'full_name' as const,
        review_type: 'written' as const,
        written_review: 'Test',
        voice_review_url: null,
        video_review_url: null,
        course_period: '2024-Q1',
        course_mode: 'online' as const,
        rating: 5,
      };

      await act(async () => {
        await result.current.submitReview(reviewData);
      });

      expect(DataService.invalidateReviewsCache).toHaveBeenCalled();
    });
  });

  describe('different review types', () => {
    it('should handle anonymous reviews', async () => {
      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockReview,
                  display_name_option: 'anonymous',
                },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useReviews());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const reviewData = {
        user_id: 'user-123',
        course_id: 1,
        display_name_option: 'anonymous' as const,
        review_type: 'written' as const,
        written_review: 'Anonymous review',
        voice_review_url: null,
        video_review_url: null,
        course_period: '2024-Q1',
        course_mode: 'online' as const,
        rating: 4,
      };

      await act(async () => {
        await result.current.submitReview(reviewData);
      });

      expect(supabase.from).toHaveBeenCalled();
    });

    it('should handle different course modes', async () => {
      const modes: Array<'online' | 'in-person' | 'hybrid'> = [
        'online',
        'in-person',
        'hybrid',
      ];

      for (const mode of modes) {
        (DataService.getApprovedReviews as ReturnType<typeof vi.fn>).mockResolvedValue([
          {
            ...mockReview,
            course_mode: mode,
          },
        ]);

        const { result } = renderHook(() => useReviews());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.reviews[0]?.course_mode).toBe(mode);
      }
    });
  });
});
