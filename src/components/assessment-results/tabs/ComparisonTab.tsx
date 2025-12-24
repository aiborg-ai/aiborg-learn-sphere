/**
 * Comparison Tab Component
 * Compare current attempt with previous/best attempts and peers
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttemptComparison as AttemptComparisonComponent } from '../comparison/AttemptComparison';
import { PeerComparison } from '../comparison/PeerComparison';
import { CategoryRadarComparison } from '../charts/CategoryRadarComparison';
import type {
  AttemptHistoryItem,
  AssessmentToolAttempt,
  CategoryPerformance,
} from '@/types/assessmentTools';
import {
  compareWithPrevious,
  compareWithBest,
  compareWithAverage,
  buildPeerComparison,
} from '../utils/comparisonUtils';
import {
  transformToRadarComparisonData,
  findBestAttempt,
  findPreviousAttempt,
} from '../utils/chartUtils';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { GitCompare } from '@/components/ui/icons';

interface ComparisonTabProps {
  attemptHistory: Array<
    AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> }
  >;
  currentAttempt: AssessmentToolAttempt;
  percentileRank?: number;
  peerAverage?: number;
  isLoading?: boolean;
}

export function ComparisonTab({
  attemptHistory,
  currentAttempt,
  percentileRank,
  peerAverage = 60, // Default peer average
  isLoading = false,
}: ComparisonTabProps) {
  const [comparisonType, setComparisonType] = useState<'previous' | 'best' | 'average'>('previous');

  // Find current attempt in history with category performance
  const currentInHistory = useMemo(() => {
    const current = attemptHistory.find(a => a.attempt_id === currentAttempt.id);
    if (current) {
      return {
        ...current,
        categoryPerformance: currentAttempt.performance_by_category || {},
      };
    }

    // Fallback: create from current attempt
    return {
      attempt_id: currentAttempt.id,
      attempt_number: currentAttempt.attempt_number,
      score_percentage: currentAttempt.score_percentage,
      ability_estimate: currentAttempt.ability_estimate,
      completed_at: currentAttempt.completed_at || new Date().toISOString(),
      time_taken_seconds: currentAttempt.time_taken_seconds || 0,
      categoryPerformance: currentAttempt.performance_by_category || {},
    };
  }, [attemptHistory, currentAttempt]);

  // Calculate comparisons
  const comparison = useMemo(() => {
    if (attemptHistory.length < 2) return null;

    const otherAttempts = attemptHistory.filter(a => a.attempt_id !== currentAttempt.id);

    switch (comparisonType) {
      case 'previous': {
        const previous = findPreviousAttempt(attemptHistory);
        if (!previous) return null;
        return compareWithPrevious(currentInHistory, {
          ...previous,
          categoryPerformance: previous.categoryPerformance,
        });
      }
      case 'best': {
        const best = findBestAttempt(otherAttempts);
        if (!best) return null;
        return compareWithBest(currentInHistory, {
          ...best,
          categoryPerformance: best.categoryPerformance,
        });
      }
      case 'average': {
        if (otherAttempts.length === 0) return null;
        return compareWithAverage(currentInHistory, otherAttempts);
      }
      default:
        return null;
    }
  }, [attemptHistory, currentInHistory, comparisonType, currentAttempt.id]);

  // Radar comparison data
  const radarData = useMemo(() => {
    if (!comparison || !comparison.current.categoryPerformance) return [];

    return transformToRadarComparisonData(
      comparison.current.categoryPerformance,
      comparison.comparison.categoryPerformance
    );
  }, [comparison]);

  // Peer comparison data
  const peerComparison = useMemo(() => {
    if (!percentileRank) return null;

    return buildPeerComparison(currentAttempt, percentileRank, peerAverage);
  }, [currentAttempt, percentileRank, peerAverage]);

  // Show empty state if only one attempt
  if (attemptHistory.length < 2 && !peerComparison) {
    return (
      <EmptyStateCard
        config={{
          icon: GitCompare,
          title: 'Unlock Comparisons',
          description:
            'Take at least one more attempt to compare your performance against previous attempts.',
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Comparison Type Selector */}
      {attemptHistory.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Compare With</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="comparison-type" className="text-sm font-medium">
                Select comparison:
              </Label>
              <Select
                value={comparisonType}
                onValueChange={value => setComparisonType(value as 'previous' | 'best' | 'average')}
              >
                <SelectTrigger id="comparison-type" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous">Previous Attempt</SelectItem>
                  <SelectItem value="best">Best Attempt</SelectItem>
                  <SelectItem value="average">Average Attempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attempt Comparison */}
      {comparison && <AttemptComparisonComponent comparison={comparison} />}

      {/* Category Radar Comparison */}
      {radarData.length > 0 && (
        <CategoryRadarComparison
          data={radarData}
          comparisonType={comparisonType}
          isLoading={isLoading}
        />
      )}

      {/* Peer Comparison */}
      {peerComparison && <PeerComparison data={peerComparison} />}
    </div>
  );
}
