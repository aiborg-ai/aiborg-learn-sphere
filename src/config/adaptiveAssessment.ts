/**
 * Adaptive Assessment Configuration
 * Controls the behavior of the intelligent adaptive testing engine
 */

export const ADAPTIVE_CONFIG = {
  /**
   * Initial ability estimate (theta) for all users
   * Range: -3.0 (low ability) to +3.0 (high ability)
   * 0.0 = average/neutral starting point
   */
  INITIAL_ABILITY: 0.0,

  /**
   * Initial standard error of measurement
   * Higher = less confident in ability estimate
   * Decreases as user answers more questions
   */
  INITIAL_STANDARD_ERROR: 1.5,

  /**
   * Minimum number of questions to ask
   * Even if we're confident, ask at least this many
   */
  MIN_QUESTIONS: 8,

  /**
   * Maximum number of questions to ask
   * Stop even if not fully confident
   */
  MAX_QUESTIONS: 15,

  /**
   * Stopping criterion: Standard Error of Measurement threshold
   * Stop assessment when SEM falls below this value (we're confident enough)
   * Typical range: 0.2 - 0.4
   */
  STOPPING_SEM_THRESHOLD: 0.3,

  /**
   * Difficulty adjustment factor after correct answer
   * How much to increase target difficulty after a correct response
   * Range: 0.3 - 1.0
   */
  DIFFICULTY_INCREMENT_CORRECT: 0.5,

  /**
   * Difficulty adjustment factor after incorrect answer
   * How much to decrease target difficulty after an incorrect response
   * Range: 0.2 - 0.5
   */
  DIFFICULTY_DECREMENT_INCORRECT: 0.3,

  /**
   * Target difficulty offset
   * Present questions slightly above current ability for optimal learning
   * Range: 0.0 (at ability) to 0.5 (moderately above ability)
   */
  TARGET_DIFFICULTY_OFFSET: 0.3,

  /**
   * Difficulty search range
   * How wide to search for questions around target difficulty
   * ± this value from target
   */
  DIFFICULTY_SEARCH_RANGE: 0.5,

  /**
   * Category balance weight
   * How much to prioritize category diversity vs. optimal difficulty
   * Range: 0.0 (ignore categories) to 1.0 (strict rotation)
   */
  CATEGORY_BALANCE_WEIGHT: 0.3,

  /**
   * Minimum questions per category (if possible)
   * Try to ask at least this many from each major category
   */
  MIN_QUESTIONS_PER_CATEGORY: 1,

  /**
   * Time penalty threshold (seconds)
   * Flag if user takes longer than this per question
   * May indicate guessing or difficulty
   */
  TIME_PENALTY_THRESHOLD: 120,

  /**
   * Rapid answer bonus threshold (seconds)
   * Consider answer more confident if responded quickly
   */
  RAPID_ANSWER_THRESHOLD: 10,

  /**
   * Enable category rotation
   * Alternate between categories for better assessment coverage
   */
  ENABLE_CATEGORY_ROTATION: true,

  /**
   * Enable adaptive difficulty
   * Set to false for traditional fixed-difficulty assessment
   */
  ENABLE_ADAPTIVE_DIFFICULTY: true,

  /**
   * IRT parameters for ability estimation
   * Used in more sophisticated IRT calculations
   */
  IRT_PARAMS: {
    /** Discrimination parameter (how well questions differentiate ability) */
    DEFAULT_DISCRIMINATION: 1.0,

    /** Guessing parameter (probability of correct answer by guessing) */
    DEFAULT_GUESSING: 0.25,

    /** Maximum theta (ability) value */
    MAX_THETA: 3.0,

    /** Minimum theta (ability) value */
    MIN_THETA: -3.0,
  },

  /**
   * UI/UX configuration
   */
  UI: {
    /** Show difficulty level to user */
    SHOW_DIFFICULTY_LEVEL: true,

    /** Show performance trend */
    SHOW_PERFORMANCE_TREND: true,

    /** Show ability estimate in real-time */
    SHOW_LIVE_ABILITY: false, // May cause anxiety

    /** Show questions remaining count */
    SHOW_QUESTIONS_REMAINING: true,

    /** Enable progress visualization */
    ENABLE_PROGRESS_VIZ: true,
  },

  /**
   * Scoring configuration
   */
  SCORING: {
    /** Points for correct answer at foundational level */
    FOUNDATIONAL_POINTS: 5,

    /** Points for correct answer at applied level */
    APPLIED_POINTS: 10,

    /** Points for correct answer at advanced level */
    ADVANCED_POINTS: 15,

    /** Points for correct answer at strategic level */
    STRATEGIC_POINTS: 20,

    /** Partial credit for partially correct multiple choice */
    ENABLE_PARTIAL_CREDIT: true,
  },

  /**
   * Performance thresholds for ability interpretation
   */
  ABILITY_LEVELS: {
    /** Beginner: theta < -1.0 */
    BEGINNER_THRESHOLD: -1.0,

    /** Intermediate: -1.0 <= theta < 0.5 */
    INTERMEDIATE_THRESHOLD: 0.5,

    /** Advanced: 0.5 <= theta < 1.5 */
    ADVANCED_THRESHOLD: 1.5,

    /** Expert: theta >= 1.5 */
    // EXPERT_THRESHOLD is implied (above ADVANCED_THRESHOLD)
  },

  /**
   * Augmentation level mapping
   * Maps ability theta to augmentation level labels
   */
  AUGMENTATION_LEVELS: [
    { minTheta: -3.0, maxTheta: -1.0, level: 'beginner', label: 'Beginner', percentage: 0 },
    {
      minTheta: -1.0,
      maxTheta: 0.5,
      level: 'intermediate',
      label: 'Intermediate',
      percentage: 40,
    },
    { minTheta: 0.5, maxTheta: 1.5, level: 'advanced', label: 'Advanced', percentage: 70 },
    { minTheta: 1.5, maxTheta: 3.0, level: 'expert', label: 'Expert', percentage: 90 },
  ] as const,
} as const;

