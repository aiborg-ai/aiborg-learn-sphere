/**
 * Concept Suggestion Service
 *
 * Manages AI-powered concept suggestions for knowledge graph population
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Concept,
  ConceptRelationship,
  CourseConcept,
  ConceptType,
  DifficultyLevel,
  RelationshipType,
  CoverageLevel,
} from '@/types/knowledge-graph';
import { KnowledgeGraphService } from './KnowledgeGraphService';
import { logger } from '@/utils/logger';

// Types for AI suggestions
export interface ConceptSuggestion {
  id?: string; // Added locally for tracking
  name: string;
  type: ConceptType;
  difficulty_level: DifficultyLevel;
  description: string;
  estimated_hours?: number;
  status?: 'pending' | 'approved' | 'rejected'; // Added locally for tracking
  created_concept_id?: string; // Added after creation
}

export interface RelationshipSuggestion {
  id?: string; // Added locally for tracking
  source_concept: string; // Concept name (not ID)
  target_concept: string; // Concept name (not ID)
  relationship_type: RelationshipType;
  strength: number; // 0-1
  description?: string;
  status?: 'pending' | 'approved' | 'rejected'; // Added locally for tracking
  created_relationship_id?: string; // Added after creation
}

export interface CourseMappingSuggestion {
  id?: string; // Added locally for tracking
  concept_name: string;
  coverage_level: CoverageLevel;
  is_primary: boolean;
  weight: number; // 0-1
  status?: 'pending' | 'approved' | 'rejected'; // Added locally for tracking
}

export interface SuggestionBatch {
  id: string; // Local UUID
  source_type: 'course' | 'concept';
  source_id: number | string; // Course ID or concept name
  source_data?: any; // Course or concept details
  concepts: ConceptSuggestion[];
  relationships: RelationshipSuggestion[];
  course_mappings?: CourseMappingSuggestion[];
  created_at: Date;
  ai_provider: 'ollama' | 'openai';
  generation_time_ms: number;
}

export interface SuggestionRequest {
  course_id?: number;
  concept_name?: string;
  context?: string;
  aiProvider?: 'ollama' | 'openai';
}

export interface SuggestionResponse {
  success: boolean;
  data: {
    concepts: ConceptSuggestion[];
    relationships: RelationshipSuggestion[];
    course_mappings?: CourseMappingSuggestion[];
    source_data?: any;
  };
  metadata: {
    model: string;
    provider: 'ollama' | 'openai';
    generation_time_ms: number;
    concepts_count: number;
    relationships_count: number;
  };
}

export class ConceptSuggestionService {
  /**
   * Generate concept suggestions from a course
   */
  static async suggestFromCourse(
    courseId: number,
    context?: string,
    aiProvider: 'ollama' | 'openai' = 'ollama'
  ): Promise<SuggestionBatch> {
    const { data, error } = await supabase.functions.invoke<SuggestionResponse>(
      'suggest-knowledge-graph-concepts',
      {
        body: {
          course_id: courseId,
          context,
          aiProvider,
        },
      }
    );

    if (error) {
      logger.error('Error generating suggestions:', error);
      throw new Error(`Failed to generate suggestions: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error('Invalid response from suggestion service');
    }

    // Create a batch object
    const batch: SuggestionBatch = {
      id: crypto.randomUUID(),
      source_type: 'course',
      source_id: courseId,
      source_data: data.data.source_data,
      concepts: data.data.concepts.map((c, i) => ({
        ...c,
        id: `concept-${i}`,
        status: 'pending',
      })),
      relationships: data.data.relationships.map((r, i) => ({
        ...r,
        id: `relationship-${i}`,
        status: 'pending',
      })),
      course_mappings: data.data.course_mappings?.map((m, i) => ({
        ...m,
        id: `mapping-${i}`,
        status: 'pending',
      })),
      created_at: new Date(),
      ai_provider: data.metadata.provider,
      generation_time_ms: data.metadata.generation_time_ms,
    };

    return batch;
  }

  /**
   * Generate related concept suggestions from an existing concept
   */
  static async suggestRelatedConcepts(
    conceptName: string,
    context?: string,
    aiProvider: 'ollama' | 'openai' = 'ollama'
  ): Promise<SuggestionBatch> {
    const { data, error } = await supabase.functions.invoke<SuggestionResponse>(
      'suggest-knowledge-graph-concepts',
      {
        body: {
          concept_name: conceptName,
          context,
          aiProvider,
        },
      }
    );

    if (error) {
      logger.error('Error generating suggestions:', error);
      throw new Error(`Failed to generate suggestions: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error('Invalid response from suggestion service');
    }

    // Create a batch object
    const batch: SuggestionBatch = {
      id: crypto.randomUUID(),
      source_type: 'concept',
      source_id: conceptName,
      concepts: data.data.concepts.map((c, i) => ({
        ...c,
        id: `concept-${i}`,
        status: 'pending',
      })),
      relationships: data.data.relationships.map((r, i) => ({
        ...r,
        id: `relationship-${i}`,
        status: 'pending',
      })),
      created_at: new Date(),
      ai_provider: data.metadata.provider,
      generation_time_ms: data.metadata.generation_time_ms,
    };

    return batch;
  }

  /**
   * Approve and create a single concept suggestion
   */
  static async approveConcept(suggestion: ConceptSuggestion): Promise<Concept> {
    const concept = await KnowledgeGraphService.createConcept({
      name: suggestion.name,
      type: suggestion.type,
      difficulty_level: suggestion.difficulty_level,
      description: suggestion.description,
      estimated_hours: suggestion.estimated_hours || null,
    });

    if (!concept) {
      throw new Error('Failed to create concept');
    }

    return concept;
  }

  /**
   * Approve and create a single relationship suggestion
   * Requires concept name-to-ID mapping
   */
  static async approveRelationship(
    suggestion: RelationshipSuggestion,
    conceptNameToIdMap: Map<string, string>
  ): Promise<ConceptRelationship | null> {
    const sourceId = conceptNameToIdMap.get(suggestion.source_concept);
    const targetId = conceptNameToIdMap.get(suggestion.target_concept);

    if (!sourceId || !targetId) {
      logger.warn(
        `Cannot create relationship: concepts not found (${suggestion.source_concept} -> ${suggestion.target_concept})`
      );
      return null;
    }

    const relationship = await KnowledgeGraphService.createRelationship({
      source_concept_id: sourceId,
      target_concept_id: targetId,
      relationship_type: suggestion.relationship_type,
      strength: suggestion.strength,
      description: suggestion.description || null,
    });

    return relationship;
  }

  /**
   * Approve and create a course mapping suggestion
   * Requires concept name-to-ID mapping
   */
  static async approveCourseMapping(
    courseId: number,
    suggestion: CourseMappingSuggestion,
    conceptNameToIdMap: Map<string, string>
  ): Promise<CourseConcept | null> {
    const conceptId = conceptNameToIdMap.get(suggestion.concept_name);

    if (!conceptId) {
      logger.warn(`Cannot create course mapping: concept not found (${suggestion.concept_name})`);
      return null;
    }

    const mapping = await KnowledgeGraphService.linkConceptToCourse(
      courseId,
      conceptId,
      suggestion.coverage_level,
      {
        is_primary: suggestion.is_primary,
        weight: suggestion.weight,
      }
    );

    return mapping;
  }

  /**
   * Bulk approve all concepts in a batch
   * Returns map of concept name to created concept ID
   */
  static async bulkApproveConcepts(batch: SuggestionBatch): Promise<Map<string, string>> {
    const conceptNameToIdMap = new Map<string, string>();
    const pendingConcepts = batch.concepts.filter(c => c.status === 'pending');

    for (const suggestion of pendingConcepts) {
      try {
        const concept = await this.approveConcept(suggestion);
        conceptNameToIdMap.set(suggestion.name, concept.id);
        suggestion.status = 'approved';
        suggestion.created_concept_id = concept.id;
      } catch (_error) {
        logger._error(`Failed to approve concept ${suggestion.name}:`, _error);
        suggestion.status = 'rejected';
      }
    }

    return conceptNameToIdMap;
  }

  /**
   * Bulk approve all relationships in a batch
   * Must be called after bulkApproveConcepts or with existing concepts
   */
  static async bulkApproveRelationships(
    batch: SuggestionBatch,
    conceptNameToIdMap: Map<string, string>
  ): Promise<void> {
    const pendingRelationships = batch.relationships.filter(r => r.status === 'pending');

    for (const suggestion of pendingRelationships) {
      try {
        const relationship = await this.approveRelationship(suggestion, conceptNameToIdMap);
        if (relationship) {
          suggestion.status = 'approved';
          suggestion.created_relationship_id = relationship.id;
        } else {
          suggestion.status = 'rejected';
        }
      } catch (_error) {
        logger._error(
          `Failed to approve relationship ${suggestion.source_concept} -> ${suggestion.target_concept}:`,
          error
        );
        suggestion.status = 'rejected';
      }
    }
  }

  /**
   * Bulk approve all course mappings in a batch
   * Must be called after bulkApproveConcepts or with existing concepts
   */
  static async bulkApproveCourseMappings(
    batch: SuggestionBatch,
    courseId: number,
    conceptNameToIdMap: Map<string, string>
  ): Promise<void> {
    if (!batch.course_mappings) {
      return;
    }

    const pendingMappings = batch.course_mappings.filter(m => m.status === 'pending');

    for (const suggestion of pendingMappings) {
      try {
        const mapping = await this.approveCourseMapping(courseId, suggestion, conceptNameToIdMap);
        if (mapping) {
          suggestion.status = 'approved';
        } else {
          suggestion.status = 'rejected';
        }
      } catch (_error) {
        logger._error(`Failed to approve course mapping ${suggestion.concept_name}:`, _error);
        suggestion.status = 'rejected';
      }
    }
  }

  /**
   * Approve entire batch (all concepts, relationships, and course mappings)
   */
  static async approveBatch(batch: SuggestionBatch): Promise<{
    concepts_created: number;
    relationships_created: number;
    mappings_created: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Step 1: Create all concepts
      const conceptNameToIdMap = await this.bulkApproveConcepts(batch);

      // Also add existing concepts to the map (for relationships)
      const existingConcepts = await KnowledgeGraphService.getConcepts({ is_active: true });
      for (const concept of existingConcepts) {
        conceptNameToIdMap.set(concept.name, concept.id);
      }

      // Step 2: Create relationships
      await this.bulkApproveRelationships(batch, conceptNameToIdMap);

      // Step 3: Create course mappings (if applicable)
      if (batch.source_type === 'course' && typeof batch.source_id === 'number') {
        await this.bulkApproveCourseMappings(batch, batch.source_id, conceptNameToIdMap);
      }

      // Count results
      const concepts_created = batch.concepts.filter(c => c.status === 'approved').length;
      const relationships_created = batch.relationships.filter(r => r.status === 'approved').length;
      const mappings_created =
        batch.course_mappings?.filter(m => m.status === 'approved').length || 0;

      return {
        concepts_created,
        relationships_created,
        mappings_created,
        errors,
      };
    } catch (_error) {
      errors.push(`Batch approval failed: ${_error.message}`);
      return {
        concepts_created: 0,
        relationships_created: 0,
        mappings_created: 0,
        errors,
      };
    }
  }

  /**
   * Reject entire batch (mark all as rejected)
   */
  static rejectBatch(batch: SuggestionBatch): void {
    batch.concepts.forEach(c => (c.status = 'rejected'));
    batch.relationships.forEach(r => (r.status = 'rejected'));
    batch.course_mappings?.forEach(m => (m.status = 'rejected'));
  }
}
