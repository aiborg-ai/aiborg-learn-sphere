/**
 * StatsCard Component
 * Reusable card for displaying statistics with optional trend indicators
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, type LucideIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { StatCardData } from '../types';

interface StatsCardProps {
  data: StatCardData;
  className?: string;
}

export function StatsCard({ data, className }: StatsCardProps) {
  const { label, value, icon: Icon, trend, trendValue, color = 'default' } = data;

  // Color classes for different states
  const colorClasses = {
    default: 'text-primary',
    success: 'text-green-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
  };

  // Trend icon component
  const TrendIcon: LucideIcon | null =
    trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : trend === 'neutral' ? Minus : null;

  // Trend color
  const trendColor =
    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            <p className={cn('text-2xl font-bold', colorClasses[color])}>{value}</p>

            {/* Trend indicator */}
            {trend && trendValue && TrendIcon && (
              <div className={cn('flex items-center gap-1 mt-2 text-sm', trendColor)}>
                <TrendIcon className="h-4 w-4" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div className="ml-4">
              <div className={cn('p-3 rounded-lg bg-muted/50')}>
                <Icon className={cn('h-6 w-6', colorClasses[color])} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
