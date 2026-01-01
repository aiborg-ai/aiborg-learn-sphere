/**
 * Exercise Service
 * Handles exercise CRUD operations and management
 */

import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '@/utils/logger';
import type {
  Exercise,
  CreateExerciseInput,
  UpdateExerciseInput,
  ExerciseStatistics,
  ExerciseProgress,
  ExerciseWithSubmission,
} from './types';

export class ExerciseService {
  /**
   * Create a new exercise
   */
  static async createExercise(input: CreateExerciseInput, userId: string): Promise<Exercise> {
    try {
      // Sanitize instructions HTML to prevent XSS
      const sanitizedInstructions = input.instructions
        ? DOMPurify.sanitize(input.instructions, {
            ALLOWED_TAGS: [
              'h1',
              'h2',
              'h3',
              'h4',
              'h5',
              'h6',
              'p',
              'br',
              'strong',
              'em',
              'u',
              'ul',
              'ol',
              'li',
              'a',
              'code',
              'pre',
              'blockquote',
              'img',
              'table',
              'thead',
              'tbody',
              'tr',
              'th',
              'td',
            ],
            ALLOWED_ATTR: ['href', 'title', 'src', 'alt', 'class'],
            ALLOW_DATA_ATTR: false,
            ALLOWED_URI_REGEXP: /^(?:https?:)/i,
          })
        : input.instructions;

      const { data, error } = await supabase
        .from('exercises')
        .insert({
          ...input,
          instructions: sanitizedInstructions,
          created_by: userId,
          difficulty_level: input.difficulty_level || 'intermediate',
          exercise_type: input.exercise_type || 'writing',
          points_reward: input.points_reward || 10,
          max_file_size_mb: input.max_file_size_mb || 25,
          submission_required: input.submission_required ?? true,
          peer_review_enabled: input.peer_review_enabled ?? false,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Exercise created', { exerciseId: data.id, courseId: input.course_id });
      return data as Exercise;
    } catch (_error) {
      logger.error('Failed to create exercise', { _error, input });
      throw error;
    }
  }

  /**
   * Update an exercise
   */
  static async updateExercise(input: UpdateExerciseInput): Promise<Exercise> {
    try {
      const { id, ...updates } = input;

      // Sanitize instructions HTML if provided to prevent XSS
      const sanitizedUpdates = {
        ...updates,
        ...(updates.instructions && {
          instructions: DOMPurify.sanitize(updates.instructions, {
            ALLOWED_TAGS: [
              'h1',
              'h2',
              'h3',
              'h4',
              'h5',
              'h6',
              'p',
              'br',
              'strong',
              'em',
              'u',
              'ul',
              'ol',
              'li',
              'a',
              'code',
              'pre',
              'blockquote',
              'img',
              'table',
              'thead',
              'tbody',
              'tr',
              'th',
              'td',
            ],
            ALLOWED_ATTR: ['href', 'title', 'src', 'alt', 'class'],
            ALLOW_DATA_ATTR: false,
            ALLOWED_URI_REGEXP: /^(?:https?:)/i,
          }),
        }),
      };

      const { data, error } = await supabase
        .from('exercises')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Exercise updated', { exerciseId: id });
      return data as Exercise;
    } catch (_error) {
      logger.error('Failed to update exercise', { _error, input });
      throw error;
    }
  }

  /**
   * Delete an exercise
   */
  static async deleteExercise(exerciseId: string): Promise<void> {
    try {
      const { error } = await supabase.from('exercises').delete().eq('id', exerciseId);

      if (error) throw error;

      logger.info('Exercise deleted', { exerciseId });
    } catch (_error) {
      logger.error('Failed to delete exercise', { _error, exerciseId });
      throw error;
    }
  }

  /**
   * Get exercise by ID
   */
  static async getExercise(exerciseId: string): Promise<Exercise> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();

      if (error) throw error;

      return data as Exercise;
    } catch (_error) {
      logger.error('Failed to get exercise', { _error, exerciseId });
      throw error;
    }
  }

