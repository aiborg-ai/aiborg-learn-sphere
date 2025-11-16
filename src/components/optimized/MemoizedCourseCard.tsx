import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OfflineBadge } from '@/components/offline/OfflineBadge';
import { useOfflineContent } from '@/hooks/useOfflineContent';
import type { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: number) => void;
  onViewDetails?: (courseId: number) => void;
}

/**
 * Memoized Course Card Component
 *
 * This component is optimized with React.memo to prevent unnecessary re-renders.
 * It will only re-render if the course prop changes or if the callback functions change.
 *
 * Performance Benefits:
 * - Prevents re-renders when parent component updates
 * - Reduces Virtual DOM reconciliation
 * - Improves list rendering performance
 */
export const MemoizedCourseCard = memo<CourseCardProps>(
  function CourseCard({ course, onEnroll, onViewDetails }) {
    const { isDownloaded } = useOfflineContent(course.id.toString(), 'course');

    return (
      <article aria-label={`Course: ${course.title}`}>
        <Card className="h-full hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
                  <OfflineBadge isOffline={isDownloaded} variant="secondary" showIcon={true} />
                </div>
                <CardDescription
                  className="mt-2"
                  aria-label={`Course details: ${course.level} level, ${course.duration} duration`}
                >
                  {course.level} • {course.duration}
                </CardDescription>
              </div>
              {course.is_featured && (
                <Badge variant="default" aria-label="Featured course">
                  Featured
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>

            <ul className="flex flex-wrap gap-2" aria-label="Target audiences">
              {course.audiences.slice(0, 3).map(audience => (
                <li key={audience} className="list-none">
                  <Badge variant="secondary">{audience}</Badge>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between pt-4">
              <span className="text-lg font-semibold" aria-label={`Course price: ${course.price}`}>
                {course.price}
              </span>
              <div className="flex gap-2" aria-label="Course actions">
                {onViewDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(course.id)}
                    aria-label={`View details for ${course.title}`}
                  >
                    Details
                  </Button>
                )}
                {onEnroll && (
                  <Button
                    size="sm"
                    onClick={() => onEnroll(course.id)}
                    aria-label={`Enroll in ${course.title}`}
                  >
                    Enroll
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </article>
    );
  },
  // Custom comparison function
  (prevProps, nextProps) => {
    // Only re-render if course data actually changed
    return (
      prevProps.course.id === nextProps.course.id &&
      prevProps.course.title === nextProps.course.title &&
      prevProps.course.is_featured === nextProps.course.is_featured &&
      prevProps.onEnroll === nextProps.onEnroll &&
      prevProps.onViewDetails === nextProps.onViewDetails
    );
  }
);

MemoizedCourseCard.displayName = 'MemoizedCourseCard';
