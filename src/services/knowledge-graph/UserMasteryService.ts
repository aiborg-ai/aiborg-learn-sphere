/**
 * User Mastery Service
 *
 * Handles evidence-based skill mastery tracking, calculation, and updates.
 * Uses configurable weights and recency decay to determine mastery levels.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  UserConceptMastery,
  EvidencePoint,
  MasteryLevel,
  CalculatedMastery,
  UserProgressSummary,
  MasteryFilters,
  MasteryCalculationConfig,
} from '@/types/knowledge-graph';
import { DEFAULT_MASTERY_CONFIG } from '@/types/knowledge-graph';

export class UserMasteryService {
  private static config: MasteryCalculationConfig = DEFAULT_MASTERY_CONFIG;

  // =====================================================================
  // Configuration
  // =====================================================================

  /**
   * Update the mastery calculation configuration
   */
  static setConfig(config: Partial<MasteryCalculationConfig>): void {
    this.config = {
      ...DEFAULT_MASTERY_CONFIG,
      ...config,
      evidenceWeights: {
        ...DEFAULT_MASTERY_CONFIG.evidenceWeights,
        ...(config.evidenceWeights || {}),
      },
      recencyDecay: {
        ...DEFAULT_MASTERY_CONFIG.recencyDecay,
        ...(config.recencyDecay || {}),
      },
      masteryThresholds: {
        ...DEFAULT_MASTERY_CONFIG.masteryThresholds,
        ...(config.masteryThresholds || {}),
      },
    };
  }

  // =====================================================================
  // Mastery CRUD Operations
  // =====================================================================

  /**
   * Get user's mastery for a specific concept
   */
  static async getMastery(userId: string, conceptId: string): Promise<UserConceptMastery | null> {
    const { data, error } = await supabase
      .from('user_concept_mastery')
      .select('*, concept:concepts(*)')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .single();

    if (error) {
      // Return null if no mastery record exists (not an error)
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Error fetching mastery:', error);
      return null;
    }

    return data as UserConceptMastery;
  }

  /**
   * Get all mastery records for a user
   */
  static async getUserMasteries(
    userId: string,
    filters?: MasteryFilters
  ): Promise<UserConceptMastery[]> {
    let query = supabase
      .from('user_concept_mastery')
      .select('*, concept:concepts(*)')
      .eq('user_id', userId);

    if (filters?.mastery_level) {
      if (Array.isArray(filters.mastery_level)) {
        query = query.in('mastery_level', filters.mastery_level);
      } else {
        query = query.eq('mastery_level', filters.mastery_level);
      }
    }

    if (filters?.min_confidence !== undefined) {
      query = query.gte('confidence_score', filters.min_confidence);
    }

    if (filters?.has_recent_practice) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('last_practiced', thirtyDaysAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching masteries:', error);
      return [];
    }

    return (data || []) as UserConceptMastery[];
  }

  /**
   * Get mastered concepts for a user
   */
  static async getMasteredConcepts(userId: string): Promise<UserConceptMastery[]> {
    return this.getUserMasteries(userId, {
      mastery_level: ['advanced', 'mastered'],
    });
  }

  // =====================================================================
  // Evidence Management
  // =====================================================================

  /**
   * Add evidence for a concept and recalculate mastery
   */
  static async addEvidence(
    userId: string,
    conceptId: string,
    evidence: EvidencePoint
  ): Promise<UserConceptMastery | null> {
    // Get existing mastery or create new one
    let mastery = await this.getMastery(userId, conceptId);

    if (!mastery) {
      // Create initial mastery record
      const { data, error } = await supabase
        .from('user_concept_mastery')
        .insert({
          user_id: userId,
          concept_id: conceptId,
          mastery_level: 'none',
          evidence: [evidence],
          last_practiced: evidence.date,
          confidence_score: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating mastery:', error);
        return null;
      }

      mastery = data as UserConceptMastery;
    } else {
      // Append evidence to existing array
      const updatedEvidence = [...(mastery.evidence || []), evidence];

      const { data, error } = await supabase
        .from('user_concept_mastery')
        .update({
          evidence: updatedEvidence,
          last_practiced: evidence.date,
        })
        .eq('id', mastery.id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating evidence:', error);
        return null;
      }

      mastery = data as UserConceptMastery;
    }

    // Recalculate mastery
    return this.recalculateMastery(userId, conceptId);
  }

  /**
   * Recalculate mastery level from evidence
   */
  static async recalculateMastery(
    userId: string,
    conceptId: string
  ): Promise<UserConceptMastery | null> {
    const mastery = await this.getMastery(userId, conceptId);

    if (!mastery) {
      return null;
    }

    // Calculate mastery from evidence
    const calculated = this.calculateMasteryFromEvidence(mastery.evidence || []);

    // Update the mastery record
    const { data, error } = await supabase
      .from('user_concept_mastery')
      .update({
        mastery_level: calculated.mastery_level,
        confidence_score: calculated.confidence_score,
      })
      .eq('id', mastery.id)
      .select()
      .single();

    if (error) {
      logger.error('Error recalculating mastery:', error);
      return null;
    }

    return data as UserConceptMastery;
  }

  // =====================================================================
  // Mastery Calculation Algorithm
  // =====================================================================

  /**
   * Calculate mastery level from evidence points
   */
  static calculateMasteryFromEvidence(evidence: EvidencePoint[]): CalculatedMastery {
    if (evidence.length === 0) {
      return {
        concept_id: '',
        mastery_level: 'none',
        raw_score: 0,
        confidence_score: 0,
        evidence_count: 0,
        last_practiced: null,
      };
    }

    // Calculate weighted score with recency decay
    let totalScore = 0;
    let totalWeight = 0;
    const now = new Date();

    for (const point of evidence) {
      const pointDate = new Date(point.date);
      const monthsSince = this.monthsBetween(pointDate, now);

      // Get recency multiplier
      let recencyMultiplier = this.config.recencyDecay.recent;
      if (monthsSince >= 12) {
        recencyMultiplier = this.config.recencyDecay.old;
      } else if (monthsSince >= 6) {
        recencyMultiplier = this.config.recencyDecay.moderate;
      }

      // Get evidence weight
      const evidenceWeight = this.config.evidenceWeights[point.type] || 0;

      // Calculate point score
      const score = (point.score || 1.0) * evidenceWeight * recencyMultiplier;
      totalScore += score;
      totalWeight += evidenceWeight * recencyMultiplier;
    }

    // Normalize score to 0-1
    const rawScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Map score to mastery level
    const masteryLevel = this.scoreToMasteryLevel(rawScore);

    // Calculate confidence from evidence count
    const confidenceScore = this.calculateConfidence(evidence.length);

    // Get last practiced date
    const sortedEvidence = [...evidence].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastPracticed = sortedEvidence[0]?.date || null;

    return {
      concept_id: '',
      mastery_level: masteryLevel,
      raw_score: rawScore,
      confidence_score: confidenceScore,
      evidence_count: evidence.length,
      last_practiced: lastPracticed,
    };
  }

  /**
   * Map a raw score (0-1) to a mastery level
   */
  private static scoreToMasteryLevel(score: number): MasteryLevel {
    const thresholds = this.config.masteryThresholds;

    for (const [level, [min, max]] of Object.entries(thresholds)) {
      if (score >= min && score <= max) {
        return level as MasteryLevel;
      }
    }

    return 'none';
  }

  /**
   * Calculate confidence score from evidence count
   * 1 point = 0.3, 3 points = 0.7, 5+ points = 1.0
   */
  private static calculateConfidence(evidenceCount: number): number {
    if (evidenceCount === 0) return 0;
    if (evidenceCount === 1) return 0.3;
    if (evidenceCount === 2) return 0.5;
    if (evidenceCount === 3) return 0.7;
    if (evidenceCount === 4) return 0.85;
    return 1.0;
  }

  /**
   * Calculate months between two dates
   */
  private static monthsBetween(date1: Date, date2: Date): number {
    const months =
      (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
    return Math.max(0, months);
  }

  // =====================================================================
  // Progress Summary
  // =====================================================================

  /**
   * Get comprehensive progress summary for a user
   */
  static async getMasterySummary(userId: string): Promise<UserProgressSummary> {
    const masteries = await this.getUserMasteries(userId);

    // Count by mastery level
    const masteredCount = masteries.filter(
      m => m.mastery_level === 'mastered' || m.mastery_level === 'advanced'
    ).length;

    const inProgressCount = masteries.filter(
      m => m.mastery_level === 'beginner' || m.mastery_level === 'intermediate'
    ).length;

    // Count by concept type
    const masteryByType: Record<string, number> = {};
    masteries.forEach(m => {
      if (m.concept) {
        const type = m.concept.type;
        masteryByType[type] = (masteryByType[type] || 0) + 1;
      }
    });

    // Count by difficulty
    const masteryByDifficulty: Record<string, number> = {};
    masteries.forEach(m => {
      if (m.concept) {
        const difficulty = m.concept.difficulty_level;
        masteryByDifficulty[difficulty] = (masteryByDifficulty[difficulty] || 0) + 1;
      }
    });

    // Calculate learning velocity (concepts mastered per month)
    const oldestMastery = masteries.reduce((oldest, m) => {
      return new Date(m.created_at) < new Date(oldest.created_at) ? m : oldest;
    }, masteries[0]);

    let learningVelocity = 0;
    if (oldestMastery && masteredCount > 0) {
      const monthsSince = this.monthsBetween(new Date(oldestMastery.created_at), new Date());
      learningVelocity = monthsSince > 0 ? masteredCount / monthsSince : masteredCount;
    }

    // Find strongest/weakest areas
    const typeScores: Record<string, number[]> = {};
    masteries.forEach(m => {
      if (m.concept) {
        const type = m.concept.type;
        const levelScores = {
          none: 0,
          beginner: 0.25,
          intermediate: 0.5,
          advanced: 0.75,
          mastered: 1.0,
        };
        const score = levelScores[m.mastery_level] || 0;

        if (!typeScores[type]) {
          typeScores[type] = [];
        }
        typeScores[type].push(score);
      }
    });

    const typeAverages: Array<[string, number]> = Object.entries(typeScores).map(
      ([type, scores]) => {
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        return [type, avg];
      }
    );

    typeAverages.sort((a, b) => b[1] - a[1]);

    const strongestAreas = typeAverages.slice(0, 3).map(([type]) => type);
    const weakestAreas = typeAverages
      .slice(-3)
      .reverse()
      .map(([type]) => type);

    return {
      user_id: userId,
      total_concepts: masteries.length,
      mastered_concepts: masteredCount,
      in_progress_concepts: inProgressCount,
      mastery_by_type: masteryByType as any,
      mastery_by_difficulty: masteryByDifficulty as any,
      learning_velocity: learningVelocity,
      strongest_areas: strongestAreas,
      weakest_areas: weakestAreas,
    };
  }

  // =====================================================================
  // Bulk Operations
  // =====================================================================

  /**
   * Record course completion (adds evidence for all concepts in course)
   */
  static async recordCourseCompletion(
    userId: string,
    courseId: number,
    score: number
  ): Promise<void> {
    // Import KnowledgeGraphService to avoid circular dependency
    const { KnowledgeGraphService } = await import('./KnowledgeGraphService');

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

      await this.addEvidence(userId, cc.concept_id, {
        type: 'course_completion',
        course_id: courseId,
        score: weightedScore,
        date,
      });
    }
  }

  /**
   * Record assessment completion (adds evidence for concept)
   */
  static async recordAssessment(
    userId: string,
    conceptId: string,
    assessmentId: string,
    score: number
  ): Promise<UserConceptMastery | null> {
    return this.addEvidence(userId, conceptId, {
      type: 'assessment',
      assessment_id: assessmentId,
      score,
      date: new Date().toISOString(),
    });
  }

  /**
   * Record practice activity
   */
  static async recordPractice(
    userId: string,
    conceptId: string,
    exerciseId: string,
    attempts: number,
    success: boolean
  ): Promise<UserConceptMastery | null> {
    return this.addEvidence(userId, conceptId, {
      type: 'practice',
      exercise_id: exerciseId,
      attempts,
      success,
      score: success ? 1.0 : 0.5,
      date: new Date().toISOString(),
    });
  }

  /**
   * Record time spent learning a concept
   */
  static async recordTimeSpent(
    userId: string,
    conceptId: string,
    minutes: number
  ): Promise<UserConceptMastery | null> {
    // Convert time to a score (diminishing returns after 60 minutes)
    const score = Math.min(1.0, minutes / 60);

    return this.addEvidence(userId, conceptId, {
      type: 'time_spent',
      time_spent_minutes: minutes,
      score,
      date: new Date().toISOString(),
    });
  }
}
