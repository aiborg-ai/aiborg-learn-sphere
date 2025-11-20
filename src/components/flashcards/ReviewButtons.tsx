/**
 * ReviewButtons Component
 * Shows Again/Hard/Good/Easy buttons with interval previews
 */

import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle, CheckCircle, Sparkles } from '@/components/ui/icons';

interface ReviewButtonsProps {
  onReview: (quality: 'again' | 'hard' | 'good' | 'easy') => void;
  intervalPreview?: {
    again: string;
    hard: string;
    good: string;
    easy: string;
  } | null;
  disabled?: boolean;
  className?: string;
}

export function ReviewButtons({
  onReview,
  intervalPreview,
  disabled = false,
  className = '',
}: ReviewButtonsProps) {
  const buttons = [
    {
      key: 'again' as const,
      label: 'Again',
      icon: XCircle,
      variant: 'destructive' as const,
      description: 'Forgot - review soon',
      color: 'text-red-600 dark:text-red-400',
    },
    {
      key: 'hard' as const,
      label: 'Hard',
      icon: AlertCircle,
      variant: 'outline' as const,
      description: 'Difficult recall',
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      key: 'good' as const,
      label: 'Good',
      icon: CheckCircle,
      variant: 'default' as const,
      description: 'Correct response',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      key: 'easy' as const,
      label: 'Easy',
      icon: Sparkles,
      variant: 'secondary' as const,
      description: 'Perfect recall',
      color: 'text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
      {buttons.map(button => {
        const Icon = button.icon;
        const interval = intervalPreview?.[button.key] || '...';

        return (
          <Button
            key={button.key}
            variant={button.variant}
            size="lg"
            onClick={() => onReview(button.key)}
            disabled={disabled}
            className="flex flex-col h-auto py-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${button.color}`} />
              <span className="font-semibold">{button.label}</span>
            </div>
            <div className="text-xs font-normal opacity-80">{button.description}</div>
            <div className="text-sm font-medium">{interval}</div>
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Keyboard shortcuts guide
 */
export function ReviewKeyboardShortcuts() {
  return (
    <div className="text-xs text-muted-foreground text-center space-x-4">
      <span>
        <kbd className="px-2 py-1 bg-muted rounded">1</kbd> Again
      </span>
      <span>
        <kbd className="px-2 py-1 bg-muted rounded">2</kbd> Hard
      </span>
      <span>
        <kbd className="px-2 py-1 bg-muted rounded">3</kbd> Good
      </span>
      <span>
        <kbd className="px-2 py-1 bg-muted rounded">4</kbd> Easy
      </span>
      <span className="ml-4">
        <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> Flip
      </span>
    </div>
  );
}
