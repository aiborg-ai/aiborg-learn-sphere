/**
 * Knowledge Graph Services
 *
 * Export all knowledge graph services for easy importing throughout the app.
 *
 * Usage:
 * ```typescript
 * import { KnowledgeGraphService, UserMasteryService, LearningRecommendationService } from '@/services/knowledge-graph';
 * ```
 */

export { KnowledgeGraphService } from './KnowledgeGraphService';
export { UserMasteryService } from './UserMasteryService';
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
