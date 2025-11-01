/**
 * Course Recommendation Service
 * Handles course recommendations using collaborative filtering and content-based approaches
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  UserProfile,
  Course,
  Recommendation,
  DatabaseUserProfile,
  DatabaseCourse,
  CourseEnrollment,
  Assessment,
  SimilarUser,
} from './types';

export class CourseRecommendationService {
  private static SKILL_WEIGHTS = {
    assessmentScore: 0.3,
    completionRate: 0.25,
    topicRelevance: 0.2,
    difficultyMatch: 0.15,
    peerSuccess: 0.1,
  };

  /**
   * Generate course recommendations using collaborative filtering + content-based approach
   */
  static async generateRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Recommendation[]> {
    const profile = await this.getUserProfile(userId);
    const allCourses = await this.getAllCourses();
    const userSimilarities = await this.findSimilarUsers(userId);

    const recommendations: Recommendation[] = [];

    for (const course of allCourses) {
      // Skip already completed courses
      if (profile.completedCourses.includes(course.id)) continue;

      // Calculate recommendation score
      const score = await this.calculateRecommendationScore(profile, course, userSimilarities);

      // Generate reasons
      const reasons = this.generateReasons(profile, course, score);

      // Estimate completion time
      const estimatedTime = this.estimateCompletionTime(
        course,
        profile.learningPace,
        profile.timeCommitment
      );

      // Identify skill gaps filled
      const skillGapFilled = this.identifySkillGaps(profile, course);

      recommendations.push({
        courseId: course.id,
        score,
        reasons,
        estimatedCompletionTime: estimatedTime,
        skillGapFilled,
        confidence: this.calculateConfidence(score, profile),
      });
    }

    // Sort by score and return top N
    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private static async getUserProfile(userId: string): Promise<UserProfile> {
    const { data: user } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id, progress')
      .eq('user_id', userId);

    const completedCourses =
      enrollments
        ?.filter((e: CourseEnrollment) => e.progress === 100)
        .map((e: CourseEnrollment) => e.course_id) || [];

    const { data: assessments } = await supabase
      .from('ai_assessment_results')
      .select('category, score')
      .eq('user_id', userId);

    const assessmentScores =
      assessments?.reduce(
        (acc: Record<string, number>, a: Assessment) => ({ ...acc, [a.category]: a.score }),
        {}
      ) || {};

    const typedUser = user as DatabaseUserProfile | null;

    return {
      id: userId,
      currentSkillLevel: typedUser?.skill_level || 50,
      learningGoals: typedUser?.learning_goals || [],
      completedCourses,
      assessmentScores,
      learningPace: typedUser?.learning_pace || 'moderate',
      preferredTopics: typedUser?.preferred_topics || [],
      timeCommitment: typedUser?.time_commitment || 5,
    };
  }

  private static async getAllCourses(): Promise<Course[]> {
    const { data: courses } = await supabase.from('courses').select('*');

    return (
      courses?.map((c: DatabaseCourse) => ({
        id: c.id,
        title: c.title,
        difficulty: c.difficulty_level,
        topics: c.topics || [],
        estimatedHours: c.estimated_hours || 10,
        prerequisites: c.prerequisites || [],
        skills: c.skills || [],
        completionRate: c.completion_rate || 0.7,
        averageRating: c.average_rating || 4.0,
      })) || []
    );
  }

  private static async findSimilarUsers(userId: string): Promise<string[]> {
    // Simplified: Find users with similar assessment scores and completed courses
    try {
      const response = await supabase.rpc('find_similar_users', { target_user_id: userId });
      const data = response?.data;
      return data?.map((u: SimilarUser) => u.id) || [];
    } catch (error) {
      logger.error('Error finding similar users', error);
      return [];
    }
  }

  private static async calculateRecommendationScore(
    profile: UserProfile,
    course: Course,
    similarUsers: string[]
  ): Promise<number> {
    let score = 0;

    // Assessment score alignment
    const relevantAssessments = course.topics.filter(t => profile.assessmentScores[t]);
    if (relevantAssessments.length > 0) {
      const avgAssessmentScore =
        relevantAssessments.reduce((sum, t) => sum + profile.assessmentScores[t], 0) /
        relevantAssessments.length;
      score += avgAssessmentScore * this.SKILL_WEIGHTS.assessmentScore;
    }

    // Topic relevance
    const topicOverlap = course.topics.filter(t => profile.preferredTopics.includes(t)).length;
    const topicScore = (topicOverlap / Math.max(course.topics.length, 1)) * 100;
    score += topicScore * this.SKILL_WEIGHTS.topicRelevance;

    // Difficulty match
    const difficultyScore = this.calculateDifficultyMatch(
      profile.currentSkillLevel,
      course.difficulty
    );
    score += difficultyScore * this.SKILL_WEIGHTS.difficultyMatch;

    // Completion rate
    score += course.completionRate * 100 * this.SKILL_WEIGHTS.completionRate;

    // Peer success (collaborative filtering)
    const peerScore = await this.getPeerSuccessScore(course.id, similarUsers);
    score += peerScore * this.SKILL_WEIGHTS.peerSuccess;

    return Math.min(100, Math.max(0, score));
  }

  private static calculateDifficultyMatch(skillLevel: number, difficulty: string): number {
    const difficultyMap: Record<string, [number, number]> = {
      beginner: [0, 30],
      intermediate: [25, 60],
      advanced: [50, 85],
      expert: [75, 100],
    };

    const [min, max] = difficultyMap[difficulty] || [0, 100];
    if (skillLevel >= min && skillLevel <= max) return 100;
    if (skillLevel < min) return Math.max(0, 100 - (min - skillLevel) * 2);
    return Math.max(0, 100 - (skillLevel - max) * 2);
  }

  private static async getPeerSuccessScore(
    courseId: string,
    similarUsers: string[]
  ): Promise<number> {
    if (similarUsers.length === 0) return 50;

    const { data } = await supabase
      .from('course_enrollments')
      .select('progress, rating')
      .eq('course_id', courseId)
      .in('user_id', similarUsers);

    if (!data || data.length === 0) return 50;

    const avgProgress =
      data.reduce((sum, e: CourseEnrollment) => sum + (e.progress || 0), 0) / data.length;
    const avgRating =
      data.reduce((sum, e: CourseEnrollment) => sum + (e.rating || 0), 0) / data.length;

    return (avgProgress + avgRating * 20) / 2;
  }

  private static generateReasons(profile: UserProfile, course: Course, score: number): string[] {
    const reasons: string[] = [];

    if (score > 80) reasons.push('Highly recommended based on your profile');

    const topicMatches = course.topics.filter(t => profile.preferredTopics.includes(t));
    if (topicMatches.length > 0) {
      reasons.push(`Matches your interests: ${topicMatches.join(', ')}`);
    }

    if (course.completionRate > 0.8) {
      reasons.push(`High completion rate (${Math.round(course.completionRate * 100)}%)`);
    }

    if (course.averageRating >= 4.5) {
      reasons.push(`Excellent rating (${course.averageRating}/5.0)`);
    }

    const skillGaps = this.identifySkillGaps(profile, course);
    if (skillGaps.length > 0) {
      reasons.push(`Fills skill gaps: ${skillGaps.slice(0, 3).join(', ')}`);
    }

    return reasons;
  }

  private static estimateCompletionTime(
    course: Course,
    pace: string,
    timeCommitment: number
  ): number {
    const paceMultiplier = { slow: 1.5, moderate: 1, fast: 0.7 };
    const multiplier = paceMultiplier[pace as keyof typeof paceMultiplier] || 1;

    const totalHours = course.estimatedHours * multiplier;
    const days = (totalHours / timeCommitment) * 7;

    return Math.ceil(days);
  }

  private static identifySkillGaps(profile: UserProfile, course: Course): string[] {
    const userSkills = Object.keys(profile.assessmentScores);
    return course.skills.filter(skill => !userSkills.includes(skill));
  }

  private static calculateConfidence(score: number, profile: UserProfile): number {
    let confidence = 0.5;

    // More data = higher confidence
    if (profile.completedCourses.length > 5) confidence += 0.2;
    if (Object.keys(profile.assessmentScores).length > 3) confidence += 0.2;

    // High score = higher confidence
    if (score > 80) confidence += 0.1;

    return Math.min(1, confidence);
  }
}
