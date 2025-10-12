import { useEffect, useCallback, useRef } from 'react';
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress';
import { logger } from '@/utils/logger';

interface ProgressSyncProps {
  sessionId: string | null;
  courseId: number | null;
  currentProgress: number;
  timeSpent: number;
  currentPosition?: string;
  onMilestone?: (milestone: number) => void;
}

/**
 * Background component that syncs progress to database with realtime broadcasting
 *
 * Features:
 * - Auto-saves progress every 30 seconds
 * - Broadcasts milestone events (25%, 50%, 75%, 100%)
 * - Debounces rapid updates
 * - Handles offline/online transitions
 *
 * @example
 * ```tsx
 * <ProgressSync
 *   sessionId={session.id}
 *   courseId={123}
 *   currentProgress={progressPercentage}
 *   timeSpent={timeSpentMinutes}
 *   currentPosition={videoTimestamp}
 * />
 * ```
 */
export function ProgressSync({
  sessionId,
  courseId,
  currentProgress,
  timeSpent,
  currentPosition,
  onMilestone,
}: ProgressSyncProps) {
  const { updateProgress } = useRealtimeProgress({
    sessionId,
    courseId,
    autoSubscribe: false, // We don't need to subscribe, just update
  });

  const lastSyncRef = useRef<{
    progress: number;
    time: number;
    timestamp: number;
  }>({ progress: 0, time: 0, timestamp: 0 });

  const milestonesReachedRef = useRef<Set<number>>(new Set());

  /**
   * Debounced progress update
   */
  const syncProgress = useCallback(async () => {
    if (!courseId) return;

    const now = Date.now();
    const lastSync = lastSyncRef.current;

    // Debounce: only sync if 30 seconds passed OR progress changed significantly
    const timeSinceLastSync = now - lastSync.timestamp;
    const progressDelta = Math.abs(currentProgress - lastSync.progress);

    const shouldSync =
      timeSinceLastSync > 30000 || // 30 seconds passed
      progressDelta >= 5 || // 5% progress change
      currentProgress === 100; // Always sync on completion

    if (!shouldSync) {
      return;
    }

    logger.debug('Syncing progress', {
      currentProgress,
      timeSpent,
      currentPosition,
    });

    const success = await updateProgress(currentProgress, timeSpent, currentPosition);

    if (success) {
      lastSyncRef.current = {
        progress: currentProgress,
        time: timeSpent,
        timestamp: now,
      };

      // Check for milestones
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (currentProgress >= milestone && !milestonesReachedRef.current.has(milestone)) {
          milestonesReachedRef.current.add(milestone);
          logger.info('Milestone reached', { milestone });
          onMilestone?.(milestone);
        }
      }
    }
  }, [courseId, currentProgress, timeSpent, currentPosition, updateProgress, onMilestone]);

  /**
   * Sync progress on interval and when values change
   */
  useEffect(() => {
    // Initial sync
    syncProgress();

    // Set up interval for periodic sync
    const interval = setInterval(syncProgress, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
      // Final sync on unmount
      syncProgress();
    };
  }, [syncProgress]);

  /**
   * Sync immediately when progress reaches 100%
   */
  useEffect(() => {
    if (currentProgress === 100) {
      syncProgress();
    }
  }, [currentProgress, syncProgress]);

  /**
   * Handle visibility change - sync when tab becomes visible
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncProgress]);

  /**
   * Handle online/offline - sync when back online
   */
  useEffect(() => {
    const handleOnline = () => {
      logger.info('Back online, syncing progress');
      syncProgress();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncProgress]);

  // This is a background component, no UI
  return null;
}
