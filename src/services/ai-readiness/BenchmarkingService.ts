// ============================================================================
// AI Readiness Benchmarking Service
// Compare assessment scores against industry peers and size cohorts
// ============================================================================

import type {
  ReadinessBenchmark,
  BenchmarkComparison,
  DimensionType,
  DimensionScore,
} from '@/types/aiReadiness';

// ============================================================================
// PERCENTILE CALCULATION
// ============================================================================

/**
 * Calculate percentile rank based on benchmark data
 * Uses linear interpolation between percentile points
 */
export function calculatePercentileRank(score: number, benchmark: ReadinessBenchmark): number {
  const { percentile_25, percentile_50, percentile_75, percentile_90 } = benchmark;

  // Handle missing benchmark data
  if (!percentile_25 || !percentile_50 || !percentile_75 || !percentile_90) {
    return 50; // Default to median if data incomplete
  }

  // Below 25th percentile
  if (score < percentile_25) {
    const percentile = (score / percentile_25) * 25;
    return Math.max(0, Math.round(percentile));
  }

  // Between 25th and 50th percentile
  if (score < percentile_50) {
    const range = percentile_50 - percentile_25;
    const position = score - percentile_25;
    const percentile = 25 + (position / range) * 25;
    return Math.round(percentile);
  }

  // Between 50th and 75th percentile
  if (score < percentile_75) {
    const range = percentile_75 - percentile_50;
    const position = score - percentile_50;
    const percentile = 50 + (position / range) * 25;
    return Math.round(percentile);
  }

  // Between 75th and 90th percentile
  if (score < percentile_90) {
    const range = percentile_90 - percentile_75;
    const position = score - percentile_75;
    const percentile = 75 + (position / range) * 15;
    return Math.round(percentile);
  }

  // Above 90th percentile
  const range = 100 - percentile_90;
  const position = score - percentile_90;
  const percentile = 90 + (position / range) * 10;
  return Math.min(100, Math.round(percentile));
}

/**
 * Calculate performance level from percentile
 */
export function getPerformanceLevel(
  percentileRank: number
): 'below_average' | 'average' | 'above_average' | 'excellent' {
  if (percentileRank < 25) return 'below_average';
  if (percentileRank < 50) return 'average';
  if (percentileRank < 75) return 'above_average';
  return 'excellent';
}

// ============================================================================
// BENCHMARK COMPARISON
// ============================================================================

/**
 * Create detailed benchmark comparison for a single dimension
 */
export function createBenchmarkComparison(
  yourScore: number,
  benchmark: ReadinessBenchmark
): BenchmarkComparison {
  const percentileRank = calculatePercentileRank(yourScore, benchmark);
  const performanceLevel = getPerformanceLevel(percentileRank);

  const industryAvg = benchmark.avg_score;
  const industryMedian = benchmark.median_score || industryAvg;

  // Calculate gap to 75th percentile (target for improvement)
  const gap_to_75th = Math.max(0, (benchmark.percentile_75 || 0) - yourScore);

  return {
    your_score: yourScore,
    industry_avg: industryAvg,
    industry_median: industryMedian,
    percentile_rank: percentileRank,
    _performance_level: performanceLevel,
    gap_to_75th,
  };
}

/**
 * Create benchmark comparisons for all dimensions
 */
export function createAllBenchmarkComparisons(
  dimensionScores: DimensionScore[],
  benchmarks: Record<DimensionType, ReadinessBenchmark>,
  overallScore: number
): Record<DimensionType, BenchmarkComparison> {
  const comparisons: Partial<Record<DimensionType, BenchmarkComparison>> = {};

  // Overall comparison
  if (benchmarks.overall) {
    comparisons.overall = createBenchmarkComparison(overallScore, benchmarks.overall);
  }

  // Dimension comparisons
  dimensionScores.forEach(({ dimension, score }) => {
    const benchmark = benchmarks[dimension];
    if (benchmark) {
      comparisons[dimension] = createBenchmarkComparison(score, benchmark);
    }
  });

  return comparisons as Record<DimensionType, BenchmarkComparison>;
}

// ============================================================================
// GAP ANALYSIS
// ============================================================================

/**
 * Identify dimensions with largest gaps vs industry average
 */
export function identifyLargestGaps(
  comparisons: Record<DimensionType, BenchmarkComparison>,
  count: number = 3
): Array<{
  dimension: DimensionType;
  gap: number;
  percentile: number;
}> {
  return Object.entries(comparisons)
    .filter(([dimension]) => dimension !== 'overall')
    .map(([dimension, comparison]) => ({
      dimension: dimension as DimensionType,
      gap: comparison.industry_avg - comparison.your_score,
      percentile: comparison.percentile_rank,
    }))
    .filter(item => item.gap > 0) // Only gaps where you're below average
    .sort((a, b) => b.gap - a.gap)
    .slice(0, count);
}

/**
 * Identify dimensions where you're ahead of industry
 */
