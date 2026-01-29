/**
 * Course Marketplace Grid Component
 * Responsive grid of course cards with pagination
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, SortAsc, Grid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExternalCourseCard, ExternalCourseCardSkeleton } from './ExternalCourseCard';
import type {
  ExternalCourseWithProvider,
  MarketplaceSortOption,
  MarketplaceSortField,
  MarketplacePagination,
} from '@/types/marketplace';

interface CourseMarketplaceGridProps {
  courses: ExternalCourseWithProvider[];
  pagination: MarketplacePagination;
  sort: MarketplaceSortOption;
  isLoading?: boolean;
  comparingCourses?: ExternalCourseWithProvider[];
  onSortChange: (sort: MarketplaceSortOption) => void;
  onPageChange: (page: number) => void;
  onFavoriteToggle?: (courseId: string) => void;
  onCompareToggle?: (course: ExternalCourseWithProvider) => void;
  onShare?: (course: ExternalCourseWithProvider) => void;
  onPriceAlert?: (course: ExternalCourseWithProvider) => void;
  className?: string;
}

const SORT_OPTIONS: { value: MarketplaceSortField; label: string }[] = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'enrollment_count', label: 'Most Popular' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'newest', label: 'Newest' },
];

export function CourseMarketplaceGrid({
  courses,
  pagination,
  sort,
  isLoading = false,
  comparingCourses = [],
  onSortChange,
  onPageChange,
  onFavoriteToggle,
  onCompareToggle,
  onShare,
  onPriceAlert,
  className,
}: CourseMarketplaceGridProps) {
  const comparingIds = new Set(comparingCourses.map(c => c.id));

  const handleSortChange = (value: string) => {
    // Handle price separately since we want ascending
    if (value === 'price') {
      onSortChange({ field: 'price', direction: 'asc' });
    } else {
      onSortChange({ field: value as MarketplaceSortField, direction: 'desc' });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const { page, totalPages } = pagination;
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('ellipsis');
      }

      // Pages around current
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Sort and Results Count */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <span>Loading courses...</span>
          ) : (
            <span>
              Showing{' '}
              <span className="font-medium text-foreground">
                {(pagination.page - 1) * pagination.pageSize + 1}-
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>{' '}
              of <span className="font-medium text-foreground">{pagination.total}</span> courses
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-muted-foreground" />
          <Select value={sort.field} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ExternalCourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Grid className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No courses found</h3>
          <p className="text-center text-sm text-muted-foreground">
            Try adjusting your filters or search query to find more courses.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <ExternalCourseCard
              key={course.id}
              course={course}
              onFavoriteToggle={onFavoriteToggle}
              onCompareToggle={onCompareToggle}
              onShare={onShare}
              onPriceAlert={onPriceAlert}
              isComparing={comparingIds.has(course.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum, idx) =>
              pageNum === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => onPageChange(pageNum)}
                  className="h-9 w-9"
                >
                  {pageNum}
                </Button>
              )
            )}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default CourseMarketplaceGrid;
