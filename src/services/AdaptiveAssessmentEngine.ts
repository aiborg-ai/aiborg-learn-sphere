/**
 * Adaptive Assessment Engine
 * Implements intelligent question selection and ability estimation
 * using Item Response Theory (IRT) and adaptive testing algorithms
 */

import { supabase } from '@/integrations/supabase/client';
import {
  ADAPTIVE_CONFIG,
  shouldStopAssessment,
  getAugmentationLevel,
} from '@/config/adaptiveAssessment';
import { logger } from '@/utils/logger';

/**
 * Question interface matching database structure
 */
export interface AdaptiveQuestion {
  id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'scale' | 'frequency';
  difficulty_level: 'foundational' | 'applied' | 'advanced' | 'strategic';
  irt_difficulty: number;
  category_id: string;
  category_name: string;
  help_text?: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  option_text: string;
  option_value: string;
  points: number;
  description?: string;
  is_correct: boolean;
  order_index: number;
}

export interface AssessmentState {
  assessmentId: string;
  currentAbility: number;
  standardError: number;
  questionsAnswered: number;
  answeredQuestionIds: string[];
  shouldContinue: boolean;
  confidenceLevel: number; // 0-100%
}

export interface AnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  newAbility: number;
  newStandardError: number;
  correctOptions: string[];
}

/**
 * Adaptive Assessment Engine Class
 */
export class AdaptiveAssessmentEngine {
  private assessmentId: string;
  private state: AssessmentState;

  constructor(assessmentId: string) {
    this.assessmentId = assessmentId;
    this.state = {
      assessmentId,
      currentAbility: ADAPTIVE_CONFIG.INITIAL_ABILITY,
      standardError: ADAPTIVE_CONFIG.INITIAL_STANDARD_ERROR,
      questionsAnswered: 0,
      answeredQuestionIds: [],
      shouldContinue: true,
      confidenceLevel: 0,
    };
  }

