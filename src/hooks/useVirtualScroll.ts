import { useState, useEffect, useRef, useCallback } from 'react';

export interface VirtualScrollOptions {
  /** Total number of items in the list */
  itemCount: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the scrollable container in pixels */
  containerHeight: number;
  /** Number of items to render outside viewport (buffer) */
  overscan?: number;
  /** Callback when visible range changes */
  onRangeChange?: (start: number, end: number) => void;
}

export interface VirtualScrollResult {
  /** Items to render (with their indices) */
  virtualItems: Array<{
    index: number;
    start: number;
    size: number;
  }>;
  /** Total height of all items */
  totalHeight: number;
  /** Ref to attach to scrollable container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Scroll to specific item */
  scrollToItem: (index: number, align?: 'start' | 'center' | 'end') => void;
  /** Currently visible range */
  visibleRange: { start: number; end: number };
}

/**
 * Custom hook for virtual scrolling
 *
 * Implements windowing technique to render only visible items,
 * dramatically improving performance for long lists.
 *
 * @example
 * ```tsx
 * const { virtualItems, totalHeight, containerRef } = useVirtualScroll({
 *   itemCount: 10000,
 *   itemHeight: 50,
 *   containerHeight: 600,
 *   overscan: 5
 * });
 *
 * return (
 *   <div ref={containerRef} style={{ height: 600, overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       {virtualItems.map(({ index, start }) => (
 *         <div
 *           key={index}
 *           style={{ position: 'absolute', top: start, height: itemHeight }}
 *         >
 *           {items[index]}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
  onRangeChange,
}: VirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate total height
  const totalHeight = itemCount * itemHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Generate virtual items
  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      start: i * itemHeight,
      size: itemHeight,
    });
  }

  // Handle scroll event
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Notify range changes
  useEffect(() => {
    if (onRangeChange) {
      onRangeChange(startIndex, endIndex);
    }
  }, [startIndex, endIndex, onRangeChange]);

  // Scroll to specific item
  const scrollToItem = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (!containerRef.current) return;

      const itemTop = index * itemHeight;
      let scrollTo = itemTop;

      if (align === 'center') {
        scrollTo = itemTop - containerHeight / 2 + itemHeight / 2;
      } else if (align === 'end') {
        scrollTo = itemTop - containerHeight + itemHeight;
      }

      containerRef.current.scrollTo({
        top: Math.max(0, scrollTo),
        behavior: 'smooth',
      });
    },
    [itemHeight, containerHeight]
  );

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToItem,
    visibleRange: { start: startIndex, end: endIndex },
  };
}

/**
 * Hook for variable height virtual scrolling
 *
 * More complex but handles items with different heights
 */
export interface VariableVirtualScrollOptions {
  itemCount: number;
  estimateItemHeight: (index: number) => number;
  containerHeight: number;
  overscan?: number;
}

export function useVariableVirtualScroll({
  itemCount,
  estimateItemHeight,
  containerHeight,
  overscan = 3,
}: VariableVirtualScrollOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(
    new Map()
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Calculate item positions
  const getItemOffset = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += measuredHeights.get(i) ?? estimateItemHeight(i);
      }
      return offset;
    },
    [measuredHeights, estimateItemHeight]
  );

  // Calculate total height
  const totalHeight = getItemOffset(itemCount);

  // Find visible range
  const findVisibleRange = useCallback(() => {
    let start = 0;
    let end = 0;
    let currentOffset = 0;

    // Find start index
    for (let i = 0; i < itemCount; i++) {
      const height = measuredHeights.get(i) ?? estimateItemHeight(i);
      if (currentOffset + height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      currentOffset += height;
    }

    // Find end index
    currentOffset = getItemOffset(start);
    for (let i = start; i < itemCount; i++) {
      const height = measuredHeights.get(i) ?? estimateItemHeight(i);
      if (currentOffset > scrollTop + containerHeight) {
        end = Math.min(itemCount - 1, i + overscan);
        break;
      }
      currentOffset += height;
    }

    return { start, end: end || itemCount - 1 };
  }, [
    scrollTop,
    itemCount,
    containerHeight,
    overscan,
    measuredHeights,
    estimateItemHeight,
    getItemOffset,
  ]);

  const { start: startIndex, end: endIndex } = findVisibleRange();

  // Generate virtual items
  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      start: getItemOffset(i),
      size: measuredHeights.get(i) ?? estimateItemHeight(i),
    });
  }

  // Measure item heights
  const measureItem = useCallback((index: number, element: HTMLElement) => {
    const height = element.getBoundingClientRect().height;
    setMeasuredHeights((prev) => {
      const next = new Map(prev);
      next.set(index, height);
      return next;
    });
    itemRefs.current.set(index, element);
  }, []);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    virtualItems,
    totalHeight,
    containerRef,
    measureItem,
    visibleRange: { start: startIndex, end: endIndex },
  };
}
