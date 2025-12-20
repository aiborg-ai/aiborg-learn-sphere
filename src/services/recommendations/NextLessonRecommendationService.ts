/**
 * Next Lesson Recommendation Service
 * Provides real-time personalized "next lesson" recommendations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Recommendation context types
export type RecommendationContext =
  | 'dashboard'
  | 'lesson_complete'
  | 'session_start'
  | 'lingo_home';

// Content types that can be recommended
export type RecommendableContentType = 'lesson' | 'lingo_lesson' | 'course_module' | 'assessment';

// Recommendation factors and their weights
export interface RecommendationFactors {
  skillGaps: { weight: number; value: number; details?: string[] };
  recentPerformance: { weight: number; value: number; trend?: string };
  learningVelocity: { weight: number; value: number; rate?: number };
  timeSinceTopic: { weight: number; value: number; days?: number };
  streakBonus: { weight: number; value: number; currentStreak?: number };
}

// Single recommendation
export interface NextLessonRecommendation {
  id: string;
  contentId: string;
  contentType: RecommendableContentType;
  title: string;
  description: string;
  skill?: string;
  difficulty?: string;
  xpReward?: number;
  estimatedTime?: string;
  score: number;
  factors: RecommendationFactors;
  reason: string;
  context: RecommendationContext;
  expiresAt: string;
}

// User learning state for calculations
interface UserLearningState {
  userId: string;
  completedLessonIds: string[];
  recentScores: number[];
  averageScore: number;
  currentStreak: number;
  lastActivityDate: string | null;
  topicProgress: Record<string, { completed: number; total: number; avgScore: number }>;
  weakTopics: string[];
  strongTopics: string[];
}

// Default weights for recommendation factors
const DEFAULT_WEIGHTS = {
  skillGaps: 0.3,
  recentPerformance: 0.25,
  learningVelocity: 0.2,
  timeSinceTopic: 0.15,
  streakBonus: 0.1,
};

// Cache duration in milliseconds
const RECOMMENDATION_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Next Lesson Recommendation Service
 */
export class NextLessonRecommendationService {
  /**
   * Get personalized next lesson recommendation
   */
  static async getNextRecommendation(
    userId: string,
    context: RecommendationContext = 'dashboard'
  ): Promise<NextLessonRecommendation | null> {
    try {
      // Check for cached recommendation first
      const cached = await this.getCachedRecommendation(userId, context);
      if (cached) {
        return cached;
      }

      // Get user's learning state
      const state = await this.getUserLearningState(userId);

      // Get available lessons based on context
      const candidates = await this.getCandidateLessons(userId, context, state);

      if (candidates.length === 0) {
        return null;
      }

      // Score and rank candidates
      const scoredCandidates = this.scoreCandidates(candidates, state);

      // Get top recommendation
      const topCandidate = scoredCandidates[0];
      if (!topCandidate) {
        return null;
      }

      // Build recommendation
      const recommendation = this.buildRecommendation(topCandidate, context, state);

      // Cache it
      await this.cacheRecommendation(userId, recommendation);

      return recommendation;
    } catch (error) {
      logger.error('Error getting next lesson recommendation:', error);
      return null;
    }
  }