  /**
   * Get exercise with user's submission
   */
  static async getExerciseWithSubmission(
    exerciseId: string,
    userId: string
  ): Promise<ExerciseWithSubmission> {
    try {
      // Get exercise
      const exercise = await this.getExercise(exerciseId);

      // Get user's latest submission
      const { data: submission } = await supabase
        .from('exercise_submissions')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...exercise,
        user_submission: submission || undefined,
      };
    } catch (_error) {
      logger.error('Failed to get exercise with submission', { _error, exerciseId, userId });
      throw error;
    }
  }

  /**
   * Get all exercises for a course
   */
  static async getExercisesByCourse(courseId: number, publishedOnly = false): Promise<Exercise[]> {
    try {
      let query = supabase.from('exercises').select('*').eq('course_id', courseId);

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data as Exercise[];
    } catch (_error) {
      logger.error('Failed to get exercises by course', { _error, courseId });
      throw error;
    }
  }

  /**
   * Get student progress on an exercise
   */
  static async getStudentProgress(userId: string, exerciseId: string): Promise<ExerciseProgress> {
    try {
      const { data: submissions, error } = await supabase
        .from('exercise_submissions')
        .select('status, score, created_at')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        return {
          exercise_id: exerciseId,
          status: 'draft',
          attempts: 0,
          completed: false,
        };
      }

      const latestSubmission = submissions[0];
      const bestSubmission = submissions.reduce((best, current) =>
        (current.score || 0) > (best.score || 0) ? current : best
      );

      return {
        exercise_id: exerciseId,
        status: latestSubmission.status as 'draft' | 'submitted' | 'graded' | 'needs_revision',
        score: latestSubmission.score,
        best_score: bestSubmission.score,
        attempts: submissions.length,
        last_submission_date: latestSubmission.created_at,
        completed: latestSubmission.status === 'completed' || latestSubmission.status === 'passed',
      };
    } catch (_error) {
      logger.error('Failed to get student progress', { _error, userId, exerciseId });
      throw error;
    }
  }

  /**
   * Get exercise statistics (for instructors)
   */
  static async getExerciseStatistics(exerciseId: string): Promise<ExerciseStatistics> {
    try {
      const { data: submissions, error } = await supabase
        .from('exercise_submissions')
        .select('user_id, score, status, created_at, submitted_at')
        .eq('exercise_id', exerciseId);

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        return {
          exercise_id: exerciseId,
          total_submissions: 0,
          unique_students: 0,
          completed_count: 0,
          average_attempts: 0,
        };
      }

      const uniqueStudents = new Set(submissions.map(s => s.user_id)).size;
      const completedCount = submissions.filter(
        s => s.status === 'completed' || s.status === 'passed'
      ).length;

      const submissionsWithScore = submissions.filter(s => s.score !== null);
      const averageScore =
        submissionsWithScore.length > 0
          ? submissionsWithScore.reduce((sum, s) => sum + (s.score || 0), 0) /
            submissionsWithScore.length
          : undefined;

      // Calculate average attempts per student
      const attemptsPerStudent = submissions.reduce(
        (acc, s) => {
          acc[s.user_id] = (acc[s.user_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const averageAttempts =
        Object.values(attemptsPerStudent).reduce((sum, count) => sum + count, 0) / uniqueStudents;

      return {
        exercise_id: exerciseId,
        total_submissions: submissions.length,
        unique_students: uniqueStudents,
        completed_count: completedCount,
        average_score: averageScore,
        average_attempts: Math.round(averageAttempts * 10) / 10,
      };
    } catch (_error) {
      logger.error('Failed to get exercise statistics', { _error, exerciseId });
      throw error;
    }
  }

  /**
   * Toggle exercise publish status
   */
  static async togglePublish(exerciseId: string, isPublished: boolean): Promise<Exercise> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .update({ is_published: isPublished })
        .eq('id', exerciseId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Exercise publish status updated', { exerciseId, isPublished });
      return data as Exercise;
    } catch (_error) {
      logger.error('Failed to toggle exercise publish status', { _error, exerciseId });
      throw error;
    }
  }

  /**
   * Duplicate an exercise
   */
  static async duplicateExercise(
    exerciseId: string,
    newTitle: string,
    userId: string
  ): Promise<Exercise> {
    try {
      const original = await this.getExercise(exerciseId);

      const { id, created_at, updated_at, created_by, ...exerciseData } = original as Record<
        string,
        unknown
      >;

      return await this.createExercise(
        {
          ...exerciseData,
          title: newTitle,
          is_published: false,
        },
        userId
      );
    } catch (_error) {
      logger.error('Failed to duplicate exercise', { _error, exerciseId });
      throw error;
    }
  }
}
