// ============================================================================
// AI Readiness Services - Main Export
// ============================================================================

export { ScoringEngine, default as ScoringEngineService } from './ScoringEngine';
export { BenchmarkingService, default as BenchmarkingServiceExport } from './BenchmarkingService';
export {
  RecommendationGenerator,
  default as RecommendationGeneratorService,
} from './RecommendationGenerator';

// Re-export key types for convenience
export type {
  DimensionScore,
  ScoreCalculation,
  BenchmarkComparison,
  ReadinessRecommendation,
  Roadmap,
} from '@/types/aiReadiness';
