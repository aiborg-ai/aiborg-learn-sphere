/**
 * StreakBadge Component
 * Shows current streak with fire animation
 */

import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function StreakBadge({
  streak,
  size = 'md',
  showLabel = false,
  animated = true,
  className,
}: StreakBadgeProps) {
  const sizeClasses = {
    sm: { icon: 'h-4 w-4', text: 'text-xs', container: 'px-2 py-0.5' },
    md: { icon: 'h-5 w-5', text: 'text-sm', container: 'px-3 py-1' },
    lg: { icon: 'h-6 w-6', text: 'text-base', container: 'px-4 py-1.5' },
  };

  const sizes = sizeClasses[size];

  // Color based on streak length
  const getStreakColor = () => {
    if (streak >= 30) return 'text-purple-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-yellow-500';
    return 'text-orange-400';
  };

  const getGlowColor = () => {
    if (streak >= 30) return 'shadow-purple-500/50';
    if (streak >= 14) return 'shadow-orange-500/50';
    if (streak >= 7) return 'shadow-yellow-500/50';
    return 'shadow-orange-400/50';
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20',
        sizes.container,
        animated && streak > 0 && 'shadow-lg',
        animated && streak > 0 && getGlowColor(),
        className
      )}
    >
      <Flame
        className={cn(sizes.icon, getStreakColor(), animated && streak > 0 && 'animate-pulse')}
      />
      <span className={cn('font-bold', sizes.text, getStreakColor())}>{streak}</span>
      {showLabel && (
        <span className={cn('text-muted-foreground', sizes.text)}>
          {streak === 1 ? 'day' : 'days'}
        </span>
      )}
    </div>
  );
}
