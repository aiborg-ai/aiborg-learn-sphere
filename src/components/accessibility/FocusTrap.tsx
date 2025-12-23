/**
 * FocusTrap Component
 * Traps focus within a container for modals/dialogs
 * WCAG 2.1 AA - 2.4.3 Focus Order, 2.1.2 No Keyboard Trap
 */

import { useEffect, useRef, useCallback } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  returnFocus?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  className?: string;
}

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  'summary',
  'details > summary:first-child',
].join(',');

/**
 * Traps keyboard focus within a container.
 * Used for modals, dialogs, and other overlay components.
 *
 * @example
 * <FocusTrap active={isModalOpen} returnFocus>
 *   <div role="dialog" aria-modal="true">
 *     <button>Close</button>
 *     <input type="text" />
 *   </div>
 * </FocusTrap>
 */
export function FocusTrap({
  children,
  active = true,
  returnFocus = true,
  initialFocus,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)
    ).filter(el => {
      // Filter out hidden elements
      return el.offsetParent !== null && !el.hasAttribute('inert');
    });
  }, []);

  // Handle tab key to trap focus
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active || event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: going backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: going forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [active, getFocusableElements]
  );

  // Set initial focus when trap becomes active
  useEffect(() => {
    if (!active) return;

    // Store current active element for later restoration
    previousActiveElement.current = document.activeElement;

    // Set initial focus
    const setInitialFocus = () => {
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(setInitialFocus, 0);

    return () => clearTimeout(timeoutId);
  }, [active, initialFocus, getFocusableElements]);

  // Return focus when trap becomes inactive
  useEffect(() => {
    if (active) return;

    if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
      previousActiveElement.current.focus();
    }
  }, [active, returnFocus]);

  // Add keyboard event listener
  useEffect(() => {
    if (!active) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, handleKeyDown]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

/**
 * Hook version of focus trap for more control
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, active: boolean = true) {
  const previousActiveElement = useRef<Element | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)
    ).filter(el => el.offsetParent !== null);
  }, [containerRef]);

  useEffect(() => {
    if (!active) return;

    previousActiveElement.current = document.activeElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, getFocusableElements]);
}
