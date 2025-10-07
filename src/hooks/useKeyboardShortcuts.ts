import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  category: string;
  action: () => void;
  global?: boolean; // If true, works even when inputs are focused
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook to register and manage keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 'd',
 *       ctrl: true,
 *       description: 'Go to Dashboard',
 *       category: 'Navigation',
 *       action: () => navigate('/dashboard'),
 *     },
 *   ],
 * });
 */
export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      for (const shortcut of shortcuts) {
        // Skip if not global and user is in an input field
        if (!shortcut.global && isInputField) {
          continue;
        }

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enabled, handleKeyPress]);
};

/**
 * Get formatted keyboard shortcut display string
 */
export const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];

  // Detect OS for proper modifier key display
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
};

/**
 * Global navigation shortcuts hook
 */
export const useGlobalShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'd',
      ctrl: true,
      description: 'Go to Dashboard',
      category: 'Navigation',
      action: () => navigate('/dashboard'),
    },
    {
      key: 'h',
      ctrl: true,
      description: 'Go to Home',
      category: 'Navigation',
      action: () => navigate('/'),
    },
    {
      key: 'u',
      ctrl: true,
      description: 'Go to Profile',
      category: 'Navigation',
      action: () => navigate('/profile'),
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Open Command Palette',
      category: 'Actions',
      global: true,
      action: () => {
        // Handled by CommandPalette component
      },
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Open Global Search',
      category: 'Actions',
      global: true,
      action: () => {
        // Handled by GlobalSearch component
      },
    },
    {
      key: 'a',
      ctrl: true,
      shift: true,
      description: 'Go to Admin',
      category: 'Navigation',
      action: () => navigate('/admin'),
    },
    {
      key: 'b',
      ctrl: true,
      description: 'Go to Blog',
      category: 'Navigation',
      action: () => navigate('/blog'),
    },
    {
      key: 'm',
      ctrl: true,
      description: 'Go to My Courses',
      category: 'Navigation',
      action: () => navigate('/my-courses'),
    },
    {
      key: 'l',
      ctrl: true,
      description: 'Go to Learning Paths',
      category: 'Navigation',
      action: () => navigate('/learning-paths'),
    },
    {
      key: 't',
      ctrl: true,
      description: 'Take AI Assessment',
      category: 'Actions',
      action: () => navigate('/ai-assessment'),
    },
    {
      key: '?',
      shift: true,
      description: 'Show Keyboard Shortcuts',
      category: 'Help',
      global: true,
      action: () => {
        const event = new CustomEvent('show-shortcuts-help');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'Escape',
      description: 'Close Dialogs/Modals',
      category: 'General',
      global: true,
      action: () => {
        // ESC is handled by individual components
        // This is here for documentation purposes
      },
    },
  ];

  useKeyboardShortcuts({ shortcuts });

  return shortcuts;
};
