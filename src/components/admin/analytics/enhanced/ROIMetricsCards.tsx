/**
 * ROI Metrics Cards Component
 * Displays financial ROI analysis for learning investments
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Award, AlertCircle } from '@/components/ui/icons';
import type { ROISummary } from '@/services/team/types';

interface ROIMetricsCardsProps {
  data: ROISummary | undefined;
  isLoading?: boolean;
  isError?: boolean;
}

export function ROIMetricsCards({ data, isLoading, isError }: ROIMetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
            <p className="text-muted-foreground">Failed to load ROI data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total_investment)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.total_enrollments} enrollments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.cost_per_completion)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.total_completions} completions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overall_completion_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              ROI Ratio: {data.roi_ratio.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Annual</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.projected_annual_spend)}</div>
            <p className="text-xs text-muted-foreground mt-2">Based on current rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Best and Worst Value Courses */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Best Value */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Best Value Courses
            </CardTitle>
            <CardDescription>Top 5 courses by completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.best_value_courses.slice(0, 5).map((course, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{course.course}</p>
                    <p className="text-xs text-muted-foreground">
                      Completion: {course.completion_rate.toFixed(1)}%
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 ml-2">
                    #{idx + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Needs Improvement
            </CardTitle>
            <CardDescription>Courses with low completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.worst_value_courses.slice(0, 5).map((course, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{course.course}</p>
                    <p className="text-xs text-muted-foreground">
                      Completion: {course.completion_rate.toFixed(1)}%
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 ml-2">
                    Review
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
