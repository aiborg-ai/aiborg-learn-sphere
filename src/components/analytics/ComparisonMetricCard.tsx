/**
 * ComparisonMetricCard Component
 * Card displaying a metric with comparison to previous period
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparisonBadge } from './ComparisonBadge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface ComparisonMetricCardProps {
  title: string;
  description?: string;
  currentValue: number | string;
  comparisonValue?: number | string;
  delta?: number;
  percentageChange?: number;
  icon?: LucideIcon;
  iconColor?: string;
  valueFormatter?: (value: number | string) => string;
  showComparison?: boolean;
  className?: string;
}

/**
 * ComparisonMetricCard component
 *
 * Displays a metric card with optional comparison badge
 *
 * @example
 * ```tsx
 * <ComparisonMetricCard
 *   title="Total Users"
 *   description="Active users this period"
 *   currentValue={1250}
 *   comparisonValue={1000}
 *   delta={250}
 *   percentageChange={25}
 *   icon={Users}
 *   iconColor="text-blue-600"
 *   showComparison={true}
 * />
 * ```
 */
export function ComparisonMetricCard({
  title,
  description,
  currentValue,
  comparisonValue,
  delta,
  percentageChange,
  icon: Icon,
  iconColor = 'text-primary',
  valueFormatter,
  showComparison = true,
  className,
}: ComparisonMetricCardProps) {
  // Format current value
  const formattedCurrent =
    valueFormatter && typeof currentValue === 'number'
      ? valueFormatter(currentValue)
      : currentValue.toLocaleString();

  // Format comparison value
  const formattedComparison =
    comparisonValue !== undefined
      ? valueFormatter && typeof comparisonValue === 'number'
        ? valueFormatter(comparisonValue)
        : comparisonValue.toLocaleString()
      : null;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {Icon && <Icon className={cn('h-4 w-4', iconColor)} />}
        </div>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Current Value */}
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{formattedCurrent}</div>
          {showComparison && (delta !== undefined || percentageChange !== undefined) && (
            <ComparisonBadge
              delta={delta}
              percentageChange={percentageChange}
              showPercentage={true}
              showDelta={false}
            />
          )}
        </div>

        {/* Comparison Value Display */}
        {showComparison && formattedComparison && (
          <div className="text-xs text-muted-foreground">vs. {formattedComparison} last period</div>
        )}
      </CardContent>
    </Card>
  );
}
