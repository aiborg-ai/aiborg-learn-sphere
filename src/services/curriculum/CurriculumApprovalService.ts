import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Curriculum Approval Service
 * Handles user approval/rejection of AI-recommended courses
 */

export interface CurriculumCourse {
  id: string;
  curriculum_id: string;
  course_id: number;
  sequence_order: number;
  module_name?: string;
  recommendation_score: number;
  recommendation_reason: string;
  skill_gaps_addressed: string[];
  user_approved: boolean | null;
  user_notes?: string;
  is_required: boolean;
}

export interface Curriculum {
  id: string;
  user_id: string;
  profile_id: string;
  curriculum_name: string;
  description?: string;
  generated_by_ai: boolean;
  ai_confidence_score: number;
  estimated_completion_weeks: number;
  estimated_total_hours: number;
  total_courses: number;
  required_courses_count: number;
  elective_courses_count: number;
  is_active: boolean;
  is_published: boolean;
  progress_percentage: number;
  courses_completed: number;
  created_at: string;
  updated_at: string;
}

export interface CurriculumWithCourses extends Curriculum {
  courses: CurriculumCourse[];
  modules: {
    module_name: string;
    course_count: number;
  }[];
}

class CurriculumApprovalService {
  /**
   * Get curriculum with all courses
   */
  async getCurriculum(curriculumId: string): Promise<CurriculumWithCourses | null> {
    try {
      const { data: curriculum, error: curriculumError } = await supabase
        .from('user_curricula')
        .select('*')
        .eq('id', curriculumId)
        .single();

      if (curriculumError) throw curriculumError;

      const { data: courses, error: coursesError } = await supabase
        .from('curriculum_courses')
        .select(
          `
          *,
          course:courses(*)
        `
        )
        .eq('curriculum_id', curriculumId)
        .order('sequence_order', { ascending: true });

      if (coursesError) throw coursesError;

      // Group courses by module
      const modules = this.groupCoursesByModule(courses || []);

      return {
        ...(curriculum as Curriculum),
        courses: (courses || []) as CurriculumCourse[],
        modules,
      };
    } catch (error) {
      logger.error('Error fetching curriculum:', error);
      return null;
    }
  }

  /**
   * Approve a course in curriculum
   */
  async approveCourse(curriculumId: string, courseId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('curriculum_courses')
        .update({
          user_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq('curriculum_id', curriculumId)
        .eq('course_id', courseId);

      if (error) throw error;

      logger.info(`Course ${courseId} approved in curriculum ${curriculumId}`);
    } catch (error) {
      logger.error('Error approving course:', error);
      throw error;
    }
  }

  /**
   * Reject a course in curriculum
   */
  async rejectCourse(curriculumId: string, courseId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('curriculum_courses')
        .update({
          user_approved: false,
          updated_at: new Date().toISOString(),
        })
        .eq('curriculum_id', curriculumId)
        .eq('course_id', courseId);

      if (error) throw error;

      logger.info(`Course ${courseId} rejected in curriculum ${curriculumId}`);
    } catch (error) {
      logger.error('Error rejecting course:', error);
      throw error;
    }
  }

  /**
   * Bulk approve multiple courses
   */
  async bulkApprove(curriculumId: string, courseIds: number[]): Promise<void> {
    try {
      const updates = courseIds.map(courseId =>
        supabase
          .from('curriculum_courses')
          .update({
            user_approved: true,
            updated_at: new Date().toISOString(),
          })
          .eq('curriculum_id', curriculumId)
          .eq('course_id', courseId)
      );

      await Promise.all(updates);

      logger.info(`Bulk approved ${courseIds.length} courses in curriculum ${curriculumId}`);
    } catch (error) {
      logger.error('Error bulk approving courses:', error);
      throw error;
    }
  }

  /**
   * Bulk reject multiple courses
   */
  async bulkReject(curriculumId: string, courseIds: number[]): Promise<void> {
    try {
      const updates = courseIds.map(courseId =>
        supabase
          .from('curriculum_courses')
          .update({
            user_approved: false,
            updated_at: new Date().toISOString(),
          })
          .eq('curriculum_id', curriculumId)
          .eq('course_id', courseId)
      );

      await Promise.all(updates);

      logger.info(`Bulk rejected ${courseIds.length} courses in curriculum ${curriculumId}`);
    } catch (error) {
      logger.error('Error bulk rejecting courses:', error);
      throw error;
    }
  }

