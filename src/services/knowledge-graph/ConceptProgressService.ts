/**
 * Concept Progress Service
 *
 * Bridge service that handles operations requiring both KnowledgeGraphService
 * and UserMasteryService. This breaks the circular dependency between those two services.
 *
 * Architecture:
 * - KnowledgeGraphService: Manages concept data and relationships
 * - UserMasteryService: Manages user mastery tracking
 * - ConceptProgressService: Coordinates between the two (this file)
 */

import type { Concept } from '@/types/knowledge-graph';

export class ConceptProgressService {
  // =====================================================================
  // Prerequisite Validation
  // =====================================================================

  /**
   * Check if user meets prerequisites for a concept
   *
   * This method was moved from KnowledgeGraphService to break circular dependency.
   * It needs both KnowledgeGraphService (for prerequisites) and UserMasteryService (for mastery).
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
    // Lazy load dependencies to avoid circular imports at module level
    const { KnowledgeGraphService } = await import('./KnowledgeGraphService');
    const { UserMasteryService } = await import('./UserMasteryService');

    // Get all prerequisites
    const prerequisites = await KnowledgeGraphService.getPrerequisites(conceptId);

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

  // =====================================================================
  // Course Completion Recording
  // =====================================================================

  /**
   * Record course completion (adds evidence for all concepts in course)
   *
   * This method was moved from UserMasteryService to break circular dependency.
   * It needs both KnowledgeGraphService (for course concepts) and UserMasteryService (for evidence).
   */
  static async recordCourseCompletion(
    userId: string,
    courseId: number,
    score: number
  ): Promise<void> {
    // Lazy load dependencies to avoid circular imports at module level
    const { KnowledgeGraphService } = await import('./KnowledgeGraphService');
    const { UserMasteryService } = await import('./UserMasteryService');

    // Get all concepts taught in the course
    const courseConcepts = await KnowledgeGraphService.getCourseConcepts(courseId);

    // Add evidence for each concept
    const date = new Date().toISOString();

    for (const cc of courseConcepts) {
      // Weight score by coverage level
      const coverageWeights = {
        introduces: 0.5,
        covers: 0.75,
        masters: 1.0,
      };

      const weight = coverageWeights[cc.coverage_level] || 0.5;
      const weightedScore = score * weight;

      await UserMasteryService.addEvidence(userId, cc.concept_id, {
        type: 'course_completion',
        course_id: courseId,
        score: weightedScore,
        date,
      });
    }
  }
}
