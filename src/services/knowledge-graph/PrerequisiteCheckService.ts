/**
 * Prerequisite Check Service
 *
 * Validates course prerequisites using the knowledge graph
 * Determines if a user can enroll in a course based on concept mastery
 */

import { supabase } from '@/integrations/supabase/client';
import { KnowledgeGraphService } from './KnowledgeGraphService';
import { UserMasteryService } from './UserMasteryService';
import type { Concept } from '@/types/knowledge-graph';

export interface PrerequisiteConcept {
  concept: Concept;
  required_mastery: number; // 0-1, minimum mastery level required
  current_mastery: number; // 0-1, user's current mastery
  is_met: boolean; // Does user meet the requirement?
}

export interface PrerequisiteCheckResult {
  can_enroll: boolean; // Can the user enroll in this course?
  all_prerequisites_met: boolean; // Are all prerequisites met?
  missing_prerequisites: PrerequisiteConcept[]; // Prerequisites not yet met
  met_prerequisites: PrerequisiteConcept[]; // Prerequisites already met
  suggested_courses: Array<{
    course_id: number;
    course_title: string;
    concepts_covered: string[]; // Concept names
  }>; // Courses that teach missing prerequisites
  prerequisite_tree?: any; // Optional: full prerequisite tree visualization
}

export class PrerequisiteCheckService {
  /**
   * Check if a user can enroll in a course based on prerequisites
   *
   * @param userId - User ID to check
   * @param courseId - Course ID to check enrollment for
   * @param threshold - Minimum mastery threshold (0-1), default 0.6
   * @returns PrerequisiteCheckResult with enrollment eligibility and details
   */
  static async checkCoursePrerequisites(
    userId: string,
    courseId: number,
    threshold: number = 0.6
  ): Promise<PrerequisiteCheckResult> {
    // Step 1: Get all concepts covered by this course
    const courseConcepts = await KnowledgeGraphService.getCourseConcepts(courseId);

    if (courseConcepts.length === 0) {
      // No concepts mapped to this course - allow enrollment (no prerequisites defined)
      return {
        can_enroll: true,
        all_prerequisites_met: true,
        missing_prerequisites: [],
        met_prerequisites: [],
        suggested_courses: [],
      };
    }

    // Step 2: For each concept, get its prerequisites
    const allPrerequisites = new Map<string, { concept: Concept; required_mastery: number }>();

    for (const courseConcept of courseConcepts) {
      if (!courseConcept.concept) continue;

      // Get prerequisite relationships for this concept
      const relationships = await KnowledgeGraphService.getRelationships(courseConcept.concept.id);
      const prerequisites = relationships.filter(r => r.relationship_type === 'prerequisite');

      for (const prereq of prerequisites) {
        // For "X is prerequisite for Y", X is the source (thing you need to know first)
        // We're checking prerequisites for concepts in the course, so we want sources
        const prereqConcept = prereq.source_concept_details;
        if (!prereqConcept || allPrerequisites.has(prereqConcept.id)) {
          continue;
        }

        // Required mastery is based on relationship strength
        // Higher strength = more important prerequisite = higher required mastery
        const required_mastery = Math.max(threshold, prereq.strength);

        allPrerequisites.set(prereqConcept.id, {
          concept: prereqConcept,
          required_mastery,
        });
      }
    }

    // If no prerequisites found, allow enrollment
    if (allPrerequisites.size === 0) {
      return {
        can_enroll: true,
        all_prerequisites_met: true,
        missing_prerequisites: [],
        met_prerequisites: [],
        suggested_courses: [],
      };
    }

    // Step 3: Check user's mastery for each prerequisite
    const missingPrereqs: PrerequisiteConcept[] = [];
    const metPrereqs: PrerequisiteConcept[] = [];

    for (const [conceptId, { concept, required_mastery }] of allPrerequisites) {
      const mastery = await UserMasteryService.getUserConceptMastery(userId, conceptId);
      const current_mastery = mastery?.mastery_level || 0;

      const prereqCheck: PrerequisiteConcept = {
        concept,
        required_mastery,
        current_mastery,
        is_met: current_mastery >= required_mastery,
      };

      if (prereqCheck.is_met) {
        metPrereqs.push(prereqCheck);
      } else {
        missingPrereqs.push(prereqCheck);
      }
    }

    // Step 4: Find courses that teach the missing prerequisites
    const suggestedCourses = await this.findCoursesTeachingConcepts(
      missingPrereqs.map(p => p.concept.id)
    );

    return {
      can_enroll: missingPrereqs.length === 0,
      all_prerequisites_met: missingPrereqs.length === 0,
      missing_prerequisites: missingPrereqs,
      met_prerequisites: metPrereqs,
      suggested_courses: suggestedCourses,
    };
  }

