/**
 * useAnnounce Hook
 * Provides screen reader announcements for dynamic content
 * WCAG 2.1 AA - 4.1.3 Status Messages
 */

import { useCallback, useRef, useEffect } from 'react';

type Politeness = 'polite' | 'assertive';

/**
 * Hook that creates and manages a live region for announcements.
 *
 * @example
 * const announce = useAnnounce();
 *
 * // On successful save
 * announce('Changes saved successfully');
 *
 * // On error
 * announce('Error saving changes', 'assertive');
 */
export function useAnnounce() {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  // Create live region on mount
  useEffect(() => {
    // Check if we already have a live region
    let liveRegion = document.getElementById('a11y-announcer') as HTMLDivElement;

    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'a11y-announcer';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('role', 'status');
      liveRegion.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(liveRegion);
    }

    liveRegionRef.current = liveRegion;

    return () => {
      // Don't remove - other components might be using it
    };
  }, []);

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    const liveRegion = liveRegionRef.current;
    if (!liveRegion) return;

    // Update politeness if different
    liveRegion.setAttribute('aria-live', politeness);

    // Clear and re-set to trigger announcement
    liveRegion.textContent = '';

    // Small delay ensures the screen reader picks up the change
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 50);

    // Clear after announcement to prevent re-reading
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }, []);

  return announce;
}

/**
 * Hook to announce loading states
 */
export function useLoadingAnnouncement(
  isLoading: boolean,
  loadingMessage = 'Loading...',
  loadedMessage = 'Content loaded'
) {
  const announce = useAnnounce();
  const wasLoading = useRef(false);

  useEffect(() => {
    if (isLoading && !wasLoading.current) {
      announce(loadingMessage);
      wasLoading.current = true;
    } else if (!isLoading && wasLoading.current) {
      announce(loadedMessage);
      wasLoading.current = false;
    }
  }, [isLoading, loadingMessage, loadedMessage, announce]);
}

/**
 * Hook to announce errors
 */
export function useErrorAnnouncement(error: Error | string | null | undefined) {
  const announce = useAnnounce();

  useEffect(() => {
    if (error) {
      const message = typeof error === 'string' ? error : error.message;
      announce(`Error: ${message}`, 'assertive');
    }
  }, [error, announce]);
}

/**
 * Hook to announce successful actions
 */
export function useSuccessAnnouncement() {
  const announce = useAnnounce();

  const announceSuccess = useCallback(
    (message: string) => {
      announce(message, 'polite');
    },
    [announce]
  );

  return announceSuccess;
}
