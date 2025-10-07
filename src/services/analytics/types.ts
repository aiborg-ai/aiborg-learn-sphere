/**
 * Analytics Types
 * Shared type definitions for analytics services
 */

export interface LearningVelocityMetrics {
  abilityChange: number;
  learningRate: number;
  improvementTrend: 'accelerating' | 'steady' | 'plateauing' | 'declining';
  timeToNextLevel: number;
  streakDays: number;
  engagementScore: number;
  recentAccuracy: number;
}

export interface SkillGap {
  categoryName: string;
  currentProficiency: number;
  targetProficiency: number;
  gapSize: number;
  priorityScore: number;
  predictedProficiency30d: number;
  predictedProficiency90d: number;
  estimatedHoursToClose: number;
  recommendedAction: string;
  businessImpact: 'critical' | 'high' | 'medium' | 'low';
}

export interface CompetencySnapshot {
  id: string;
  userId: string;
  competencyMatrix: Record<
    string,
    {
      score: number;
      percentile: number;
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    }
  >;
  overallCompetency: number;
  overallPercentile: number;
  topStrengths: string[];
  topWeaknesses: string[];
  snapshotDate: string;
}

export interface AIRecommendation {
  id: string;
  userId: string;
  recommendationType: 'course' | 'practice' | 'resource' | 'strategy';
  categoryId?: string;
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: string;
  confidenceScore: number;
  relevanceScore: number;
  urgency: 'immediate' | 'short_term' | 'long_term';
  resourceUrl?: string;
  estimatedTimeMinutes: number;
  difficultyLevel: string;
  viewedAt?: string;
  clickedAt?: string;
  completedAt?: string;
  dismissedAt?: string;
  feedbackRating?: number;
}

export interface PerformanceBenchmark {
  benchmarkType: string;
  dimension: string;
  audienceType: string;
  sampleSize: number;
  meanScore: number;
  medianScore: number;
  stdDeviation: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
  percentile95: number;
}
