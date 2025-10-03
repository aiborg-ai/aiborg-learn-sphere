import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    return (
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
              <CardDescription className="mt-2">
                {course.level} • {course.duration}
              </CardDescription>
            </div>
            {course.is_featured && (
              <Badge variant="default">Featured</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {course.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {course.audiences.slice(0, 3).map((audience) => (
              <Badge key={audience} variant="secondary">
                {audience}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-lg font-semibold">{course.price}</span>
            <div className="flex gap-2">
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(course.id)}
                >
                  Details
                </Button>
              )}
              {onEnroll && (
                <Button
                  size="sm"
                  onClick={() => onEnroll(course.id)}
                >
                  Enroll
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
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
