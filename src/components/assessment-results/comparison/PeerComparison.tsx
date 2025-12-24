/**
 * Peer Comparison Component
 * Compare user performance with peer averages
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Users, TrendingUp, Award } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { PeerComparisonData } from '../types';

interface PeerComparisonProps {
  data: PeerComparisonData;
  className?: string;
}

export function PeerComparison({ data, className }: PeerComparisonProps) {
  const { currentScore, percentileRank, peerAverage, categoryComparison } = data;

  // Determine percentile category
  const getPercentileCategory = (percentile: number) => {
    if (percentile >= 90)
      return { label: 'Top 10%', color: 'text-yellow-600', variant: 'default' as const };
    if (percentile >= 75)
      return { label: 'Top 25%', color: 'text-green-600', variant: 'default' as const };
    if (percentile >= 50)
      return { label: 'Above Average', color: 'text-blue-600', variant: 'secondary' as const };
    if (percentile >= 25)
      return { label: 'Average', color: 'text-gray-600', variant: 'outline' as const };
    return { label: 'Below Average', color: 'text-orange-600', variant: 'outline' as const };
  };

  const percentileCategory = getPercentileCategory(percentileRank);
  const scoreDifference = currentScore - peerAverage;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Peer Comparison
            </CardTitle>
            <CardDescription>How you compare to other test takers</CardDescription>
          </div>

          <Badge variant={percentileCategory.variant} className={percentileCategory.color}>
            <Award className="h-3 w-3 mr-1" />
            {percentileCategory.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Percentile Rank */}
        <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-primary/5 to-transparent">
          <p className="text-sm text-muted-foreground mb-2">Your Percentile Rank</p>
          <p className={cn('text-5xl font-bold mb-2', percentileCategory.color)}>
            {percentileRank}
            <span className="text-2xl">th</span>
          </p>
          <p className="text-sm text-muted-foreground">
            You scored better than {percentileRank}% of test takers
          </p>
        </div>

        <Separator />

        {/* Score Comparison */}
        <div>
          <h4 className="text-sm font-medium mb-3">Overall Score Comparison</h4>
          <div className="space-y-4">
            {/* Your Score */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Your Score</span>
                <span className="text-2xl font-bold text-primary">{currentScore}%</span>
              </div>
              <Progress value={currentScore} className="h-3" />
            </div>

            {/* Peer Average */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Peer Average</span>
                <span className="text-2xl font-bold text-blue-600">{peerAverage}%</span>
              </div>
              <Progress value={peerAverage} className="h-3" />
            </div>

            {/* Difference */}
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground mb-1">Difference from Average</p>
              <div className="flex items-center justify-center gap-2">
                {scoreDifference > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : scoreDifference < 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
                ) : null}
                <p
                  className={cn(
                    'text-2xl font-bold',
                    scoreDifference > 0
                      ? 'text-green-600'
                      : scoreDifference < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                  )}
                >
                  {scoreDifference > 0 ? '+' : ''}
                  {scoreDifference.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category-Level Comparison */}
        {categoryComparison && categoryComparison.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3">Category-Level Performance</h4>
              <div className="space-y-3">
                {categoryComparison
                  .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
                  .map(category => (
                    <div key={category.categoryName} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.categoryName}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            category.difference > 0
                              ? 'text-green-600 border-green-600'
                              : category.difference < 0
                                ? 'text-red-600 border-red-600'
                                : 'text-gray-600 border-gray-600'
                          )}
                        >
                          {category.difference > 0 ? '+' : ''}
                          {category.difference.toFixed(1)}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Your Score */}
                        <div>
                          <Progress value={category.userScore} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">
                            You: {category.userScore}%
                          </p>
                        </div>

                        {/* Peer Average */}
                        <div>
                          <Progress value={category.peerAverage} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Avg: {category.peerAverage}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Insight */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Performance Insight</p>
              <p className="text-muted-foreground mt-1">
                {percentileRank >= 75
                  ? "Excellent work! You're performing significantly better than most test takers."
                  : percentileRank >= 50
                    ? "Good job! You're performing above average compared to your peers."
                    : percentileRank >= 25
                      ? "You're performing at an average level. Focus on improvement areas for better results."
                      : "There's room for improvement. Review the recommendations to enhance your performance."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
