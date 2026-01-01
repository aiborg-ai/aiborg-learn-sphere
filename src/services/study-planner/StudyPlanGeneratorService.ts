/**
 * Study Plan Generator Service
 * AI-powered personalized study plan generation
 * Creates structured weekly schedules based on goals, availability, and learning style
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { GoalPredictionService } from '../analytics/GoalPredictionService';
import { GapAnalysisService } from '../learning-path/GapAnalysisService';
import { ContentSequencingService } from '../learning-path/ContentSequencingService';
import { addDays, addWeeks, startOfDay } from 'date-fns';

export interface StudyPlanInput {
  user_id: string;
  goal_id?: string; // Optional: link to specific learning goal
  target_skills?: string[]; // Skills to focus on
  target_categories?: string[]; // Assessment categories to improve
  weeks_duration: number;
  hours_per_week: number;
  available_days?: string[]; // ['monday', 'tuesday', ...] or null for all days
  preferred_time?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  difficulty_preference?: 'comfortable' | 'challenging' | 'adaptive';
  include_review_sessions?: boolean;
}

export interface DailyTask {
  task_id: string;
  task_type: 'course' | 'exercise' | 'quiz' | 'review' | 'assessment' | 'reading';
  title: string;
  description?: string;
  content_id?: string; // Course, exercise, or quiz ID
  estimated_minutes: number;
  difficulty_level?: string;
  topics?: string[];
  completed: boolean;
  completed_at?: string;
  order_index: number;
}

export interface WeeklySchedule {
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  focus_topics: string[];
  daily_tasks: Record<string, DailyTask[]>; // { 'monday': [...], 'tuesday': [...] }
  milestone?: {
    title: string;
    target_completion: number; // percentage
    reward?: string;
  };
}

export interface GeneratedStudyPlan {
  id: string;
  user_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  total_weeks: number;
  total_hours: number;
  weekly_schedules: WeeklySchedule[];
  completion_percentage: number;
  status: 'active' | 'completed' | 'paused';
  ai_rationale: string; // Explanation of how the plan was structured
  created_at: string;
}

export class StudyPlanGeneratorService {
  /**
   * Generate a personalized study plan using AI
   */
  static async generateStudyPlan(input: StudyPlanInput): Promise<GeneratedStudyPlan> {
    try {
      logger.info('Generating study plan', {
        userId: input.user_id,
        duration: input.weeks_duration,
      });

      // Step 1: Gather user context
      const context = await this.gatherUserContext(input.user_id, input.goal_id);

      // Step 2: Perform gap analysis
      const skillGaps = await this.analyzeSkillGaps(input.user_id, input.target_categories);

      // Step 3: Select and sequence content
      const content = await this.selectContent(input, skillGaps);

      // Step 4: Distribute tasks across schedule
      const weeklySchedules = await this.distributeTasksAcrossWeeks(input, content);

      // Step 5: Generate AI rationale
      const aiRationale = await this.generateAIRationale(
        input,
        context,
        skillGaps,
        weeklySchedules
      );

      // Step 6: Save to database
      const studyPlan = await this.saveStudyPlan(input, weeklySchedules, aiRationale);

      logger.info('Study plan generated successfully', { planId: studyPlan.id });
      return studyPlan;
    } catch (_error) {
      logger.error('Error generating study plan:', _error);
      throw new Error('Failed to generate study plan');
    }
  }

  /**
   * Gather comprehensive user context
   */
  private static async gatherUserContext(userId: string, goalId?: string) {
    const { data: context, error } = await supabase.rpc('get_user_study_context', {
      p_user_id: userId,
    });

    if (error) {
      logger.error('Error fetching user context:', error);
      return null;
    }

    // Add goal information if specified
    if (goalId) {
      const goal = await GoalPredictionService.getUserGoals(userId);
      const specificGoal = goal.find(g => g.id === goalId);
      return { ...context, selected_goal: specificGoal };
    }

    return context;
  }

  /**
   * Analyze skill gaps for targeted learning
   */
  private static async analyzeSkillGaps(userId: string, targetCategories?: string[]) {
    try {
      // If specific categories provided, analyze those
      if (targetCategories && targetCategories.length > 0) {
        const gaps = [];
        for (const category of targetCategories) {
          const gap = await GapAnalysisService.analyzeSkillGap(userId, category);
          if (gap) gaps.push(gap);
        }
        return gaps;
      }

      // Otherwise, get all skill gaps
      return await GapAnalysisService.getAllSkillGaps(userId);
    } catch (_error) {
      logger.error('Error analyzing skill gaps:', _error);
      return [];
    }
  }

  /**
   * Select appropriate content based on gaps and preferences
   */
  private static async selectContent(
    input: StudyPlanInput,
    skillGaps: Array<{
      category: string;
      priority?: number;
      current_level?: string;
      target_level?: string;
      current_ability?: number;
    }>
  ) {
    const content: Array<{
      type: string;
      id: string;
      title: string;
      estimated_hours: number;
      difficulty: string;
      topics: string[];
      priority: number;
    }> = [];

    try {
      // For each skill gap, find relevant content
      for (const gap of skillGaps) {
        // Get courses
        const { data: courses } = await supabase
          .from('courses')
          .select('*')
          .contains('topics', [gap.category])
          .eq('difficulty_level', this.mapDifficultyPreference(input.difficulty_preference, gap))
          .limit(3);

        if (courses) {
          content.push(
            ...courses.map(c => ({
              type: 'course',
              id: c.id,
              title: c.title,
              estimated_hours: c.estimated_hours || 5,
              difficulty: c.difficulty_level,
              topics: c.topics,
              priority: gap.priority || 5,
            }))
          );
        }

        // Get exercises
        const { data: exercises } = await supabase
          .from('exercises')
          .select('*')
          .contains('topic_tags', [gap.category])
          .eq('difficulty_level', this.mapDifficultyPreference(input.difficulty_preference, gap))
          .limit(5);

        if (exercises) {
          content.push(
            ...exercises.map(e => ({
              type: 'exercise',
              id: e.id,
              title: e.title,
              estimated_hours: (e.estimated_minutes || 30) / 60,
              difficulty: e.difficulty_level,
              topics: e.topic_tags,
              priority: gap.priority || 5,
            }))
          );
        }
      }

      // Sort by priority and difficulty
      return content.sort((a, b) => b.priority - a.priority);
    } catch (_error) {
      logger.error('Error selecting content:', _error);
      return [];
    }
  }

  /**
   * Map difficulty preference to actual difficulty level
   */
  private static mapDifficultyPreference(
    preference: string | undefined,
    gap: { current_level?: string; target_level?: string; current_ability?: number }
  ): string {
    if (preference === 'comfortable') {
      return gap.current_level || 'beginner';
    } else if (preference === 'challenging') {
      return gap.target_level || 'advanced';
    }
    // 'adaptive' - choose based on current ability
    const ability = gap.current_ability || 0;
    if (ability > 1) return 'advanced';
    if (ability > 0) return 'intermediate';
    return 'beginner';
  }

  /**
   * Distribute tasks across weeks and days
   */
  private static async distributeTasksAcrossWeeks(
    input: StudyPlanInput,
    content: Array<{
      type: string;
      id: string;
      title: string;
      estimated_hours: number;
      difficulty: string;
      topics: string[];
      priority: number;
    }>
  ): Promise<WeeklySchedule[]> {
    const weeklySchedules: WeeklySchedule[] = [];
    const startDate = startOfDay(new Date());
    const availableDays = input.available_days || [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    const hoursPerDay = input.hours_per_week / availableDays.length;
    const minutesPerDay = hoursPerDay * 60;

    // Sequence content using existing service
    const sequencedContent = ContentSequencingService.sequenceContent(content);

    let contentIndex = 0;

    for (let weekNum = 1; weekNum <= input.weeks_duration; weekNum++) {
      const weekStartDate = addWeeks(startDate, weekNum - 1);
      const weekEndDate = addDays(weekStartDate, 6);

      const dailyTasks: Record<string, DailyTask[]> = {};
      const focusTopics = new Set<string>();

      // Distribute content across available days
      for (const day of availableDays) {
        const dayTasks: DailyTask[] = [];
        let dayMinutesRemaining = minutesPerDay;
        let orderIndex = 0;

        // Fill the day with tasks
        while (dayMinutesRemaining > 15 && contentIndex < sequencedContent.length) {
          const item = sequencedContent[contentIndex];
          const estimatedMinutes = Math.min(item.estimated_hours * 60, dayMinutesRemaining);

          if (estimatedMinutes < 15) {
            // Not enough time for this task, skip to next day
            break;
          }

          dayTasks.push({
            task_id: `${item.type}-${item.id}-${weekNum}-${day}`,
            task_type: item.type as DailyTask['task_type'],
            title: item.title,
            content_id: item.id,
            estimated_minutes: Math.round(estimatedMinutes),
            difficulty_level: item.difficulty,
            topics: item.topics,
            completed: false,
            order_index: orderIndex++,
          });

          // Track focus topics
          if (item.topics) {
            item.topics.forEach((topic: string) => focusTopics.add(topic));
          }

          dayMinutesRemaining -= estimatedMinutes;

          // If we fully allocated this content, move to next
          if (estimatedMinutes >= item.estimated_hours * 60) {
            contentIndex++;
          } else {
            // Partial allocation, reduce remaining time for this content
            sequencedContent[contentIndex].estimated_hours -= estimatedMinutes / 60;
          }
        }

        // Add review session if enabled and it's the last day of the week
        if (input.include_review_sessions && day === availableDays[availableDays.length - 1]) {
          dayTasks.push({
            task_id: `review-${weekNum}-${day}`,
            task_type: 'review',
            title: `Week ${weekNum} Review`,
            description: `Review this week's topics: ${Array.from(focusTopics).join(', ')}`,
            estimated_minutes: 30,
            completed: false,
            order_index: orderIndex++,
          });
        }

        dailyTasks[day] = dayTasks;
      }

      // Calculate milestone for this week
      const weekProgress = (weekNum / input.weeks_duration) * 100;
      const milestone =
        weekNum % 2 === 0
          ? {
              title: `Week ${weekNum} Checkpoint`,
              target_completion: Math.round(weekProgress),
              reward:
                weekNum === input.weeks_duration ? 'Course completion certificate' : undefined,
            }
          : undefined;

      weeklySchedules.push({
        week_number: weekNum,
        week_start_date: weekStartDate.toISOString(),
        week_end_date: weekEndDate.toISOString(),
        total_hours: input.hours_per_week,
        focus_topics: Array.from(focusTopics),
        daily_tasks: dailyTasks,
        milestone,
      });
    }

    return weeklySchedules;
  }

  /**
   * Generate AI rationale for the study plan
   */
  private static async generateAIRationale(
    input: StudyPlanInput,
    context: unknown,
    skillGaps: Array<{ category: string }>,
    weeklySchedules: WeeklySchedule[]
  ): Promise<string> {
    const gapSummary = skillGaps
      .slice(0, 3)
      .map(g => g.category)
      .join(', ');
    const totalTasks = weeklySchedules.reduce(
      (sum, week) =>
        sum + Object.values(week.daily_tasks).reduce((daySum, tasks) => daySum + tasks.length, 0),
      0
    );

    return `This ${input.weeks_duration}-week study plan is personalized for your learning goals and current skill level.

**Key Focus Areas:** ${gapSummary || 'General skill development'}

**Plan Structure:**
- ${input.hours_per_week} hours per week across ${input.available_days?.length || 7} days
- ${totalTasks} total learning activities
- ${weeklySchedules.filter(w => w.milestone).length} milestone checkpoints
- Difficulty level: ${input.difficulty_preference || 'Adaptive to your progress'}

**Learning Approach:**
The plan progressively builds on foundational concepts, with ${input.include_review_sessions ? 'weekly review sessions' : 'continuous learning'} to reinforce retention. Content is sequenced to ensure prerequisites are met before advancing to complex topics.`;
  }

  /**
   * Save study plan to database
   */
  private static async saveStudyPlan(
    input: StudyPlanInput,
    weeklySchedules: WeeklySchedule[],
    aiRationale: string
  ): Promise<GeneratedStudyPlan> {
    const startDate = new Date();
    const endDate = addWeeks(startDate, input.weeks_duration);

    const { data, error } = await supabase
      .from('ai_study_plans')
      .insert({
        user_id: input.user_id,
        learning_goal_id: input.goal_id,
        name: `${input.weeks_duration}-Week Study Plan`,
        plan_data: {
          weekly_schedules: weeklySchedules,
          input_parameters: input,
          ai_rationale: aiRationale,
        },
        start_date: startDate.toISOString(),
        target_date: endDate.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      logger.error('Error saving study plan:', error);
      throw new Error('Failed to save study plan');
    }

    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      description: aiRationale,
      start_date: data.start_date,
      end_date: data.target_date,
      total_weeks: input.weeks_duration,
      total_hours: input.hours_per_week * input.weeks_duration,
      weekly_schedules: weeklySchedules,
      completion_percentage: data.completion_percentage || 0,
      status: data.status,
      ai_rationale: aiRationale,
      created_at: data.created_at,
    };
  }

  /**
   * Mark a task as completed
   */
  static async completeTask(userId: string, planId: string, taskId: string): Promise<boolean> {
    try {
      // Fetch current plan
      const { data: plan, error: fetchError } = await supabase
        .from('ai_study_plans')
        .select('plan_data, completion_percentage')
        .eq('id', planId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !plan) {
        throw new Error('Plan not found');
      }

      // Update task in plan_data
      const planData = plan.plan_data as { weekly_schedules?: WeeklySchedule[] };
      const weeklySchedules: WeeklySchedule[] = planData.weekly_schedules || [];

      let taskFound = false;
      for (const week of weeklySchedules) {
        for (const day in week.daily_tasks) {
          const tasks = week.daily_tasks[day];
          const task = tasks.find(t => t.task_id === taskId);
          if (task) {
            task.completed = true;
            task.completed_at = new Date().toISOString();
            taskFound = true;
            break;
          }
        }
        if (taskFound) break;
      }

      if (!taskFound) {
        throw new Error('Task not found');
      }

      // Recalculate completion percentage
      const totalTasks = weeklySchedules.reduce(
        (sum, week) =>
          sum + Object.values(week.daily_tasks).reduce((daySum, tasks) => daySum + tasks.length, 0),
        0
      );
      const completedTasks = weeklySchedules.reduce(
        (sum, week) =>
          sum +
          Object.values(week.daily_tasks).reduce(
            (daySum, tasks) => daySum + tasks.filter(t => t.completed).length,
            0
          ),
        0
      );
      const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

      // Update plan in database
      const { error: updateError } = await supabase
        .from('ai_study_plans')
        .update({
          plan_data: { ...planData, weekly_schedules: weeklySchedules },
          completion_percentage: completionPercentage,
        })
        .eq('id', planId)
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      logger.info('Task completed', { userId, planId, taskId, completion: completionPercentage });
      return true;
    } catch (_error) {
      logger.error('Error completing task:', _error);
      return false;
    }
  }

  /**
   * Get active study plan for user
   */
  static async getActiveStudyPlan(userId: string): Promise<GeneratedStudyPlan | null> {
    try {
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

      const planData = data.plan_data as {
        ai_rationale?: string;
        input_parameters?: StudyPlanInput;
        weekly_schedules?: WeeklySchedule[];
      };

      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        description: planData.ai_rationale || '',
        start_date: data.start_date,
        end_date: data.target_date,
        total_weeks: planData.input_parameters?.weeks_duration || 0,
        total_hours:
          planData.input_parameters?.hours_per_week * planData.input_parameters?.weeks_duration ||
          0,
        weekly_schedules: planData.weekly_schedules || [],
        completion_percentage: data.completion_percentage || 0,
        status: data.status,
        ai_rationale: planData.ai_rationale || '',
        created_at: data.created_at,
      };
    } catch (_error) {
      logger.error('Error fetching active study plan:', _error);
      return null;
    }
  }
}
