/**
 * useKeyboardNavigation Hook
 *
 * Provides keyboard navigation handling for interactive components
 * Supports common keyboard interactions for accessibility
 *
 * FEATURES:
 * - Arrow key navigation
 * - Enter/Space activation
 * - Escape key handling
 * - Home/End navigation
 * - Custom key handlers
 *
 * @example
 * const { handleKeyDown, focusedIndex } = useKeyboardNavigation({
 *   items: menuItems,
 *   onSelect: (item) => handleSelectItem(item),
 *   onEscape: () => closeMenu(),
 * });
 */

import { useState, useCallback, KeyboardEvent, useEffect, useRef } from 'react';

export interface UseKeyboardNavigationOptions<T = any> {
  /**
   * Array of items to navigate through
   */
  items: T[];

  /**
   * Callback when an item is selected (Enter or Space)
   */
  onSelect?: (item: T, index: number) => void;

  /**
   * Callback when Escape is pressed
   */
  onEscape?: () => void;

  /**
   * Initial focused index (default: 0)
   */
  initialIndex?: number;

  /**
   * Enable looping navigation (wrap around at ends)
   * Default: true
   */
  loop?: boolean;

  /**
   * Orientation for arrow keys
   * - 'vertical': ArrowUp/ArrowDown
   * - 'horizontal': ArrowLeft/ArrowRight
   * - 'both': All arrow keys work
   * Default: 'vertical'
   */
  orientation?: 'vertical' | 'horizontal' | 'both';

  /**
   * Custom key handlers
   */
  onKeyDown?: (event: KeyboardEvent, index: number) => void;

  /**
   * Auto-focus on mount
   * Default: false
   */
  autoFocus?: boolean;
}

export interface UseKeyboardNavigationReturn {
  /**
   * Current focused index
   */
  focusedIndex: number;

  /**
   * Set focused index manually
   */
  setFocusedIndex: (index: number) => void;

  /**
   * Keyboard event handler to attach to container
   */
  handleKeyDown: (event: KeyboardEvent) => void;

  /**
   * Get props for a navigable item
   */
  getItemProps: (index: number) => {
    tabIndex: number;
    'data-focused': boolean;
    onFocus: () => void;
    role: string;
  };

  /**
   * Move focus to next item
   */
  focusNext: () => void;

  /**
   * Move focus to previous item
   */
  focusPrevious: () => void;

  /**
   * Move focus to first item
   */
  focusFirst: () => void;

  /**
   * Move focus to last item
   */
  focusLast: () => void;
}

export function useKeyboardNavigation<T = any>({
  items,
  onSelect,
  onEscape,
  initialIndex = 0,
  loop = true,
  orientation = 'vertical',
  onKeyDown: customKeyDown,
  autoFocus = false,
}: UseKeyboardNavigationOptions<T>): UseKeyboardNavigationReturn {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLElement | null>(null);

  // Auto-focus on mount if enabled
  useEffect(() => {
    if (autoFocus && items.length > 0) {
      setFocusedIndex(0);
    }
  }, [autoFocus, items.length]);

  /* =========================================================================
   * NAVIGATION FUNCTIONS
   * ========================================================================= */

  const focusNext = useCallback(() => {
    setFocusedIndex((prev) => {
      if (prev >= items.length - 1) {
        return loop ? 0 : prev;
      }
      return prev + 1;
    });
  }, [items.length, loop]);

  const focusPrevious = useCallback(() => {
    setFocusedIndex((prev) => {
      if (prev <= 0) {
        return loop ? items.length - 1 : prev;
      }
      return prev - 1;
    });
  }, [items.length, loop]);

  const focusFirst = useCallback(() => {
    setFocusedIndex(0);
  }, []);

  const focusLast = useCallback(() => {
    setFocusedIndex(items.length - 1);
  }, [items.length]);

  /* =========================================================================
   * KEYBOARD HANDLER
   * ========================================================================= */

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;

      // Call custom handler if provided
      if (customKeyDown) {
        customKeyDown(event, focusedIndex);
      }

      // Navigation keys
      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      if ((key === 'ArrowDown' && isVertical) || (key === 'ArrowRight' && isHorizontal)) {
        event.preventDefault();
        focusNext();
      } else if ((key === 'ArrowUp' && isVertical) || (key === 'ArrowLeft' && isHorizontal)) {
        event.preventDefault();
        focusPrevious();
      } else if (key === 'Home') {
        event.preventDefault();
        focusFirst();
      } else if (key === 'End') {
        event.preventDefault();
        focusLast();
      }
      // Activation keys
      else if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        if (onSelect && items[focusedIndex]) {
          onSelect(items[focusedIndex], focusedIndex);
        }
      }
      // Escape key
      else if (key === 'Escape') {
        event.preventDefault();
        if (onEscape) {
          onEscape();
        }
      }
    },
    [
      focusedIndex,
      items,
      onSelect,
      onEscape,
      focusNext,
      focusPrevious,
      focusFirst,
      focusLast,
      orientation,
      customKeyDown,
    ]
  );

  /* =========================================================================
   * ITEM PROPS GETTER
   * ========================================================================= */

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === focusedIndex ? 0 : -1,
      'data-focused': index === focusedIndex,
      onFocus: () => setFocusedIndex(index),
      role: 'option',
    }),
    [focusedIndex]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getItemProps,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
}

