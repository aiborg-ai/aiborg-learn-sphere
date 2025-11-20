import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Command } from '@/components/ui/icons';
import { type KeyboardShortcut, getShortcutDisplay } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ shortcuts }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowHelp = () => setIsOpen(true);
    window.addEventListener('show-shortcuts-help', handleShowHelp);
    return () => window.removeEventListener('show-shortcuts-help', handleShowHelp);
  }, []);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        aria-labelledby="shortcuts-title"
        aria-describedby="shortcuts-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
            <DialogTitle id="shortcuts-title">Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription id="shortcuts-description">
            Use these keyboard shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Command className="h-3 w-3" aria-hidden="true" />
                {category}
              </h3>
              <ul className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <li
                    key={`${category}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors list-none"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs"
                      aria-label={`Shortcut: ${getShortcutDisplay(shortcut)}`}
                    >
                      {getShortcutDisplay(shortcut)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Press{' '}
            <Badge variant="outline" className="font-mono text-[10px] mx-1">
              {isMac ? '⇧?' : 'Shift+?'}
            </Badge>{' '}
            anytime to see this help dialog. Shortcuts work globally unless you're typing in an
            input field.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
