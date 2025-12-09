/**
 * Ability Trajectory Chart Component
 *
 * Visualizes ability over time with confidence bands and forecast.
 * Shows historical data with shaded confidence intervals and future predictions.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, Target, Brain } from '@/components/ui/icons';
import { useAbilityTrajectory } from '@/hooks/useRealTimeAnalytics';
import { cn } from '@/lib/utils';

interface AbilityChartPoint {
  date: string;
  ability: number;
  confidenceLower: number;
  confidenceUpper: number;
  standardError: number;
  isForecast: boolean;
}

interface AbilityInsight {
  type: 'improvement' | 'plateau' | 'decline' | 'breakthrough' | 'consistency';
  title: string;
  description: string;
  significance: 'low' | 'medium' | 'high';
}

interface AbilityTrajectoryChartProps {
  categoryId?: string;
  height?: number;
  showInsights?: boolean;
  showVelocity?: boolean;
  className?: string;
}

export function AbilityTrajectoryChart({
  categoryId,
  height = 350,
  showInsights = true,
  showVelocity = true,
  className,
}: AbilityTrajectoryChartProps) {
  const { trajectory, velocity, isLoading } = useAbilityTrajectory(categoryId);

  // Compute chart-ready data
  const chartData = useMemo(() => {
    if (!trajectory?.chartData) return [];
    return trajectory.chartData;
  }, [trajectory?.chartData]);

  // Get trend configuration
  const trendConfig = useMemo(() => {
    if (!trajectory?.trajectory) return null;

    const trend = trajectory.trajectory.trend;
    switch (trend) {
      case 'improving':
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          label: 'Improving',
          chartColor: '#22c55e',
        };
      case 'declining':
        return {
          icon: TrendingDown,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
          label: 'Declining',
          chartColor: '#ef4444',
        };
      default:
        return {
          icon: Minus,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          label: 'Stable',
          chartColor: '#3b82f6',
        };
    }
  }, [trajectory?.trajectory]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ability Trajectory
          </CardTitle>
          <CardDescription>Loading your learning progress...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!trajectory || chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ability Trajectory
          </CardTitle>
          <CardDescription>Track your ability growth over time</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
          <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No trajectory data yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Complete more assessments to see your learning curve
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trendConfig?.icon || Minus;
  const currentAbility = trajectory.trajectory.currentAbility;
  const forecastAbility = trajectory.trajectory.forecast.predictedAbility;

  return (
    <Card className={cn(trendConfig?.bgColor, className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className={`h-5 w-5 ${trendConfig?.color}`} />
              Ability Trajectory
            </CardTitle>
            <CardDescription>
              Your learning progress with {chartData.filter(d => !d.isForecast).length} data points
            </CardDescription>
          </div>

          <div className="flex items-center gap-4">
            {/* Current Ability */}
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current</p>
              <p className={`text-2xl font-bold ${trendConfig?.color}`}>
                {currentAbility.toFixed(2)}
              </p>
            </div>

            {/* Trend Badge */}
            <Badge variant="outline" className={cn(trendConfig?.color, 'border-current')}>
              <TrendIcon className="h-3 w-3 mr-1" />
              {trendConfig?.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Velocity Stats */}
        {showVelocity && velocity && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 border rounded-lg bg-background/50">
              <p className="text-xl font-bold">{(velocity.velocity * 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Weekly Velocity</p>
            </div>
            <div className="text-center p-3 border rounded-lg bg-background/50">
              <p className="text-xl font-bold capitalize">{velocity.trend}</p>
              <p className="text-xs text-muted-foreground">Trend Direction</p>
            </div>
            <div className="text-center p-3 border rounded-lg bg-background/50">
              <p className="text-xl font-bold">{forecastAbility.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">4-Week Forecast</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-background/80 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="confidenceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={trendConfig?.chartColor || '#3b82f6'}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor={trendConfig?.chartColor || '#3b82f6'}
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(value: string) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => value.toFixed(1)}
                label={{ value: 'Ability (θ)', angle: -90, position: 'insideLeft', fontSize: 11 }}
              />

              {/* Confidence band for historical data */}
              <Area
                dataKey="confidenceUpper"
                stroke="none"
                fill="url(#confidenceFill)"
                isAnimationActive={false}
              />
              <Area
                dataKey="confidenceLower"
                stroke="none"
                fill="white"
                isAnimationActive={false}
              />

              {/* Zero reference line */}
              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="5 5" />

              {/* Historical ability line */}
              <Line
                type="monotone"
                dataKey="ability"
                stroke={trendConfig?.chartColor || '#3b82f6'}
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload || payload.isForecast) return null;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={trendConfig?.chartColor || '#3b82f6'}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />

              {/* Forecast dashed line */}
              <Line
                type="monotone"
                dataKey={(d: AbilityChartPoint) => (d.isForecast ? d.ability : null)}
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={{ r: 3, fill: '#8b5cf6' }}
                connectNulls={false}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload[0]) return null;
                  const data = payload[0].payload as AbilityChartPoint;
                  const date = new Date(label);

                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-xl">
                      <p className="font-semibold mb-2">
                        {date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {data.isForecast && (
                          <span className="ml-2 text-xs text-purple-600">(Forecast)</span>
                        )}
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Ability:</span>
                          <span className="font-medium">{data.ability.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">95% CI:</span>
                          <span className="font-medium">
                            [{data.confidenceLower.toFixed(2)}, {data.confidenceUpper.toFixed(2)}]
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">SE:</span>
                          <span className="font-medium">±{data.standardError.toFixed(3)}</span>
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
                        style={{ backgroundColor: trendConfig?.chartColor || '#3b82f6' }}
                      />
                      <span className="text-muted-foreground">Historical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-0.5 border-dashed"
                        style={{ borderColor: '#8b5cf6', borderTopWidth: 2 }}
                      />
                      <span className="text-muted-foreground">Forecast</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-3 rounded"
                        style={{
                          backgroundColor: trendConfig?.chartColor || '#3b82f6',
                          opacity: 0.2,
                        }}
                      />
                      <span className="text-muted-foreground">95% CI</span>
                    </div>
                  </div>
                )}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        {showInsights && trajectory.insights && trajectory.insights.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Learning Insights
            </h4>
            <div className="grid gap-2">
              {trajectory.insights.map((insight: AbilityInsight, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    'p-3 rounded-lg border',
                    insight.significance === 'high'
                      ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20'
                      : 'bg-background/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <InsightIcon type={insight.type} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        insight.significance === 'high' && 'bg-yellow-100 text-yellow-800'
                      )}
                    >
                      {insight.significance}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InsightIcon({ type }: { type: AbilityInsight['type'] }) {
  const iconClass = 'h-5 w-5';

  switch (type) {
    case 'improvement':
      return <TrendingUp className={cn(iconClass, 'text-green-600')} />;
    case 'decline':
      return <TrendingDown className={cn(iconClass, 'text-red-600')} />;
    case 'plateau':
      return <Minus className={cn(iconClass, 'text-yellow-600')} />;
    case 'breakthrough':
      return <Target className={cn(iconClass, 'text-purple-600')} />;
    case 'consistency':
      return <Activity className={cn(iconClass, 'text-blue-600')} />;
    default:
      return <Activity className={cn(iconClass, 'text-gray-600')} />;
  }
}

export default AbilityTrajectoryChart;
