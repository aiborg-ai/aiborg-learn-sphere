/**
 * Analytics Services - Barrel Export
 * Exports all analytics-related services
 */

// Export types
export * from './types';

// Export individual services
export { LearningVelocityService } from './LearningVelocityService';
export { SkillGapService } from './SkillGapService';
export { CompetencyService } from './CompetencyService';
export { AIRecommendationService } from './AIRecommendationService';
export { BenchmarkService } from './BenchmarkService';
export { AdminAnalyticsService } from './AdminAnalyticsService';
export { GoalsAnalyticsService } from './GoalsAnalyticsService';

// New AI Study Assistant analytics services
export { AbilityTrajectoryService, abilityTrajectoryService } from './AbilityTrajectoryService';
export { StudyEffectivenessService, studyEffectivenessService } from './StudyEffectivenessService';
export {
  EnhancedGoalPredictionService,
  enhancedGoalPredictionService,
} from './EnhancedGoalPredictionService';

// Note: AnalyticsService was removed - use individual services above instead
