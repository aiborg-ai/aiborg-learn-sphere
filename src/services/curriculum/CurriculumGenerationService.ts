import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Course } from '@/hooks/useCourses';

/**
 * AI-Powered Curriculum Generation Service
 * Generates personalized learning paths based on user profiles and assessment results
 */

// Types
export interface LearnerProfile {
  id: string;
  user_id: string;
  profile_name: string;
  description?: string;
  learning_goals: LearningGoal[];
  target_audience: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  industry?: string;
  job_role?: string;
  preferred_learning_style: 'visual' | 'reading' | 'hands-on' | 'mixed';
  available_hours_per_week: number;
  latest_assessment_id?: string;
  irt_ability_score?: number;
  proficiency_areas?: ProficiencyArea[];
}

export interface LearningGoal {
  id: string;
  label: string;
  description?: string;
}

export interface ProficiencyArea {
  category: string;
  score: number;
  level: string;
}

export interface ScoredCourse extends Course {
  relevance_score: number;
  skill_gap_coverage: number;
  goal_alignment: number;
  difficulty_fit: number;
  schedule_fit: number;
  recommendation_reason: string;
  skill_gaps_addressed: string[];
}

export interface CurriculumModule {
  module_order: number;
  module_name: string;
  module_description: string;
  difficulty_level: 'foundation' | 'intermediate' | 'advanced' | 'expert';
  courses: ScoredCourse[];
}

export interface GeneratedCurriculum {
  curriculum_id: string;
  curriculum_name: string;
  description: string;
  ai_confidence_score: number;
  estimated_completion_weeks: number;
  estimated_total_hours: number;
  modules: CurriculumModule[];
  total_courses: number;
  generation_metadata: {
    algorithm_version: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- OpenAI API response structure
    profile_snapshot: any;
    generation_timestamp: string;
    courses_analyzed: number;
    courses_selected: number;
  };
}

export interface CurriculumGenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_curriculum_id?: string;
  error_message?: string;
}

class CurriculumGenerationService {
  private readonly ALGORITHM_VERSION = 'v1.0.0';
  private readonly MODEL_NAME = 'irt_gap_analysis';

  // Scoring weights
  private readonly WEIGHTS = {
    skill_gap_coverage: 0.4,
    goal_alignment: 0.3,
    difficulty_fit: 0.2,
    schedule_fit: 0.1,
  };

