/**
 * Chart Utilities
 * Transform raw attempt data into chart-ready formats
 */

import type { AttemptHistoryItem, CategoryPerformance } from '@/types/assessmentTools';
import type {
  ScoreDataPoint,
  TimeDataPoint,
  CategoryRadarComparisonData,
  CategoryTrendData,
  AbilityDataPoint,
} from '../types';

/**
 * Transform attempt history into score progression data
 */
export function transformToScoreData(
  attempts: AttemptHistoryItem[],
  passingScore: number
): ScoreDataPoint[] {
  return attempts.map(attempt => ({
    attemptNumber: attempt.attempt_number,
    score: Math.round(attempt.score_percentage * 10) / 10,
    date: new Date(attempt.completed_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    improvement: attempt.improvement_from_previous || undefined,
    isPassing: attempt.score_percentage >= passingScore,
  }));
}

/**
 * Transform attempt history into time analysis data
 */
export function transformToTimeData(attempts: AttemptHistoryItem[]): TimeDataPoint[] {
  return attempts.map(attempt => {
    const timeMinutes = Math.round(attempt.time_taken_seconds / 60);
    const efficiency = timeMinutes > 0 ? attempt.score_percentage / timeMinutes : 0;

    return {
      attemptNumber: attempt.attempt_number,
      timeMinutes,
      score: Math.round(attempt.score_percentage * 10) / 10,
      efficiency: Math.round(efficiency * 10) / 10,
      date: new Date(attempt.completed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };
  });
}

/**
 * Transform category performance into radar chart data for comparison
 */
export function transformToRadarComparisonData(
  current: Record<string, CategoryPerformance>,
  comparison?: Record<string, CategoryPerformance>
): CategoryRadarComparisonData[] {
  const categories = Object.keys(current);

  return categories.map(categoryName => {
    const currentPerf = current[categoryName];
    const comparisonPerf = comparison?.[categoryName];

    return {
      category: categoryName,
      current: Math.round(currentPerf.score_percentage),
      comparison: comparisonPerf ? Math.round(comparisonPerf.score_percentage) : undefined,
      fullMark: 100,
    };
  });
}

/**
 * Transform attempt history with category data into category trends
 * Note: Requires categoryPerformance to be available for each attempt
 */
export function transformToCategoryTrends(
  attempts: Array<
    AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> }
  >
): CategoryTrendData[] {
  return attempts.map(attempt => {
    const dataPoint: CategoryTrendData = {
      attemptNumber: attempt.attempt_number,
      date: new Date(attempt.completed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };

    // Add each category as a dynamic property
    if (attempt.categoryPerformance) {
      Object.entries(attempt.categoryPerformance).forEach(([categoryName, performance]) => {
        dataPoint[categoryName] = Math.round(performance.score_percentage);
      });
    }

    return dataPoint;
  });
}

/**
 * Transform attempt history into ability estimate data with confidence bands
 */
export function transformToAbilityData(
  attempts: Array<AttemptHistoryItem & { ability_standard_error?: number }>
): AbilityDataPoint[] {
  return attempts.map(attempt => {
    const standardError = attempt.ability_standard_error || 0.5; // Default SE if not available
    const confidence95 = standardError * 1.96; // 95% confidence interval

    return {
      attemptNumber: attempt.attempt_number,
      date: new Date(attempt.completed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      ability: Math.round(attempt.ability_estimate * 100) / 100,
      upperBound: Math.round((attempt.ability_estimate + confidence95) * 100) / 100,
      lowerBound: Math.round((attempt.ability_estimate - confidence95) * 100) / 100,
      standardError: Math.round(standardError * 100) / 100,
    };
  });
}

/**
 * Calculate average time across attempts
 */
export function calculateAverageTime(attempts: AttemptHistoryItem[]): number {
  if (attempts.length === 0) return 0;

  const totalSeconds = attempts.reduce((sum, attempt) => sum + attempt.time_taken_seconds, 0);
  return Math.round(totalSeconds / attempts.length / 60); // Return in minutes
}

/**
 * Find best attempt by score
 */
export function findBestAttempt(attempts: AttemptHistoryItem[]): AttemptHistoryItem | null {
  if (attempts.length === 0) return null;

  return attempts.reduce((best, current) =>
    current.score_percentage > best.score_percentage ? current : best
  );
}

/**
 * Find previous attempt (second to last)
 */
export function findPreviousAttempt(attempts: AttemptHistoryItem[]): AttemptHistoryItem | null {
  if (attempts.length < 2) return null;
  return attempts[attempts.length - 2];
}

/**
 * Format time in seconds to human-readable string
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateString);

  if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate trend from score differences
 */
export function calculateTrend(current: number, previous: number): 'up' | 'down' | 'neutral' {
  const threshold = 2; // 2% threshold for neutral
  const diff = current - previous;

  if (Math.abs(diff) < threshold) return 'neutral';
  return diff > 0 ? 'up' : 'down';
}

/**
 * Get category color from predefined palette
 */
export function getCategoryColor(index: number, palette: readonly string[]): string {
  return palette[index % palette.length];
}

/**
 * Extract unique category names from attempts
 */
export function extractCategoryNames(
  attempts: Array<
    AttemptHistoryItem & { categoryPerformance?: Record<string, CategoryPerformance> }
  >
): string[] {
  const categorySet = new Set<string>();

  attempts.forEach(attempt => {
    if (attempt.categoryPerformance) {
      Object.keys(attempt.categoryPerformance).forEach(cat => categorySet.add(cat));
    }
  });

  return Array.from(categorySet).sort();
}