  /**
   * Find courses that teach specific concepts
   * Used to suggest courses for missing prerequisites
   */
  private static async findCoursesTeachingConcepts(
    conceptIds: string[]
  ): Promise<Array<{ course_id: number; course_title: string; concepts_covered: string[] }>> {
    if (conceptIds.length === 0) {
      return [];
    }

    // Query course_concepts to find courses that teach these concepts
    const { data: courseMappings, error } = await supabase
      .from('knowledge_graph_course_concepts')
      .select(
        `
        course_id,
        concept_id,
        coverage_level,
        concept:knowledge_graph_concepts!inner(id, name)
      `
      )
      .in('concept_id', conceptIds)
      .in('coverage_level', ['covers', 'masters']); // Only courses that deeply cover the concept

    if (error) {
      console.error('Error finding courses for concepts:', error);
      return [];
    }

    if (!courseMappings || courseMappings.length === 0) {
      return [];
    }

    // Group by course_id
    const courseMap = new Map<
      number,
      { course_id: number; course_title: string; concepts_covered: string[] }
    >();

    for (const mapping of courseMappings as any[]) {
      if (!courseMap.has(mapping.course_id)) {
        // Fetch course title
        const { data: course } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', mapping.course_id)
          .single();

        if (course) {
          courseMap.set(mapping.course_id, {
            course_id: mapping.course_id,
            course_title: course.title,
            concepts_covered: [],
          });
        }
      }

      const courseEntry = courseMap.get(mapping.course_id);
      if (courseEntry && mapping.concept?.name) {
        courseEntry.concepts_covered.push(mapping.concept.name);
      }
    }

    return Array.from(courseMap.values());
  }

  /**
   * Check prerequisites for multiple courses at once
   * Useful for course catalog filtering
   */
  static async bulkCheckCoursePrerequisites(
    userId: string,
    courseIds: number[],
    threshold: number = 0.6
  ): Promise<Map<number, PrerequisiteCheckResult>> {
    const results = new Map<number, PrerequisiteCheckResult>();

    // Note: Could be optimized with parallel processing
    for (const courseId of courseIds) {
      const result = await this.checkCoursePrerequisites(userId, courseId, threshold);
      results.set(courseId, result);
    }

    return results;
  }

  /**
   * Get a visualization-friendly prerequisite tree for a course
   * Returns a hierarchical structure of prerequisites
   */
  static async getPrerequisiteTree(courseId: number): Promise<{
    course_id: number;
    course_title: string;
    direct_concepts: Concept[];
    prerequisite_chains: Array<{
      target_concept: Concept;
      prerequisites: Concept[];
      depth: number;
    }>;
  } | null> {
    // Get course details
    const { data: course } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (!course) {
      return null;
    }

    // Get concepts taught in this course
    const courseConcepts = await KnowledgeGraphService.getCourseConcepts(courseId);
    const directConcepts = courseConcepts
      .map(cc => cc.concept)
      .filter((c): c is Concept => c !== null && c !== undefined);

    // For each concept, get its prerequisite chain
    const prerequisiteChains: Array<{
      target_concept: Concept;
      prerequisites: Concept[];
      depth: number;
    }> = [];

    for (const concept of directConcepts) {
      const chain = await this.getPrerequisiteChain(concept.id, 0, new Set<string>());
      if (chain.length > 0) {
        prerequisiteChains.push({
          target_concept: concept,
          prerequisites: chain,
          depth: chain.length,
        });
      }
    }

    return {
      course_id: courseId,
      course_title: course.title,
      direct_concepts: directConcepts,
      prerequisite_chains,
    };
  }

  /**
   * Recursively get all prerequisites for a concept (with cycle detection)
   */
  private static async getPrerequisiteChain(
    conceptId: string,
    depth: number,
    visited: Set<string>
  ): Promise<Concept[]> {
    // Prevent infinite loops
    if (visited.has(conceptId) || depth > 10) {
      return [];
    }

    visited.add(conceptId);

    // Get direct prerequisites
    const relationships = await KnowledgeGraphService.getRelationships(conceptId);
    const prerequisites = relationships.filter(r => r.relationship_type === 'prerequisite');

    const chain: Concept[] = [];

    for (const prereq of prerequisites) {
      const prereqConcept = prereq.source_concept_details;
      if (prereqConcept) {
        chain.push(prereqConcept);

        // Recursively get prerequisites of prerequisites
        const subChain = await this.getPrerequisiteChain(prereqConcept.id, depth + 1, visited);
        chain.push(...subChain);
      }
    }

    return chain;
  }
}
