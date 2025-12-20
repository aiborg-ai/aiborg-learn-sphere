/**
 * DailyGoalTracker Component
 * Shows progress toward daily XP goal
 */

import { Target, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DailyGoalTrackerProps {
  current: number;
  goal: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function DailyGoalTracker({
  current,
  goal,
  size = 'md',
  showLabel = true,
  className,
}: DailyGoalTrackerProps) {
  const progress = Math.min(100, (current / goal) * 100);
  const isComplete = current >= goal;

  const sizeClasses = {
    sm: { icon: 'h-4 w-4', text: 'text-xs', bar: 'h-1.5' },
    md: { icon: 'h-5 w-5', text: 'text-sm', bar: 'h-2' },
    lg: { icon: 'h-6 w-6', text: 'text-base', bar: 'h-3' },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isComplete ? (
              <Check className={cn(sizes.icon, 'text-green-500')} />
            ) : (
              <Target className={cn(sizes.icon, 'text-muted-foreground')} />
            )}
            <span className={cn(sizes.text, 'text-muted-foreground')}>Daily Goal</span>
          </div>
          <span className={cn(sizes.text, 'font-medium', isComplete ? 'text-green-500' : '')}>
            {current}/{goal} XP
          </span>
        </div>
      )}
      <Progress
        value={progress}
        className={cn(sizes.bar, 'bg-muted', isComplete && '[&>div]:bg-green-500')}
      />
    </div>
  );
}
