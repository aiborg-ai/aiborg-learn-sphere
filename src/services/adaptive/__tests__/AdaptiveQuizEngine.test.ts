/**
 * Tests for AdaptiveQuizEngine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdaptiveQuizEngine } from '../AdaptiveQuizEngine';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');
vi.mock('@/utils/logger');

// Mock parent class AdaptiveAssessmentEngine
vi.mock('../../AdaptiveAssessmentEngine', () => ({
  AdaptiveAssessmentEngine: class {
    assessmentId: string;
    constructor(assessmentId: string) {
      this.assessmentId = assessmentId;
    }
    async getNextQuestion() {
      return {
        id: 'question-1',
        question_text: 'Test question',
        options: [],
        difficulty: 0.5,
        discrimination: 1.0,
      };
    }
    async processAnswer() {
      return {
        isCorrect: true,
        pointsEarned: 10,
        newAbility: 0.5,
        newStandardError: 0.8,
        feedback: 'Correct!',
      };
    }
  },
}));

describe('AdaptiveQuizEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize quiz state with default values', () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');
      const state = engine.getQuizState();

      expect(state.quiz_id).toBe('quiz-1');
      expect(state.questionsAnswered).toBe(0);
      expect(state.hints_used_count).toBe(0);
      expect(state.points_earned).toBe(0);
      expect(state.current_streak).toBe(0);
      expect(state.best_streak).toBe(0);
      expect(state.performance_metrics.accuracy).toBe(0);
    });
  });

  describe('getNextQuizQuestion', () => {
    it('should fetch quiz question with enhancements', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      const mockEnhancements = {
        hints: [{ level: 1, hint_text: 'Think about the basics' }],
        time_limit: 120,
        explanation: 'Detailed explanation here',
        learning_resources: [{ title: 'Resource 1', url: 'http://example.com', type: 'article' }],
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockEnhancements,
              error: null,
            }),
          }),
        }),
      });

      const question = await engine.getNextQuizQuestion();

      expect(question).toBeDefined();
      expect(question?.hints).toHaveLength(1);
      expect(question?.time_limit).toBe(120);
      expect(question?.explanation).toBe('Detailed explanation here');
      expect(question?.learning_resources).toHaveLength(1);
    });

    it('should handle missing enhancements gracefully', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found
            }),
          }),
        }),
      });

      const question = await engine.getNextQuizQuestion();

      expect(question).toBeDefined();
      expect(question?.hints).toEqual([]);
      expect(question?.time_limit).toBeUndefined();
      expect(question?.learning_resources).toEqual([]);
    });

    it('should return null when no more questions available', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      // Mock getNextQuestion to return null
      vi.spyOn(engine as any, 'getNextQuestion').mockResolvedValue(null);

      const question = await engine.getNextQuizQuestion();

      expect(question).toBeNull();
    });

    it('should log warning on non-PGRST116 database errors but continue', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');
      const mockError = { code: 'OTHER_ERROR', message: 'Database error' };

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

      // Should not throw, just log warning and return question without enhancements
      const question = await engine.getNextQuizQuestion();
      expect(question).toBeDefined();
      expect(question?.hints).toEqual([]);
    });
  });

  describe('processQuizAnswer', () => {
    it('should process correct answer with bonuses', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch enhancements
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    explanation: 'Great work!',
                    learning_resources: [],
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Save answer
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      });

      const result = await engine.processQuizAnswer('question-1', ['option-1'], 30, 0);

      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBeGreaterThan(0);
      expect(result.hint_penalty).toBe(0);
      expect(result.time_bonus).toBeGreaterThan(0); // Fast answer
      expect(result.explanation).toBe('Great work!');
    });

    it('should apply hint penalty when hints used', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      const result = await engine.processQuizAnswer('question-1', ['option-1'], 60, 2);

      expect(result.hint_penalty).toBe(20); // 2 hints * 10 points each
    });

    it('should apply time bonus for fast answers', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      const resultFast = await engine.processQuizAnswer('question-1', ['option-1'], 30, 0);
      expect(resultFast.time_bonus).toBe(10); // Very fast

      const resultModerate = await engine.processQuizAnswer('question-2', ['option-1'], 70, 0);
      expect(resultModerate.time_bonus).toBe(5); // Moderate speed

      const resultSlow = await engine.processQuizAnswer('question-3', ['option-1'], 100, 0);
      expect(resultSlow.time_bonus).toBe(0); // Slow
    });

    it('should apply streak bonus every 3 questions', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      // First correct answer - no streak bonus
      const result1 = await engine.processQuizAnswer('q1', ['opt1'], 60, 0);
      expect(result1.streak_bonus).toBe(0);

      // Second correct answer - no streak bonus
      const result2 = await engine.processQuizAnswer('q2', ['opt1'], 60, 0);
      expect(result2.streak_bonus).toBe(0);

      // Third correct answer - streak bonus!
      const result3 = await engine.processQuizAnswer('q3', ['opt1'], 60, 0);
      expect(result3.streak_bonus).toBe(5);
    });

    it('should reset streak on incorrect answer', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      // Mock processAnswer to return incorrect
      vi.spyOn(engine as any, 'processAnswer').mockResolvedValue({
        isCorrect: false,
        pointsEarned: 0,
        newAbility: 0.3,
        newStandardError: 0.9,
        feedback: 'Incorrect',
      });

      await engine.processQuizAnswer('q1', ['wrong'], 60, 0);

      const state = engine.getQuizState();
      expect(state.current_streak).toBe(0);
    });

    it('should update performance metrics', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      await engine.processQuizAnswer('q1', ['opt1'], 45, 0);

      const state = engine.getQuizState();
      expect(state.performance_metrics.difficulty_progression).toHaveLength(1);
      expect(state.performance_metrics.ability_trajectory).toHaveLength(1);
      expect(state.performance_metrics.accuracy).toBe(100); // 1/1 correct
    });

    it('should throw error on processing failure', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');
      const mockError = new Error('Processing failed');

      vi.spyOn(engine as any, 'processAnswer').mockRejectedValue(mockError);

      await expect(engine.processQuizAnswer('q1', ['opt1'], 60, 0)).rejects.toThrow(
        'Processing failed'
      );
    });
  });

  describe('getQuizState', () => {
    it('should return current quiz state', () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');
      const state = engine.getQuizState();

      expect(state).toHaveProperty('quiz_id');
      expect(state).toHaveProperty('questionsAnswered');
      expect(state).toHaveProperty('hints_used_count');
      expect(state).toHaveProperty('points_earned');
      expect(state).toHaveProperty('performance_metrics');
    });

    it('should return a copy of state, not the original', () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');
      const state1 = engine.getQuizState();
      const state2 = engine.getQuizState();

      expect(state1).not.toBe(state2); // Different objects
      expect(state1).toEqual(state2); // But same values
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return performance summary', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      // Answer a question to populate metrics
      await engine.processQuizAnswer('q1', ['opt1'], 45, 0);

      const summary = engine.getPerformanceSummary();

      expect(summary).toHaveProperty('score_percentage');
      expect(summary).toHaveProperty('questions_answered');
      expect(summary).toHaveProperty('accuracy');
      expect(summary).toHaveProperty('total_time');
      expect(summary).toHaveProperty('average_time');
      expect(summary).toHaveProperty('final_ability');
      expect(summary).toHaveProperty('confidence');
      expect(summary).toHaveProperty('best_streak');
      expect(summary).toHaveProperty('hints_used');
      expect(summary).toHaveProperty('difficulty_chart');
      expect(summary).toHaveProperty('ability_chart');
    });

    it('should calculate score percentage correctly', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      await engine.processQuizAnswer('q1', ['opt1'], 45, 0);

      const summary = engine.getPerformanceSummary();
      expect(summary.score_percentage).toBeGreaterThan(0);
      expect(summary.score_percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('recommendDifficultyAdjustment', () => {
    it('should recommend increase for high performers', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      // Mock high ability and accuracy
      vi.spyOn(engine as any, 'processAnswer').mockResolvedValue({
        isCorrect: true,
        pointsEarned: 10,
        newAbility: 1.5, // High ability
        newStandardError: 0.5,
        feedback: 'Correct!',
      });

      // Answer multiple questions correctly
      for (let i = 0; i < 10; i++) {
        await engine.processQuizAnswer(`q${i}`, ['opt1'], 30, 0);
      }

      // Manually set high ability since parent class is mocked
      (engine as any).quizState.currentAbility = 1.5;

      const recommendation = engine.recommendDifficultyAdjustment();

      expect(recommendation.current_level).toBe('Expert');
      expect(recommendation.recommended_level).toContain('challenging');
      expect(recommendation.reasoning).toContain('accuracy');
    });

    it('should recommend reduction for struggling learners', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      // Mock low ability and mostly incorrect answers
      vi.spyOn(engine as any, 'processAnswer').mockResolvedValue({
        isCorrect: false,
        pointsEarned: 0,
        newAbility: -1.5, // Low ability
        newStandardError: 0.9,
        feedback: 'Incorrect',
      });

      // Answer multiple questions incorrectly
      for (let i = 0; i < 10; i++) {
        await engine.processQuizAnswer(`q${i}`, ['wrong'], 60, 0);
      }

      // Manually set low ability since parent class is mocked
      (engine as any).quizState.currentAbility = -1.5;

      const recommendation = engine.recommendDifficultyAdjustment();

      expect(recommendation.current_level).toBe('Beginner');
      expect(recommendation.recommended_level).toContain('foundational');
      expect(recommendation.reasoning).toContain('basics');
    });

    it('should recommend maintaining level for appropriate performance', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      // Mock moderate ability
      vi.spyOn(engine as any, 'processAnswer').mockResolvedValue({
        isCorrect: true,
        pointsEarned: 10,
        newAbility: 0.2, // Moderate ability
        newStandardError: 0.7,
        feedback: 'Correct!',
      });

      // Answer 6/10 correctly (60% accuracy)
      for (let i = 0; i < 6; i++) {
        await engine.processQuizAnswer(`q${i}`, ['opt1'], 60, 0);
      }

      const recommendation = engine.recommendDifficultyAdjustment();

      expect(recommendation.recommended_level).toContain('Maintain');
      expect(recommendation.reasoning).toContain('appropriate');
    });
  });

  describe('saveQuizSession', () => {
    it('should save quiz session to database', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      await engine.saveQuizSession('user-1');

      expect(supabase.from).toHaveBeenCalledWith('quiz_sessions');
    });

    it('should include performance data in session', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');

      let insertData: any;
      const mockInsert = vi.fn(data => {
        insertData = data;
        return Promise.resolve({ data: null, error: null });
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      await engine.saveQuizSession('user-1');

      expect(insertData).toHaveProperty('quiz_id');
      expect(insertData).toHaveProperty('user_id');
      expect(insertData).toHaveProperty('performance_data');
      expect(insertData.performance_data).toHaveProperty('summary');
      expect(insertData.performance_data).toHaveProperty('metrics');
      expect(insertData.performance_data).toHaveProperty('difficulty_adjustment');
    });

    it('should throw error on save failure', async () => {
      const engine = new AdaptiveQuizEngine('quiz-1', 'user-1');
      const mockError = new Error('Save failed');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });

      await expect(engine.saveQuizSession('user-1')).rejects.toThrow('Save failed');
    });
  });
});
