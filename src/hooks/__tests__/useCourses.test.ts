import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCourses } from '../useCourses';
import { supabase } from '@/integrations/supabase/client';
import { createMockCourse } from '@/tests/mockFactories';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useCourses', () => {
  const mockCourses = [
    {
      ...createMockCourse({
        id: 1,
        title: 'AI Fundamentals',
        audience: 'professional',
        audiences: ['professional'],
        is_active: true,
        display: true,
        sort_order: 1,
      }),
    },
    {
      ...createMockCourse({
        id: 2,
        title: 'Machine Learning Basics',
        audience: 'professional',
        audiences: ['professional', 'student'],
        is_active: true,
        display: true,
        sort_order: 2,
      }),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful data fetching', () => {
    it('should fetch courses from courses_with_audiences view', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCourses,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useCourses());

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.courses).toEqual([]);
      expect(result.current.error).toBeNull();

      // After data loads
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.courses).toHaveLength(2);
      expect(result.current.courses[0].title).toBe('AI Fundamentals');
      expect(result.current.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('courses_with_audiences');
    });

    it('should fallback to courses table if view fails', async () => {
      // First call (view) fails
      const mockViewQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'View not found' },
        }),
      };

      // Second call (table) succeeds
      const mockTableQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCourses.map(({ audiences, ...course }) => course),
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockViewQuery)
        .mockReturnValueOnce(mockTableQuery);

      const { result } = renderHook(() => useCourses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.courses).toHaveLength(2);
      expect(supabase.from).toHaveBeenCalledWith('courses_with_audiences');
      expect(supabase.from).toHaveBeenCalledWith('courses');
    });

    it('should handle backward compatibility with single audience field', async () => {
      const courseWithSingleAudience = {
        ...createMockCourse({
          id: 1,
          title: 'Old Course',
          audience: 'professional',
        }),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'View not found' },
        }),
      };

      const mockFallbackQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [courseWithSingleAudience],
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockFallbackQuery);

      const { result } = renderHook(() => useCourses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.courses[0].audiences).toEqual(['professional']);
    });

    it('should filter only active and displayed courses', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCourses,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      renderHook(() => useCourses());

      await waitFor(() => {
        expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockQuery.eq).toHaveBeenCalledWith('display', true);
      });
    });

    it('should order courses by sort_order ascending', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCourses,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      renderHook(() => useCourses());

      await waitFor(() => {
        expect(mockQuery.order).toHaveBeenCalledWith('sort_order', { ascending: true });
      });
    });
  });

  describe('error handling', () => {
    it('should handle errors when both view and table fail', async () => {
      const errorMessage = 'Database connection failed';

      const mockViewQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'View failed' },
        }),
      };

      const mockTableQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error(errorMessage),
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockViewQuery)
        .mockReturnValueOnce(mockTableQuery);

      const { result } = renderHook(() => useCourses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.courses).toEqual([]);
    });

    it('should handle non-Error exceptions', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue('String error'),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useCourses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch courses');
    });
  });

  describe('refetch functionality', () => {
    it('should refetch courses when refetch is called', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCourses,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useCourses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockQuery.select.mock.calls.length;

      // Trigger refetch
      result.current.refetch();

      await waitFor(() => {
        expect(mockQuery.select.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should reset error state on refetch', async () => {
      // First call fails
      const mockFailQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('First error'),
        }),
      };

      // Second call (refetch) succeeds
      const mockSuccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCourses,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockFailQuery)
        .mockReturnValueOnce(mockFailQuery) // Fallback also fails
        .mockReturnValueOnce(mockSuccessQuery);

      const { result } = renderHook(() => useCourses());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.courses).toHaveLength(2);
      });
    });
  });

  describe('multiple audiences support', () => {
    it('should properly handle courses with multiple audiences', async () => {
      const multiAudienceCourse = {
        ...createMockCourse({
          id: 1,
          title: 'Universal Course',
          audiences: ['professional', 'student', 'business'],
        }),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [multiAudienceCourse],
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useCourses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.courses[0].audiences).toHaveLength(3);
      expect(result.current.courses[0].audience).toBe('professional'); // First audience for backward compatibility
    });
  });
});
