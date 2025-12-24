/**
 * Comparison Utilities
 * Calculate deltas and comparisons between attempts
 */

import type {
  AttemptHistoryItem,
  AssessmentToolAttempt,
  CategoryPerformance,
} from '@/types/assessmentTools';
import type {
  AttemptComparison,
  AttemptComparisonData,
  ComparisonDeltas,
  PeerComparisonData,
  PeerCategoryComparison,
} from '../types';

/**
 * Build comparison data from an attempt
 */
function buildAttemptComparisonData(
  attempt: AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> },
  isCurrentAttempt = false
): AttemptComparisonData {
  return {
    attemptNumber: attempt.attempt_number,
    scorePercentage: Math.round(attempt.score_percentage * 10) / 10,
    abilityEstimate: Math.round(attempt.ability_estimate * 100) / 100,
    timeMinutes: Math.round(attempt.time_taken_seconds / 60),
    categoryPerformance: attempt.categoryPerformance
      ? Object.fromEntries(
          Object.entries(attempt.categoryPerformance).map(([name, perf]) => [
            name,
            Math.round(perf.score_percentage),
          ])
        )
      : {},
    completedAt: attempt.completed_at,
  };
}

/**
 * Calculate deltas between two attempts
 */
function calculateDeltas(
  current: AttemptComparisonData,
  comparison: AttemptComparisonData
): ComparisonDeltas {
  const scoreDelta = Math.round((current.scorePercentage - comparison.scorePercentage) * 10) / 10;
  const abilityDelta =
    Math.round((current.abilityEstimate - comparison.abilityEstimate) * 100) / 100;
  const timeDelta = current.timeMinutes - comparison.timeMinutes;

  // Calculate category deltas
  const categoryDeltas: Record<string, number> = {};
  const allCategories = new Set([
    ...Object.keys(current.categoryPerformance),
    ...Object.keys(comparison.categoryPerformance),
  ]);

  allCategories.forEach(category => {
    const currentScore = current.categoryPerformance[category] || 0;
    const comparisonScore = comparison.categoryPerformance[category] || 0;
    categoryDeltas[category] = Math.round((currentScore - comparisonScore) * 10) / 10;
  });

  // Determine trend
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  const threshold = 2; // 2% threshold

  if (Math.abs(scoreDelta) >= threshold) {
    trend = scoreDelta > 0 ? 'improving' : 'declining';
  }

  return {
    scoreDelta,
    abilityDelta,
    timeDelta,
    categoryDeltas,
    trend,
  };
}

/**
 * Compare current attempt with a specific attempt
 */
export function compareAttempts(
  current: AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> },
  comparison: AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> },
  comparisonType: 'previous' | 'best' | 'average'
): AttemptComparison {
  const currentData = buildAttemptComparisonData(current, true);
  const comparisonData = buildAttemptComparisonData(comparison);
  const deltas = calculateDeltas(currentData, comparisonData);

  return {
    current: currentData,
    comparison: comparisonData,
    deltas,
    comparisonType,
  };
}

/**
 * Compare current attempt with previous attempt
 */
export function compareWithPrevious(
  current: AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> },
  previous: AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> }
): AttemptComparison {
  return compareAttempts(current, previous, 'previous');
}

/**
 * Compare current attempt with best attempt
 */
export function compareWithBest(
  current: AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> },
  best: AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> }
): AttemptComparison {
  return compareAttempts(current, best, 'best');
}

/**
 * Calculate average attempt from history
 */