/**
 * Helper function to get augmentation level from ability score
 */
export function getAugmentationLevel(abilityTheta: number): {
  level: string;
  label: string;
  percentage: number;
} {
  const level = ADAPTIVE_CONFIG.AUGMENTATION_LEVELS.find(
    l => abilityTheta >= l.minTheta && abilityTheta < l.maxTheta
  );

  return (
    level || {
      level: 'beginner',
      label: 'Beginner',
      percentage: 0,
    }
  );
}

/**
 * Helper function to calculate questions remaining
 */
export function getQuestionsRemaining(
  answeredCount: number,
  standardError: number
): { min: number; max: number; estimate: number } {
  const { MIN_QUESTIONS, MAX_QUESTIONS, STOPPING_SEM_THRESHOLD } = ADAPTIVE_CONFIG;

  // If below min, we know we have at least (min - answered) left
  if (answeredCount < MIN_QUESTIONS) {
    return {
      min: MIN_QUESTIONS - answeredCount,
      max: MAX_QUESTIONS - answeredCount,
      estimate: MIN_QUESTIONS - answeredCount,
    };
  }

  // If SEM is low enough, could stop any time
  if (standardError <= STOPPING_SEM_THRESHOLD) {
    return {
      min: 0,
      max: MAX_QUESTIONS - answeredCount,
      estimate: 0,
    };
  }

  // Estimate based on SEM reduction rate
  const questionsToConvergence = Math.ceil((standardError - STOPPING_SEM_THRESHOLD) * 10);
  const remaining = Math.min(questionsToConvergence, MAX_QUESTIONS - answeredCount);

  return {
    min: 0,
    max: MAX_QUESTIONS - answeredCount,
    estimate: remaining,
  };
}

/**
 * Helper function to determine if assessment should stop
 */
export function shouldStopAssessment(answeredCount: number, standardError: number): boolean {
  const { MIN_QUESTIONS, MAX_QUESTIONS, STOPPING_SEM_THRESHOLD } = ADAPTIVE_CONFIG;

  // Always continue if below minimum
  if (answeredCount < MIN_QUESTIONS) {
    return false;
  }

  // Always stop if at maximum
  if (answeredCount >= MAX_QUESTIONS) {
    return true;
  }

  // Stop if confident enough (low standard error)
  return standardError <= STOPPING_SEM_THRESHOLD;
}

export type AdaptiveConfig = typeof ADAPTIVE_CONFIG;
export type AugmentationLevel = (typeof ADAPTIVE_CONFIG.AUGMENTATION_LEVELS)[number];
