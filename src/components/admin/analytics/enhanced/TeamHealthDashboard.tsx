/**
 * Team Health Dashboard Component
 * Displays composite team health score with breakdown and recommendations
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Heart, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { HealthScoreBreakdown } from '@/services/team/types';

interface TeamHealthDashboardProps {
  data: HealthScoreBreakdown | undefined;
  isLoading?: boolean;
  isError?: boolean;
}

export function TeamHealthDashboard({ data, isLoading, isError }: TeamHealthDashboardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Health Score</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">Failed to load health data</p>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const healthColor = getHealthColor(data.health_status);

  return (
    <Card className={`border-2 ${healthColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Team Health Score
            </CardTitle>
            <CardDescription>Composite organizational health metrics</CardDescription>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold">{data.health_score.toFixed(0)}</p>
            <Badge variant="outline" className="mt-2 capitalize">
              {data.health_status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Metrics Breakdown */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Engagement Score (30%)</span>
              <span className="text-sm font-medium">{data.engagement_score.toFixed(1)}</span>
            </div>
            <Progress value={data.engagement_score} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Completion Rate (25%)</span>
              <span className="text-sm font-medium">{data.completion_rate.toFixed(1)}%</span>
            </div>
            <Progress value={data.completion_rate} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Activity Consistency (20%)</span>
              <span className="text-sm font-medium">{data.activity_consistency.toFixed(1)}</span>
            </div>
            <Progress value={data.activity_consistency} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">On-Time Rate (15%)</span>
              <span className="text-sm font-medium">{data.on_time_rate.toFixed(1)}%</span>
            </div>
            <Progress value={data.on_time_rate} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Learning Velocity (10%)</span>
              <span className="text-sm font-medium">
                {Math.min(data.velocity_score, 100).toFixed(1)}
              </span>
            </div>
            <Progress value={Math.min(data.velocity_score, 100)} className="h-2" />
          </div>
        </div>

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-sm">Strengths</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.strengths.map((strength, idx) => (
                <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Areas of Concern */}
        {data.areas_of_concern.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <h4 className="font-semibold text-sm">Areas of Concern</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.areas_of_concern.map((concern, idx) => (
                <Badge key={idx} variant="secondary" className="bg-orange-100 text-orange-800">
                  {concern}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-sm">Recommendations</h4>
          </div>
          <ul className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
