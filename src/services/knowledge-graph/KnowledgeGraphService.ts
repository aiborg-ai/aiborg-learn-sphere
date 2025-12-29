/**
 * Knowledge Graph Service
 *
 * Core service for managing the knowledge graph - concepts, relationships,
 * prerequisite chains, and graph traversal operations.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  Concept,
  ConceptRelationship,
  CourseConcept,
  InsertConcept,
  UpdateConcept,
  InsertConceptRelationship,
  UpdateConceptRelationship,
  ConceptFilters,
  PrerequisiteChainEntry,
  LearningPathStep,
  GraphValidationResult,
  GraphValidationError,
  GraphValidationWarning,
  RelationshipType,
} from '@/types/knowledge-graph';

export class KnowledgeGraphService {
  // =====================================================================
  // Concept CRUD Operations
  // =====================================================================

  /**
   * Get a single concept by ID
   */
  static async getConcept(conceptId: string): Promise<Concept | null> {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('id', conceptId)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error('Error fetching concept:', error);
      return null;
    }

    return data as Concept;
  }

  /**
   * Get concept by slug
   */
  static async getConceptBySlug(slug: string): Promise<Concept | null> {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error('Error fetching concept by slug:', error);
      return null;
    }

    return data as Concept;
  }

  /**
   * Get all concepts with optional filters
   */
  static async getConcepts(filters?: ConceptFilters): Promise<Concept[]> {
    let query = supabase.from('concepts').select('*').order('name');

    // Apply filters
    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        query = query.in('type', filters.type);
      } else {
        query = query.eq('type', filters.type);
      }
    }

    if (filters?.difficulty_level) {
      if (Array.isArray(filters.difficulty_level)) {
        query = query.in('difficulty_level', filters.difficulty_level);
      } else {
        query = query.eq('difficulty_level', filters.difficulty_level);
      }
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching concepts:', error);
      return [];
    }

    return (data || []) as Concept[];
  }

  /**
   * Create a new concept
   */
  static async createConcept(concept: InsertConcept): Promise<Concept | null> {
    const { data, error } = await supabase.from('concepts').insert(concept).select().single();

    if (error) {
      logger.error('Error creating concept:', error);
      return null;
    }

    return data as Concept;
  }

  /**
   * Update an existing concept
   */
  static async updateConcept(conceptId: string, updates: UpdateConcept): Promise<Concept | null> {
    const { data, error } = await supabase
      .from('concepts')
      .update(updates)
      .eq('id', conceptId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating concept:', error);
      return null;
    }

    return data as Concept;
  }

  /**
   * Delete a concept (soft delete)
   */
  static async deleteConcept(conceptId: string): Promise<boolean> {
    const { error } = await supabase
      .from('concepts')
      .update({ is_active: false })
      .eq('id', conceptId);

    if (error) {
      logger.error('Error deleting concept:', error);
      return false;
    }

    return true;
  }

  // =====================================================================
  // Relationship Operations
  // =====================================================================

  /**
   * Get all relationships for a concept
   */
  static async getRelationships(
    conceptId: string,
    relationshipType?: RelationshipType
  ): Promise<ConceptRelationship[]> {
    let query = supabase
      .from('concept_relationships')
      .select(
        '*, source_concept:concepts!source_concept_id(*), target_concept:concepts!target_concept_id(*)'
      )
      .or(`source_concept_id.eq.${conceptId},target_concept_id.eq.${conceptId}`)
      .eq('is_active', true);

    if (relationshipType) {
      query = query.eq('relationship_type', relationshipType);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching relationships:', error);
      return [];
    }

    return (data || []) as ConceptRelationship[];
  }

  /**
   * Get direct prerequisites of a concept
   */
  static async getPrerequisites(conceptId: string): Promise<Concept[]> {
    const { data, error } = await supabase
      .from('concept_relationships')
      .select('source_concept:concepts!source_concept_id(*)')
      .eq('target_concept_id', conceptId)
      .eq('relationship_type', 'prerequisite')
      .eq('is_active', true);

    if (error) {
      logger.error('Error fetching prerequisites:', error);
      return [];
    }

    return (data?.map((d: any) => d.source_concept) || []) as Concept[];
  }

  /**
   * Get concepts that depend on this concept (reverse prerequisites)
   */
  static async getDependents(conceptId: string): Promise<Concept[]> {
    const { data, error } = await supabase
      .from('concept_relationships')
      .select('target_concept:concepts!target_concept_id(*)')
      .eq('source_concept_id', conceptId)
      .eq('relationship_type', 'prerequisite')
      .eq('is_active', true);

    if (error) {
      logger.error('Error fetching dependents:', error);
      return [];
    }

    return (data?.map((d: any) => d.target_concept) || []) as Concept[];
  }

  /**
   * Get full prerequisite chain (recursive)
   * Uses the database function get_prerequisite_chain
   */
  static async getPrerequisiteChain(conceptId: string): Promise<PrerequisiteChainEntry[]> {
    const { data, error } = await supabase.rpc('get_prerequisite_chain', {
      concept_uuid: conceptId,
    });

    if (error) {
      logger.error('Error fetching prerequisite chain:', error);
      return [];
    }

    return (data || []) as PrerequisiteChainEntry[];
  }

  /**
   * Get related concepts (specific relationship types)
   */
  static async getRelatedConcepts(
    conceptId: string,
    relationshipType?: RelationshipType
  ): Promise<ConceptRelationship[]> {
    return this.getRelationships(conceptId, relationshipType);
  }

  /**
   * Create a new relationship
   */
  static async createRelationship(
    relationship: InsertConceptRelationship
  ): Promise<ConceptRelationship | null> {
    // Check for circular dependencies if it's a prerequisite
    if (relationship.relationship_type === 'prerequisite') {
      const hasCircular = await this.checkCircularDependency(
        relationship.source_concept_id,
        relationship.target_concept_id
      );

      if (hasCircular) {
        logger.error('Circular dependency detected - relationship not created');
        return null;
      }
    }

    const { data, error } = await supabase
      .from('concept_relationships')
      .insert(relationship)
      .select()
      .single();

    if (error) {
      logger.error('Error creating relationship:', error);
      return null;
    }

    return data as ConceptRelationship;
  }

  /**
   * Update a relationship
   */
  static async updateRelationship(
    relationshipId: string,
    updates: UpdateConceptRelationship
  ): Promise<ConceptRelationship | null> {
    const { data, error } = await supabase
      .from('concept_relationships')
      .update(updates)
      .eq('id', relationshipId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating relationship:', error);
      return null;
    }

    return data as ConceptRelationship;
  }

  /**
   * Delete a relationship
   */
  static async deleteRelationship(relationshipId: string): Promise<boolean> {
    const { error } = await supabase
      .from('concept_relationships')
      .update({ is_active: false })
      .eq('id', relationshipId);

    if (error) {
      logger.error('Error deleting relationship:', error);
      return false;
    }

    return true;
  }

  // =====================================================================
  // Graph Validation
  // =====================================================================

  /**
   * Check for circular dependencies
   * Uses the database function check_circular_prerequisites
   */
  static async checkCircularDependency(
    sourceConceptId: string,
    targetConceptId: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_circular_prerequisites', {
      source_uuid: sourceConceptId,
      target_uuid: targetConceptId,
    });

    if (error) {
      logger.error('Error checking circular dependency:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Validate the entire graph
   */
  static async validateGraph(): Promise<GraphValidationResult> {
    const errors: GraphValidationError[] = [];
    const warnings: GraphValidationWarning[] = [];

    // Get all concepts and relationships
    const concepts = await this.getConcepts({ is_active: true });
    const allRelationships: ConceptRelationship[] = [];

    // Collect all relationships
    for (const concept of concepts) {
      const rels = await this.getRelationships(concept.id);
      allRelationships.push(...rels);
    }

    // Check for orphaned concepts (no relationships)
    for (const concept of concepts) {
      const hasRelationships = allRelationships.some(
        r => r.source_concept_id === concept.id || r.target_concept_id === concept.id
      );

      if (!hasRelationships) {
        warnings.push({
          type: 'orphaned_concept',
          message: `Concept "${concept.name}" has no relationships`,
          affected_concepts: [concept.id],
        });
      }
    }

    // Check for weak relationships (strength < 0.3)
    const weakRelationships = allRelationships.filter(r => r.strength < 0.3);
    if (weakRelationships.length > 0) {
      warnings.push({
        type: 'weak_relationship',
        message: `Found ${weakRelationships.length} relationships with strength < 0.3`,
        affected_relationships: weakRelationships.map(r => r.id),
      });
    }

    // Check for deep prerequisite chains (depth > 5)
    for (const concept of concepts) {
      const chain = await this.getPrerequisiteChain(concept.id);
      if (chain.length > 5) {
        warnings.push({
          type: 'deep_chain',
          message: `Concept "${concept.name}" has a prerequisite chain depth of ${chain.length}`,
          affected_concepts: [concept.id],
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // =====================================================================
  // Learning Path Operations
  // =====================================================================

  /**
   * Find shortest learning path between two concepts
   * Uses breadth-first search
   */
  static async findLearningPath(
    fromConceptId: string,
    toConceptId: string
  ): Promise<LearningPathStep[]> {
    // Implementation would use BFS to find shortest path
    // For now, return empty array - to be implemented
    logger.warn('findLearningPath not yet implemented');
    return [];
  }

  // =====================================================================
  // Course Mapping Operations
  // =====================================================================

  /**
   * Get concepts taught in a course
   */
  static async getCourseConcepts(courseId: number): Promise<CourseConcept[]> {
    const { data, error } = await supabase
      .from('course_concepts')
      .select('*, concept:concepts(*)')
      .eq('course_id', courseId)
      .order('order_index');

    if (error) {
      logger.error('Error fetching course concepts:', error);
      return [];
    }

    return (data || []) as CourseConcept[];
  }

  /**
   * Get courses that teach a concept
   */
  static async getConceptCourses(conceptId: string): Promise<CourseConcept[]> {
    const { data, error } = await supabase
      .from('course_concepts')
      .select('*')
      .eq('concept_id', conceptId)
      .order('order_index');

    if (error) {
      logger.error('Error fetching concept courses:', error);
      return [];
    }

    return (data || []) as CourseConcept[];
  }

  /**
   * Link a concept to a course
   */
  static async linkConceptToCourse(
    courseId: number,
    conceptId: string,
    coverageLevel: 'introduces' | 'covers' | 'masters',
    options?: {
      order_index?: number;
      is_primary?: boolean;
      weight?: number;
    }
  ): Promise<CourseConcept | null> {
    const { data, error } = await supabase
      .from('course_concepts')
      .insert({
        course_id: courseId,
        concept_id: conceptId,
        coverage_level: coverageLevel,
        ...options,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error linking concept to course:', error);
      return null;
    }

    return data as CourseConcept;
  }

  /**
   * Unlink a concept from a course
   */
  static async unlinkConceptFromCourse(courseId: number, conceptId: string): Promise<boolean> {
    const { error } = await supabase
      .from('course_concepts')
      .delete()
      .eq('course_id', courseId)
      .eq('concept_id', conceptId);

    if (error) {
      logger.error('Error unlinking concept from course:', error);
      return false;
    }

    return true;
  }

  // =====================================================================
  // Prerequisite Validation
  // =====================================================================

  /**
   * Check if user meets prerequisites for a concept
   */
  static async validatePrerequisites(
    userId: string,
    conceptId: string,
    minimumMasteryLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<{
    allowed: boolean;
    missingPrerequisites: Concept[];
    masteredPrerequisites: Concept[];
  }> {
    // Get all prerequisites
    const prerequisites = await this.getPrerequisites(conceptId);

    // Import UserMasteryService (circular dependency handled by TypeScript)
    const { UserMasteryService } = await import('./UserMasteryService');

    const missingPrerequisites: Concept[] = [];
    const masteredPrerequisites: Concept[] = [];

    // Check user's mastery of each prerequisite
    for (const prereq of prerequisites) {
      const mastery = await UserMasteryService.getMastery(userId, prereq.id);

      if (!mastery || mastery.mastery_level === 'none') {
        missingPrerequisites.push(prereq);
      } else {
        // Check if mastery level is sufficient
        const masteryLevels = ['none', 'beginner', 'intermediate', 'advanced', 'mastered'];
        const userLevel = masteryLevels.indexOf(mastery.mastery_level);
        const requiredLevel = masteryLevels.indexOf(minimumMasteryLevel);

        if (userLevel >= requiredLevel) {
          masteredPrerequisites.push(prereq);
        } else {
          missingPrerequisites.push(prereq);
        }
      }
    }

    return {
      allowed: missingPrerequisites.length === 0,
      missingPrerequisites,
      masteredPrerequisites,
    };
  }
}
