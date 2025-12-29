/**
 * Knowledge Graph Type Definitions
 *
 * Types for the knowledge graph system that tracks learning concepts,
 * relationships, prerequisites, and user mastery levels.
 */

// =====================================================================
// Core Types
// =====================================================================

export type ConceptType = 'skill' | 'topic' | 'technology' | 'technique';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type RelationshipType =
  | 'prerequisite'
  | 'related_to'
  | 'part_of'
  | 'builds_on'
  | 'alternative_to';
export type CoverageLevel = 'introduces' | 'covers' | 'masters';
export type MasteryLevel = 'none' | 'beginner' | 'intermediate' | 'advanced' | 'mastered';
export type EvidenceType = 'course_completion' | 'assessment' | 'practice' | 'time_spent';

// =====================================================================
// Database Table Types
// =====================================================================

/**
 * Concept - A learning concept (skill, topic, technology, or technique)
 */
export interface Concept {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: ConceptType;
  difficulty_level: DifficultyLevel;
  estimated_hours: number | null;
  metadata: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Concept with relationships (for graph queries)
 */
export interface ConceptWithRelations extends Concept {
  prerequisites?: ConceptRelationship[];
  dependents?: ConceptRelationship[];
  related?: ConceptRelationship[];
  parent?: ConceptRelationship | null;
  children?: ConceptRelationship[];
}

/**
 * Concept Relationship - Directed edge in the knowledge graph
 */
export interface ConceptRelationship {
  id: string;
  source_concept_id: string;
  target_concept_id: string;
  relationship_type: RelationshipType;
  strength: number; // 0-1
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Populated joins
  source_concept?: Concept;
  target_concept?: Concept;
}

/**
 * Course Concept - Links courses to concepts they teach
 */
export interface CourseConcept {
  id: string;
  course_id: number;
  concept_id: string;
  coverage_level: CoverageLevel;
  order_index: number;
  is_primary: boolean;
  weight: number; // 0-1
  created_at: string;
  // Populated joins
  concept?: Concept;
}

/**
 * User Concept Mastery - Tracks user's mastery of a concept
 */
export interface UserConceptMastery {
  id: string;
  user_id: string;
  concept_id: string;
  mastery_level: MasteryLevel;
  evidence: EvidencePoint[];
  last_practiced: string | null;
  confidence_score: number; // 0-1
  created_at: string;
  updated_at: string;
  // Populated joins
  concept?: Concept;
}

/**
 * Evidence Point - Single piece of evidence for mastery
 */
export interface EvidencePoint {
  type: EvidenceType;
  score?: number; // 0-1
  date: string;
  // Type-specific fields
  course_id?: number;
  assessment_id?: string;
  exercise_id?: string;
  attempts?: number;
  success?: boolean;
  time_spent_minutes?: number;
}

// =====================================================================
// Insert/Update Types
// =====================================================================

export interface InsertConcept {
  name: string;
  slug: string;
  description?: string | null;
  type: ConceptType;
  difficulty_level: DifficultyLevel;
  estimated_hours?: number | null;
  metadata?: Record<string, any>;
  is_active?: boolean;
  created_by?: string | null;
}

export interface UpdateConcept {
  name?: string;
  slug?: string;
  description?: string | null;
  type?: ConceptType;
  difficulty_level?: DifficultyLevel;
  estimated_hours?: number | null;
  metadata?: Record<string, any>;
  is_active?: boolean;
}

export interface InsertConceptRelationship {
  source_concept_id: string;
  target_concept_id: string;
  relationship_type: RelationshipType;
  strength?: number;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateConceptRelationship {
  source_concept_id?: string;
  target_concept_id?: string;
  relationship_type?: RelationshipType;
  strength?: number;
  description?: string | null;
  is_active?: boolean;
}

export interface InsertCourseConcept {
  course_id: number;
  concept_id: string;
  coverage_level: CoverageLevel;
  order_index?: number;
  is_primary?: boolean;
  weight?: number;
}

export interface UpdateCourseConcept {
  coverage_level?: CoverageLevel;
  order_index?: number;
  is_primary?: boolean;
  weight?: number;
}

export interface InsertUserConceptMastery {
  user_id: string;
  concept_id: string;
  mastery_level?: MasteryLevel;
  evidence?: EvidencePoint[];
  last_practiced?: string | null;
  confidence_score?: number;
}

export interface UpdateUserConceptMastery {
  mastery_level?: MasteryLevel;
  evidence?: EvidencePoint[];
  last_practiced?: string | null;
  confidence_score?: number;
}

// =====================================================================
// Algorithm Types
// =====================================================================

/**
 * Mastery Calculation Config
 */
export interface MasteryCalculationConfig {
  evidenceWeights: {
    course_completion: number;
    assessment: number;
    practice: number;
    time_spent: number;
  };
  recencyDecay: {
    recent: number; // < 6 months
    moderate: number; // 6-12 months
    old: number; // > 12 months
  };
  masteryThresholds: {
    none: [number, number];
    beginner: [number, number];
    intermediate: [number, number];
    advanced: [number, number];
    mastered: [number, number];
  };
}

/**
 * Default mastery calculation config
 */
export const DEFAULT_MASTERY_CONFIG: MasteryCalculationConfig = {
  evidenceWeights: {
    course_completion: 0.4,
    assessment: 0.35,
    practice: 0.15,
    time_spent: 0.1,
  },
  recencyDecay: {
    recent: 1.0, // < 6 months
    moderate: 0.8, // 6-12 months
    old: 0.5, // > 12 months
  },
  masteryThresholds: {
    none: [0.0, 0.2],
    beginner: [0.2, 0.5],
    intermediate: [0.5, 0.75],
    advanced: [0.75, 0.9],
    mastered: [0.9, 1.0],
  },
};

/**
 * Calculated Mastery Result
 */
export interface CalculatedMastery {
  concept_id: string;
  mastery_level: MasteryLevel;
  raw_score: number; // 0-1
  confidence_score: number; // 0-1
  evidence_count: number;
  last_practiced: string | null;
}

// =====================================================================
// Graph Query Types
// =====================================================================

/**
 * Prerequisite Chain Entry
 */
export interface PrerequisiteChainEntry {
  concept_id: string;
  concept_name: string;
  depth: number;
  relationship_strength: number;
}

/**
 * Learning Path Step
 */
export interface LearningPathStep {
  concept: Concept;
  order: number;
  prerequisite_of?: string | null;
  relationship_strength: number;
}

/**
 * Graph Validation Result
 */
export interface GraphValidationResult {
  isValid: boolean;
  errors: GraphValidationError[];
  warnings: GraphValidationWarning[];
}

export interface GraphValidationError {
  type: 'circular_dependency' | 'self_relationship' | 'missing_concept' | 'invalid_strength';
  message: string;
  affected_concepts?: string[];
  affected_relationships?: string[];
}

export interface GraphValidationWarning {
  type: 'orphaned_concept' | 'weak_relationship' | 'deep_chain' | 'multiple_paths';
  message: string;
  affected_concepts?: string[];
}

// =====================================================================
// Recommendation Types
// =====================================================================

/**
 * Learning Recommendation
 */
export interface LearningRecommendation {
  concept: Concept;
  score: number; // 0-1
  reason: RecommendationReason;
  prerequisites_met: boolean;
  estimated_time: number; // hours
  related_courses?: number[]; // course IDs
}

export type RecommendationReason =
  | 'prerequisite_met'
  | 'related_to_mastered'
  | 'completes_learning_path'
  | 'fills_skill_gap'
  | 'popular'
  | 'personalized';

/**
 * Recommendation Options
 */
export interface RecommendationOptions {
  limit?: number;
  difficulty_preference?: DifficultyLevel;
  concept_types?: ConceptType[];
  exclude_mastered?: boolean;
  prioritize_prerequisites?: boolean;
  user_preferences?: {
    topics?: string[];
    learning_style?: string;
    time_available?: number;
  };
}

// =====================================================================
// Analytics Types
// =====================================================================

/**
 * Concept Analytics
 */
export interface ConceptAnalytics {
  concept_id: string;
  total_learners: number;
  average_mastery_time: number; // hours
  completion_rate: number; // 0-1
  prerequisite_depth: number;
  dependent_count: number;
  related_count: number;
}

/**
 * User Progress Summary
 */
export interface UserProgressSummary {
  user_id: string;
  total_concepts: number;
  mastered_concepts: number;
  in_progress_concepts: number;
  mastery_by_type: Record<ConceptType, number>;
  mastery_by_difficulty: Record<DifficultyLevel, number>;
  learning_velocity: number; // concepts per month
  strongest_areas: string[]; // concept types
  weakest_areas: string[]; // concept types
}

// =====================================================================
// Filter Types
// =====================================================================

export interface ConceptFilters {
  type?: ConceptType | ConceptType[];
  difficulty_level?: DifficultyLevel | DifficultyLevel[];
  is_active?: boolean;
  search?: string;
  has_prerequisites?: boolean;
  has_dependents?: boolean;
  created_after?: string;
  created_before?: string;
}

export interface RelationshipFilters {
  relationship_type?: RelationshipType | RelationshipType[];
  source_concept_id?: string;
  target_concept_id?: string;
  min_strength?: number;
  max_strength?: number;
  is_active?: boolean;
}

export interface MasteryFilters {
  user_id?: string;
  concept_id?: string;
  mastery_level?: MasteryLevel | MasteryLevel[];
  min_confidence?: number;
  has_recent_practice?: boolean; // practiced in last 30 days
}
