/**
 * Quiz Service Types
 * Type definitions for the Quiz system
 */

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'matching'
  | 'fill_blank';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type QuizCategory = 'module_quiz' | 'practice' | 'final' | 'pop_quiz';
export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned' | 'timed_out';

export interface QuizBank {
  id: string;
  course_id: number;
  title: string;
  description?: string;
  category?: QuizCategory;
  difficulty_level: DifficultyLevel;
  is_published: boolean;
  pass_percentage: number;
  time_limit_minutes?: number;
  max_attempts?: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answers: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_bank_id: string;
  question_text: string;
  question_type: QuestionType;
  points: number;
  explanation?: string;
  order_index: number;
  media_url?: string;
  created_at: string;
  updated_at: string;
  options?: QuizOption[]; // Populated in queries
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_bank_id: string;
  user_id: string;
  attempt_number: number;
  started_at: string;
  completed_at?: string;
  time_taken_seconds?: number;
  score?: number;
  total_points?: number;
  percentage?: number;
  passed?: boolean;
  status: AttemptStatus;
  answers?: Record<string, any>; // JSONB
  created_at: string;
}

export interface QuizResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  answer_text?: string;
  is_correct?: boolean;
  points_earned?: number;
  time_spent_seconds?: number;
  created_at: string;
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  quiz_bank: QuizBank;
  responses: QuizResponse[];
}

export interface QuizProgress {
  quiz_bank_id: string;
  attempts_count: number;
  best_score?: number;
  best_percentage?: number;
  passed: boolean;
  last_attempt_date?: string;
}

export interface CreateQuizBankInput {
  course_id: number;
  title: string;
  description?: string;
  category?: QuizCategory;
  difficulty_level?: DifficultyLevel;
  pass_percentage?: number;
  time_limit_minutes?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_correct_answers?: boolean;
}

export interface UpdateQuizBankInput extends Partial<CreateQuizBankInput> {
  id: string;
  is_published?: boolean;
}

export interface CreateQuizQuestionInput {
  quiz_bank_id: string;
  question_text: string;
  question_type: QuestionType;
  points?: number;
  explanation?: string;
  order_index?: number;
  media_url?: string;
  options?: CreateQuizOptionInput[];
}

export interface CreateQuizOptionInput {
  option_text: string;
  is_correct: boolean;
  order_index?: number;
}

export interface UpdateQuizQuestionInput extends Partial<CreateQuizQuestionInput> {
  id: string;
}

export interface StartQuizInput {
  quiz_bank_id: string;
  user_id: string;
}

export interface SubmitQuizAnswerInput {
  attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  answer_text?: string;
  time_spent_seconds?: number;
}

export interface CompleteQuizResult {
  attempt_id: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  time_taken_seconds?: number;
  points_awarded: number; // Gamification points
}

export interface QuizStatistics {
  quiz_bank_id: string;
  total_attempts: number;
  unique_students: number;
  average_score: number;
  average_percentage: number;
  pass_rate: number;
  average_time_seconds?: number;
}

export interface StudentQuizPerformance {
  user_id: string;
  quiz_bank_id: string;
  attempts: QuizAttempt[];
  best_attempt?: QuizAttempt;
  progress: QuizProgress;
}
