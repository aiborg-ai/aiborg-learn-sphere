/**
 * Time Analysis Chart Component
 * Visualizes time taken per attempt and score/time efficiency
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bar,
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
import { Clock, Zap } from '@/components/ui/icons';
import type { TimeDataPoint } from '../types';
import { CHART_COLORS } from '../types';
import { LoadingState } from '../common/LoadingState';
import { EmptyStateCard } from '../common/EmptyStateCard';

interface TimeAnalysisChartProps {
  data: TimeDataPoint[];
  isLoading?: boolean;
  height?: number;
  className?: string;
}

export function TimeAnalysisChart({
  data,
  isLoading = false,
  height = 350,
  className,
}: TimeAnalysisChartProps) {
  // Calculate stats
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const times = data.map(d => d.timeMinutes);
    const efficiencies = data.map(d => d.efficiency);

    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const fastest = Math.min(...times);
    const avgEfficiency = efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length;

    return {
      avgTime: Math.round(avgTime),
      fastest: Math.round(fastest),
      avgEfficiency: avgEfficiency.toFixed(1),
    };
  }, [data]);

  if (isLoading) {
    return <LoadingState variant="chart" title className={className} />;
  }

  if (data.length === 0) {
    return (
      <EmptyStateCard
        config={{
          icon: Clock,
          title: 'No Time Data Yet',
          description:
            'Complete more attempts to analyze your time efficiency and see how your speed improves.',
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
              <Clock className="h-5 w-5" />
              Time Analysis
            </CardTitle>
            <CardDescription>
              Time spent and efficiency across {data.length} attempts
            </CardDescription>
          </div>

          <Badge variant="outline" className="text-primary border-current">
            <Zap className="h-3 w-3 mr-1" />
            {stats?.avgEfficiency} pts/min
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 border rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-primary">{stats?.avgTime}m</p>
            <p className="text-xs text-muted-foreground">Avg Time</p>
          </div>
          <div className="text-center p-3 border rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-green-600">{stats?.fastest}m</p>
            <p className="text-xs text-muted-foreground">Fastest</p>
          </div>
          <div className="text-center p-3 border rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-purple-600">{stats?.avgEfficiency}</p>
            <p className="text-xs text-muted-foreground">Avg Efficiency</p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              yAxisId="left"
              tick={{ fontSize: 11 }}
              tickFormatter={value => `${value}m`}
              label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft', fontSize: 11 }}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickFormatter={value => `${value.toFixed(1)}`}
              label={{
                value: 'Efficiency (pts/min)',
                angle: 90,
                position: 'insideRight',
                fontSize: 11,
              }}
            />

            {/* Average time reference line */}
            {stats && (
              <ReferenceLine
                yAxisId="left"
                y={stats.avgTime}
                stroke={CHART_COLORS.secondary}
                strokeDasharray="5 5"
                label={{
                  value: `Avg: ${stats.avgTime}m`,
                  position: 'left',
                  fontSize: 11,
                  fill: CHART_COLORS.secondary,
                }}
              />
            )}

            {/* Time bars */}
            <Bar
              yAxisId="left"
              dataKey="timeMinutes"
              fill={CHART_COLORS.primary}
              fillOpacity={0.8}
              radius={[8, 8, 0, 0]}
            />

            {/* Efficiency line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="efficiency"
              stroke={CHART_COLORS.secondary}
              strokeWidth={2.5}
              dot={{ r: 5, fill: CHART_COLORS.secondary, strokeWidth: 2, stroke: 'white' }}
              activeDot={{ r: 7, strokeWidth: 2 }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const data = payload[0].payload as TimeDataPoint;

                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-xl">
                    <p className="font-semibold mb-2">Attempt #{data.attemptNumber}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Time Taken:</span>
                        <span className="font-medium">{data.timeMinutes} minutes</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-medium">{data.score}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Efficiency:</span>
                        <span className="font-medium">{data.efficiency.toFixed(1)} pts/min</span>
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
                      className="w-4 h-3 rounded"
                      style={{ backgroundColor: CHART_COLORS.primary }}
                    />
                    <span className="text-muted-foreground">Time (minutes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-0.5"
                      style={{ backgroundColor: CHART_COLORS.secondary }}
                    />
                    <span className="text-muted-foreground">Efficiency (pts/min)</span>
                  </div>
                </div>
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Insights */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-purple-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Efficiency Insight</p>
              <p className="text-muted-foreground mt-1">
                Your average efficiency is {stats?.avgEfficiency} points per minute. Higher
                efficiency means you're answering correctly while managing time well.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
