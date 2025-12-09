/**
 * Learning Velocity Gauge Component
 *
 * Displays learning velocity as a radial gauge with trend indicator.
 * Shows current velocity, trend direction, and comparison stats.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Zap, Gauge, ArrowUpRight, ArrowDownRight, ArrowRight } from '@/components/ui/icons';
import { useAbilityTrajectory } from '@/hooks/useRealTimeAnalytics';
import { cn } from '@/lib/utils';

interface LearningVelocityGaugeProps {
  categoryId?: string;
  showTrendHistory?: boolean;
  compact?: boolean;
  className?: string;
}

export function LearningVelocityGauge({
  categoryId,
  showTrendHistory = true,
  compact = false,
  className,
}: LearningVelocityGaugeProps) {
  const { velocity, isLoading } = useAbilityTrajectory(categoryId);

  // Calculate gauge data
  const gaugeData = useMemo(() => {
    if (!velocity) return null;

    // Normalize velocity to 0-100 scale
    // Typical velocity range is -0.5 to +0.5 per week
    const normalizedVelocity = Math.min(100, Math.max(0, (velocity.velocity + 0.5) * 100));

    return {
      velocity: velocity.velocity,
      normalized: normalizedVelocity,
      trend: velocity.trend,
    };
  }, [velocity]);

  // Get trend configuration
  const trendConfig = useMemo(() => {
    if (!velocity) return null;

    switch (velocity.trend) {
      case 'accelerating':
        return {
          icon: ArrowUpRight,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          gaugeColor: '#22c55e',
          label: 'Accelerating',
          description: 'Your learning speed is increasing',
        };
      case 'decelerating':
        return {
          icon: ArrowDownRight,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
          gaugeColor: '#ef4444',
          label: 'Decelerating',
          description: 'Your learning speed is decreasing',
        };
      default:
        return {
          icon: ArrowRight,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          gaugeColor: '#3b82f6',
          label: 'Stable',
          description: 'Your learning speed is consistent',
        };
    }
  }, [velocity]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className={compact ? 'pb-2' : undefined}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4" />
            Learning Velocity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className={cn('w-full', compact ? 'h-32' : 'h-48')} />
        </CardContent>
      </Card>
    );
  }

  if (!gaugeData || !trendConfig) {
    return (
      <Card className={className}>
        <CardHeader className={compact ? 'pb-2' : undefined}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4" />
            Learning Velocity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-32">
          <Zap className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Not enough data</p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trendConfig.icon;

  // Prepare radial bar data
  const chartData = [
    {
      name: 'velocity',
      value: gaugeData.normalized,
      fill: trendConfig.gaugeColor,
    },
  ];

  // Velocity as percentage change per week
  const velocityPercent = (gaugeData.velocity * 100).toFixed(1);
  const velocitySign = gaugeData.velocity >= 0 ? '+' : '';

  if (compact) {
    return (
      <Card className={cn(trendConfig.bgColor, 'border-0', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-full',
                  trendConfig.color === 'text-green-600'
                    ? 'bg-green-100 dark:bg-green-900'
                    : trendConfig.color === 'text-red-600'
                      ? 'bg-red-100 dark:bg-red-900'
                      : 'bg-blue-100 dark:bg-blue-900'
                )}
              >
                <Zap className={cn('h-5 w-5', trendConfig.color)} />
              </div>
              <div>
                <p className="text-sm font-medium">Learning Velocity</p>
                <p className="text-xs text-muted-foreground">{trendConfig.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn('text-2xl font-bold', trendConfig.color)}>
                {velocitySign}
                {velocityPercent}%
              </p>
              <Badge variant="outline" className={cn('text-xs', trendConfig.color)}>
                <TrendIcon className="h-3 w-3 mr-1" />
                {trendConfig.label}
              </Badge>
            </div>
          </div>

          {/* Progress bar representation */}
          <div className="mt-3">
            <Progress
              value={gaugeData.normalized}
              className="h-2"
              style={
                {
                  '--progress-color': trendConfig.gaugeColor,
                } as React.CSSProperties
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(trendConfig.bgColor, className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className={cn('h-5 w-5', trendConfig.color)} />
              Learning Velocity
            </CardTitle>
            <CardDescription>{trendConfig.description}</CardDescription>
          </div>
          <Badge variant="outline" className={cn(trendConfig.color, 'border-current')}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {trendConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-6">
          {/* Radial Gauge */}
          <div className="relative w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={chartData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background={{ fill: '#e5e7eb' }}
                  dataKey="value"
                  cornerRadius={10}
                  fill={trendConfig.gaugeColor}
                />
              </RadialBarChart>
            </ResponsiveContainer>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={cn('text-3xl font-bold', trendConfig.color)}>
                {velocitySign}
                {velocityPercent}
              </p>
              <p className="text-xs text-muted-foreground">% per week</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Current Trend"
                value={trendConfig.label}
                icon={<TrendIcon className={cn('h-4 w-4', trendConfig.color)} />}
              />
              <StatCard
                label="Velocity Score"
                value={gaugeData.normalized.toFixed(0)}
                suffix="/100"
              />
            </div>

            {showTrendHistory && (
              <div className="p-3 rounded-lg border bg-background/50">
                <p className="text-xs font-medium mb-2">Velocity Interpretation</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>&gt; +10%: Rapid improvement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>-5% to +10%: Normal progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>&lt; -5%: Needs attention</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Velocity Scale */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>-50%/wk</span>
            <span>0%/wk</span>
            <span>+50%/wk</span>
          </div>
          <div className="relative h-3 bg-gradient-to-r from-red-500 via-blue-500 to-green-500 rounded-full">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-md"
              style={{
                left: `calc(${gaugeData.normalized}% - 8px)`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon?: React.ReactNode;
}

function StatCard({ label, value, suffix, icon }: StatCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-background/50">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-lg font-bold">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}

export default LearningVelocityGauge;
