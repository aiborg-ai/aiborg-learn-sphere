// ============================================================================
// AI Readiness Scoring Engine
// Calculates scores, maturity levels, and insights from assessment responses
// ============================================================================

import type {
  AIReadinessFormData,
  DimensionType,
  MaturityLevel,
  DimensionScore,
  ScoreCalculation,
} from '@/types/aiReadiness';

// ============================================================================
// CONSTANTS
// ============================================================================

// Default dimension weights (equal weighting)
export const DEFAULT_WEIGHTS: Record<Exclude<DimensionType, 'overall'>, number> = {
  strategic: 16.67,
  data: 16.67,
  tech: 16.67,
  human: 16.67,
  process: 16.67,
  change: 16.67,
};

// Maturity level thresholds
export const MATURITY_THRESHOLDS: Record<MaturityLevel, { min: number; max: number }> = {
  awareness: { min: 0, max: 20 },
  experimenting: { min: 21, max: 40 },
  adopting: { min: 41, max: 60 },
  optimizing: { min: 61, max: 80 },
  leading: { min: 81, max: 100 },
};

// ============================================================================
// DIMENSION SCORE CALCULATION
// ============================================================================

/**
 * Calculate score for a single dimension from responses
 * Converts 1-5 rating scale to 0-100 score
 */
export function calculateDimensionScore(
  responses: Record<string, number | undefined>,
  questionCount: number = 10
): number {
  // Get all numeric rating responses (filter out undefined and non-numeric)
  const ratings = Object.values(responses).filter(
    (val): val is number => typeof val === 'number' && val >= 1 && val <= 5
  );

  if (ratings.length === 0) {
    return 0; // No responses yet
  }

  // Calculate average rating
  const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

  // Convert 1-5 scale to 0-100 scale
  // 1 = 0%, 2 = 25%, 3 = 50%, 4 = 75%, 5 = 100%
  const score = ((avgRating - 1) / 4) * 100;

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate scores for all dimensions from form data
 */
export function calculateAllDimensionScores(
  formData: AIReadinessFormData,
  weights: Record<Exclude<DimensionType, 'overall'>, number> = DEFAULT_WEIGHTS
): DimensionScore[] {
  const dimensions: Array<{
    dimension: Exclude<DimensionType, 'overall'>;
    data: Record<string, number | undefined>;
    questionCount: number;
  }> = [
    { dimension: 'strategic', data: formData.strategic as any, questionCount: 8 },
    { dimension: 'data', data: formData.data as any, questionCount: 10 },
    { dimension: 'tech', data: formData.tech as any, questionCount: 8 },
    { dimension: 'human', data: formData.human as any, questionCount: 10 },
    { dimension: 'process', data: formData.process as any, questionCount: 8 },
    { dimension: 'change', data: formData.change as any, questionCount: 8 },
  ];

  return dimensions.map(({ dimension, data, questionCount }) => {
    const score = calculateDimensionScore(data, questionCount);
    const weight = weights[dimension];
    const weighted_score = (score * weight) / 100;

    return {
      dimension,
      score,
      weight,
      weighted_score,
    };
  });
}

/**
 * Calculate overall readiness score from dimension scores
 */
export function calculateOverallScore(dimensionScores: DimensionScore[]): number {
  const totalWeightedScore = dimensionScores.reduce((sum, dim) => sum + dim.weighted_score, 0);

  return Math.round(totalWeightedScore * 100) / 100;
}

/**
 * Complete score calculation for an assessment
 */
export function calculateScores(
  formData: AIReadinessFormData,
  weights?: Record<Exclude<DimensionType, 'overall'>, number>
): ScoreCalculation {
  const dimensionScores = calculateAllDimensionScores(formData, weights);
  const overallScore = calculateOverallScore(dimensionScores);
  const maturityLevel = getMaturityLevel(overallScore);

  return {
    dimension_scores: dimensionScores,
    overall_score: overallScore,
    maturity_level: maturityLevel,
  };
}

// ============================================================================
// MATURITY LEVEL DETERMINATION
// ============================================================================

/**
 * Determine maturity level from overall score
 */
export function getMaturityLevel(score: number): MaturityLevel {
  if (score <= 20) return 'awareness';
  if (score <= 40) return 'experimenting';
  if (score <= 60) return 'adopting';
  if (score <= 80) return 'optimizing';
  return 'leading';
}

/**
 * Get next maturity level and points needed to reach it
 */
export function getNextLevelInfo(currentScore: number): {
  nextLevel: MaturityLevel | null;
  pointsNeeded: number;
  currentLevel: MaturityLevel;
} {
  const currentLevel = getMaturityLevel(currentScore);

  const levelOrder: MaturityLevel[] = [
    'awareness',
    'experimenting',
    'adopting',
    'optimizing',
    'leading',
  ];

  const currentIndex = levelOrder.indexOf(currentLevel);
  const nextLevel = currentIndex < levelOrder.length - 1 ? levelOrder[currentIndex + 1] : null;

  const pointsNeeded = nextLevel ? MATURITY_THRESHOLDS[nextLevel].min - currentScore : 0;

  return {
    currentLevel,
    nextLevel,
    pointsNeeded: Math.max(0, pointsNeeded),
  };
}

/**
 * Get maturity level progress percentage within current level
 */
export function getLevelProgress(score: number): number {
  const level = getMaturityLevel(score);
  const { min, max } = MATURITY_THRESHOLDS[level];

  if (max === min) return 100;

  const progress = ((score - min) / (max - min)) * 100;
  return Math.round(Math.max(0, Math.min(100, progress)));
}

// ============================================================================
// GAP ANALYSIS
// ============================================================================

/**
 * Identify top strengths (highest scoring dimensions)
 */
export function getTopStrengths(
  dimensionScores: DimensionScore[],
  count: number = 3
): Array<{ dimension: DimensionType; score: number }> {
  return [...dimensionScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ dimension, score }) => ({ dimension, score }));
}

