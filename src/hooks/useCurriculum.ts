import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';
import {
  curriculumGenerationService,
  CurriculumGenerationJob,
} from '@/services/curriculum/CurriculumGenerationService';
import {
  curriculumApprovalService,
  Curriculum,
  CurriculumWithCourses,
} from '@/services/curriculum/CurriculumApprovalService';

/**
 * Custom hook for managing user curricula
 */
export const useCurriculum = (curriculumId?: string) => {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [currentCurriculum, setCurrentCurriculum] = useState<CurriculumWithCourses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  /**
   * Fetch all curricula for user
   */
  const fetchCurricula = useCallback(async () => {
    if (!user) {
      setCurricula([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_curricula')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCurricula((data || []) as Curriculum[]);
    } catch (err) {
      logger.error('Error fetching curricula:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch curricula');
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Fetch specific curriculum with courses
   */
  const fetchCurriculum = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const curriculum = await curriculumApprovalService.getCurriculum(id);
      setCurrentCurriculum(curriculum);
    } catch (err) {
      logger.error('Error fetching curriculum:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch curriculum');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (curriculumId) {
      fetchCurriculum(curriculumId);
    } else {
      fetchCurricula();
    }
  }, [curriculumId, fetchCurriculum, fetchCurricula]);

  /**
   * Generate new curriculum for a profile
   */
  const generateCurriculum = async (profileId: string): Promise<CurriculumGenerationJob> => {
    try {
      const job = await curriculumGenerationService.generateCurriculum(profileId);
      return job;
    } catch (err) {
      logger.error('Error generating curriculum:', err);
      throw err;
    }
  };

  /**
   * Check generation job status
   */
  const checkGenerationStatus = async (jobId: string): Promise<CurriculumGenerationJob> => {
    try {
      return await curriculumGenerationService.getGenerationStatus(jobId);
    } catch (err) {
      logger.error('Error checking generation status:', err);
      throw err;
    }
  };

  /**
   * Approve a course
   */
  const approveCourse = async (currId: string, courseId: number): Promise<void> => {
    try {
      await curriculumApprovalService.approveCourse(currId, courseId);

      // Refresh current curriculum if it matches
      if (currentCurriculum?.id === currId) {
        await fetchCurriculum(currId);
      }
    } catch (err) {
      logger.error('Error approving course:', err);
      throw err;
    }
  };

  /**
   * Reject a course
   */
  const rejectCourse = async (currId: string, courseId: number): Promise<void> => {
    try {
      await curriculumApprovalService.rejectCourse(currId, courseId);

      // Refresh current curriculum if it matches
      if (currentCurriculum?.id === currId) {
        await fetchCurriculum(currId);
      }
    } catch (err) {
      logger.error('Error rejecting course:', err);
      throw err;
    }
  };

  /**
   * Bulk approve courses
   */
  const bulkApproveCourses = async (currId: string, courseIds: number[]): Promise<void> => {
    try {
      await curriculumApprovalService.bulkApprove(currId, courseIds);

      if (currentCurriculum?.id === currId) {
        await fetchCurriculum(currId);
      }
    } catch (err) {
      logger.error('Error bulk approving courses:', err);
      throw err;
    }
  };

  /**
   * Publish curriculum
   */
  const publishCurriculum = async (currId: string): Promise<Curriculum> => {
    try {
      const published = await curriculumApprovalService.publishCurriculum(currId);
      await fetchCurricula(); // Refresh list
      return published;
    } catch (err) {
      logger.error('Error publishing curriculum:', err);
      throw err;
    }
  };

  /**
   * Add custom course
   */
  const addCustomCourse = async (
    currId: string,
    courseId: number,
    options?: {
      module_name?: string;
      is_required?: boolean;
      user_notes?: string;
    }
  ): Promise<void> => {
    try {
      await curriculumApprovalService.addCustomCourse(currId, courseId, options);

      if (currentCurriculum?.id === currId) {
        await fetchCurriculum(currId);
      }
    } catch (err) {
      logger.error('Error adding custom course:', err);
      throw err;
    }
  };

  /**
   * Remove course
   */
  const removeCourse = async (currId: string, courseId: number): Promise<void> => {
    try {
      await curriculumApprovalService.removeCourse(currId, courseId);

      if (currentCurriculum?.id === currId) {
        await fetchCurriculum(currId);
      }
    } catch (err) {
      logger.error('Error removing course:', err);
      throw err;
    }
  };

  /**
   * Toggle curriculum active status
   */
  const toggleActive = async (currId: string, isActive: boolean): Promise<void> => {
    try {
      await curriculumApprovalService.toggleCurriculumActive(currId, isActive);
      await fetchCurricula();
    } catch (err) {
      logger.error('Error toggling curriculum:', err);
      throw err;
    }
  };

  /**
   * Delete curriculum
   */
  const deleteCurriculum = async (currId: string): Promise<void> => {
    try {
      await curriculumApprovalService.deleteCurriculum(currId);
      await fetchCurricula();
    } catch (err) {
      logger.error('Error deleting curriculum:', err);
      throw err;
    }
  };

  /**
   * Get curriculum statistics
   */
  const getStats = async (currId: string) => {
    try {
      return await curriculumApprovalService.getCurriculumStats(currId);
    } catch (err) {
      logger.error('Error getting curriculum stats:', err);
      throw err;
    }
  };

  return {
    curricula,
    currentCurriculum,
    loading,
    error,
    generateCurriculum,
    checkGenerationStatus,
    approveCourse,
    rejectCourse,
    bulkApproveCourses,
    publishCurriculum,
    addCustomCourse,
    removeCourse,
    toggleActive,
    deleteCurriculum,
    getStats,
    refetch: curriculumId ? () => fetchCurriculum(curriculumId) : fetchCurricula,
  };
};
