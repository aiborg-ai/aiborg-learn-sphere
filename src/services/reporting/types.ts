/**
 * Shared types for reporting features
 */

export interface Certificate {
  id: string;
  user_id: string;
  certificate_type: 'course_completion' | 'assessment' | 'skill_achievement' | 'program_completion';
  reference_id: string;
  title: string;
  description?: string;
  issued_date: Date;
  verification_code: string;
  qr_code_url?: string;
  pdf_url?: string;
  metadata?: Record<string, unknown>;
  expires_at?: Date;
}

export interface DiagnosticReport {
  id: string;
  user_id: string;
  report_type: 'learner_progress' | 'skill_analysis' | 'team_performance' | 'organization_overview';
  title: string;
  summary?: string;
  overall_score?: number;
  completion_rate?: number;
  engagement_score?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  skill_breakdown?: Record<string, unknown>;
  progress_timeline?: unknown[];
  comparative_analysis?: Record<string, unknown>;
  period_start?: Date;
  period_end?: Date;
}

export interface CompetencyMatrix {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  job_role: string;
  experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'expert';
  skills: CompetencySkill[];
}

export interface CompetencySkill {
  id: string;
  skill_name: string;
  skill_category: string;
  required_level: number; // 1-5
  importance: 'required' | 'preferred' | 'nice_to_have';
  description?: string;
  assessment_criteria?: string[];
}

export interface CompetencyAssessment {
  id: string;
  user_id: string;
  matrix_id: string;
  overall_match_score: number;
  skill_ratings: SkillRating[];
  status: 'draft' | 'completed' | 'verified';
  assessment_date: Date;
}

export interface SkillRating {
  skill_id: string;
  skill_name: string;
  required_level: number;
  current_level: number;
  gap: number;
  evidence?: string;
  verified: boolean;
}

export interface APIKey {
  id: string;
  key_name: string;
  api_key: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  allowed_endpoints?: string[];
  rate_limit: number;
  is_active: boolean;
  expires_at?: Date;
}
