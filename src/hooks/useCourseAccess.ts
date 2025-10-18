/**
 * useCourseAccess Hook
 *
 * Enhanced course access checking that includes:
 * - Individual course enrollment
 * - Membership-based access (Family Pass)
 * - Free course access
 *
 * This hook determines if a user can access a course through any method.
 */

import { useMemo } from 'react';
import type { Enrollment } from '@/types/enrollment';
import type { Course } from '@/types/course';
import { useHasActiveMembership } from './useMembership';

export type AccessSource = 'enrollment' | 'membership' | 'free' | 'none';

interface UseCourseAccessReturn {
  /**
   * Whether user has access to the course
   */
  hasAccess: boolean;

  /**
   * How the user gained access
   */
  accessSource: AccessSource;

  /**
   * The enrollment record (if access is via enrollment)
   */
  enrollment: Enrollment | undefined;

  /**
   * Whether user is enrolled directly
   */
  isEnrolled: boolean;

  /**
   * Whether user has access via membership
   */
  hasMembershipAccess: boolean;

  /**
   * Whether the course is free
   */
  isFree: boolean;

  /**
   * Loading state
   */
  isLoading: boolean;
}

/**
 * Check if a user has access to a course
 *
 * Access can be granted through:
 * 1. Direct course enrollment
 * 2. Active family membership (all courses included)
 * 3. Free course (no enrollment required)
 *
 * @param courseId - The ID of the course to check
 * @param enrollments - Array of user's enrollments
 * @param course - The course object (optional, for free course checking)
 * @returns Access status and details
 *
 * @example
 * ```tsx
 * const { hasAccess, accessSource, isLoading } = useCourseAccess(
 *   courseId,
 *   enrollments,
 *   course
 * );
 *
 * if (isLoading) {
 *   return <LoadingSpinner />;
 * }
 *
 * if (!hasAccess) {
 *   return <EnrollmentRequired courseId={courseId} />;
 * }
 *
 * // Show badge indicating access source
 * {accessSource === 'membership' && (
 *   <Badge>Included in Your Family Pass</Badge>
 * )}
 *
 * return <CourseContent />;
 * ```
 */
export function useCourseAccess(
  courseId: string | undefined,
  enrollments: Enrollment[] | undefined,
  course?: Course | null
): UseCourseAccessReturn {
  // Check if user has active membership
  const {
    data: hasMembershipAccess,
    isLoading: membershipLoading,
  } = useHasActiveMembership();

  const result = useMemo(() => {
    // If no course ID, no access
    if (!courseId) {
      return {
        hasAccess: false,
        accessSource: 'none' as AccessSource,
        enrollment: undefined,
        isEnrolled: false,
        hasMembershipAccess: false,
        isFree: false,
        isLoading: membershipLoading,
      };
    }

    // Check if course is free
    const isFree =
      course?.price?.toLowerCase() === 'free' || course?.price === '£0';

    // Check for direct enrollment
    const numericCourseId = parseInt(courseId, 10);
    const enrollment = enrollments?.find((e) => e.course_id === numericCourseId);
    const isEnrolled = !!enrollment;

    // Determine access source and access status
    let hasAccess = false;
    let accessSource: AccessSource = 'none';

    if (isEnrolled) {
      // Primary: Direct enrollment
      hasAccess = true;
      accessSource = 'enrollment';
    } else if (hasMembershipAccess) {
      // Secondary: Membership access (Family Pass includes all courses)
      hasAccess = true;
      accessSource = 'membership';
    } else if (isFree) {
      // Tertiary: Free courses
      hasAccess = true;
      accessSource = 'free';
    }

    return {
      hasAccess,
      accessSource,
      enrollment,
      isEnrolled,
      hasMembershipAccess: hasMembershipAccess || false,
      isFree,
      isLoading: membershipLoading,
    };
  }, [courseId, enrollments, course, hasMembershipAccess, membershipLoading]);

  return result;
}

/**
 * Check if user should be prompted to enroll
 *
 * User should see enrollment prompt if:
 * - They don't have access (not enrolled, no membership)
 * - AND course is not free
 *
 * @param courseId - The ID of the course
 * @param enrollments - User's enrollments
 * @param course - The course object
 * @returns Whether to show enrollment prompt
 *
 * @example
 * ```tsx
 * const shouldEnroll = useShouldEnroll(courseId, enrollments, course);
 *
 * if (shouldEnroll) {
 *   return <EnrollmentPrompt course={course} />;
 * }
 * ```
 */
export function useShouldEnroll(
  courseId: string | undefined,
  enrollments: Enrollment[] | undefined,
  course?: Course | null
): boolean {
  const { hasAccess, isFree, isLoading } = useCourseAccess(
    courseId,
    enrollments,
    course
  );

  if (isLoading) return false;

  // Show enrollment prompt if no access and not free
  return !hasAccess && !isFree;
}

/**
 * Get access badge props for UI display
 *
 * @param accessSource - The source of access
 * @returns Badge text and variant
 *
 * @example
 * ```tsx
 * const { hasAccess, accessSource } = useCourseAccess(...);
 * const badge = getAccessBadge(accessSource);
 *
 * {hasAccess && badge && (
 *   <Badge variant={badge.variant}>{badge.text}</Badge>
 * )}
 * ```
 */
export function getAccessBadge(accessSource: AccessSource): {
  text: string;
  variant: 'default' | 'secondary' | 'outline' | 'success';
} | null {
  switch (accessSource) {
    case 'enrollment':
      return {
        text: 'Enrolled',
        variant: 'success',
      };
    case 'membership':
      return {
        text: 'Included in Your Family Pass',
        variant: 'default',
      };
    case 'free':
      return {
        text: 'Free Course',
        variant: 'outline',
      };
    case 'none':
      return null;
    default:
      return null;
  }
}
