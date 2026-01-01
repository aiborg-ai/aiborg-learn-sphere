/**
 * Quiz Service
 * Handles quiz bank and question management
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  QuizBank,
  QuizQuestion,
  CreateQuizBankInput,
  UpdateQuizBankInput,
  CreateQuizQuestionInput,
  UpdateQuizQuestionInput,
  QuizStatistics,
  QuizProgress,
} from './types';

export class QuizService {
  /**
   * Create a new quiz bank
   */
  static async createQuizBank(input: CreateQuizBankInput, userId: string): Promise<QuizBank> {
    try {
      const { data, error } = await supabase
        .from('quiz_banks')
        .insert({
          ...input,
          created_by: userId,
          difficulty_level: input.difficulty_level || 'intermediate',
          pass_percentage: input.pass_percentage || 70,
          shuffle_questions: input.shuffle_questions ?? true,
          shuffle_options: input.shuffle_options ?? true,
          show_correct_answers: input.show_correct_answers ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Quiz bank created', { quizBankId: data.id, courseId: input.course_id });
      return data as QuizBank;
    } catch (_error) {
      logger.error('Failed to create quiz bank', { _error: _error, input });
      throw _error;
    }
  }

  /**
   * Update an existing quiz bank
   */
  static async updateQuizBank(input: UpdateQuizBankInput): Promise<QuizBank> {
    try {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('quiz_banks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Quiz bank updated', { quizBankId: id });
      return data as QuizBank;
    } catch (_error) {
      logger.error('Failed to update quiz bank', { _error: _error, input });
      throw _error;
    }
  }

  /**
   * Delete a quiz bank (and all associated questions/options)
   */
  static async deleteQuizBank(quizBankId: string): Promise<void> {
    try {
      const { error } = await supabase.from('quiz_banks').delete().eq('id', quizBankId);

      if (error) throw error;

      logger.info('Quiz bank deleted', { quizBankId });
    } catch (_error) {
      logger.error('Failed to delete quiz bank', { _error: _error, quizBankId });
      throw _error;
    }
  }

  /**
   * Get quiz bank by ID with questions and options
   */
  static async getQuizBank(
    quizBankId: string,
    includeOptions = true
  ): Promise<QuizBank & { questions?: QuizQuestion[] }> {
    try {
      // Get quiz bank
      const { data: quizBank, error: quizError } = await supabase
        .from('quiz_banks')
        .select('*')
        .eq('id', quizBankId)
        .single();

      if (quizError) throw quizError;

      // Get questions
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_bank_id', quizBankId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      // Get options if needed
      let questionsWithOptions = questions as QuizQuestion[];
      if (includeOptions && questions && questions.length > 0) {
        const questionIds = questions.map(q => q.id);
        const { data: options, error: optionsError } = await supabase
          .from('quiz_options')
          .select('*')
          .in('question_id', questionIds)
          .order('order_index', { ascending: true });

        if (optionsError) throw optionsError;

        // Group options by question
        questionsWithOptions = questions.map(q => ({
          ...q,
          options: options?.filter(o => o.question_id === q.id) || [],
        }));
      }

      return {
        ...(quizBank as QuizBank),
        questions: questionsWithOptions,
      };
    } catch (_error) {
      logger.error('Failed to get quiz bank', { _error: _error, quizBankId });
      throw _error;
    }
  }

  /**
   * Get all quiz banks for a course
   */
  static async getQuizBanksByCourse(courseId: number, publishedOnly = false): Promise<QuizBank[]> {
    try {
      let query = supabase.from('quiz_banks').select('*').eq('course_id', courseId);

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data as QuizBank[];
    } catch (_error) {
      logger.error('Failed to get quiz banks by course', { _error: _error, courseId });
      throw _error;
    }
  }

  /**
   * Add a question to a quiz bank
   */
  static async createQuestion(input: CreateQuizQuestionInput): Promise<QuizQuestion> {
    try {
      const { options, ...questionData } = input;

      // Create question
      const { data: question, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          ...questionData,
          points: input.points || 1,
          order_index: input.order_index || 0,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Create options if provided
      if (options && options.length > 0) {
        const optionsToInsert = options.map((opt, index) => ({
          question_id: question.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          order_index: opt.order_index !== undefined ? opt.order_index : index,
        }));

        const { error: optionsError } = await supabase.from('quiz_options').insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      logger.info('Quiz question created', {
        questionId: question.id,
        quizBankId: input.quiz_bank_id,
      });
      return question as QuizQuestion;
    } catch (_error) {
      logger.error('Failed to create quiz question', { _error: _error, input });
      throw _error;
    }
  }

  /**
   * Update a quiz question
   */
  static async updateQuestion(input: UpdateQuizQuestionInput): Promise<QuizQuestion> {
    try {
      const { id, options, ...updates } = input;

      // Update question
      const { data, error } = await supabase
        .from('quiz_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Handle options update if provided
      if (options) {
        // Delete existing options
        await supabase.from('quiz_options').delete().eq('question_id', id);

        // Insert new options
        if (options.length > 0) {
          const optionsToInsert = options.map((opt, index) => ({
            question_id: id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            order_index: opt.order_index !== undefined ? opt.order_index : index,
          }));

          await supabase.from('quiz_options').insert(optionsToInsert);
        }
      }

      logger.info('Quiz question updated', { questionId: id });
      return data as QuizQuestion;
    } catch (_error) {
      logger.error('Failed to update quiz question', { _error: _error, input });
      throw _error;
    }
  }

  /**
   * Delete a quiz question
   */
  static async deleteQuestion(questionId: string): Promise<void> {
    try {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId);

      if (error) throw error;

      logger.info('Quiz question deleted', { questionId });
    } catch (_error) {
      logger.error('Failed to delete quiz question', { _error: _error, questionId });
      throw _error;
    }
  }

  /**
   * Reorder questions in a quiz bank
   */
  static async reorderQuestions(quizBankId: string, questionIds: string[]): Promise<void> {
    try {
      // Update order_index for each question
      const updates = questionIds.map((id, index) => ({
        id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('quiz_questions')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('quiz_bank_id', quizBankId);
      }

      logger.info('Quiz questions reordered', { quizBankId, count: questionIds.length });
    } catch (_error) {
      logger.error('Failed to reorder questions', { _error: _error, quizBankId });
      throw _error;
    }
  }

  /**
   * Get quiz statistics (for instructors/admins)
   */
  static async getQuizStatistics(quizBankId: string): Promise<QuizStatistics> {
    try {
      const { data, error } = await supabase.rpc('get_quiz_statistics', {
        p_quiz_bank_id: quizBankId,
      });

      if (error) throw error;

      return data as QuizStatistics;
    } catch (_error) {
      logger.error('Failed to get quiz statistics', { _error: _error, quizBankId });

      // Fallback: calculate manually if RPC not available
      return await this.calculateQuizStatistics(quizBankId);
    }
  }

  /**
   * Calculate quiz statistics manually (fallback)
   */
  private static async calculateQuizStatistics(quizBankId: string): Promise<QuizStatistics> {
    try {
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('user_id, score, total_points, percentage, passed, time_taken_seconds')
        .eq('quiz_bank_id', quizBankId)
        .eq('status', 'completed');

      if (error) throw error;

      if (!attempts || attempts.length === 0) {
        return {
          quiz_bank_id: quizBankId,
          total_attempts: 0,
          unique_students: 0,
          average_score: 0,
          average_percentage: 0,
          pass_rate: 0,
        };
      }

      const uniqueStudents = new Set(attempts.map(a => a.user_id)).size;
      const averageScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length;
      const averagePercentage =
        attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length;
      const passedCount = attempts.filter(a => a.passed).length;
      const passRate = (passedCount / attempts.length) * 100;

      const timeTakenValues = attempts
        .filter(a => a.time_taken_seconds)
        .map(a => a.time_taken_seconds!);
      const averageTime =
        timeTakenValues.length > 0
          ? timeTakenValues.reduce((sum, t) => sum + t, 0) / timeTakenValues.length
          : undefined;

      return {
        quiz_bank_id: quizBankId,
        total_attempts: attempts.length,
        unique_students: uniqueStudents,
        average_score: Math.round(averageScore * 100) / 100,
        average_percentage: Math.round(averagePercentage * 100) / 100,
        pass_rate: Math.round(passRate * 100) / 100,
        average_time_seconds: averageTime ? Math.round(averageTime) : undefined,
      };
    } catch (_error) {
      logger.error('Failed to calculate quiz statistics', { _error: _error, quizBankId });
      throw _error;
    }
  }

  /**
   * Get student progress on a quiz
   */
  static async getStudentProgress(userId: string, quizBankId: string): Promise<QuizProgress> {
    try {
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('score, percentage, passed, created_at')
        .eq('user_id', userId)
        .eq('quiz_bank_id', quizBankId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!attempts || attempts.length === 0) {
        return {
          quiz_bank_id: quizBankId,
          attempts_count: 0,
          passed: false,
        };
      }

      const bestAttempt = attempts.reduce((best, current) =>
        (current.score || 0) > (best.score || 0) ? current : best
      );

      return {
        quiz_bank_id: quizBankId,
        attempts_count: attempts.length,
        best_score: bestAttempt.score,
        best_percentage: bestAttempt.percentage,
        passed: bestAttempt.passed || false,
        last_attempt_date: attempts[0].created_at,
      };
    } catch (_error) {
      logger.error('Failed to get student progress', { _error: _error, userId, quizBankId });
      throw _error;
    }
  }

  /**
   * Publish or unpublish a quiz
   */
  static async togglePublish(quizBankId: string, isPublished: boolean): Promise<QuizBank> {
    try {
      const { data, error } = await supabase
        .from('quiz_banks')
        .update({ is_published: isPublished })
        .eq('id', quizBankId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Quiz bank publish status updated', { quizBankId, isPublished });
      return data as QuizBank;
    } catch (_error) {
      logger.error('Failed to toggle quiz publish status', { _error: _error, quizBankId });
      throw _error;
    }
  }

  /**
   * Duplicate a quiz bank (with all questions and options)
   */
  static async duplicateQuizBank(
    quizBankId: string,
    newTitle: string,
    userId: string
  ): Promise<QuizBank> {
    try {
      // Get original quiz with questions
      const original = await this.getQuizBank(quizBankId, true);

      // Create new quiz bank
      const { questions, ...quizBankData } = original;
      const newQuizBank = await this.createQuizBank(
        {
          ...quizBankData,
          title: newTitle,
          is_published: false, // Always start as unpublished
        },
        userId
      );

      // Duplicate questions and options
      if (questions && questions.length > 0) {
        for (const question of questions) {
          const { id, quiz_bank_id, created_at, updated_at, options, ...questionData } = question;

          await this.createQuestion({
            ...questionData,
            quiz_bank_id: newQuizBank.id,
            options: options?.map(({ id, question_id, created_at, ...optData }) => optData),
          });
        }
      }

      logger.info('Quiz bank duplicated', { originalId: quizBankId, newId: newQuizBank.id });
      return newQuizBank;
    } catch (_error) {
      logger.error('Failed to duplicate quiz bank', { _error: _error, quizBankId });
      throw _error;
    }
  }
}
