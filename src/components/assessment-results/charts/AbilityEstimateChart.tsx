/**
 * Ability Estimate Chart Component
 * Visualizes IRT ability (θ) with confidence bands over time
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Area,
  Line,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Brain } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { AbilityDataPoint } from '../types';
import { CHART_COLORS } from '../types';
import { LoadingState } from '../common/LoadingState';
import { EmptyStateCard } from '../common/EmptyStateCard';

interface AbilityEstimateChartProps {
  data: AbilityDataPoint[];
  isLoading?: boolean;
  height?: number;
  className?: string;
}

export function AbilityEstimateChart({
  data,
  isLoading = false,
  height = 350,
  className,
}: AbilityEstimateChartProps) {
  // Calculate trend
  const trend = useMemo(() => {
    if (data.length < 2) return 'stable';

    const latestAbility = data[data.length - 1].ability;
    const previousAbility = data[data.length - 2].ability;
    const diff = latestAbility - previousAbility;

    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'improving' : 'declining';
  }, [data]);

  // Calculate stats
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const abilities = data.map(d => d.ability);
    const currentAbility = abilities[abilities.length - 1];
    const avgAbility = abilities.reduce((sum, a) => sum + a, 0) / abilities.length;
    const currentSE = data[data.length - 1].standardError;

    return {
      current: currentAbility.toFixed(2),
      average: avgAbility.toFixed(2),
      standardError: currentSE.toFixed(2),
    };
  }, [data]);

  // Trend configuration
  const trendConfig = {
    improving: {
      icon: TrendingUp,
      color: 'text-green-600',
      chartColor: CHART_COLORS.success,
      label: 'Improving',
    },
    declining: {
      icon: TrendingDown,
      color: 'text-red-600',
      chartColor: CHART_COLORS.danger,
      label: 'Declining',
    },
    stable: {
      icon: Minus,
      color: 'text-blue-600',
      chartColor: CHART_COLORS.primary,
      label: 'Stable',
    },
  };

  const currentTrend = trendConfig[trend];
  const TrendIcon = currentTrend.icon;

  if (isLoading) {
    return <LoadingState variant="chart" title className={className} />;
  }

  if (data.length === 0) {
    return (
      <EmptyStateCard
        config={{
          icon: Brain,
          title: 'No Ability Data',
          description:
            'Complete more attempts to see your ability estimate and confidence intervals.',
        }}
        className={className}
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Ability Estimate (θ)
            </CardTitle>
            <CardDescription>
              IRT ability with 95% confidence intervals across {data.length} attempts
            </CardDescription>
          </div>

          <div className="flex items-center gap-4">
            {stats && (
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Current θ</p>
                <p className={cn('text-2xl font-bold', currentTrend.color)}>{stats.current}</p>
              </div>
            )}

            <Badge variant="outline" className={cn(currentTrend.color, 'border-current')}>
              <TrendIcon className="h-3 w-3 mr-1" />
              {currentTrend.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 border rounded-lg bg-muted/50">
            <p className={cn('text-xl font-bold', currentTrend.color)}>{stats?.current}</p>
            <p className="text-xs text-muted-foreground">Current θ</p>
          </div>
          <div className="text-center p-3 border rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-blue-600">{stats?.average}</p>
            <p className="text-xs text-muted-foreground">Average θ</p>
          </div>
          <div className="text-center p-3 border rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-purple-600">±{stats?.standardError}</p>
            <p className="text-xs text-muted-foreground">Std Error</p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentTrend.chartColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={currentTrend.chartColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="attemptNumber"
              tick={{ fontSize: 11 }}
              tickFormatter={value => `#${value}`}
              label={{
                value: 'Attempt Number',
                position: 'insideBottom',
                offset: -5,
                fontSize: 11,
              }}
            />

            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={value => value.toFixed(1)}
              label={{ value: 'Ability (θ)', angle: -90, position: 'insideLeft', fontSize: 11 }}
            />

            {/* Zero reference line */}
            <ReferenceLine
              y={0}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{ value: 'θ = 0', position: 'right', fontSize: 10, fill: '#9ca3af' }}
            />

            {/* Confidence band (upper) */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="url(#confidenceBand)"
              isAnimationActive={false}
            />

            {/* Confidence band (lower) */}
            <Area
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              fill="white"
              isAnimationActive={false}
            />

            {/* Ability line */}
            <Line
              type="monotone"
              dataKey="ability"
              stroke={currentTrend.chartColor}
              strokeWidth={2.5}
              dot={(props: { cx?: number; cy?: number }) => {
                const { cx, cy } = props;
                if (cx === undefined || cy === undefined) return null;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={currentTrend.chartColor}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const data = payload[0].payload as AbilityDataPoint;

                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-xl">
                    <p className="font-semibold mb-2">Attempt #{data.attemptNumber}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Ability (θ):</span>
                        <span className="font-medium">{data.ability.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">95% CI:</span>
                        <span className="font-medium">
                          [{data.lowerBound.toFixed(2)}, {data.upperBound.toFixed(2)}]
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Std Error:</span>
                        <span className="font-medium">±{data.standardError.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{data.date}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            <Legend
              content={() => (
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-0.5"
                      style={{ backgroundColor: currentTrend.chartColor }}
                    />
                    <span className="text-muted-foreground">Ability (θ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-3 rounded"
                      style={{ backgroundColor: currentTrend.chartColor, opacity: 0.2 }}
                    />
                    <span className="text-muted-foreground">95% Confidence</span>
                  </div>
                </div>
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Explanation */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Understanding Ability (θ)</p>
              <p className="text-muted-foreground mt-1">
                Ability (θ) is your estimated skill level using Item Response Theory. θ = 0
                represents average ability. Higher values indicate stronger performance. The shaded
                area shows the 95% confidence interval.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
