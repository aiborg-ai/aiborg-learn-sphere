// Assessment result types

export interface AssessmentResult {
  id: string;
  total_score: number;
  max_possible_score: number;
  augmentation_level: string;
  completion_time_seconds: number;
  completed_at: string;
  audience_type?: string;
}

export interface CategoryInsight {
  category_name: string;
  category_score: number;
  category_max_score: number;
  strength_level: string;
  recommendations: string[];
  percentage: number;
}

export interface Benchmark {
  category_name: string;
  user_score: number;
  average_score: number;
  percentile: number;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  criteria_type: string;
  criteria_value: number;
}

export interface Tool {
  name: string;
  description: string;
  website_url?: string;
  difficulty_level: string;
}

export interface RadarChartData {
  category: string;
  score: number;
  fullMark: number;
}

/**
 * Enhanced Assessment Analytics Types
 * Type definitions for assessment tool analytics components
 */

import type { AttemptHistoryItem, CategoryPerformance } from '@/types/assessmentTools';

/**
 * Chart data point for score progression
 */
export interface ScoreDataPoint {
  attemptNumber: number;
  score: number;
  date: string;
  improvement?: number;
  isPassing: boolean;
}

/**
 * Chart data point for time analysis
 */
export interface TimeDataPoint {
  attemptNumber: number;
  timeMinutes: number;
  score: number;
  efficiency: number; // score per minute
  date: string;
}

/**
 * Chart data for category radar comparison
 */
export interface CategoryRadarComparisonData {
  category: string;
  current: number;
  comparison?: number;
  fullMark: 100;
}

/**
 * Chart data for category trends over time
 */
export interface CategoryTrendData {
  attemptNumber: number;
  date: string;
  [category: string]: number | string; // Dynamic category names
}

/**
 * Chart data for ability estimate with confidence bands
 */
export interface AbilityDataPoint {
  attemptNumber: number;
  date: string;
  ability: number;
  upperBound: number;
  lowerBound: number;
  standardError: number;
}

/**
 * Comparison result between two attempts
 */
export interface AttemptComparison {
  current: AttemptComparisonData;
  comparison: AttemptComparisonData;
  deltas: ComparisonDeltas;
  comparisonType: 'previous' | 'best' | 'average';
}

/**
 * Data for a single attempt in comparison
 */
export interface AttemptComparisonData {
  attemptNumber: number;
  scorePercentage: number;
  abilityEstimate: number;
  timeMinutes: number;
  categoryPerformance: Record<string, number>;
  completedAt: string;
}

/**
 * Delta calculations between two attempts
 */
export interface ComparisonDeltas {
  scoreDelta: number;
  abilityDelta: number;
  timeDelta: number;
  categoryDeltas: Record<string, number>;
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * Peer comparison data
 */
export interface PeerComparisonData {
  currentScore: number;
  percentileRank: number;
  peerAverage: number;
  categoryComparison: PeerCategoryComparison[];
}

/**
 * Category-level peer comparison
 */
export interface PeerCategoryComparison {
  categoryName: string;
  userScore: number;
  peerAverage: number;
  difference: number;
  percentile: number;
}

/**
 * Extended attempt history with enriched data
 */
export interface EnrichedAttemptHistory extends AttemptHistoryItem {
  timeMinutes: number;
  isPassing: boolean;
  categoryPerformance?: Record<string, CategoryPerformance>;
}

/**
 * Stats card data
 */
export interface StatCardData {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Chart color palette
 */
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  secondary: '#8b5cf6',
  info: '#06b6d4',

  // Category colors for multi-line charts
  categories: [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f43f5e', // Rose
    '#14b8a6', // Teal
  ],
} as const;

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
} as const;

/**
 * Chart height constants
 */
export const CHART_HEIGHTS = {
  small: 250,
  medium: 350,
  large: 450,
} as const;
