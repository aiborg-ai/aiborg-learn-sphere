/**
 * useFocusReturn Hook
 * Returns focus to the triggering element when a modal/dialog closes
 * WCAG 2.1 AA - 2.4.3 Focus Order
 */

import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook that saves the currently focused element and returns focus to it later.
 *
 * @example
 * const { returnFocus, saveFocus } = useFocusReturn();
 *
 * const openModal = () => {
 *   saveFocus();
 *   setIsOpen(true);
 * };
 *
 * const closeModal = () => {
 *   setIsOpen(false);
 *   returnFocus();
 * };
 */
export function useFocusReturn() {
  const savedFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    savedFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const returnFocus = useCallback(() => {
    if (savedFocusRef.current && typeof savedFocusRef.current.focus === 'function') {
      // Small delay to ensure any animations complete
      setTimeout(() => {
        savedFocusRef.current?.focus();
      }, 0);
    }
  }, []);

  return { saveFocus, returnFocus, savedElement: savedFocusRef };
}

/**
 * Hook that automatically returns focus when isOpen becomes false.
 *
 * @example
 * useFocusOnClose(isModalOpen);
 */
export function useFocusOnClose(isOpen: boolean) {
  const savedFocusRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      // Modal just opened - save current focus
      savedFocusRef.current = document.activeElement as HTMLElement;
    } else if (!isOpen && wasOpen.current) {
      // Modal just closed - return focus
      if (savedFocusRef.current && typeof savedFocusRef.current.focus === 'function') {
        setTimeout(() => {
          savedFocusRef.current?.focus();
        }, 0);
      }
    }
    wasOpen.current = isOpen;
  }, [isOpen]);
}

/**
 * Hook for managing focus within a container.
 * Useful for carousels, tabs, and other complex components.
 */
export function useFocusWithin(containerRef: React.RefObject<HTMLElement>) {
  const focusFirstElement = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [containerRef]);

  const focusLastElement = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [containerRef]);

  const containsFocus = useCallback(() => {
    if (!containerRef.current) return false;
    return containerRef.current.contains(document.activeElement);
  }, [containerRef]);

  return { focusFirstElement, focusLastElement, containsFocus };
}

/**
 * Hook for focus sentinel elements (used with focus trapping)
 */
export function useFocusSentinels(
  containerRef: React.RefObject<HTMLElement>,
  active: boolean = true
) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    // Create sentinel elements
    const startSentinel = document.createElement('div');
    startSentinel.tabIndex = 0;
    startSentinel.setAttribute('aria-hidden', 'true');
    startSentinel.style.cssText =
      'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;';

    const endSentinel = document.createElement('div');
    endSentinel.tabIndex = 0;
    endSentinel.setAttribute('aria-hidden', 'true');
    endSentinel.style.cssText =
      'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;';

    // Get all focusable elements
    const getFocusableElements = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el !== startSentinel && el !== endSentinel);

    // Handle focus on sentinels
    startSentinel.addEventListener('focus', () => {
      const elements = getFocusableElements();
      if (elements.length > 0) {
        elements[elements.length - 1].focus();
      }
    });

    endSentinel.addEventListener('focus', () => {
      const elements = getFocusableElements();
      if (elements.length > 0) {
        elements[0].focus();
      }
    });

    // Insert sentinels
    container.insertBefore(startSentinel, container.firstChild);
    container.appendChild(endSentinel);

    return () => {
      startSentinel.remove();
      endSentinel.remove();
    };
  }, [containerRef, active]);
}
