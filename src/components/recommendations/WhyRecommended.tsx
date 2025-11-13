/**
 * WhyRecommended Component
 * Explain why a course was recommended
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Target, BarChart3, TrendingUp, Users } from 'lucide-react';
import type { RecommendationReason } from '@/services/ai/RecommendationEngineService';
import { cn } from '@/lib/utils';

export interface WhyRecommendedProps {
  reason: RecommendationReason;
  className?: string;
  detailed?: boolean;
}

/**
 * Get icon for factor type
 */
function getFactorIcon(factor: string) {
  switch (factor) {
    case 'vectorSimilarity':
      return Target;
    case 'skillMatch':
      return BarChart3;
    case 'difficultyMatch':
      return TrendingUp;
    case 'popularityScore':
      return Users;
    default:
      return Sparkles;
  }
}

/**
 * Get label for factor type
 */
function getFactorLabel(factor: string): string {
  switch (factor) {
    case 'vectorSimilarity':
      return 'Content Match';
    case 'skillMatch':
      return 'Skill Alignment';
    case 'difficultyMatch':
      return 'Difficulty Fit';
    case 'popularityScore':
      return 'Popularity';
    default:
      return factor;
  }
}

/**
 * Get color for score
 */
function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-gray-600';
}

/**
 * WhyRecommended Component
 */
export function WhyRecommended({ reason, className, detailed = false }: WhyRecommendedProps) {
  const factors = Object.entries(reason.factors).filter(([, value]) => value !== undefined);

  return (
    <Card className={cn('bg-gradient-to-br from-primary/5 to-transparent', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-base">Why Recommended</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primary Reason */}
        <div className="flex items-start gap-2">
          <Badge variant="secondary" className="mt-0.5">
            {reason.primary}
          </Badge>
        </div>

        {/* Explanation */}
        <p className="text-sm text-muted-foreground leading-relaxed">{reason.explanation}</p>

        {/* Detailed Factors */}
        {detailed && factors.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase">Match Breakdown</p>
            {factors.map(([factorKey, factorValue]) => {
              const Icon = getFactorIcon(factorKey);
              const score = factorValue as number;
              const scorePercent = Math.round(score * 100);

              return (
                <div key={factorKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{getFactorLabel(factorKey)}</span>
                    </div>
                    <span className={cn('text-sm font-bold', getScoreColor(score))}>
                      {scorePercent}%
                    </span>
                  </div>
                  <Progress value={scorePercent} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}

        {/* Confidence Indicator */}
        {!detailed && factors.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <BarChart3 className="h-3 w-3" />
            <span>Based on {factors.length} matching factors</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
