/**
 * useFocusTrap Hook
 *
 * Traps focus within a container (essential for modals/dialogs)
 * Ensures keyboard users can't accidentally tab out of dialogs
 *
 * FEATURES:
 * - Traps Tab/Shift+Tab within container
 * - Auto-focuses first element on mount
 * - Restores focus on unmount
 * - Configurable initial focus
 * - Returns focus to trigger element
 *
 * @example
 * const dialogRef = useFocusTrap<HTMLDivElement>({ active: isOpen });
 * <div ref={dialogRef}>...dialog content...</div>
 */

import { useEffect, useRef, RefObject } from 'react';

export interface UseFocusTrapOptions {
  /**
   * Whether the focus trap is active
   */
  active: boolean;

  /**
   * Auto-focus first element when trap activates
   * Default: true
   */
  autoFocus?: boolean;

  /**
   * Restore focus to trigger element when trap deactivates
   * Default: true
   */
  restoreFocus?: boolean;

  /**
   * Selector for initial focus element
   * If not provided, focuses first focusable element
   */
  initialFocusSelector?: string;

  /**
   * Callback when focus trap is activated
   */
  onActivate?: () => void;

  /**
   * Callback when focus trap is deactivated
   */
  onDeactivate?: () => void;
}

/**
 * Returns a ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>({
  active,
  autoFocus = true,
  restoreFocus = true,
  initialFocusSelector,
  onActivate,
  onDeactivate,
}: UseFocusTrapOptions): RefObject<T> {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    // Save currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    /* ======================================================================
     * GET FOCUSABLE ELEMENTS
     * ====================================================================== */

    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'area[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        'iframe',
        'object',
        'embed',
        '[contenteditable]',
      ].join(',');

      const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

      // Filter out elements that are not visible
      return elements.filter((element) => {
        return (
          element.offsetWidth > 0 ||
          element.offsetHeight > 0 ||
          element.getClientRects().length > 0
        );
      });
    };

    /* ======================================================================
     * AUTO-FOCUS FIRST ELEMENT
     * ====================================================================== */

    if (autoFocus) {
      let initialElement: HTMLElement | null = null;

      if (initialFocusSelector) {
        initialElement = container.querySelector<HTMLElement>(initialFocusSelector);
      }

      if (!initialElement) {
        const focusableElements = getFocusableElements();
        initialElement = focusableElements[0] || container;
      }

      initialElement?.focus();
    }

    if (onActivate) {
      onActivate();
    }

    /* ======================================================================
     * FOCUS TRAP HANDLER
     * ====================================================================== */

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab on first element -> go to last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> go to first
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }

      // If focus is outside container, move it inside
      if (!container.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    /* ======================================================================
     * CLEANUP
     * ====================================================================== */

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }

      if (onDeactivate) {
        onDeactivate();
      }
    };
  }, [active, autoFocus, restoreFocus, initialFocusSelector, onActivate, onDeactivate]);

  return containerRef;
}

/* ============================================================================
 * USAGE EXAMPLES
 * ============================================================================

@example Basic Modal Focus Trap
```tsx
function Modal({ isOpen, onClose }: Props) {
  const modalRef = useFocusTrap<HTMLDivElement>({
    active: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      <h2>Modal Title</h2>
      <p>Modal content</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

@example Focus Specific Element Initially
```tsx
function Dialog({ isOpen }: Props) {
  const dialogRef = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    initialFocusSelector: '#dialog-action-button',
  });

  return (
    <div ref={dialogRef}>
      <h2>Confirm Action</h2>
      <button>Cancel</button>
      <button id="dialog-action-button">Confirm</button>
    </div>
  );
}
```

@example Without Auto-Focus
```tsx
function Drawer({ isOpen }: Props) {
  const drawerRef = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    autoFocus: false, // Don't auto-focus
    restoreFocus: true, // But do restore focus when closed
  });

  return (
    <div ref={drawerRef}>
      {/* Drawer content */}
    </div>
  );
}
```

@example With Callbacks
```tsx
function Popover({ isOpen }: Props) {
  const popoverRef = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    onActivate: () => {
      // Maybe announce to screen readers
    },
    onDeactivate: () => {
      // Clean up any state
    },
  });

  return (
    <div ref={popoverRef}>
      {/* Popover content */}
    </div>
  );
}
```

@example Conditional Focus Trap
```tsx
function Panel({ isOpen, isPinned }: Props) {
  // Only trap focus if panel is open AND not pinned
  const panelRef = useFocusTrap<HTMLDivElement>({
    active: isOpen && !isPinned,
  });

  return (
    <div ref={panelRef}>
      {/* Panel content */}
    </div>
  );
}
```

============================================================================
BEST PRACTICES
============================================================================

1. ALWAYS USE FOR MODALS/DIALOGS
   ✅ Modal dialogs MUST trap focus
   ❌ Never let focus escape from modal dialogs

2. RESTORE FOCUS
   ✅ Always restore focus to trigger element
   ❌ Don't leave user's focus position lost

3. INITIAL FOCUS
   ✅ Focus primary action button by default
   ✅ Or focus first input field in forms
   ❌ Don't focus close button first

4. MULTIPLE TRAPS
   ❌ Don't have multiple active focus traps
   ✅ Deactivate parent trap when opening nested dialog

5. TESTING
   ✅ Test with keyboard only (no mouse)
   ✅ Verify Tab cycles through all elements
   ✅ Verify Shift+Tab works in reverse
   ✅ Verify focus returns to trigger on close

============================================================================
ACCESSIBILITY REQUIREMENTS
============================================================================

Per WCAG 2.1 Success Criterion 2.4.3 (Focus Order):
- Focus must move in a meaningful sequence
- Tab order must be logical
- Focus must not leave modal unexpectedly

Per ARIA Authoring Practices:
- Modal dialogs must trap focus
- Focus must move to dialog when opened
- Focus must return to trigger when closed
- All interactive elements must be reachable via Tab

============================================================================
 */
