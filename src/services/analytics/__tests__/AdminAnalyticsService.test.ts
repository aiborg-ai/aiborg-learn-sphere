import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdminAnalyticsService } from '../AdminAnalyticsService';
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

describe('AdminAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPlatformMetrics', () => {
    it('should return comprehensive platform metrics', async () => {
      const mockProfiles = [
        { user_id: 'u1', role: 'student', created_at: '2024-01-01' },
        { user_id: 'u2', role: 'student', created_at: '2024-01-02' },
        { user_id: 'u3', role: 'instructor', created_at: '2024-01-03' },
        { user_id: 'u4', role: 'admin', created_at: '2024-01-04' },
      ];

      const mockEnrollments = [
        { payment_amount: 100, payment_status: 'completed' },
        { payment_amount: 200, payment_status: 'completed' },
        { payment_amount: 150, payment_status: 'completed' },
      ];

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          // profiles
          select: vi.fn().mockResolvedValue({
            data: mockProfiles,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // courses count
          select: vi.fn().mockResolvedValue({
            count: 10,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // enrollments count
          select: vi.fn().mockResolvedValue({
            count: 50,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // enrollments revenue
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockEnrollments,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          // active today
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              count: 5,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          // active week
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              count: 15,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          // active month
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              count: 30,
              error: null,
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const metrics = await AdminAnalyticsService.getPlatformMetrics();

      expect(metrics).toBeDefined();
      expect(metrics?.totalUsers).toBe(4);
      expect(metrics?.totalStudents).toBe(2);
      expect(metrics?.totalInstructors).toBe(1);
      expect(metrics?.totalAdmins).toBe(1);
      expect(metrics?.totalCourses).toBe(10);
      expect(metrics?.totalEnrollments).toBe(50);
      expect(metrics?.totalRevenue).toBe(450);
      expect(metrics?.activeUsersToday).toBe(5);
      expect(metrics?.activeUsersWeek).toBe(15);
      expect(metrics?.activeUsersMonth).toBe(30);
    });

    it('should handle database errors gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const metrics = await AdminAnalyticsService.getPlatformMetrics();
      expect(metrics).toBeNull();
    });

    it('should handle empty data sets', async () => {
      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          // profiles
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // courses count
          select: vi.fn().mockResolvedValue({
            count: 0,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // enrollments count
          select: vi.fn().mockResolvedValue({
            count: 0,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // enrollments revenue
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          // active today
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          // active week
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          // active month
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const metrics = await AdminAnalyticsService.getPlatformMetrics();

      expect(metrics?.totalUsers).toBe(0);
      expect(metrics?.totalRevenue).toBe(0);
    });
  });

  describe('getUserGrowth', () => {
    it('should return user growth data over time', async () => {
      const mockProfiles = [
        { created_at: '2024-01-01T10:00:00Z' },
        { created_at: '2024-01-02T10:00:00Z' },
        { created_at: '2024-01-02T11:00:00Z' },
        { created_at: '2024-01-03T10:00:00Z' },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockProfiles,
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const growth = await AdminAnalyticsService.getUserGrowth(30);

      expect(growth).toBeDefined();
      expect(Array.isArray(growth)).toBe(true);
    });

    it('should handle errors when fetching user growth', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const growth = await AdminAnalyticsService.getUserGrowth(30);
      expect(growth).toEqual([]);
    });
  });

  describe('getCourseAnalytics', () => {
    it('should return analytics for all courses', async () => {
      const mockCourses = [
        { id: 1, title: 'Course 1', price: '£100' },
        { id: 2, title: 'Course 2', price: '£200' },
      ];

      const mockEnrollments = [
        { course_id: 1, user_id: 'u1' },
        { course_id: 1, user_id: 'u2' },
        { course_id: 2, user_id: 'u1' },
      ];

      const mockProgress = [
        { course_id: 1, user_id: 'u1', progress_percentage: 100 },
        { course_id: 1, user_id: 'u2', progress_percentage: 50 },
        { course_id: 2, user_id: 'u1', progress_percentage: 75 },
      ];

      const mockReviews = [
        { course_id: 1, rating: 5 },
        { course_id: 1, rating: 4 },
        { course_id: 2, rating: 5 },
      ];

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          // courses
          select: vi.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // enrollments
          select: vi.fn().mockResolvedValue({
            data: mockEnrollments,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // progress
          select: vi.fn().mockResolvedValue({
            data: mockProgress,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // reviews
          select: vi.fn().mockResolvedValue({
            data: mockReviews,
            error: null,
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const analytics = await AdminAnalyticsService.getCourseAnalytics();

      expect(analytics).toBeDefined();
      expect(Array.isArray(analytics)).toBe(true);
    });
  });

  describe('getRevenueMetrics', () => {
    it('should calculate revenue metrics correctly', async () => {
      const mockEnrollments = [
        {
          payment_amount: 100,
          payment_status: 'completed',
          enrolled_at: '2024-01-01T10:00:00Z',
          course: { title: 'Course 1' },
        },
        {
          payment_amount: 200,
          payment_status: 'completed',
          enrolled_at: '2024-01-02T10:00:00Z',
          course: { title: 'Course 2' },
        },
        {
          payment_amount: 50,
          payment_status: 'failed',
          enrolled_at: '2024-01-03T10:00:00Z',
          course: { title: 'Course 1' },
        },
      ];

      const mockFrom = vi.fn().mockReturnValueOnce({
        // enrollments
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            data: mockEnrollments,
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const revenue = await AdminAnalyticsService.getRevenueMetrics(30);

      expect(revenue).toBeDefined();
      expect(revenue?.total).toBe(300);
      expect(revenue?.transactions).toBe(3);
      expect(revenue?.successfulTransactions).toBe(2);
      expect(revenue?.failedTransactions).toBe(1);
      expect(revenue?.averageTransactionValue).toBe(150);
    });

    it('should handle zero revenue correctly', async () => {
      const mockFrom = vi.fn().mockReturnValueOnce({
        // enrollments
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const revenue = await AdminAnalyticsService.getRevenueMetrics(30);

      expect(revenue?.total).toBe(0);
      expect(revenue?.transactions).toBe(0);
      expect(revenue?.averageTransactionValue).toBe(0);
    });
  });

  describe('getEngagementMetrics', () => {
    it('should return engagement metrics', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            count: 10,
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const engagement = await AdminAnalyticsService.getEngagementMetrics();

      expect(engagement).toBeDefined();
      expect(typeof engagement?.dailyActiveUsers).toBe('number');
      expect(typeof engagement?.weeklyActiveUsers).toBe('number');
      expect(typeof engagement?.monthlyActiveUsers).toBe('number');
    });
  });

  describe('getAssessmentAnalytics', () => {
    it('should return assessment analytics', async () => {
      const mockAssessments = [
        {
          id: '1',
          is_complete: true,
          final_score: 85,
          is_adaptive: true,
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:30:00Z',
        },
        {
          id: '2',
          is_complete: true,
          final_score: 90,
          is_adaptive: false,
          started_at: '2024-01-02T10:00:00Z',
          completed_at: '2024-01-02T10:45:00Z',
        },
        {
          id: '3',
          is_complete: false,
          final_score: null,
          is_adaptive: true,
          started_at: '2024-01-03T10:00:00Z',
          completed_at: null,
        },
      ];

      const mockFrom = vi.fn().mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            data: mockAssessments,
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const analytics = await AdminAnalyticsService.getAssessmentAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics?.totalAssessments).toBe(3);
      expect(analytics?.completedAssessments).toBe(2);
      expect(analytics?.completionRate).toBeGreaterThan(0);
    });

    it('should handle empty assessment data', async () => {
      const mockFrom = vi.fn().mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const analytics = await AdminAnalyticsService.getAssessmentAnalytics();

      expect(analytics?.totalAssessments).toBe(0);
      expect(analytics?.completedAssessments).toBe(0);
      expect(analytics?.averageScore).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const metrics = await AdminAnalyticsService.getPlatformMetrics();
      expect(metrics).toBeNull();
    });

    it('should handle null data responses', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const metrics = await AdminAnalyticsService.getPlatformMetrics();
      expect(metrics).toBeDefined();
    });
  });
});
