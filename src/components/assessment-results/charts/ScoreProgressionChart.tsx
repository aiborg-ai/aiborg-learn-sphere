/**
 * Score Progression Chart Component
 * Visualizes score progression across attempts with passing threshold
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { ScoreDataPoint } from '../types';
import { CHART_COLORS } from '../types';
import { LoadingState } from '../common/LoadingState';
import { EmptyStateCard } from '../common/EmptyStateCard';

interface ScoreProgressionChartProps {
  data: ScoreDataPoint[];
  passingScore: number;
  isLoading?: boolean;
  height?: number;
  className?: string;
}

export function ScoreProgressionChart({
  data,
  passingScore,
  isLoading = false,
  height = 350,
  className,
}: ScoreProgressionChartProps) {
  // Calculate trend
  const trend = useMemo(() => {
    if (data.length < 2) return 'neutral';

    const latestScore = data[data.length - 1].score;
    const previousScore = data[data.length - 2].score;
    const diff = latestScore - previousScore;

    if (Math.abs(diff) < 2) return 'neutral';
    return diff > 0 ? 'improving' : 'declining';
  }, [data]);

  // Calculate stats
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const scores = data.map(d => d.score);
    const currentScore = scores[scores.length - 1];
    const bestScore = Math.max(...scores);
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    return {
      current: currentScore.toFixed(1),
      best: bestScore.toFixed(1),
      average: averageScore.toFixed(1),
    };
  }, [data]);

  // Trend configuration
  const trendConfig = {
    improving: {
      icon: TrendingUp,
      color: 'text-green-600',
      label: 'Improving',
    },
    declining: {
      icon: TrendingDown,
      color: 'text-red-600',
      label: 'Declining',
    },
    neutral: {
      icon: Minus,
      color: 'text-gray-600',
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
          icon: TrendingUp,
          title: 'No Progress Data Yet',
          description:
            'Take another attempt to see your score progression and track your improvement over time.',
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
              <TrendingUp className="h-5 w-5" />
              Score Progression
            </CardTitle>
            <CardDescription>Your score trends across {data.length} attempts</CardDescription>
          </div>

          <div className="flex items-center gap-4">
            {stats && (
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Current</p>
                <p className="text-2xl font-bold text-primary">{stats.current}%</p>
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
            <p className="text-xl font-bold text-primary">{stats?.current}%</p>
            <p className="text-xs text-muted-foreground">Latest</p>
          </div>
          <div className="text-center p-3 border rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-green-600">{stats?.best}%</p>
            <p className="text-xs text-muted-foreground">Best</p>
          </div>
          <div className="text-center p-3 border rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-blue-600">{stats?.average}%</p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.05} />
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
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              tickFormatter={value => `${value}%`}
              label={{ value: 'Score', angle: -90, position: 'insideLeft', fontSize: 11 }}
            />

            {/* Passing score reference line */}
            <ReferenceLine
              y={passingScore}
              stroke={CHART_COLORS.success}
              strokeDasharray="5 5"
              label={{
                value: `Passing: ${passingScore}%`,
                position: 'right',
                fontSize: 11,
                fill: CHART_COLORS.success,
              }}
            />

            <Area
              type="monotone"
              dataKey="score"
              stroke={CHART_COLORS.primary}
              strokeWidth={2.5}
              fill="url(#scoreGradient)"
              dot={(props: { cx?: number; cy?: number; payload?: ScoreDataPoint }) => {
                const { cx, cy, payload } = props;
                if (cx === undefined || cy === undefined || !payload) return null;

                const color = payload.isPassing ? CHART_COLORS.success : CHART_COLORS.warning;

                return <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />;
              }}
              activeDot={{ r: 7, strokeWidth: 2 }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const data = payload[0].payload as ScoreDataPoint;

                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-xl">
                    <p className="font-semibold mb-2">Attempt #{data.attemptNumber}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-medium">{data.score}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{data.date}</span>
                      </div>
                      {data.improvement !== undefined && (
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Improvement:</span>
                          <span
                            className={cn(
                              'font-medium',
                              data.improvement > 0
                                ? 'text-green-600'
                                : data.improvement < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            )}
                          >
                            {data.improvement > 0 ? '+' : ''}
                            {data.improvement.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 mt-2 pt-2 border-t">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={data.isPassing ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {data.isPassing ? 'Passed' : 'Not Passed'}
                        </Badge>
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
                      className="w-4 h-3 rounded"
                      style={{ backgroundColor: CHART_COLORS.primary }}
                    />
                    <span className="text-muted-foreground">Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-0.5 border-dashed"
                      style={{ borderColor: CHART_COLORS.success, borderTopWidth: 2 }}
                    />
                    <span className="text-muted-foreground">Passing Threshold</span>
                  </div>
                </div>
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