export function identifyStrengthAreas(
  comparisons: Record<DimensionType, BenchmarkComparison>,
  count: number = 3
): Array<{
  dimension: DimensionType;
  advantage: number;
  percentile: number;
}> {
  return Object.entries(comparisons)
    .filter(([dimension]) => dimension !== 'overall')
    .map(([dimension, comparison]) => ({
      dimension: dimension as DimensionType,
      advantage: comparison.your_score - comparison.industry_avg,
      percentile: comparison.percentile_rank,
    }))
    .filter(item => item.advantage > 0) // Only where you're above average
    .sort((a, b) => b.advantage - a.advantage)
    .slice(0, count);
}

// ============================================================================
// IMPROVEMENT SCENARIOS
// ============================================================================

/**
 * Calculate what score improvements would mean for percentile rank
 */
export function calculateImprovementScenarios(
  currentScore: number,
  benchmark: ReadinessBenchmark
): Array<{
  targetScore: number;
  targetPercentile: number;
  pointsNeeded: number;
  description: string;
}> {
  const _currentPercentile = calculatePercentileRank(currentScore, benchmark);

  const scenarios = [
    {
      targetScore: benchmark.percentile_50 || 0,
      description: 'Reach industry median',
    },
    {
      targetScore: benchmark.percentile_75 || 0,
      description: 'Reach top quartile',
    },
    {
      targetScore: benchmark.percentile_90 || 0,
      description: 'Reach top 10%',
    },
  ];

  return scenarios
    .filter(s => s.targetScore > currentScore)
    .map(({ targetScore, description }) => ({
      targetScore,
      targetPercentile: calculatePercentileRank(targetScore, benchmark),
      pointsNeeded: Math.round(targetScore - currentScore),
      description,
    }));
}

// ============================================================================
// COMPETITIVE POSITIONING
// ============================================================================

/**
 * Generate competitive positioning summary
 */
export function generatePositioningSummary(
  overallComparison: BenchmarkComparison,
  industry: string,
  companySize: string
): {
  headline: string;
  summary: string;
  icon: string;
  color: string;
} {
  const { percentile_rank, _performance_level, your_score } = overallComparison;

  const templates = {
    below_average: {
      headline: 'Building AI Foundation',
      summary: `Your AI readiness (${Math.round(your_score)}/100) is below the ${industry} industry average. Focus on quick wins to catch up with peers in your ${companySize} employee size category.`,
      icon: 'trending-up',
      color: '#F97316', // orange
    },
    average: {
      headline: 'Competitive Position',
      summary: `You're in the ${percentile_rank}th percentile - keeping pace with ${industry} industry peers. Strategic improvements in key areas can move you ahead of competition.`,
      icon: 'target',
      color: '#F59E0B', // amber
    },
    above_average: {
      headline: 'Strong AI Readiness',
      summary: `At the ${percentile_rank}th percentile, you're ahead of most ${industry} companies in your size range. Maintain momentum and close remaining gaps to reach industry leadership.`,
      icon: 'award',
      color: '#10B981', // emerald
    },
    excellent: {
      headline: 'Industry Leader',
      summary: `Top ${100 - percentile_rank}% positioning in ${industry}! You're setting the standard for AI adoption among ${companySize} employee companies. Focus on innovation and sharing best practices.`,
      icon: 'trophy',
      color: '#06B6D4', // cyan
    },
  };

  return templates[_performance_level];
}

// ============================================================================
// PEER GROUP INSIGHTS
// ============================================================================

/**
 * Generate insights about peer performance
 */
export function generatePeerInsights(
  comparison: BenchmarkComparison,
  dimension: DimensionType
): string[] {
  const insights: string[] = [];
  const { your_score, industry_avg, percentile_rank, _performance_level } = comparison;

  // Percentile insight
  if (percentile_rank >= 75) {
    insights.push(`You're in the top quartile - ahead of 75% of peers`);
  } else if (percentile_rank >= 50) {
    insights.push(`You're above average - ahead of ${percentile_rank}% of peers`);
  } else if (percentile_rank >= 25) {
    insights.push(`You're near the median - similar to most peers`);
  } else {
    insights.push(`You're below the median - opportunity to catch up`);
  }

  // Gap insight
  const gap = industry_avg - your_score;
  if (gap > 15) {
    insights.push(`Significant gap to industry average (${Math.round(gap)} points)`);
  } else if (gap > 5) {
    insights.push(`Moderate gap to industry average (${Math.round(gap)} points)`);
  } else if (gap < -15) {
    insights.push(`Well ahead of industry average (+${Math.round(Math.abs(gap))} points)`);
  } else if (gap < -5) {
    insights.push(`Above industry average (+${Math.round(Math.abs(gap))} points)`);
  } else {
    insights.push(`Closely aligned with industry average`);
  }

  return insights;
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const BenchmarkingService = {
  // Percentile calculation
  calculatePercentileRank,
  getPerformanceLevel,

  // Comparisons
  createBenchmarkComparison,
  createAllBenchmarkComparisons,

  // Gap analysis
  identifyLargestGaps,
  identifyStrengthAreas,

  // Scenarios
  calculateImprovementScenarios,

  // Positioning
  generatePositioningSummary,
  generatePeerInsights,
};

export default BenchmarkingService;
