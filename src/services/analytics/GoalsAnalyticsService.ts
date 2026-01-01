/**
 * Goals Analytics Service
 *
 * Service for fetching and analyzing user goals:
 * - Learning goals (daily/weekly targets)
 * - Career goals (job role aspirations)
 * - Study plans (scheduled learning)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface LearningGoal {
  id: string;
  user_id: string;
  goal_type: 'daily_minutes' | 'daily_nuggets' | 'weekly_completions' | 'skill_mastery';
  target_value: number;
  current_progress: number;
  deadline: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface CareerGoal {
  id: string;
  user_id: string;
  target_role_id: string;
  target_role_name?: string;
  target_date: string | null;
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  progress_percentage: number;
  skills_required?: number;
  skills_achieved?: number;
  created_at: string;
}

export interface StudyPlanGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  learning_goal_id: string | null;
  start_date: string;
  end_date: string | null;
  total_hours_planned: number | null;
  hours_per_week: number;
  completion_percentage: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  is_ai_generated: boolean;
  created_at: string;
}

export interface GoalsSummary {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overallProgress: number;
  goalsOnTrack: number;
  goalsAtRisk: number;
  averageCompletionRate: number;
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  goal_type: 'learning' | 'career' | 'study_plan';
  title: string;
  target_value: number;
  current_value: number;
  deadline: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  daysRemaining: number | null;
}

class GoalsAnalyticsServiceClass {
  /**
   * Get all learning goals for a user
   */
  async getLearningGoals(userId: string): Promise<LearningGoal[]> {
    try {
      const { data, error } = await supabase
        .from('user_learning_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching learning goals:', _error);
      return [];
    }
  }

  /**
   * Get all career goals for a user
   */
  async getCareerGoals(userId: string): Promise<CareerGoal[]> {
    try {
      const { data, error } = await supabase
        .from('user_career_goals')
        .select(
          `
          *,
          job_role:target_role_id (
            title
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the job role name
      return (
        data?.map(goal => ({
          ...goal,
          target_role_name:
            (goal as { job_role?: { title?: string } }).job_role?.title || 'Unknown Role',
        })) || []
      );
    } catch (_error) {
      logger.error('Error fetching career goals:', _error);
      return [];
    }
  }

  /**
   * Get all study plans for a user
   */
  async getStudyPlans(userId: string): Promise<StudyPlanGoal[]> {
    try {
      const { data, error } = await supabase
        .from('user_study_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching study plans:', _error);
      return [];
    }
  }

  /**
   * Get summary statistics for all goals
   */
  async getGoalsSummary(userId: string): Promise<GoalsSummary> {
    try {
      const [learningGoals, careerGoals, studyPlans] = await Promise.all([
        this.getLearningGoals(userId),
        this.getCareerGoals(userId),
        this.getStudyPlans(userId),
      ]);

      const allGoals = [
        ...learningGoals.map(g => ({
          status: g.status,
          progress: (g.current_progress / g.target_value) * 100,
        })),
        ...careerGoals.map(g => ({
          status: g.is_active ? 'active' : 'completed',
          progress: g.progress_percentage,
        })),
        ...studyPlans.map(g => ({
          status: g.status,
          progress: g.completion_percentage,
        })),
      ];

      const totalGoals = allGoals.length;
      const activeGoals = allGoals.filter(
        g => g.status === 'active' || g.status === 'draft'
      ).length;
      const completedGoals = allGoals.filter(g => g.status === 'completed').length;

      const overallProgress = allGoals.reduce((sum, g) => sum + g.progress, 0) / (totalGoals || 1);

      const goalsOnTrack = allGoals.filter(g => g.progress >= 75).length;
      const goalsAtRisk = allGoals.filter(
        g => g.progress < 50 && (g.status === 'active' || g.status === 'draft')
      ).length;

      const activeGoalsList = allGoals.filter(g => g.status === 'active' || g.status === 'draft');
      const averageCompletionRate =
        activeGoalsList.reduce((sum, g) => sum + g.progress, 0) / (activeGoalsList.length || 1);

      return {
        totalGoals,
        activeGoals,
        completedGoals,
        overallProgress: Math.round(overallProgress),
        goalsOnTrack,
        goalsAtRisk,
        averageCompletionRate: Math.round(averageCompletionRate),
      };
    } catch (_error) {
      logger.error('Error fetching goals summary:', _error);
      return {
        totalGoals: 0,
        activeGoals: 0,
        completedGoals: 0,
        overallProgress: 0,
        goalsOnTrack: 0,
        goalsAtRisk: 0,
        averageCompletionRate: 0,
      };
    }
  }

  /**
   * Get goal milestones with deadline tracking
   */
  async getGoalMilestones(userId: string): Promise<GoalMilestone[]> {
    try {
      const [learningGoals, careerGoals, studyPlans] = await Promise.all([
        this.getLearningGoals(userId),
        this.getCareerGoals(userId),
        this.getStudyPlans(userId),
      ]);

      const milestones: GoalMilestone[] = [];
      const now = new Date();

      // Learning goal milestones
      learningGoals.forEach(goal => {
        const deadline = goal.deadline ? new Date(goal.deadline) : null;
        const daysRemaining = deadline
          ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        let status: 'pending' | 'in_progress' | 'completed' | 'overdue' = 'pending';
        if (goal.status === 'completed') {
          status = 'completed';
        } else if (deadline && daysRemaining !== null && daysRemaining < 0) {
          status = 'overdue';
        } else if (goal.current_progress > 0) {
          status = 'in_progress';
        }

        milestones.push({
          id: goal.id,
          goal_id: goal.id,
          goal_type: 'learning',
          title: this.formatGoalType(goal.goal_type),
          target_value: goal.target_value,
          current_value: goal.current_progress,
          deadline: goal.deadline,
          status,
          daysRemaining,
        });
      });

      // Career goal milestones
      careerGoals.forEach(goal => {
        const deadline = goal.target_date ? new Date(goal.target_date) : null;
        const daysRemaining = deadline
          ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        let status: 'pending' | 'in_progress' | 'completed' | 'overdue' = 'pending';
        if (!goal.is_active) {
          status = 'completed';
        } else if (deadline && daysRemaining !== null && daysRemaining < 0) {
          status = 'overdue';
        } else if (goal.progress_percentage > 0) {
          status = 'in_progress';
        }

        milestones.push({
          id: goal.id,
          goal_id: goal.id,
          goal_type: 'career',
          title: goal.target_role_name || 'Career Goal',
          target_value: 100,
          current_value: goal.progress_percentage,
          deadline: goal.target_date,
          status,
          daysRemaining,
        });
      });

      // Study plan milestones
      studyPlans
        .filter(plan => plan.status === 'active' || plan.status === 'completed')
        .forEach(plan => {
          const deadline = plan.end_date ? new Date(plan.end_date) : null;
          const daysRemaining = deadline
            ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          let status: 'pending' | 'in_progress' | 'completed' | 'overdue' = 'pending';
          if (plan.status === 'completed') {
            status = 'completed';
          } else if (deadline && daysRemaining !== null && daysRemaining < 0) {
            status = 'overdue';
          } else if (plan.completion_percentage > 0) {
            status = 'in_progress';
          }

          milestones.push({
            id: plan.id,
            goal_id: plan.id,
            goal_type: 'study_plan',
            title: plan.title,
            target_value: 100,
            current_value: plan.completion_percentage,
            deadline: plan.end_date,
            status,
            daysRemaining,
          });
        });

      // Sort by deadline (earliest first, null at end)
      return milestones.sort((a, b) => {
        if (a.deadline === null) return 1;
        if (b.deadline === null) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    } catch (_error) {
      logger.error('Error fetching goal milestones:', _error);
      return [];
    }
  }

  /**
   * Format goal type for display
   */
  private formatGoalType(goalType: string): string {
    const formats: Record<string, string> = {
      daily_minutes: 'Daily Learning Minutes',
      daily_nuggets: 'Daily Micro-Lessons',
      weekly_completions: 'Weekly Course Completions',
      skill_mastery: 'Skill Mastery',
    };
    return formats[goalType] || goalType;
  }

  /**
   * Update learning goal progress
   */
  async updateLearningGoalProgress(goalId: string, currentProgress: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_learning_goals')
        .update({
          current_progress: currentProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId);

      if (error) throw error;
    } catch (_error) {
      logger.error('Error updating learning goal progress:', _error);
      throw error;
    }
  }

  /**
   * Mark goal as completed
   */
  async completeGoal(
    goalId: string,
    goalType: 'learning' | 'career' | 'study_plan'
  ): Promise<void> {
    try {
      if (goalType === 'learning') {
        await supabase.from('user_learning_goals').update({ status: 'completed' }).eq('id', goalId);
      } else if (goalType === 'career') {
        await supabase
          .from('user_career_goals')
          .update({ is_active: false, progress_percentage: 100 })
          .eq('id', goalId);
      } else if (goalType === 'study_plan') {
        await supabase
          .from('user_study_plans')
          .update({ status: 'completed', completion_percentage: 100 })
          .eq('id', goalId);
      }
    } catch (_error) {
      logger.error('Error completing goal:', _error);
      throw error;
    }
  }
}

export const GoalsAnalyticsService = new GoalsAnalyticsServiceClass();
