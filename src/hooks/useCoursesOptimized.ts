import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createQueryBuilder } from '@/lib/database/query-optimizer';
import { logger } from '@/utils/logger';
import { useApiCall } from './useApiCall';

export interface Course {
  id: number;
  title: string;
  description: string;
  audience: string;
  audiences: string[];
  mode: string;
  duration: string;
  price: string;
  level: string;
  start_date: string;
  features: string[];
  category: string;
  keywords: string[];
  prerequisites: string;
  is_active: boolean;
  currently_enrolling: boolean;
  sort_order: number;
  display: boolean;
  created_at: string;
  updated_at: string;
  enrollment_count?: number;
  average_rating?: number;
  instructor?: {
    id: string;
    name: string;
    email: string;
  };
}

interface UseCoursesOptions {
  includeEnrollmentCount?: boolean;
  includeRatings?: boolean;
  includeInstructor?: boolean;
  onlyActive?: boolean;
  category?: string;
  level?: string;
}

/**
 * Optimized hook for fetching courses with related data
 * Avoids N+1 queries by batch-fetching related data
 * @param {UseCoursesOptions} options - Configuration options
 * @returns {object} Courses data and loading state
 */
export const useCoursesOptimized = (options: UseCoursesOptions = {}) => {
  const {
    includeEnrollmentCount = false,
    includeRatings = false,
    includeInstructor = false,
    onlyActive = true,
    category,
    level,
  } = options;

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryBuilder = createQueryBuilder(supabase);
  const { execute: executeQuery } = useApiCall();

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filters
      const filters: Record<string, unknown> = {};
      if (onlyActive) filters.is_active = true;
      filters.display = true; // Always filter by display field
      if (category) filters.category = category;
      if (level) filters.level = level;

      // Fetch courses with audiences using the view
      const { data: coursesData, error: coursesError } = await executeQuery(() =>
        supabase
          .from('courses_with_audiences')
          .select('*')
          .match(filters)
          .order('sort_order', { ascending: true })
      );

      if (coursesError) {
        // Fallback to regular courses table
        const { data: fallbackData, error: fallbackError } = await executeQuery(() =>
          supabase
            .from('courses')
            .select('*')
            .match(filters)
            .order('sort_order', { ascending: true })
        );

        if (fallbackError) throw fallbackError;

        // Transform data for backward compatibility
        const transformedCourses = (fallbackData || []).map(course => ({
          ...course,
          audiences: course.audience ? [course.audience] : [],
        }));

        setCourses(transformedCourses);
        return;
      }

      let processedCourses = coursesData || [];

      // Batch fetch enrollment counts if requested
      if (includeEnrollmentCount && processedCourses.length > 0) {
        const enrollmentCounts = await queryBuilder.batchFetchRelated(
          processedCourses,
          'id',
          'enrollments',
          'course_id'
        );

        processedCourses = processedCourses.map(course => ({
          ...course,
          enrollment_count: enrollmentCounts.get(course.id)?.length || 0,
        }));
      }

      // Batch fetch ratings if requested
      if (includeRatings && processedCourses.length > 0) {
        const { data: ratingsData } = await executeQuery(() =>
          supabase
            .from('course_reviews')
            .select('course_id, rating')
            .in(
              'course_id',
              processedCourses.map(c => c.id)
            )
        );

        if (ratingsData) {
          // Calculate average ratings per course
          const ratingsMap = new Map<number, { total: number; count: number }>();

          interface CourseReview {
            course_id: number;
            rating: number;
          }

          ratingsData.forEach((review: CourseReview) => {
            const current = ratingsMap.get(review.course_id) || { total: 0, count: 0 };
            ratingsMap.set(review.course_id, {
              total: current.total + review.rating,
              count: current.count + 1,
            });
          });

          processedCourses = processedCourses.map(course => {
            const ratings = ratingsMap.get(course.id);
            return {
              ...course,
              average_rating: ratings ? ratings.total / ratings.count : 0,
            };
          });
        }
      }

      // Batch fetch instructor info if requested
      if (includeInstructor && processedCourses.length > 0) {
        const instructorIds = [
          ...new Set(processedCourses.map(c => c.instructor_id).filter(Boolean)),
        ];

        if (instructorIds.length > 0) {
          const { data: instructorsData } = await executeQuery(() =>
            supabase.from('profiles').select('id, display_name, email').in('id', instructorIds)
          );

          if (instructorsData) {
            interface InstructorData {
              id: string;
              display_name?: string;
              email?: string;
            }

            const instructorsMap = new Map(
              instructorsData.map((i: InstructorData) => [
                i.id,
                {
                  id: i.id,
                  name: i.display_name || i.email?.split('@')[0] || 'Unknown',
                  email: i.email,
                },
              ])
            );

            processedCourses = processedCourses.map(course => ({
              ...course,
              instructor: course.instructor_id
                ? instructorsMap.get(course.instructor_id)
                : undefined,
            }));
          }
        }
      }

      // Ensure backward compatibility
      processedCourses = processedCourses.map(course => ({
        ...course,
        audience: course.audiences?.[0] || course.audience || '',
        audiences: course.audiences || (course.audience ? [course.audience] : []),
      }));

      setCourses(processedCourses);
    } catch (err) {
      logger.error('Error fetching courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [
    onlyActive,
    category,
    level,
    includeEnrollmentCount,
    includeRatings,
    includeInstructor,
    executeQuery,
    queryBuilder,
  ]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Utility functions
  const getCourseById = useCallback(
    (id: number) => {
      return courses.find(course => course.id === id);
    },
    [courses]
  );

  const getCoursesByCategory = useCallback(
    (categoryName: string) => {
      return courses.filter(course => course.category === categoryName);
    },
    [courses]
  );

  const getCoursesByLevel = useCallback(
    (levelName: string) => {
      return courses.filter(course => course.level === levelName);
    },
    [courses]
  );

  const getActiveEnrollingCourses = useCallback(() => {
    return courses.filter(course => course.is_active && course.currently_enrolling);
  }, [courses]);

  const searchCourses = useCallback(
    (searchTerm: string) => {
      const term = searchTerm.toLowerCase();
      return courses.filter(
        course =>
          course.title.toLowerCase().includes(term) ||
          course.description.toLowerCase().includes(term) ||
          course.keywords?.some(k => k.toLowerCase().includes(term))
      );
    },
    [courses]
  );

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses,
    getCourseById,
    getCoursesByCategory,
    getCoursesByLevel,
    getActiveEnrollingCourses,
    searchCourses,
  };
};
