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
 * Question interface matching database structure with enhanced types
 */
export interface AdaptiveQuestion {
  id: string;
  question_text: string;
  question_type:
    | 'single_choice'
    | 'multiple_choice'
    | 'scale'
    | 'frequency'
    | 'scenario_multimedia'
    | 'drag_drop_ranking'
    | 'drag_drop_ordering'
    | 'code_evaluation'
    | 'case_study';
  difficulty_level: 'foundational' | 'applied' | 'advanced' | 'strategic';
  irt_difficulty: number;
  category_id: string;
  category_name: string;
  help_text?: string;
  // Enhanced question fields
  media_type?: 'image' | 'video' | 'audio' | 'document';
  media_url?: string;
  media_caption?: string;
  scenario_context?: string;
  code_snippet?: string;
  code_language?: string;
  case_study_data?: unknown;
  metadata?: unknown;
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
  // Enhanced option fields
  correct_position?: number; // For drag-drop ranking/ordering
  option_image_url?: string; // For visual options
}

export interface AssessmentState {
  assessmentId: string;
  toolId?: string; // Optional: filter questions by assessment tool
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
  private toolId?: string;
  private state: AssessmentState;

  constructor(assessmentId: string, toolId?: string) {
    this.assessmentId = assessmentId;
    this.toolId = toolId;
    this.state = {
      assessmentId,
      toolId,
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
   * If toolId is set, only questions from that tool's pool are considered
   */
  async getNextQuestion(categoryId?: string): Promise<AdaptiveQuestion | null> {
    try {
      // If toolId is set, get questions filtered by tool's question pool
      if (this.toolId) {
        return await this.getNextQuestionForTool(categoryId);
      }

      // Original behavior for non-tool assessments
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
   * Get next question filtered by assessment tool's question pool
   */
  private async getNextQuestionForTool(categoryId?: string): Promise<AdaptiveQuestion | null> {
    try {
      // Get questions from the tool's pool that haven't been answered
      const { data: poolQuestions, error: poolError } = await supabase
        .from('assessment_question_pools')
        .select(
          `
          question_id,
          weight,
          assessment_questions (
            id,
            question_text,
            question_type,
            difficulty_level,
            irt_difficulty,
            category_id,
            help_text,
            media_type,
            media_url,
            media_caption,
            scenario_context,
            code_snippet,
            code_language,
            assessment_categories (
              name
            )
          )
        `
        )
        .eq('tool_id', this.toolId)
        .eq('is_active', true)
        .not('question_id', 'in', `(${this.state.answeredQuestionIds.join(',') || 'NULL'})`);

      if (poolError) throw poolError;
      if (!poolQuestions || poolQuestions.length === 0) {
        logger.warn('No more questions available in tool pool');
        return null;
      }

      // Filter by category if specified
      let filteredQuestions = poolQuestions;
      if (categoryId) {
        filteredQuestions = poolQuestions.filter(
          (pq: { assessment_questions: { category_id: string } }) =>
            pq.assessment_questions.category_id === categoryId
        );
      }

      if (filteredQuestions.length === 0) return null;

      // Select question closest to current ability (IRT matching)
      const selectedPool = this.selectBestQuestion(
        filteredQuestions.map((pq: unknown) => {
          const poolQ = pq as {
            question_id: string;
            weight: number;
            assessment_questions: {
              irt_difficulty: number;
            };
          };
          return {
            questionId: poolQ.question_id,
            difficulty: poolQ.assessment_questions.irt_difficulty,
            weight: poolQ.weight,
          };
        })
      );

      const selectedQuestion = filteredQuestions.find(
        (pq: { question_id: string }) => pq.question_id === selectedPool.questionId
      );

      if (!selectedQuestion) return null;

      // Fetch options for the selected question
      const { data: options, error: optionsError } = await supabase
        .from('assessment_question_options')
        .select('*')
        .eq('question_id', selectedQuestion.question_id)
        .order('order_index', { ascending: true });

      if (optionsError) throw optionsError;

      const question = selectedQuestion.assessment_questions as {
        id: string;
        question_text: string;
        question_type: string;
        difficulty_level: string;
        irt_difficulty: number;
        category_id: string;
        help_text?: string;
        media_type?: string;
        media_url?: string;
        media_caption?: string;
        scenario_context?: string;
        code_snippet?: string;
        code_language?: string;
        assessment_categories: { name: string };
      };

      return {
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type as AdaptiveQuestion['question_type'],
        difficulty_level: question.difficulty_level as AdaptiveQuestion['difficulty_level'],
        irt_difficulty: question.irt_difficulty,
        category_id: question.category_id,
        category_name: question.assessment_categories.name,
        help_text: question.help_text,
        media_type: question.media_type as AdaptiveQuestion['media_type'],
        media_url: question.media_url,
        media_caption: question.media_caption,
        scenario_context: question.scenario_context,
        code_snippet: question.code_snippet,
        code_language: question.code_language,
        options: (options || []).map((opt: unknown) => {
          const option = opt as {
            id: string;
            option_text: string;
            option_value: string;
            points: number;
            description?: string;
            is_correct: boolean;
            order_index: number;
            correct_position?: number;
            option_image_url?: string;
          };
          return {
            id: option.id,
            option_text: option.option_text,
            option_value: option.option_value,
            points: option.points,
            description: option.description,
            is_correct: option.is_correct,
            order_index: option.order_index,
            correct_position: option.correct_position,
            option_image_url: option.option_image_url,
          };
        }),
      };
    } catch (error) {
      logger.error('Error fetching next question for tool:', error);
      throw error;
    }
  }

  /**
   * Select best question using IRT matching and weight
   */
  private selectBestQuestion(
    questions: Array<{ questionId: string; difficulty: number; weight: number }>
  ): { questionId: string; difficulty: number; weight: number } {
    // Score each question based on IRT match and weight
    const scored = questions.map(q => {
      // IRT match: questions with difficulty close to ability are best
      const difficultyMatch = Math.abs(q.difficulty - this.state.currentAbility);
      const irtScore = Math.exp(-difficultyMatch); // Exponential decay

      // Combine IRT score with weight
      const finalScore = irtScore * q.weight;

      return { ...q, score: finalScore };
    });

    // Sort by score and return best
    scored.sort((a, b) => b.score - a.score);
    return scored[0];
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
  assessmentId: string,
  toolId?: string
): Promise<AdaptiveAssessmentEngine> {
  const engine = new AdaptiveAssessmentEngine(assessmentId, toolId);
  await engine.initializeState();
  return engine;
}