/* ============================================================================
 * USAGE EXAMPLES
 * ============================================================================

@example Vertical Menu Navigation
```tsx
function Menu({ items, onSelectItem }: Props) {
  const {
    focusedIndex,
    handleKeyDown,
    getItemProps,
  } = useKeyboardNavigation({
    items,
    onSelect: onSelectItem,
    orientation: 'vertical',
  });

  return (
    <div role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <div
          key={index}
          {...getItemProps(index)}
          className={focusedIndex === index ? 'focused' : ''}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
```

@example Horizontal Tab Navigation
```tsx
function Tabs({ tabs, onSelectTab }: Props) {
  const {
    focusedIndex,
    handleKeyDown,
    getItemProps,
  } = useKeyboardNavigation({
    items: tabs,
    onSelect: onSelectTab,
    orientation: 'horizontal',
  });

  return (
    <div role="tablist" onKeyDown={handleKeyDown}>
      {tabs.map((tab, index) => (
        <button
          key={index}
          {...getItemProps(index)}
          role="tab"
          aria-selected={focusedIndex === index}
        >
          {tab.title}
        </button>
      ))}
    </div>
  );
}
```

@example Grid Navigation (Both Orientations)
```tsx
function Grid({ items }: Props) {
  const {
    focusedIndex,
    handleKeyDown,
    getItemProps,
  } = useKeyboardNavigation({
    items,
    orientation: 'both',
    loop: true,
    autoFocus: true,
  });

  return (
    <div
      role="grid"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-3 gap-4"
    >
      {items.map((item, index) => (
        <div
          key={index}
          {...getItemProps(index)}
          role="gridcell"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
```

@example Dropdown with Escape
```tsx
function Dropdown({ options, isOpen, onClose }: Props) {
  const {
    focusedIndex,
    handleKeyDown,
    getItemProps,
  } = useKeyboardNavigation({
    items: options,
    onSelect: (option) => {
      handleSelect(option);
      onClose();
    },
    onEscape: onClose,
    autoFocus: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div role="listbox" onKeyDown={handleKeyDown}>
      {options.map((option, index) => (
        <div
          key={index}
          {...getItemProps(index)}
          className={focusedIndex === index ? 'bg-accent' : ''}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}
```

============================================================================
KEYBOARD SHORTCUTS REFERENCE
============================================================================

VERTICAL ORIENTATION:
- ArrowDown: Move to next item
- ArrowUp: Move to previous item
- Home: Move to first item
- End: Move to last item
- Enter/Space: Select current item
- Escape: Close/cancel

HORIZONTAL ORIENTATION:
- ArrowRight: Move to next item
- ArrowLeft: Move to previous item
- Home: Move to first item
- End: Move to last item
- Enter/Space: Select current item
- Escape: Close/cancel

BOTH ORIENTATION:
- All arrow keys work for navigation
- Home/End work as expected
- Enter/Space: Select current item
- Escape: Close/cancel

============================================================================
 */
