/**
 * Survey System Types
 */

export type AudienceCategory = 'professional' | 'student' | 'entrepreneur' | 'career_changer';

export type SurveyStatus = 'draft' | 'active' | 'paused' | 'completed';

export type SurveyQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'rating'
  | 'text'
  | 'ranking';

export interface Survey {
  id: string;
  tenant_id?: string;
  title: string;
  description?: string;
  target_category?: AudienceCategory;
  status: SurveyStatus;
  starts_at?: string;
  ends_at?: string;
  max_responses?: number;
  allow_anonymous: boolean;
  show_results_publicly: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: SurveyQuestionType;
  options?: string[];
  is_required: boolean;
  order_index: number;
  metadata?: QuestionMetadata;
  created_at: string;
}

export interface QuestionMetadata {
  min?: number;
  max?: number;
  labels?: string[];
  placeholder?: string;
  max_selections?: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  respondent_id?: string;
  respondent_category: AudienceCategory;
  respondent_email?: string;
  ip_hash?: string;
  started_at: string;
  completed_at?: string;
  is_complete: boolean;
  metadata?: Record<string, unknown>;
}

export interface SurveyAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_value: AnswerValue;
  created_at: string;
}

export type AnswerValue = string | string[] | number | Record<string, unknown>;

export interface SurveyTemplate {
  id: string;
  name: string;
  description?: string;
  category?: AudienceCategory;
  questions: TemplateQuestion[];
  is_system: boolean;
  created_at: string;
}

export interface TemplateQuestion {
  question_text: string;
  question_type: SurveyQuestionType;
  options?: string[];
  is_required: boolean;
  metadata?: QuestionMetadata;
}

// API Types
export interface CreateSurveyRequest {
  title: string;
  description?: string;
  target_category?: AudienceCategory;
  starts_at?: string;
  ends_at?: string;
  max_responses?: number;
  allow_anonymous?: boolean;
  show_results_publicly?: boolean;
}

export interface CreateQuestionRequest {
  survey_id: string;
  question_text: string;
  question_type: SurveyQuestionType;
  options?: string[];
  is_required?: boolean;
  order_index: number;
  metadata?: QuestionMetadata;
}

export interface SubmitResponseRequest {
  survey_id: string;
  respondent_category: AudienceCategory;
  respondent_email?: string;
  answers: Record<string, AnswerValue>; // question_id -> answer
}

// Analytics Types
export interface SurveyAnalytics {
  survey_id: string;
  title: string;
  target_category?: AudienceCategory;
  status: SurveyStatus;
  total_responses: number;
  completed_responses: number;
  professional_responses: number;
  student_responses: number;
  entrepreneur_responses: number;
  career_changer_responses: number;
  first_response_at?: string;
  last_response_at?: string;
  avg_completion_seconds?: number;
}

export interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  question_type: SurveyQuestionType;
  total_answers: number;
  answer_distribution: Record<string, number>;
  by_category: Record<AudienceCategory, Record<string, number>>;
}

export interface SurveyResultsData {
  survey: Survey;
  analytics: SurveyAnalytics;
  questions: QuestionAnalytics[];
  responses_over_time: Array<{ date: string; count: number }>;
  category_breakdown: Array<{ category: AudienceCategory; count: number; percentage: number }>;
}

// UI Types
export interface AudienceCategoryInfo {
  id: AudienceCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const AUDIENCE_CATEGORIES: AudienceCategoryInfo[] = [
  {
    id: 'professional',
    name: 'Working Professional',
    description: 'Currently employed and looking to upskill or advance my career',
    icon: 'Briefcase',
    color: 'blue',
  },
  {
    id: 'student',
    name: 'Student',
    description: 'High school, college, or university student pursuing education',
    icon: 'GraduationCap',
    color: 'green',
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    description: 'Business owner or aspiring to start my own venture',
    icon: 'Rocket',
    color: 'purple',
  },
  {
    id: 'career_changer',
    name: 'Career Changer',
    description: 'Looking to transition into a new field or industry',
    icon: 'RefreshCw',
    color: 'orange',
  },
];