/**
 * Identify top gaps (lowest scoring dimensions)
 */
export function getTopGaps(
  dimensionScores: DimensionScore[],
  industryAverages: Record<DimensionType, number>,
  count: number = 3
): Array<{ dimension: DimensionType; score: number; gap_to_avg: number }> {
  return [...dimensionScores]
    .map(({ dimension, score }) => ({
      dimension,
      score,
      gap_to_avg: (industryAverages[dimension] || 0) - score,
    }))
    .sort((a, b) => b.gap_to_avg - a.gap_to_avg)
    .slice(0, count);
}

/**
 * Calculate improvement needed per dimension to reach target score
 */
export function calculateImprovementNeeded(
  currentScores: DimensionScore[],
  targetOverallScore: number,
  weights: Record<Exclude<DimensionType, 'overall'>, number> = DEFAULT_WEIGHTS
): Record<Exclude<DimensionType, 'overall'>, number> {
  const currentOverall = calculateOverallScore(currentScores);
  const improvementNeeded = targetOverallScore - currentOverall;

  if (improvementNeeded <= 0) {
    return {
      strategic: 0,
      data: 0,
      tech: 0,
      human: 0,
      process: 0,
      change: 0,
    };
  }

  // Distribute improvement proportionally by weight
  const result: Record<Exclude<DimensionType, 'overall'>, number> = {
    strategic: 0,
    data: 0,
    tech: 0,
    human: 0,
    process: 0,
    change: 0,
  };

  currentScores.forEach(({ dimension, score }) => {
    if (dimension === 'overall') return;

    const weight = weights[dimension as Exclude<DimensionType, 'overall'>];
    const contribution = (improvementNeeded * weight) / 100;

    // Calculate points needed in this dimension to contribute that much to overall
    result[dimension as Exclude<DimensionType, 'overall'>] = contribution;
  });

  return result;
}

// ============================================================================
// SCORE VALIDATION
// ============================================================================

/**
 * Validate assessment completeness
 */
export function validateAssessmentCompleteness(
  formData: AIReadinessFormData,
  tier: 'freemium' | 'premium' | 'enterprise' = 'premium'
): {
  isComplete: boolean;
  completionPercentage: number;
  missingDimensions: string[];
} {
  const requiredQuestionsPerDimension = tier === 'freemium' ? 5 : 8;

  const dimensions = [
    { name: 'strategic', data: formData.strategic },
    { name: 'data', data: formData.data },
    { name: 'tech', data: formData.tech },
    { name: 'human', data: formData.human },
    { name: 'process', data: formData.process },
    { name: 'change', data: formData.change },
  ];

  let totalQuestions = 0;
  let answeredQuestions = 0;
  const missingDimensions: string[] = [];

  dimensions.forEach(({ name, data }) => {
    const ratings = Object.values(data).filter(
      val => typeof val === 'number' && val >= 1 && val <= 5
    );

    totalQuestions += requiredQuestionsPerDimension;
    answeredQuestions += ratings.length;

    if (ratings.length < requiredQuestionsPerDimension) {
      missingDimensions.push(name);
    }
  });

  const completionPercentage =
    totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  return {
    isComplete: missingDimensions.length === 0,
    completionPercentage,
    missingDimensions,
  };
}

