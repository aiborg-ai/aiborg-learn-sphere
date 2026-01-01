/**
 * LingoReorderService
 *
 * Service for batch reordering of Lingo lessons and questions.
 * Handles database updates for sort_order changes.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface ReorderItem {
  id: string;
  sort_order: number;
}

export class LingoReorderService {
  /**
   * Batch update sort_order for multiple lessons
   */
  static async reorderLessons(items: ReorderItem[]): Promise<void> {
    logger.info('Reordering lessons', { count: items.length });

    try {
      // Update each lesson's sort_order
      const updates = items.map(item =>
        supabase.from('lingo_lessons').update({ sort_order: item.sort_order }).eq('id', item.id)
      );

      const results = await Promise.all(updates);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        logger.error('Failed to reorder some lessons', { errors: errors.map(e => e.error) });
        throw new Error('Failed to reorder lessons');
      }

      logger.info('Lessons reordered successfully');
    } catch (_error) {
      logger.error('Failed to reorder lessons', _error);
      throw error;
    }
  }

  /**
   * Batch update sort_order for questions within a lesson
   */
  static async reorderQuestions(lessonId: string, items: ReorderItem[]): Promise<void> {
    logger.info('Reordering questions', { lessonId, count: items.length });

    try {
      // Update each question's sort_order
      const updates = items.map(
        item =>
          supabase
            .from('lingo_questions')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
            .eq('lesson_id', lessonId) // Safety: ensure question belongs to lesson
      );

      const results = await Promise.all(updates);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        logger.error('Failed to reorder some questions', { errors: errors.map(e => e.error) });
        throw new Error('Failed to reorder questions');
      }

      logger.info('Questions reordered successfully');
    } catch (_error) {
      logger.error('Failed to reorder questions', _error);
      throw error;
    }
  }

  /**
   * Batch update sort_order for courses
   */
  static async reorderCourses(items: ReorderItem[]): Promise<void> {
    logger.info('Reordering courses', { count: items.length });

    try {
      // Update each course's sort_order
      const updates = items.map(
        item =>
          supabase
            .from('courses')
            .update({ sort_order: item.sort_order })
            .eq('id', parseInt(item.id, 10)) // courses use numeric id
      );

      const results = await Promise.all(updates);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        logger.error('Failed to reorder some courses', { errors: errors.map(e => e.error) });
        throw new Error('Failed to reorder courses');
      }

      logger.info('Courses reordered successfully');
    } catch (_error) {
      logger.error('Failed to reorder courses', _error);
      throw error;
    }
  }
}
