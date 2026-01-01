/**
 * Learning Recommendation Service
 *
 * Provides intelligent learning recommendations based on:
 * - User's current mastery levels
 * - Knowledge graph relationships
 * - Prerequisites and learning paths
 * - User preferences and goals
 */

import type {
  LearningRecommendation,
  RecommendationReason,
  RecommendationOptions,
  Concept,
} from '@/types/knowledge-graph';
import { KnowledgeGraphService } from './KnowledgeGraphService';
import { UserMasteryService } from './UserMasteryService';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export class LearningRecommendationService {
  // =====================================================================
  // Recommendation Generation
  // =====================================================================

  /**
   * Get personalized learning recommendations for a user
   */
  static async getRecommendations(
    userId: string,
    options?: RecommendationOptions
  ): Promise<LearningRecommendation[]> {
    const limit = options?.limit || 10;

    // Get user's current masteries
    const masteries = await UserMasteryService.getUserMasteries(userId);

    // Get all concepts
    const allConcepts = await KnowledgeGraphService.getConcepts({
      is_active: true,
      type: options?.concept_types,
      difficulty_level: options?.difficulty_preference
        ? [options.difficulty_preference]
        : undefined,
    });

    // Find concepts that are ready to learn
    const readyConcepts = await this.findReadyConcepts(
      userId,
      allConcepts,
      masteries.map(m => m.concept_id)
    );

    // Score each ready concept
    const scoredRecommendations: LearningRecommendation[] = [];

    for (const concept of readyConcepts) {
      const recommendation = await this.scoreRecommendation(userId, concept, options);

      if (recommendation) {
        scoredRecommendations.push(recommendation);
      }
    }

    // Sort by score (descending)
    scoredRecommendations.sort((a, b) => b.score - a.score);

    // Return top N
    return scoredRecommendations.slice(0, limit);
  }

  /**
   * Find concepts where prerequisites are met but not yet mastered
   */
  static async findReadyConcepts(
    userId: string,
    allConcepts: Concept[],
    masteredConceptIds: string[]
  ): Promise<Concept[]> {
    const readyConcepts: Concept[] = [];

    for (const concept of allConcepts) {
      // Skip if already mastered
      if (masteredConceptIds.includes(concept.id)) {
        continue;
      }

      // Check if prerequisites are met
      const validation = await KnowledgeGraphService.validatePrerequisites(
        userId,
        concept.id,
        'beginner'
      );

      if (validation.allowed) {
        readyConcepts.push(concept);
      }
    }

    return readyConcepts;
  }

  // =====================================================================
  // Recommendation Scoring
  // =====================================================================

  /**
   * Calculate recommendation score for a concept (multi-factor)
   */
  private static async scoreRecommendation(
    userId: string,
    concept: Concept,
    options?: RecommendationOptions
  ): Promise<LearningRecommendation | null> {
    let totalScore = 0;
    let reason: RecommendationReason = 'prerequisite_met';

    // Factor 1: Relationship strength (30%)
    const relationshipScore = await this.calculateRelationshipScore(userId, concept.id);
    totalScore += relationshipScore * 0.3;

    if (relationshipScore > 0.7) {
      reason = 'related_to_mastered';
    }

    // Factor 2: Natural progression (25%)
    const progressionScore = await this.calculateProgressionScore(userId, concept);
    totalScore += progressionScore * 0.25;

    if (progressionScore > 0.7) {
      reason = 'completes_learning_path';
    }

    // Factor 3: User preferences (20%)
    const preferenceScore = this.calculatePreferenceScore(concept, options);
    totalScore += preferenceScore * 0.2;

    // Factor 4: Popularity (15%) - based on enrollment count
    const popularityScore = await this.calculatePopularityScore(concept);
    totalScore += popularityScore * 0.15;

    // Factor 5: Skill gap filling (10%)
    const gapScore = await this.calculateSkillGapScore(userId, concept);
    totalScore += gapScore * 0.1;

    if (gapScore > 0.8) {
      reason = 'fills_skill_gap';
    }

    // Get related courses
    const courseConcepts = await KnowledgeGraphService.getConceptCourses(concept.id);
    const relatedCourses = courseConcepts.map(cc => cc.course_id);

    return {
      concept,
      score: totalScore,
      reason,
      prerequisites_met: true, // Already validated in findReadyConcepts
      estimated_time: concept.estimated_hours || 5,
      related_courses: relatedCourses,
    };
  }

  /**
   * Calculate score based on relationships to mastered concepts
   */
  private static async calculateRelationshipScore(
    userId: string,
    conceptId: string
  ): Promise<number> {
    // Get all relationships for this concept
    const relationships = await KnowledgeGraphService.getRelationships(conceptId);

    // Get user's mastered concepts
    const masteries = await UserMasteryService.getUserMasteries(userId, {
      mastery_level: ['advanced', 'mastered'],
    });
    const masteredIds = new Set(masteries.map(m => m.concept_id));

    // Calculate average strength of relationships to mastered concepts
    const relatedToMastered = relationships.filter(
      r =>
        (masteredIds.has(r.source_concept_id) || masteredIds.has(r.target_concept_id)) &&
        (r.relationship_type === 'related_to' || r.relationship_type === 'builds_on')
    );

    if (relatedToMastered.length === 0) {
      return 0.3; // Base score if no relationships
    }

    const avgStrength =
      relatedToMastered.reduce((sum, r) => sum + r.strength, 0) / relatedToMastered.length;

    return avgStrength;
  }

  /**
   * Calculate score based on natural learning progression
   */
  private static async calculateProgressionScore(
    userId: string,
    concept: Concept
  ): Promise<number> {
    // Get user's current difficulty distribution
    const masteries = await UserMasteryService.getUserMasteries(userId);

    const difficultyLevels = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };

    // Calculate average mastered difficulty
    let totalDifficulty = 0;
    let count = 0;

    for (const mastery of masteries) {
      if (mastery.concept && mastery.mastery_level !== 'none') {
        totalDifficulty += difficultyLevels[mastery.concept.difficulty_level] || 0;
        count++;
      }
    }

    const avgDifficulty = count > 0 ? totalDifficulty / count : 1;
    const conceptDifficulty = difficultyLevels[concept.difficulty_level] || 1;

    // Score higher if concept is slightly above user's average level
    const diff = conceptDifficulty - avgDifficulty;

    if (diff >= -0.5 && diff <= 0.5) {
      return 1.0; // Perfect match to current level
    } else if (diff > 0.5 && diff <= 1.0) {
      return 0.8; // Slightly challenging (good)
    } else if (diff < -0.5 && diff >= -1.0) {
      return 0.6; // Slightly easier (still useful)
    } else {
      return 0.3; // Too easy or too hard
    }
  }

  /**
   * Calculate score based on user preferences
   */
  /**
   * Calculate popularity score based on enrollment count and user activity
   */
  private static async calculatePopularityScore(concept: Concept): Promise<number> {
    try {
      // Get courses related to this concept
      const conceptCourses = await KnowledgeGraphService.getConceptCourses(concept.id);

      if (conceptCourses.length === 0) {
        return 0.5; // Neutral score if no courses found
      }

      // Fetch enrollment counts for related courses
      const courseIds = conceptCourses.map(cc => cc.course_id);
      const { data: courses, error } = await supabase
        .from('courses')
        .select('id, enrollment_count')
        .in('id', courseIds);

      if (error) {
        logger.warn('Failed to fetch course enrollment data:', error);
        return 0.5; // Default neutral score
      }

      // Calculate average enrollment count
      const enrollmentCounts = courses?.map(c => c.enrollment_count || 0) || [0];
      const avgEnrollment =
        enrollmentCounts.reduce((sum, count) => sum + count, 0) / enrollmentCounts.length;

      // Normalize to 0-1 scale (using log scale for better distribution)
      // Assume 100+ enrollments is very popular (score 1.0)
      const normalizedScore = Math.min(1.0, Math.log10(avgEnrollment + 1) / Math.log10(101));

      return normalizedScore;
    } catch (_error) {
      logger.warn('Error calculating popularity score:', _error);
      return 0.5; // Default neutral score on error
    }
  }

  private static calculatePreferenceScore(
    concept: Concept,
    options?: RecommendationOptions
  ): Promise<number> {
    let score = 0.5; // Base score

    if (!options?.user_preferences) {
      return score;
    }

    // Check if concept type matches preferred topics
    if (options.user_preferences.topics) {
      const matchesTopic = options.user_preferences.topics.some(topic =>
        concept.name.toLowerCase().includes(topic.toLowerCase())
      );

      if (matchesTopic) {
        score += 0.3;
      }
    }

    // Check if estimated time fits user's available time
    if (options.user_preferences.time_available && concept.estimated_hours) {
      if (concept.estimated_hours <= options.user_preferences.time_available) {
        score += 0.2;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate score based on filling skill gaps
   */
  private static async calculateSkillGapScore(userId: string, concept: Concept): Promise<number> {
    // Get user's mastery distribution by type
    const summary = await UserMasteryService.getMasterySummary(userId);

    // Check if this concept type is underrepresented
    const typeCount = summary.mastery_by_type[concept.type] || 0;
    const totalConcepts = summary.total_concepts || 1;
    const typeRatio = typeCount / totalConcepts;

    // If this type is less than 20% of total, it's a gap
    if (typeRatio < 0.2) {
      return 1.0;
    } else if (typeRatio < 0.3) {
      return 0.7;
    } else {
      return 0.4;
    }
  }

  // =====================================================================
  // Specialized Recommendations
  // =====================================================================

  /**
   * Get "Next Steps" recommendations after completing a concept/course
   */
  static async getNextSteps(
    userId: string,
    completedConceptId: string,
    limit: number = 5
  ): Promise<LearningRecommendation[]> {
    // Get concepts that build on or are related to the completed concept
    const relationships = await KnowledgeGraphService.getRelationships(completedConceptId);

    const nextStepConceptIds = relationships
      .filter(
        r =>
          r.source_concept_id === completedConceptId &&
          (r.relationship_type === 'builds_on' || r.relationship_type === 'related_to')
      )
      .map(r => r.target_concept_id);

    // Also get dependents (concepts that have this as a prerequisite)
    const dependents = await KnowledgeGraphService.getDependents(completedConceptId);
    nextStepConceptIds.push(...dependents.map(d => d.id));

    // Get concept details
    const nextStepConcepts = await Promise.all(
      nextStepConceptIds.map(id => KnowledgeGraphService.getConcept(id))
    );

    const validConcepts = nextStepConcepts.filter(c => c !== null) as Concept[];

    // Score and return recommendations
    const recommendations: LearningRecommendation[] = [];

    for (const concept of validConcepts) {
      const recommendation = await this.scoreRecommendation(userId, concept);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit);
  }

  /**
   * Get "Fill the Gap" recommendations for underrepresented skill areas
   */
  static async getFillTheGapRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<LearningRecommendation[]> {
    const summary = await UserMasteryService.getMasterySummary(userId);

    // Find weakest areas
    const weakAreas = summary.weakest_areas;

    // Get concepts in those areas
    const allConcepts = await KnowledgeGraphService.getConcepts({
      is_active: true,
    });

    const gapConcepts = allConcepts.filter(c => weakAreas.includes(c.type));

    // Get recommendations for these concepts
    const masteredIds = (await UserMasteryService.getUserMasteries(userId)).map(m => m.concept_id);

    const readyConcepts = await this.findReadyConcepts(userId, gapConcepts, masteredIds);

    const recommendations: LearningRecommendation[] = [];

    for (const concept of readyConcepts) {
      const recommendation = await this.scoreRecommendation(userId, concept);
      if (recommendation) {
        recommendations.push({
          ...recommendation,
          reason: 'fills_skill_gap',
        });
      }
    }

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit);
  }

  /**
   * Get course recommendations based on concepts
   */
  static async getCourseRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<{ course_id: number; score: number; recommended_concepts: string[] }[]> {
    // Get all recommendations
    const recommendations = await this.getRecommendations(userId, { limit: 20 });

    // Group by course
    const courseScores: Map<number, { score: number; concepts: string[] }> = new Map();

    for (const rec of recommendations) {
      for (const courseId of rec.related_courses || []) {
        const existing = courseScores.get(courseId) || {
          score: 0,
          concepts: [],
        };

        existing.score += rec.score;
        existing.concepts.push(rec.concept.id);

        courseScores.set(courseId, existing);
      }
    }

    // Convert to array and sort
    const courseRecs = Array.from(courseScores.entries())
      .map(([course_id, { score, concepts }]) => ({
        course_id,
        score: score / concepts.length, // Average score
        recommended_concepts: concepts,
      }))
      .sort((a, b) => b.score - a.score);

    return courseRecs.slice(0, limit);
  }
}
