/**
 * Tests for UserAnalyticsService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserAnalyticsService } from '../UserAnalyticsService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('UserAnalyticsService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockSupabaseChain = (data: any, error: any = null) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: (value: { data: any; error: any }) => any) => resolve({ data, error }),
  });

  describe('getUserWeeklyActivity', () => {
    it('should fetch weekly activity data for default 6 weeks', async () => {
      const mockProgressData = [{ time_spent_minutes: 120 }];
      const mockCompletionsData = [{ id: '1' }, { id: '2' }];
      const mockQuizzesData = [{ score: 80 }, { score: 90 }];

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        // Progress, completions, quizzes - 3 calls per week * 6 weeks = 18 calls
        if (callCount % 3 === 1) {
          return createMockSupabaseChain(mockProgressData);
        } else if (callCount % 3 === 2) {
          return createMockSupabaseChain(mockCompletionsData);
        } else {
          return createMockSupabaseChain(mockQuizzesData);
        }
      });

      const result = await UserAnalyticsService.getUserWeeklyActivity(mockUserId);

      expect(result).toHaveLength(6);
      expect(result[0]).toHaveProperty('week');
      expect(result[0]).toHaveProperty('studyTime');
      expect(result[0]).toHaveProperty('completedLessons');
      expect(result[0]).toHaveProperty('quizzesTaken');
      expect(result[0]).toHaveProperty('averageScore');
    });

    it('should fetch weekly activity for custom number of weeks', async () => {
      (supabase.from as any).mockImplementation(() => createMockSupabaseChain([]));

      const result = await UserAnalyticsService.getUserWeeklyActivity(mockUserId, 4);

      expect(result).toHaveLength(4);
    });

    it('should calculate total study time correctly', async () => {
      const mockProgressData = [
        { time_spent_minutes: 60 },
        { time_spent_minutes: 45 },
        { time_spent_minutes: 30 },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockProgressData));

      const result = await UserAnalyticsService.getUserWeeklyActivity(mockUserId, 1);

      expect(result[0].studyTime).toBe(135); // 60 + 45 + 30 = 135
    });

    it('should calculate average quiz score correctly', async () => {
      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount % 3 === 0) {
          // Quizzes call
          return createMockSupabaseChain([{ score: 70 }, { score: 80 }, { score: 90 }]);
        }
        return createMockSupabaseChain([]);
      });

      const result = await UserAnalyticsService.getUserWeeklyActivity(mockUserId, 1);

      expect(result[0].averageScore).toBe(80); // (70 + 80 + 90) / 3 = 80
    });

    it('should handle null/undefined data gracefully', async () => {
      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(null));

      const result = await UserAnalyticsService.getUserWeeklyActivity(mockUserId, 1);

      expect(result[0].studyTime).toBe(0);
      expect(result[0].completedLessons).toBe(0);
      expect(result[0].quizzesTaken).toBe(0);
      expect(result[0].averageScore).toBe(0);
    });

    it('should return empty array on error', async () => {
      (supabase.from as any).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await UserAnalyticsService.getUserWeeklyActivity(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserCategoryDistribution', () => {
    it('should calculate category distribution with percentages', async () => {
      const mockEnrollments = [
        { id: '1', courses: { category: 'JavaScript' } },
        { id: '2', courses: { category: 'JavaScript' } },
        { id: '3', courses: { category: 'Python' } },
        { id: '4', courses: { category: 'React' } },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockEnrollments));

      const result = await UserAnalyticsService.getUserCategoryDistribution(mockUserId);

      expect(result).toHaveLength(3);
      expect(result[0].category).toBe('JavaScript');
      expect(result[0].value).toBe(2);
      expect(result[0].percentage).toBe(50); // 2/4 = 50%
    });

    it('should assign colors to categories', async () => {
      const mockEnrollments = [{ id: '1', courses: { category: 'JavaScript' } }];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockEnrollments));

      const result = await UserAnalyticsService.getUserCategoryDistribution(mockUserId);

      expect(result[0]).toHaveProperty('color');
      expect(result[0].color).toBeTruthy();
    });

    it('should sort categories by value in descending order', async () => {
      const mockEnrollments = [
        { id: '1', courses: { category: 'JavaScript' } },
        { id: '2', courses: { category: 'Python' } },
        { id: '3', courses: { category: 'Python' } },
        { id: '4', courses: { category: 'Python' } },
        { id: '5', courses: { category: 'React' } },
        { id: '6', courses: { category: 'React' } },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockEnrollments));

      const result = await UserAnalyticsService.getUserCategoryDistribution(mockUserId);

      expect(result[0].category).toBe('Python'); // 3 courses
      expect(result[1].category).toBe('React'); // 2 courses
      expect(result[2].category).toBe('JavaScript'); // 1 course
    });

    it('should handle uncategorized courses', async () => {
      const mockEnrollments = [
        { id: '1', courses: null },
        { id: '2', courses: { category: null } },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockEnrollments));

      const result = await UserAnalyticsService.getUserCategoryDistribution(mockUserId);

      expect(result[0].category).toBe('Uncategorized');
      expect(result[0].value).toBe(2);
    });

    it('should return empty array on error', async () => {
      (supabase.from as any).mockImplementation(() =>
        createMockSupabaseChain(null, { message: 'Error' })
      );

      const result = await UserAnalyticsService.getUserCategoryDistribution(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserProgressTrends', () => {
    it('should calculate progress trends for 6 weeks', async () => {
      const mockInProgressData = [
        { course_id: '1', progress_percentage: 50 },
        { course_id: '2', progress_percentage: 70 },
      ];
      const mockCompletedData = [{ course_id: '3' }];

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) {
          return createMockSupabaseChain(mockInProgressData);
        } else {
          return createMockSupabaseChain(mockCompletedData);
        }
      });

      const result = await UserAnalyticsService.getUserProgressTrends(mockUserId);

      expect(result).toHaveLength(6);
      expect(result[0]).toHaveProperty('week');
      expect(result[0]).toHaveProperty('progress');
      expect(result[0]).toHaveProperty('coursesInProgress');
      expect(result[0]).toHaveProperty('coursesCompleted');
    });

    it('should calculate average progress correctly', async () => {
      const mockInProgressData = [
        { course_id: '1', progress_percentage: 40 },
        { course_id: '2', progress_percentage: 60 },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockInProgressData));

      const result = await UserAnalyticsService.getUserProgressTrends(mockUserId, 1);

      expect(result[0].progress).toBe(50); // (40 + 60) / 2 = 50
    });

    it('should handle empty data gracefully', async () => {
      (supabase.from as any).mockImplementation(() => createMockSupabaseChain([]));

      const result = await UserAnalyticsService.getUserProgressTrends(mockUserId, 1);

      expect(result[0].progress).toBe(0);
      expect(result[0].coursesInProgress).toBe(0);
      expect(result[0].coursesCompleted).toBe(0);
    });

    it('should return empty array on error', async () => {
      (supabase.from as any).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await UserAnalyticsService.getUserProgressTrends(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserSkillsRadar', () => {
    it('should return radar data for 6 skills', async () => {
      const mockAssessments = [
        { overall_score: 80, completed_at: '2024-01-01' },
        { overall_score: 85, completed_at: '2024-01-02' },
        { overall_score: 90, completed_at: '2024-01-03' },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockAssessments));

      const result = await UserAnalyticsService.getUserSkillsRadar(mockUserId);

      expect(result).toHaveLength(6);
      expect(result[0]).toHaveProperty('skill');
      expect(result[0]).toHaveProperty('proficiency');
      expect(result[0]).toHaveProperty('assessments');
      expect(result[0]).toHaveProperty('lastUpdated');
    });

    it('should calculate proficiency from assessments', async () => {
      const mockAssessments = [
        { overall_score: 60, completed_at: '2024-01-01' },
        { overall_score: 80, completed_at: '2024-01-02' },
        { overall_score: 100, completed_at: '2024-01-03' },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockAssessments));

      const result = await UserAnalyticsService.getUserSkillsRadar(mockUserId);

      // First skill uses assessments [0, 1, 2], average = (60+80+100)/3 = 80
      expect(result[0].proficiency).toBe(80);
    });

    it('should handle empty assessments', async () => {
      (supabase.from as any).mockImplementation(() => createMockSupabaseChain([]));

      const result = await UserAnalyticsService.getUserSkillsRadar(mockUserId);

      expect(result).toHaveLength(6);
      result.forEach(skill => {
        expect(skill.proficiency).toBe(0);
        expect(skill.assessments).toBe(0);
      });
    });

    it('should return empty array on error', async () => {
      (supabase.from as any).mockImplementation(() =>
        createMockSupabaseChain(null, { message: 'Error' })
      );

      const result = await UserAnalyticsService.getUserSkillsRadar(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserStudyTimeByDay', () => {
    it('should group study time by day of week', async () => {
      const mockData = [
        { time_spent_minutes: 60, last_accessed: '2024-01-01T10:00:00Z' }, // Monday
        { time_spent_minutes: 90, last_accessed: '2024-01-02T10:00:00Z' }, // Tuesday
        { time_spent_minutes: 45, last_accessed: '2024-01-01T15:00:00Z' }, // Monday
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await UserAnalyticsService.getUserStudyTimeByDay(mockUserId);

      expect(result).toHaveLength(7); // 7 days of week
      expect(result.every(day => day.day)).toBe(true);
      expect(result.every(day => typeof day.hours === 'number')).toBe(true);
      expect(result.every(day => typeof day.sessions === 'number')).toBe(true);
    });

    it('should convert minutes to hours correctly', async () => {
      const mockData = [{ time_spent_minutes: 120, last_accessed: '2024-01-01T10:00:00Z' }];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await UserAnalyticsService.getUserStudyTimeByDay(mockUserId);

      // 120 minutes = 2 hours
      const monday = result.find(d => d.day === 'Monday');
      expect(monday?.hours).toBe(2);
    });

    it('should count sessions per day', async () => {
      const mockData = [
        { time_spent_minutes: 60, last_accessed: '2024-01-01T10:00:00Z' }, // Monday
        { time_spent_minutes: 30, last_accessed: '2024-01-01T15:00:00Z' }, // Monday
        { time_spent_minutes: 45, last_accessed: '2024-01-01T20:00:00Z' }, // Monday
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await UserAnalyticsService.getUserStudyTimeByDay(mockUserId);

      const monday = result.find(d => d.day === 'Monday');
      expect(monday?.sessions).toBe(3);
    });

    it('should filter by date range if provided', async () => {
      (supabase.from as any).mockImplementation(() => createMockSupabaseChain([]));

      const dateRange = {
        start: '2024-01-01',
        end: '2024-01-31',
      };

      await UserAnalyticsService.getUserStudyTimeByDay(mockUserId, dateRange);

      expect(supabase.from).toHaveBeenCalledWith('user_progress');
    });

    it('should return empty array on error', async () => {
      (supabase.from as any).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await UserAnalyticsService.getUserStudyTimeByDay(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserDashboardStats', () => {
    it('should aggregate dashboard statistics', async () => {
      const mockSetup = () => {
        let callCount = 0;
        (supabase.from as any).mockImplementation((table: string) => {
          callCount++;
          if (table === 'user_progress') {
            if (callCount === 1) {
              // Study time
              return createMockSupabaseChain([
                { time_spent_minutes: 120 },
                { time_spent_minutes: 180 },
              ]);
            } else {
              // Completed courses
              return createMockSupabaseChain([{ course_id: '1' }, { course_id: '2' }]);
            }
          } else if (table === 'user_dashboard') {
            return createMockSupabaseChain({ current_streak: 5 });
          } else if (table === 'user_ai_assessments') {
            return createMockSupabaseChain([{ overall_score: 80 }, { overall_score: 90 }]);
          } else if (table === 'certificates') {
            return createMockSupabaseChain([{ id: '1' }]);
          } else if (table === 'user_achievements') {
            return createMockSupabaseChain([{ id: '1' }, { id: '2' }]);
          }
          return createMockSupabaseChain([]);
        });
      };

      mockSetup();

      const result = await UserAnalyticsService.getUserDashboardStats(mockUserId);

      expect(result).toHaveProperty('totalStudyTime');
      expect(result).toHaveProperty('completedCourses');
      expect(result).toHaveProperty('currentStreak');
      expect(result).toHaveProperty('longestStreak');
      expect(result).toHaveProperty('averageScore');
      expect(result).toHaveProperty('totalAssessments');
      expect(result).toHaveProperty('certificatesEarned');
      expect(result).toHaveProperty('achievementsCount');
    });

    it('should calculate total study time correctly', async () => {
      (supabase.from as any).mockImplementation(() =>
        createMockSupabaseChain([
          { time_spent_minutes: 100 },
          { time_spent_minutes: 150 },
          { time_spent_minutes: 50 },
        ])
      );

      const result = await UserAnalyticsService.getUserDashboardStats(mockUserId);

      expect(result.totalStudyTime).toBe(300); // 100 + 150 + 50
    });

    it('should calculate average assessment score', async () => {
      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        callCount++;
        if (table === 'user_ai_assessments') {
          return createMockSupabaseChain([
            { overall_score: 70 },
            { overall_score: 80 },
            { overall_score: 90 },
          ]);
        }
        return createMockSupabaseChain([]);
      });

      const result = await UserAnalyticsService.getUserDashboardStats(mockUserId);

      expect(result.averageScore).toBe(80); // (70 + 80 + 90) / 3
    });

    it('should return zero stats on error', async () => {
      (supabase.from as any).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await UserAnalyticsService.getUserDashboardStats(mockUserId);

      expect(result).toEqual({
        totalStudyTime: 0,
        completedCourses: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageScore: 0,
        totalAssessments: 0,
        certificatesEarned: 0,
        achievementsCount: 0,
      });
    });
  });
});
