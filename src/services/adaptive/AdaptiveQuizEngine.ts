/**
 * Adaptive Quiz Engine
 * Extends AdaptiveAssessmentEngine with quiz-specific adaptive features
 * Provides dynamic difficulty adjustment, hints, and real-time performance tracking
 */

import {
  AdaptiveAssessmentEngine,
  AdaptiveQuestion,
  AnswerResult,
  AssessmentState,
} from '../AdaptiveAssessmentEngine';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface QuizHint {
  level: 1 | 2 | 3; // Progressive hint levels
  hint_text: string;
  cost_points?: number; // Points deducted for using hint
  unlocked_at?: number; // Time in seconds when hint becomes available
}

export interface QuizQuestion extends AdaptiveQuestion {
  hints?: QuizHint[];
  time_limit?: number; // Seconds
  explanation?: string; // Post-answer explanation
  learning_resources?: {
    title: string;
    url: string;
    type: 'article' | 'video' | 'exercise';
  }[];
}

export interface QuizPerformanceMetrics {
  accuracy: number; // Percentage
  average_time_per_question: number; // Seconds
  hints_used: number;
  total_points: number;
  max_possible_points: number;
  difficulty_progression: {
    question_number: number;
    difficulty: number;
    was_correct: boolean;
  }[];
  ability_trajectory: {
    question_number: number;
    ability_estimate: number;
    standard_error: number;
  }[];
}

export interface AdaptiveQuizState extends AssessmentState {
  quiz_id: string;
  total_time_elapsed: number; // Seconds
  hints_used_count: number;
  points_earned: number;
  max_points_possible: number;
  performance_metrics: QuizPerformanceMetrics;
  current_streak: number; // Consecutive correct answers
  best_streak: number;
}

export interface QuizAnswerResult extends AnswerResult {
  hint_penalty?: number;
  time_bonus?: number;
  streak_bonus?: number;
  explanation?: string;
  learning_resources?: QuizQuestion['learning_resources'];
}

export class AdaptiveQuizEngine extends AdaptiveAssessmentEngine {
  private quizState: AdaptiveQuizState;
  private startTime: number;

  constructor(quizId: string, _userId: string) {
    super(quizId);
    this.startTime = Date.now();

    this.quizState = {
      assessmentId: quizId,
      quiz_id: quizId,
      currentAbility: 0,
      standardError: 1.0,
      questionsAnswered: 0,
      answeredQuestionIds: [],
      shouldContinue: true,
      confidenceLevel: 0,
      total_time_elapsed: 0,
      hints_used_count: 0,
      points_earned: 0,
      max_points_possible: 0,
      current_streak: 0,
      best_streak: 0,
      performance_metrics: {
        accuracy: 0,
        average_time_per_question: 0,
        hints_used: 0,
        total_points: 0,
        max_possible_points: 0,
        difficulty_progression: [],
        ability_trajectory: [],
      },
    };
  }

  /**
   * Get next adaptive question based on current ability and quiz state
   */
  async getNextQuizQuestion(): Promise<QuizQuestion | null> {
    try {
      // Get next question using parent's adaptive algorithm
      const baseQuestion = await this.getNextQuestion();

      if (!baseQuestion) {
        return null;
      }

      // Fetch quiz-specific enhancements (hints, explanations)
      const { data: quizEnhancements, error } = await supabase
        .from('quiz_question_enhancements')
        .select('*')
        .eq('question_id', baseQuestion.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.warn('Failed to fetch quiz enhancements:', error);
      }

      // Merge base question with quiz enhancements
      const quizQuestion: QuizQuestion = {
        ...baseQuestion,
        hints: quizEnhancements?.hints || [],
        time_limit: quizEnhancements?.time_limit,
        explanation: quizEnhancements?.explanation,
        learning_resources: quizEnhancements?.learning_resources || [],
      };

      return quizQuestion;
    } catch (error) {
      logger.error('Error getting next quiz question:', error);
      throw error;
    }
  }

