/**
 * Validation schemas for Lesson on Demand feature
 */

import { z } from 'zod';

// =============================================================================
// Topic Input Form Schema
// =============================================================================

export const topicInputSchema = z.object({
  topic: z
    .string()
    .min(10, 'Topic must be at least 10 characters')
    .max(500, 'Topic must be less than 500 characters')
    .trim(),

  audience: z.enum(['primary', 'secondary', 'professional', 'business'], {
    required_error: 'Please select an audience',
  }),

  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert'], {
    required_error: 'Please select a difficulty level',
  }),

  duration_minutes: z
    .number({
      required_error: 'Please select a duration',
      invalid_type_error: 'Duration must be a number',
    })
    .int('Duration must be a whole number')
    .min(15, 'Lesson must be at least 15 minutes')
    .max(180, 'Lesson must be 180 minutes or less'),

  curriculum_type: z.string().optional(),

  grade_level: z.string().optional(),

  include_exercises: z.boolean().default(true),

  include_quiz: z.boolean().default(true),

  num_quiz_questions: z
    .number()
    .int()
    .min(3, 'Must have at least 3 quiz questions')
    .max(10, 'Maximum 10 quiz questions allowed')
    .default(5)
    .optional(),

  learning_objectives: z.array(z.string()).optional(),
});

export type TopicInputFormData = z.infer<typeof topicInputSchema>;

// =============================================================================
// Lesson Edit Schema
// =============================================================================

export const lessonEditSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100),

  description: z.string().min(20, 'Description must be at least 20 characters').max(500),

  learning_objectives: z
    .array(z.string().min(10, 'Objective must be at least 10 characters'))
    .min(1, 'At least one learning objective is required')
    .max(10, 'Maximum 10 learning objectives'),

  prerequisites: z.array(z.string()).optional(),

  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),

  category: z.string().optional(),
});

export type LessonEditFormData = z.infer<typeof lessonEditSchema>;

// =============================================================================
// Exercise Edit Schema
// =============================================================================

export const exerciseEditSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),

  description: z.string().min(20, 'Description must be at least 20 characters'),

  type: z.enum(['hands_on', 'reflection', 'problem_solving', 'case_study']),

  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),

  estimated_minutes: z.number().int().min(1).max(120),

  solution_hints: z.array(z.string()).optional(),

  success_criteria: z.array(z.string()).optional(),
});

export type ExerciseEditFormData = z.infer<typeof exerciseEditSchema>;

// =============================================================================
// Quiz Question Edit Schema
// =============================================================================

export const quizQuestionEditSchema = z.object({
  question_type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'fill_blank']),

  question_text: z.string().min(10, 'Question must be at least 10 characters'),

  options: z
    .array(
      z.object({
        text: z.string().min(1, 'Option text is required'),
        is_correct: z.boolean(),
      })
    )
    .optional()
    .refine(
      options => {
        if (!options) return true;
        const correctCount = options.filter(opt => opt.is_correct).length;
        return correctCount >= 1;
      },
      {
        message: 'At least one option must be marked as correct',
      }
    ),

  explanation: z.string().min(20, 'Explanation must be at least 20 characters'),

  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),

  points: z.number().int().min(1).max(10),

  bloom_taxonomy_level: z
    .enum(['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'])
    .optional(),
});

export type QuizQuestionEditFormData = z.infer<typeof quizQuestionEditSchema>;

// =============================================================================
// Publish Lesson Schema
// =============================================================================

export const publishLessonSchema = z.object({
  published_course_id: z.string().uuid().optional(),

  publish_immediately: z.boolean().default(false),
});

export type PublishLessonFormData = z.infer<typeof publishLessonSchema>;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validate topic input and return typed data
 */
export function validateTopicInput(data: unknown): TopicInputFormData {
  return topicInputSchema.parse(data);
}

/**
 * Validate lesson edit and return typed data
 */
export function validateLessonEdit(data: unknown): LessonEditFormData {
  return lessonEditSchema.parse(data);
}

/**
 * Validate exercise edit and return typed data
 */
export function validateExerciseEdit(data: unknown): ExerciseEditFormData {
  return exerciseEditSchema.parse(data);
}

/**
 * Validate quiz question edit and return typed data
 */
export function validateQuizQuestionEdit(data: unknown): QuizQuestionEditFormData {
  return quizQuestionEditSchema.parse(data);
}

/**
 * Validate publish lesson and return typed data
 */
export function validatePublishLesson(data: unknown): PublishLessonFormData {
  return publishLessonSchema.parse(data);
}

// =============================================================================
// Constants for Form Options
// =============================================================================

export const AUDIENCE_OPTIONS = [
  { value: 'primary', label: 'Primary School', description: 'Ages 5-11' },
  { value: 'secondary', label: 'Secondary School', description: 'Ages 12-18' },
  { value: 'professional', label: 'Professional', description: 'Working adults' },
  { value: 'business', label: 'Business', description: 'Business leaders' },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: 'No prior knowledge needed' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some background helpful' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced learners' },
  { value: 'expert', label: 'Expert', description: 'Subject matter experts' },
] as const;

export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes', description: 'Quick overview' },
  { value: 30, label: '30 minutes', description: 'Short lesson' },
  { value: 45, label: '45 minutes', description: 'Standard lesson' },
  { value: 60, label: '60 minutes', description: 'In-depth lesson' },
  { value: 90, label: '90 minutes', description: 'Extended lesson' },
  { value: 120, label: '120 minutes', description: 'Workshop session' },
] as const;

export const EXERCISE_TYPE_OPTIONS = [
  { value: 'hands_on', label: 'Hands-On', description: 'Practical activity' },
  { value: 'reflection', label: 'Reflection', description: 'Thinking exercise' },
  { value: 'problem_solving', label: 'Problem Solving', description: 'Solve a problem' },
  { value: 'case_study', label: 'Case Study', description: 'Analyze a scenario' },
] as const;

export const QUESTION_TYPE_OPTIONS = [
  { value: 'multiple_choice', label: 'Multiple Choice', description: 'Choose one answer' },
  { value: 'true_false', label: 'True/False', description: 'Binary choice' },
  { value: 'short_answer', label: 'Short Answer', description: 'Write a response' },
  { value: 'fill_blank', label: 'Fill in the Blank', description: 'Complete the sentence' },
] as const;

export const BLOOM_TAXONOMY_OPTIONS = [
  { value: 'remembering', label: 'Remembering', description: 'Recall facts' },
  { value: 'understanding', label: 'Understanding', description: 'Explain concepts' },
  { value: 'applying', label: 'Applying', description: 'Use knowledge' },
  { value: 'analyzing', label: 'Analyzing', description: 'Break down information' },
  { value: 'evaluating', label: 'Evaluating', description: 'Make judgments' },
  { value: 'creating', label: 'Creating', description: 'Produce new work' },
] as const;