  /**
   * Generate AI curriculum for a learner profile
   */
  async generateCurriculum(profileId: string): Promise<CurriculumGenerationJob> {
    try {
      // Create generation job
      const { data: job, error: jobError } = await supabase
        .from('curriculum_generation_jobs')
        .insert({
          profile_id: profileId,
          status: 'pending',
          input_parameters: {
            algorithm_version: this.ALGORITHM_VERSION,
            model: this.MODEL_NAME,
          },
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Process asynchronously
      this.processGenerationJob(job.id, profileId).catch(error => {
        logger.error('Curriculum generation failed:', error);
      });

      return job;
    } catch (error) {
      logger.error('Error creating generation job:', error);
      throw error;
    }
  }

  /**
   * Get generation job status
   */
  async getGenerationStatus(jobId: string): Promise<CurriculumGenerationJob> {
    const { data, error } = await supabase
      .from('curriculum_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Process generation job (runs asynchronously)
   */
  private async processGenerationJob(jobId: string, profileId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Update status to processing
      await supabase
        .from('curriculum_generation_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', jobId);

      // Fetch profile data
      const profile = await this.fetchProfile(profileId);

      // Fetch assessment data if linked
      const assessment = profile.latest_assessment_id
        ? await this.fetchAssessment(profile.latest_assessment_id)
        : null;

      // Fetch all available courses
      const courses = await this.fetchAvailableCourses(profile.user_id);

      // Run AI generation algorithm
      const generatedCurriculum = await this.runGenerationAlgorithm(profile, courses, assessment);

      // Save curriculum to database
      const curriculumId = await this.saveCurriculum(generatedCurriculum, profile);

      // Update job status to completed
      const generationTime = Date.now() - startTime;
      await supabase
        .from('curriculum_generation_jobs')
        .update({
          status: 'completed',
          generated_curriculum_id: curriculumId,
          courses_recommended: generatedCurriculum.total_courses,
          generation_time_ms: generationTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      logger.info(`Curriculum generated successfully in ${generationTime}ms`);
    } catch (error) {
      logger.error('Generation job failed:', error);

      await supabase
        .from('curriculum_generation_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      throw error;
    }
  }

  /**
   * Core AI generation algorithm
   */
  private async runGenerationAlgorithm(
    profile: LearnerProfile,

    courses: Course[],
    assessment: any | null
  ): Promise<GeneratedCurriculum> {
    logger.info(`Starting curriculum generation for profile: ${profile.profile_name}`);

    // Step 1: Filter courses by audience and availability
    const eligibleCourses = this.filterEligibleCourses(courses, profile);
    logger.info(`Eligible courses: ${eligibleCourses.length} out of ${courses.length}`);

    // Step 2: Score each course
    const scoredCourses = eligibleCourses.map(course =>
      this.scoreCourse(course, profile, assessment)
    );

    // Step 3: Select top courses
    const selectedCourses = this.selectTopCourses(scoredCourses, profile);
    logger.info(`Selected ${selectedCourses.length} courses`);

    // Step 4: Sequence courses by difficulty and dependencies
    const sequencedCourses = this.sequenceCourses(selectedCourses);

    // Step 5: Group into modules
    const modules = this.groupIntoModules(sequencedCourses);

    // Step 6: Calculate metadata
    const estimatedHours = this.calculateTotalHours(selectedCourses);
    const estimatedWeeks = Math.ceil(estimatedHours / profile.available_hours_per_week);
    const avgConfidence = this.calculateAverageConfidence(selectedCourses);

    return {
      curriculum_id: '', // Will be set when saving
      curriculum_name: `${profile.profile_name} Learning Path`,
      description: `AI-generated curriculum tailored for ${profile.experience_level} level with focus on: ${profile.learning_goals.map(g => g.label).join(', ')}`,
      ai_confidence_score: avgConfidence,
      estimated_completion_weeks: estimatedWeeks,
      estimated_total_hours: estimatedHours,
      modules,
      total_courses: selectedCourses.length,
      generation_metadata: {
        algorithm_version: this.ALGORITHM_VERSION,
        profile_snapshot: {
          experience_level: profile.experience_level,
          learning_goals: profile.learning_goals,
          has_assessment: !!assessment,
        },
        generation_timestamp: new Date().toISOString(),
        courses_analyzed: eligibleCourses.length,
        courses_selected: selectedCourses.length,
      },
    };
  }

  /**
   * Filter courses by eligibility criteria
   */
  private filterEligibleCourses(courses: Course[], profile: LearnerProfile): Course[] {
    return courses.filter(course => {
      // Must be active and displayed
      if (!course.is_active || !course.display) return false;

      // Check audience match
      const audiences = course.audiences || [course.audience];
      if (!audiences.includes(profile.target_audience)) {
        // Allow "professional" for "business" and vice versa
        const isBusinessOrProfessional =
          (profile.target_audience === 'business' && audiences.includes('professional')) ||
          (profile.target_audience === 'professional' && audiences.includes('business'));

        if (!isBusinessOrProfessional) return false;
      }

      return true;
    });
  }

  /**
   * Score individual course based on profile and assessment
   */
  private scoreCourse(
    course: Course,
    profile: LearnerProfile,
    assessment: any | null
  ): ScoredCourse {
    const skillGapScore = this.calculateSkillGapCoverage(course, profile, assessment);
    const goalScore = this.calculateGoalAlignment(course, profile);
    const difficultyScore = this.calculateDifficultyFit(course, profile, assessment);
    const scheduleScore = this.calculateScheduleFit(course, profile);

    const relevanceScore =
      skillGapScore * this.WEIGHTS.skill_gap_coverage +
      goalScore * this.WEIGHTS.goal_alignment +
      difficultyScore * this.WEIGHTS.difficulty_fit +
      scheduleScore * this.WEIGHTS.schedule_fit;

    const reason = this.generateRecommendationReason(
      course,
      profile,
      skillGapScore,
      goalScore,
      difficultyScore
    );

    const skillGaps = this.identifySkillGapsAddressed(course, profile, assessment);

    return {
      ...course,
      relevance_score: Math.round(relevanceScore * 100) / 100,
      skill_gap_coverage: skillGapScore,
      goal_alignment: goalScore,
      difficulty_fit: difficultyScore,
      schedule_fit: scheduleScore,
      recommendation_reason: reason,
      skill_gaps_addressed: skillGaps,
    };
  }

  /**
   * Calculate skill gap coverage score
   */

  private calculateSkillGapCoverage(
    course: Course,
    profile: LearnerProfile,
    assessment: any | null
  ): number {
    if (!assessment || !profile.proficiency_areas) return 0.5; // Default moderate score

    // Check if course keywords match weak proficiency areas
    const weakAreas = profile.proficiency_areas.filter(area => area.score < 0.5);
    const courseKeywords = course.keywords || [];

    const matchedAreas = weakAreas.filter(area =>
      courseKeywords.some(
        keyword =>
          keyword.toLowerCase().includes(area.category.toLowerCase()) ||
          area.category.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (weakAreas.length === 0) return 0.3; // No gaps identified
    return Math.min(matchedAreas.length / weakAreas.length, 1.0);
  }

  /**
   * Calculate goal alignment score
   */
  private calculateGoalAlignment(course: Course, profile: LearnerProfile): number {
    if (profile.learning_goals.length === 0) return 0.5;

    const courseText =
      `${course.title} ${course.description} ${course.keywords?.join(' ')}`.toLowerCase();

    const matchedGoals = profile.learning_goals.filter(
      goal =>
        courseText.includes(goal.label.toLowerCase()) ||
        (goal.description && courseText.includes(goal.description.toLowerCase()))
    );

    return Math.min(matchedGoals.length / profile.learning_goals.length + 0.3, 1.0);
  }

  /**
   * Calculate difficulty fit score
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Assessment structure from external source
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- assessment parameter for future use
   */
  private calculateDifficultyFit(
    course: Course,
    profile: LearnerProfile,
    assessment: any | null
  ): number {
    const courseLevel = course.level?.toLowerCase() || 'intermediate';
    const profileLevel = profile.experience_level;

    // Perfect match
    if (courseLevel === profileLevel) return 1.0;

    // One level difference
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const courseLevelIndex = levels.indexOf(courseLevel);
    const profileLevelIndex = levels.indexOf(profileLevel);

    if (courseLevelIndex === -1 || profileLevelIndex === -1) return 0.5;

    const diff = Math.abs(courseLevelIndex - profileLevelIndex);
    if (diff === 1) return 0.7; // Adjacent level
    if (diff === 2) return 0.4; // Two levels apart
    return 0.2; // Far apart
  }

  /**
   * Calculate schedule fit score
   */
  private calculateScheduleFit(course: Course, profile: LearnerProfile): number {
    // Parse course duration (e.g., "4 weeks", "2 days")
    const durationMatch = course.duration?.match(/(\d+)\s*(week|day|hour)/i);
    if (!durationMatch) return 0.7; // Default score if duration unclear

    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();

    let estimatedHours = 0;
    if (unit.startsWith('week'))
      estimatedHours = value * 10; // Assume 10 hours/week
    else if (unit.startsWith('day'))
      estimatedHours = value * 2; // Assume 2 hours/day
    else if (unit.startsWith('hour')) estimatedHours = value;

    const weeksNeeded = estimatedHours / profile.available_hours_per_week;

    if (weeksNeeded <= 4) return 1.0; // Perfect fit
    if (weeksNeeded <= 8) return 0.8; // Good fit
    if (weeksNeeded <= 12) return 0.6; // Acceptable
    return 0.4; // Challenging fit
  }

  /**
   * Generate human-readable recommendation reason
   */
  private generateRecommendationReason(
    course: Course,
    profile: LearnerProfile,
    skillGapScore: number,
    goalScore: number,
    difficultyScore: number
  ): string {
    const reasons: string[] = [];

    if (skillGapScore > 0.7) {
      reasons.push('Addresses key knowledge gaps');
    } else if (skillGapScore > 0.4) {
      reasons.push('Fills important skill areas');
    }

    if (goalScore > 0.7) {
      const topGoal = profile.learning_goals[0];
      reasons.push(`Directly supports your goal: "${topGoal?.label}"`);
    } else if (goalScore > 0.4) {
      reasons.push('Aligns with your learning objectives');
    }

    if (difficultyScore === 1.0) {
      reasons.push(`Perfect match for ${profile.experience_level} level`);
    } else if (difficultyScore > 0.6) {
      reasons.push('Appropriate difficulty level');
    }

    if (reasons.length === 0) {
      reasons.push('Recommended for comprehensive learning path');
    }

    return reasons.join('. ') + '.';
  }

  /**
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- assessment parameter for future use
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Assessment structure from external source
   * Identify specific skill gaps addressed by course
   */
  private identifySkillGapsAddressed(
    course: Course,
    profile: LearnerProfile,
    assessment: any | null
  ): string[] {
    if (!profile.proficiency_areas) return [];

    const weakAreas = profile.proficiency_areas
      .filter(area => area.score < 0.5)
      .map(area => area.category);

    const courseKeywords = (course.keywords || []).map(k => k.toLowerCase());

    return weakAreas.filter(area =>
      courseKeywords.some(
        keyword => keyword.includes(area.toLowerCase()) || area.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Select top courses based on scores
   */
  private selectTopCourses(scoredCourses: ScoredCourse[], profile: LearnerProfile): ScoredCourse[] {
    // Sort by relevance score (descending)
    const sorted = [...scoredCourses].sort((a, b) => b.relevance_score - a.relevance_score);

    // Select top 5-12 courses based on available time
    const maxCourses =
      profile.available_hours_per_week >= 10 ? 12 : profile.available_hours_per_week >= 5 ? 8 : 5;

    return sorted.slice(0, maxCourses);
  }

  /**
   * Sequence courses by difficulty and dependencies
   */
  private sequenceCourses(courses: ScoredCourse[]): ScoredCourse[] {
    // Sort by difficulty (beginner → expert) and relevance
    const levelOrder = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

    return [...courses].sort((a, b) => {
      const aLevel = levelOrder[a.level?.toLowerCase() as keyof typeof levelOrder] ?? 1;
      const bLevel = levelOrder[b.level?.toLowerCase() as keyof typeof levelOrder] ?? 1;

      if (aLevel !== bLevel) return aLevel - bLevel;
      return b.relevance_score - a.relevance_score;
    });
  }

  /**
   * Group courses into modules (Foundation, Application, Mastery)
   */
  private groupIntoModules(courses: ScoredCourse[]): CurriculumModule[] {
    const modules: CurriculumModule[] = [];

    const beginnerCourses = courses.filter(c => c.level?.toLowerCase() === 'beginner');
    const intermediateCourses = courses.filter(c => c.level?.toLowerCase() === 'intermediate');
    const advancedCourses = courses.filter(c =>
      ['advanced', 'expert'].includes(c.level?.toLowerCase() || '')
    );

    if (beginnerCourses.length > 0) {
      modules.push({
        module_order: 1,
        module_name: 'Foundation',
        module_description: 'Build fundamental knowledge and core concepts',
        difficulty_level: 'foundation',
        courses: beginnerCourses,
      });
    }

    if (intermediateCourses.length > 0) {
      modules.push({
        module_order: modules.length + 1,
        module_name: 'Application',
        module_description: 'Apply knowledge through practical projects',
        difficulty_level: 'intermediate',
        courses: intermediateCourses,
      });
    }

    if (advancedCourses.length > 0) {
      modules.push({
        module_order: modules.length + 1,
        module_name: 'Mastery',
        module_description: 'Advanced techniques and specialization',
        difficulty_level: 'advanced',
        courses: advancedCourses,
      });
    }

    return modules;
  }

  /**
   * Calculate total estimated hours
   */
  private calculateTotalHours(courses: ScoredCourse[]): number {
    return courses.reduce((total, course) => {
      const match = course.duration?.match(/(\d+)\s*(week|day|hour)/i);
      if (!match) return total + 20; // Default 20 hours

      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      if (unit.startsWith('week')) return total + value * 10;
      if (unit.startsWith('day')) return total + value * 2;
      if (unit.startsWith('hour')) return total + value;
      return total + 20;
    }, 0);
  }

  /**
   * Calculate average confidence score
   */
  private calculateAverageConfidence(courses: ScoredCourse[]): number {
    if (courses.length === 0) return 0;
    const avg = courses.reduce((sum, c) => sum + c.relevance_score, 0) / courses.length;
    return Math.round(avg * 100) / 100;
  }

  /**
   * Save generated curriculum to database
   */
  private async saveCurriculum(
    curriculum: GeneratedCurriculum,
    profile: LearnerProfile
  ): Promise<string> {
    // Create curriculum record
    const { data: curriculumRecord, error: curriculumError } = await supabase
      .from('user_curricula')
      .insert({
        user_id: profile.user_id,
        profile_id: profile.id,
        curriculum_name: curriculum.curriculum_name,
        description: curriculum.description,
        generated_by_ai: true,
        ai_confidence_score: curriculum.ai_confidence_score,
        generation_metadata: curriculum.generation_metadata,
        difficulty_progression: 'linear',
        estimated_completion_weeks: curriculum.estimated_completion_weeks,
        estimated_total_hours: curriculum.estimated_total_hours,
        is_active: true,
        is_published: false,
      })
      .select()
      .single();

    if (curriculumError) throw curriculumError;

    // Create modules
    await Promise.all(
      curriculum.modules.map(module =>
        supabase.from('curriculum_modules').insert({
          curriculum_id: curriculumRecord.id,
          module_order: module.module_order,
          module_name: module.module_name,
          module_description: module.module_description,
          difficulty_level: module.difficulty_level,
          courses_in_module: module.courses.length,
        })
      )
    );

    // Create curriculum_courses records
    let sequenceOrder = 1;
    for (const module of curriculum.modules) {
      for (const course of module.courses) {
        await supabase.from('curriculum_courses').insert({
          curriculum_id: curriculumRecord.id,
          course_id: course.id,
          sequence_order: sequenceOrder++,
          module_name: module.module_name,
          ai_recommended: true,
          recommendation_score: course.relevance_score,
          recommendation_reason: course.recommendation_reason,
          skill_gaps_addressed: course.skill_gaps_addressed,
          user_approved: null, // Pending user approval
        });
      }
    }

    return curriculumRecord.id;
  }

  /**
   * Helper: Fetch profile data
   */
  private async fetchProfile(profileId: string): Promise<LearnerProfile> {
    const { data, error } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) throw error;

    return data as LearnerProfile;
  }

  /**
   * Helper: Fetch assessment data
   */
  private async fetchAssessment(assessmentId: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_ai_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Helper: Fetch available courses
   */
  private async fetchAvailableCourses(userId: string): Promise<Course[]> {
    // Get all active courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses_with_audiences')
      .select('*')
      .eq('is_active', true)
      .eq('display', true);

    if (coursesError) throw coursesError;

    // Get user's enrolled courses to exclude
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId);

    const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || []);

    // Filter out enrolled courses
    return (courses || []).filter(course => !enrolledCourseIds.has(course.id));
  }
}

export const curriculumGenerationService = new CurriculumGenerationService();
