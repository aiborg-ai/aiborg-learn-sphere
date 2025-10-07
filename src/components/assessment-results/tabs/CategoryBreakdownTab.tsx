import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CategoryInsight, RadarChartData } from '../types';

interface CategoryBreakdownTabProps {
  insights: CategoryInsight[];
  radarData: RadarChartData[];
}

export function CategoryBreakdownTab({ insights, radarData }: CategoryBreakdownTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by Category</CardTitle>
        <CardDescription>
          Your strengths and areas for improvement across different AI usage categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Your Score"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{insight.category_name}</span>
                  <Badge
                    variant={
                      insight.strength_level === 'strong'
                        ? 'default'
                        : insight.strength_level === 'proficient'
                          ? 'secondary'
                          : insight.strength_level === 'developing'
                            ? 'outline'
                            : 'destructive'
                    }
                  >
                    {insight.strength_level}
                  </Badge>
                </div>
                <Progress value={insight.percentage} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {insight.category_score}/{insight.category_max_score} points
                  </span>
                  <span>{Math.round(insight.percentage)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
