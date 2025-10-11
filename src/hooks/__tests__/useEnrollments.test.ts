import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEnrollments } from '../useEnrollments';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../useAuth';
import { createMockEnrollment, createMockUser } from '@/tests/mockFactories';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('useEnrollments', () => {
  const mockUser = createMockUser();
  const mockEnrollments = [
    createMockEnrollment({
      id: 'enrollment-1',
      user_id: mockUser.id,
      course_id: 1,
      payment_status: 'completed',
      payment_amount: 99.99,
    }),
    createMockEnrollment({
      id: 'enrollment-2',
      user_id: mockUser.id,
      course_id: 2,
      payment_status: 'completed',
      payment_amount: 149.99,
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetching enrollments', () => {
    it('should fetch user enrollments when user is logged in', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockEnrollments,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useEnrollments());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enrollments).toHaveLength(2);
      expect(result.current.error).toBeNull();
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should return empty enrollments when user is not logged in', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        loading: false,
      });

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enrollments).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockError = new Error('Database error');
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Database error');
      expect(result.current.enrollments).toEqual([]);
    });
  });

  describe('enrollInCourse', () => {
    it('should enroll user in a course successfully', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const newEnrollment = createMockEnrollment({
        id: 'enrollment-3',
        course_id: 3,
        payment_amount: 199.99,
      });

      const mockFetchQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: newEnrollment,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockFetchQuery)
        .mockReturnValueOnce(mockInsertQuery);

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const enrollment = await result.current.enrollInCourse(3, 199.99);

      // Wait for state update after enrollment
      await waitFor(() => {
        expect(result.current.enrollments).toContainEqual(newEnrollment);
      });

      expect(enrollment).toEqual(newEnrollment);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        course_id: 3,
        payment_status: 'completed',
        payment_amount: 199.99,
      });
      expect(result.current.enrollments).toContainEqual(newEnrollment);
    });

    it('should throw error when user is not logged in', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        loading: false,
      });

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.enrollInCourse(1, 99.99)).rejects.toThrow(
        'User must be logged in to enroll'
      );
    });

    it('should generate invoice after enrollment', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const newEnrollment = createMockEnrollment({
        id: 'enrollment-4',
        course_id: 4,
      });

      const mockFetchQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: newEnrollment,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockFetchQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const invokeFunc = vi.fn().mockResolvedValue({ data: {}, error: null });
      (supabase.functions.invoke as ReturnType<typeof vi.fn>) = invokeFunc;

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.enrollInCourse(4);

      // Wait for state update after enrollment
      await waitFor(() => {
        expect(result.current.enrollments).toContainEqual(newEnrollment);
      });

      expect(invokeFunc).toHaveBeenCalledWith('generate-invoice', {
        body: {
          enrollmentId: newEnrollment.id,
          userId: mockUser.id,
          itemType: 'course',
        },
      });
    });

    it('should not fail enrollment if invoice generation fails', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const newEnrollment = createMockEnrollment({
        id: 'enrollment-5',
        course_id: 5,
      });

      const mockFetchQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: newEnrollment,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockFetchQuery)
        .mockReturnValueOnce(mockInsertQuery);

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Invoice service unavailable')
      );

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const enrollment = await result.current.enrollInCourse(5);

      // Wait for state update after enrollment
      await waitFor(() => {
        expect(result.current.enrollments).toContainEqual(newEnrollment);
      });

      expect(enrollment).toEqual(newEnrollment);
      expect(result.current.enrollments).toContainEqual(newEnrollment);
    });
  });

  describe('isEnrolled', () => {
    it('should return true when user is enrolled in course', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockEnrollments,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isEnrolled(1)).toBe(true);
      expect(result.current.isEnrolled(2)).toBe(true);
    });

    it('should return false when user is not enrolled in course', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockEnrollments,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isEnrolled(999)).toBe(false);
    });
  });

  describe('getEnrollmentStatus', () => {
    it('should return "not_enrolled" when user is not enrolled', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const status = result.current.getEnrollmentStatus(1, '2025-01-01');
      expect(status).toBe('not_enrolled');
    });

    it('should return "completed" when course start date has passed', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockEnrollments,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const pastDate = '2020-01-01';
      const status = result.current.getEnrollmentStatus(1, pastDate);
      expect(status).toBe('completed');
    });

    it('should return "enrolled" when course start date is in future', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockEnrollments,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const futureDate = '2030-01-01';
      const status = result.current.getEnrollmentStatus(1, futureDate);
      expect(status).toBe('enrolled');
    });
  });

  describe('refetch', () => {
    it('should refetch enrollments when refetch is called', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockEnrollments,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useEnrollments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockQuery.select.mock.calls.length;

      result.current.refetch();

      await waitFor(() => {
        expect(mockQuery.select.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });
});
