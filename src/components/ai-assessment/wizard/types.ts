export interface AssessmentQuestion {
  id: string;
  category_id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'scale' | 'frequency';
  help_text?: string;
  order_index: number;
  points_value: number;
  difficulty_level?: 'foundational' | 'applied' | 'advanced' | 'strategic';
  recommended_experience_level?: 'none' | 'basic' | 'intermediate' | 'advanced';
  options?: AssessmentOption[];
  category?: {
    name: string;
    icon: string;
  };
}

export interface RecommendedQuestion {
  question_id: string;
  question_text: string;
  category_name: string;
  difficulty_level: string;
  relevance_score: number;
}

export interface AssessmentOption {
  id: string;
  option_text: string;
  option_value: string;
  points: number;
  description?: string;
  tool_recommendations?: string[];
}

export interface UserAnswer {
  question_id: string;
  selected_options: string[];
  score_earned: number;
}

export interface ProfilingData {
  audience_type: string;
  experience_level?: string;
  industry?: string;
  job_role?: string;
  years_experience?: number;
  company_size?: string;
  education_level?: string;
  grade_level?: string;
  interests?: string[];
  goals?: string[];
  current_tools?: string[];
  challenges?: string[];
}
