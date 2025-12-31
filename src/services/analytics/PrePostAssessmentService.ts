/**
 * Pre/Post Assessment Service
 * Tracks and analyzes improvement between pre and post assessments
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Assessment pair types
export type PairType = 'course' | 'skill' | 'module' | 'custom';

// Mastery levels
export type MasteryLevel =
  | 'novice'
  | 'beginner'
  | 'intermediate'
  | 'proficient'
  | 'advanced'
  | 'expert'
  | 'master';

// Assessment pair
export interface AssessmentPair {
  id: string;
  userId: string;
  courseId?: string;
  skillId?: string;
  preAssessmentId: string;
  postAssessmentId?: string;
  pairType: PairType;
  createdAt: Date;
  completedAt?: Date;
}

// Category improvement data
export interface CategoryImprovement {
  categoryId: string;
  categoryName: string;
  preScore: number;
  postScore: number;
  change: number;
  percentageChange: number;
  effectSize: number;
}

// Improvement metrics
export interface ImprovementMetrics {
  id: string;
  pairId: string;
  userId: string;
  preScore: number;
  postScore: number;
  scoreChange: number;
  percentageImprovement: number;
  effectSize: number | null;
  normalizedGain: number | null;
  isSignificant: boolean;
  confidenceLevel: number;
  pValue: number | null;
  daysBetween: number;
  studyHoursBetween: number;
  categoryImprovements: CategoryImprovement[];
  calculatedAt: Date;
}

// Pre/Post comparison result
export interface PrePostComparison {
  pair: AssessmentPair;
  metrics: ImprovementMetrics;
  preAssessment: AssessmentSummary;
  postAssessment: AssessmentSummary;
  interpretation: string;
  recommendations: string[];
}

// Assessment summary
export interface AssessmentSummary {
  id: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: Date;
  categoryScores: Record<string, number>;
}

// Mastery progression
export interface MasteryProgression {
  skillId: string;
  skillName: string;
  currentLevel: MasteryLevel;
  currentScore: number;
  levelProgress: number;
  timeAtCurrentLevelDays: number;
  totalPracticeHours: number;
  avgImprovementPerWeek: number;
  projectedNextLevelDays: number | null;
  levelHistory: Array<{
    level: MasteryLevel;
    achievedAt: Date;
    score: number;
  }>;
}

// Cohort comparison
export interface CohortComparison {
  userId: string;
  userImprovement: number;
  cohortAverageImprovement: number;
  cohortMedianImprovement: number;
  percentileRank: number;
  aboveAverage: boolean;
}

/**
 * Pre/Post Assessment Service
 */
export class PrePostAssessmentService {
  /**
   * Create a new assessment pair (when user starts a pre-assessment)
   */
  static async createPair(
    userId: string,
    preAssessmentId: string,
    options: {
      courseId?: string;
      skillId?: string;
      pairType?: PairType;
    } = {}
  ): Promise<AssessmentPair | null> {
    try {
      const { data, error } = await supabase
        .from('assessment_pairs')
        .insert({
          user_id: userId,
          pre_assessment_id: preAssessmentId,
          course_id: options.courseId,
          skill_id: options.skillId,
          pair_type: options.pairType || 'custom',
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapPair(data);
    } catch (_error) {
      logger._error('Error creating assessment pair:', _error);
      return null;
    }
  }

  /**
   * Complete a pair by linking post-assessment
   */
  static async completePair(
    preAssessmentId: string,
    postAssessmentId: string
  ): Promise<AssessmentPair | null> {
    try {
      const { data, error } = await supabase
        .from('assessment_pairs')
        .update({
          post_assessment_id: postAssessmentId,
          completed_at: new Date().toISOString(),
        })
        .eq('pre_assessment_id', preAssessmentId)
        .select()
        .single();

      if (error) throw error;

      // Calculate improvement metrics
      const pair = this.mapPair(data);
      await this.calculateImprovementMetrics(pair);

      return pair;
    } catch (_error) {
      logger._error('Error completing assessment pair:', _error);
      return null;
    }
  }

  /**
   * Get improvement metrics for a pair
   */
  static async getImprovementMetrics(pairId: string): Promise<ImprovementMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('learning_improvement_metrics')
        .select('*')
        .eq('pair_id', pairId)
        .single();

      if (error) throw error;

      return this.mapMetrics(data);
    } catch (_error) {
      logger._error('Error getting improvement metrics:', _error);
      return null;
    }
  }