  /**
   * Get multiple recommendations
   */
  static async getRecommendations(
    userId: string,
    context: RecommendationContext = 'dashboard',
    limit: number = 3
  ): Promise<NextLessonRecommendation[]> {
    try {
      const state = await this.getUserLearningState(userId);
      const candidates = await this.getCandidateLessons(userId, context, state);
      const scoredCandidates = this.scoreCandidates(candidates, state);

      return scoredCandidates.slice(0, limit).map(c => this.buildRecommendation(c, context, state));
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Track when a recommendation is shown
   */
  static async trackShown(recommendationId: string): Promise<void> {
    try {
      await supabase
        .from('next_lesson_recommendations')
        .update({ shown_at: new Date().toISOString() })
        .eq('id', recommendationId);
    } catch (error) {
      logger.error('Error tracking recommendation shown:', error);
    }
  }

  /**
   * Track when a recommendation is clicked
   */
  static async trackClicked(recommendationId: string): Promise<void> {
    try {
      await supabase
        .from('next_lesson_recommendations')
        .update({ clicked_at: new Date().toISOString() })
        .eq('id', recommendationId);
    } catch (error) {
      logger.error('Error tracking recommendation clicked:', error);
    }
  }

  /**
   * Track when a recommendation is completed
   */
  static async trackCompleted(recommendationId: string): Promise<void> {
    try {
      await supabase
        .from('next_lesson_recommendations')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', recommendationId);
    } catch (error) {
      logger.error('Error tracking recommendation completed:', error);
    }
  }

  /**
   * Dismiss a recommendation
   */
  static async dismiss(recommendationId: string): Promise<void> {
    try {
      await supabase
        .from('next_lesson_recommendations')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', recommendationId);
    } catch (error) {
      logger.error('Error dismissing recommendation:', error);
    }
  }

  /**
   * Get Lingo-specific next lesson recommendation
   */
  static async getNextLingoLesson(userId: string): Promise<NextLessonRecommendation | null> {
    try {
      // Get user's Lingo progress
      const { data: progress } = await supabase
        .from('lingo_user_progress')
        .select('lesson_progress, total_xp, streak')
        .eq('user_id', userId)
        .single();

      const completedLessonIds = progress?.lesson_progress
        ? Object.entries(progress.lesson_progress as Record<string, { completed?: boolean }>)
            .filter(([_, p]) => p.completed)
            .map(([id]) => id)
        : [];

      // Get all Lingo lessons
      const { data: lessons } = await supabase
        .from('lingo_lessons')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!lessons || lessons.length === 0) {
        return null;
      }

      // Find incomplete lessons
      const incompleteLessons = lessons.filter(lesson => !completedLessonIds.includes(lesson.id));

      if (incompleteLessons.length === 0) {
        // All done! Suggest review
        return this.buildLingoReviewRecommendation(lessons[0], progress?.streak || 0);
      }

      // Score lessons by skill priority and difficulty
      const scoredLessons = incompleteLessons.map(lesson => {
        let score = 0;

        // Prefer lessons in order
        const orderIndex = lessons.indexOf(lesson);
        score += (1 - orderIndex / lessons.length) * 0.3;

        // Prefer lessons matching weak skills
        // (In a real implementation, we'd analyze past performance by skill)
        score += 0.3;

        // Bonus for lower difficulty if user is struggling
        const difficultyBonus =
          lesson.difficulty === 'beginner' ? 0.2 : lesson.difficulty === 'intermediate' ? 0.1 : 0;
        score += difficultyBonus;

        // Streak bonus
        score += Math.min((progress?.streak || 0) * 0.02, 0.2);

        return { lesson, score };
      });

      // Sort by score
      scoredLessons.sort((a, b) => b.score - a.score);

      const topLesson = scoredLessons[0].lesson;

      return {
        id: `lingo_rec_${topLesson.id}_${Date.now()}`,
        contentId: topLesson.id,
        contentType: 'lingo_lesson',
        title: topLesson.title,
        description: topLesson.description || '',
        skill: topLesson.skill,
        difficulty: topLesson.difficulty,
        xpReward: topLesson.xp_reward,
        estimatedTime: topLesson.duration,
        score: scoredLessons[0].score,
        factors: {
          skillGaps: { weight: 0.3, value: 0.8, details: [topLesson.skill] },
          recentPerformance: { weight: 0.25, value: 0.7 },
          learningVelocity: { weight: 0.2, value: 0.6 },
          timeSinceTopic: { weight: 0.15, value: 0.5 },
          streakBonus: {
            weight: 0.1,
            value: progress?.streak ? 0.9 : 0.3,
            currentStreak: progress?.streak,
          },
        },
        reason: `Continue your ${topLesson.skill} journey with this ${topLesson.difficulty} lesson`,
        context: 'lingo_home',
        expiresAt: new Date(Date.now() + RECOMMENDATION_CACHE_TTL).toISOString(),
      };
    } catch (error) {
      logger.error('Error getting next Lingo lesson:', error);
      return null;
    }
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Get user's learning state
   */
  private static async getUserLearningState(userId: string): Promise<UserLearningState> {
    try {
      // Get completed lessons from enrollments/progress
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, progress_percentage')
        .eq('user_id', userId);

      // Get Lingo progress
      const { data: lingoProgress } = await supabase
        .from('lingo_user_progress')
        .select('lesson_progress, streak, total_xp, last_session_date')
        .eq('user_id', userId)
        .single();

      // Get recent assessment scores
      const { data: recentScores } = await supabase
        .from('user_ai_assessments')
        .select('final_score')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const scores = recentScores?.map(s => s.final_score).filter(Boolean) || [];
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 70; // Default assumption

      const completedLessonIds: string[] = [];
      if (lingoProgress?.lesson_progress) {
        const lp = lingoProgress.lesson_progress as Record<string, { completed?: boolean }>;
        Object.entries(lp).forEach(([id, p]) => {
          if (p.completed) completedLessonIds.push(id);
        });
      }

      return {
        userId,
        completedLessonIds,
        recentScores: scores,
        averageScore: avgScore,
        currentStreak: lingoProgress?.streak || 0,
        lastActivityDate: lingoProgress?.last_session_date || null,
        topicProgress: {},
        weakTopics: avgScore < 70 ? ['general'] : [],
        strongTopics: avgScore >= 85 ? ['general'] : [],
      };
    } catch (error) {
      logger.error('Error getting user learning state:', error);
      return {
        userId,
        completedLessonIds: [],
        recentScores: [],
        averageScore: 70,
        currentStreak: 0,
        lastActivityDate: null,
        topicProgress: {},
        weakTopics: [],
        strongTopics: [],
      };
    }
  }

  /**
   * Get candidate lessons for recommendation
   */
  private static async getCandidateLessons(
    userId: string,
    context: RecommendationContext,
    state: UserLearningState
  ): Promise<
    Array<{
      id: string;
      type: RecommendableContentType;
      title: string;
      description: string;
      skill?: string;
      difficulty?: string;
      xpReward?: number;
      duration?: string;
      sortOrder?: number;
    }>
  > {
    const candidates: Array<{
      id: string;
      type: RecommendableContentType;
      title: string;
      description: string;
      skill?: string;
      difficulty?: string;
      xpReward?: number;
      duration?: string;
      sortOrder?: number;
    }> = [];

    try {
      // Get Lingo lessons
      if (context === 'lingo_home' || context === 'dashboard' || context === 'lesson_complete') {
        const { data: lingoLessons } = await supabase
          .from('lingo_lessons')
          .select('id, title, description, skill, difficulty, xp_reward, duration, sort_order')
          .eq('is_active', true)
          .not('id', 'in', `(${state.completedLessonIds.join(',') || 'null'})`)
          .order('sort_order', { ascending: true })
          .limit(20);

        if (lingoLessons) {
          candidates.push(
            ...lingoLessons.map(l => ({
              id: l.id,
              type: 'lingo_lesson' as const,
              title: l.title,
              description: l.description || '',
              skill: l.skill,
              difficulty: l.difficulty,
              xpReward: l.xp_reward,
              duration: l.duration,
              sortOrder: l.sort_order,
            }))
          );
        }
      }

      // Get course modules (for enrolled courses)
      if (context === 'dashboard' || context === 'session_start') {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id, courses(title)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .lt('progress_percentage', 100)
          .limit(5);

        // Would add course modules here in a full implementation
      }

      return candidates;
    } catch (error) {
      logger.error('Error getting candidate lessons:', error);
      return [];
    }
  }

  /**
   * Score candidates based on factors
   */
  private static scoreCandidates(
    candidates: Array<{
      id: string;
      type: RecommendableContentType;
      title: string;
      description: string;
      skill?: string;
      difficulty?: string;
      xpReward?: number;
      duration?: string;
      sortOrder?: number;
    }>,
    state: UserLearningState
  ): Array<{
    id: string;
    type: RecommendableContentType;
    title: string;
    description: string;
    skill?: string;
    difficulty?: string;
    xpReward?: number;
    duration?: string;
    score: number;
    factors: RecommendationFactors;
  }> {
    return candidates
      .map(candidate => {
        // Calculate factor values
        const skillGapValue = state.weakTopics.includes(candidate.skill || '')
          ? 1.0
          : state.strongTopics.includes(candidate.skill || '')
            ? 0.3
            : 0.6;

        const performanceValue = state.averageScore / 100;

        const velocityValue =
          state.recentScores.length >= 3
            ? state.recentScores.slice(-3).reduce((a, b) => a + b, 0) / 3 / 100
            : 0.5;

        // Days since last activity
        const daysSinceActivity = state.lastActivityDate
          ? Math.floor(
              (Date.now() - new Date(state.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
            )
          : 7;
        const timeSinceValue = Math.min(daysSinceActivity / 7, 1); // Normalize to 0-1

        // Streak bonus
        const streakValue = Math.min(state.currentStreak / 30, 1); // Max bonus at 30 days

        // Build factors
        const factors: RecommendationFactors = {
          skillGaps: {
            weight: DEFAULT_WEIGHTS.skillGaps,
            value: skillGapValue,
            details: state.weakTopics,
          },
          recentPerformance: {
            weight: DEFAULT_WEIGHTS.recentPerformance,
            value: performanceValue,
            trend: performanceValue > 0.7 ? 'improving' : 'needs_attention',
          },
          learningVelocity: {
            weight: DEFAULT_WEIGHTS.learningVelocity,
            value: velocityValue,
            rate: velocityValue,
          },
          timeSinceTopic: {
            weight: DEFAULT_WEIGHTS.timeSinceTopic,
            value: 1 - timeSinceValue,
            days: daysSinceActivity,
          },
          streakBonus: {
            weight: DEFAULT_WEIGHTS.streakBonus,
            value: streakValue,
            currentStreak: state.currentStreak,
          },
        };

        // Calculate weighted score
        const score =
          factors.skillGaps.weight * factors.skillGaps.value +
          factors.recentPerformance.weight * factors.recentPerformance.value +
          factors.learningVelocity.weight * factors.learningVelocity.value +
          factors.timeSinceTopic.weight * factors.timeSinceTopic.value +
          factors.streakBonus.weight * factors.streakBonus.value;

        // Add order bonus for Lingo lessons (prefer sequential order)
        const orderBonus =
          candidate.sortOrder !== undefined ? (1 - candidate.sortOrder / 100) * 0.1 : 0;

        return {
          ...candidate,
          score: score + orderBonus,
          factors,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Build recommendation from scored candidate
   */
  private static buildRecommendation(
    candidate: {
      id: string;
      type: RecommendableContentType;
      title: string;
      description: string;
      skill?: string;
      difficulty?: string;
      xpReward?: number;
      duration?: string;
      score: number;
      factors: RecommendationFactors;
    },
    context: RecommendationContext,
    state: UserLearningState
  ): NextLessonRecommendation {
    // Generate reason based on factors
    let reason = '';
    const topFactor = this.getTopFactor(candidate.factors);

    switch (topFactor) {
      case 'skillGaps':
        reason = `Strengthen your ${candidate.skill || 'skills'} with this lesson`;
        break;
      case 'recentPerformance':
        reason =
          state.averageScore > 70
            ? `You're doing great! Keep up the momentum`
            : `Build your confidence with this lesson`;
        break;
      case 'learningVelocity':
        reason = `Continue your learning streak`;
        break;
      case 'timeSinceTopic':
        reason = `Get back on track with a quick lesson`;
        break;
      case 'streakBonus':
        reason = `Maintain your ${state.currentStreak}-day streak!`;
        break;
      default:
        reason = `Recommended for you`;
    }

    return {
      id: `rec_${candidate.id}_${Date.now()}`,
      contentId: candidate.id,
      contentType: candidate.type,
      title: candidate.title,
      description: candidate.description,
      skill: candidate.skill,
      difficulty: candidate.difficulty,
      xpReward: candidate.xpReward,
      estimatedTime: candidate.duration,
      score: candidate.score,
      factors: candidate.factors,
      reason,
      context,
      expiresAt: new Date(Date.now() + RECOMMENDATION_CACHE_TTL).toISOString(),
    };
  }

  /**
   * Get the top contributing factor
   */
  private static getTopFactor(factors: RecommendationFactors): keyof RecommendationFactors {
    let topFactor: keyof RecommendationFactors = 'skillGaps';
    let topValue = 0;

    (Object.keys(factors) as Array<keyof RecommendationFactors>).forEach(key => {
      const contribution = factors[key].weight * factors[key].value;
      if (contribution > topValue) {
        topValue = contribution;
        topFactor = key;
      }
    });

    return topFactor;
  }

  /**
   * Build review recommendation for completed learners
   */
  private static buildLingoReviewRecommendation(
    lesson: { id: string; title: string; skill: string; xp_reward: number },
    streak: number
  ): NextLessonRecommendation {
    return {
      id: `review_${lesson.id}_${Date.now()}`,
      contentId: lesson.id,
      contentType: 'lingo_lesson',
      title: `Review: ${lesson.title}`,
      description: "You've completed all lessons! Practice to maintain mastery.",
      skill: lesson.skill,
      xpReward: Math.round(lesson.xp_reward * 0.5), // Half XP for review
      score: 0.8,
      factors: {
        skillGaps: { weight: 0.3, value: 0.5 },
        recentPerformance: { weight: 0.25, value: 0.9 },
        learningVelocity: { weight: 0.2, value: 0.8 },
        timeSinceTopic: { weight: 0.15, value: 0.7 },
        streakBonus: { weight: 0.1, value: 1.0, currentStreak: streak },
      },
      reason: 'Reinforce your knowledge with practice',
      context: 'lingo_home',
      expiresAt: new Date(Date.now() + RECOMMENDATION_CACHE_TTL).toISOString(),
    };
  }

  /**
   * Get cached recommendation
   */
  private static async getCachedRecommendation(
    userId: string,
    context: RecommendationContext
  ): Promise<NextLessonRecommendation | null> {
    try {
      const { data, error } = await supabase
        .from('next_lesson_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('context', context)
        .is('dismissed_at', null)
        .is('completed_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        contentId: data.recommended_content_id,
        contentType: data.content_type as RecommendableContentType,
        title: ((data.factors as Record<string, unknown>)?.title as string) || 'Recommended Lesson',
        description: '',
        score: data.recommendation_score,
        factors: data.factors as unknown as RecommendationFactors,
        reason: 'Personalized for you',
        context: data.context as RecommendationContext,
        expiresAt: data.expires_at,
      };
    } catch {
      return null;
    }
  }

  /**
   * Cache recommendation
   */
  private static async cacheRecommendation(
    userId: string,
    recommendation: NextLessonRecommendation
  ): Promise<void> {
    try {
      await supabase.from('next_lesson_recommendations').insert({
        user_id: userId,
        recommended_content_id: recommendation.contentId,
        content_type: recommendation.contentType,
        recommendation_score: recommendation.score,
        factors: { ...recommendation.factors, title: recommendation.title },
        context: recommendation.context,
        expires_at: recommendation.expiresAt,
      });
    } catch (error) {
      logger.error('Error caching recommendation:', error);
    }
  }
}