  /**
   * Add user notes to a course
   */
  async addCourseNotes(curriculumId: string, courseId: number, notes: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('curriculum_courses')
        .update({
          user_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('curriculum_id', curriculumId)
        .eq('course_id', courseId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error adding course notes:', error);
      throw error;
    }
  }

  /**
   * Publish curriculum (finalize user choices)
   */
  async publishCurriculum(curriculumId: string): Promise<Curriculum> {
    try {
      // Get curriculum with courses
      const curriculumData = await this.getCurriculum(curriculumId);
      if (!curriculumData) throw new Error('Curriculum not found');

      // Count approved and rejected courses
      const approvedCount = curriculumData.courses.filter(c => c.user_approved === true).length;
      const rejectedCount = curriculumData.courses.filter(c => c.user_approved === false).length;

      if (approvedCount === 0) {
        throw new Error('Cannot publish curriculum with no approved courses');
      }

      // Delete rejected courses
      if (rejectedCount > 0) {
        const rejectedIds = curriculumData.courses
          .filter(c => c.user_approved === false)
          .map(c => c.id);

        const { error: deleteError } = await supabase
          .from('curriculum_courses')
          .delete()
          .in('id', rejectedIds);

        if (deleteError) throw deleteError;
      }

      // Set all pending courses to approved if user didn't explicitly reject
      const { error: defaultApproveError } = await supabase
        .from('curriculum_courses')
        .update({ user_approved: true })
        .eq('curriculum_id', curriculumId)
        .is('user_approved', null);

      if (defaultApproveError) throw defaultApproveError;

      // Publish curriculum
      const { data: published, error: publishError } = await supabase
        .from('user_curricula')
        .update({
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', curriculumId)
        .select()
        .single();

      if (publishError) throw publishError;

      logger.info(`Curriculum ${curriculumId} published with ${approvedCount} approved courses`);
      return published as Curriculum;
    } catch (error) {
      logger.error('Error publishing curriculum:', error);
      throw error;
    }
  }

  /**
   * Add custom course to curriculum (not AI-recommended)
   */
  async addCustomCourse(
    curriculumId: string,
    courseId: number,
    options?: {
      module_name?: string;
      is_required?: boolean;
      user_notes?: string;
    }
  ): Promise<void> {
    try {
      // Get next sequence order
      const { data: existingCourses } = await supabase
        .from('curriculum_courses')
        .select('sequence_order')
        .eq('curriculum_id', curriculumId)
        .order('sequence_order', { ascending: false })
        .limit(1);

      const nextOrder =
        existingCourses && existingCourses.length > 0 ? existingCourses[0].sequence_order + 1 : 1;

      const { error } = await supabase.from('curriculum_courses').insert({
        curriculum_id: curriculumId,
        course_id: courseId,
        sequence_order: nextOrder,
        module_name: options?.module_name,
        ai_recommended: false,
        recommendation_score: 0,
        recommendation_reason: 'Manually added by user',
        user_approved: true,
        is_required: options?.is_required || false,
        user_notes: options?.user_notes,
      });

      if (error) throw error;

      logger.info(`Custom course ${courseId} added to curriculum ${curriculumId}`);
    } catch (error) {
      logger.error('Error adding custom course:', error);
      throw error;
    }
  }

  /**
   * Remove course from curriculum
   */
  async removeCourse(curriculumId: string, courseId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('curriculum_courses')
        .delete()
        .eq('curriculum_id', curriculumId)
        .eq('course_id', courseId);

      if (error) throw error;

      logger.info(`Course ${courseId} removed from curriculum ${curriculumId}`);
    } catch (error) {
      logger.error('Error removing course:', error);
      throw error;
    }
  }

  /**
   * Reorder courses in curriculum
   */
  async reorderCourses(
    curriculumId: string,
    courseOrders: Array<{ course_id: number; new_order: number }>
  ): Promise<void> {
    try {
      const updates = courseOrders.map(({ course_id, new_order }) =>
        supabase
          .from('curriculum_courses')
          .update({ sequence_order: new_order })
          .eq('curriculum_id', curriculumId)
          .eq('course_id', course_id)
      );

      await Promise.all(updates);

      logger.info(`Reordered ${courseOrders.length} courses in curriculum ${curriculumId}`);
    } catch (error) {
      logger.error('Error reordering courses:', error);
      throw error;
    }
  }

  /**
   * Get curriculum statistics
   */
  async getCurriculumStats(curriculumId: string): Promise<{
    total_courses: number;
    approved_courses: number;
    rejected_courses: number;
    pending_courses: number;
    avg_recommendation_score: number;
  }> {
    try {
      const curriculumData = await this.getCurriculum(curriculumId);
      if (!curriculumData) throw new Error('Curriculum not found');

      const courses = curriculumData.courses;
      const approved = courses.filter(c => c.user_approved === true).length;
      const rejected = courses.filter(c => c.user_approved === false).length;
      const pending = courses.filter(c => c.user_approved === null).length;

      const avgScore =
        courses.length > 0
          ? courses.reduce((sum, c) => sum + c.recommendation_score, 0) / courses.length
          : 0;

      return {
        total_courses: courses.length,
        approved_courses: approved,
        rejected_courses: rejected,
        pending_courses: pending,
        avg_recommendation_score: Math.round(avgScore * 100) / 100,
      };
    } catch (error) {
      logger.error('Error getting curriculum stats:', error);
      throw error;
    }
  }

  /**
   * Helper: Group courses by module
   */

  private groupCoursesByModule(
    courses: Record<string, unknown>[]
  ): Array<{ module_name: string; course_count: number }> {
    const moduleMap = new Map<string, number>();

    courses.forEach(course => {
      const moduleName = course.module_name || 'Ungrouped';
      moduleMap.set(moduleName, (moduleMap.get(moduleName) || 0) + 1);
    });

    return Array.from(moduleMap.entries()).map(([module_name, course_count]) => ({
      module_name,
      course_count,
    }));
  }

  /**
   * Activate/deactivate curriculum
   */
  async toggleCurriculumActive(curriculumId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_curricula')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', curriculumId);

      if (error) throw error;

      logger.info(`Curriculum ${curriculumId} ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      logger.error('Error toggling curriculum active status:', error);
      throw error;
    }
  }

  /**
   * Delete curriculum
   */
  async deleteCurriculum(curriculumId: string): Promise<void> {
    try {
      // Courses will be deleted automatically via CASCADE
      const { error } = await supabase.from('user_curricula').delete().eq('id', curriculumId);

      if (error) throw error;

      logger.info(`Curriculum ${curriculumId} deleted`);
    } catch (error) {
      logger.error('Error deleting curriculum:', error);
      throw error;
    }
  }
}

export const curriculumApprovalService = new CurriculumApprovalService();
