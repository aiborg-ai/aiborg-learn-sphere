/**
 * Assessment and profiling type definitions
 */

export interface CategoryPerformance {
  category_name: string;
  accuracy?: number;
  avgDifficulty?: number;
  performance_score?: number;
}

export interface ProfilingData {
  audience_type?: string;
  industry?: string;
  role?: string;
  experience_level?: string;
  learning_goals?: string[];
  preferred_learning_style?: string;
  time_availability?: string;
  [key: string]: unknown; // Allow additional profiling fields
}

export interface AssessmentResponse {
  question_id: string;
  answer: string;
  is_correct: boolean;
  time_taken?: number;
  difficulty?: number;
  category?: string;
}

export interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp?: string;
}
