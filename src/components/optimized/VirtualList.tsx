import type { ReactNode } from 'react';
import { memo } from 'react';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';

interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the container in pixels */
  containerHeight: number;
  /** Number of items to render outside viewport */
  overscan?: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Optional className for container */
  className?: string;
  /** Optional key extractor */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Loading state */
  loading?: boolean;
  /** Empty state component */
  emptyState?: ReactNode;
  /** Loading component */
  loadingComponent?: ReactNode;
}

/**
 * Virtual List Component
 *
 * High-performance list component that uses windowing to render
 * only visible items. Perfect for large datasets (1000+ items).
 *
 * Features:
 * - Only renders visible items + overscan buffer
 * - Dramatically reduces DOM nodes
 * - Smooth scrolling performance
 * - Supports custom item rendering
 * - Built-in loading and empty states
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={courses}
 *   itemHeight={120}
 *   containerHeight={600}
 *   overscan={5}
 *   renderItem={(course) => (
 *     <CourseCard course={course} />
 *   )}
 *   keyExtractor={(course) => course.id}
 * />
 * ```
 */
export const VirtualList = memo(function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  className = '',
  keyExtractor = (_, index) => index,
  loading = false,
  emptyState,
  loadingComponent,
}: VirtualListProps<T>) {
  const { virtualItems, totalHeight, containerRef } = useVirtualScroll({
    itemCount: items.length,
    itemHeight,
    containerHeight,
    overscan,
  });

  // Show loading state
  if (loading && loadingComponent) {
    return <div className={className}>{loadingComponent}</div>;
  }

  // Show empty state
  if (!loading && items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, start }) => {
          const item = items[index];
          if (!item) return null;

          return (
            <div
              key={keyExtractor(item, index)}
              style={{
                position: 'absolute',
                top: start,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}) as <T>(props: VirtualListProps<T>) => JSX.Element;

/**
 * Virtual Grid Component
 *
 * Similar to VirtualList but renders items in a grid layout
 */
interface VirtualGridProps<T> extends Omit<VirtualListProps<T>, 'itemHeight'> {
  /** Number of columns */
  columns: number;
  /** Height of each row */
  rowHeight: number;
  /** Gap between items in pixels */
  gap?: number;
}

export const VirtualGrid = memo(function VirtualGrid<T>({
  items,
  columns,
  rowHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  className = '',
  keyExtractor = (_, index) => index,
  loading = false,
  emptyState,
  loadingComponent,
  gap = 16,
}: VirtualGridProps<T>) {
  // Calculate number of rows
  const rowCount = Math.ceil(items.length / columns);

  const { virtualItems, totalHeight, containerRef } = useVirtualScroll({
    itemCount: rowCount,
    itemHeight: rowHeight + gap,
    containerHeight,
    overscan,
  });

  if (loading && loadingComponent) {
    return <div className={className}>{loadingComponent}</div>;
  }

  if (!loading && items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index: rowIndex, start }) => {
          const startItemIndex = rowIndex * columns;
          const rowItems = items.slice(startItemIndex, startItemIndex + columns);

          if (rowItems.length === 0) return null;

          return (
            <div
              key={rowIndex}
              style={{
                position: 'absolute',
                top: start,
                left: 0,
                right: 0,
                height: rowHeight,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => {
                const itemIndex = startItemIndex + colIndex;
                return <div key={keyExtractor(item, itemIndex)}>{renderItem(item, itemIndex)}</div>;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}) as <T>(props: VirtualGridProps<T>) => JSX.Element;

/**
 * Infinite Scroll Virtual List
 *
 * Combines virtual scrolling with infinite loading
 */
interface InfiniteVirtualListProps<T> extends VirtualListProps<T> {
  /** Callback when user scrolls near bottom */
  onLoadMore: () => void;
  /** Whether more items are being loaded */
  isLoadingMore?: boolean;
  /** Whether there are more items to load */
  hasMore?: boolean;
  /** Distance from bottom to trigger load (in pixels) */
  loadMoreThreshold?: number;
}

export const InfiniteVirtualList = memo(function InfiniteVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  onLoadMore,
  isLoadingMore = false,
  hasMore = true,
  loadMoreThreshold = 500,
  className = '',
  keyExtractor = (_, index) => index,
  loading = false,
  emptyState,
  loadingComponent,
}: InfiniteVirtualListProps<T>) {
  const { virtualItems, totalHeight, containerRef, visibleRange } = useVirtualScroll({
    itemCount: items.length,
    itemHeight,
    containerHeight,
    overscan,
    onRangeChange: (start, end) => {
      // Trigger load more when scrolled near bottom
      const distanceFromBottom = items.length - end;
      const itemsUntilBottom = distanceFromBottom * itemHeight;

      if (itemsUntilBottom < loadMoreThreshold && hasMore && !isLoadingMore && !loading) {
        onLoadMore();
      }
    },
  });

  if (loading && items.length === 0 && loadingComponent) {
    return <div className={className}>{loadingComponent}</div>;
  }

  if (!loading && items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, start }) => {
          const item = items[index];
          if (!item) return null;

          return (
            <div
              key={keyExtractor(item, index)}
              style={{
                position: 'absolute',
                top: start,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}

        {/* Loading indicator at bottom */}
        {isLoadingMore && (
          <div
            style={{
              position: 'absolute',
              top: items.length * itemHeight,
              left: 0,
              right: 0,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="text-sm text-muted-foreground">Loading more...</div>
          </div>
        )}
      </div>
    </div>
  );
}) as <T>(props: InfiniteVirtualListProps<T>) => JSX.Element;
