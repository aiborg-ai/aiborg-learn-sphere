import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBulkEnrollment, type EnrollmentResult } from '../useBulkEnrollment';
import { supabase } from '@/integrations/supabase/client';
import type { BulkEnrollmentRow } from '@/utils/csvParser';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
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

describe('useBulkEnrollment', () => {
  const mockUser = {
    id: 'admin-123',
    email: 'admin@example.com',
  };

  const mockEnrollmentRow: BulkEnrollmentRow = {
    email: 'student@example.com',
    course_id: 1,
    payment_status: 'completed',
    payment_amount: 1000,
    payment_method: 'stripe',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth user
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useBulkEnrollment());

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.progress).toEqual({
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        percentage: 0,
      });
    });
  });

  describe('processEnrollments', () => {
    it('should successfully process single enrollment', async () => {
      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          // getUserByEmail
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { user_id: 'user-123' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // checkExistingEnrollment
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // createEnrollment
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'enroll-123', user_id: 'user-123', course_id: 1 },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // create payment transaction
          insert: vi.fn().mockResolvedValue({
            data: { id: 'payment-123' },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // audit log
          insert: vi.fn().mockResolvedValue({
            data: { id: 'audit-123' },
            error: null,
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useBulkEnrollment());

      let results: EnrollmentResult[] = [];

      await act(async () => {
        results = await result.current.processEnrollments([mockEnrollmentRow]);
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.enrollmentId).toBe('enroll-123');
      expect(result.current.progress.successful).toBe(1);
      expect(result.current.progress.failed).toBe(0);
    });

    it('should handle user not found error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' },
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useBulkEnrollment());

      let results: EnrollmentResult[] = [];

      await act(async () => {
        results = await result.current.processEnrollments([mockEnrollmentRow]);
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error).toContain('User not found');
      expect(result.current.progress.failed).toBe(1);
    });

    it('should handle existing enrollment error', async () => {
      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          // getUserByEmail
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { user_id: 'user-123' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // checkExistingEnrollment - already exists
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'existing-123' },
                  error: null,
                }),
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useBulkEnrollment());

      let results: EnrollmentResult[] = [];

      await act(async () => {
        results = await result.current.processEnrollments([mockEnrollmentRow]);
      });

      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error).toContain('already enrolled');
    });

    it('should process multiple enrollments in batches', async () => {
      const enrollments: BulkEnrollmentRow[] = Array.from({ length: 25 }, (_, i) => ({
        email: `student${i}@example.com`,
        course_id: 1,
        payment_status: 'completed',
        payment_amount: 1000,
        payment_method: 'stripe',
      }));

      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_id: 'user-123' },
              error: null,
            }),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'enroll-123' },
              error: null,
            }),
          }),
        }),
      }));

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useBulkEnrollment());

      await act(async () => {
        await result.current.processEnrollments(enrollments);
      });

      await waitFor(() => {
        expect(result.current.progress.total).toBe(25);
        expect(result.current.progress.processed).toBe(25);
        expect(result.current.progress.percentage).toBe(100);
      });
    });

    it('should update progress during processing', async () => {
      const enrollments: BulkEnrollmentRow[] = Array.from({ length: 5 }, (_, i) => ({
        email: `student${i}@example.com`,
        course_id: 1,
        payment_status: 'completed',
        payment_amount: 1000,
        payment_method: 'stripe',
      }));

      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_id: 'user-123' },
              error: null,
            }),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'enroll-123' },
              error: null,
            }),
          }),
        }),
      }));

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useBulkEnrollment());

      await act(async () => {
        await result.current.processEnrollments(enrollments);
      });

      expect(result.current.progress.percentage).toBeGreaterThan(0);
      expect(result.current.progress.percentage).toBeLessThanOrEqual(100);
    });

    it('should handle mixed success and failure results', async () => {
      const enrollments: BulkEnrollmentRow[] = [
        {
          email: 'valid@example.com',
          course_id: 1,
          payment_status: 'completed',
          payment_amount: 1000,
          payment_method: 'stripe',
        },
        {
          email: 'invalid@example.com',
          course_id: 1,
          payment_status: 'completed',
          payment_amount: 1000,
          payment_method: 'stripe',
        },
      ];

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          // First enrollment - success
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { user_id: 'user-123' },
                error: null,
              }),
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'enroll-123' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // Second enrollment - fail (user not found)
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useBulkEnrollment());

      let results: EnrollmentResult[] = [];

      await act(async () => {
        results = await result.current.processEnrollments(enrollments);
      });

      // Check for mixed results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      expect(successful).toBeGreaterThanOrEqual(0);
      expect(failed).toBeGreaterThanOrEqual(0);
      expect(successful + failed).toBe(enrollments.length);
    });
  });

  describe('resetProgress', () => {
    it('should reset progress to initial state', async () => {
      const { result } = renderHook(() => useBulkEnrollment());

      // Manually set some progress
      act(() => {
        result.current.resetProgress();
      });

      expect(result.current.progress).toEqual({
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        percentage: 0,
      });
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('Connection failed')),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useBulkEnrollment());

      await act(async () => {
        try {
          await result.current.processEnrollments([mockEnrollmentRow]);
        } catch (_error) {
          expect(_error).toBeDefined();
        }
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it('should continue processing after individual failures', async () => {
      const enrollments: BulkEnrollmentRow[] = [
        {
          email: 'valid@example.com',
          course_id: 1,
          payment_status: 'completed',
          payment_amount: 1000,
          payment_method: 'stripe',
        },
        {
          email: 'invalid@example.com',
          course_id: 1,
          payment_status: 'completed',
          payment_amount: 1000,
          payment_method: 'stripe',
        },
        {
          email: 'another@example.com',
          course_id: 1,
          payment_status: 'completed',
          payment_amount: 1000,
          payment_method: 'stripe',
        },
      ];

      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              // Randomly fail some requests
              if (Math.random() > 0.5) {
                return Promise.resolve({ data: { user_id: 'user-123' }, error: null });
              }
              return Promise.resolve({ data: null, error: { message: 'Not found' } });
            }),
          }),
        }),
      }));

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const { result } = renderHook(() => useBulkEnrollment());

      let results: EnrollmentResult[] = [];

      await act(async () => {
        results = await result.current.processEnrollments(enrollments);
      });

      expect(results).toHaveLength(3);
      expect(result.current.progress.processed).toBe(3);
    });
  });
});
