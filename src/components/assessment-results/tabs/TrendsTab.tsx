/**
 * Trends Tab Component
 * Visualizes score progression, time analysis, and ability estimate trends
 */

import React, { useMemo } from 'react';
import { ScoreProgressionChart } from '../charts/ScoreProgressionChart';
import { TimeAnalysisChart } from '../charts/TimeAnalysisChart';
import { AbilityEstimateChart } from '../charts/AbilityEstimateChart';
import type { AttemptHistoryItem, AssessmentTool } from '@/types/assessmentTools';
import {
  transformToScoreData,
  transformToTimeData,
  transformToAbilityData,
} from '../utils/chartUtils';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { TrendingUp } from '@/components/ui/icons';

interface TrendsTabProps {
  attemptHistory: AttemptHistoryItem[];
  currentAttempt: {
    ability_standard_error?: number;
  };
  tool: AssessmentTool;
  isLoading?: boolean;
}

export function TrendsTab({
  attemptHistory,
  currentAttempt,
  tool,
  isLoading = false,
}: TrendsTabProps) {
  // Transform data for charts
  const scoreData = useMemo(
    () => transformToScoreData(attemptHistory, tool.passing_score_percentage),
    [attemptHistory, tool.passing_score_percentage]
  );

  const timeData = useMemo(() => transformToTimeData(attemptHistory), [attemptHistory]);

  // Enrich attempt history with standard error for ability chart
  const enrichedHistory = useMemo(() => {
    return attemptHistory.map((attempt, index) => ({
      ...attempt,
      ability_standard_error:
        index === attemptHistory.length - 1 ? currentAttempt.ability_standard_error : 0.5, // Default SE for historical attempts
    }));
  }, [attemptHistory, currentAttempt.ability_standard_error]);

  const abilityData = useMemo(() => transformToAbilityData(enrichedHistory), [enrichedHistory]);

  // Show empty state if less than 2 attempts
  if (attemptHistory.length < 2) {
    return (
      <EmptyStateCard
        config={{
          icon: TrendingUp,
          title: 'Unlock Trend Analysis',
          description:
            'Take at least one more attempt to unlock trend visualizations and track your progress over time.',
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Score Progression Chart */}
      <ScoreProgressionChart
        data={scoreData}
        passingScore={tool.passing_score_percentage}
        isLoading={isLoading}
      />

      {/* Time Analysis Chart */}
      <TimeAnalysisChart data={timeData} isLoading={isLoading} />

      {/* Ability Estimate Chart */}
      <AbilityEstimateChart data={abilityData} isLoading={isLoading} />
    </div>
  );
}