  /**
   * Process quiz answer with enhanced feedback
   */
  async processQuizAnswer(
    questionId: string,
    selectedOptions: string[],
    timeSpent: number,
    hintsUsed: number = 0
  ): Promise<QuizAnswerResult> {
    try {
      // Process answer using parent's IRT algorithm
      const baseResult = await this.processAnswer(questionId, selectedOptions);

      // Calculate quiz-specific bonuses and penalties
      const hintPenalty = this.calculateHintPenalty(hintsUsed);
      const timeBonus = this.calculateTimeBonus(questionId, timeSpent);
      const streakBonus = this.calculateStreakBonus(baseResult.isCorrect);

      // Update quiz state
      this.quizState.hints_used_count += hintsUsed;
      this.quizState.total_time_elapsed += timeSpent;
      this.quizState.questionsAnswered++;

      if (baseResult.isCorrect) {
        this.quizState.current_streak++;
        this.quizState.best_streak = Math.max(
          this.quizState.best_streak,
          this.quizState.current_streak
        );
      } else {
        this.quizState.current_streak = 0;
      }

      // Calculate final points
      const finalPoints = Math.max(
        0,
        baseResult.pointsEarned - hintPenalty + timeBonus + streakBonus
      );

      this.quizState.points_earned += finalPoints;
      this.quizState.max_points_possible += baseResult.pointsEarned + timeBonus + streakBonus;

      // Update performance metrics
      this.updatePerformanceMetrics(questionId, baseResult, timeSpent);

      // Fetch question for explanation and resources
      const { data: question } = await supabase
        .from('quiz_question_enhancements')
        .select('explanation, learning_resources')
        .eq('question_id', questionId)
        .single();

      const quizResult: QuizAnswerResult = {
        ...baseResult,
        pointsEarned: finalPoints,
        hint_penalty: hintPenalty,
        time_bonus: timeBonus,
        streak_bonus: streakBonus,
        explanation: question?.explanation,
        learning_resources: question?.learning_resources,
      };

      // Save answer to database
      await this.saveQuizAnswer(questionId, selectedOptions, quizResult, timeSpent, hintsUsed);

      return quizResult;
    } catch (error) {
      logger.error('Error processing quiz answer:', error);
      throw error;
    }
  }

  /**
   * Calculate penalty for using hints
   */
  private calculateHintPenalty(hintsUsed: number): number {
    // Each hint reduces points by 10%, max 30%
    return hintsUsed * 10;
  }

  /**
   * Calculate time bonus for quick correct answers
   */
  private calculateTimeBonus(questionId: string, timeSpent: number): number {
    // TODO: Fetch question time_limit from database
    const timeLimit = 120; // Default 2 minutes

    // Bonus points for answering quickly (up to 20% of time remaining)
    if (timeSpent < timeLimit * 0.5) {
      return 10; // Fast answer bonus
    } else if (timeSpent < timeLimit * 0.75) {
      return 5; // Moderate speed bonus
    }

    return 0;
  }

  /**
   * Calculate streak bonus for consecutive correct answers
   */
  private calculateStreakBonus(isCorrect: boolean): number {
    if (!isCorrect) return 0;

    // Bonus points for streaks: 5 points per 3-question streak
    if ((this.quizState.current_streak + 1) % 3 === 0) {
      return 5;
    }

    return 0;
  }

  /**
   * Update performance tracking metrics
   */
  private updatePerformanceMetrics(
    questionId: string,
    result: AnswerResult,
    _timeSpent: number
  ): void {
    const metrics = this.quizState.performance_metrics;

    // Update difficulty progression
    metrics.difficulty_progression.push({
      question_number: this.quizState.questionsAnswered,
      difficulty: this.quizState.currentAbility,
      was_correct: result.isCorrect,
    });

    // Update ability trajectory
    metrics.ability_trajectory.push({
      question_number: this.quizState.questionsAnswered,
      ability_estimate: result.newAbility,
      standard_error: result.newStandardError,
    });

    // Recalculate aggregate metrics
    const correctAnswers = metrics.difficulty_progression.filter(d => d.was_correct).length;
    metrics.accuracy = (correctAnswers / this.quizState.questionsAnswered) * 100;
    metrics.average_time_per_question =
      this.quizState.total_time_elapsed / this.quizState.questionsAnswered;
    metrics.hints_used = this.quizState.hints_used_count;
    metrics.total_points = this.quizState.points_earned;
    metrics.max_possible_points = this.quizState.max_points_possible;
  }

  /**
   * Save quiz answer to database
   */
  private async saveQuizAnswer(
    questionId: string,
    selectedOptions: string[],
    result: QuizAnswerResult,
    timeSpent: number,
    hintsUsed: number
  ): Promise<void> {
    try {
      const { error } = await supabase.from('quiz_answers').insert({
        quiz_id: this.quizState.quiz_id,
        question_id: questionId,
        selected_options: selectedOptions,
        is_correct: result.isCorrect,
        points_earned: result.pointsEarned,
        hint_penalty: result.hint_penalty || 0,
        time_bonus: result.time_bonus || 0,
        streak_bonus: result.streak_bonus || 0,
        time_spent: timeSpent,
        hints_used: hintsUsed,
        ability_estimate: result.newAbility,
        standard_error: result.newStandardError,
        created_at: new Date().toISOString(),
      });

      if (error) {
        logger.error('Failed to save quiz answer:', error);
      }
    } catch (error) {
      logger.error('Error saving quiz answer:', error);
    }
  }

