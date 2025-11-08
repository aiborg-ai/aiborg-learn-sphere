/**
 * Skills Gap Chart Component
 * Displays horizontal bar chart showing skills coverage gaps across the organization
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AlertCircle, TrendingDown } from 'lucide-react';
import type { SkillsGap } from '@/services/team/types';

interface SkillsGapChartProps {
  data: SkillsGap[];
  isLoading?: boolean;
  isError?: boolean;
}

export function SkillsGapChart({ data, isLoading, isError }: SkillsGapChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills Gap Analysis</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills Gap Analysis</CardTitle>
          <CardDescription>Top skills gaps in your organization</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[400px]">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {isError ? 'Failed to load skills gap data' : 'No skills data available'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Add skills to courses to enable gap analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by gap percentage and take top 10
  const topGaps = [...data].sort((a, b) => b.gap_percentage - a.gap_percentage).slice(0, 10);

  // Color coding based on gap severity
  const getBarColor = (gapPercentage: number) => {
    if (gapPercentage >= 70) return '#ef4444'; // Red - critical
    if (gapPercentage >= 50) return '#f97316'; // Orange - high
    if (gapPercentage >= 30) return '#eab308'; // Yellow - medium
    return '#22c55e'; // Green - low
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Skills Gap Analysis
            </CardTitle>
            <CardDescription>Top 10 skills gaps across your organization</CardDescription>
          </div>
          <Badge variant="outline">{data.length} total skills</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topGaps} layout="vertical" margin={{ left: 120, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              label={{ value: 'Gap %', position: 'insideBottom', offset: -5 }}
            />
            <YAxis type="category" dataKey="skill_name" width={110} tick={{ fontSize: 12 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const data = payload[0].payload as SkillsGap;
                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-sm mb-2">{data.skill_name}</p>
                    <div className="space-y-1 text-xs">
                      <p>
                        <span className="text-muted-foreground">Gap:</span>{' '}
                        <span className="font-medium">{data.gap_percentage.toFixed(1)}%</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Missing:</span>{' '}
                        <span className="font-medium">
                          {data.members_without_skill} / {data.total_members} members
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Level:</span>{' '}
                        <Badge variant="secondary" className="text-xs">
                          {data.skill_level}
                        </Badge>
                      </p>
                      {data.skill_category && (
                        <p>
                          <span className="text-muted-foreground">Category:</span>{' '}
                          <span className="capitalize">{data.skill_category}</span>
                        </p>
                      )}
                      <div className="pt-2 mt-2 border-t">
                        <p className="text-muted-foreground mb-1">Related Courses:</p>
                        {data.related_courses.slice(0, 3).map((course, idx) => (
                          <p key={idx} className="text-xs">
                            • {course.course_title}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="gap_percentage" radius={[0, 4, 4, 0]}>
              {topGaps.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.gap_percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {topGaps.filter(g => g.gap_percentage >= 70).length}
            </p>
            <p className="text-xs text-muted-foreground">Critical Gaps (&gt;70%)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {topGaps.filter(g => g.gap_percentage >= 50 && g.gap_percentage < 70).length}
            </p>
            <p className="text-xs text-muted-foreground">High Gaps (50-70%)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {topGaps.filter(g => g.gap_percentage >= 30 && g.gap_percentage < 50).length}
            </p>
            <p className="text-xs text-muted-foreground">Medium Gaps (30-50%)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
