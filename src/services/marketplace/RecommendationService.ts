/**
 * Marketplace Recommendation Service
 * AI-powered course recommendations based on user profile
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ExternalCourseWithProvider,
  CourseRecommendation,
  UserLearningProfile,
  MatchReason,
  CourseLevel,
  LearningPathSuggestion,
} from '@/types/marketplace';
import { ExternalCourseService } from './ExternalCourseService';

// Weights for different matching criteria
const WEIGHTS = {
  skillLevel: 0.4, // 40%
  learningGoals: 0.35, // 35%
  topicRelevance: 0.15, // 15%
  popularity: 0.1, // 10%
};

// Level order for comparison
const LEVEL_ORDER: Record<CourseLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export class MarketplaceRecommendationService {
  /**
   * Generate personalized course recommendations
   */
  static async generateRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<CourseRecommendation[]> {
    // Get user's learning profile
    const profile = await this.getUserLearningProfile(userId);

    // Get all active courses
    const { courses } = await ExternalCourseService.getCourses(
      {},
      { field: 'rating', direction: 'desc' },
      1,
      100, // Get more courses to filter from
      userId
    );

    // Filter out completed courses
    const availableCourses = courses.filter(
      course => !profile.completedCourseIds.includes(course.id)
    );

    // Score each course
    const scoredCourses = availableCourses.map(course => ({
      course,
      ...this.scoreCourse(course, profile),
    }));

    // Sort by score and take top N
    const topCourses = scoredCourses.sort((a, b) => b.score - a.score).slice(0, limit);

    // Transform to recommendations
    return topCourses.map(({ course, score, reasons, skillGaps }) => ({
      ...course,
      matchScore: Math.round(score),
      matchReasons: reasons,
      skillGapsFilled: skillGaps,
      estimatedCompletionDays: this.estimateCompletionDays(
        course,
        profile.timeCommitmentHoursPerWeek
      ),
    }));
  }

  /**
   * Get recommendations for a specific skill gap
   */
  static async getRecommendationsForSkill(
    userId: string,
    skill: string,
    limit: number = 5
  ): Promise<CourseRecommendation[]> {
    const profile = await this.getUserLearningProfile(userId);

    // Get courses that teach this skill
    const { courses } = await ExternalCourseService.getCourses(
      { skills: [skill] },
      { field: 'rating', direction: 'desc' },
      1,
      50,
      userId
    );

    // Filter and score
    const availableCourses = courses.filter(
      course => !profile.completedCourseIds.includes(course.id)
    );

    const scoredCourses = availableCourses.map(course => ({
      course,
      ...this.scoreCourse(course, profile),
    }));

    return scoredCourses
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ course, score, reasons, skillGaps }) => ({
        ...course,
        matchScore: Math.round(score),
        matchReasons: reasons,
        skillGapsFilled: skillGaps,
        estimatedCompletionDays: this.estimateCompletionDays(
          course,
          profile.timeCommitmentHoursPerWeek
        ),
      }));
  }

  /**
   * Generate learning path suggestions
   */
  static async generateLearningPaths(
    userId: string,
    targetLevel: CourseLevel = 'advanced',
    maxCourses: number = 5
  ): Promise<LearningPathSuggestion[]> {
    const profile = await this.getUserLearningProfile(userId);
    const recommendations = await this.generateRecommendations(userId, 20);

    // Group courses by skill area
    const skillPaths = this.groupCoursesBySkillArea(recommendations);

    // Generate paths for each skill area
    const paths: LearningPathSuggestion[] = [];

    for (const [skillArea, courses] of Object.entries(skillPaths)) {
      if (courses.length >= 2) {
        // Order courses by level
        const orderedCourses = courses
          .sort((a, b) => {
            const levelA = LEVEL_ORDER[a.level || 'beginner'];
            const levelB = LEVEL_ORDER[b.level || 'beginner'];
            return levelA - levelB;
          })
          .slice(0, maxCourses);

        const totalHours = orderedCourses.reduce((sum, c) => sum + (c.duration_hours || 10), 0);

        paths.push({
          id: `path-${skillArea.toLowerCase().replace(/\s+/g, '-')}`,
          name: `${skillArea} Mastery Path`,
          description: `Progress from fundamentals to ${targetLevel} level in ${skillArea}`,
          courses: orderedCourses,
          totalDurationHours: totalHours,
          estimatedWeeks: Math.ceil(totalHours / profile.timeCommitmentHoursPerWeek),
          targetSkillLevel: targetLevel,
          skills: [...new Set(orderedCourses.flatMap(c => c.skills))],
          matchScore: Math.round(
            orderedCourses.reduce((sum, c) => sum + c.matchScore, 0) / orderedCourses.length
          ),
        });
      }
    }

    return paths.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }

  /**
   * Get quick recommendations without full scoring
   * Used for "You might also like" sections
   */
  static async getQuickRecommendations(
    courseId: string,
    limit: number = 4
  ): Promise<ExternalCourseWithProvider[]> {
    return ExternalCourseService.getSimilarCourses(courseId, limit);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get or construct user's learning profile
   */
  private static async getUserLearningProfile(userId: string): Promise<UserLearningProfile> {
    // Try to get profile from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    const prefs = (profile?.preferences || {}) as Record<string, unknown>;

    // Get user's completed courses (if tracked)
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Get user's assessment scores to determine skill level
    const { data: assessments } = await supabase
      .from('assessment_attempts')
      .select('score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const avgScore = assessments?.length
      ? assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length
      : 50;

    // Determine skill level from average score
    let currentSkillLevel: CourseLevel = 'beginner';
    if (avgScore >= 85) currentSkillLevel = 'advanced';
    else if (avgScore >= 70) currentSkillLevel = 'intermediate';

    return {
      currentSkillLevel,
      learningGoals: (prefs.learning_goals as string[]) || [
        'Machine Learning',
        'Deep Learning',
        'AI Applications',
      ],
      preferredTopics: (prefs.preferred_topics as string[]) || [],
      completedCourseIds: (enrollments || []).map(e => String(e.course_id)),
      preferredProviders: (prefs.preferred_providers as string[]) || [],
      timeCommitmentHoursPerWeek: (prefs.time_commitment as number) || 5,
      budgetPreference: (prefs.budget_preference as string[]) || ['free', 'freemium'],
      preferredLanguage: (prefs.preferred_language as string) || 'en',
    };
  }

  /**
   * Score a course based on user profile
   */
  private static scoreCourse(
    course: ExternalCourseWithProvider,
    profile: UserLearningProfile
  ): { score: number; reasons: MatchReason[]; skillGaps: string[] } {
    const reasons: MatchReason[] = [];
    const skillGaps: string[] = [];
    let totalScore = 0;

    // 1. Skill Level Match (40%)
    const levelScore = this.calculateLevelScore(course, profile);
    const levelContribution = levelScore * WEIGHTS.skillLevel * 100;
    totalScore += levelContribution;

    if (levelScore > 0.7) {
      reasons.push({
        type: 'skill_level',
        description: `Perfect for your ${profile.currentSkillLevel} level`,
        weight: levelContribution,
      });
    }

    // 2. Learning Goal Alignment (35%)
    const goalScore = this.calculateGoalScore(course, profile);
    const goalContribution = goalScore * WEIGHTS.learningGoals * 100;
    totalScore += goalContribution;

    if (goalScore > 0.5) {
      const matchingGoals = profile.learningGoals.filter(
        goal =>
          course.categories.some(c => c.toLowerCase().includes(goal.toLowerCase())) ||
          course.topics.some(t => t.toLowerCase().includes(goal.toLowerCase()))
      );

      if (matchingGoals.length) {
        reasons.push({
          type: 'learning_goal',
          description: `Aligns with your goal: ${matchingGoals[0]}`,
          weight: goalContribution,
        });
      }
    }

    // 3. Topic Relevance (15%)
    const topicScore = this.calculateTopicScore(course, profile);
    const topicContribution = topicScore * WEIGHTS.topicRelevance * 100;
    totalScore += topicContribution;

    if (topicScore > 0.5 && profile.preferredTopics.length) {
      reasons.push({
        type: 'topic',
        description: 'Matches your interests',
        weight: topicContribution,
      });
    }

    // 4. Popularity (10%)
    const popularityScore = this.calculatePopularityScore(course);
    const popularityContribution = popularityScore * WEIGHTS.popularity * 100;
    totalScore += popularityContribution;

    if (popularityScore > 0.8) {
      reasons.push({
        type: 'popularity',
        description: `Highly rated (${course.rating?.toFixed(1)} stars)`,
        weight: popularityContribution,
      });
    }

    // Identify skill gaps this course fills
    course.skills.forEach(skill => {
      if (profile.learningGoals.some(goal => skill.toLowerCase().includes(goal.toLowerCase()))) {
        skillGaps.push(skill);
      }
    });

    return {
      score: Math.min(100, totalScore),
      reasons: reasons.sort((a, b) => b.weight - a.weight),
      skillGaps: [...new Set(skillGaps)],
    };
  }

  /**
   * Calculate level match score
   */
  private static calculateLevelScore(
    course: ExternalCourseWithProvider,
    profile: UserLearningProfile
  ): number {
    if (!course.level) return 0.5; // Neutral if no level specified

    const courseLevel = LEVEL_ORDER[course.level];
    const userLevel = LEVEL_ORDER[profile.currentSkillLevel];

    // Best match: course is same level or one level above
    const diff = courseLevel - userLevel;

    if (diff === 0) return 1.0; // Same level - perfect
    if (diff === 1) return 0.9; // One level up - great for growth
    if (diff === -1) return 0.6; // One level down - good for reinforcement
    if (diff === 2) return 0.4; // Two levels up - challenging
    return 0.2; // Too different
  }

  /**
   * Calculate learning goal alignment score
   */
  private static calculateGoalScore(
    course: ExternalCourseWithProvider,
    profile: UserLearningProfile
  ): number {
    if (!profile.learningGoals.length) return 0.5;

    const courseTopics = [...course.categories, ...course.topics, ...course.skills].map(t =>
      t.toLowerCase()
    );

    let matches = 0;
    for (const goal of profile.learningGoals) {
      const goalLower = goal.toLowerCase();
      if (courseTopics.some(t => t.includes(goalLower) || goalLower.includes(t))) {
        matches++;
      }
    }

    return matches / profile.learningGoals.length;
  }

  /**
   * Calculate topic relevance score
   */
  private static calculateTopicScore(
    course: ExternalCourseWithProvider,
    profile: UserLearningProfile
  ): number {
    if (!profile.preferredTopics.length) return 0.5;

    const courseTopics = [...course.topics, ...course.skills].map(t => t.toLowerCase());

    let matches = 0;
    for (const topic of profile.preferredTopics) {
      if (courseTopics.some(t => t.includes(topic.toLowerCase()))) {
        matches++;
      }
    }

    return matches / profile.preferredTopics.length;
  }

  /**
   * Calculate popularity score (rating + enrollments)
   */
  private static calculatePopularityScore(course: ExternalCourseWithProvider): number {
    let score = 0;

    // Rating component (0-0.6)
    if (course.rating) {
      score += (course.rating / 5) * 0.6;
    }

    // Enrollment component (0-0.4)
    if (course.enrollment_count > 100000) score += 0.4;
    else if (course.enrollment_count > 50000) score += 0.3;
    else if (course.enrollment_count > 10000) score += 0.2;
    else if (course.enrollment_count > 1000) score += 0.1;

    return score;
  }

  /**
   * Estimate completion days based on course duration and user commitment
   */
  private static estimateCompletionDays(
    course: ExternalCourseWithProvider,
    hoursPerWeek: number
  ): number | null {
    if (!course.duration_hours || !hoursPerWeek) return null;

    const weeks = course.duration_hours / hoursPerWeek;
    return Math.ceil(weeks * 7);
  }

  /**
   * Group courses by their primary skill area
   */
  private static groupCoursesBySkillArea(
    courses: CourseRecommendation[]
  ): Record<string, CourseRecommendation[]> {
    const groups: Record<string, CourseRecommendation[]> = {};

    for (const course of courses) {
      // Use first category or "General AI" as skill area
      const skillArea = course.categories[0] || 'General AI';

      if (!groups[skillArea]) {
        groups[skillArea] = [];
      }
      groups[skillArea].push(course);
    }

    return groups;
  }
}

export default MarketplaceRecommendationService;
