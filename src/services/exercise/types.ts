/**
 * Exercise Service Types
 * Type definitions for the Exercise system
 */

export type ExerciseType = 'coding' | 'writing' | 'analysis' | 'design' | 'research' | 'project';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'passed'
  | 'needs_revision'
  | 'completed';

export interface Exercise {
  id: string;
  course_id: number;
  title: string;
  description: string;
  instructions?: string;
  difficulty_level: DifficultyLevel;
  estimated_time_minutes?: number;
  exercise_type: ExerciseType;
  points_reward: number;
  starter_code?: string;
  test_cases?: TestCase[];
  rubric?: RubricItem[];
  required_files?: string[];
  max_file_size_mb: number;
  is_published: boolean;
  submission_required: boolean;
  peer_review_enabled: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TestCase {
  name: string;
  input: unknown;
  expected_output: unknown;
  points: number;
  hidden?: boolean; // Hidden test cases not shown to students
}

export interface RubricItem {
  criteria: string;
  description: string;
  max_points: number;
  levels?: RubricLevel[];
}

export interface RubricLevel {
  name: string; // e.g., "Excellent", "Good", "Needs Work"
  points: number;
  description: string;
}

export interface ExerciseSubmission {
  id: string;
  exercise_id: string;
  user_id: string;
  submission_text?: string;
  code_submission?: string;
  file_urls?: string[];
  github_repo_url?: string;
  submitted_at?: string;
  status: SubmissionStatus;
  score?: number;
  test_results?: TestResult[];
  feedback?: string;
  points_earned?: number;
  graded_by?: string;
  graded_at?: string;
  revision_count: number;
  peer_review_data?: PeerReview[];
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  test_name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  error?: string;
  points_earned: number;
  execution_time_ms?: number;
}

export interface PeerReview {
  reviewer_id: string;
  reviewer_name?: string;
  rating: number; // 1-5 stars
  comments: string;
  rubric_scores?: Record<string, number>;
  submitted_at: string;
}

export interface ExerciseWithSubmission extends Exercise {
  user_submission?: ExerciseSubmission;
  submission_count?: number;
}

export interface ExerciseProgress {
  exercise_id: string;
  status: SubmissionStatus;
  score?: number;
  best_score?: number;
  attempts: number;
  last_submission_date?: string;
  completed: boolean;
}

export interface CreateExerciseInput {
  course_id: number;
  title: string;
  description: string;
  instructions?: string;
  difficulty_level?: DifficultyLevel;
  estimated_time_minutes?: number;
  exercise_type?: ExerciseType;
  points_reward?: number;
  starter_code?: string;
  test_cases?: TestCase[];
  rubric?: RubricItem[];
  required_files?: string[];
  max_file_size_mb?: number;
  submission_required?: boolean;
  peer_review_enabled?: boolean;
}

export interface UpdateExerciseInput extends Partial<CreateExerciseInput> {
  id: string;
  is_published?: boolean;
}

export interface CreateSubmissionInput {
  exercise_id: string;
  user_id: string;
  submission_text?: string;
  code_submission?: string;
  file_urls?: string[];
  github_repo_url?: string;
}

export interface UpdateSubmissionInput {
  id: string;
  submission_text?: string;
  code_submission?: string;
  file_urls?: string[];
  github_repo_url?: string;
  status?: SubmissionStatus;
}

export interface GradeSubmissionInput {
  submission_id: string;
  score: number;
  feedback: string;
  rubric_scores?: Record<string, number>;
  graded_by: string;
}

export interface SubmitExerciseResult {
  submission_id: string;
  status: SubmissionStatus;
  test_results?: TestResult[];
  score?: number;
  points_earned: number;
  auto_graded: boolean;
}

export interface ExerciseStatistics {
  exercise_id: string;
  total_submissions: number;
  unique_students: number;
  completed_count: number;
  average_score?: number;
  average_attempts: number;
  average_time_to_complete_hours?: number;
}

export interface StudentExercisePerformance {
  user_id: string;
  exercise_id: string;
  submissions: ExerciseSubmission[];
  best_submission?: ExerciseSubmission;
  progress: ExerciseProgress;
}

export interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  test_results?: TestResult[];
  execution_time_ms: number;
  memory_used_mb?: number;
}
