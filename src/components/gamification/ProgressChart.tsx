/**
 * Progress Chart Component
 * Shows user's level and points progression over time
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ChartTooltipProps } from '@/types/charts';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import { TrendingUp, Award, Zap } from '@/components/ui/icons';

interface DataPoint {
  date: string;
  points: number;
  level: number;
  streak?: number;
}

interface ProgressChartProps {
  data: DataPoint[];
  type?: 'area' | 'line' | 'composed';
  showStreak?: boolean;
  height?: number;
}

export function ProgressChart({
  data,
  type = 'area',
  showStreak = true,
  height = 300,
}: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Over Time
          </CardTitle>
          <CardDescription>Your learning journey will be visualized here</CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No progress data yet</p>
            <p className="text-sm mt-1">Complete more assessments to see your growth!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Points', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Level', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="points"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Total Points"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="level"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Level"
            />
            {showStreak && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="streak"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#f59e0b', r: 3 }}
                name="Streak"
              />
            )}
          </LineChart>
        );

      case 'composed':
        return (
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="left" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="points"
              fill="url(#colorPoints)"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Total Points"
            />
            <Bar
              yAxisId="right"
              dataKey="level"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              name="Level"
            />
          </ComposedChart>
        );

      case 'area':
      default:
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="points"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPoints)"
              name="Total Points"
            />
            <Area
              type="monotone"
              dataKey="level"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLevel)"
              name="Level"
            />
          </AreaChart>
        );
    }
  };

  // Calculate stats
  const totalGrowth = data.length > 1 ? data[data.length - 1].points - data[0].points : 0;
  const levelGrowth = data.length > 1 ? data[data.length - 1].level - data[0].level : 0;
  const maxStreak = showStreak && data.length > 0 ? Math.max(...data.map(d => d.streak || 0)) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Over Time
            </CardTitle>
            <CardDescription>
              Your learning journey across {data.length} data points
            </CardDescription>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="text-right">
              <p className="text-gray-500 flex items-center gap-1">
                <Award className="h-4 w-4" />
                Points Growth
              </p>
              <p className="font-bold text-blue-600">+{totalGrowth.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Levels Gained
              </p>
              <p className="font-bold text-purple-600">+{levelGrowth}</p>
            </div>
            {showStreak && maxStreak > 0 && (
              <div className="text-right">
                <p className="text-gray-500 flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Max Streak
                </p>
                <p className="font-bold text-orange-600">{maxStreak} days</p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