// ============================================================================
// FREEMIUM SCORE CALCULATION
// ============================================================================

/**
 * Calculate scores from freemium assessment (5 questions per dimension)
 * Same logic but with fewer questions
 */
export function calculateFreemiumScores(formData: Partial<AIReadinessFormData>): ScoreCalculation {
  // Use same calculation logic
  return calculateScores(formData as AIReadinessFormData);
}

// ============================================================================
// AGGREGATE MULTI-STAKEHOLDER SCORES
// ============================================================================

/**
 * Aggregate scores from multiple stakeholders with role-based weighting
 */
export function aggregateStakeholderScores(
  stakeholderScores: Array<{
    role: string;
    dimension_scores: DimensionScore[];
  }>,
  roleWeights?: Record<string, number>
): DimensionScore[] {
  // Default role weights (if not provided)
  const defaultRoleWeights: Record<string, number> = {
    ceo: 2.0, // CEO opinions weighted more heavily
    cto: 1.5,
    cfo: 1.5,
    operations: 1.0,
    hr: 1.0,
    marketing: 0.8,
    it: 1.0,
    other: 0.5,
  };

  const weights = roleWeights || defaultRoleWeights;

  // Initialize aggregated scores
  const aggregated: Record<
    Exclude<DimensionType, 'overall'>,
    { totalWeighted: number; totalWeight: number }
  > = {
    strategic: { totalWeighted: 0, totalWeight: 0 },
    data: { totalWeighted: 0, totalWeight: 0 },
    tech: { totalWeighted: 0, totalWeight: 0 },
    human: { totalWeighted: 0, totalWeight: 0 },
    process: { totalWeighted: 0, totalWeight: 0 },
    change: { totalWeighted: 0, totalWeight: 0 },
  };

  // Aggregate weighted scores
  stakeholderScores.forEach(({ role, dimension_scores }) => {
    const roleWeight = weights[role] || 1.0;

    dimension_scores.forEach(({ dimension, score }) => {
      if (dimension === 'overall') return;

      aggregated[dimension as Exclude<DimensionType, 'overall'>].totalWeighted +=
        score * roleWeight;
      aggregated[dimension as Exclude<DimensionType, 'overall'>].totalWeight += roleWeight;
    });
  });

  // Calculate final weighted averages
  return Object.entries(aggregated).map(([dimension, { totalWeighted, totalWeight }]) => ({
    dimension: dimension as Exclude<DimensionType, 'overall'>,
    score: totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) / 100 : 0,
    weight: DEFAULT_WEIGHTS[dimension as Exclude<DimensionType, 'overall'>],
    weighted_score:
      totalWeight > 0
        ? Math.round(
            ((totalWeighted / totalWeight) *
              DEFAULT_WEIGHTS[dimension as Exclude<DimensionType, 'overall'>]) /
              100
          )
        : 0,
  }));
}

// ============================================================================
// SCORE FORMATTING & DISPLAY
// ============================================================================

/**
 * Format score for display with color coding
 */
export function getScoreColor(score: number): string {
  if (score < 20) return '#EF4444'; // red-500
  if (score < 40) return '#F97316'; // orange-500
  if (score < 60) return '#F59E0B'; // amber-500
  if (score < 80) return '#10B981'; // emerald-500
  return '#06B6D4'; // cyan-500
}

/**
 * Get performance level description
 */
export function getPerformanceLevel(score: number): string {
  if (score < 25) return 'Needs Improvement';
  if (score < 50) return 'Developing';
  if (score < 75) return 'Competent';
  if (score < 90) return 'Strong';
  return 'Excellent';
}

/**
 * Get dimension-specific insights
 */
