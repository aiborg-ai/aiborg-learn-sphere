/**
 * Shared types for Learning Path Wizard steps
 */

export interface AssessmentData {
  id: string;
  total_score: number;
  max_possible_score: number;
  augmentation_level: string;
  current_ability_estimate?: number;
  ability_standard_error?: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  percentage: number;
  strength_level: string;
}

export interface WizardFormData {
  goalTitle: string;
  goalDescription: string;
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  focusCategoryIds: string[];
  estimatedWeeks: number;
  hoursPerWeek: number;
  learningStyle: 'visual' | 'reading' | 'hands-on' | 'mixed';
  includeWorkshops: boolean;
  includeEvents: boolean;
}

export const LEVEL_CONFIG = {
  beginner: { label: 'Beginner', desc: 'Foundation building', color: 'bg-green-500' },
  intermediate: { label: 'Intermediate', desc: 'Practical application', color: 'bg-blue-500' },
  advanced: { label: 'Advanced', desc: 'Expert-level mastery', color: 'bg-purple-500' },
  expert: { label: 'Expert', desc: 'Industry leadership', color: 'bg-orange-500' },
} as const;
