/**
 * Quiz Attempt Service
 * Handles quiz taking, scoring, and completion
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  QuizAttempt,
  QuizResponse,
  StartQuizInput,
  SubmitQuizAnswerInput,
  CompleteQuizResult,
  QuizAttemptWithDetails,
  StudentQuizPerformance,
} from './types';

export class QuizAttemptService {
  /**
   * Start a new quiz attempt
   */
  static async startQuiz(input: StartQuizInput): Promise<QuizAttempt> {
    try {
      const { quiz_bank_id, user_id } = input;

      // Check if user has reached max attempts
      const { data: quizBank, error: quizError } = await supabase
        .from('quiz_banks')
        .select('max_attempts')
        .eq('id', quiz_bank_id)
        .single();

      if (quizError) throw quizError;

      if (quizBank.max_attempts) {
        const { data: previousAttempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('id')
          .eq('quiz_bank_id', quiz_bank_id)
          .eq('user_id', user_id)
          .eq('status', 'completed');

        if (attemptsError) throw attemptsError;

        if (previousAttempts && previousAttempts.length >= quizBank.max_attempts) {
          throw new Error(`Maximum attempts (${quizBank.max_attempts}) reached for this quiz`);
        }
      }

      // Get current attempt number
      const { data: allAttempts, error: countError } = await supabase
        .from('quiz_attempts')
        .select('attempt_number')
        .eq('quiz_bank_id', quiz_bank_id)
        .eq('user_id', user_id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const attemptNumber =
        allAttempts && allAttempts.length > 0 ? allAttempts[0].attempt_number + 1 : 1;

      // Create new attempt
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_bank_id,
          user_id,
          attempt_number: attemptNumber,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Quiz attempt started', {
        attemptId: data.id,
        quizBankId: quiz_bank_id,
        userId: user_id,
        attemptNumber,
      });

      return data as QuizAttempt;
    } catch (error) {
      logger.error('Failed to start quiz', { error, input });
      throw error;
    }
  }

  /**
   * Submit an answer to a question
   */
  static async submitAnswer(input: SubmitQuizAnswerInput): Promise<QuizResponse> {
    try {
      const { attempt_id, question_id, selected_option_id, answer_text, time_spent_seconds } =
        input;

      // Check if answer already exists (update if so)
      const { data: existing } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('attempt_id', attempt_id)
        .eq('question_id', question_id)
        .single();

      let response: QuizResponse;

      if (existing) {
        // Update existing response
        const { data, error } = await supabase
          .from('quiz_responses')
          .update({
            selected_option_id,
            answer_text,
            time_spent_seconds,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        response = data as QuizResponse;
      } else {
        // Create new response
        const { data, error } = await supabase
          .from('quiz_responses')
          .insert({
            attempt_id,
            question_id,
            selected_option_id,
            answer_text,
            time_spent_seconds,
          })
          .select()
          .single();

        if (error) throw error;
        response = data as QuizResponse;
      }

      // Calculate correctness for multiple choice/true-false
      if (selected_option_id) {
        await this.checkAnswerCorrectness(response.id, question_id, selected_option_id);
      }

      logger.debug('Quiz answer submitted', {
        attemptId: attempt_id,
        questionId: question_id,
      });

      return response;
    } catch (error) {
      logger.error('Failed to submit answer', { error, input });
      throw error;
    }
  }

  /**
   * Check if a selected option is correct and update points
   */
  private static async checkAnswerCorrectness(
    responseId: string,
    questionId: string,
    selectedOptionId: string
  ): Promise<void> {
    try {
      // Get question points
      const { data: question, error: qError } = await supabase
        .from('quiz_questions')
        .select('points')
        .eq('id', questionId)
        .single();

      if (qError) throw qError;

      // Check if option is correct
      const { data: option, error: oError } = await supabase
        .from('quiz_options')
        .select('is_correct')
        .eq('id', selectedOptionId)
        .single();

      if (oError) throw oError;

      // Update response with correctness and points
      await supabase
        .from('quiz_responses')
        .update({
          is_correct: option.is_correct,
          points_earned: option.is_correct ? question.points : 0,
        })
        .eq('id', responseId);
    } catch (error) {
      logger.error('Failed to check answer correctness', { error, responseId });
      // Don't throw - this is a background operation
    }
  }

  /**
   * Complete a quiz attempt and calculate score
   */
  static async completeQuiz(attemptId: string): Promise<CompleteQuizResult> {
    try {
      // Get attempt details
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;

      if (attempt.status !== 'in_progress') {
        throw new Error('Quiz attempt is not in progress');
      }

      // Calculate time taken
      const startedAt = new Date(attempt.started_at);
      const now = new Date();
      const timeTakenSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

      // Use database function to calculate score
      const { error: calcError } = await supabase.rpc('calculate_quiz_score', {
        attempt_id_param: attemptId,
      });

      if (calcError) {
        logger.warn('calculate_quiz_score RPC failed, calculating manually', { error: calcError });
        // Fallback to manual calculation
        await this.calculateScoreManually(attemptId, timeTakenSeconds);
      } else {
        // Update time taken
        await supabase
          .from('quiz_attempts')
          .update({ time_taken_seconds: timeTakenSeconds })
          .eq('id', attemptId);
      }

      // Get updated attempt with scores
      const { data: completedAttempt, error: fetchError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (fetchError) throw fetchError;

      // Award gamification points
      const pointsAwarded = await this.awardGamificationPoints(completedAttempt as QuizAttempt);

      logger.info('Quiz completed', {
        attemptId,
        score: completedAttempt.score,
        percentage: completedAttempt.percentage,
        passed: completedAttempt.passed,
        pointsAwarded,
      });

      return {
        attempt_id: attemptId,
        score: completedAttempt.score || 0,
        total_points: completedAttempt.total_points || 0,
        percentage: completedAttempt.percentage || 0,
        passed: completedAttempt.passed || false,
        time_taken_seconds: completedAttempt.time_taken_seconds,
        points_awarded: pointsAwarded,
      };
    } catch (error) {
      logger.error('Failed to complete quiz', { error, attemptId });
      throw error;
    }
  }

  /**
   * Manually calculate quiz score (fallback if RPC not available)
   */
  private static async calculateScoreManually(
    attemptId: string,
    timeTakenSeconds: number
  ): Promise<void> {
    try {
      // Get quiz bank info
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .select('quiz_bank_id')
        .eq('id', attemptId)
        .single();

      if (!attempt) throw new Error('Attempt not found');

      // Get total possible points
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('points')
        .eq('quiz_bank_id', attempt.quiz_bank_id);

      const totalPoints = questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;

      // Get earned points
      const { data: responses } = await supabase
        .from('quiz_responses')
        .select('points_earned')
        .eq('attempt_id', attemptId);

      const score = responses?.reduce((sum, r) => sum + (r.points_earned || 0), 0) || 0;

      // Calculate percentage
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

      // Get pass percentage
      const { data: quizBank } = await supabase
        .from('quiz_banks')
        .select('pass_percentage')
        .eq('id', attempt.quiz_bank_id)
        .single();

      const passed = percentage >= (quizBank?.pass_percentage || 70);

      // Update attempt
      await supabase
        .from('quiz_attempts')
        .update({
          score,
          total_points: totalPoints,
          percentage: Math.round(percentage * 100) / 100,
          passed,
          completed_at: new Date().toISOString(),
          time_taken_seconds: timeTakenSeconds,
          status: 'completed',
        })
        .eq('id', attemptId);
    } catch (error) {
      logger.error('Failed to calculate score manually', { error, attemptId });
      throw error;
    }
  }

  /**
   * Award gamification points for quiz completion
   */
  private static async awardGamificationPoints(attempt: QuizAttempt): Promise<number> {
    try {
      // Base points calculation
      let points = 0;

      if (attempt.passed) {
        // Award points based on score
        points = Math.floor((attempt.percentage || 0) / 10); // 10 points per 10%

        // Bonus for perfect score
        if (attempt.percentage === 100) {
          points += 20;
        }

        // Bonus for first attempt
        if (attempt.attempt_number === 1) {
          points += 10;
        }
      } else {
        // Participation points even if failed
        points = 2;
      }

      // Record points in learning_activity_points table
      const { error } = await supabase.from('learning_activity_points').insert({
        user_id: attempt.user_id,
        activity_type: 'quiz',
        activity_id: attempt.id,
        points_earned: points,
        reason: attempt.passed
          ? `Quiz completed with ${attempt.percentage}% (Attempt ${attempt.attempt_number})`
          : 'Quiz participation',
      });

      if (error) throw error;

      return points;
    } catch (error) {
      logger.error('Failed to award gamification points', { error, attempt });
      return 0; // Don't fail the quiz completion if points award fails
    }
  }

  /**
   * Get a quiz attempt with details
   */
  static async getAttempt(attemptId: string): Promise<QuizAttemptWithDetails> {
    try {
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*, quiz_banks(*)')
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;

      const { data: responses, error: responsesError } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('attempt_id', attemptId);

      if (responsesError) throw responsesError;

      return {
        ...attempt,
        quiz_bank: attempt.quiz_banks,
        responses: responses || [],
      } as QuizAttemptWithDetails;
    } catch (error) {
      logger.error('Failed to get quiz attempt', { error, attemptId });
      throw error;
    }
  }

  /**
   * Get all attempts for a user on a specific quiz
   */
  static async getUserAttempts(userId: string, quizBankId: string): Promise<QuizAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_bank_id', quizBankId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as QuizAttempt[];
    } catch (error) {
      logger.error('Failed to get user attempts', { error, userId, quizBankId });
      throw error;
    }
  }

  /**
   * Get comprehensive student performance on a quiz
   */
  static async getStudentPerformance(
    userId: string,
    quizBankId: string
  ): Promise<StudentQuizPerformance> {
    try {
      const attempts = await this.getUserAttempts(userId, quizBankId);

      let bestAttempt: QuizAttempt | undefined;
      if (attempts.length > 0) {
        bestAttempt = attempts
          .filter(a => a.status === 'completed')
          .reduce((best, current) => ((current.score || 0) > (best?.score || 0) ? current : best));
      }

      const completedAttempts = attempts.filter(a => a.status === 'completed');
      const bestScore = bestAttempt?.score;
      const bestPercentage = bestAttempt?.percentage;
      const passed = bestAttempt?.passed || false;

      return {
        user_id: userId,
        quiz_bank_id: quizBankId,
        attempts,
        best_attempt: bestAttempt,
        progress: {
          quiz_bank_id: quizBankId,
          attempts_count: completedAttempts.length,
          best_score: bestScore,
          best_percentage: bestPercentage,
          passed,
          last_attempt_date: attempts[0]?.created_at,
        },
      };
    } catch (error) {
      logger.error('Failed to get student performance', { error, userId, quizBankId });
      throw error;
    }
  }

  /**
   * Abandon a quiz (mark as abandoned if not completed)
   */
  static async abandonQuiz(attemptId: string): Promise<void> {
    try {
      const { data: attempt, error: fetchError } = await supabase
        .from('quiz_attempts')
        .select('status')
        .eq('id', attemptId)
        .single();

      if (fetchError) throw fetchError;

      if (attempt.status === 'in_progress') {
        const { error } = await supabase
          .from('quiz_attempts')
          .update({ status: 'abandoned' })
          .eq('id', attemptId);

        if (error) throw error;

        logger.info('Quiz abandoned', { attemptId });
      }
    } catch (error) {
      logger.error('Failed to abandon quiz', { error, attemptId });
      throw error;
    }
  }

  /**
   * Handle quiz timeout (for timed quizzes)
   */
  static async handleTimeout(attemptId: string): Promise<void> {
    try {
      const { data: attempt, error: fetchError } = await supabase
        .from('quiz_attempts')
        .select('status')
        .eq('id', attemptId)
        .single();

      if (fetchError) throw fetchError;

      if (attempt.status === 'in_progress') {
        // Mark as timed out
        await supabase.from('quiz_attempts').update({ status: 'timed_out' }).eq('id', attemptId);

        // Calculate partial score
        await this.completeQuiz(attemptId);

        logger.info('Quiz timed out', { attemptId });
      }
    } catch (error) {
      logger.error('Failed to handle quiz timeout', { error, attemptId });
      throw error;
    }
  }

  /**
   * Get quiz attempt statistics for a specific question (for instructors)
   */
  static async getQuestionStatistics(questionId: string): Promise<{
    total_responses: number;
    correct_responses: number;
    accuracy_percentage: number;
    average_time_seconds?: number;
    option_distribution?: Record<string, number>;
  }> {
    try {
      const { data: responses, error } = await supabase
        .from('quiz_responses')
        .select('is_correct, time_spent_seconds, selected_option_id')
        .eq('question_id', questionId);

      if (error) throw error;

      if (!responses || responses.length === 0) {
        return {
          total_responses: 0,
          correct_responses: 0,
          accuracy_percentage: 0,
        };
      }

      const correctCount = responses.filter(r => r.is_correct).length;
      const accuracy = (correctCount / responses.length) * 100;

      const timeValues = responses
        .filter(r => r.time_spent_seconds)
        .map(r => r.time_spent_seconds!);
      const avgTime =
        timeValues.length > 0
          ? timeValues.reduce((sum, t) => sum + t, 0) / timeValues.length
          : undefined;

      // Option distribution (for MC questions)
      const optionDist: Record<string, number> = {};
      responses.forEach(r => {
        if (r.selected_option_id) {
          optionDist[r.selected_option_id] = (optionDist[r.selected_option_id] || 0) + 1;
        }
      });

      return {
        total_responses: responses.length,
        correct_responses: correctCount,
        accuracy_percentage: Math.round(accuracy * 100) / 100,
        average_time_seconds: avgTime ? Math.round(avgTime) : undefined,
        option_distribution: Object.keys(optionDist).length > 0 ? optionDist : undefined,
      };
    } catch (error) {
      logger.error('Failed to get question statistics', { error, questionId });
      throw error;
    }
  }
}
