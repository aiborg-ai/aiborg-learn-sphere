/**
 * Category Trends Chart Component
 * Multi-line chart showing performance trends for each category over time
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { BarChart3 } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { CategoryTrendData } from '../types';
import { CHART_COLORS } from '../types';
import { LoadingState } from '../common/LoadingState';
import { EmptyStateCard } from '../common/EmptyStateCard';

interface CategoryTrendsChartProps {
  data: CategoryTrendData[];
  categoryNames: string[];
  isLoading?: boolean;
  height?: number;
  className?: string;
}

export function CategoryTrendsChart({
  data,
  categoryNames,
  isLoading = false,
  height = 350,
  className,
}: CategoryTrendsChartProps) {
  // Assign colors to categories
  const categoryColors = useMemo(() => {
    const colors: Record<string, string> = {};
    categoryNames.forEach((name, _index) => {
      colors[name] = CHART_COLORS.categories[index % CHART_COLORS.categories.length];
    });
    return colors;
  }, [categoryNames]);

  // Calculate improvement stats
  const stats = useMemo(() => {
    if (data.length < 2 || categoryNames.length === 0) return null;

    const improvements: Record<string, number> = {};

    categoryNames.forEach(category => {
      const firstValue = data[0][category] as number;
      const lastValue = data[data.length - 1][category] as number;

      if (typeof firstValue === 'number' && typeof lastValue === 'number') {
        improvements[category] = Math.round((lastValue - firstValue) * 10) / 10;
      }
    });

    // Find most improved category
    const mostImproved = Object.entries(improvements).reduce((best, [cat, improvement]) =>
      improvement > (improvements[best[0]] || -Infinity) ? [cat, improvement] : best
    );

    return {
      improvements,
      mostImproved: {
        category: mostImproved[0],
        value: mostImproved[1],
      },
    };
  }, [data, categoryNames]);

  if (isLoading) {
    return <LoadingState variant="chart" title className={className} />;
  }

  if (data.length === 0 || categoryNames.length === 0) {
    return (
      <EmptyStateCard
        config={{
          icon: BarChart3,
          title: 'No Trend Data',
          description: 'Complete more attempts to see category performance trends over time.',
        }}
        className={className}
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Category Trends
          </CardTitle>
          <CardDescription>
            Performance trends for {categoryNames.length} categories across {data.length} attempts
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {/* Most Improved Category */}
        {stats && stats.mostImproved.value !== 0 && (
          <div className="mb-6 p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm font-medium mb-1">Most Improved Category</p>
            <div className="flex items-center justify-between">
              <span className="text-base">{stats.mostImproved.category}</span>
              <span
                className={cn(
                  'font-bold text-lg',
                  stats.mostImproved.value > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {stats.mostImproved.value > 0 ? '+' : ''}
                {stats.mostImproved.value}%
              </span>
            </div>
          </div>
        )}

        {/* Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

            {/* Line for each category */}
            {categoryNames.map((category, _index) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={categoryColors[category]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))}

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;

                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-xl max-w-xs">
                    <p className="font-semibold mb-2">Attempt #{label}</p>
                    <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
                      {payload
                        .filter(p => typeof p.value === 'number')
                        .sort((a, b) => (b.value as number) - (a.value as number))
                        .map((entry, _index) => (
                          <div key={index} className="flex justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-muted-foreground truncate max-w-[120px]">
                                {entry.name}:
                              </span>
                            </div>
                            <span className="font-medium">{entry.value}%</span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              }}
            />

            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              content={({ payload }) => (
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  {payload?.map((entry, _index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-4 h-0.5" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground text-xs truncate max-w-[100px]">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Improvement Summary */}
        {stats && stats.improvements && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(stats.improvements)
              .filter(([_, improvement]) => improvement !== 0)
              .slice(0, 6)
              .map(([category, improvement]) => (
                <div key={category} className="text-center p-2 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground truncate">{category}</p>
                  <p
                    className={cn(
                      'text-sm font-bold',
                      improvement > 0
                        ? 'text-green-600'
                        : improvement < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    )}
                  >
                    {improvement > 0 ? '+' : ''}
                    {improvement}%
                  </p>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
