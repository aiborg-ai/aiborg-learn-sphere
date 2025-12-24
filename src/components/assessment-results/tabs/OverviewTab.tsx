/**
 * Overview Tab Component
 * Main overview of assessment results with performance breakdown and recommendations
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Lightbulb, CheckCircle2 } from '@/components/ui/icons';
import { EnhancedPerformanceBreakdown } from '@/components/assessment/EnhancedPerformanceBreakdown';
import type { AssessmentResults } from '@/types/assessmentTools';

interface OverviewTabProps {
  results: AssessmentResults;
  averageScore: number;
}

export function OverviewTab({ results, averageScore }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Enhanced Performance Breakdown */}
      {results.performance_by_category.length > 0 && (
        <EnhancedPerformanceBreakdown
          performance={results.performance_by_category}
          averageScore={averageScore}
        />
      )}

      {/* Recommendations */}
      {results.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>Suggestions to improve your skills</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Badges Earned */}
      {results.badges_earned && results.badges_earned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Badges Earned
            </CardTitle>
            <CardDescription>Achievements unlocked in this attempt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {results.badges_earned.map((badge, index) => (
                <Badge key={index} variant="secondary" className="text-sm px-4 py-2">
                  <Award className="mr-2 h-4 w-4" />
                  {badge}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