  /**
   * Get full pre/post comparison
   */
  static async getComparison(pairId: string): Promise<PrePostComparison | null> {
    try {
      // Get pair
      const { data: pairData, error: pairError } = await supabase
        .from('assessment_pairs')
        .select('*')
        .eq('id', pairId)
        .single();

      if (pairError || !pairData) return null;

      const pair = this.mapPair(pairData);

      if (!pair.postAssessmentId) {
        return null; // Pair not complete
      }

      // Get metrics
      const metrics = await this.getImprovementMetrics(pairId);
      if (!metrics) return null;

      // Get assessment details
      const [preAssessment, postAssessment] = await Promise.all([
        this.getAssessmentSummary(pair.preAssessmentId),
        this.getAssessmentSummary(pair.postAssessmentId),
      ]);

      if (!preAssessment || !postAssessment) return null;

      // Generate interpretation
      const interpretation = this.generateInterpretation(metrics);
      const recommendations = this.generateRecommendations(metrics);

      return {
        pair,
        metrics,
        preAssessment,
        postAssessment,
        interpretation,
        recommendations,
      };
    } catch (_error) {
      logger._error('Error getting comparison:', _error);
      return null;
    }
  }

  /**
   * Get user's improvement history
   */
  static async getUserImprovementHistory(
    userId: string,
    limit: number = 10
  ): Promise<ImprovementMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('learning_improvement_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('calculated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapMetrics);
    } catch (_error) {
      logger._error('Error getting improvement history:', _error);
      return [];
    }
  }

  /**
   * Get user's mastery progression
   */
  static async getMasteryProgression(userId: string): Promise<MasteryProgression[]> {
    try {
      const { data, error } = await supabase
        .from('mastery_progression')
        .select('*')
        .eq('user_id', userId)
        .order('current_score', { ascending: false });

      if (error) throw error;

      return (data || []).map(d => ({
        skillId: d.skill_id,
        skillName: d.skill_name || d.skill_id,
        currentLevel: d.current_level as MasteryLevel,
        currentScore: d.current_score,
        levelProgress: d.level_progress,
        timeAtCurrentLevelDays: d.time_at_current_level_days,
        totalPracticeHours: d.total_practice_hours,
        avgImprovementPerWeek: d.avg_improvement_per_week,
        projectedNextLevelDays: d.projected_next_level_days,
        levelHistory: (
          (d.level_history as Array<{
            level: MasteryLevel;
            achieved_at: string;
            score: number;
          }>) || []
        ).map(h => ({
          level: h.level,
          achievedAt: new Date(h.achieved_at),
          score: h.score,
        })),
      }));
    } catch (_error) {
      logger._error('Error getting mastery progression:', _error);
      return [];
    }
  }

  /**
   * Update mastery progression after assessment
   */
  static async updateMasteryProgression(
    userId: string,
    skillId: string,
    newScore: number,
    practiceHours: number = 0
  ): Promise<void> {
    try {
      // Get current progression
      const { data: current } = await supabase
        .from('mastery_progression')
        .select('*')
        .eq('user_id', userId)
        .eq('skill_id', skillId)
        .single();

      // Get mastery level for new score
      const { data: levelConfig } = await supabase
        .from('mastery_level_config')
        .select('*')
        .lte('min_score', newScore)
        .gte('max_score', newScore)
        .single();

      const newLevel = levelConfig?.level_name || 'novice';

      if (current) {
        // Update existing
        const levelHistory = current.level_history || [];
        if (current.current_level !== newLevel) {
          levelHistory.push({
            level: newLevel,
            achieved_at: new Date().toISOString(),
            score: newScore,
          });
        }

        await supabase
          .from('mastery_progression')
          .update({
            current_level: newLevel,
            current_score: newScore,
            level_progress: this.calculateLevelProgress(newScore, levelConfig),
            level_history: levelHistory,
            total_practice_hours: (current.total_practice_hours || 0) + practiceHours,
            last_assessment_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('skill_id', skillId);
      } else {
        // Create new
        await supabase.from('mastery_progression').insert({
          user_id: userId,
          skill_id: skillId,
          current_level: newLevel,
          current_score: newScore,
          level_progress: this.calculateLevelProgress(newScore, levelConfig),
          level_history: [
            {
              level: newLevel,
              achieved_at: new Date().toISOString(),
              score: newScore,
            },
          ],
          total_practice_hours: practiceHours,
          first_assessment_at: new Date().toISOString(),
          last_assessment_at: new Date().toISOString(),
        });
      }
    } catch (_error) {
      logger._error('Error updating mastery progression:', _error);
    }
  }

  /**
   * Get cohort comparison for a user
   */
  static async getCohortComparison(
    userId: string,
    courseId?: string
  ): Promise<CohortComparison | null> {
    try {
      // Get user's average improvement
      const { data: userMetrics } = await supabase
        .from('learning_improvement_metrics')
        .select('percentage_improvement')
        .eq('user_id', userId);

      if (!userMetrics || userMetrics.length === 0) return null;

      const userImprovement =
        userMetrics.reduce((sum, m) => sum + m.percentage_improvement, 0) / userMetrics.length;

      // Get cohort metrics
      let cohortQuery = supabase
        .from('learning_improvement_metrics')
        .select('percentage_improvement');

      if (courseId) {
        // Filter by course through assessment_pairs
        cohortQuery = cohortQuery.in(
          'pair_id',
          supabase.from('assessment_pairs').select('id').eq('course_id', courseId)
        );
      }

      const { data: cohortMetrics } = await cohortQuery;

      if (!cohortMetrics || cohortMetrics.length === 0) return null;

      const improvements = cohortMetrics.map(m => m.percentage_improvement);
      improvements.sort((a, b) => a - b);

      const cohortAvg = improvements.reduce((sum, i) => sum + i, 0) / improvements.length;
      const cohortMedian = improvements[Math.floor(improvements.length / 2)];

      // Calculate percentile
      const belowUser = improvements.filter(i => i < userImprovement).length;
      const percentileRank = (belowUser / improvements.length) * 100;

      return {
        userId,
        userImprovement,
        cohortAverageImprovement: cohortAvg,
        cohortMedianImprovement: cohortMedian,
        percentileRank,
        aboveAverage: userImprovement > cohortAvg,
      };
    } catch (_error) {
      logger._error('Error getting cohort comparison:', _error);
      return null;
    }
  }

  /**
   * Get learning outcomes summary for a period
   */
  static async getLearningOutcomesSummary(
    userId: string,
    periodType: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<{
    assessmentsCompleted: number;
    avgScore: number;
    scoreImprovement: number;
    skillsImproved: number;
    skillsMastered: number;
    percentileRank: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('learning_outcomes_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('period_type', periodType)
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;

      return {
        assessmentsCompleted: data.assessments_completed,
        avgScore: data.avg_score,
        scoreImprovement: data.score_improvement,
        skillsImproved: data.skills_improved,
        skillsMastered: data.skills_mastered,
        percentileRank: data.percentile_rank,
      };
    } catch (_error) {
      logger._error('Error getting learning outcomes summary:', _error);
      return null;
    }
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  /**
   * Calculate improvement metrics for a completed pair
   */
  private static async calculateImprovementMetrics(pair: AssessmentPair): Promise<void> {
    try {
      if (!pair.postAssessmentId) return;

      // Get assessment scores
      const [preSummary, postSummary] = await Promise.all([
        this.getAssessmentSummary(pair.preAssessmentId),
        this.getAssessmentSummary(pair.postAssessmentId),
      ]);

      if (!preSummary || !postSummary) return;

      const preScore = preSummary.percentage;
      const postScore = postSummary.percentage;
      const scoreChange = postScore - preScore;
      const percentageImprovement = preScore > 0 ? (scoreChange / preScore) * 100 : 0;

      // Calculate effect size (Cohen's d approximation)
      // Using standard deviation of 15 as typical for assessments
      const pooledStd = 15;
      const effectSize = scoreChange / pooledStd;

      // Calculate normalized gain (Hake's g)
      const possibleGain = 100 - preScore;
      const normalizedGain = possibleGain > 0 ? scoreChange / possibleGain : null;

      // Calculate days between
      const daysBetween =
        (postSummary.completedAt.getTime() - preSummary.completedAt.getTime()) /
        (1000 * 60 * 60 * 24);

      // Determine significance (simplified)
      const isSignificant = Math.abs(effectSize) >= 0.2 && scoreChange > 0;

      // Calculate category improvements
      const categoryImprovements: CategoryImprovement[] = [];
      for (const [categoryId, preScoreVal] of Object.entries(preSummary.categoryScores)) {
        const postScoreVal = postSummary.categoryScores[categoryId] || 0;
        const change = postScoreVal - preScoreVal;
        categoryImprovements.push({
          categoryId,
          categoryName: categoryId, // Would need to look up name
          preScore: preScoreVal,
          postScore: postScoreVal,
          change,
          percentageChange: preScoreVal > 0 ? (change / preScoreVal) * 100 : 0,
          effectSize: change / pooledStd,
        });
      }

      // Save metrics
      await supabase.from('learning_improvement_metrics').insert({
        pair_id: pair.id,
        user_id: pair.userId,
        pre_score: preScore,
        post_score: postScore,
        score_change: scoreChange,
        percentage_improvement: percentageImprovement,
        effect_size: effectSize,
        normalized_gain: normalizedGain,
        is_significant: isSignificant,
        confidence_level: 0.95,
        days_between: daysBetween,
        study_hours_between: 0, // Would need to calculate from learning sessions
        category_improvements: categoryImprovements,
      });
    } catch (_error) {
      logger._error('Error calculating improvement metrics:', _error);
    }
  }

  /**
   * Get assessment summary
   */
  private static async getAssessmentSummary(
    assessmentId: string
  ): Promise<AssessmentSummary | null> {
    try {
      const { data, error } = await supabase
        .from('user_ai_assessments')
        .select(
          `
          id,
          total_score,
          max_possible_score,
          completed_at,
          assessment_insights (
            category_id,
            category_score
          )
        `
        )
        .eq('id', assessmentId)
        .single();

      if (error || !data) return null;

      const categoryScores: Record<string, number> = {};
      const insights = data.assessment_insights as Array<{
        category_id: string;
        category_score: number;
      }> | null;

      if (insights) {
        for (const insight of insights) {
          categoryScores[insight.category_id] = insight.category_score;
        }
      }

      return {
        id: data.id,
        score: data.total_score || 0,
        maxScore: data.max_possible_score || 100,
        percentage: data.max_possible_score
          ? ((data.total_score || 0) / data.max_possible_score) * 100
          : 0,
        completedAt: new Date(data.completed_at),
        categoryScores,
      };
    } catch (_error) {
      logger._error('Error getting assessment summary:', _error);
      return null;
    }
  }

  /**
   * Calculate progress within current mastery level
   */
  private static calculateLevelProgress(
    score: number,
    levelConfig: { min_score: number; max_score: number } | null
  ): number {
    if (!levelConfig) return 0;
    const range = levelConfig.max_score - levelConfig.min_score;
    if (range <= 0) return 100;
    return ((score - levelConfig.min_score) / range) * 100;
  }

  /**
   * Generate interpretation of improvement metrics
   */
  private static generateInterpretation(metrics: ImprovementMetrics): string {
    const { effectSize, percentageImprovement, isSignificant } = metrics;

    if (!isSignificant || percentageImprovement <= 0) {
      return 'No significant improvement detected between assessments.';
    }

    if (effectSize && effectSize >= 0.8) {
      return `Excellent improvement! Your score increased by ${percentageImprovement.toFixed(1)}%, showing a large effect size (d=${effectSize.toFixed(2)}). This represents substantial learning gains.`;
    }

    if (effectSize && effectSize >= 0.5) {
      return `Good improvement! Your score increased by ${percentageImprovement.toFixed(1)}%, showing a medium effect size (d=${effectSize.toFixed(2)}). You're making solid progress.`;
    }

    if (effectSize && effectSize >= 0.2) {
      return `Moderate improvement. Your score increased by ${percentageImprovement.toFixed(1)}%, showing a small effect size (d=${effectSize.toFixed(2)}). Keep practicing to see larger gains.`;
    }

    return `Your score changed by ${percentageImprovement.toFixed(1)}%. Continue your learning journey for better results.`;
  }

  /**
   * Generate recommendations based on metrics
   */
  private static generateRecommendations(metrics: ImprovementMetrics): string[] {
    const recommendations: string[] = [];

    // Based on improvement level
    if (metrics.percentageImprovement < 10) {
      recommendations.push('Consider spending more time on practice exercises between assessments');
      recommendations.push('Review areas where you scored lowest in the pre-assessment');
    }

    // Based on category improvements
    const weakCategories = metrics.categoryImprovements
      .filter(c => c.change < 0 || c.postScore < 60)
      .slice(0, 2);

    for (const cat of weakCategories) {
      recommendations.push(
        `Focus on improving ${cat.categoryName} (currently at ${cat.postScore.toFixed(0)}%)`
      );
    }

    // Based on time between assessments
    if (metrics.daysBetween < 3) {
      recommendations.push(
        'Allow more time between pre and post assessments for learning to consolidate'
      );
    }

    // Add general recommendations if needed
    if (recommendations.length === 0) {
      recommendations.push('Keep up the great work!');
      recommendations.push('Challenge yourself with more advanced topics');
    }

    return recommendations.slice(0, 4);
  }

  /**
   * Map database pair to interface
   */
  private static mapPair(data: Record<string, unknown>): AssessmentPair {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      courseId: data.course_id as string | undefined,
      skillId: data.skill_id as string | undefined,
      preAssessmentId: data.pre_assessment_id as string,
      postAssessmentId: data.post_assessment_id as string | undefined,
      pairType: data.pair_type as PairType,
      createdAt: new Date(data.created_at as string),
      completedAt: data.completed_at ? new Date(data.completed_at as string) : undefined,
    };
  }

  /**
   * Map database metrics to interface
   */
  private static mapMetrics(data: Record<string, unknown>): ImprovementMetrics {
    return {
      id: data.id as string,
      pairId: data.pair_id as string,
      userId: data.user_id as string,
      preScore: data.pre_score as number,
      postScore: data.post_score as number,
      scoreChange: data.score_change as number,
      percentageImprovement: data.percentage_improvement as number,
      effectSize: data.effect_size as number | null,
      normalizedGain: data.normalized_gain as number | null,
      isSignificant: data.is_significant as boolean,
      confidenceLevel: data.confidence_level as number,
      pValue: data.p_value as number | null,
      daysBetween: data.days_between as number,
      studyHoursBetween: data.study_hours_between as number,
      categoryImprovements: (data.category_improvements as CategoryImprovement[]) || [],
      calculatedAt: new Date(data.calculated_at as string),
    };
  }
}
