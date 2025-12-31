import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuizService } from '../QuizService';
import type {
  QuizBank,
  QuizQuestion,
  CreateQuizBankInput,
  UpdateQuizBankInput,
  CreateQuizQuestionInput,
  UpdateQuizQuestionInput,
  QuizStatistics,
} from '../types';

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('QuizService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockQuizBank: QuizBank = {
    id: 'quiz-1',
    title: 'JavaScript Fundamentals Quiz',
    description: 'Test your JavaScript knowledge',
    course_id: 1,
    difficulty_level: 'intermediate',
    pass_percentage: 70,
    time_limit_minutes: 30,
    shuffle_questions: true,
    shuffle_options: true,
    show_correct_answers: true,
    is_published: true,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockQuestion: QuizQuestion = {
    id: 'question-1',
    quiz_bank_id: 'quiz-1',
    question_text: 'What is a closure?',
    question_type: 'multiple_choice',
    points: 1,
    order_index: 0,
    explanation: 'A closure is a function that has access to variables in its outer scope',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  // ============================================================================
  // QUIZ BANK CRUD
  // ============================================================================

  describe('createQuizBank', () => {
    it('should create quiz bank with defaults', async () => {
      const input: CreateQuizBankInput = {
        title: 'Test Quiz',
        course_id: 1,
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockQuizBank,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      const result = await QuizService.createQuizBank(input, 'user-1');

      expect(result).toEqual(mockQuizBank);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Quiz',
          course_id: 1,
          created_by: 'user-1',
          difficulty_level: 'intermediate',
          pass_percentage: 70,
          shuffle_questions: true,
          shuffle_options: true,
          show_correct_answers: true,
        })
      );
    });

    it('should throw error if insert fails', async () => {
      const input: CreateQuizBankInput = {
        title: 'Test Quiz',
        course_id: 1,
      };

      const mockError = new Error('Insert failed');

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      await expect(QuizService.createQuizBank(input, 'user-1')).rejects.toThrow('Insert failed');
    });
  });

  describe('updateQuizBank', () => {
    it('should update quiz bank successfully', async () => {
      const input: UpdateQuizBankInput = {
        id: 'quiz-1',
        title: 'Updated Title',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockQuizBank, title: 'Updated Title' },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      const result = await QuizService.updateQuizBank(input);

      expect(result.title).toBe('Updated Title');
      expect(mockUpdate).toHaveBeenCalledWith({ title: 'Updated Title' });
    });

    it('should throw error if update fails', async () => {
      const input: UpdateQuizBankInput = {
        id: 'quiz-1',
        title: 'Updated',
      };

      const mockError = new Error('Update failed');

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(QuizService.updateQuizBank(input)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteQuizBank', () => {
    it('should delete quiz bank successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await expect(QuizService.deleteQuizBank('quiz-1')).resolves.toBeUndefined();

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error if delete fails', async () => {
      const mockError = new Error('Delete failed');

      const mockEq = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await expect(QuizService.deleteQuizBank('quiz-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('getQuizBank', () => {
    it('should get quiz bank with questions and options', async () => {
      const mockOptions = [
        {
          id: 'opt-1',
          question_id: 'question-1',
          option_text: 'Option A',
          is_correct: true,
          order_index: 0,
        },
      ];

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Get quiz bank
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
          // Get questions
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [mockQuestion],
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Get options
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockOptions,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await QuizService.getQuizBank('quiz-1', true);

      expect(result.id).toBe('quiz-1');
      expect(result.questions).toHaveLength(1);
      expect(result.questions?.[0].options).toHaveLength(1);
    });

    it('should get quiz bank without options when includeOptions is false', async () => {
      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Get quiz bank
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
          // Get questions
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [mockQuestion],
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await QuizService.getQuizBank('quiz-1', false);

      expect(result.id).toBe('quiz-1');
      expect(result.questions).toHaveLength(1);
    });

    it('should throw error if quiz bank not found', async () => {
      const mockError = new Error('Not found');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(QuizService.getQuizBank('quiz-1')).rejects.toThrow('Not found');
    });
  });

  describe('getQuizBanksByCourse', () => {
    it('should return all quiz banks for course', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockQuizBank],
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await QuizService.getQuizBanksByCourse(1);

      expect(result).toEqual([mockQuizBank]);
    });

    it('should filter published quiz banks only', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockQuizBank],
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await QuizService.getQuizBanksByCourse(1, true);

      expect(result).toEqual([mockQuizBank]);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Query failed');

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(QuizService.getQuizBanksByCourse(1)).rejects.toThrow('Query failed');
    });
  });

  // ============================================================================
  // QUESTION CRUD
  // ============================================================================

  describe('createQuestion', () => {
    it('should create question with options', async () => {
      const input: CreateQuizQuestionInput = {
        quiz_bank_id: 'quiz-1',
        question_text: 'What is JavaScript?',
        question_type: 'multiple_choice',
        options: [
          { option_text: 'A programming language', is_correct: true },
          { option_text: 'A database', is_correct: false },
        ],
      };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Create question
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockQuestion,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Create options
          return {
            insert: vi.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
      });

      const result = await QuizService.createQuestion(input);

      expect(result).toEqual(mockQuestion);
    });

    it('should create question without options', async () => {
      const input: CreateQuizQuestionInput = {
        quiz_bank_id: 'quiz-1',
        question_text: 'Explain closures',
        question_type: 'short_answer',
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockQuestion,
              error: null,
            }),
          }),
        }),
      });

      const result = await QuizService.createQuestion(input);

      expect(result).toEqual(mockQuestion);
    });

    it('should throw error if question creation fails', async () => {
      const input: CreateQuizQuestionInput = {
        quiz_bank_id: 'quiz-1',
        question_text: 'Test',
        question_type: 'multiple_choice',
      };

      const mockError = new Error('Creation failed');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(QuizService.createQuestion(input)).rejects.toThrow('Creation failed');
    });
  });

  describe('updateQuestion', () => {
    it('should update question successfully', async () => {
      const input: UpdateQuizQuestionInput = {
        id: 'question-1',
        question_text: 'Updated question',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockQuestion, question_text: 'Updated question' },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      const result = await QuizService.updateQuestion(input);

      expect(result.question_text).toBe('Updated question');
    });

    it('should update question with new options', async () => {
      const input: UpdateQuizQuestionInput = {
        id: 'question-1',
        question_text: 'Updated question',
        options: [{ option_text: 'New option', is_correct: true }],
      };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        callCount++;
        if (table === 'quiz_questions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockQuestion,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else {
          // quiz_options
          if (callCount === 2) {
            // Delete
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          } else {
            // Insert
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
        }
      });

      const result = await QuizService.updateQuestion(input);

      expect(result).toEqual(mockQuestion);
    });

    it('should throw error if update fails', async () => {
      const input: UpdateQuizQuestionInput = {
        id: 'question-1',
        question_text: 'Updated',
      };

      const mockError = new Error('Update failed');

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(QuizService.updateQuestion(input)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await expect(QuizService.deleteQuestion('question-1')).resolves.toBeUndefined();
    });

    it('should throw error if delete fails', async () => {
      const mockError = new Error('Delete failed');

      const mockEq = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await expect(QuizService.deleteQuestion('question-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('reorderQuestions', () => {
    it('should reorder questions successfully', async () => {
      const questionIds = ['q-1', 'q-2', 'q-3'];

      const mockEq2 = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(QuizService.reorderQuestions('quiz-1', questionIds)).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // STATISTICS & PROGRESS
  // ============================================================================

  describe('getQuizStatistics', () => {
    it('should return quiz statistics from RPC', async () => {
      const mockStats: QuizStatistics = {
        quiz_bank_id: 'quiz-1',
        total_attempts: 100,
        unique_students: 50,
        average_score: 85,
        average_percentage: 85,
        pass_rate: 90,
        average_time_seconds: 1200,
      };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const result = await QuizService.getQuizStatistics('quiz-1');

      expect(result).toEqual(mockStats);
      expect(supabase.rpc).toHaveBeenCalledWith('get_quiz_statistics', {
        p_quiz_bank_id: 'quiz-1',
      });
    });

    it('should fallback to calculateQuizStatistics if RPC fails', async () => {
      const mockError = new Error('RPC failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockAttempts = [
        {
          user_id: 'user-1',
          score: 85,
          total_points: 100,
          percentage: 85,
          passed: true,
          time_taken_seconds: 1200,
        },
      ];

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockAttempts,
              error: null,
            }),
          }),
        }),
      });

      const result = await QuizService.getQuizStatistics('quiz-1');

      expect(result.total_attempts).toBe(1);
      expect(result.average_score).toBe(85);
    });
  });

  describe('getStudentProgress', () => {
    it('should return student progress', async () => {
      const mockAttempts = [
        {
          score: 90,
          percentage: 90,
          passed: true,
          created_at: '2024-01-15T00:00:00Z',
        },
        {
          score: 80,
          percentage: 80,
          passed: true,
          created_at: '2024-01-10T00:00:00Z',
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockAttempts,
        error: null,
      });

      const mockEq3 = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        eq: mockEq3,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await QuizService.getStudentProgress('user-1', 'quiz-1');

      expect(result.attempts_count).toBe(2);
      expect(result.best_score).toBe(90);
      expect(result.passed).toBe(true);
    });

    it('should return default progress if no attempts', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockEq3 = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        eq: mockEq3,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await QuizService.getStudentProgress('user-1', 'quiz-1');

      expect(result.attempts_count).toBe(0);
      expect(result.passed).toBe(false);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Query failed');

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockEq3 = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        eq: mockEq3,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(QuizService.getStudentProgress('user-1', 'quiz-1')).rejects.toThrow(
        'Query failed'
      );
    });
  });

  // ============================================================================
  // PUBLISH & DUPLICATE
  // ============================================================================

  describe('togglePublish', () => {
    it('should publish quiz bank', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockQuizBank, is_published: true },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      const result = await QuizService.togglePublish('quiz-1', true);

      expect(result.is_published).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ is_published: true });
    });

    it('should throw error if toggle fails', async () => {
      const mockError = new Error('Toggle failed');

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(QuizService.togglePublish('quiz-1', true)).rejects.toThrow('Toggle failed');
    });
  });

  describe('duplicateQuizBank', () => {
    it('should duplicate quiz bank with questions', async () => {
      // Mock getQuizBank
      vi.spyOn(QuizService, 'getQuizBank').mockResolvedValue({
        ...mockQuizBank,
        questions: [mockQuestion],
      });

      // Mock createQuizBank
      const newQuizBank = { ...mockQuizBank, id: 'quiz-2', title: 'Copy of Quiz' };
      vi.spyOn(QuizService, 'createQuizBank').mockResolvedValue(newQuizBank);

      // Mock createQuestion
      vi.spyOn(QuizService, 'createQuestion').mockResolvedValue(mockQuestion);

      const result = await QuizService.duplicateQuizBank('quiz-1', 'Copy of Quiz', 'user-1');

      expect(result.id).toBe('quiz-2');
      expect(result.title).toBe('Copy of Quiz');
      expect(QuizService.createQuestion).toHaveBeenCalled();
    });

    it('should throw error if duplication fails', async () => {
      vi.spyOn(QuizService, 'getQuizBank').mockRejectedValue(new Error('Duplication failed'));

      await expect(QuizService.duplicateQuizBank('quiz-1', 'Copy', 'user-1')).rejects.toThrow(
        'Duplication failed'
      );
    });
  });
});
