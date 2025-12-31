/**
 * Tests for PerformanceAnalyticsService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceAnalyticsService } from '../PerformanceAnalyticsService';

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

describe('PerformanceAnalyticsService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockSupabaseChain = (data: any, error: any = null) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (resolve: (value: { data: any; error: any }) => any) => resolve({ data, error }),
  });

  describe('getQuestionLevelPerformance', () => {
    it('should fetch and aggregate question performance', async () => {
      const mockData = [
        {
          question_id: 'q1',
          is_correct: true,
          time_spent: 30,
          created_at: '2024-01-01T10:00:00Z',
          quiz_questions: {
            question_text: 'What is 2+2?',
            topic: 'Math',
            irt_difficulty: 0.5,
            irt_discrimination: 1.2,
          },
        },
        {
          question_id: 'q1',
          is_correct: false,
          time_spent: 45,
          created_at: '2024-01-02T10:00:00Z',
          quiz_questions: {
            question_text: 'What is 2+2?',
            topic: 'Math',
            irt_difficulty: 0.5,
            irt_discrimination: 1.2,
          },
        },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await PerformanceAnalyticsService.getQuestionLevelPerformance(mockUserId);

      expect(result).toHaveLength(1); // Aggregated by question_id
      expect(result[0].questionId).toBe('q1');
      expect(result[0].totalAttempts).toBe(2);
      expect(result[0].correctAttempts).toBe(1);
      expect(result[0].accuracy).toBe(50); // 1/2 = 50%
    });

    it('should calculate average time spent correctly', async () => {
      const mockData = [
        {
          question_id: 'q1',
          is_correct: true,
          time_spent: 30,
          created_at: '2024-01-01',
          quiz_questions: { question_text: 'Q1', topic: 'T1' },
        },
        {
          question_id: 'q1',
          is_correct: true,
          time_spent: 60,
          created_at: '2024-01-02',
          quiz_questions: { question_text: 'Q1', topic: 'T1' },
        },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await PerformanceAnalyticsService.getQuestionLevelPerformance(mockUserId);

      expect(result[0].averageTimeSpent).toBe(45); // (30 + 60) / 2
    });

    it('should handle null quiz_questions', async () => {
      const mockData = [
        {
          question_id: 'q1',
          is_correct: true,
          time_spent: 30,
          created_at: '2024-01-01',
          quiz_questions: null,
        },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await PerformanceAnalyticsService.getQuestionLevelPerformance(mockUserId);

      expect(result[0].questionText).toBeUndefined();
      expect(result[0].topic).toBeUndefined();
    });

    it('should limit results correctly', async () => {
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        question_id: `q${i}`,
        is_correct: true,
        time_spent: 30,
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}`,
        quiz_questions: null,
      }));

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await PerformanceAnalyticsService.getQuestionLevelPerformance(mockUserId, 10);

      expect(result).toHaveLength(10);
    });

    it('should return empty array on error', async () => {
      (supabase.from as any).mockImplementation(() =>
        createMockSupabaseChain(null, { message: 'Database error' })
      );

      const result = await PerformanceAnalyticsService.getQuestionLevelPerformance(mockUserId);

      expect(result).toEqual([]);
    });

    it('should sort by most recent attempts', async () => {
      const mockData = [
        {
          question_id: 'q1',
          is_correct: true,
          time_spent: 30,
          created_at: '2024-01-01T10:00:00Z',
          quiz_questions: null,
        },
        {
          question_id: 'q2',
          is_correct: true,
          time_spent: 30,
          created_at: '2024-01-05T10:00:00Z',
          quiz_questions: null,
        },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await PerformanceAnalyticsService.getQuestionLevelPerformance(mockUserId);

      expect(result[0].questionId).toBe('q2'); // More recent
      expect(result[1].questionId).toBe('q1'); // Older
    });
  });

  describe('getTopicPerformance', () => {
    it('should group questions by topic', async () => {
      const mockQuestions = [
        {
          questionId: 'q1',
          topic: 'Math',
          accuracy: 80,
          difficulty: 0.5,
          totalAttempts: 2,
          correctAttempts: 1,
          averageTimeSpent: 30,
        },
        {
          questionId: 'q2',
          topic: 'Math',
          accuracy: 60,
          difficulty: 0.6,
          totalAttempts: 2,
          correctAttempts: 1,
          averageTimeSpent: 40,
        },
        {
          questionId: 'q3',
          topic: 'Science',
          accuracy: 90,
          difficulty: 0.4,
          totalAttempts: 2,
          correctAttempts: 1,
          averageTimeSpent: 25,
        },
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );

      const result = await PerformanceAnalyticsService.getTopicPerformance(mockUserId);

      expect(result).toHaveLength(2); // Math and Science
      expect(result.find(t => t.topic === 'Math')?.totalQuestions).toBe(2);
      expect(result.find(t => t.topic === 'Science')?.totalQuestions).toBe(1);
    });

    it('should calculate average accuracy per topic', async () => {
      const mockQuestions = [
        {
          questionId: 'q1',
          topic: 'Math',
          accuracy: 80,
          difficulty: 0.5,
        },
        {
          questionId: 'q2',
          topic: 'Math',
          accuracy: 60,
          difficulty: 0.6,
        },
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );

      const result = await PerformanceAnalyticsService.getTopicPerformance(mockUserId);

      expect(result[0].averageAccuracy).toBe(70); // (80 + 60) / 2
    });

    it('should determine mastery levels correctly', async () => {
      const mockQuestions = [
        { questionId: 'q1', topic: 'Expert', accuracy: 95, difficulty: 0.5 },
        { questionId: 'q2', topic: 'Advanced', accuracy: 80, difficulty: 0.5 },
        { questionId: 'q3', topic: 'Intermediate', accuracy: 65, difficulty: 0.5 },
        { questionId: 'q4', topic: 'Beginner', accuracy: 40, difficulty: 0.5 },
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );

      const result = await PerformanceAnalyticsService.getTopicPerformance(mockUserId);

      expect(result.find(t => t.topic === 'Expert')?.masteryLevel).toBe('expert');
      expect(result.find(t => t.topic === 'Advanced')?.masteryLevel).toBe('advanced');
      expect(result.find(t => t.topic === 'Intermediate')?.masteryLevel).toBe('intermediate');
      expect(result.find(t => t.topic === 'Beginner')?.masteryLevel).toBe('beginner');
    });

    it('should identify weak and strong areas', async () => {
      const mockQuestions = [
        {
          questionId: 'q1',
          topic: 'Math',
          accuracy: 30,
          questionText: 'Weak Question',
          difficulty: 0.5,
        },
        {
          questionId: 'q2',
          topic: 'Math',
          accuracy: 95,
          questionText: 'Strong Question',
          difficulty: 0.5,
        },
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );

      const result = await PerformanceAnalyticsService.getTopicPerformance(mockUserId);

      expect(result[0].weakAreas).toContain('Weak Question');
      expect(result[0].strongAreas).toContain('Strong Question');
    });

    it('should sort topics by accuracy descending', async () => {
      const mockQuestions = [
        { questionId: 'q1', topic: 'Low', accuracy: 40, difficulty: 0.5 },
        { questionId: 'q2', topic: 'High', accuracy: 90, difficulty: 0.5 },
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );

      const result = await PerformanceAnalyticsService.getTopicPerformance(mockUserId);

      expect(result[0].topic).toBe('High');
      expect(result[1].topic).toBe('Low');
    });
  });

  describe('getLearningCurve', () => {
    it('should group by date and calculate daily accuracy', async () => {
      const mockData = [
        {
          is_correct: true,
          created_at: '2024-01-01T10:00:00Z',
          quiz_questions: { topic: 'Math' },
        },
        {
          is_correct: false,
          created_at: '2024-01-01T15:00:00Z',
          quiz_questions: { topic: 'Math' },
        },
        {
          is_correct: true,
          created_at: '2024-01-02T10:00:00Z',
          quiz_questions: { topic: 'Math' },
        },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await PerformanceAnalyticsService.getLearningCurve(mockUserId);

      expect(result).toHaveLength(2); // 2 days
      expect(result[0].accuracy).toBe(50); // 1/2 on day 1
      expect(result[1].accuracy).toBe(100); // 1/1 on day 2
    });

    it('should track cumulative attempt numbers', async () => {
      const mockData = [
        {
          is_correct: true,
          created_at: '2024-01-01T10:00:00Z',
          quiz_questions: null,
        },
        {
          is_correct: true,
          created_at: '2024-01-01T15:00:00Z',
          quiz_questions: null,
        },
        {
          is_correct: true,
          created_at: '2024-01-02T10:00:00Z',
          quiz_questions: null,
        },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await PerformanceAnalyticsService.getLearningCurve(mockUserId);

      expect(result[0].attemptNumber).toBe(2); // Day 1: 2 attempts
      expect(result[1].attemptNumber).toBe(3); // Day 2: cumulative 3
    });

    it('should filter by topic if specified', async () => {
      const mockData = [
        {
          is_correct: true,
          created_at: '2024-01-01T10:00:00Z',
          quiz_questions: { topic: 'Math' },
        },
        {
          is_correct: false,
          created_at: '2024-01-01T15:00:00Z',
          quiz_questions: { topic: 'Science' },
        },
      ];

      (supabase.from as any).mockImplementation(() => createMockSupabaseChain(mockData));

      const result = await PerformanceAnalyticsService.getLearningCurve(mockUserId, 'Math');

      // Only Math questions should be included
      expect(result).toHaveLength(1);
      expect(result[0].accuracy).toBe(100); // Only the Math question (correct)
    });

    it('should return empty array on error', async () => {
      (supabase.from as any).mockImplementation(() =>
        createMockSupabaseChain(null, { message: 'Error' })
      );

      const result = await PerformanceAnalyticsService.getLearningCurve(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getCommonMistakes', () => {
    it('should identify questions with low accuracy', async () => {
      const mockQuestions = [
        {
          questionId: 'q1',
          questionText: 'Difficult Question',
          topic: 'Math',
          accuracy: 30,
          totalAttempts: 5,
          correctAttempts: 1,
        },
        {
          questionId: 'q2',
          questionText: 'Easy Question',
          topic: 'Math',
          accuracy: 95,
          totalAttempts: 5,
          correctAttempts: 4,
        },
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );

      const result = await PerformanceAnalyticsService.getCommonMistakes(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].questionId).toBe('q1');
      expect(result[0].incorrectCount).toBe(4); // 5 attempts - 1 correct
    });

    it('should only include questions with multiple attempts', async () => {
      const mockQuestions = [
        {
          questionId: 'q1',
          accuracy: 30,
          totalAttempts: 1, // Only 1 attempt
          correctAttempts: 0,
        },
        {
          questionId: 'q2',
          accuracy: 30,
          totalAttempts: 3,
          correctAttempts: 0,
        },
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );

      const result = await PerformanceAnalyticsService.getCommonMistakes(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].questionId).toBe('q2');
    });

    it('should sort by incorrect count descending', async () => {
      const mockQuestions = [
        {
          questionId: 'q1',
          accuracy: 50,
          totalAttempts: 4,
          correctAttempts: 2,
        },
        {
          questionId: 'q2',
          accuracy: 30,
          totalAttempts: 10,
          correctAttempts: 3,
        },
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );

      const result = await PerformanceAnalyticsService.getCommonMistakes(mockUserId);

      expect(result[0].questionId).toBe('q2'); // 7 incorrect (more)
      expect(result[1].questionId).toBe('q1'); // 2 incorrect (less)
    });

    it('should limit results', async () => {
      const mockQuestions = Array.from({ length: 50 }, (_, i) => ({
        questionId: `q${i}`,
        accuracy: 30,
        totalAttempts: 5,
        correctAttempts: 1,
      }));

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );

      const result = await PerformanceAnalyticsService.getCommonMistakes(mockUserId, 5);

      expect(result).toHaveLength(5);
    });
  });

  describe('getDetailedPerformanceStats', () => {
    it('should calculate overall statistics', async () => {
      const mockQuestions = [
        {
          questionId: 'q1',
          totalAttempts: 3,
          correctAttempts: 2,
          averageTimeSpent: 30,
          difficulty: 0.2,
          accuracy: 66.67,
        },
        {
          questionId: 'q2',
          totalAttempts: 5,
          correctAttempts: 4,
          averageTimeSpent: 40,
          difficulty: 0.5,
          accuracy: 80,
        },
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );
      vi.spyOn(PerformanceAnalyticsService, 'getLearningCurve').mockResolvedValue([]);

      const result = await PerformanceAnalyticsService.getDetailedPerformanceStats(mockUserId);

      expect(result.totalQuestionsAttempted).toBe(2);
      expect(result.totalCorrect).toBe(6); // 2 + 4
      expect(result.totalIncorrect).toBe(2); // (3-2) + (5-4)
      expect(result.overallAccuracy).toBe(75); // 6/8 = 75%
    });

    it('should categorize performance by difficulty', async () => {
      const mockQuestions = [
        {
          questionId: 'q1',
          totalAttempts: 2,
          correctAttempts: 2,
          averageTimeSpent: 30,
          difficulty: 0.2,
        }, // Easy
        {
          questionId: 'q2',
          totalAttempts: 2,
          correctAttempts: 1,
          averageTimeSpent: 30,
          difficulty: 0.5,
        }, // Medium
        {
          questionId: 'q3',
          totalAttempts: 2,
          correctAttempts: 0,
          averageTimeSpent: 30,
          difficulty: 0.8,
        }, // Hard
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );
      vi.spyOn(PerformanceAnalyticsService, 'getLearningCurve').mockResolvedValue([]);

      const result = await PerformanceAnalyticsService.getDetailedPerformanceStats(mockUserId);

      expect(result.performanceByDifficulty.easy.correct).toBe(2);
      expect(result.performanceByDifficulty.easy.total).toBe(2);
      expect(result.performanceByDifficulty.medium.correct).toBe(1);
      expect(result.performanceByDifficulty.hard.correct).toBe(0);
    });

    it('should calculate improvement rate from learning curve', async () => {
      const mockQuestions = [
        {
          questionId: 'q1',
          totalAttempts: 1,
          correctAttempts: 1,
          averageTimeSpent: 30,
          difficulty: 0.5,
          accuracy: 100,
        },
      ];

      const mockCurve = [
        {
          attemptNumber: 1,
          date: '2024-01-01',
          accuracy: 50,
          averageScore: 50,
          questionsAttempted: 2,
        },
        {
          attemptNumber: 2,
          date: '2024-01-02',
          accuracy: 60,
          averageScore: 60,
          questionsAttempted: 2,
        },
        {
          attemptNumber: 3,
          date: '2024-01-03',
          accuracy: 70,
          averageScore: 70,
          questionsAttempted: 2,
        },
        {
          attemptNumber: 4,
          date: '2024-01-04',
          accuracy: 80,
          averageScore: 80,
          questionsAttempted: 2,
        },
      ];

      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue(
        mockQuestions as any
      );
      vi.spyOn(PerformanceAnalyticsService, 'getLearningCurve').mockResolvedValue(mockCurve);

      const result = await PerformanceAnalyticsService.getDetailedPerformanceStats(mockUserId);

      // First quarter: 50, Last quarter: 80, improvement = 30
      expect(result.improvementRate).toBe(30);
    });

    it('should return zero stats when no questions', async () => {
      vi.spyOn(PerformanceAnalyticsService, 'getQuestionLevelPerformance').mockResolvedValue([]);

      const result = await PerformanceAnalyticsService.getDetailedPerformanceStats(mockUserId);

      expect(result).toEqual({
        overallAccuracy: 0,
        totalQuestionsAttempted: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        averageTimePerQuestion: 0,
        performanceByDifficulty: {
          easy: { correct: 0, total: 0, percentage: 0 },
          medium: { correct: 0, total: 0, percentage: 0 },
          hard: { correct: 0, total: 0, percentage: 0 },
        },
        improvementRate: 0,
        consistencyScore: 0,
      });
    });
  });
});
