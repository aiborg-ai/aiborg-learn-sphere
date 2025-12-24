/**
 * Category Analysis Tab Component
 * Deep dive into category performance trends and insights
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CategoryTrendsChart } from '../charts/CategoryTrendsChart';
import type { AttemptHistoryItem, CategoryPerformance } from '@/types/assessmentTools';
import { transformToCategoryTrends, extractCategoryNames } from '../utils/chartUtils';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { BarChart3, TrendingUp, TrendingDown, Target } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface CategoryAnalysisTabProps {
  attemptHistory: Array<
    AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> }
  >;
  currentCategoryPerformance?: Record<string, CategoryPerformance>;
  isLoading?: boolean;
}

export function CategoryAnalysisTab({
  attemptHistory,
  currentCategoryPerformance,
  isLoading = false,
}: CategoryAnalysisTabProps) {
  // Extract category names
  const categoryNames = useMemo(() => extractCategoryNames(attemptHistory), [attemptHistory]);

  // Transform data for trends chart
  const trendsData = useMemo(() => transformToCategoryTrends(attemptHistory), [attemptHistory]);

  // Calculate category insights
  const categoryInsights = useMemo(() => {
    if (!currentCategoryPerformance) return [];

    return Object.entries(currentCategoryPerformance)
      .map(([name, perf]) => {
        const score = perf.score_percentage;
        const trend =
          score >= 80
            ? 'strong'
            : score >= 60
              ? 'proficient'
              : score >= 40
                ? 'developing'
                : 'needs work';
        const trendColor =
          score >= 80
            ? 'text-green-600'
            : score >= 60
              ? 'text-blue-600'
              : score >= 40
                ? 'text-orange-600'
                : 'text-red-600';

        return {
          name,
          score,
          trend,
          trendColor,
          correct: perf.correct_answers,
          total: perf.questions_answered,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [currentCategoryPerformance]);

  // Show empty state if less than 2 attempts
  if (attemptHistory.length < 2) {
    return (
      <EmptyStateCard
        config={{
          icon: BarChart3,
          title: 'Unlock Category Trends',
          description:
            'Take at least one more attempt to see how your performance evolves across different categories.',
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Trends Chart */}
      <CategoryTrendsChart data={trendsData} categoryNames={categoryNames} isLoading={isLoading} />

      {/* Category Insights */}
      {categoryInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Category Performance Summary
            </CardTitle>
            <CardDescription>
              Current performance across all {categoryInsights.length} categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryInsights.map(category => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium">{category.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {category.correct} / {category.total} correct
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          category.trend === 'strong'
                            ? 'default'
                            : category.trend === 'proficient'
                              ? 'secondary'
                              : 'outline'
                        }
                        className={cn('text-xs', category.trendColor)}
                      >
                        {category.trend}
                      </Badge>
                      <span className={cn('text-lg font-bold', category.trendColor)}>
                        {Math.round(category.score)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={category.score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvement Recommendations */}
      {categoryInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Focus Areas
            </CardTitle>
            <CardDescription>Categories where you can improve the most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryInsights
                .filter(c => c.score < 70)
                .slice(0, 3)
                .map(category => (
                  <div key={category.name} className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {Math.round(category.score)}%
                        </p>
                      </div>
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Focus on this category to improve your overall score. Practice more questions
                      in this area.
                    </p>
                  </div>
                ))}

              {categoryInsights.filter(c => c.score < 70).length === 0 && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-600">Great job!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You're performing well across all categories.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
