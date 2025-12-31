/**
 * Flashcard Generation Service
 *
 * Auto-generates flashcards from wrong answers with IRT-calibrated initial parameters.
 * Maps question difficulty to initial easiness factor for SM-2 algorithm.
 *
 * Key features:
 * - Generate flashcards from incorrect assessment answers
 * - Batch generation from quiz results
 * - IRT difficulty → Initial EF mapping
 * - Source tracking for analytics
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  FlashcardGenerationRequest,
  GeneratedFlashcard,
  BatchFlashcardResult,
  SM2CalibrationParams,
  DEFAULT_SM2_CALIBRATION,
} from './FeedbackLoopTypes';

interface AssessmentQuestion {
  id: string;
  question_text: string;
  correct_options: string[];
  options: { id: string; text: string }[];
  explanation?: string;
  difficulty: number;
  category?: string;
  topics?: string[];
}

export class FlashcardGenerationService {
  private sm2Params: SM2CalibrationParams;

  constructor(params: Partial<SM2CalibrationParams> = {}) {
    this.sm2Params = { ...DEFAULT_SM2_CALIBRATION, ...params };
  }

  /**
   * Generate a flashcard from an incorrect answer
   */
  async generateFromIncorrectAnswer(
    request: FlashcardGenerationRequest
  ): Promise<GeneratedFlashcard | null> {
    try {
      // Check if flashcard already exists for this question
      const existing = await this.checkExistingFlashcard(request.userId, request.questionId);
      if (existing) {
        logger.info('Flashcard already exists for question', {
          userId: request.userId,
          questionId: request.questionId,
        });
        return null;
      }

      // Calculate initial EF based on IRT difficulty and user ability
      const initialEF = this.calculateInitialEF(request.userAbility, request.questionDifficulty);

      // Create flashcard content
      const flashcard: GeneratedFlashcard = {
        front: this.createFrontContent(request),
        back: this.createBackContent(request),
        initialEF,
        irtDifficulty: request.questionDifficulty,
        sourceType: request.sourceType,
        sourceQuestionId: request.questionId,
        tags: this.generateTags(request),
        createdAt: new Date(),
      };

      // Save to database
      const savedFlashcard = await this.saveFlashcard(request.userId, flashcard);

      if (savedFlashcard) {
        // Track source
        await this.trackFlashcardSource(savedFlashcard.id!, flashcard);

        logger.info('Flashcard generated from incorrect answer', {
          userId: request.userId,
          flashcardId: savedFlashcard.id,
          initialEF,
        });

        return savedFlashcard;
      }

      return null;
    } catch (_error) {
      logger._error('Error generating flashcard:', _error);
      return null;
    }
  }

  /**
   * Generate flashcards from all wrong answers in an assessment/quiz
   */
  async generateFromQuizResults(
    userId: string,
    assessmentId: string
  ): Promise<BatchFlashcardResult> {
    const result: BatchFlashcardResult = {
      generated: 0,
      skipped: 0,
      errors: 0,
      flashcards: [],
      skipReasons: [],
    };

    try {
      // Get all wrong answers from the quiz
      const { data: wrongAnswers, error: answersError } = await supabase
        .from('quiz_answers')
        .select('question_id, selected_options, ability_estimate')
        .eq('quiz_id', assessmentId)
        .eq('is_correct', false);

      if (answersError) {
        logger.error('Error fetching wrong answers:', answersError);
        return result;
      }

      if (!wrongAnswers || wrongAnswers.length === 0) {
        logger.info('No wrong answers to generate flashcards from', { assessmentId });
        return result;
      }

      // Get question details
      const questionIds = wrongAnswers.map(a => a.question_id);
      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select(
          'id, question_text, correct_options, options, explanation, difficulty, category, topics'
        )
        .in('id', questionIds);

      if (questionsError) {
        logger.error('Error fetching questions:', questionsError);
        return result;
      }

      // Create a map for quick lookup
      const questionMap = new Map(questions?.map(q => [q.id, q]) || []);

      // Generate flashcard for each wrong answer
      for (const answer of wrongAnswers) {
        const question = questionMap.get(answer.question_id) as AssessmentQuestion | undefined;

        if (!question) {
          result.skipReasons.push({
            questionId: answer.question_id,
            reason: 'Question not found',
          });
          result.skipped++;
          continue;
        }

        const request: FlashcardGenerationRequest = {
          userId,
          sourceType: 'assessment',
          questionId: answer.question_id,
          userAbility: answer.ability_estimate,
          questionDifficulty: question.difficulty,
          questionText: question.question_text,
          correctAnswer: this.getCorrectAnswerText(question),
          userAnswer: this.getUserAnswerText(question, answer.selected_options),
          explanation: question.explanation,
          topics: question.topics,
          category: question.category,
        };

        const flashcard = await this.generateFromIncorrectAnswer(request);

        if (flashcard) {
          result.generated++;
          result.flashcards.push(flashcard);
        } else {
          result.skipped++;
          result.skipReasons.push({
            questionId: answer.question_id,
            reason: 'Already exists or generation failed',
          });
        }
      }

      logger.info('Batch flashcard generation complete', {
        userId,
        assessmentId,
        generated: result.generated,
        skipped: result.skipped,
      });

      return result;
    } catch (_error) {
      logger._error('Error in batch flashcard generation:', _error);
      result.errors++;
      return result;
    }
  }

  /**
   * Calculate initial easiness factor based on IRT difficulty and user ability
   *
   * Logic:
   * - If user ability < question difficulty: question is hard for user → lower EF
   * - If user ability > question difficulty: question is easy for user → higher EF
   * - EF range: 1.3 (minimum) to 3.0 (maximum), default 2.5
   */
  private calculateInitialEF(userAbility: number, questionDifficulty: number): number {
    const gap = userAbility - questionDifficulty;

    // Base EF is 2.5, adjust based on ability-difficulty gap
    // Gap < 0 means question is harder than user's ability
    let ef = this.sm2Params.baseEF;

    if (gap < -1) {
      // Very hard question: lower EF significantly
      ef = 1.5;
    } else if (gap < -0.5) {
      // Hard question: lower EF moderately
      ef = 1.8;
    } else if (gap < 0) {
      // Slightly hard: lower EF slightly
      ef = 2.1;
    } else if (gap < 0.5) {
      // About right: default EF
      ef = 2.5;
    } else if (gap < 1) {
      // Slightly easy: raise EF slightly
      ef = 2.7;
    } else {
      // Easy: raise EF (but these shouldn't be generating flashcards often)
      ef = 2.9;
    }

    // Clamp to valid range
    return Math.max(this.sm2Params.minEF, Math.min(this.sm2Params.maxEF, ef));
  }

  /**
   * Create front content for flashcard
   */
  private createFrontContent(request: FlashcardGenerationRequest): string {
    // For assessment questions, use the question text directly
    return request.questionText;
  }

  /**
   * Create back content for flashcard
   */
  private createBackContent(request: FlashcardGenerationRequest): string {
    let back = `**Correct Answer:** ${request.correctAnswer}`;

    if (request.userAnswer && request.userAnswer !== request.correctAnswer) {
      back += `\n\n**Your Answer:** ${request.userAnswer}`;
    }

    if (request.explanation) {
      back += `\n\n**Explanation:** ${request.explanation}`;
    }

    return back;
  }

  /**
   * Generate tags for flashcard
   */
  private generateTags(request: FlashcardGenerationRequest): string[] {
    const tags: string[] = ['auto-generated', request.sourceType];

    if (request.category) {
      tags.push(request.category);
    }

    if (request.topics) {
      tags.push(...request.topics.slice(0, 3)); // Limit to 3 topics
    }

    // Add difficulty tag
    if (request.questionDifficulty < -1) {
      tags.push('easy');
    } else if (request.questionDifficulty < 0.5) {
      tags.push('medium');
    } else {
      tags.push('hard');
    }

    return tags;
  }

  /**
   * Check if flashcard already exists for question
   */
  private async checkExistingFlashcard(userId: string, questionId: string): Promise<boolean> {
    const { data } = await supabase
      .from('flashcard_sources')
      .select('id')
      .eq('question_id', questionId)
      .limit(1);

    if (data && data.length > 0) {
      // Verify the flashcard belongs to this user
      const { data: flashcard } = await supabase
        .from('flashcards')
        .select('user_id')
        .eq('id', data[0].id)
        .single();

      return flashcard?.user_id === userId;
    }

    return false;
  }

  /**
   * Save flashcard to database
   */
  private async saveFlashcard(
    userId: string,
    flashcard: GeneratedFlashcard
  ): Promise<GeneratedFlashcard | null> {
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        user_id: userId,
        front: flashcard.front,
        back: flashcard.back,
        easiness_factor: flashcard.initialEF,
        interval: 0,
        repetitions: 0,
        next_review_date: new Date().toISOString(),
        tags: flashcard.tags,
        created_at: flashcard.createdAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Error saving flashcard:', error);
      return null;
    }

    return {
      ...flashcard,
      id: data.id,
    };
  }

  /**
   * Track flashcard source for analytics
   */
  private async trackFlashcardSource(
    flashcardId: string,
    flashcard: GeneratedFlashcard
  ): Promise<void> {
    const { error } = await supabase.from('flashcard_sources').insert({
      flashcard_id: flashcardId,
      source_type: flashcard.sourceType,
      question_id: flashcard.sourceQuestionId,
      initial_ef: flashcard.initialEF,
      irt_difficulty: flashcard.irtDifficulty,
    });

    if (error) {
      logger.warn('Failed to track flashcard source:', error);
    }
  }

  /**
   * Get correct answer text from question
   */
  private getCorrectAnswerText(question: AssessmentQuestion): string {
    const correctIds = question.correct_options || [];
    const correctOptions = question.options.filter(o => correctIds.includes(o.id));
    return correctOptions.map(o => o.text).join(', ');
  }

  /**
   * Get user's answer text from question
   */
  private getUserAnswerText(question: AssessmentQuestion, selectedOptions: string[]): string {
    const selectedOpts = question.options.filter(o => selectedOptions.includes(o.id));
    return selectedOpts.map(o => o.text).join(', ');
  }

  /**
   * Get flashcards generated from assessments for a user
   */
  async getGeneratedFlashcards(
    userId: string,
    sourceType?: FlashcardGenerationRequest['sourceType']
  ): Promise<GeneratedFlashcard[]> {
    const query = supabase
      .from('flashcards')
      .select(
        `
        id,
        front,
        back,
        easiness_factor,
        tags,
        created_at,
        flashcard_sources (
          source_type,
          question_id,
          initial_ef,
          irt_difficulty
        )
      `
      )
      .eq('user_id', userId)
      .not('flashcard_sources', 'is', null);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching generated flashcards:', error);
      return [];
    }

    return (data || [])
      .filter(f => {
        if (!sourceType) return true;
        const sources = f.flashcard_sources as Array<{
          source_type: string;
          question_id: string;
          initial_ef: number;
          irt_difficulty: number;
        }> | null;
        const source = sources?.[0];
        return source?.source_type === sourceType;
      })
      .map(f => {
        const sources = f.flashcard_sources as Array<{
          source_type: string;
          question_id: string;
          initial_ef: number;
          irt_difficulty: number;
        }> | null;
        const source = sources?.[0];
        return {
          id: f.id,
          front: f.front,
          back: f.back,
          initialEF: source?.initial_ef || f.easiness_factor,
          irtDifficulty: source?.irt_difficulty || 0,
          sourceType: source?.source_type || 'manual',
          sourceQuestionId: source?.question_id || '',
          tags: f.tags || [],
          createdAt: new Date(f.created_at),
        };
      });
  }

  /**
   * Get statistics about auto-generated flashcards
   */
  async getGenerationStats(userId: string) {
    const { data, error } = await supabase
      .from('flashcard_sources')
      .select(
        `
        source_type,
        initial_ef,
        irt_difficulty,
        flashcards!inner (
          user_id,
          easiness_factor,
          interval,
          repetitions
        )
      `
      )
      .eq('flashcards.user_id', userId);

    if (error) {
      logger.error('Error fetching generation stats:', error);
      return null;
    }

    const stats = {
      total: data?.length || 0,
      bySource: {} as Record<string, number>,
      averageInitialEF: 0,
      averageIRTDifficulty: 0,
      averageCurrentEF: 0,
      averageRepetitions: 0,
    };

    if (data && data.length > 0) {
      let totalInitialEF = 0;
      let totalDifficulty = 0;
      let totalCurrentEF = 0;
      let totalReps = 0;

      for (const item of data) {
        // Count by source
        const source = item.source_type;
        stats.bySource[source] = (stats.bySource[source] || 0) + 1;

        // Sum for averages
        totalInitialEF += item.initial_ef;
        totalDifficulty += item.irt_difficulty;
        const flashcards = item.flashcards as { easiness_factor: number; repetitions: number };
        totalCurrentEF += flashcards.easiness_factor;
        totalReps += flashcards.repetitions;
      }

      stats.averageInitialEF = totalInitialEF / data.length;
      stats.averageIRTDifficulty = totalDifficulty / data.length;
      stats.averageCurrentEF = totalCurrentEF / data.length;
      stats.averageRepetitions = totalReps / data.length;
    }

    return stats;
  }
}

// Singleton instance
export const flashcardGenerationService = new FlashcardGenerationService();
