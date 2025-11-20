/**
 * UserAcquisitionFunnel Component
 *
 * Visualizes the user acquisition and conversion funnel
 * Shows visitors -> signups -> enrollments -> completions
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  BookOpen,
  Award,
  ArrowDown,
} from '@/components/ui/icons';

interface FunnelStage {
  name: string;
  count: number;
  previousPeriodCount?: number;
  icon: React.ElementType;
}

interface UserAcquisitionFunnelProps {
  data: {
    visitors: number;
    signups: number;
    enrollments: number;
    completions: number;
    previousPeriod?: {
      visitors: number;
      signups: number;
      enrollments: number;
      completions: number;
    };
  };
  isLoading?: boolean;
  periodLabel?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function calculateConversionRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return (current / previous) * 100;
}

function calculateChange(current: number, previous?: number): number | null {
  if (previous === undefined || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function UserAcquisitionFunnel({
  data,
  isLoading = false,
  periodLabel = 'Last 30 days',
}: UserAcquisitionFunnelProps) {
  const stages: FunnelStage[] = [
    {
      name: 'Visitors',
      count: data.visitors,
      previousPeriodCount: data.previousPeriod?.visitors,
      icon: Users,
    },
    {
      name: 'Sign Ups',
      count: data.signups,
      previousPeriodCount: data.previousPeriod?.signups,
      icon: UserPlus,
    },
    {
      name: 'Enrollments',
      count: data.enrollments,
      previousPeriodCount: data.previousPeriod?.enrollments,
      icon: BookOpen,
    },
    {
      name: 'Completions',
      count: data.completions,
      previousPeriodCount: data.previousPeriod?.completions,
      icon: Award,
    },
  ];

  // Calculate conversion rates
  const conversionRates = [
    calculateConversionRate(data.signups, data.visitors),
    calculateConversionRate(data.enrollments, data.signups),
    calculateConversionRate(data.completions, data.enrollments),
  ];

  // Overall conversion rate
  const overallConversion = data.visitors > 0 ? (data.completions / data.visitors) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Acquisition Funnel</CardTitle>
            <CardDescription>{periodLabel}</CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {overallConversion.toFixed(1)}% overall conversion
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const change = calculateChange(stage.count, stage.previousPeriodCount);
            const widthPercent = (stage.count / stages[0].count) * 100;

            return (
              <div key={stage.name}>
                {/* Stage */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{formatNumber(stage.count)}</span>
                    {change !== null && (
                      <Badge
                        variant={change >= 0 ? 'default' : 'destructive'}
                        className="text-xs gap-1"
                      >
                        {change >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(change).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative">
                  <Progress value={widthPercent} className="h-8" />
                  <div
                    className="absolute inset-y-0 flex items-center px-3 text-xs font-medium"
                    style={{ color: widthPercent > 50 ? 'white' : 'inherit' }}
                  >
                    {widthPercent.toFixed(0)}%
                  </div>
                </div>

                {/* Conversion arrow between stages */}
                {index < stages.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowDown className="h-3 w-3" />
                      <span>{conversionRates[index].toFixed(1)}% conversion</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{conversionRates[0].toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Signup Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{conversionRates[1].toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Enrollment Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{conversionRates[2].toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Completion Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
