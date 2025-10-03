/**
 * AI-Powered Learning Path Generator
 * Generates personalized learning paths based on assessment results and user goals
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Types
export interface AssessmentData {
  id: string;
  total_score: number;
  max_possible_score: number;
  augmentation_level: string;
  current_ability_estimate?: number;
  ability_standard_error?: number;
  questions_answered_count?: number;
}

export interface CategoryInsight {
  category_id: string;
  category_name: string;
  category_score: number;
  category_max_score: number;
  strength_level: 'strong' | 'proficient' | 'developing' | 'weak';
  percentage: number;
}

export interface LearningGoal {
  goal_title: string;
  goal_description?: string;
  target_augmentation_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  target_irt_ability?: number;
  focus_category_ids: string[];
  focus_skills?: string[];
  estimated_weeks: number;
  hours_per_week: number;
  preferred_learning_style?: 'visual' | 'reading' | 'hands-on' | 'mixed';
  include_workshops: boolean;
  include_events: boolean;
}

export interface PathItem {
  item_type: 'course' | 'exercise' | 'quiz' | 'workshop' | 'event' | 'assessment';
  item_id: string;
  item_title: string;
  item_description?: string;
  difficulty_level: string;
  irt_difficulty?: number;
  estimated_hours: number;
  is_required: boolean;
  prerequisites?: string[];
  skill_tags?: string[];
  reason_for_inclusion: string;
  addresses_weaknesses?: string[];
  confidence_score: number;
  week_number?: number;
}

export interface GeneratedPath {
  path_title: string;
  path_description: string;
  difficulty_start: string;
  difficulty_end: string;
  estimated_completion_weeks: number;
  estimated_total_hours: number;
  items: PathItem[];
  milestones: Milestone[];
  generation_metadata: {
    algorithm: string;
    assessment_used: string;
    gap_analysis: any;
    computation_time_ms: number;
  };
}

export interface Milestone {
  milestone_order: number;
  milestone_title: string;
  milestone_description: string;
  minimum_completion_percentage: number;
  reward_badge?: string;
  reward_points: number;
  reward_message: string;
}

// Difficulty progression mapping
const DIFFICULTY_MAP = {
  beginner: { irt: -1.0, level: 'foundational', next: 'intermediate' },
  intermediate: { irt: 0.0, level: 'applied', next: 'advanced' },
  advanced: { irt: 1.0, level: 'advanced', next: 'expert' },
  expert: { irt: 2.0, level: 'strategic', next: 'expert' }
};

const LEVEL_TO_DIFFICULTY = {
  foundational: -1.0,
  applied: 0.0,
  advanced: 1.0,
  strategic: 2.0
};

export class LearningPathGenerator {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Main function to generate a personalized learning path
   */
  async generatePath(
    userId: string,
    assessmentData: AssessmentData,
    categoryInsights: CategoryInsight[],
    goal: LearningGoal
  ): Promise<GeneratedPath> {
    logger.log('Starting path generation for user:', userId);
    this.startTime = Date.now();

    // Step 1: Perform gap analysis
    const gapAnalysis = this.analyzeSkillGaps(assessmentData, categoryInsights, goal);

    // Step 2: Fetch available resources
    const resources = await this.fetchAvailableResources(gapAnalysis);

    // Step 3: Select and sequence content
    const selectedItems = this.selectAndSequenceContent(
      resources,
      gapAnalysis,
      goal,
      assessmentData
    );

    // Step 4: Create milestones
    const milestones = this.createMilestones(selectedItems, goal);

    // Step 5: Calculate path metadata
    const totalHours = selectedItems.reduce((sum, item) => sum + item.estimated_hours, 0);
    const computationTime = Date.now() - this.startTime;

    const generatedPath: GeneratedPath = {
      path_title: this.generatePathTitle(goal, gapAnalysis),
      path_description: this.generatePathDescription(goal, gapAnalysis, selectedItems),
      difficulty_start: this.mapLevelToDifficulty(assessmentData.augmentation_level),
      difficulty_end: this.mapLevelToDifficulty(goal.target_augmentation_level),
      estimated_completion_weeks: goal.estimated_weeks,
      estimated_total_hours: Math.ceil(totalHours),
      items: selectedItems,
      milestones,
      generation_metadata: {
        algorithm: 'irt_gap_analysis_v1',
        assessment_used: assessmentData.id,
        gap_analysis: gapAnalysis,
        computation_time_ms: computationTime
      }
    };

    logger.log('Path generation completed:', {
      items: selectedItems.length,
      hours: totalHours,
      weeks: goal.estimated_weeks
    });

    return generatedPath;
  }

  /**
   * Analyze skill gaps between current and target levels
   */
  private analyzeSkillGaps(
    assessment: AssessmentData,
    insights: CategoryInsight[],
    goal: LearningGoal
  ) {
    const currentAbility = assessment.current_ability_estimate || 0;
    const targetAbility = goal.target_irt_ability || DIFFICULTY_MAP[goal.target_augmentation_level].irt;
    const abilityGap = targetAbility - currentAbility;

    // Identify weak categories (below 60%)
    const weakCategories = insights
      .filter(c => c.percentage < 60 || c.strength_level === 'weak' || c.strength_level === 'developing')
      .sort((a, b) => a.percentage - b.percentage); // Weakest first

    // Focus categories from user's goal
    const focusCategories = insights.filter(c => goal.focus_category_ids.includes(c.category_id));

    // Priority categories: intersection of weak and focus, plus standalone weak
    const priorityCategories = [
      ...weakCategories.filter(wc => focusCategories.find(fc => fc.category_id === wc.category_id)),
      ...weakCategories.filter(wc => !focusCategories.find(fc => fc.category_id === wc.category_id))
    ].slice(0, 5); // Top 5 priorities

    return {
      currentAbility,
      targetAbility,
      abilityGap,
      weakCategories: weakCategories.map(c => ({
        id: c.category_id,
        name: c.category_name,
        score: c.percentage,
        gap: 100 - c.percentage
      })),
      priorityCategories: priorityCategories.map(c => ({
        id: c.category_id,
        name: c.category_name,
        score: c.percentage,
        priority: (100 - c.percentage) * (focusCategories.find(fc => fc.category_id === c.category_id) ? 1.5 : 1)
      })),
      focusAreas: goal.focus_skills || []
    };
  }

  /**
   * Fetch available learning resources from database
   */
  private async fetchAvailableResources(gapAnalysis: any) {
    logger.log('Fetching resources for gap analysis');

    // Fetch courses
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Fetch workshops (events)
    const { data: workshops } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('event_date', { ascending: true });

    // Fetch homework/assignments
    const { data: exercises } = await supabase
      .from('homework_assignments')
      .select('*')
      .eq('is_published', true);

    return {
      courses: courses || [],
      workshops: workshops || [],
      exercises: exercises || [],
      quizzes: [] // Can be added later
    };
  }

  /**
   * Select and sequence content based on gap analysis and goals
   */
  private selectAndSequenceContent(
    resources: any,
    gapAnalysis: any,
    goal: LearningGoal,
    assessment: AssessmentData
  ): PathItem[] {
    const items: PathItem[] = [];
    let currentWeek = 1;
    let weeklyHours = 0;
    const maxHoursPerWeek = goal.hours_per_week;

    // Phase 1: Foundation (Weeks 1-2) - Address weakest areas
    const foundationalItems = this.selectFoundationalContent(
      resources,
      gapAnalysis,
      assessment
    );

    foundationalItems.forEach(item => {
      if (weeklyHours + item.estimated_hours > maxHoursPerWeek) {
        currentWeek++;
        weeklyHours = 0;
      }
      item.week_number = currentWeek;
      weeklyHours += item.estimated_hours;
      items.push(item);
    });

    // Phase 2: Core Learning (Middle weeks) - Main courses and practice
    currentWeek++;
    weeklyHours = 0;

    const coreItems = this.selectCoreContent(
      resources,
      gapAnalysis,
      goal,
      assessment
    );

    coreItems.forEach(item => {
      if (weeklyHours + item.estimated_hours > maxHoursPerWeek) {
        currentWeek++;
        weeklyHours = 0;
      }
      item.week_number = currentWeek;
      weeklyHours += item.estimated_hours;
      items.push(item);
    });

    // Phase 3: Application (Final weeks) - Workshops, projects, validation
    if (goal.include_workshops && resources.workshops.length > 0) {
      currentWeek++;
      weeklyHours = 0;

      const practicalItems = this.selectPracticalContent(
        resources,
        gapAnalysis,
        goal
      );

      practicalItems.forEach(item => {
        if (weeklyHours + item.estimated_hours > maxHoursPerWeek) {
          currentWeek++;
          weeklyHours = 0;
        }
        item.week_number = currentWeek;
        weeklyHours += item.estimated_hours;
        items.push(item);
      });
    }

    // Phase 4: Reassessment
    items.push({
      item_type: 'assessment',
      item_id: 'reassessment',
      item_title: 'Progress Assessment',
      item_description: 'Retake the AI assessment to measure your improvement',
      difficulty_level: assessment.augmentation_level,
      irt_difficulty: assessment.current_ability_estimate,
      estimated_hours: 0.5,
      is_required: true,
      reason_for_inclusion: 'Validate learning progress and measure skill improvement',
      confidence_score: 1.0,
      week_number: currentWeek + 1
    });

    // Set prerequisites and order
    return items.map((item, index) => ({
      ...item,
      prerequisites: index > 0 ? [items[index - 1].item_id] : []
    }));
  }

  /**
   * Select foundational content for weak areas
   */
  private selectFoundationalContent(
    resources: any,
    gapAnalysis: any,
    assessment: AssessmentData
  ): PathItem[] {
    const items: PathItem[] = [];
    const weakestCategories = gapAnalysis.priorityCategories.slice(0, 2);

    weakestCategories.forEach(category => {
      // Find beginner/foundational courses for this category
      const relevantCourses = resources.courses
        .filter((c: any) => {
          const title = (c.title || '').toLowerCase();
          const desc = (c.description || '').toLowerCase();
          const categoryName = category.name.toLowerCase();
          return (title.includes(categoryName) || desc.includes(categoryName)) &&
                 (c.difficulty_level === 'beginner' || c.difficulty_level === 'foundational');
        })
        .slice(0, 1); // One course per weak category

      relevantCourses.forEach((course: any) => {
        items.push({
          item_type: 'course',
          item_id: course.id.toString(),
          item_title: course.title,
          item_description: course.description,
          difficulty_level: 'foundational',
          irt_difficulty: -1.0,
          estimated_hours: 3,
          is_required: true,
          skill_tags: [category.name],
          reason_for_inclusion: `Builds foundation in ${category.name} (current score: ${Math.round(category.score)}%)`,
          addresses_weaknesses: [category.name],
          confidence_score: 0.9
        });
      });
    });

    return items;
  }

  /**
   * Select core learning content
   */
  private selectCoreContent(
    resources: any,
    gapAnalysis: any,
    goal: LearningGoal,
    assessment: AssessmentData
  ): PathItem[] {
    const items: PathItem[] = [];

    gapAnalysis.priorityCategories.forEach((category: any, index: number) => {
      // Main course for this category
      const courses = resources.courses
        .filter((c: any) => {
          const title = (c.title || '').toLowerCase();
          const desc = (c.description || '').toLowerCase();
          const categoryName = category.name.toLowerCase();
          return title.includes(categoryName) || desc.includes(categoryName);
        })
        .slice(0, 1);

      courses.forEach((course: any) => {
        items.push({
          item_type: 'course',
          item_id: course.id.toString(),
          item_title: course.title,
          item_description: course.description,
          difficulty_level: 'applied',
          irt_difficulty: 0.0,
          estimated_hours: 5,
          is_required: true,
          skill_tags: [category.name],
          reason_for_inclusion: `Core learning for ${category.name}`,
          addresses_weaknesses: [category.name],
          confidence_score: 0.85
        });

        // Add practice exercise after course
        const exercises = resources.exercises
          .filter((e: any) => e.course_id === course.id)
          .slice(0, 1);

        exercises.forEach((exercise: any) => {
          items.push({
            item_type: 'exercise',
            item_id: exercise.id,
            item_title: exercise.title,
            item_description: exercise.description,
            difficulty_level: 'applied',
            estimated_hours: 2,
            is_required: true,
            skill_tags: [category.name],
            reason_for_inclusion: 'Reinforce learning with hands-on practice',
            addresses_weaknesses: [category.name],
            confidence_score: 0.8
          });
        });
      });
    });

    return items.slice(0, 6); // Limit core content
  }

  /**
   * Select practical application content (workshops, events)
   */
  private selectPracticalContent(
    resources: any,
    gapAnalysis: any,
    goal: LearningGoal
  ): PathItem[] {
    const items: PathItem[] = [];

    // Select relevant workshops
    const workshops = resources.workshops.slice(0, 2);
    workshops.forEach((workshop: any) => {
      items.push({
        item_type: 'workshop',
        item_id: workshop.id.toString(),
        item_title: workshop.title,
        item_description: workshop.description,
        difficulty_level: 'advanced',
        irt_difficulty: 1.0,
        estimated_hours: 4,
        is_required: false,
        reason_for_inclusion: 'Apply learning in practical, hands-on workshop',
        confidence_score: 0.75
      });
    });

    return items;
  }

  /**
   * Create milestones for the learning path
   */
  private createMilestones(items: PathItem[], goal: LearningGoal): Milestone[] {
    const totalItems = items.length;
    const milestonePoints = [0.25, 0.5, 0.75, 1.0]; // 25%, 50%, 75%, 100%

    return milestonePoints.map((point, index) => ({
      milestone_order: index + 1,
      milestone_title: this.getMilestoneTitle(point),
      milestone_description: this.getMilestoneDescription(point, goal),
      minimum_completion_percentage: point * 100,
      reward_badge: this.getMilestoneBadge(point),
      reward_points: Math.round(point * 100),
      reward_message: this.getMilestoneReward(point)
    }));
  }

  // Helper functions for milestones
  private getMilestoneTitle(point: number): string {
    const titles = {
      0.25: '🚀 Journey Begins',
      0.5: '💪 Halfway Hero',
      0.75: '🌟 Nearly There',
      1.0: '🏆 Goal Achieved!'
    };
    return titles[point as keyof typeof titles] || 'Milestone';
  }

  private getMilestoneDescription(point: number, goal: LearningGoal): string {
    const pct = Math.round(point * 100);
    return `Complete ${pct}% of your ${goal.goal_title} learning path`;
  }

  private getMilestoneBadge(point: number): string {
    const badges = {
      0.25: 'beginner',
      0.5: 'intermediate',
      0.75: 'advanced',
      1.0: 'expert'
    };
    return badges[point as keyof typeof badges] || 'achiever';
  }

  private getMilestoneReward(point: number): string {
    const messages = {
      0.25: 'Great start! Keep the momentum going! 🎉',
      0.5: 'You\'re halfway there! Amazing progress! 💪',
      0.75: 'Almost at your goal! One final push! 🌟',
      1.0: 'Congratulations! You\'ve achieved your learning goal! 🏆'
    };
    return messages[point as keyof typeof messages] || 'Well done!';
  }

  // Path metadata generators
  private generatePathTitle(goal: LearningGoal, gapAnalysis: any): string {
    const level = goal.target_augmentation_level;
    const focus = goal.focus_skills?.[0] || 'AI Skills';
    return `${level.charAt(0).toUpperCase() + level.slice(1)} ${focus} Mastery Path`;
  }

  private generatePathDescription(goal: LearningGoal, gapAnalysis: any, items: PathItem[]): string {
    const weeks = goal.estimated_weeks;
    const categories = gapAnalysis.priorityCategories.slice(0, 3).map((c: any) => c.name).join(', ');
    return `A personalized ${weeks}-week learning journey to master ${categories}. This path includes ${items.length} carefully selected resources to help you achieve ${goal.target_augmentation_level} level proficiency.`;
  }

  private mapLevelToDifficulty(level: string): string {
    const mapping: Record<string, string> = {
      beginner: 'foundational',
      intermediate: 'applied',
      advanced: 'advanced',
      expert: 'strategic'
    };
    return mapping[level] || 'foundational';
  }
}

// Export singleton instance
export const pathGenerator = new LearningPathGenerator();