export function calculateAverageAttempt(
  attempts: Array<
    AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> }
  >
): AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> } {
  if (attempts.length === 0) {
    throw new Error('Cannot calculate average from empty attempts array');
  }

  const avgScorePercentage =
    attempts.reduce((sum, a) => sum + a.score_percentage, 0) / attempts.length;
  const avgAbilityEstimate =
    attempts.reduce((sum, a) => sum + a.ability_estimate, 0) / attempts.length;
  const avgTimeSeconds =
    attempts.reduce((sum, a) => sum + a.time_taken_seconds, 0) / attempts.length;

  // Calculate average category performance
  const categoryPerformance: Record<string, CategoryPerformance> = {};
  const categoryScores: Record<string, number[]> = {};

  attempts.forEach(attempt => {
    if (attempt.categoryPerformance) {
      Object.entries(attempt.categoryPerformance).forEach(([categoryName, perf]) => {
        if (!categoryScores[categoryName]) {
          categoryScores[categoryName] = [];
        }
        categoryScores[categoryName].push(perf.score_percentage);
      });
    }
  });

  Object.entries(categoryScores).forEach(([categoryName, scores]) => {
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    categoryPerformance[categoryName] = {
      category_name: categoryName,
      questions_answered: 0, // Not applicable for average
      correct_answers: 0, // Not applicable for average
      score_percentage: avgScore,
    };
  });

  return {
    attempt_id: 'average',
    attempt_number: 0,
    score_percentage: avgScorePercentage,
    ability_estimate: avgAbilityEstimate,
    completed_at: new Date().toISOString(),
    time_taken_seconds: avgTimeSeconds,
    categoryPerformance,
  };
}

/**
 * Compare with average of all attempts
 */
export function compareWithAverage(
  current: AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> },
  allAttempts: Array<
    AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> }
  >
): AttemptComparison {
  const average = calculateAverageAttempt(allAttempts);
  return compareAttempts(current, average, 'average');
}

/**
 * Build peer comparison data
 */
export function buildPeerComparison(
  currentAttempt: AssessmentToolAttempt,
  percentileRank: number,
  peerAverage: number
): PeerComparisonData {
  const categoryComparison: PeerCategoryComparison[] = [];

  if (currentAttempt.performance_by_category) {
    Object.entries(currentAttempt.performance_by_category).forEach(
      ([categoryName, performance]) => {
        // Calculate peer average for this category (simplified - would need actual data)
        const peerCategoryAverage = peerAverage;
        const difference = performance.score_percentage - peerCategoryAverage;

        categoryComparison.push({
          categoryName,
          userScore: Math.round(performance.score_percentage),
          peerAverage: Math.round(peerCategoryAverage),
          difference: Math.round(difference * 10) / 10,
          percentile: percentileRank, // Simplified - would vary by category
        });
      }
    );
  }

  return {
    currentScore: Math.round(currentAttempt.score_percentage),
    percentileRank,
    peerAverage: Math.round(peerAverage),
    categoryComparison,
  };
}

/**
 * Get trend indicator text
 */
export function getTrendText(delta: number, metric: string = 'score'): string {
  if (Math.abs(delta) < 0.1) {
    return `No change in ${metric}`;
  }

  const direction = delta > 0 ? 'increased' : 'decreased';
  const value = Math.abs(delta);

  if (metric === 'time') {
    return `${direction} by ${value} minutes`;
  }

  return `${direction} by ${value}%`;
}

/**
 * Get trend color class
 */
export function getTrendColor(
  delta: number,
  higherIsBetter: boolean = true
): 'success' | 'warning' | 'danger' | 'default' {
  const threshold = 2;

  if (Math.abs(delta) < threshold) {
    return 'default';
  }

  const isPositive = delta > 0;

  if (higherIsBetter) {
    return isPositive ? 'success' : 'danger';
  } else {
    return isPositive ? 'danger' : 'success';
  }
}

/**
 * Format delta for display
 */
export function formatDelta(
  delta: number,
  includeSign: boolean = true,
  decimals: number = 1
): string {
  const sign = delta > 0 ? '+' : '';
  const formatted = delta.toFixed(decimals);

  return includeSign ? `${sign}${formatted}` : formatted;
}

/**
 * Calculate improvement rate (percentage of attempts that improved)
 */
export function calculateImprovementRate(attempts: AttemptHistoryItem[]): number {
  if (attempts.length < 2) return 0;

  let improvements = 0;

  for (let i = 1; i < attempts.length; i++) {
    if (attempts[i].score_percentage > attempts[i - 1].score_percentage) {
      improvements++;
    }
  }

  return Math.round((improvements / (attempts.length - 1)) * 100);
}
