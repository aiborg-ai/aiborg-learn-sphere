/**
 * Lingo Import/Export Types
 *
 * Type definitions for importing and exporting AIBORGLingo lessons and questions.
 */

// Question types matching the database schema
export type LingoQuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'free_response';

// Skill categories for lessons
export type LingoSkillCategory = 'Foundations' | 'LLMs' | 'Vision' | 'NLP' | 'Safety' | 'Advanced';

// Base question structure for export
export interface LingoQuestionExport {
  type: LingoQuestionType;
  prompt: string;
  sort_order: number;
  explanation?: string;

  // Multiple choice fields
  options?: string[];
  answer?: string;

  // Fill in blank fields
  answers?: string[];

  // Matching fields
  pairs?: Array<{ left: string; right: string }>;

  // Ordering fields
  steps?: string[];

  // Free response fields
  ideal_answer?: string;
  rubric?: string;
  strictness?: number;
  pass_score?: number;
}

// Lesson structure for export
export interface LingoLessonExport {
  lesson_id: string;
  title: string;
  skill: LingoSkillCategory;
  duration: string;
  xp_reward: number;
  description: string;
  sort_order: number;
  is_active: boolean;
  questions: LingoQuestionExport[];
}

// Full export file format
export interface LingoExportFile {
  version: '1.0';
  exported_at: string;
  exported_by?: string;
  lessons: LingoLessonExport[];
}

// Import mode options
export type LingoImportMode =
  | 'create_only' // Only create new lessons, skip existing
  | 'update_existing' // Update existing lessons, create new ones
  | 'replace_all'; // Delete all existing and replace with import

// Validation result for a single lesson
export interface LingoLessonValidation {
  lesson_id: string;
  title: string;
  is_valid: boolean;
  exists: boolean;
  question_count: number;
  errors: string[];
  warnings: string[];
}

// Overall import validation result
export interface LingoImportValidation {
  is_valid: boolean;
  total_lessons: number;
  valid_lessons: number;
  existing_lessons: number;
  new_lessons: number;
  lessons: LingoLessonValidation[];
  global_errors: string[];
}

// Import result for a single lesson
export interface LingoLessonImportResult {
  lesson_id: string;
  title: string;
  status: 'created' | 'updated' | 'skipped' | 'failed';
  questions_created: number;
  questions_updated: number;
  error?: string;
}

// Overall import result
export interface LingoImportResult {
  success: boolean;
  mode: LingoImportMode;
  total_lessons: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  lessons: LingoLessonImportResult[];
  errors: string[];
}

// Export options
export interface LingoExportOptions {
  lesson_ids?: string[]; // If empty, export all
  include_inactive?: boolean;
}

// Import options
export interface LingoImportOptions {
  mode: LingoImportMode;
  dry_run?: boolean; // Validate only, don't actually import
}