  /**
   * Get current quiz state and performance
   */
  getQuizState(): AdaptiveQuizState {
    return { ...this.quizState };
  }

  /**
   * Get performance summary for completion
   */
  getPerformanceSummary() {
    const metrics = this.quizState.performance_metrics;
    const totalTime = this.quizState.total_time_elapsed;

    return {
      score_percentage: (this.quizState.points_earned / this.quizState.max_points_possible) * 100,
      questions_answered: this.quizState.questionsAnswered,
      accuracy: metrics.accuracy,
      total_time: totalTime,
      average_time: metrics.average_time_per_question,
      final_ability: this.quizState.currentAbility,
      confidence: this.quizState.confidenceLevel,
      best_streak: this.quizState.best_streak,
      hints_used: this.quizState.hints_used_count,
      points_earned: this.quizState.points_earned,
      max_points: this.quizState.max_points_possible,
      difficulty_chart: metrics.difficulty_progression,
      ability_chart: metrics.ability_trajectory,
    };
  }

  /**
   * Recommend difficulty adjustment based on performance
   */
  recommendDifficultyAdjustment(): {
    current_level: string;
    recommended_level: string;
    reasoning: string;
  } {
    const ability = this.quizState.currentAbility;
    const accuracy = this.quizState.performance_metrics.accuracy;

    let currentLevel: string;
    let recommendedLevel: string;
    let reasoning: string;

    // Determine current level based on ability
    if (ability < -1) {
      currentLevel = 'Beginner';
    } else if (ability < 0) {
      currentLevel = 'Intermediate';
    } else if (ability < 1) {
      currentLevel = 'Advanced';
    } else {
      currentLevel = 'Expert';
    }

    // Recommend adjustment based on accuracy and ability
    if (accuracy >= 85 && ability > 0.5) {
      recommendedLevel = 'Increase to more challenging content';
      reasoning = `High accuracy (${accuracy.toFixed(1)}%) and strong ability estimate (${ability.toFixed(2)}) indicate readiness for harder material.`;
    } else if (accuracy <= 50 && ability < -0.5) {
      recommendedLevel = 'Reduce to foundational content';
      reasoning = `Low accuracy (${accuracy.toFixed(1)}%) and lower ability estimate (${ability.toFixed(2)}) suggest need for review of basics.`;
    } else if (accuracy >= 70 && accuracy < 85) {
      recommendedLevel = 'Maintain current level with slight increase';
      reasoning = `Good performance (${accuracy.toFixed(1)}%) suggests readiness for gradual progression.`;
    } else {
      recommendedLevel = 'Maintain current level';
      reasoning = `Performance is appropriate for current difficulty level.`;
    }

    return {
      current_level: currentLevel,
      recommended_level: recommendedLevel,
      reasoning,
    };
  }

  /**
   * Save quiz session to database
   */
  async saveQuizSession(userId: string): Promise<void> {
    try {
      const summary = this.getPerformanceSummary();
      const adjustment = this.recommendDifficultyAdjustment();

      const { error } = await supabase.from('quiz_sessions').insert({
        quiz_id: this.quizState.quiz_id,
        user_id: userId,
        questions_answered: this.quizState.questionsAnswered,
        points_earned: this.quizState.points_earned,
        max_points_possible: this.quizState.max_points_possible,
        accuracy: summary.accuracy,
        total_time: summary.total_time,
        final_ability_estimate: summary.final_ability,
        confidence_level: summary.confidence,
        best_streak: this.quizState.best_streak,
        hints_used: this.quizState.hints_used_count,
        performance_data: {
          summary,
          metrics: this.quizState.performance_metrics,
          difficulty_adjustment: adjustment,
        },
        completed_at: new Date().toISOString(),
      });

      if (error) {
        logger.error('Failed to save quiz session:', error);
        throw error;
      }

      logger.info('Quiz session saved successfully', {
        quiz_id: this.quizState.quiz_id,
        user_id: userId,
        accuracy: summary.accuracy,
      });
    } catch (error) {
      logger.error('Error saving quiz session:', error);
      throw error;
    }
  }
}
