/**
 * Study Plan Adjustment Service
 *
 * Handles dynamic modifications to study plans based on feedback loop triggers.
 * Supports difficulty adjustment, remedial content insertion, and content resequencing.
 *
 * Key operations:
 * - reduceDifficulty(userId, severity) - Downgrade task difficulty levels
 * - increaseDifficulty(userId, severity) - Upgrade when performing well
 * - addRemedialContent(userId, categories) - Insert foundational content
 * - resequenceContent(userId) - Reorder by difficulty relative to ability
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  AdjustmentSeverity,
  PlanAdjustmentRequest,
  PlanAdjustmentResult,
  PlanChange,
  DifficultyAdjustmentConfig,
  DEFAULT_DIFFICULTY_CONFIG,
} from './FeedbackLoopTypes';

interface StudyPlanTask {
  task_id: string;
  title: string;
  difficulty_level: string;
  estimated_minutes: number;
  task_type: string;
  content_id?: string;
  completed: boolean;
  order_index: number;
}

interface StudyPlan {
  id: string;
  user_id: string;
  name: string;
  weekly_schedules: WeeklySchedule[];
  current_week: number;
  target_ability: number;
}

interface WeeklySchedule {
  week_number: number;
  daily_tasks: Record<string, StudyPlanTask[]>;
  focus_topics: string[];
}

export class StudyPlanAdjustmentService {
  private difficultyConfig: DifficultyAdjustmentConfig;

  constructor(config: Partial<DifficultyAdjustmentConfig> = {}) {
    this.difficultyConfig = { ...DEFAULT_DIFFICULTY_CONFIG, ...config };
  }

  /**
   * Reduce difficulty of upcoming tasks
   */
  async reduceDifficulty(
    userId: string,
    severity: AdjustmentSeverity,
    _categories?: string[]
  ): Promise<PlanAdjustmentResult> {
    try {
      const plan = await this.getActiveStudyPlan(userId);
      if (!plan) {
        return this.createFailureResult('No active study plan found');
      }

      const stepSize = this.difficultyConfig.stepSizes[severity];
      const changes: PlanChange[] = [];
      let tasksAffected = 0;

      // Get upcoming tasks (not completed)
      const upcomingTasks = this.getUpcomingTasks(plan);

      for (const task of upcomingTasks) {
        // Skip if category filter doesn't match
        if (categories && categories.length > 0) {
          // Would need to check task category - simplified for now
        }

        const currentLevel = this.parseDifficultyLevel(task.difficulty_level);
        const newLevel = this.adjustDifficultyLevel(currentLevel, -stepSize);

        if (newLevel !== currentLevel) {
          const newLevelName = this.getDifficultyLevelName(newLevel);

          changes.push({
            type: 'difficulty_change',
            taskId: task.task_id,
            before: task.difficulty_level,
            after: newLevelName,
            reason: `Reduced due to ${severity} accuracy drop`,
          });

          task.difficulty_level = newLevelName;
          tasksAffected++;
        }
      }

      // Save changes to database
      await this.saveStudyPlanChanges(plan.id, plan.weekly_schedules);
      await this.logAdjustment(userId, plan.id, 'reduce_difficulty', severity, changes);

      logger.info('Difficulty reduced', { userId, tasksAffected, severity });

      return {
        success: true,
        adjustmentId: crypto.randomUUID(),
        tasksAffected,
        changes,
      };
    } catch (_error) {
      logger._error('Error reducing difficulty:', _error);
      return this.createFailureResult('Failed to reduce difficulty');
    }
  }

  /**
   * Increase difficulty of upcoming tasks
   */
  async increaseDifficulty(
    userId: string,
    severity: AdjustmentSeverity,
    _categories?: string[]
  ): Promise<PlanAdjustmentResult> {
    try {
      const plan = await this.getActiveStudyPlan(userId);
      if (!plan) {
        return this.createFailureResult('No active study plan found');
      }

      const stepSize = this.difficultyConfig.stepSizes[severity];
      const changes: PlanChange[] = [];
      let tasksAffected = 0;

      const upcomingTasks = this.getUpcomingTasks(plan);

      for (const task of upcomingTasks) {
        const currentLevel = this.parseDifficultyLevel(task.difficulty_level);
        const newLevel = this.adjustDifficultyLevel(currentLevel, stepSize);

        if (newLevel !== currentLevel) {
          const newLevelName = this.getDifficultyLevelName(newLevel);

          changes.push({
            type: 'difficulty_change',
            taskId: task.task_id,
            before: task.difficulty_level,
            after: newLevelName,
            reason: `Increased due to ${severity} performance improvement`,
          });

          task.difficulty_level = newLevelName;
          tasksAffected++;
        }
      }

      await this.saveStudyPlanChanges(plan.id, plan.weekly_schedules);
      await this.logAdjustment(userId, plan.id, 'increase_difficulty', severity, changes);

      logger.info('Difficulty increased', { userId, tasksAffected, severity });

      return {
        success: true,
        adjustmentId: crypto.randomUUID(),
        tasksAffected,
        changes,
      };
    } catch (_error) {
      logger._error('Error increasing difficulty:', _error);
      return this.createFailureResult('Failed to increase difficulty');
    }
  }

  /**
   * Add remedial content for struggling topics
   */
  async addRemedialContent(
    userId: string,
    categories: string[] = [],
    topics: string[] = []
  ): Promise<PlanAdjustmentResult> {
    try {
      const plan = await this.getActiveStudyPlan(userId);
      if (!plan) {
        return this.createFailureResult('No active study plan found');
      }

      const changes: PlanChange[] = [];
      let tasksAffected = 0;

      // Find foundational content for struggling categories/topics
      const { data: remedialContent } = await supabase
        .from('course_content')
        .select('id, title, content_type, duration_minutes, category')
        .in('category', categories.length > 0 ? categories : ['fundamentals'])
        .eq('difficulty_level', 'beginner')
        .order('order_index', { ascending: true })
        .limit(5);

      if (remedialContent && remedialContent.length > 0) {
        // Get current week's schedule
        const currentWeek = plan.weekly_schedules[plan.current_week - 1];
        if (!currentWeek) {
          return this.createFailureResult('Current week schedule not found');
        }

        // Add remedial tasks to the beginning of each remaining day
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const today = new Date().getDay();
        const remainingDays = days.slice(Math.max(0, today - 1));

        for (const content of remedialContent) {
          const targetDay = remainingDays[tasksAffected % remainingDays.length];
          const dayTasks = currentWeek.daily_tasks[targetDay] || [];

          const newTask: StudyPlanTask = {
            task_id: crypto.randomUUID(),
            title: `Review: ${content.title}`,
            difficulty_level: 'beginner',
            estimated_minutes: content.duration_minutes || 15,
            task_type: 'review',
            content_id: content.id,
            completed: false,
            order_index: 0, // Insert at beginning
          };

          // Shift existing tasks
          dayTasks.forEach(t => t.order_index++);
          dayTasks.unshift(newTask);
          currentWeek.daily_tasks[targetDay] = dayTasks;

          changes.push({
            type: 'task_added',
            taskId: newTask.task_id,
            before: null,
            after: newTask,
            reason: `Added remedial content for ${content.category}`,
          });

          tasksAffected++;
        }

        await this.saveStudyPlanChanges(plan.id, plan.weekly_schedules);
        await this.logAdjustment(userId, plan.id, 'add_remedial', 'moderate', changes);
      }

      logger.info('Remedial content added', { userId, tasksAffected, categories, topics });

      return {
        success: true,
        adjustmentId: crypto.randomUUID(),
        tasksAffected,
        changes,
      };
    } catch (_error) {
      logger._error('Error adding remedial content:', _error);
      return this.createFailureResult('Failed to add remedial content');
    }
  }

  /**
   * Resequence content based on current ability
   */
  async resequenceContent(userId: string): Promise<PlanAdjustmentResult> {
    try {
      const plan = await this.getActiveStudyPlan(userId);
      if (!plan) {
        return this.createFailureResult('No active study plan found');
      }

      // Get user's current ability
      const { data: assessment } = await supabase
        .from('user_ai_assessments')
        .select('current_ability')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const currentAbility = assessment?.current_ability || 0;
      const changes: PlanChange[] = [];
      let tasksAffected = 0;

      // Resequence tasks in current and future weeks
      for (let i = plan.current_week - 1; i < plan.weekly_schedules.length; i++) {
        const week = plan.weekly_schedules[i];

        for (const day of Object.keys(week.daily_tasks)) {
          const tasks = week.daily_tasks[day];
          const incompleteTasks = tasks.filter(t => !t.completed);
          const completedTasks = tasks.filter(t => t.completed);

          // Sort incomplete tasks by difficulty (easier first if struggling, harder first if excelling)
          incompleteTasks.sort((a, b) => {
            const diffA = this.parseDifficultyLevel(a.difficulty_level);
            const diffB = this.parseDifficultyLevel(b.difficulty_level);

            if (currentAbility < -0.5) {
              // Struggling: easier tasks first
              return diffA - diffB;
            } else if (currentAbility > 0.5) {
              // Excelling: harder tasks first (for challenge)
              return diffB - diffA;
            }
            // Neutral: maintain current order
            return a.order_index - b.order_index;
          });

          // Reassign order indices
          incompleteTasks.forEach((task, index) => {
            if (task.order_index !== index) {
              changes.push({
                type: 'task_reordered',
                taskId: task.task_id,
                before: task.order_index,
                after: index,
                reason: `Resequenced based on ability (${currentAbility.toFixed(2)})`,
              });
              task.order_index = index;
              tasksAffected++;
            }
          });

          // Reconstruct day's tasks
          week.daily_tasks[day] = [...completedTasks, ...incompleteTasks];
        }
      }

      if (tasksAffected > 0) {
        await this.saveStudyPlanChanges(plan.id, plan.weekly_schedules);
        await this.logAdjustment(userId, plan.id, 'resequence', 'mild', changes);
      }

      logger.info('Content resequenced', { userId, tasksAffected, currentAbility });

      return {
        success: true,
        adjustmentId: crypto.randomUUID(),
        tasksAffected,
        changes,
      };
    } catch (_error) {
      logger._error('Error resequencing content:', _error);
      return this.createFailureResult('Failed to resequence content');
    }
  }

  /**
   * Apply a generic adjustment request
   */
  async applyAdjustment(request: PlanAdjustmentRequest): Promise<PlanAdjustmentResult> {
    switch (request.action) {
      case 'reduce_difficulty':
        return this.reduceDifficulty(request.userId, request.severity, request.categories);

      case 'increase_difficulty':
        return this.increaseDifficulty(request.userId, request.severity, request.categories);

      case 'add_remedial':
        return this.addRemedialContent(request.userId, request.categories, request.topics);

      case 'resequence':
        return this.resequenceContent(request.userId);

      default:
        return this.createFailureResult(`Unknown adjustment action: ${request.action}`);
    }
  }

  /**
   * Get active study plan for user
   */
  private async getActiveStudyPlan(userId: string): Promise<StudyPlan | null> {
    const { data, error } = await supabase
      .from('ai_study_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      weekly_schedules: data.weekly_schedules || [],
      current_week: this.calculateCurrentWeek(data.start_date),
      target_ability: data.target_ability || 0,
    };
  }

  /**
   * Calculate current week number based on start date
   */
  private calculateCurrentWeek(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, diffWeeks + 1);
  }

  /**
   * Get upcoming (not completed) tasks from plan
   */
  private getUpcomingTasks(plan: StudyPlan): StudyPlanTask[] {
    const tasks: StudyPlanTask[] = [];

    for (let i = plan.current_week - 1; i < plan.weekly_schedules.length; i++) {
      const week = plan.weekly_schedules[i];
      if (!week) continue;

      for (const day of Object.keys(week.daily_tasks)) {
        const dayTasks = week.daily_tasks[day] || [];
        tasks.push(...dayTasks.filter(t => !t.completed));
      }
    }

    return tasks;
  }

  /**
   * Parse difficulty level to numeric value
   */
  private parseDifficultyLevel(level: string): number {
    const levels = this.difficultyConfig.levels;

    switch (level.toLowerCase()) {
      case 'beginner':
        return (levels.beginner.min + levels.beginner.max) / 2;
      case 'intermediate':
        return (levels.intermediate.min + levels.intermediate.max) / 2;
      case 'advanced':
        return (levels.advanced.min + levels.advanced.max) / 2;
      case 'expert':
        return (levels.expert.min + levels.expert.max) / 2;
      default:
        return 0;
    }
  }

  /**
   * Adjust difficulty level by step
   */
  private adjustDifficultyLevel(currentLevel: number, step: number): number {
    const newLevel = currentLevel + step;
    return Math.max(
      this.difficultyConfig.absoluteMin,
      Math.min(this.difficultyConfig.absoluteMax, newLevel)
    );
  }

  /**
   * Get difficulty level name from numeric value
   */
  private getDifficultyLevelName(level: number): string {
    const levels = this.difficultyConfig.levels;

    if (level <= levels.beginner.max) return 'beginner';
    if (level <= levels.intermediate.max) return 'intermediate';
    if (level <= levels.advanced.max) return 'advanced';
    return 'expert';
  }

  /**
   * Save study plan changes to database
   */
  private async saveStudyPlanChanges(
    planId: string,
    weeklySchedules: WeeklySchedule[]
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_study_plans')
      .update({
        weekly_schedules: weeklySchedules,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (error) {
      throw error;
    }
  }

  /**
   * Log adjustment to history table
   */
  private async logAdjustment(
    userId: string,
    planId: string,
    adjustmentType: string,
    severity: AdjustmentSeverity,
    changes: PlanChange[]
  ): Promise<void> {
    try {
      await supabase.from('plan_adjustment_history').insert({
        user_id: userId,
        plan_id: planId,
        adjustment_type: adjustmentType,
        severity,
        changes_applied: changes,
        tasks_affected: changes.length,
      });
    } catch (_error) {
      logger.warn('Failed to log adjustment history:', _error);
    }
  }

  /**
   * Create failure result
   */
  private createFailureResult(_reason: string): PlanAdjustmentResult {
    return {
      success: false,
      adjustmentId: '',
      tasksAffected: 0,
      changes: [],
    };
  }

  /**
   * Get adjustment history for user
   */
  async getAdjustmentHistory(userId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('plan_adjustment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching adjustment history:', error);
      return [];
    }

    return data;
  }
}

// Singleton instance
export const studyPlanAdjustmentService = new StudyPlanAdjustmentService();
