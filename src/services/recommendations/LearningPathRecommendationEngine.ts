/**
 * Learning Path Recommendation Engine
 * Integrates assessment results, user preferences, and course catalog
 * to generate personalized learning path recommendations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Course } from '@/types/api';
import type { CategoryPerformance, ProfilingData } from '@/types/assessment';

export interface AssessmentResult {
  id: string;
  final_score: number;
  augmentation_level: string;
  current_ability_estimate: number;
  weak_categories: CategoryPerformance[];
  strong_categories: CategoryPerformance[];
  profiling_data: ProfilingData;
}

export interface LearningPathRecommendation {
  id: string;
  title: string;
  description: string;
  reason: string;
  matchScore: number;
  estimatedWeeks: number;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  courses: RecommendedCourse[];
  skills: string[];
  targetLevel: string;
  benefits: string[];
}

export interface RecommendedCourse {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  relevanceScore: number;
  addressesWeakness?: string[];
}

export interface UserLearningProfile {
  userId: string;
  currentLevel: string;
  irtAbility: number;
  assessmentId?: string;
  weakCategories: CategoryPerformance[];
  strongCategories: CategoryPerformance[];
  audienceType: string;
  industry?: string;
  role?: string;
  learningGoals?: string[];
  completedCourses: number[];
  enrolledCourses: number[];
}

export class LearningPathRecommendationEngine {
  /**
   * Generate learning path recommendations based on assessment results
   */
  static async generateRecommendations(
    userId: string,
    assessmentId?: string
  ): Promise<LearningPathRecommendation[]> {
    try {
      // Get user's learning profile
      const profile = await this.getUserLearningProfile(userId, assessmentId);

      // Get assessment result if available
      let assessmentResult: AssessmentResult | null = null;
      if (assessmentId) {
        const { data } = await supabase
          .from('user_ai_assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();
        assessmentResult = data;
      }

      // Get available courses
      const { data: courses } = await supabase.from('courses').select('*').eq('is_published', true);

      if (!courses) return [];

      // Generate different path types
      const recommendations: LearningPathRecommendation[] = [];

      // 1. Weakness-focused path (if assessment data available)
      if (profile.weakCategories.length > 0) {
        const weaknessPath = await this.generateWeaknessFocusedPath(
          profile,
          courses,
          assessmentResult
        );
        if (weaknessPath) recommendations.push(weaknessPath);
      }

      // 2. Career advancement path
      const careerPath = await this.generateCareerAdvancementPath(profile, courses);
      if (careerPath) recommendations.push(careerPath);

      // 3. Quick wins path (fast, high-impact courses)
      const quickWinsPath = await this.generateQuickWinsPath(profile, courses);
      if (quickWinsPath) recommendations.push(quickWinsPath);

      // 4. Comprehensive mastery path
      const masteryPath = await this.generateMasteryPath(profile, courses);
      if (masteryPath) recommendations.push(masteryPath);

      // Sort by match score
      recommendations.sort((a, b) => b.matchScore - a.matchScore);

      return recommendations.slice(0, 5); // Return top 5
    } catch (_error) {
      logger._error('Error generating learning path recommendations:', _error);
      return [];
    }
  }

  /**
   * Get user's learning profile
   */
  private static async getUserLearningProfile(
    userId: string,
    assessmentId?: string
  ): Promise<UserLearningProfile> {
    // Get user's profile
    const { data: _profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get latest assessment if not provided
    let assessmentData = null;
    if (assessmentId) {
      const { data } = await supabase
        .from('user_ai_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();
      assessmentData = data;
    } else {
      const { data } = await supabase
        .from('user_ai_assessments')
        .select('*')
        .eq('user_id', userId)
        .eq('is_complete', true)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      assessmentData = data;
    }

    // Get enrolled and completed courses
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId);

    const { data: progress } = await supabase
      .from('user_progress')
      .select('course_id')
      .eq('user_id', userId)
      .eq('progress_percentage', 100);

    return {
      userId,
      currentLevel: assessmentData?.augmentation_level || 'beginner',
      irtAbility: assessmentData?.current_ability_estimate || 0,
      assessmentId: assessmentData?.id,
      weakCategories: assessmentData?.weak_categories || [],
      strongCategories: assessmentData?.strong_categories || [],
      audienceType: assessmentData?.profiling_data?.audience_type || 'professional',
      industry: assessmentData?.profiling_data?.industry,
      role: assessmentData?.profiling_data?.role,
      completedCourses: progress?.map(p => p.course_id) || [],
      enrolledCourses: enrollments?.map(e => e.course_id) || [],
    };
  }

  /**
   * Generate weakness-focused learning path
   */
  private static async generateWeaknessFocusedPath(
    profile: UserLearningProfile,
    allCourses: Course[],
    _assessmentResult: AssessmentResult | null
  ): Promise<LearningPathRecommendation | null> {
    const weakCategories = profile.weakCategories;
    if (weakCategories.length === 0) return null;

    // Find courses that address weak categories
    const relevantCourses = allCourses
      .filter(course => {
        // Check if course category matches weak categories
        return weakCategories.some(weak =>
          course.category?.toLowerCase().includes(weak.category_name?.toLowerCase())
        );
      })
      .filter(course => !profile.completedCourses.includes(course.id))
      .map(course => ({
        ...course,
        relevanceScore: this.calculateRelevanceScore(course, weakCategories),
        addressesWeakness: weakCategories
          .filter(weak =>
            course.category?.toLowerCase().includes(weak.category_name?.toLowerCase())
          )
          .map(w => w.category_name),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    if (relevantCourses.length === 0) return null;

    const totalHours = relevantCourses.reduce(
      (sum, c) => sum + (c.estimated_duration_hours || 10),
      0
    );
    const estimatedWeeks = Math.ceil(totalHours / (profile.audienceType === 'business' ? 10 : 5));

    return {
      id: `weakness-${Date.now()}`,
      title: 'Skill Gap Elimination Path',
      description: `Focused on strengthening your weak areas: ${weakCategories.map(w => w.category_name).join(', ')}`,
      reason: `Based on your assessment, we've identified areas where targeted learning can have the most impact.`,
      matchScore: 95,
      estimatedWeeks,
      estimatedHours: totalHours,
      difficulty: this.getDifficultyForLevel(profile.currentLevel),
      courses: relevantCourses.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty || 'intermediate',
        estimatedHours: c.estimated_duration_hours || 10,
        relevanceScore: c.relevanceScore,
        addressesWeakness: c.addressesWeakness,
      })),
      skills: [...new Set(relevantCourses.flatMap(c => c.addressesWeakness || []))] as string[],
      targetLevel: this.getNextLevel(profile.currentLevel),
      benefits: [
        'Address your biggest skill gaps',
        'Build confidence in weak areas',
        'Become well-rounded in AI tools',
        'Achieve balanced proficiency',
      ],
    };
  }

  /**
   * Generate career advancement path
   */
  private static async generateCareerAdvancementPath(
    profile: UserLearningProfile,
    allCourses: Course[]
  ): Promise<LearningPathRecommendation | null> {
    // Focus on advanced courses relevant to user's role/industry
    const advancedCourses = allCourses
      .filter(course => {
        if (profile.completedCourses.includes(course.id)) return false;
        const isAdvanced = course.difficulty === 'advanced' || course.difficulty === 'intermediate';
        const isRelevant = profile.industry
          ? course.title.toLowerCase().includes(profile.industry.toLowerCase()) ||
            course.description?.toLowerCase().includes(profile.industry.toLowerCase())
          : true;
        return isAdvanced && isRelevant;
      })
      .slice(0, 4);

    if (advancedCourses.length === 0) return null;

    const totalHours = advancedCourses.reduce(
      (sum, c) => sum + (c.estimated_duration_hours || 15),
      0
    );

    return {
      id: `career-${Date.now()}`,
      title: 'Career Advancement Track',
      description: `Advanced courses designed to boost your professional capabilities ${profile.industry ? `in ${profile.industry}` : ''}`,
      reason: 'Build expertise that sets you apart in your field',
      matchScore: 85,
      estimatedWeeks: Math.ceil(totalHours / 8),
      estimatedHours: totalHours,
      difficulty: 'advanced',
      courses: advancedCourses.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty || 'advanced',
        estimatedHours: c.estimated_duration_hours || 15,
        relevanceScore: 85,
      })),
      skills: advancedCourses.map(c => c.category).filter(Boolean),
      targetLevel: 'expert',
      benefits: [
        'Stand out in your profession',
        'Lead AI initiatives at work',
        'Command higher compensation',
        'Become a go-to expert',
      ],
    };
  }

  /**
   * Generate quick wins path
   */
  private static async generateQuickWinsPath(
    profile: UserLearningProfile,
    allCourses: Course[]
  ): Promise<LearningPathRecommendation | null> {
    // Short, high-impact courses
    const quickCourses = allCourses
      .filter(course => {
        if (profile.completedCourses.includes(course.id)) return false;
        const isQuick = (course.estimated_duration_hours || 10) <= 8;
        const isRelevant = !profile.enrolledCourses.includes(course.id);
        return isQuick && isRelevant;
      })
      .slice(0, 3);

    if (quickCourses.length === 0) return null;

    const totalHours = quickCourses.reduce((sum, c) => sum + (c.estimated_duration_hours || 5), 0);

    return {
      id: `quick-${Date.now()}`,
      title: 'Quick Wins Fast Track',
      description: 'Short, high-impact courses you can complete quickly to see immediate results',
      reason: 'Build momentum with rapid skill acquisition',
      matchScore: 75,
      estimatedWeeks: 2,
      estimatedHours: totalHours,
      difficulty: this.getDifficultyForLevel(profile.currentLevel),
      courses: quickCourses.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty || 'beginner',
        estimatedHours: c.estimated_duration_hours || 5,
        relevanceScore: 75,
      })),
      skills: quickCourses.map(c => c.category).filter(Boolean),
      targetLevel: profile.currentLevel,
      benefits: [
        'See results fast',
        'Build learning momentum',
        'Quick skill acquisition',
        'Immediate practical value',
      ],
    };
  }

  /**
   * Generate comprehensive mastery path
   */
  private static async generateMasteryPath(
    profile: UserLearningProfile,
    allCourses: Course[]
  ): Promise<LearningPathRecommendation | null> {
    // Comprehensive curriculum
    const masteryCourses = allCourses
      .filter(course => !profile.completedCourses.includes(course.id))
      .slice(0, 8);

    if (masteryCourses.length === 0) return null;

    const totalHours = masteryCourses.reduce(
      (sum, c) => sum + (c.estimated_duration_hours || 12),
      0
    );

    return {
      id: `mastery-${Date.now()}`,
      title: 'Complete AI Mastery Program',
      description: 'Comprehensive learning journey covering all aspects of AI tools and automation',
      reason: 'Achieve complete mastery across all AI domains',
      matchScore: 80,
      estimatedWeeks: Math.ceil(totalHours / 6),
      estimatedHours: totalHours,
      difficulty: 'intermediate',
      courses: masteryCourses.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty || 'intermediate',
        estimatedHours: c.estimated_duration_hours || 12,
        relevanceScore: 80,
      })),
      skills: [...new Set(masteryCourses.map(c => c.category).filter(Boolean))],
      targetLevel: 'expert',
      benefits: [
        'Complete AI proficiency',
        'No skill gaps',
        'Maximum career impact',
        'Expert-level capabilities',
      ],
    };
  }

  // Helper methods
  private static calculateRelevanceScore(
    course: Course,
    weakCategories: CategoryPerformance[]
  ): number {
    let score = 50; // Base score

    weakCategories.forEach(weak => {
      if (course.category?.toLowerCase().includes(weak.category_name?.toLowerCase())) {
        score += 20;
      }
      if (course.title?.toLowerCase().includes(weak.category_name?.toLowerCase())) {
        score += 15;
      }
      if (course.description?.toLowerCase().includes(weak.category_name?.toLowerCase())) {
        score += 10;
      }
    });

    return Math.min(score, 100);
  }

  private static getDifficultyForLevel(
    level: string
  ): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const levelMap: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'expert'> = {
      beginner: 'beginner',
      developing: 'beginner',
      proficient: 'intermediate',
      advanced: 'advanced',
      expert: 'expert',
    };
    return levelMap[level.toLowerCase()] || 'intermediate';
  }

  private static getNextLevel(currentLevel: string): string {
    const progression = ['beginner', 'developing', 'proficient', 'advanced', 'expert'];
    const currentIndex = progression.indexOf(currentLevel.toLowerCase());
    return progression[Math.min(currentIndex + 1, progression.length - 1)];
  }

  /**
   * Save recommended path as user's learning goal
   */
  static async saveAsLearningGoal(
    userId: string,
    recommendation: LearningPathRecommendation,
    assessmentId?: string
  ): Promise<string | null> {
    try {
      // Create learning goal
      const { data: goal, error: goalError } = await supabase
        .from('user_learning_goals')
        .insert({
          user_id: userId,
          assessment_id: assessmentId,
          goal_title: recommendation.title,
          goal_description: recommendation.description,
          target_augmentation_level: recommendation.targetLevel,
          estimated_weeks: recommendation.estimatedWeeks,
          focus_skills: recommendation.skills,
          current_status: 'active',
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Create AI-generated learning path
      const { data: path, error: pathError } = await supabase
        .from('ai_generated_learning_paths')
        .insert({
          user_id: userId,
          goal_id: goal.id,
          assessment_id: assessmentId,
          path_title: recommendation.title,
          path_description: recommendation.description,
          difficulty_start: recommendation.difficulty,
          difficulty_end: recommendation.targetLevel,
          estimated_completion_weeks: recommendation.estimatedWeeks,
          estimated_total_hours: recommendation.estimatedHours,
          total_courses: recommendation.courses.length,
          total_items: recommendation.courses.length,
          is_active: true,
        })
        .select()
        .single();

      if (pathError) throw pathError;

      // Create learning path items
      const items = recommendation.courses.map((course, index) => ({
        ai_learning_path_id: path.id,
        order_index: index,
        week_number: Math.floor(index / 2) + 1,
        item_type: 'course',
        item_id: course.id.toString(),
        item_title: course.title,
        item_description: course.description,
        difficulty_level: course.difficulty,
        estimated_hours: course.estimatedHours,
        is_required: true,
        reason_for_inclusion: course.addressesWeakness
          ? `Addresses weaknesses in: ${course.addressesWeakness.join(', ')}`
          : 'Recommended for skill development',
        addresses_weaknesses: course.addressesWeakness,
        confidence_score: course.relevanceScore / 100,
        status: index === 0 ? 'available' : 'locked',
      }));

      const { error: itemsError } = await supabase.from('learning_path_items').insert(items);

      if (itemsError) throw itemsError;

      logger.log('Learning path saved successfully:', path.id);
      return path.id;
    } catch (_error) {
      logger._error('Error saving learning path:', _error);
      return null;
    }
  }
}
