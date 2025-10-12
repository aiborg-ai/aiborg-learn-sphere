import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  Course,
  UserProgress,
  CourseMaterial,
  Assignment,
} from '@/components/course-page/types';

interface CourseDataState {
  course: Course | null;
  progress: UserProgress | null;
  materials: CourseMaterial[];
  assignments: Assignment[];
}

interface UseCourseDataReturn extends CourseDataState {
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage course-related data
 *
 * Consolidates all course data fetching logic into a single hook
 * for better performance and code organization.
 *
 * @param courseId - The ID of the course to fetch
 * @param userId - The ID of the current user
 * @returns Course data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { course, materials, loading, error, refetch } = useCourseData(courseId, userId);
 *
 * if (loading) return <Loader />;
 * if (error) return <Error message={error.message} onRetry={refetch} />;
 * if (!course) return <NotFound />;
 *
 * return <CourseContent course={course} materials={materials} />;
 * ```
 */
export function useCourseData(
  courseId: string | undefined,
  userId: string | undefined
): UseCourseDataReturn {
  const [state, setState] = useState<CourseDataState>({
    course: null,
    progress: null,
    materials: [],
    assignments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourseData = useCallback(async () => {
    if (!courseId || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel for better performance
      const [courseResult, progressResult, materialsResult, assignmentsResult] =
        await Promise.allSettled([
          supabase.from('courses').select('*').eq('id', courseId).single(),
          supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .single(),
          supabase
            .from('course_materials')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true }),
          supabase
            .from('homework_assignments')
            .select('*')
            .eq('course_id', courseId)
            .order('due_date', { ascending: true }),
        ]);

      // Handle course fetch (required)
      if (courseResult.status === 'rejected') {
        throw new Error('Failed to fetch course data');
      }

      const { data: courseData, error: courseError } = courseResult.value;
      if (courseError) {
        throw new Error(`Failed to load course: ${courseError.message}`);
      }

      // Handle optional data (progress, materials, assignments)
      const progressData =
        progressResult.status === 'fulfilled' && !progressResult.value.error
          ? progressResult.value.data
          : null;

      const materialsData =
        materialsResult.status === 'fulfilled' && !materialsResult.value.error
          ? materialsResult.value.data || []
          : [];

      const assignmentsData =
        assignmentsResult.status === 'fulfilled' && !assignmentsResult.value.error
          ? assignmentsResult.value.data || []
          : [];

      setState({
        course: courseData,
        progress: progressData,
        materials: materialsData,
        assignments: assignmentsData,
      });

      logger.log('[useCourseData] Course data fetched successfully', {
        courseId,
        materialCount: materialsData.length,
        assignmentCount: assignmentsData.length,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      logger.error('[useCourseData] Error fetching course data:', {
        error: err,
        courseId,
        userId,
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, userId]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  return {
    ...state,
    loading,
    error,
    refetch: fetchCourseData,
  };
}
