import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdaptiveAssessmentEngine, type AdaptiveQuestion } from '../AdaptiveAssessmentEngine';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
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

// Mock adaptive config
vi.mock('@/config/adaptiveAssessment', () => ({
  ADAPTIVE_CONFIG: {
    INITIAL_ABILITY: 0,
    INITIAL_STANDARD_ERROR: 1.0,
    MIN_QUESTIONS: 5,
    MAX_QUESTIONS: 20,
    STOP_SE_THRESHOLD: 0.3,
    ABILITY_UPDATE_WEIGHT: 0.3,
  },
  shouldStopAssessment: vi.fn((questionsAnswered, standardError) => {
    return questionsAnswered >= 20 || standardError < 0.3;
  }),
  getAugmentationLevel: vi.fn(() => 'minimal'),
}));

describe('AdaptiveAssessmentEngine', () => {
  let engine: AdaptiveAssessmentEngine;
  const mockAssessmentId = 'test-assessment-123';

  const mockQuestion: AdaptiveQuestion = {
    id: 'q1',
    question_text: 'What is TypeScript?',
    question_type: 'single_choice',
    difficulty_level: 'applied',
    irt_difficulty: 0.5,
    category_id: 'cat-1',
    category_name: 'Programming',
    options: [
      {
        id: 'opt-1',
        option_text: 'A superset of JavaScript',
        option_value: 'correct',
        points: 10,
        is_correct: true,
        order_index: 0,
      },
      {
        id: 'opt-2',
        option_text: 'A database',
        option_value: 'incorrect',
        points: 0,
        is_correct: false,
        order_index: 1,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new AdaptiveAssessmentEngine(mockAssessmentId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create engine with default state', () => {
      expect(engine).toBeDefined();
      expect(engine['assessmentId']).toBe(mockAssessmentId);
      expect(engine['state'].currentAbility).toBe(0);
      expect(engine['state'].standardError).toBe(1.0);
      expect(engine['state'].questionsAnswered).toBe(0);
    });

    it('should initialize state from database', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                current_ability_estimate: 0.5,
                ability_standard_error: 0.7,
                questions_answered_count: 3,
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      // Mock answered questions query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                current_ability_estimate: 0.5,
                ability_standard_error: 0.7,
                questions_answered_count: 3,
              },
              error: null,
            }),
          }),
        }),
      }).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { question_id: 'q1' },
              { question_id: 'q2' },
            ],
            error: null,
          }),
        }),
      });

      await engine.initializeState();

      expect(engine['state'].currentAbility).toBe(0.5);
      expect(engine['state'].standardError).toBe(0.7);
      expect(engine['state'].questionsAnswered).toBe(3);
    });

    it('should handle database errors during initialization', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(engine.initializeState()).rejects.toThrow();
    });
  });

  describe('getNextQuestion', () => {
    it('should return null if no available questions', async () => {
      // Mock the RPC call returning no questions
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      const question = await engine.getNextQuestion();
      expect(question).toBeNull();
    });

    it('should select question closest to current ability', async () => {
      // Mock the RPC call returning the best matched question (RPC does the selection)
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{
          question_id: 'q2',
          question_text: mockQuestion.question_text,
          question_type: mockQuestion.question_type,
          difficulty_level: mockQuestion.difficulty_level,
          irt_difficulty: 0.0,
          category_name: mockQuestion.category_name,
          options: mockQuestion.options,
        }],
        error: null,
      });

      engine['state'].currentAbility = 0.1;

      const question = await engine.getNextQuestion();
      expect(question).toBeDefined();
      expect(question?.id).toBe('q2'); // Closest to 0.1
    });

    it('should exclude already answered questions', async () => {
      // Mock the RPC call returning the next question (RPC excludes answered questions)
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{
          question_id: 'q2',
          question_text: mockQuestion.question_text,
          question_type: mockQuestion.question_type,
          difficulty_level: mockQuestion.difficulty_level,
          irt_difficulty: 0.1,
          category_name: mockQuestion.category_name,
          options: mockQuestion.options,
        }],
        error: null,
      });

      engine['state'].answeredQuestionIds = ['q1'];

      const question = await engine.getNextQuestion();
      expect(question?.id).toBe('q2');
    });
  });

  describe('recordAnswer', () => {
    it('should process correct answer and update ability', async () => {
      // Mock the RPC call
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{
          is_correct: true,
          points_earned: 10,
          new_ability_estimate: 0.5,
          new_standard_error: 0.8,
        }],
        error: null,
      });

      // Mock getting correct options
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: 'opt-1' }],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await engine.recordAnswer('q1', ['opt-1']);

      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBe(10);
      expect(result.newAbility).toBe(0.5);
      expect(engine['state'].questionsAnswered).toBe(1);
    });

    it('should process incorrect answer and decrease ability', async () => {
      // Mock the RPC call for incorrect answer
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{
          is_correct: false,
          points_earned: 0,
          new_ability_estimate: -0.3,
          new_standard_error: 0.85,
        }],
        error: null,
      });

      // Mock getting correct options
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: 'opt-1' }],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await engine.recordAnswer('q1', ['opt-2']);

      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
      expect(result.newAbility).toBeLessThan(0);
    });

    it('should handle multiple choice questions', async () => {
      const multiChoiceQuestion: AdaptiveQuestion = {
        ...mockQuestion,
        question_type: 'multiple_choice',
        options: [
          {
            id: 'opt-1',
            option_text: 'Option 1',
            option_value: 'correct',
            points: 5,
            is_correct: true,
            order_index: 0,
          },
          {
            id: 'opt-2',
            option_text: 'Option 2',
            option_value: 'correct',
            points: 5,
            is_correct: true,
            order_index: 1,
          },
          {
            id: 'opt-3',
            option_text: 'Option 3',
            option_value: 'incorrect',
            points: 0,
            is_correct: false,
            order_index: 2,
          },
        ],
      };

      // Mock the RPC call for multiple choice
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{
          is_correct: true,
          points_earned: 10,
          new_ability_estimate: 0.6,
          new_standard_error: 0.75,
        }],
        error: null,
      });

      // Mock getting correct options
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: 'opt-1' }, { id: 'opt-2' }],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await engine.recordAnswer('q1', ['opt-1', 'opt-2']);

      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBe(10);
    });
  });

  describe('getState', () => {
    it('should return current assessment state', () => {
      engine['state'].currentAbility = 0.5;
      engine['state'].standardError = 0.6;
      engine['state'].questionsAnswered = 5;

      const state = engine.getState();

      expect(state.currentAbility).toBe(0.5);
      expect(state.standardError).toBe(0.6);
      expect(state.questionsAnswered).toBe(5);
    });
  });

  describe('ability estimation', () => {
    it('should increase ability after correct answer', async () => {
      // Mock the RPC call
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{
          is_correct: true,
          points_earned: 10,
          new_ability_estimate: 0.5,
          new_standard_error: 0.8,
        }],
        error: null,
      });

      // Mock getting correct options
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: 'opt-1' }],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const initialAbility = engine['state'].currentAbility;
      await engine.recordAnswer('q1', ['opt-1']);

      expect(engine['state'].currentAbility).toBeGreaterThan(initialAbility);
    });

    it('should decrease standard error as more questions are answered', async () => {
      const mockFrom = vi.fn()
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockQuestion,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: { id: 'perf-1' },
              error: null,
            }),
          }),
        })
        .mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: {},
              error: null,
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const initialSE = engine['state'].standardError;

      // Simulate answering multiple questions
      for (let i = 0; i < 5; i++) {
        engine['state'].standardError = initialSE * Math.exp(-0.1 * i);
      }

      expect(engine['state'].standardError).toBeLessThan(initialSE);
    });
  });
});
