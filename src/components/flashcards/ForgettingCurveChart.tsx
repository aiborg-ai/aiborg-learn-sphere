/**
 * ForgettingCurveChart Component
 *
 * Visualizes the personalized forgetting curve using Recharts.
 * Shows retention decay over time with optimal review threshold.
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

interface DataPoint {
  days: number;
  retention: number;
}

interface ForgettingCurveChartProps {
  data: DataPoint[];
  halfLife: number;
  targetRetention?: number;
  showOptimalZone?: boolean;
}

export function ForgettingCurveChart({
  data,
  halfLife,
  targetRetention = 85,
  showOptimalZone = true,
}: ForgettingCurveChartProps) {
  // Calculate optimal review point (where retention hits target)
  const optimalReviewDay = useMemo(() => {
    const targetPoint = data.find(d => d.retention <= targetRetention);
    return targetPoint?.days || Math.round(halfLife);
  }, [data, targetRetention, halfLife]);

  // Add optimal zone data
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      optimalZone: d.retention >= targetRetention ? d.retention : null,
      belowTarget: d.retention < targetRetention ? d.retention : null,
    }));
  }, [data, targetRetention]);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

          <XAxis
            dataKey="days"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ className: 'stroke-muted' }}
            label={{
              value: 'Days since review',
              position: 'insideBottom',
              offset: -5,
              fontSize: 12,
              className: 'fill-muted-foreground',
            }}
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ className: 'stroke-muted' }}
            tickFormatter={value => `${value}%`}
            label={{
              value: 'Retention',
              angle: -90,
              position: 'insideLeft',
              fontSize: 12,
              className: 'fill-muted-foreground',
            }}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium">Day {data.days}</p>
                    <p className="text-sm text-muted-foreground">
                      Retention: <span className="font-medium">{data.retention.toFixed(1)}%</span>
                    </p>
                    {data.retention < targetRetention && (
                      <p className="text-xs text-orange-500 mt-1">
                        Below target - review recommended
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Target retention line */}
          <ReferenceLine
            y={targetRetention}
            stroke="#f97316"
            strokeDasharray="5 5"
            label={{
              value: `${targetRetention}% target`,
              position: 'right',
              fill: '#f97316',
              fontSize: 11,
            }}
          />

          {/* Optimal review day line */}
          <ReferenceLine
            x={optimalReviewDay}
            stroke="#3b82f6"
            strokeDasharray="5 5"
            label={{
              value: `Review day ${optimalReviewDay}`,
              position: 'top',
              fill: '#3b82f6',
              fontSize: 11,
            }}
          />

          {/* Half-life marker */}
          <ReferenceLine
            x={Math.round(halfLife)}
            stroke="#8b5cf6"
            strokeDasharray="3 3"
            label={{
              value: `½ life`,
              position: 'insideTopRight',
              fill: '#8b5cf6',
              fontSize: 10,
            }}
          />

          {/* Optimal zone area */}
          {showOptimalZone && (
            <Area
              type="monotone"
              dataKey="optimalZone"
              stroke="none"
              fill="url(#retentionGradient)"
              fillOpacity={1}
            />
          )}

          {/* Below target area */}
          {showOptimalZone && (
            <Area
              type="monotone"
              dataKey="belowTarget"
              stroke="none"
              fill="url(#dangerGradient)"
              fillOpacity={1}
            />
          )}

          {/* Main retention line */}
          <Line
            type="monotone"
            dataKey="retention"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#22c55e' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500" />
          <span>Retention curve</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-orange-500 border-dashed border-t" />
          <span>{targetRetention}% target</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500 border-dashed border-t" />
          <span>Optimal review</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-purple-500 border-dashed border-t" />
          <span>Half-life ({halfLife.toFixed(1)}d)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini version for card displays
 */
export function ForgettingCurveMini({
  data,
  className,
}: {
  data: DataPoint[];
  className?: string;
}) {
  return (
    <div className={className || 'w-full h-16'}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="retention"
            stroke="#22c55e"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ForgettingCurveChart;
