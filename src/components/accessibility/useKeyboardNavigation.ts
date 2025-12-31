/**
 * useKeyboardNavigation Hook
 * Provides keyboard navigation patterns for interactive components
 * WCAG 2.1 AA - 2.1.1 Keyboard, 2.1.2 No Keyboard Trap
 */

import { useCallback, useRef } from 'react';

// Supported keyboard keys (for documentation)
type _Key =
  | 'Enter'
  | 'Space'
  | 'Escape'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Tab'
  | 'Home'
  | 'End';

interface KeyHandlers {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
}

/**
 * Hook for handling keyboard events on interactive elements.
 *
 * @example
 * const { handleKeyDown } = useKeyboardNavigation({
 *   onEnter: () => selectItem(),
 *   onArrowDown: () => focusNextItem(),
 *   onArrowUp: () => focusPreviousItem(),
 * });
 *
 * <div role="listbox" onKeyDown={handleKeyDown}>
 *   ...
 * </div>
 */
export function useKeyboardNavigation(handlers: KeyHandlers) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const keyHandlerMap: Record<string, (() => void) | undefined> = {
        Enter: handlers.onEnter,
        ' ': handlers.onSpace,
        Space: handlers.onSpace,
        Escape: handlers.onEscape,
        ArrowUp: handlers.onArrowUp,
        ArrowDown: handlers.onArrowDown,
        ArrowLeft: handlers.onArrowLeft,
        ArrowRight: handlers.onArrowRight,
        Home: handlers.onHome,
        End: handlers.onEnd,
      };

      const handler = keyHandlerMap[event.key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    },
    [handlers]
  );

  return { handleKeyDown };
}

/**
 * Hook for roving tabindex pattern (used in menus, toolbars, etc.)
 * Only one item has tabIndex=0, others have tabIndex=-1
 */
export function useRovingTabIndex<T extends HTMLElement>(
  items: Array<React.RefObject<T>>,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
  } = {}
) {
  const { orientation = 'vertical', wrap = true } = options;
  const currentIndex = useRef(0);

  const focusItem = useCallback(
    (index: number) => {
      const item = items[index]?.current;
      if (item) {
        items.forEach((ref, i) => {
          if (ref.current) {
            ref.current.tabIndex = i === index ? 0 : -1;
          }
        });
        item.focus();
        currentIndex.current = index;
      }
    },
    [items]
  );

  const focusNext = useCallback(() => {
    let nextIndex = currentIndex.current + 1;
    if (nextIndex >= items.length) {
      nextIndex = wrap ? 0 : items.length - 1;
    }
    focusItem(nextIndex);
  }, [items.length, wrap, focusItem]);

  const focusPrevious = useCallback(() => {
    let prevIndex = currentIndex.current - 1;
    if (prevIndex < 0) {
      prevIndex = wrap ? items.length - 1 : 0;
    }
    focusItem(prevIndex);
  }, [items.length, wrap, focusItem]);

  const focusFirst = useCallback(() => {
    focusItem(0);
  }, [focusItem]);

  const focusLast = useCallback(() => {
    focusItem(items.length - 1);
  }, [items.length, focusItem]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';
      const isVertical = orientation === 'vertical' || orientation === 'both';

      switch (event.key) {
        case 'ArrowDown':
          if (isVertical) {
            event.preventDefault();
            focusNext();
          }
          break;
        case 'ArrowUp':
          if (isVertical) {
            event.preventDefault();
            focusPrevious();
          }
          break;
        case 'ArrowRight':
          if (isHorizontal) {
            event.preventDefault();
            focusNext();
          }
          break;
        case 'ArrowLeft':
          if (isHorizontal) {
            event.preventDefault();
            focusPrevious();
          }
          break;
        case 'Home':
          event.preventDefault();
          focusFirst();
          break;
        case 'End':
          event.preventDefault();
          focusLast();
          break;
      }
    },
    [orientation, focusNext, focusPrevious, focusFirst, focusLast]
  );

  return {
    handleKeyDown,
    focusItem,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    currentIndex: currentIndex.current,
  };
}

/**
 * Hook for button-like keyboard behavior (Enter and Space activate)
 */
export function useButtonKeyboard(onClick: () => void) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return { handleKeyDown };
}

/**
 * Hook for menu keyboard navigation (with type-ahead)
 */
export function useMenuKeyboard(
  items: Array<{ label: string; action: () => void }>,
  onClose?: () => void
) {
  const currentIndex = useRef(0);
  const typeAheadBuffer = useRef('');
  const typeAheadTimeout = useRef<NodeJS.Timeout>();

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          currentIndex.current = (currentIndex.current + 1) % items.length;
          break;
        case 'ArrowUp':
          event.preventDefault();
          currentIndex.current =
            currentIndex.current === 0 ? items.length - 1 : currentIndex.current - 1;
          break;
        case 'Home':
          event.preventDefault();
          currentIndex.current = 0;
          break;
        case 'End':
          event.preventDefault();
          currentIndex.current = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          items[currentIndex.current]?.action();
          break;
        case 'Escape':
          event.preventDefault();
          onClose?.();
          break;
        default:
          // Type-ahead
          if (event.key.length === 1) {
            // Clear previous timeout
            if (typeAheadTimeout.current) {
              clearTimeout(typeAheadTimeout.current);
            }
            // Add to buffer
            typeAheadBuffer.current += event.key.toLowerCase();
            // Find matching item
            const matchIndex = items.findIndex(item =>
              item.label.toLowerCase().startsWith(typeAheadBuffer.current)
            );
            if (matchIndex >= 0) {
              currentIndex.current = matchIndex;
            }
            // Clear buffer after delay
            typeAheadTimeout.current = setTimeout(() => {
              typeAheadBuffer.current = '';
            }, 500);
          }
      }

      return currentIndex.current;
    },
    [items, onClose]
  );

  return { handleKeyDown, currentIndex: currentIndex.current };
}