export function getDimensionInsight(
  dimension: Exclude<DimensionType, 'overall'>,
  score: number
): {
  rating: string;
  summary: string;
  focus_areas: string[];
} {
  const insights: Record<
    Exclude<DimensionType, 'overall'>,
    Record<
      string,
      {
        rating: string;
        summary: string;
        focus_areas: string[];
      }
    >
  > = {
    strategic: {
      low: {
        rating: 'Needs Foundation',
        summary: 'AI strategy is unclear or not well-defined.',
        focus_areas: ['Define clear AI use cases', 'Secure executive buy-in', 'Allocate budget'],
      },
      medium: {
        rating: 'Building Strategy',
        summary: 'AI strategy is emerging but needs refinement.',
        focus_areas: ['Set measurable KPIs', 'Create strategic roadmap', 'Appoint champions'],
      },
      high: {
        rating: 'Strategic Clarity',
        summary: 'Strong strategic alignment for AI adoption.',
        focus_areas: ['Execute roadmap', 'Track ROI', 'Scale successful initiatives'],
      },
    },
    data: {
      low: {
        rating: 'Data Challenges',
        summary: 'Significant data quality and governance issues.',
        focus_areas: ['Improve data quality', 'Establish governance', 'Address security gaps'],
      },
      medium: {
        rating: 'Data Developing',
        summary: 'Data infrastructure is functional but needs improvement.',
        focus_areas: ['Break down silos', 'Enhance documentation', 'Improve integration'],
      },
      high: {
        rating: 'Data Ready',
        summary: 'Strong data foundation for AI initiatives.',
        focus_areas: ['Optimize data pipelines', 'Expand data sources', 'Maintain quality'],
      },
    },
    tech: {
      low: {
        rating: 'Tech Gaps',
        summary: 'Infrastructure not ready for AI workloads.',
        focus_areas: ['Modernize systems', 'Adopt cloud', 'Build APIs'],
      },
      medium: {
        rating: 'Tech Developing',
        summary: 'Basic infrastructure in place, needs enhancement.',
        focus_areas: ['Improve scalability', 'Strengthen security', 'Expand APIs'],
      },
      high: {
        rating: 'Tech Ready',
        summary: 'Robust technical infrastructure for AI.',
        focus_areas: ['Optimize performance', 'Enhance automation', 'Scale infrastructure'],
      },
    },
    human: {
      low: {
        rating: 'Skills Gap',
        summary: 'Significant AI skills shortage across organization.',
        focus_areas: ['Launch training programs', 'Hire AI talent', 'Build literacy'],
      },
      medium: {
        rating: 'Building Capability',
        summary: 'Growing AI capabilities but gaps remain.',
        focus_areas: ['Expand training', 'Develop specialists', 'Retain talent'],
      },
      high: {
        rating: 'Skilled Team',
        summary: 'Strong AI capabilities across organization.',
        focus_areas: ['Advance expertise', 'Lead innovation', 'Mentor others'],
      },
    },
    process: {
      low: {
        rating: 'Process Gaps',
        summary: 'Processes not well-documented or standardized.',
        focus_areas: ['Document processes', 'Standardize workflows', 'Define metrics'],
      },
      medium: {
        rating: 'Process Improving',
        summary: 'Basic process maturity, room for optimization.',
        focus_areas: ['Increase automation', 'Improve efficiency', 'Track performance'],
      },
      high: {
        rating: 'Process Mature',
        summary: 'Well-documented, efficient processes.',
        focus_areas: ['Continuous improvement', 'Advanced automation', 'Best practice sharing'],
      },
    },
    change: {
      low: {
        rating: 'Change Resistance',
        summary: 'Significant resistance to change expected.',
        focus_areas: ['Build leadership commitment', 'Improve communication', 'Start small pilots'],
      },
      medium: {
        rating: 'Change Ready',
        summary: 'Moderate readiness for organizational change.',
        focus_areas: ['Manage resistance', 'Celebrate wins', 'Expand pilots'],
      },
      high: {
        rating: 'Change Champions',
        summary: 'Strong change management culture.',
        focus_areas: ['Scale transformation', 'Embed new behaviors', 'Lead industry'],
      },
    },
  };

  const level = score < 40 ? 'low' : score < 70 ? 'medium' : 'high';
  return insights[dimension][level];
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export const ScoringEngine = {
  // Core calculations
  calculateDimensionScore,
  calculateAllDimensionScores,
  calculateOverallScore,
  calculateScores,

  // Maturity level
  getMaturityLevel,
  getNextLevelInfo,
  getLevelProgress,

  // Gap analysis
  getTopStrengths,
  getTopGaps,
  calculateImprovementNeeded,

  // Validation
  validateAssessmentCompleteness,

  // Freemium
  calculateFreemiumScores,

  // Multi-stakeholder
  aggregateStakeholderScores,

  // Display utilities
  getScoreColor,
  getPerformanceLevel,
  getDimensionInsight,

  // Constants
  DEFAULT_WEIGHTS,
  MATURITY_THRESHOLDS,
};

export default ScoringEngine;
