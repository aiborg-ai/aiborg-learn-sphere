/**
 * ComparisonBadge Component
 * Displays comparison metrics with visual indicators
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  formatPercentageChange,
  formatDelta,
  getTrendIndicator,
} from '@/utils/analyticsComparison';

export interface ComparisonBadgeProps {
  delta?: number;
  percentageChange?: number;
  showDelta?: boolean;
  showPercentage?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

/**
 * ComparisonBadge component
 *
 * Displays delta and/or percentage change with visual trend indicators
 *
 * @example
 * ```tsx
 * <ComparisonBadge
 *   delta={150}
 *   percentageChange={25.5}
 *   showDelta={true}
 *   showPercentage={true}
 * />
 * ```
 */
export function ComparisonBadge({
  delta,
  percentageChange,
  showDelta = false,
  showPercentage = true,
  className,
  variant = 'secondary',
}: ComparisonBadgeProps) {
  if (delta === undefined && percentageChange === undefined) {
    return null;
  }

  const { direction, severity } = getTrendIndicator(percentageChange);

  // Determine colors based on trend
  const colorClasses = {
    up: {
      high: 'text-green-700 dark:text-green-400 border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-950',
      medium:
        'text-green-600 dark:text-green-500 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-950',
      low: 'text-green-500 dark:text-green-600 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950',
    },
    down: {
      high: 'text-red-700 dark:text-red-400 border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950',
      medium:
        'text-red-600 dark:text-red-500 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950',
      low: 'text-red-500 dark:text-red-600 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950',
    },
    neutral: {
      high: 'text-muted-foreground border-muted bg-muted/50',
      medium: 'text-muted-foreground border-muted bg-muted/50',
      low: 'text-muted-foreground border-muted bg-muted/50',
    },
  };

  const colorClass = colorClasses[direction][severity];

  // Icon selection
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  // Build display text
  const parts: string[] = [];
  if (showDelta && delta !== undefined) {
    parts.push(formatDelta(delta, true));
  }
  if (showPercentage && percentageChange !== undefined) {
    parts.push(formatPercentageChange(percentageChange, true));
  }

  const displayText = parts.join(' ');

  return (
    <Badge
      variant={variant}
      className={cn('flex items-center gap-1 font-medium', colorClass, className)}
    >
      <Icon className="h-3 w-3" />
      <span>{displayText}</span>
    </Badge>
  );
}
