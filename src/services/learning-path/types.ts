/**
 * Type definitions for Learning Path Generator
 */

export interface AssessmentData {
  id: string;
  total_score: number;
  max_possible_score: number;
  augmentation_level: string;
  current_ability_estimate?: number;
  ability_standard_error?: number;
  questions_answered_count?: number;
}

export interface CategoryInsight {
  category_id: string;
  category_name: string;
  category_score: number;
  category_max_score: number;
  strength_level: 'strong' | 'proficient' | 'developing' | 'weak';
  percentage: number;
}

export interface LearningGoal {
  goal_title: string;
  goal_description?: string;
  target_augmentation_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  target_irt_ability?: number;
  focus_category_ids: string[];
  focus_skills?: string[];
  estimated_weeks: number;
  hours_per_week: number;
  preferred_learning_style?: 'visual' | 'reading' | 'hands-on' | 'mixed';
  include_workshops: boolean;
  include_events: boolean;
}

export interface PathItem {
  item_type: 'course' | 'exercise' | 'quiz' | 'workshop' | 'event' | 'assessment';
  item_id: string;
  item_title: string;
  item_description?: string;
  difficulty_level: string;
  irt_difficulty?: number;
  estimated_hours: number;
  is_required: boolean;
  prerequisites?: string[];
  skill_tags?: string[];
  reason_for_inclusion: string;
  addresses_weaknesses?: string[];
  confidence_score: number;
  week_number?: number;
}

export interface GeneratedPath {
  path_title: string;
  path_description: string;
  difficulty_start: string;
  difficulty_end: string;
  estimated_completion_weeks: number;
  estimated_total_hours: number;
  items: PathItem[];
  milestones: Milestone[];
  generation_metadata: {
    algorithm: string;
    assessment_used: string;
    gap_analysis: GapAnalysis;
    computation_time_ms: number;
  };
}

export interface Milestone {
  milestone_order: number;
  milestone_title: string;
  milestone_description: string;
  minimum_completion_percentage: number;
  reward_badge?: string;
  reward_points: number;
  reward_message: string;
}

export interface GapAnalysis {
  currentAbility: number;
  targetAbility: number;
  abilityGap: number;
  weakCategories: WeakCategory[];
  priorityCategories: PriorityCategory[];
  focusAreas: string[];
}

export interface WeakCategory {
  id: string;
  name: string;
  score: number;
  gap: number;
}

export interface PriorityCategory {
  id: string;
  name: string;
  score: number;
  priority: number;
}

export interface LearningResources {
  courses: Course[];
  workshops: Workshop[];
  exercises: Exercise[];
  quizzes: unknown[];
}

export interface Course {
  id: string | number;
  title: string;
  description?: string;
  difficulty_level?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface Workshop {
  id: string | number;
  title: string;
  description?: string;
  is_active?: boolean;
  event_date?: string;
}

export interface Exercise {
  id: string;
  title: string;
  description?: string;
  course_id?: string | number;
  is_published?: boolean;
}

export interface DifficultyMapping {
  irt: number;
  level: string;
  next: string;
}

export const DIFFICULTY_MAP: Record<string, DifficultyMapping> = {
  beginner: { irt: -1.0, level: 'foundational', next: 'intermediate' },
  intermediate: { irt: 0.0, level: 'applied', next: 'advanced' },
  advanced: { irt: 1.0, level: 'advanced', next: 'expert' },
  expert: { irt: 2.0, level: 'strategic', next: 'expert' },
};

export const LEVEL_TO_DIFFICULTY: Record<string, number> = {
  foundational: -1.0,
  applied: 0.0,
  advanced: 1.0,
  strategic: 2.0,
};
