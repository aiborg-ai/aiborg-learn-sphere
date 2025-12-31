/**
 * Recommendation Engine Service
 * AI-powered personalized recommendations using vector embeddings and collaborative filtering
 */

import { supabase } from '@/integrations/supabase/client';
import { EmbeddingService } from './EmbeddingService';
import { logger } from '@/utils/logger';

export interface RecommendationOptions {
  limit?: number;
  minConfidence?: number;
  excludeEnrolled?: boolean;
  excludeDismissed?: boolean;
  context?: string;
}

export interface Recommendation {
  id: string;
  contentId: string;
  contentType: 'course' | 'learning_path' | 'blog_post' | 'assessment';
  title: string;
  description: string;
  confidenceScore: number;
  rank: number;
  reason: RecommendationReason;
  metadata?: Record<string, unknown>;
}

export interface RecommendationReason {
  primary: string;
  factors: {
    vectorSimilarity?: number;
    skillMatch?: number;
    difficultyMatch?: number;
    popularityScore?: number;
  };
  explanation: string;
}

export interface UserLearningProfile {
  userId: string;
  completedCourses: string[];
  enrolledCourses: string[];
  averageScore: number;
  skillGaps: string[];
  preferredDifficulty?: string;
  learningGoals?: string[];
  interestedTopics?: string[];
}

/**
 * Recommendation Engine Service
 * Combines vector similarity, collaborative filtering, and content-based filtering
 */
