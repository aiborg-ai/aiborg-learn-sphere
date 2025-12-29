/**
 * HeartsDisplay Component
 * Shows remaining hearts/lives in Lingo
 */

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeartsDisplayProps {
  hearts: number;
  maxHearts?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function HeartsDisplay({
  hearts,
  maxHearts = 5,
  size = 'md',
  showLabel = false,
  className,
}: HeartsDisplayProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const iconSize = sizeClasses[size];

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      data-testid="hearts-display"
      role="status"
      aria-label={`${hearts} hearts remaining out of ${maxHearts}`}
    >
      {showLabel && <span className="text-sm font-medium text-muted-foreground mr-1">Hearts:</span>}
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: maxHearts }).map((_, i) => (
          <Heart
            key={i}
            className={cn(
              iconSize,
              'transition-all duration-200',
              i < hearts ? 'fill-red-500 text-red-500' : 'fill-none text-muted-foreground/30'
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          'font-bold ml-1',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          hearts > 2 ? 'text-red-500' : hearts > 0 ? 'text-orange-500' : 'text-muted-foreground'
        )}
      >
        {hearts}
      </span>
    </div>
  );
}
