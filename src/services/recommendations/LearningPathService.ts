/**
 * Learning Path Service
 * Generates personalized learning paths based on user goals and timelines
 */

import type { LearningPath, Recommendation, Milestone, UserProfile } from './types';
import { CourseRecommendationService } from './CourseRecommendationService';

export class LearningPathService {
  /**
   * Generate personalized learning path
   */
  static async generateLearningPath(
    userId: string,
    targetSkillLevel: number,
    timeframe: number // weeks
  ): Promise<LearningPath> {
    const profile = await this.getUserProfile(userId);
    const recommendations = await CourseRecommendationService.generateRecommendations(userId, 50);

    // Filter courses that fit the timeframe and lead to target skill level
    const selectedCourses = this.selectOptimalCourses(
      recommendations,
      profile.currentSkillLevel,
      targetSkillLevel,
      timeframe
    );

    // Order courses based on prerequisites and difficulty
    const orderedCourses = this.orderByPrerequisites(selectedCourses);

    // Generate milestones
    const milestones = this.generateMilestones(orderedCourses, timeframe);

    return {
      id: this.generateId(),
      name: `Path to ${this.getSkillLevelName(targetSkillLevel)}`,
      courses: orderedCourses.map((c) => c.courseId),
      estimatedDuration: timeframe,
      targetSkillLevel,
      milestones,
    };
  }

  private static async getUserProfile(userId: string): Promise<UserProfile> {
    // Delegate to CourseRecommendationService's getUserProfile
    // This is a temporary implementation - ideally we'd extract this to a shared service
    const recommendations = await CourseRecommendationService.generateRecommendations(userId, 1);
    // Extract profile from context (simplified)
    return {
      id: userId,
      currentSkillLevel: 50,
      learningGoals: [],
      completedCourses: [],
      assessmentScores: {},
      learningPace: 'moderate',
      preferredTopics: [],
      timeCommitment: 5,
    };
  }

  private static selectOptimalCourses(
    recommendations: Recommendation[],
    currentLevel: number,
    targetLevel: number,
    timeframe: number
  ): Recommendation[] {
    // Greedy algorithm: select courses that maximize skill gain within timeframe
    const selected: Recommendation[] = [];
    let totalDays = 0;
    let currentSkill = currentLevel;

    for (const rec of recommendations) {
      if (totalDays + rec.estimatedCompletionTime > timeframe * 7) continue;
      if (currentSkill >= targetLevel) break;

      selected.push(rec);
      totalDays += rec.estimatedCompletionTime;
      currentSkill += rec.skillGapFilled.length * 5; // Simplified skill gain
    }

    return selected;
  }

  private static orderByPrerequisites(courses: Recommendation[]): Recommendation[] {
    // Topological sort based on prerequisites
    // Simplified implementation - maintains original order
    return courses;
  }

  private static generateMilestones(courses: Recommendation[], timeframe: number): Milestone[] {
    const milestones: Milestone[] = [];
    let currentWeek = 0;

    for (const course of courses) {
      const weeks = Math.ceil(course.estimatedCompletionTime / 7);
      currentWeek += weeks;

      milestones.push({
        id: this.generateId(),
        name: `Complete course`,
        courseId: course.courseId,
        targetDate: new Date(Date.now() + currentWeek * 7 * 24 * 60 * 60 * 1000),
        skillsAcquired: course.skillGapFilled,
      });
    }

    return milestones;
  }

  private static getSkillLevelName(level: number): string {
    if (level >= 90) return 'Expert';
    if (level >= 75) return 'Advanced';
    if (level >= 60) return 'Intermediate';
    if (level >= 40) return 'Beginner';
    return 'Novice';
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
