/**
 * useAutoRefresh Hook
 * Manages automatic data refresh with page visibility detection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';

export interface AutoRefreshOptions {
  interval: number; // milliseconds
  onRefresh: () => Promise<void>;
  enabled?: boolean;
}

export interface AutoRefreshState {
  isEnabled: boolean;
  lastRefresh: Date | null;
  isRefreshing: boolean;
}

export interface AutoRefreshControls {
  enable: () => void;
  disable: () => void;
  toggle: () => void;
  refresh: () => Promise<void>;
  state: AutoRefreshState;
}

/**
 * Hook for managing automatic data refresh with page visibility handling
 *
 * Features:
 * - Automatic refresh at specified intervals
 * - Pauses when tab is inactive (Page Visibility API)
 * - Manual refresh trigger
 * - Cleanup on unmount
 *
 * @example
 * ```tsx
 * const { state, enable, disable, refresh } = useAutoRefresh({
 *   interval: 60000, // 1 minute
 *   onRefresh: async () => {
 *     await refetchData();
 *   },
 *   enabled: true,
 * });
 *
 * logger.info(state.lastRefresh); // Last refresh timestamp
 * ```
 *
 * @param options - Configuration options for auto-refresh
 * @returns Auto-refresh controls and state
 */
export function useAutoRefresh({
  interval,
  onRefresh,
  enabled = false,
}: AutoRefreshOptions): AutoRefreshControls {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);

  // Update ref when onRefresh changes (avoid stale closures)
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  /**
   * Execute refresh operation
   */
  const refresh = useCallback(async () => {
    if (isRefreshing) {
      logger.debug('Refresh already in progress, skipping');
      return;
    }

    try {
      setIsRefreshing(true);
      logger.debug('Starting auto-refresh');

      await onRefreshRef.current();

      setLastRefresh(new Date());
      logger.debug('Auto-refresh completed successfully');
    } catch (error) {
      logger.error('Error during auto-refresh:', error);
      // Don't throw - let the onRefresh handler manage errors
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  /**
   * Start interval timer
   */
  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      refresh();
    }, interval);

    logger.info('Auto-refresh started', { intervalMs: interval });
  }, [interval, refresh]);

  /**
   * Stop interval timer
   */
  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      logger.info('Auto-refresh stopped');
    }
  }, []);

  /**
   * Enable auto-refresh
   */
  const enable = useCallback(() => {
    setIsEnabled(true);
  }, []);

  /**
   * Disable auto-refresh
   */
  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);

  /**
   * Toggle auto-refresh state
   */
  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  // Start/stop interval based on enabled state
  useEffect(() => {
    if (isEnabled) {
      startInterval();
    } else {
      stopInterval();
    }

    return () => {
      stopInterval();
    };
  }, [isEnabled, startInterval, stopInterval]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - pause refresh
        logger.debug('Page hidden, pausing auto-refresh');
        stopInterval();
      } else {
        // Page is visible - resume refresh if enabled
        if (isEnabled) {
          logger.debug('Page visible, resuming auto-refresh');
          startInterval();

          // Optionally refresh immediately on becoming visible
          // Comment out if you don't want immediate refresh
          refresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, startInterval, stopInterval, refresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    enable,
    disable,
    toggle,
    refresh,
    state: {
      isEnabled,
      lastRefresh,
      isRefreshing,
    },
  };
}

/**
 * Get human-readable time since last refresh
 */
export function getTimeSinceRefresh(lastRefresh: Date | null): string {
  if (!lastRefresh) {
    return 'Never';
  }

  const now = new Date();
  const diffMs = now.getTime() - lastRefresh.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Common auto-refresh intervals (in milliseconds)
 */
export const AUTO_REFRESH_INTERVALS = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
} as const;
