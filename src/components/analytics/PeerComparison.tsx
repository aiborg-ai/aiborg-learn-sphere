/**
 * PeerComparison Component
 *
 * Shows anonymized peer comparison for students
 * Helps students understand their progress relative to others
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Award,
  BookOpen,
  Target,
} from '@/components/ui/icons';

interface PeerMetric {
  label: string;
  yourValue: number;
  peerAverage: number;
  peerMedian: number;
  percentile: number; // Your percentile rank (0-100)
  unit?: string;
  icon: React.ElementType;
}

interface PeerComparisonProps {
  metrics: {
    coursesCompleted: { yours: number; average: number; median: number; percentile: number };
    studyHours: { yours: number; average: number; median: number; percentile: number };
    averageScore: { yours: number; average: number; median: number; percentile: number };
    completionRate: { yours: number; average: number; median: number; percentile: number };
  };
  peerGroupSize: number;
  peerGroupLabel?: string;
  isLoading?: boolean;
}

function getPercentileLabel(percentile: number): { label: string; color: string } {
  if (percentile >= 90) return { label: 'Excellent', color: 'text-green-500' };
  if (percentile >= 75) return { label: 'Above Average', color: 'text-blue-500' };
  if (percentile >= 50) return { label: 'Average', color: 'text-yellow-500' };
  if (percentile >= 25) return { label: 'Below Average', color: 'text-orange-500' };
  return { label: 'Needs Improvement', color: 'text-red-500' };
}

function getComparisonIcon(percentile: number) {
  if (percentile >= 60) return TrendingUp;
  if (percentile >= 40) return Minus;
  return TrendingDown;
}

export function PeerComparison({
  metrics,
  peerGroupSize,
  peerGroupLabel = 'peers in similar courses',
  isLoading = false,
}: PeerComparisonProps) {
  const metricList: PeerMetric[] = [
    {
      label: 'Courses Completed',
      yourValue: metrics.coursesCompleted.yours,
      peerAverage: metrics.coursesCompleted.average,
      peerMedian: metrics.coursesCompleted.median,
      percentile: metrics.coursesCompleted.percentile,
      icon: BookOpen,
    },
    {
      label: 'Weekly Study Hours',
      yourValue: metrics.studyHours.yours,
      peerAverage: metrics.studyHours.average,
      peerMedian: metrics.studyHours.median,
      percentile: metrics.studyHours.percentile,
      unit: 'hrs',
      icon: Clock,
    },
    {
      label: 'Average Score',
      yourValue: metrics.averageScore.yours,
      peerAverage: metrics.averageScore.average,
      peerMedian: metrics.averageScore.median,
      percentile: metrics.averageScore.percentile,
      unit: '%',
      icon: Target,
    },
    {
      label: 'Completion Rate',
      yourValue: metrics.completionRate.yours,
      peerAverage: metrics.completionRate.average,
      peerMedian: metrics.completionRate.median,
      percentile: metrics.completionRate.percentile,
      unit: '%',
      icon: Award,
    },
  ];

  // Calculate overall percentile
  const overallPercentile = Math.round(
    metricList.reduce((sum, m) => sum + m.percentile, 0) / metricList.length
  );
  const overallLabel = getPercentileLabel(overallPercentile);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Peer Comparison
            </CardTitle>
            <CardDescription>
              Compared to {peerGroupSize.toLocaleString()} {peerGroupLabel}
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge variant="outline" className={`${overallLabel.color} border-current`}>
              Top {100 - overallPercentile}%
            </Badge>
            <div className={`text-xs mt-1 ${overallLabel.color}`}>{overallLabel.label}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {metricList.map(metric => {
            const Icon = metric.icon;
            const ComparisonIcon = getComparisonIcon(metric.percentile);
            const label = getPercentileLabel(metric.percentile);

            return (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ComparisonIcon className={`h-4 w-4 ${label.color}`} />
                    <span className={`text-sm font-bold ${label.color}`}>
                      Top {100 - metric.percentile}%
                    </span>
                  </div>
                </div>

                {/* Visual comparison bar */}
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  {/* Peer average indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-border z-10"
                    style={{
                      left: `${(metric.peerAverage / Math.max(metric.yourValue, metric.peerAverage)) * 100 || 50}%`,
                    }}
                  />

                  {/* Your progress */}
                  <div
                    className="h-full bg-primary/80 flex items-center justify-end pr-2"
                    style={{
                      width: `${(metric.yourValue / Math.max(metric.yourValue, metric.peerAverage)) * 100 || 0}%`,
                    }}
                  >
                    <span className="text-xs font-medium text-primary-foreground">
                      {metric.yourValue}
                      {metric.unit && metric.unit}
                    </span>
                  </div>
                </div>

                {/* Labels */}
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>
                    You: {metric.yourValue}
                    {metric.unit && metric.unit}
                  </span>
                  <span>
                    Avg: {metric.peerAverage.toFixed(1)}
                    {metric.unit && metric.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Privacy note */}
        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
          All comparisons are anonymized. Individual peer data is never shared.
        </div>
      </CardContent>
    </Card>
  );
}
