/**
 * Analytics Service (Unified Facade)
 * Provides backward-compatible unified interface for all analytics operations
 * Delegates to focused service modules
 */

// Re-export types for backward compatibility
export type {
  LearningVelocityMetrics,
  SkillGap,
  CompetencySnapshot,
  AIRecommendation,
  PerformanceBenchmark,
} from './analytics/types';

import type {
  LearningVelocityMetrics,
  SkillGap,
  CompetencySnapshot,
  AIRecommendation,
  PerformanceBenchmark,
} from './analytics/types';

import { LearningVelocityService } from './analytics/LearningVelocityService';
import { SkillGapService } from './analytics/SkillGapService';
import { CompetencyService } from './analytics/CompetencyService';
import { AIRecommendationService } from './analytics/AIRecommendationService';
import { BenchmarkService } from './analytics/BenchmarkService';

/**
 * Unified Analytics Service
 * @deprecated Use individual services (LearningVelocityService, SkillGapService, etc.) for better code organization
 */
export class AnalyticsService {
  // ========== Learning Velocity ==========

  static async calculateLearningVelocity(userId: string): Promise<LearningVelocityMetrics | null> {
    return LearningVelocityService.calculateLearningVelocity(userId);
  }

  // ========== Skill Gaps ==========

  static async analyzeSkillGaps(userId: string): Promise<SkillGap[]> {
    return SkillGapService.analyzeSkillGaps(userId);
  }

  // ========== Competency Matrix ==========

  static async getCompetencyMatrix(userId: string): Promise<CompetencySnapshot | null> {
    return CompetencyService.getCompetencyMatrix(userId);
  }

  static async getPerformanceTimeSeries(userId: string, days: number = 30) {
    return CompetencyService.getPerformanceTimeSeries(userId, days);
  }

  // ========== AI Recommendations ==========

  static async generateRecommendations(userId: string): Promise<AIRecommendation[]> {
    return AIRecommendationService.generateRecommendations(userId);
  }

  static async getActiveRecommendations(userId: string): Promise<AIRecommendation[]> {
    return AIRecommendationService.getActiveRecommendations(userId);
  }

  static async markRecommendationViewed(recommendationId: string): Promise<void> {
    return AIRecommendationService.markRecommendationViewed(recommendationId);
  }

  static async markRecommendationClicked(recommendationId: string): Promise<void> {
    return AIRecommendationService.markRecommendationClicked(recommendationId);
  }

  static async dismissRecommendation(recommendationId: string): Promise<void> {
    return AIRecommendationService.dismissRecommendation(recommendationId);
  }

  static async rateRecommendation(recommendationId: string, rating: number): Promise<void> {
    return AIRecommendationService.rateRecommendation(recommendationId, rating);
  }

  // ========== Benchmarks ==========

  static async getPerformanceBenchmarks(
    audienceType: string,
    benchmarkType: string = 'category'
  ): Promise<PerformanceBenchmark[]> {
    return BenchmarkService.getPerformanceBenchmarks(audienceType, benchmarkType);
  }
}
