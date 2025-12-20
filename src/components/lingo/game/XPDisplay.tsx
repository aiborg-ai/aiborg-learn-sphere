/**
 * XPDisplay Component
 * Shows XP with optional animation
 */

import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPDisplayProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function XPDisplay({
  xp,
  size = 'md',
  showLabel = false,
  animated = false,
  className,
}: XPDisplayProps) {
  const sizeClasses = {
    sm: { icon: 'h-4 w-4', text: 'text-xs' },
    md: { icon: 'h-5 w-5', text: 'text-sm' },
    lg: { icon: 'h-6 w-6', text: 'text-base' },
  };

  const sizes = sizeClasses[size];

  // Format large numbers
  const formatXP = (value: number): string => {
    if (value >= 10000) return `${(value / 1000).toFixed(1)}k`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Zap
        className={cn(sizes.icon, 'text-yellow-500 fill-yellow-500', animated && 'animate-bounce')}
      />
      <span className={cn('font-bold text-yellow-500', sizes.text)}>{formatXP(xp)}</span>
      {showLabel && <span className={cn('text-muted-foreground', sizes.text)}>XP</span>}
    </div>
  );
}

/**
 * Animated XP earned popup
 */
interface XPEarnedAnimationProps {
  amount: number;
  onComplete?: () => void;
}

export function XPEarnedAnimation({ amount, onComplete }: XPEarnedAnimationProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      onAnimationEnd={onComplete}
    >
      <div className="animate-in zoom-in-50 fade-in duration-500">
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl shadow-yellow-500/50">
          <Zap className="h-8 w-8 fill-white" />
          <span className="text-2xl font-bold">+{amount} XP</span>
        </div>
      </div>
    </div>
  );
}
