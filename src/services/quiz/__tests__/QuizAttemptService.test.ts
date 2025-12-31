/**
 * Tests for QuizAttemptService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuizAttemptService } from '../QuizAttemptService';
import { supabase } from '@/integrations/supabase/client';
import type { QuizAttempt, QuizResponse, StartQuizInput, SubmitQuizAnswerInput } from '../types';

vi.mock('@/integrations/supabase/client');
vi.mock('@/utils/logger');

describe('QuizAttemptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAttempt: QuizAttempt = {
    id: 'attempt-1',
    quiz_bank_id: 'quiz-1',
    user_id: 'user-1',
    attempt_number: 1,
    status: 'in_progress',
    score: null,
    total_points: null,
    percentage: null,
    passed: null,
    started_at: new Date().toISOString(),
    completed_at: null,
    time_taken_seconds: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockResponse: QuizResponse = {
    id: 'response-1',
    attempt_id: 'attempt-1',
    question_id: 'question-1',
    selected_option_id: 'option-1',
    answer_text: null,
    is_correct: true,
    points_earned: 1,
    time_spent_seconds: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('startQuiz', () => {
    it('should start a new quiz attempt for first attempt', async () => {
      const input: StartQuizInput = {
        quiz_bank_id: 'quiz-1',
        user_id: 'user-1',
      };

      const mockQuizBank = { id: 'quiz-1', max_attempts: null };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get quiz bank
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockQuizBank,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Second call: get previous attempts count
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else {
          // Third call: insert new attempt
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockAttempt,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await QuizAttemptService.startQuiz(input);

      expect(result).toEqual(mockAttempt);
      expect(result.attempt_number).toBe(1);
    });

    it('should increment attempt number for subsequent attempts', async () => {
      const input: StartQuizInput = {
        quiz_bank_id: 'quiz-1',
        user_id: 'user-1',
      };

      const mockQuizBank = { id: 'quiz-1', max_attempts: null };
      const mockPreviousAttempt = { attempt_number: 2 };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockQuizBank,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [mockPreviousAttempt],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockAttempt, attempt_number: 3 },
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await QuizAttemptService.startQuiz(input);

      expect(result.attempt_number).toBe(3);
    });

    it('should throw error when max attempts reached', async () => {
      const input: StartQuizInput = {
        quiz_bank_id: 'quiz-1',
        user_id: 'user-1',
      };

      const mockQuizBank = { id: 'quiz-1', max_attempts: 3 };
      const mockCompletedAttempts = [{ id: '1' }, { id: '2' }, { id: '3' }];

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockQuizBank,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: mockCompletedAttempts,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      await expect(QuizAttemptService.startQuiz(input)).rejects.toThrow(
        'Maximum attempts (3) reached for this quiz'
      );
    });

    it('should handle database errors', async () => {
      const input: StartQuizInput = {
        quiz_bank_id: 'quiz-1',
        user_id: 'user-1',
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      });

      await expect(QuizAttemptService.startQuiz(input)).rejects.toThrow('Database error');
    });
  });

  describe('submitAnswer', () => {
    it('should create new answer when no existing response', async () => {
      const input: SubmitQuizAnswerInput = {
        attempt_id: 'attempt-1',
        question_id: 'question-1',
        selected_option_id: 'option-1',
        time_spent_seconds: 30,
      };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Check for existing response
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }, // Not found
                  }),
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Insert new response
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockResponse,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          // Get question points
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { points: 1 },
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 4) {
          // Get option correctness
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { is_correct: true },
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Update response with correctness
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
      });

      const result = await QuizAttemptService.submitAnswer(input);

      expect(result).toEqual(mockResponse);
    });

    it('should update existing answer when response exists', async () => {
      const input: SubmitQuizAnswerInput = {
        attempt_id: 'attempt-1',
        question_id: 'question-1',
        selected_option_id: 'option-2',
        time_spent_seconds: 45,
      };

      const mockExisting = { id: 'response-1' };
      const mockUpdated = { ...mockResponse, selected_option_id: 'option-2' };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Check for existing response
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockExisting,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Update existing response
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUpdated,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          // Get question points
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { points: 1 },
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 4) {
          // Get option correctness
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { is_correct: false },
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Update response with correctness
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
      });

      const result = await QuizAttemptService.submitAnswer(input);

      expect(result.selected_option_id).toBe('option-2');
    });

    it('should handle free-response answers without correctness check', async () => {
      const input: SubmitQuizAnswerInput = {
        attempt_id: 'attempt-1',
        question_id: 'question-1',
        answer_text: 'Free response answer',
        time_spent_seconds: 120,
      };

      const mockFreeResponse = {
        ...mockResponse,
        selected_option_id: null,
        answer_text: 'Free response answer',
        is_correct: null,
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        return {
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
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockFreeResponse,
                error: null,
              }),
            }),
          }),
        };
      });

      const result = await QuizAttemptService.submitAnswer(input);

      expect(result.answer_text).toBe('Free response answer');
      expect(result.selected_option_id).toBeNull();
    });
  });

  describe('completeQuiz', () => {
    it('should complete quiz and calculate score using RPC', async () => {
      const attemptId = 'attempt-1';
      const mockCompletedAttempt = {
        ...mockAttempt,
        status: 'completed',
        score: 8,
        total_points: 10,
        percentage: 80,
        passed: true,
        time_taken_seconds: 300,
      };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 3) {
          // Get attempt details or updated attempt
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: callCount === 1 ? mockAttempt : mockCompletedAttempt,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Update time taken
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else {
          // Insert gamification points
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      });

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await QuizAttemptService.completeQuiz(attemptId);

      expect(result.score).toBe(8);
      expect(result.percentage).toBe(80);
      expect(result.passed).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('calculate_quiz_score', {
        attempt_id_param: attemptId,
      });
    });

    it('should fallback to manual calculation when RPC fails', async () => {
      const attemptId = 'attempt-1';
      const mockCompletedAttempt = {
        ...mockAttempt,
        status: 'completed',
        score: 7,
        total_points: 10,
        percentage: 70,
        passed: true,
      };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Get attempt for complete
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockAttempt,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Get attempt for manual calculation
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { quiz_bank_id: 'quiz-1' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          // Get questions
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ points: 5 }, { points: 5 }],
                error: null,
              }),
            }),
          };
        } else if (callCount === 4) {
          // Get responses
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ points_earned: 4 }, { points_earned: 3 }],
                error: null,
              }),
            }),
          };
        } else if (callCount === 5) {
          // Get quiz bank for pass percentage
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { pass_percentage: 70 },
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 6) {
          // Update attempt with scores
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (callCount === 7) {
          // Get updated attempt
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCompletedAttempt,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Insert gamification points
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      });

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: new Error('RPC not available'),
      });

      const result = await QuizAttemptService.completeQuiz(attemptId);

      expect(result.score).toBe(7);
      expect(result.passed).toBe(true);
    });

    it('should throw error when attempt is not in progress', async () => {
      const attemptId = 'attempt-1';

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockAttempt, status: 'completed' },
              error: null,
            }),
          }),
        }),
      });

      await expect(QuizAttemptService.completeQuiz(attemptId)).rejects.toThrow(
        'Quiz attempt is not in progress or timed out'
      );
    });
  });

  describe('getAttempt', () => {
    it('should get attempt with details', async () => {
      const attemptId = 'attempt-1';
      const mockAttemptWithBank = {
        ...mockAttempt,
        quiz_banks: { id: 'quiz-1', title: 'Test Quiz' },
      };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockAttemptWithBank,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [mockResponse],
                error: null,
              }),
            }),
          };
        }
      });

      const result = await QuizAttemptService.getAttempt(attemptId);

      expect(result.id).toBe(attemptId);
      expect(result.quiz_bank).toBeDefined();
      expect(result.responses).toHaveLength(1);
    });
  });

  describe('getUserAttempts', () => {
    it('should get all user attempts for a quiz', async () => {
      const userId = 'user-1';
      const quizBankId = 'quiz-1';
      const mockAttempts = [mockAttempt, { ...mockAttempt, id: 'attempt-2' }];

      const mockQuery = Promise.resolve({ data: mockAttempts, error: null });
      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await QuizAttemptService.getUserAttempts(userId, quizBankId);

      expect(result).toHaveLength(2);
      expect(mockEq1).toHaveBeenCalledWith('user_id', userId);
      expect(mockEq2).toHaveBeenCalledWith('quiz_bank_id', quizBankId);
    });
  });

  describe('getStudentPerformance', () => {
    it('should calculate student performance from attempts', async () => {
      const userId = 'user-1';
      const quizBankId = 'quiz-1';
      const mockAttempts = [
        { ...mockAttempt, status: 'completed', score: 7, percentage: 70, passed: true },
        {
          ...mockAttempt,
          id: 'attempt-2',
          status: 'completed',
          score: 9,
          percentage: 90,
          passed: true,
        },
      ];

      const mockQuery = Promise.resolve({ data: mockAttempts, error: null });
      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await QuizAttemptService.getStudentPerformance(userId, quizBankId);

      expect(result.best_attempt?.score).toBe(9);
      expect(result.progress.best_score).toBe(9);
      expect(result.progress.best_percentage).toBe(90);
      expect(result.progress.passed).toBe(true);
      expect(result.progress.attempts_count).toBe(2);
    });
  });

  describe('abandonQuiz', () => {
    it('should mark in-progress quiz as abandoned', async () => {
      const attemptId = 'attempt-1';

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { status: 'in_progress' },
                  error: null,
                }),
              }),
            }),
          };
        } else {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
      });

      await QuizAttemptService.abandonQuiz(attemptId);

      expect(supabase.from).toHaveBeenCalledTimes(2);
    });

    it('should not update if quiz is not in progress', async () => {
      const attemptId = 'attempt-1';

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { status: 'completed' },
              error: null,
            }),
          }),
        }),
      });

      await QuizAttemptService.abandonQuiz(attemptId);

      expect(supabase.from).toHaveBeenCalledTimes(1); // Only fetch, no update
    });
  });

  describe('handleTimeout', () => {
    it('should mark quiz as timed out and calculate partial score', async () => {
      const attemptId = 'attempt-1';
      const mockCompletedAttempt = {
        ...mockAttempt,
        status: 'completed',
        score: 5,
        percentage: 50,
        passed: false,
      };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Get attempt status
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { status: 'in_progress' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Mark as timed out
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (callCount === 3) {
          // Get attempt for completeQuiz
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockAttempt, status: 'timed_out' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 4) {
          // Update time taken
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (callCount === 5) {
          // Get updated attempt after completion
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCompletedAttempt,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Insert gamification points
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      });

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      await QuizAttemptService.handleTimeout(attemptId);

      expect(supabase.from).toHaveBeenCalled();
    });
  });

  describe('getQuestionStatistics', () => {
    it('should calculate question statistics', async () => {
      const questionId = 'question-1';
      const mockResponses = [
        { is_correct: true, time_spent_seconds: 30, selected_option_id: 'option-1' },
        { is_correct: false, time_spent_seconds: 45, selected_option_id: 'option-2' },
        { is_correct: true, time_spent_seconds: 25, selected_option_id: 'option-1' },
      ];

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockResponses,
            error: null,
          }),
        }),
      });

      const result = await QuizAttemptService.getQuestionStatistics(questionId);

      expect(result.total_responses).toBe(3);
      expect(result.correct_responses).toBe(2);
      expect(result.accuracy_percentage).toBeCloseTo(66.67, 1);
      expect(result.average_time_seconds).toBe(33); // (30 + 45 + 25) / 3
      expect(result.option_distribution).toEqual({
        'option-1': 2,
        'option-2': 1,
      });
    });

    it('should return zeros when no responses', async () => {
      const questionId = 'question-1';

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const result = await QuizAttemptService.getQuestionStatistics(questionId);

      expect(result.total_responses).toBe(0);
      expect(result.correct_responses).toBe(0);
      expect(result.accuracy_percentage).toBe(0);
    });
  });
});