export class RecommendationEngineService {
  /**
   * Get personalized course recommendations for a user
   */
  static async getCourseRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<Recommendation[]> {
    const {
      limit = 10,
      minConfidence = 0.5,
      excludeEnrolled = true,
      excludeDismissed = true,
      context = 'dashboard',
    } = options;

    try {
      // 1. Get user learning profile
      const profile = await this.getUserLearningProfile(userId);

      // 2. Get user's preferences
      const { data: preferences } = await supabase
        .from('user_preferences_ai')
        .select('*')
        .eq('user_id', userId)
        .single();

      // 3. Generate query embedding from user profile
      const queryText = this.buildUserQueryText(profile, preferences);
      const { embedding } = await EmbeddingService.generateEmbedding(queryText);

      // 4. Find similar courses using vector search
      const similarCourses = await EmbeddingService.findSimilarContent(
        embedding,
        'course',
        limit * 3, // Get more candidates for filtering
        0.3 // Lower threshold for initial search
      );

      // 5. Filter out enrolled/dismissed courses
      let filteredCourses = similarCourses;

      if (excludeEnrolled) {
        const enrolledIds = new Set(profile.enrolledCourses);
        filteredCourses = filteredCourses.filter(course => !enrolledIds.has(course.content_id));
      }

      if (excludeDismissed) {
        const { data: dismissed } = await supabase
          .from('recommendation_history')
          .select('content_id')
          .eq('user_id', userId)
          .eq('content_type', 'course')
          .not('dismissed_at', 'is', null);

        const dismissedIds = new Set(dismissed?.map(d => d.content_id) || []);
        filteredCourses = filteredCourses.filter(course => !dismissedIds.has(course.content_id));
      }

      // 6. Fetch full course details
      const courseIds = filteredCourses.map(c => c.content_id);
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, description, difficulty_level, category, tags, created_at')
        .in('id', courseIds);

      if (!courses) return [];

      // 7. Calculate final scores and rank
      const recommendations = await Promise.all(
        courses.map(async (course, index) => {
          const similarCourse = filteredCourses.find(c => c.content_id === course.id);
          const vectorSimilarity = similarCourse?.similarity || 0;

          // Calculate component scores
          const skillMatch = this.calculateSkillMatch(course, profile);
          const difficultyMatch = this.calculateDifficultyMatch(course, profile);
          const popularityScore = await this.calculatePopularityScore(course.id);

          // Weighted final score
          const confidenceScore = this.calculateRecommendationScore(
            vectorSimilarity,
            skillMatch,
            difficultyMatch,
            popularityScore
          );

          // Build explanation
          const reason = this.buildRecommendationReason(
            vectorSimilarity,
            skillMatch,
            difficultyMatch,
            popularityScore,
            course,
            profile
          );

          return {
            id: `rec_${course.id}_${Date.now()}`,
            contentId: course.id,
            contentType: 'course' as const,
            title: course.title,
            description: course.description || '',
            confidenceScore,
            rank: index + 1,
            reason,
            metadata: {
              difficulty: course.difficulty_level,
              category: course.category,
              tags: course.tags,
            },
          };
        })
      );

      // 8. Sort by confidence score and filter by minimum
      const rankedRecommendations = recommendations
        .filter(rec => rec.confidenceScore >= minConfidence)
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, limit)
        .map((rec, index) => ({ ...rec, rank: index + 1 }));

      // 9. Record recommendations in history
      await this.recordRecommendations(userId, rankedRecommendations, context);

      return rankedRecommendations;
    } catch (_error) {
      logger._error('Failed to generate course recommendations:', _error);
      return [];
    }
  }

  /**
   * Get learning path recommendations based on user goals
   */
  static async getLearningPathRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<Recommendation[]> {
    const { limit = 5, minConfidence = 0.6 } = options;

    try {
      const profile = await this.getUserLearningProfile(userId);

      // Get user preferences with learning goals
      const { data: preferences } = await supabase
        .from('user_preferences_ai')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!preferences?.learning_goals?.length) {
        // No learning goals set, return empty
        return [];
      }

      // Build query from learning goals
      const queryText = `Learning goals: ${preferences.learning_goals.join(', ')}.
        Career goals: ${preferences.career_goals?.join(', ') || 'general'}.
        Target skills: ${preferences.target_skills?.join(', ') || 'various'}`;

      const { embedding } = await EmbeddingService.generateEmbedding(queryText);

      // Find similar learning paths
      const similarPaths = await EmbeddingService.findSimilarContent(
        embedding,
        'learning_path',
        limit * 2,
        0.4
      );

      // Fetch full path details
      const pathIds = similarPaths.map(p => p.content_id);
      const { data: paths } = await supabase
        .from('learning_paths')
        .select('id, title, description, difficulty_level, tags, created_at')
        .in('id', pathIds);

      if (!paths) return [];

      // Score and rank
      const recommendations = paths.map((path, index) => {
        const similarPath = similarPaths.find(p => p.content_id === path.id);
        const vectorSimilarity = similarPath?.similarity || 0;

        const skillMatch = this.calculateSkillMatchForPath(path, preferences);
        const difficultyMatch = this.calculateDifficultyMatch(path, profile);

        const confidenceScore = 0.5 * vectorSimilarity + 0.3 * skillMatch + 0.2 * difficultyMatch;

        return {
          id: `rec_path_${path.id}_${Date.now()}`,
          contentId: path.id,
          contentType: 'learning_path' as const,
          title: path.title,
          description: path.description || '',
          confidenceScore,
          rank: index + 1,
          reason: {
            primary: 'Goal alignment',
            factors: {
              vectorSimilarity,
              skillMatch,
              difficultyMatch,
            },
            explanation: `This learning path aligns with your goal: "${preferences.learning_goals[0]}". It covers skills you want to develop and matches your learning level.`,
          },
          metadata: {
            difficulty: path.difficulty_level,
            tags: path.tags,
          },
        };
      });

      return recommendations
        .filter(rec => rec.confidenceScore >= minConfidence)
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, limit)
        .map((rec, index) => ({ ...rec, rank: index + 1 }));
    } catch (_error) {
      logger._error('Failed to generate learning path recommendations:', _error);
      return [];
    }
  }

  /**
   * Get similar courses based on content similarity
   */
  static async getSimilarCourses(courseId: string, limit: number = 5): Promise<Recommendation[]> {
    try {
      // Get course embedding
      const courseEmbedding = await EmbeddingService.getContentEmbedding(courseId, 'course');

      if (!courseEmbedding) {
        logger.warn(`No embedding found for course ${courseId}`);
        return [];
      }

      // Find similar courses
      const similarCourses = await EmbeddingService.findSimilarContent(
        courseEmbedding.embedding,
        'course',
        limit + 1, // +1 to exclude the source course
        0.5
      );

      // Remove the source course itself
      const filteredCourses = similarCourses.filter(course => course.content_id !== courseId);

      // Fetch course details
      const courseIds = filteredCourses.slice(0, limit).map(c => c.content_id);
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, description, difficulty_level, category, tags')
        .in('id', courseIds);

      if (!courses) return [];

      return courses.map((course, index) => {
        const similarCourse = filteredCourses.find(c => c.content_id === course.id);
        const similarity = similarCourse?.similarity || 0;

        return {
          id: `rec_similar_${course.id}_${Date.now()}`,
          contentId: course.id,
          contentType: 'course' as const,
          title: course.title,
          description: course.description || '',
          confidenceScore: similarity,
          rank: index + 1,
          reason: {
            primary: 'Content similarity',
            factors: {
              vectorSimilarity: similarity,
            },
            explanation: `This course covers similar topics and concepts. It's a great companion or next step.`,
          },
          metadata: {
            difficulty: course.difficulty_level,
            category: course.category,
            tags: course.tags,
          },
        };
      });
    } catch (_error) {
      logger._error('Failed to find similar courses:', _error);
      return [];
    }
  }

  /**
   * Get user learning profile
   */
  private static async getUserLearningProfile(userId: string): Promise<UserLearningProfile> {
    // Get learning history
    const { data: history } = await supabase.rpc('get_user_learning_history', {
      target_user_id: userId,
    });

    // Get current enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId);

    const completedCourses =
      history
        ?.filter(
          (h: { completion_percentage: number; course_id: string }) =>
            h.completion_percentage === 100
        )
        .map(h => h.course_id) || [];

    const enrolledCourses = enrollments?.map(e => e.course_id) || [];

    const averageScore =
      history?.reduce(
        (sum: number, h: { avg_assessment_score?: number }) => sum + (h.avg_assessment_score || 0),
        0
      ) / (history?.length || 1) || 0;

    // Calculate skill gaps from assessment results
    const skillGaps = await this.calculateSkillGaps(userId);

    return {
      userId,
      completedCourses,
      enrolledCourses,
      averageScore,
      skillGaps,
    };
  }

  /**
   * Calculate skill gaps from assessment results
   * Analyzes assessment performance by category to identify weak areas
   */
  private static async calculateSkillGaps(userId: string): Promise<string[]> {
    try {
      // Get assessment attempts with performance by category
      const { data: attempts } = await supabase
        .from('assessment_tool_attempts')
        .select(
          `
          id,
          total_score,
          max_possible_score,
          performance_by_category,
          assessment_tools (
            name,
            category
          )
        `
        )
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (!attempts || attempts.length === 0) {
        return [];
      }

      // Aggregate performance by category
      const categoryScores: Record<string, { total: number; count: number }> = {};

      for (const attempt of attempts) {
        // Parse performance by category if available
        const perfByCategory = attempt.performance_by_category as Record<string, number> | null;

        if (perfByCategory) {
          for (const [category, score] of Object.entries(perfByCategory)) {
            if (!categoryScores[category]) {
              categoryScores[category] = { total: 0, count: 0 };
            }
            categoryScores[category].total += score;
            categoryScores[category].count += 1;
          }
        }

        // Also track overall tool category performance
        const toolCategory = (attempt.assessment_tools as { category?: string } | null)?.category;
        if (toolCategory && attempt.max_possible_score > 0) {
          const scorePercent = (attempt.total_score / attempt.max_possible_score) * 100;
          if (!categoryScores[toolCategory]) {
            categoryScores[toolCategory] = { total: 0, count: 0 };
          }
          categoryScores[toolCategory].total += scorePercent;
          categoryScores[toolCategory].count += 1;
        }
      }

      // Identify skill gaps (categories with average score < 70%)
      const skillGaps: string[] = [];
      const SKILL_GAP_THRESHOLD = 70;

      for (const [category, scores] of Object.entries(categoryScores)) {
        const avgScore = scores.total / scores.count;
        if (avgScore < SKILL_GAP_THRESHOLD) {
          skillGaps.push(category);
        }
      }

      return skillGaps;
    } catch (_error) {
      logger._error('Failed to calculate skill gaps:', _error);
      return [];
    }
  }

  /**
   * Build query text from user profile
   */
  private static buildUserQueryText(
    profile: UserLearningProfile,
    preferences: {
      interested_topics?: string[];
      learning_goals?: string[];
      target_skills?: string[];
    } | null
  ): string {
    const parts: string[] = [];

    if (preferences?.interested_topics?.length) {
      parts.push(`Interested in: ${preferences.interested_topics.join(', ')}`);
    }

    if (preferences?.learning_goals?.length) {
      parts.push(`Learning goals: ${preferences.learning_goals.join(', ')}`);
    }

    if (preferences?.target_skills?.length) {
      parts.push(`Target skills: ${preferences.target_skills.join(', ')}`);
    }

    if (profile.averageScore > 0) {
      parts.push(`Performance level: ${profile.averageScore > 80 ? 'advanced' : 'intermediate'}`);
    }

    return parts.length > 0 ? parts.join('. ') : 'General learning interests';
  }

  /**
   * Calculate skill match score (0.0 to 1.0)
   * Higher score = course addresses user's skill gaps or matches their interests
   */
  private static calculateSkillMatch(
    course: {
      tags?: string[] | null;
      keywords?: string[] | null;
      category?: string | null;
      level?: string | null;
      difficulty_level?: string | null;
      prerequisites?: string[];
    },
    profile: UserLearningProfile
  ): number {
    let score = 0.5; // Base score

    // Get course tags/keywords
    const courseTags = new Set(
      (course.tags || course.keywords || []).map((t: string) => t.toLowerCase())
    );
    const courseCategory = (course.category || '').toLowerCase();
    const courseLevel = (course.level || course.difficulty_level || '').toLowerCase();

    // Boost score if course addresses skill gaps
    if (profile.skillGaps.length > 0) {
      const skillGapsLower = profile.skillGaps.map(s => s.toLowerCase());
      let gapMatches = 0;

      for (const gap of skillGapsLower) {
        // Check if course tags or category match the skill gap
        if (courseTags.has(gap) || courseCategory.includes(gap)) {
          gapMatches++;
        }
        // Also check for partial matches
        for (const tag of courseTags) {
          if (tag.includes(gap) || gap.includes(tag)) {
            gapMatches += 0.5;
          }
        }
      }

      // Skill gap match can boost score by up to 0.3
      score += Math.min(0.3, gapMatches * 0.15);
    }

    // Adjust score based on difficulty match
    if (profile.averageScore > 0) {
      const userLevel =
        profile.averageScore > 85
          ? 'advanced'
          : profile.averageScore > 70
            ? 'intermediate'
            : 'beginner';

      if (courseLevel === userLevel) {
        score += 0.1; // Perfect match
      } else if (
        (userLevel === 'intermediate' &&
          (courseLevel === 'beginner' || courseLevel === 'advanced')) ||
        (userLevel === 'beginner' && courseLevel === 'intermediate') ||
        (userLevel === 'advanced' && courseLevel === 'intermediate')
      ) {
        score += 0.05; // Close match
      }
    }

    // Check if user has already completed prerequisites (if course has any)
    if (profile.completedCourses.length > 0 && course.prerequisites?.length > 0) {
      const prereqsMet = course.prerequisites.every((prereq: string) =>
        profile.completedCourses.includes(prereq)
      );
      if (prereqsMet) {
        score += 0.1;
      }
    }

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate skill match for learning path
   */
  private static calculateSkillMatchForPath(
    path: { tags?: string[] | null },
    preferences: { target_skills?: string[] } | null
  ): number {
    if (!preferences?.target_skills?.length || !path.tags?.length) {
      return 0.5;
    }

    const targetSkills = new Set(preferences.target_skills.map((s: string) => s.toLowerCase()));
    const pathTags = new Set(path.tags.map((t: string) => t.toLowerCase()));

    let matches = 0;
    targetSkills.forEach(skill => {
      if (pathTags.has(skill)) matches++;
    });

    return matches / preferences.target_skills.length;
  }

  /**
   * Calculate difficulty match score (0.0 to 1.0)
   */
  private static calculateDifficultyMatch(
    content: { difficulty_level?: string | null },
    profile: UserLearningProfile
  ): number {
    const difficultyMap: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };

    const contentDifficulty = difficultyMap[content.difficulty_level?.toLowerCase()] || 2;

    // Determine user level from average score
    let userLevel = 2; // intermediate by default
    if (profile.averageScore >= 90)
      userLevel = 4; // expert
    else if (profile.averageScore >= 75)
      userLevel = 3; // advanced
    else if (profile.averageScore < 50) userLevel = 1; // beginner

    // Perfect match = 1.0, 1 level off = 0.7, 2 levels = 0.4, 3 levels = 0.1
    const difference = Math.abs(contentDifficulty - userLevel);
    if (difference === 0) return 1.0;
    if (difference === 1) return 0.7;
    if (difference === 2) return 0.4;
    return 0.1;
  }

  /**
   * Calculate popularity score based on enrollments and ratings
   */
  private static async calculatePopularityScore(courseId: string): Promise<number> {
    // Get enrollment count
    const { count: enrollmentCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    // Normalize to 0-1 scale (assume 100 enrollments = very popular)
    const popularityScore = Math.min((enrollmentCount || 0) / 100, 1.0);

    return popularityScore;
  }

  /**
   * Calculate final recommendation score using weighted algorithm
   */
  private static calculateRecommendationScore(
    vectorSimilarity: number,
    skillMatch: number,
    difficultyMatch: number,
    popularityScore: number
  ): number {
    return (
      0.4 * vectorSimilarity + 0.3 * skillMatch + 0.2 * difficultyMatch + 0.1 * popularityScore
    );
  }

  /**
   * Build recommendation reason and explanation
   */
  private static buildRecommendationReason(
    vectorSimilarity: number,
    skillMatch: number,
    difficultyMatch: number,
    popularityScore: number,
    course: { difficulty_level?: string | null; category?: string | null; tags?: string[] | null },
    profile: UserLearningProfile
  ): RecommendationReason {
    const factors = {
      vectorSimilarity,
      skillMatch,
      difficultyMatch,
      popularityScore,
    };

    // Determine primary reason (highest scoring factor)
    let primary = 'Personalized for you';
    let explanation = '';

    const maxFactor = Math.max(vectorSimilarity, skillMatch, difficultyMatch, popularityScore);

    if (maxFactor === vectorSimilarity) {
      primary = 'Similar to your interests';
      explanation = `This course matches topics you've shown interest in. It covers relevant material based on your learning history.`;
    } else if (maxFactor === skillMatch) {
      primary = 'Builds your target skills';
      explanation = `This course helps you develop skills you're working towards. It's aligned with your learning goals.`;
    } else if (maxFactor === difficultyMatch) {
      primary = 'Perfect difficulty level';
      explanation = `This course is at the right difficulty level for you based on your performance (avg score: ${Math.round(profile.averageScore)}%).`;
    } else if (maxFactor === popularityScore) {
      primary = 'Popular choice';
      explanation = `Many learners have enrolled in this course. It's well-received by the community.`;
    }

    return {
      primary,
      factors,
      explanation,
    };
  }

  /**
   * Record recommendations in history for analytics
   */
  private static async recordRecommendations(
    userId: string,
    recommendations: Recommendation[],
    context: string
  ): Promise<void> {
    try {
      const records = recommendations.map(rec => ({
        user_id: userId,
        recommendation_type: rec.contentType,
        content_id: rec.contentId,
        content_type: rec.contentType,
        confidence_score: rec.confidenceScore,
        rank_position: rec.rank,
        context_type: context,
        recommendation_reason: {
          primary: rec.reason.primary,
          factors: rec.reason.factors,
          explanation: rec.reason.explanation,
        },
      }));

      const { error } = await supabase.from('recommendation_history').insert(records);

      if (error) {
        logger.error('Failed to record recommendations:', error);
      }
    } catch (_error) {
      logger._error('Error recording recommendations:', _error);
    }
  }

  /**
   * Submit feedback for a recommendation
   */
  static async submitFeedback(
    userId: string,
    recommendationId: string,
    isHelpful: boolean,
    feedbackType?: string,
    feedbackText?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('recommendation_feedback').insert({
        user_id: userId,
        recommendation_id: recommendationId,
        is_helpful: isHelpful,
        feedback_type: feedbackType,
        feedback_text: feedbackText,
      });

      if (error) throw error;
    } catch (_error) {
      logger._error('Failed to submit recommendation feedback:', _error);
      throw error;
    }
  }

  /**
   * Update recommendation interaction (clicked, enrolled, dismissed)
   */
  static async updateRecommendationInteraction(
    recommendationId: string,
    interactionType: 'clicked' | 'enrolled' | 'dismissed'
  ): Promise<void> {
    try {
      const updateData: Record<string, string> = {};
      const timestamp = new Date().toISOString();

      if (interactionType === 'clicked') updateData.clicked_at = timestamp;
      if (interactionType === 'enrolled') updateData.enrolled_at = timestamp;
      if (interactionType === 'dismissed') updateData.dismissed_at = timestamp;

      const { error } = await supabase
        .from('recommendation_history')
        .update(updateData)
        .eq('id', recommendationId);

      if (error) throw error;
    } catch (_error) {
      logger._error('Failed to update recommendation interaction:', _error);
    }
  }
}