  /**
   * Initialize or resume assessment state from database
   */
  async initializeState(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_ai_assessments')
        .select('current_ability_estimate, ability_standard_error, questions_answered_count')
        .eq('id', this.assessmentId)
        .single();

      if (error) throw error;

      if (data) {
        this.state.currentAbility =
          data.current_ability_estimate || ADAPTIVE_CONFIG.INITIAL_ABILITY;
        this.state.standardError =
          data.ability_standard_error || ADAPTIVE_CONFIG.INITIAL_STANDARD_ERROR;
        this.state.questionsAnswered = data.questions_answered_count || 0;

        // Get answered questions
        const { data: performanceData, error: perfError } = await supabase
          .from('assessment_answer_performance')
          .select('question_id')
          .eq('assessment_id', this.assessmentId);

        if (!perfError && performanceData) {
          this.state.answeredQuestionIds = performanceData.map(p => p.question_id);
        }

        // Update confidence and continuation status
        this.updateState();
      }
    } catch (error) {
      logger.error('Error initializing adaptive assessment state:', error);
      throw error;
    }
  }

  /**
   * Get the next optimal question based on current ability
   */
  async getNextQuestion(categoryId?: string): Promise<AdaptiveQuestion | null> {
    try {
      const { data, error } = await supabase.rpc('get_next_adaptive_question', {
        p_assessment_id: this.assessmentId,
        p_current_ability: this.state.currentAbility,
        p_answered_questions: this.state.answeredQuestionIds,
        p_category_id: categoryId || null,
      });

      if (error) {
        logger.error('Error fetching next adaptive question:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        logger.warn('No more questions available for adaptive assessment');
        return null;
      }

      const questionData = data[0];

      // Parse options from JSONB
      const options: QuestionOption[] = questionData.options || [];

      return {
        id: questionData.question_id,
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        difficulty_level: questionData.difficulty_level,
        irt_difficulty: questionData.irt_difficulty || 0,
        category_id: categoryId || '',
        category_name: questionData.category_name || '',
        options,
      };
    } catch (error) {
      logger.error('Error in getNextQuestion:', error);
      throw error;
    }
  }

  /**
   * Record an answer and update ability estimate
   */
  async recordAnswer(
    questionId: string,
    selectedOptionIds: string[],
    timeSpent?: number
  ): Promise<AnswerResult> {
    try {
      const { data, error } = await supabase.rpc('record_adaptive_answer', {
        p_assessment_id: this.assessmentId,
        p_question_id: questionId,
        p_selected_options: selectedOptionIds,
        p_time_spent: timeSpent || null,
      });

      if (error) {
        logger.error('Error recording adaptive answer:', error);
        throw error;
      }

      const result = data[0];

      // Update local state
      this.state.currentAbility = result.new_ability_estimate;
      this.state.standardError = result.new_standard_error;
      this.state.questionsAnswered += 1;
      this.state.answeredQuestionIds.push(questionId);

      this.updateState();

      // Get correct options for feedback
      const { data: optionsData } = await supabase
        .from('assessment_question_options')
        .select('id')
        .eq('question_id', questionId)
        .eq('is_correct', true);

      const correctOptions = optionsData?.map(opt => opt.id) || [];

      return {
        isCorrect: result.is_correct,
        pointsEarned: result.points_earned,
        newAbility: result.new_ability_estimate,
        newStandardError: result.new_standard_error,
        correctOptions,
      };
    } catch (error) {
      logger.error('Error in recordAnswer:', error);
      throw error;
    }
  }

  /**
   * Update internal state calculations
   */
  private updateState(): void {
    // Calculate confidence level (0-100%)
    const maxSE = ADAPTIVE_CONFIG.INITIAL_STANDARD_ERROR;
    this.state.confidenceLevel = Math.round(((maxSE - this.state.standardError) / maxSE) * 100);

    // Determine if assessment should continue
    this.state.shouldContinue = !shouldStopAssessment(
      this.state.questionsAnswered,
      this.state.standardError
    );
  }

  /**
   * Get current assessment state
   */
  getState(): AssessmentState {
    return { ...this.state };
  }

  /**
   * Get augmentation level based on current ability
   */
  getAugmentationLevel(): {
    level: string;
    label: string;
    percentage: number;
  } {
    return getAugmentationLevel(this.state.currentAbility);
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<{
    totalQuestions: number;
    correctAnswers: number;
    averageDifficulty: number;
    abilityProgression: Array<{ questionNumber: number; ability: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('assessment_answer_performance')
        .select('*')
        .eq('assessment_id', this.assessmentId)
        .order('answer_timestamp', { ascending: true });

      if (error) throw error;

      const correctAnswers = data?.filter(d => d.is_correct).length || 0;
      const totalQuestions = data?.length || 0;
      const averageDifficulty =
        data?.reduce((sum, d) => sum + (d.question_difficulty || 0), 0) / totalQuestions || 0;

      const abilityProgression =
        data?.map((d, index) => ({
          questionNumber: index + 1,
          ability: d.estimated_ability_after || 0,
        })) || [];

      return {
        totalQuestions,
        correctAnswers,
        averageDifficulty,
        abilityProgression,
      };
    } catch (error) {
      logger.error('Error fetching performance summary:', error);
      throw error;
    }
  }

  /**
   * Calculate final assessment score
   */
  async calculateFinalScore(): Promise<{
    abilityScore: number;
    augmentationLevel: string;
    confidenceLevel: number;
    percentile: number;
  }> {
    const augLevel = this.getAugmentationLevel();

    // Calculate percentile (simplified - assumes normal distribution)
    // In a real system, compare against actual user distribution
    const percentile = this.abilityToPercentile(this.state.currentAbility);

    return {
      abilityScore: this.state.currentAbility,
      augmentationLevel: augLevel.level,
      confidenceLevel: this.state.confidenceLevel,
      percentile,
    };
  }

  /**
   * Convert ability score to percentile (0-100)
   * Uses cumulative distribution function of normal distribution
   */
  private abilityToPercentile(ability: number): number {
    // Simplified conversion: ability -3 to +3 maps to percentile 0 to 100
    // Using approximation of normal CDF
    const normalized = (ability + 3) / 6; // Normalize to 0-1
    return Math.round(Math.max(0, Math.min(100, normalized * 100)));
  }

  /**
   * Check if assessment should end
   */
  shouldEndAssessment(): boolean {
    return !this.state.shouldContinue;
  }

  /**
   * Get estimated questions remaining
   */
  getEstimatedQuestionsRemaining(): number {
    const remaining = ADAPTIVE_CONFIG.MAX_QUESTIONS - this.state.questionsAnswered;
    if (this.state.standardError <= ADAPTIVE_CONFIG.STOPPING_SEM_THRESHOLD) {
      return 0;
    }
    return Math.max(0, remaining);
  }
}

/**
 * Factory function to create and initialize engine
 */
export async function createAdaptiveEngine(
  assessmentId: string
): Promise<AdaptiveAssessmentEngine> {
  const engine = new AdaptiveAssessmentEngine(assessmentId);
  await engine.initializeState();
  return engine;
}
