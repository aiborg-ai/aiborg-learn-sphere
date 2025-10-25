/**
 * Assessment Tools Types
 * Types for the new Assessment Tools category feature
 */

export type AssessmentCategoryType = 'readiness' | 'awareness' | 'fluency';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Assessment Tool definition
 */
export interface AssessmentTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category_type: AssessmentCategoryType;
  target_audiences: string[];
  difficulty_level: DifficultyLevel;
  estimated_duration_minutes: number;
  total_questions_pool: number;
  min_questions_required: number;
  passing_score_percentage: number;
  is_active: boolean;
  display_order: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Assessment Tool Attempt
 */
export interface AssessmentToolAttempt {
  id: string;
  user_id: string;
  tool_id: string;
  assessment_id?: string;
  attempt_number: number;

  // Results
  total_score: number;
  max_possible_score: number;
  score_percentage: number;
  ability_estimate: number;
  ability_standard_error: number;

  // Completion
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
  time_taken_seconds?: number;

  // Analytics
  questions_answered: number;
  correct_answers: number;
  performance_by_category?: Record<string, CategoryPerformance>;

  created_at: string;
  updated_at: string;
}

/**
 * Category performance breakdown
 */
export interface CategoryPerformance {
  category_name: string;
  questions_answered: number;
  correct_answers: number;
  score_percentage: number;
}

/**
 * Question pool assignment
 */
export interface AssessmentQuestionPool {
  id: string;
  tool_id: string;
  question_id: string;
  is_active: boolean;
  weight: number;
  created_at: string;
  updated_at: string;
}

/**
 * Assessment tool with user progress
 */
export interface AssessmentToolWithProgress extends AssessmentTool {
  user_attempts?: number;
  latest_attempt?: {
    attempt_number: number;
    score_percentage: number;
    ability_estimate: number;
    is_completed: boolean;
    completed_at?: string;
  };
  best_score?: number;
  is_locked?: boolean; // True if user's audience doesn't match target audiences
}

/**
 * Attempt history item
 */
export interface AttemptHistoryItem {
  attempt_id: string;
  attempt_number: number;
  score_percentage: number;
  ability_estimate: number;
  completed_at: string;
  time_taken_seconds: number;
  improvement_from_previous?: number;
}

/**
 * Assessment results summary
 */
export interface AssessmentResults {
  attempt: AssessmentToolAttempt;
  tool: AssessmentTool;
  performance_by_category: CategoryPerformance[];
  percentile_rank?: number;
  recommendations: string[];
  badges_earned?: string[];
}

/**
 * Question with pool metadata
 */
export interface PooledQuestion {
  question_id: string;
  question_text: string;
  question_type: string;
  difficulty_level: string;
  irt_difficulty: number;
  category_name: string;
  is_active_in_pool: boolean;
  weight: number;
  times_shown?: number;
  correct_rate?: number;
}
