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

// Re-export legacy unified service (facade for backward compatibility)
export { AnalyticsService } from '../AnalyticsService';
