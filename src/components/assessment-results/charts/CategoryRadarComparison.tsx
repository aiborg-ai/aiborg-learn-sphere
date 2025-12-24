/**
 * Category Radar Comparison Chart Component
 * Dual-layer radar chart comparing current vs previous/best attempt by category
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { GitCompare } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { CategoryRadarComparisonData } from '../types';
import { CHART_COLORS } from '../types';
import { LoadingState } from '../common/LoadingState';
import { EmptyStateCard } from '../common/EmptyStateCard';

interface CategoryRadarComparisonProps {
  data: CategoryRadarComparisonData[];
  comparisonType?: 'previous' | 'best' | 'average';
  isLoading?: boolean;
  height?: number;
  className?: string;
}

export function CategoryRadarComparison({
  data,
  comparisonType = 'previous',
  isLoading = false,
  height = 400,
  className,
}: CategoryRadarComparisonProps) {
  // Calculate stats
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const currentScores = data.map(d => d.current);
    const comparisonScores = data
      .map(d => d.comparison)
      .filter((score): score is number => score !== undefined);

    const avgCurrent = currentScores.reduce((sum, s) => sum + s, 0) / currentScores.length;
    const avgComparison =
      comparisonScores.length > 0
        ? comparisonScores.reduce((sum, s) => sum + s, 0) / comparisonScores.length
        : null;

    return {
      avgCurrent: Math.round(avgCurrent),
      avgComparison: avgComparison !== null ? Math.round(avgComparison) : null,
      delta: avgComparison !== null ? Math.round((avgCurrent - avgComparison) * 10) / 10 : null,
    };
  }, [data]);

  const comparisonLabels = {
    previous: 'Previous Attempt',
    best: 'Best Attempt',
    average: 'Average Attempt',
  };

  if (isLoading) {
    return <LoadingState variant="chart" title className={className} />;
  }

  if (data.length === 0) {
    return (
      <EmptyStateCard
        config={{
          icon: GitCompare,
          title: 'No Category Data',
          description: 'Category performance data is not available for comparison.',
        }}
        className={className}
      />
    );
  }

  const hasComparison = data.some(d => d.comparison !== undefined);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Category Comparison
            </CardTitle>
            <CardDescription>
              {hasComparison
                ? `Current vs ${comparisonLabels[comparisonType]}`
                : 'Current performance by category'}
            </CardDescription>
          </div>

          {stats && stats.delta !== null && (
            <Badge
              variant="outline"
              className={cn(
                stats.delta > 0
                  ? 'text-green-600 border-green-600'
                  : stats.delta < 0
                    ? 'text-red-600 border-red-600'
                    : 'text-gray-600 border-gray-600'
              )}
            >
              {stats.delta > 0 ? '+' : ''}
              {stats.delta}% avg
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        {stats && (
          <div className={cn('grid gap-4 mb-6', hasComparison ? 'grid-cols-3' : 'grid-cols-1')}>
            <div className="text-center p-3 border rounded-lg bg-muted/50">
              <p className="text-xl font-bold text-primary">{stats.avgCurrent}%</p>
              <p className="text-xs text-muted-foreground">Current Avg</p>
            </div>
            {stats.avgComparison !== null && (
              <>
                <div className="text-center p-3 border rounded-lg bg-muted/50">
                  <p className="text-xl font-bold text-blue-600">{stats.avgComparison}%</p>
                  <p className="text-xs text-muted-foreground">
                    {comparisonLabels[comparisonType]}
                  </p>
                </div>
                <div className="text-center p-3 border rounded-lg bg-muted/50">
                  <p
                    className={cn(
                      'text-xl font-bold',
                      (stats.delta || 0) > 0
                        ? 'text-green-600'
                        : (stats.delta || 0) < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    )}
                  >
                    {(stats.delta || 0) > 0 ? '+' : ''}
                    {stats.delta}%
                  </p>
                  <p className="text-xs text-muted-foreground">Difference</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Radar Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="#e5e7eb" />

            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={value => {
                // Truncate long category names
                return value.length > 15 ? value.substring(0, 12) + '...' : value;
              }}
            />

            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              tickFormatter={value => `${value}%`}
            />

            {/* Current attempt radar */}
            <Radar
              name="Current"
              dataKey="current"
              stroke={CHART_COLORS.primary}
              fill={CHART_COLORS.primary}
              fillOpacity={0.6}
              strokeWidth={2}
            />

            {/* Comparison attempt radar (if available) */}
            {hasComparison && (
              <Radar
                name={comparisonLabels[comparisonType]}
                dataKey="comparison"
                stroke={CHART_COLORS.info}
                fill={CHART_COLORS.info}
                fillOpacity={0.3}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const data = payload[0].payload as CategoryRadarComparisonData;

                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-xl">
                    <p className="font-semibold mb-2">{data.category}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Current:</span>
                        <span className="font-medium text-primary">{data.current}%</span>
                      </div>
                      {data.comparison !== undefined && (
                        <>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              {comparisonLabels[comparisonType]}:
                            </span>
                            <span className="font-medium text-blue-600">{data.comparison}%</span>
                          </div>
                          <div className="flex justify-between gap-4 mt-2 pt-2 border-t">
                            <span className="text-muted-foreground">Difference:</span>
                            <span
                              className={cn(
                                'font-medium',
                                data.current - data.comparison > 0
                                  ? 'text-green-600'
                                  : data.current - data.comparison < 0
                                    ? 'text-red-600'
                                    : 'text-gray-600'
                              )}
                            >
                              {data.current - data.comparison > 0 ? '+' : ''}
                              {(data.current - data.comparison).toFixed(1)}%
                            </span>
                          </div>
                        </>
                      )}
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
                      style={{ backgroundColor: CHART_COLORS.primary, opacity: 0.6 }}
                    />
                    <span className="text-muted-foreground">Current</span>
                  </div>
                  {hasComparison && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-3 rounded"
                        style={{ backgroundColor: CHART_COLORS.info, opacity: 0.3 }}
                      />
                      <span className="text-muted-foreground">
                        {comparisonLabels[comparisonType]}
                      </span>
                    </div>
                  )}
                </div>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
