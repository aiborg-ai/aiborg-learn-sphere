/**
 * Course Comparison Modal
 * Side-by-side comparison of selected courses
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Star, Clock, Users, Award, ExternalLink, X, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProviderBadge } from './ProviderBadge';
import { PriceDisplay } from './PriceDisplay';
import type { ExternalCourseWithProvider } from '@/types/marketplace';
import { LEVEL_LABELS, MODE_LABELS } from '@/types/marketplace';

interface CourseComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: ExternalCourseWithProvider[];
  onRemoveCourse: (courseId: string) => void;
}

interface ComparisonRow {
  label: string;
  getValue: (course: ExternalCourseWithProvider) => React.ReactNode;
}

const comparisonRows: ComparisonRow[] = [
  {
    label: 'Provider',
    getValue: course => (
      <ProviderBadge provider={course.provider_slug} logoUrl={course.provider_logo_url} size="sm" />
    ),
  },
  {
    label: 'Level',
    getValue: course =>
      course.level ? (
        <Badge variant="outline">{LEVEL_LABELS[course.level]}</Badge>
      ) : (
        <span className="text-muted-foreground">Not specified</span>
      ),
  },
  {
    label: 'Mode',
    getValue: course =>
      course.mode ? (
        <Badge variant="outline">{MODE_LABELS[course.mode]}</Badge>
      ) : (
        <span className="text-muted-foreground">Not specified</span>
      ),
  },
  {
    label: 'Duration',
    getValue: course => (
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>{course.duration_text || 'Not specified'}</span>
      </div>
    ),
  },
  {
    label: 'Rating',
    getValue: course =>
      course.rating ? (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-medium">{course.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">
            ({course.review_count.toLocaleString()})
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground">No ratings</span>
      ),
  },
  {
    label: 'Students',
    getValue: course =>
      course.enrollment_count > 0 ? (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{course.enrollment_count.toLocaleString()}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">Not available</span>
      ),
  },
  {
    label: 'Price',
    getValue: course => (
      <PriceDisplay
        priceType={course.price_type}
        amount={course.price_amount}
        currency={course.price_currency}
        originalPrice={course.original_price}
        compact
        showBadge={false}
      />
    ),
  },
  {
    label: 'Certificate',
    getValue: course =>
      course.certificate_available ? (
        <div className="flex items-center gap-1 text-green-600">
          <Check className="h-5 w-5" />
          <span>Included</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground">
          <X className="h-5 w-5" />
          <span>Not included</span>
        </div>
      ),
  },
  {
    label: 'Language',
    getValue: course => (
      <div className="flex items-center gap-1">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span>{course.language?.toUpperCase() || 'EN'}</span>
      </div>
    ),
  },
];

export function CourseComparisonModal({
  isOpen,
  onClose,
  courses,
  onRemoveCourse,
}: CourseComparisonModalProps) {
  if (courses.length === 0) return null;

  const handleEnroll = (course: ExternalCourseWithProvider) => {
    window.open(course.external_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Compare Courses</DialogTitle>
          <DialogDescription>
            Compare up to 4 courses side by side. Click on a column header to remove a course.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="w-full">
          <div className="min-w-[600px]">
            <table className="w-full border-collapse">
              {/* Course Headers */}
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-32 p-3 text-left text-sm font-medium">Feature</th>
                  {courses.map(course => (
                    <th key={course.id} className="min-w-[200px] p-3 text-center">
                      <div className="relative space-y-3">
                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive/10 hover:bg-destructive/20"
                          onClick={() => onRemoveCourse(course.id)}
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </Button>

                        {/* Thumbnail */}
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="mx-auto h-24 w-full rounded object-cover"
                          />
                        ) : (
                          <div className="mx-auto flex h-24 w-full items-center justify-center rounded bg-muted">
                            <Award className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        {/* Title */}
                        <h4 className="line-clamp-2 text-sm font-semibold">{course.title}</h4>

                        {/* Instructor */}
                        {course.instructor_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            by {course.instructor_name}
                          </p>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Comparison Rows */}
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr key={row.label} className={cn('border-b', index % 2 === 0 && 'bg-muted/30')}>
                    <td className="p-3 text-sm font-medium">{row.label}</td>
                    {courses.map(course => (
                      <td key={course.id} className="p-3 text-center">
                        <div className="flex justify-center">{row.getValue(course)}</div>
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Skills Row */}
                <tr className="border-b">
                  <td className="p-3 text-sm font-medium">Skills</td>
                  {courses.map(course => (
                    <td key={course.id} className="p-3">
                      <div className="flex flex-wrap justify-center gap-1">
                        {course.skills.slice(0, 4).map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {course.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{course.skills.length - 4}
                          </Badge>
                        )}
                        {course.skills.length === 0 && (
                          <span className="text-sm text-muted-foreground">Not specified</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Action Row */}
                <tr className="bg-muted/50">
                  <td className="p-3"></td>
                  {courses.map(course => (
                    <td key={course.id} className="p-3 text-center">
                      <Button onClick={() => handleEnroll(course)} className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Course
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default CourseComparisonModal;
