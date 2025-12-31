/**
 * Knowledge Graph Services
 *
 * Export all knowledge graph services for easy importing throughout the app.
 *
 * Usage:
 * ```typescript
 * import {
 *   KnowledgeGraphService,
 *   UserMasteryService,
 *   ConceptProgressService,
 *   LearningRecommendationService
 * } from '@/services/knowledge-graph';
 * ```
 *
 * Note: ConceptProgressService was introduced to break circular dependencies
 * between KnowledgeGraphService and UserMasteryService.
 */

export { KnowledgeGraphService } from './KnowledgeGraphService';
export { UserMasteryService } from './UserMasteryService';
export { ConceptProgressService } from './ConceptProgressService';
export { LearningRecommendationService } from './LearningRecommendationService';

// Re-export types for convenience
export type {
  Concept,
  ConceptWithRelations,
  ConceptRelationship,
  CourseConcept,
  UserConceptMastery,
  EvidencePoint,
  LearningRecommendation,
  PrerequisiteChainEntry,
  LearningPathStep,
  GraphValidationResult,
  UserProgressSummary,
  CalculatedMastery,
  MasteryLevel,
  ConceptType,
  DifficultyLevel,
  RelationshipType,
  CoverageLevel,
  EvidenceType,
  RecommendationReason,
  RecommendationOptions,
  ConceptFilters,
  RelationshipFilters,
  MasteryFilters,
} from '@/types/knowledge-graph';
