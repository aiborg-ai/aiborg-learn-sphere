/**
 * PrefetchLink Component
 *
 * Enhanced Link component that prefetches data on hover before navigation.
 * Improves perceived performance by loading data before the user clicks.
 *
 * Features:
 * - Automatic prefetching on hover with configurable delay
 * - Cancels prefetch if mouse leaves quickly (prevents waste)
 * - Fallback to regular Link if prefetch fails
 * - Fully compatible with React Router's Link API
 *
 * Usage:
 * ```tsx
 * <PrefetchLink
 *   to="/dashboard"
 *   prefetchFn={async () => await prefetchDashboard(userId)}
 *   prefetchDelay={300}
 * >
 *   Dashboard
 * </PrefetchLink>
 * ```
 */

import { Link, LinkProps } from 'react-router-dom';
import { createPrefetchOnHoverWithDelay, prefetchRouteChunk } from '@/utils/prefetch';

export interface PrefetchLinkProps extends LinkProps {
  /**
   * Function to call for prefetching data
   * Should return a Promise that resolves when prefetch is complete
   */
  prefetchFn?: () => Promise<void>;

  /**
   * Delay in milliseconds before triggering prefetch
   * Default: 300ms (prevents prefetch on quick mouse movements)
   */
  prefetchDelay?: number;

  /**
   * Whether prefetch is enabled
   * Useful for conditionally disabling prefetch based on connection speed, etc.
   * Default: true
   */
  prefetchEnabled?: boolean;

  /**
   * Whether to prefetch the route chunk (JS code)
   * Default: true - always prefetch chunk on hover
   */
  prefetchChunk?: boolean;
}

/**
 * Link component with automatic hover-based prefetching
 */
export function PrefetchLink({
  to,
  prefetchFn,
  prefetchDelay = 300,
  prefetchEnabled = true,
  prefetchChunk = true,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: PrefetchLinkProps) {
  // Create prefetch handlers if prefetch function is provided and enabled
  const prefetchHandlers =
    prefetchFn && prefetchEnabled
      ? createPrefetchOnHoverWithDelay(prefetchFn, prefetchDelay)
      : null;

  // Merge prefetch handlers with any existing handlers
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Always prefetch route chunk immediately (no delay needed for code)
    if (prefetchChunk && prefetchEnabled) {
      const path = typeof to === 'string' ? to : to.pathname || '';
      prefetchRouteChunk(path);
    }

    // Prefetch data with delay
    if (prefetchHandlers) {
      prefetchHandlers.onMouseEnter();
    }
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefetchHandlers) {
      prefetchHandlers.onMouseLeave();
    }
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  };

  return (
    <Link to={to} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      {children}
    </Link>
  );
}
