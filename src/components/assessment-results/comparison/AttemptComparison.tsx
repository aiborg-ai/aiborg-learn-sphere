/**
 * Attempt Comparison Component
 * Compare current attempt with previous/best/average attempt
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { GitCompare, TrendingUp, TrendingDown, Minus, Clock, Target } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { AttemptComparison as AttemptComparisonType } from '../types';
import { formatDelta } from '../utils/comparisonUtils';

interface AttemptComparisonProps {
  comparison: AttemptComparisonType;
  className?: string;
}

export function AttemptComparison({ comparison, className }: AttemptComparisonProps) {
  const { current, comparison: comparisonAttempt, deltas, comparisonType } = comparison;

  const comparisonLabels = {
    previous: 'Previous Attempt',
    best: 'Best Attempt',
    average: 'Average Attempt',
  };

  // Trend icon component
  const getTrendIcon = (delta: number) => {
    if (Math.abs(delta) < 2) return Minus;
    return delta > 0 ? TrendingUp : TrendingDown;
  };

  const TrendIcon = getTrendIcon(deltas.scoreDelta);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Attempt Comparison
            </CardTitle>
            <CardDescription>
              Attempt #{current.attemptNumber} vs {comparisonLabels[comparisonType]}
            </CardDescription>
          </div>

          <Badge
            variant="outline"
            className={cn(
              deltas.trend === 'improving'
                ? 'text-green-600 border-green-600'
                : deltas.trend === 'declining'
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-600 border-gray-600'
            )}
          >
            <TrendIcon className="h-3 w-3 mr-1" />
            {deltas.trend === 'improving'
              ? 'Improving'
              : deltas.trend === 'declining'
                ? 'Declining'
                : 'Stable'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Comparison */}
        <div>
          <h4 className="text-sm font-medium mb-3">Overall Score</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="text-2xl font-bold text-primary">{current.scorePercentage}%</span>
              </div>
              <Progress value={current.scorePercentage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {comparisonLabels[comparisonType]}
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {comparisonAttempt.scorePercentage}%
                </span>
              </div>
              <Progress value={comparisonAttempt.scorePercentage} className="h-2" />
            </div>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Score Difference</p>
            <p
              className={cn(
                'text-2xl font-bold',
                deltas.scoreDelta > 0
                  ? 'text-green-600'
                  : deltas.scoreDelta < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
              )}
            >
              {formatDelta(deltas.scoreDelta)}%
            </p>
          </div>
        </div>

        <Separator />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Ability Estimate */}
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Ability (θ)</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current:</span>
                <span className="font-medium">{current.abilityEstimate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comparison:</span>
                <span className="font-medium">{comparisonAttempt.abilityEstimate.toFixed(2)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between text-sm font-medium">
                <span>Difference:</span>
                <span
                  className={cn(
                    deltas.abilityDelta > 0
                      ? 'text-green-600'
                      : deltas.abilityDelta < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                  )}
                >
                  {formatDelta(deltas.abilityDelta, true, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Time Comparison */}
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Time</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current:</span>
                <span className="font-medium">{current.timeMinutes}m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comparison:</span>
                <span className="font-medium">{comparisonAttempt.timeMinutes}m</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between text-sm font-medium">
                <span>Difference:</span>
                <span
                  className={cn(
                    deltas.timeDelta < 0
                      ? 'text-green-600'
                      : deltas.timeDelta > 0
                        ? 'text-orange-600'
                        : 'text-gray-600'
                  )}
                >
                  {deltas.timeDelta > 0 ? '+' : ''}
                  {deltas.timeDelta}m
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Category Comparison */}
        {Object.keys(deltas.categoryDeltas).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Category Performance</h4>
            <div className="space-y-3">
              {Object.entries(deltas.categoryDeltas)
                .sort(([, deltaA], [, deltaB]) => Math.abs(deltaB) - Math.abs(deltaA))
                .slice(0, 5)
                .map(([category, delta]) => {
                  const currentScore = current.categoryPerformance[category] || 0;
                  const comparisonScore = comparisonAttempt.categoryPerformance[category] || 0;

                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            delta > 0
                              ? 'text-green-600 border-green-600'
                              : delta < 0
                                ? 'text-red-600 border-red-600'
                                : 'text-gray-600 border-gray-600'
                          )}
                        >
                          {delta > 0 ? '+' : ''}
                          {delta.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Progress value={currentScore} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Current: {currentScore}%
                          </p>
                        </div>
                        <div>
                          <Progress value={comparisonScore} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Comparison: {comparisonScore}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
