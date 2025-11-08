/**
 * Team Momentum Gauge Component
 * Displays team learning momentum with trend visualization
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import type { MomentumSummary } from '@/services/team/types';

interface TeamMomentumGaugeProps {
  data: MomentumSummary | undefined;
  isLoading?: boolean;
  isError?: boolean;
}

export function TeamMomentumGauge({ data, isLoading, isError }: TeamMomentumGaugeProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Momentum</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Momentum</CardTitle>
          <CardDescription>Learning velocity trends</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Failed to load momentum data</p>
        </CardContent>
      </Card>
    );
  }

  const { current_momentum, historical_trends, overall_trend, momentum_score } = data;

  // Determine momentum color and icon
  const getTrendConfig = (trend: string) => {
    switch (trend) {
      case 'accelerating':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: TrendingUp,
          label: 'Accelerating',
          description: 'Team learning is speeding up',
        };
      case 'decelerating':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: TrendingDown,
          label: 'Decelerating',
          description: 'Team learning is slowing down',
        };
      default:
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: Minus,
          label: 'Stable',
          description: 'Team learning is consistent',
        };
    }
  };

  const trendConfig = getTrendConfig(overall_trend);
  const TrendIcon = trendConfig.icon;

  // Prepare chart data
  const chartData = historical_trends.map(t => ({
    week: new Date(t.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completions: t.current_completions,
    change: t.week_over_week_change,
  }));

  return (
    <Card className={trendConfig.borderColor}>
      <CardHeader className={trendConfig.bgColor}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className={`h-5 w-5 ${trendConfig.color}`} />
              Team Momentum
            </CardTitle>
            <CardDescription>{trendConfig.description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <TrendIcon className={`h-6 w-6 ${trendConfig.color}`} />
              <div>
                <p className={`text-3xl font-bold ${trendConfig.color}`}>
                  {momentum_score.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Momentum Score</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Current Week Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-2xl font-bold">{current_momentum?.current_completions || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">This Week</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-2xl font-bold">{current_momentum?.prev_week_completions || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Last Week</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p
              className={`text-2xl font-bold ${current_momentum?.week_over_week_change >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {current_momentum?.week_over_week_change >= 0 ? '+' : ''}
              {current_momentum?.week_over_week_change.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">WoW Change</p>
          </div>
        </div>

        {/* Trend Badge */}
        <div className="flex items-center justify-center mb-6">
          <Badge variant="outline" className={`${trendConfig.color} border-current`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {trendConfig.label}
          </Badge>
        </div>

        {/* Historical Trend Chart */}
        <div className="mt-4">
          <p className="text-sm font-medium mb-4">4-Week Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg p-2 shadow-lg">
                      <p className="text-xs font-semibold">{data.week}</p>
                      <p className="text-xs">Completions: {data.completions}</p>
                      <p
                        className={`text-xs ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        Change: {data.change >= 0 ? '+' : ''}
                        {data.change.toFixed(1)}%
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="completions"
                stroke={trendConfig.color.replace('text-', '#')}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Four Week Average */}
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">4-Week Average</p>
          <p className="text-xl font-bold">
            {current_momentum?.four_week_avg.toFixed(1)} completions/week
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
