import { useMemo } from 'react';
import type { Enrollment } from '@/types/enrollment';

interface UseCourseEnrollmentReturn {
  isEnrolled: boolean;
  enrollment: Enrollment | undefined;
}

/**
 * Custom hook to check if a user is enrolled in a specific course
 *
 * Uses useMemo to prevent unnecessary recalculations when
 * enrollments array or courseId hasn't changed.
 *
 * @param courseId - The ID of the course to check
 * @param enrollments - Array of user's enrollments
 * @returns Enrollment status and enrollment details if enrolled
 *
 * @example
 * ```tsx
 * const { isEnrolled, enrollment } = useCourseEnrollment(courseId, enrollments);
 *
 * if (!isEnrolled) {
 *   return <EnrollmentRequired courseId={courseId} />;
 * }
 *
 * return <CourseContent enrollment={enrollment} />;
 * ```
 */
export function useCourseEnrollment(
  courseId: string | undefined,
  enrollments: Enrollment[] | undefined
): UseCourseEnrollmentReturn {
  const result = useMemo(() => {
    if (!courseId || !enrollments) {
      return { isEnrolled: false, enrollment: undefined };
    }

    const numericCourseId = parseInt(courseId, 10);
    const enrollment = enrollments.find(e => e.course_id === numericCourseId);

    return {
      isEnrolled: !!enrollment,
      enrollment,
    };
  }, [courseId, enrollments]);

  return result;
}
