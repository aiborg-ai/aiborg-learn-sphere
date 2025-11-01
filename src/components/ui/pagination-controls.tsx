import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the Pagination component
 * @interface PaginationProps
 */
export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Current page size */
  pageSize: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Show item count information */
  showItemCount?: boolean;
  /** Maximum number of page buttons to show */
  maxPageButtons?: number;
  /** Additional className */
  className?: string;
  /** Loading state */
  loading?: boolean;
}

/**
 * Pagination component with page navigation and size controls
 * @param {PaginationProps} props - Component props
 * @returns {JSX.Element} Rendered pagination controls
 * @example
 * <Pagination
 *   currentPage={page}
 *   totalPages={totalPages}
 *   totalItems={totalCount}
 *   pageSize={pageSize}
 *   onPageChange={goToPage}
 *   onPageSizeChange={setPageSize}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showItemCount = true,
  maxPageButtons = 7,
  className,
  loading = false,
}: PaginationProps) {
  // Calculate which page buttons to show
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const halfButtons = Math.floor(maxPageButtons / 2);

    if (currentPage <= halfButtons) {
      // Show first pages
      for (let i = 1; i <= maxPageButtons - 2; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage > totalPages - halfButtons) {
      // Show last pages
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - (maxPageButtons - 3); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  // Calculate item range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
      {/* Item count and page size selector */}
      <div className="flex items-center gap-4">
        {showItemCount && (
          <p className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {totalItems} items
          </p>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-muted-foreground">
              Items per page:
            </label>
            <Select
              value={pageSize.toString()}
              onValueChange={value => onPageSizeChange(parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger id="page-size" className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        {/* First page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page number buttons */}
        <div className="flex gap-1">
          {getPageNumbers().map((pageNum, index) =>
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum as number)}
                disabled={loading}
                className="min-w-[40px]"
              >
                {pageNum}
              </Button>
            )
          )}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Simple pagination component with only prev/next buttons
 * @interface SimplePaginationProps
 */
export interface SimplePaginationProps {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * Simple pagination with only previous/next navigation
 * @param {SimplePaginationProps} props - Component props
 * @returns {JSX.Element} Rendered simple pagination
 * @example
 * <SimplePagination
 *   hasNextPage={hasNextPage}
 *   hasPreviousPage={hasPreviousPage}
 *   onNextPage={nextPage}
 *   onPreviousPage={previousPage}
 * />
 */
export function SimplePagination({
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  loading = false,
  className,
}: SimplePaginationProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button variant="outline" onClick={onPreviousPage} disabled={!hasPreviousPage || loading}>
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>

      <Button variant="outline" onClick={onNextPage} disabled={!hasNextPage || loading}>
        Next
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
