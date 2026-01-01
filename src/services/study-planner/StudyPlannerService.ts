/**
 * Study Planner Service
 *
 * Service for AI-powered study planning:
 * - Smart scheduling with optimal time detection
 * - Adaptive curriculum adjustments
 * - Learning style detection and adaptation
 * - Session tracking with productivity metrics
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface LearningStyleProfile {
  id: string;
  user_id: string;
  visual_score: number;
  auditory_score: number;
  reading_score: number;
  kinesthetic_score: number;
  preferred_content_format: string[];
  preferred_session_length: number;
  preferred_break_length: number;
  sessions_before_long_break: number;
  long_break_length: number;
  focus_duration_avg: number;
  distraction_frequency: string;
  preferred_pace: string;
}

export interface OptimalTime {
  id: string;
  day_of_week: number;
  morning_score: number;
  afternoon_score: number;
  evening_score: number;
  night_score: number;
  peak_hour: number | null;
  available_start: string | null;
  available_end: string | null;
  sample_count: number;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  learning_goal_id: string | null;
  course_id: string | null;
  start_date: string;
  end_date: string | null;
  total_hours_planned: number | null;
  hours_per_week: number;
  difficulty_adjustment: string;
  pace_adjustment: string;
  focus_topics: string[];
  skip_mastered: boolean;
  deep_dive_struggling: boolean;
  status: string;
  completion_percentage: number;
  is_ai_generated: boolean;
}

export interface StudyPlanItem {
  id: string;
  plan_id: string;
  content_type: string;
  content_id: string | null;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  duration_minutes: number;
  priority: string;
  order_index: number;
  is_mastered: boolean;
  needs_deep_dive: boolean;
  status: string;
  completed_at: string | null;
  actual_duration_minutes: number | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_item_id: string | null;
  title: string | null;
  content_type: string | null;
  content_id: string | null;
  started_at: string;
  ended_at: string | null;
  planned_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  active_duration_minutes: number | null;
  breaks_taken: number;
  total_break_minutes: number;
  focus_score: number | null;
  distraction_count: number;
  completion_percentage: number;
  productivity_score: number | null;
  energy_level_before: number | null;
  energy_level_after: number | null;
}

export interface StudyScheduleSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_type: string;
  is_flexible: boolean;
  is_active: boolean;
}

export interface PlanRecommendation {
  recommendation_type: string;
  title: string;
  description: string;
  priority: number;
  action_data: Record<string, unknown>;
}

export interface TodayScheduleItem {
  item_id: string;
  plan_title: string;
  item_title: string;
  content_type: string;
  scheduled_time: string | null;
  duration_minutes: number;
  priority: string;
  status: string;
}

class StudyPlannerServiceClass {
  // ===== Learning Style Profile =====

  /**
   * Get user's learning style profile
   */
  async getLearningStyle(userId: string): Promise<LearningStyleProfile | null> {
    try {
      const { data, error } = await supabase
        .from('learning_style_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (_error) {
      logger.error('Error fetching learning style:', _error);
      throw error;
    }
  }

  /**
   * Update learning style profile
   */
  async updateLearningStyle(userId: string, updates: Partial<LearningStyleProfile>): Promise<void> {
    try {
      const { error } = await supabase.from('learning_style_profiles').upsert(
        {
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

      if (error) throw error;
    } catch (_error) {
      logger.error('Error updating learning style:', _error);
      throw error;
    }
  }

  /**
   * Get dominant learning style
   */
  getDominantStyle(profile: LearningStyleProfile): string {
    const scores = {
      visual: profile.visual_score,
      auditory: profile.auditory_score,
      reading: profile.reading_score,
      kinesthetic: profile.kinesthetic_score,
    };

    return Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }

  // ===== Optimal Times =====

  /**
   * Get user's optimal study times
   */
  async getOptimalTimes(userId: string): Promise<OptimalTime[]> {
    try {
      const { data, error } = await supabase
        .from('user_optimal_times')
        .select('*')
        .eq('user_id', userId)
        .order('day_of_week');

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching optimal times:', _error);
      throw error;
    }
  }

  /**
   * Calculate optimal times from session history
   */
  async calculateOptimalTimes(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('calculate_optimal_times', {
        p_user_id: userId,
      });

      if (error) throw error;
    } catch (_error) {
      logger.error('Error calculating optimal times:', _error);
      throw error;
    }
  }

  /**
   * Get today's peak hour
   */
  async getTodaysPeakHour(userId: string): Promise<number | null> {
    try {
      const dayOfWeek = new Date().getDay();
      const { data, error } = await supabase
        .from('user_optimal_times')
        .select('peak_hour')
        .eq('user_id', userId)
        .eq('day_of_week', dayOfWeek)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.peak_hour || null;
    } catch (_error) {
      logger.error('Error fetching peak hour:', _error);
      return null;
    }
  }

  // ===== Study Plans =====

  /**
   * Get user's study plans
   */
  async getStudyPlans(userId: string, status?: string): Promise<StudyPlan[]> {
    try {
      let query = supabase
        .from('user_study_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching study plans:', _error);
      throw error;
    }
  }

  /**
   * Get a single study plan with items
   */
  async getStudyPlan(planId: string): Promise<{
    plan: StudyPlan;
    items: StudyPlanItem[];
  } | null> {
    try {
      const [planResult, itemsResult] = await Promise.all([
        supabase.from('user_study_plans').select('*').eq('id', planId).single(),
        supabase
          .from('study_plan_items')
          .select('*')
          .eq('plan_id', planId)
          .order('scheduled_date')
          .order('order_index'),
      ]);

      if (planResult.error) throw planResult.error;
      if (itemsResult.error) throw itemsResult.error;

      return {
        plan: planResult.data,
        items: itemsResult.data || [],
      };
    } catch (_error) {
      logger.error('Error fetching study plan:', _error);
      throw error;
    }
  }

  /**
   * Create a new study plan
   */
  async createStudyPlan(userId: string, plan: Partial<StudyPlan>): Promise<StudyPlan> {
    try {
      const { data, error } = await supabase
        .from('user_study_plans')
        .insert({
          user_id: userId,
          title: plan.title || 'New Study Plan',
          description: plan.description,
          learning_goal_id: plan.learning_goal_id,
          course_id: plan.course_id,
          start_date: plan.start_date || new Date().toISOString().split('T')[0],
          end_date: plan.end_date,
          hours_per_week: plan.hours_per_week || 5,
          total_hours_planned: plan.total_hours_planned,
          difficulty_adjustment: plan.difficulty_adjustment || 'auto',
          pace_adjustment: plan.pace_adjustment || 'auto',
          focus_topics: plan.focus_topics || [],
          skip_mastered: plan.skip_mastered ?? true,
          deep_dive_struggling: plan.deep_dive_struggling ?? true,
          is_ai_generated: plan.is_ai_generated || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (_error) {
      logger.error('Error creating study plan:', _error);
      throw error;
    }
  }

  /**
   * Generate AI study plan
   */
  async generateAIStudyPlan(
    userId: string,
    title: string,
    options: {
      goalId?: string;
      courseId?: string;
      startDate?: string;
      hoursPerWeek?: number;
      durationWeeks?: number;
    } = {}
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_study_plan', {
        p_user_id: userId,
        p_title: title,
        p_goal_id: options.goalId || null,
        p_course_id: options.courseId || null,
        p_start_date: options.startDate || new Date().toISOString().split('T')[0],
        p_hours_per_week: options.hoursPerWeek || 5,
        p_duration_weeks: options.durationWeeks || 4,
      });

      if (error) throw error;
      return data;
    } catch (_error) {
      logger.error('Error generating AI study plan:', _error);
      throw error;
    }
  }

  /**
   * Update study plan
   */
  async updateStudyPlan(planId: string, updates: Partial<StudyPlan>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_study_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId);

      if (error) throw error;
    } catch (_error) {
      logger.error('Error updating study plan:', _error);
      throw error;
    }
  }

  /**
   * Delete study plan
   */
  async deleteStudyPlan(planId: string): Promise<void> {
    try {
      const { error } = await supabase.from('user_study_plans').delete().eq('id', planId);

      if (error) throw error;
    } catch (_error) {
      logger.error('Error deleting study plan:', _error);
      throw error;
    }
  }

  // ===== Study Plan Items =====

  /**
   * Add item to study plan
   */
  async addPlanItem(planId: string, item: Partial<StudyPlanItem>): Promise<StudyPlanItem> {
    try {
      const { data, error } = await supabase
        .from('study_plan_items')
        .insert({
          plan_id: planId,
          content_type: item.content_type || 'custom',
          content_id: item.content_id,
          title: item.title || 'Study Item',
          description: item.description,
          scheduled_date: item.scheduled_date,
          scheduled_start_time: item.scheduled_start_time,
          scheduled_end_time: item.scheduled_end_time,
          duration_minutes: item.duration_minutes || 30,
          priority: item.priority || 'medium',
          order_index: item.order_index || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (_error) {
      logger.error('Error adding plan item:', _error);
      throw error;
    }
  }

  /**
   * Update plan item
   */
  async updatePlanItem(itemId: string, updates: Partial<StudyPlanItem>): Promise<void> {
    try {
      const { error } = await supabase
        .from('study_plan_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (_error) {
      logger.error('Error updating plan item:', _error);
      throw error;
    }
  }

  /**
   * Delete plan item
   */
  async deletePlanItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase.from('study_plan_items').delete().eq('id', itemId);

      if (error) throw error;
    } catch (_error) {
      logger.error('Error deleting plan item:', _error);
      throw error;
    }
  }

  // ===== Study Sessions =====

  /**
   * Start a new study session
   */
  async startSession(
    userId: string,
    options: {
      planId?: string;
      planItemId?: string;
      title?: string;
      contentType?: string;
      contentId?: string;
      plannedDuration?: number;
      energyLevel?: number;
    } = {}
  ): Promise<StudySession> {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          plan_id: options.planId,
          plan_item_id: options.planItemId,
          title: options.title,
          content_type: options.contentType,
          content_id: options.contentId,
          planned_duration_minutes: options.plannedDuration,
          energy_level_before: options.energyLevel,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (_error) {
      logger.error('Error starting session:', _error);
      throw error;
    }
  }

  /**
   * Complete a study session
   */
  async completeSession(
    sessionId: string,
    options: {
      completionPercentage?: number;
      productivityScore?: number;
      energyLevel?: number;
      notes?: string;
    } = {}
  ): Promise<{
    session_id: string;
    duration_minutes: number;
    streak_bonus: boolean;
  }> {
    try {
      const { data, error } = await supabase.rpc('complete_study_session', {
        p_session_id: sessionId,
        p_completion_percentage: options.completionPercentage || 100,
        p_productivity_score: options.productivityScore,
        p_notes: options.notes,
      });

      if (error) throw error;

      // Update energy level after if provided
      if (options.energyLevel) {
        await supabase
          .from('study_sessions')
          .update({ energy_level_after: options.energyLevel })
          .eq('id', sessionId);
      }

      return (
        data?.[0] || {
          session_id: sessionId,
          duration_minutes: 0,
          streak_bonus: false,
        }
      );
    } catch (_error) {
      logger.error('Error completing session:', _error);
      throw error;
    }
  }

  /**
   * Record a break in session
   */
  async recordBreak(sessionId: string, breakMinutes: number): Promise<void> {
    try {
      const { data: session, error: fetchError } = await supabase
        .from('study_sessions')
        .select('breaks_taken, total_break_minutes')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('study_sessions')
        .update({
          breaks_taken: (session.breaks_taken || 0) + 1,
          total_break_minutes: (session.total_break_minutes || 0) + breakMinutes,
          paused_at: null, // End pause
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (_error) {
      logger.error('Error recording break:', _error);
      throw error;
    }
  }

  /**
   * Get recent sessions
   */
  async getRecentSessions(userId: string, limit: number = 10): Promise<StudySession[]> {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching recent sessions:', _error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(
    userId: string,
    days: number = 7
  ): Promise<{
    totalSessions: number;
    totalMinutes: number;
    avgProductivity: number;
    avgSessionLength: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('study_sessions')
        .select('actual_duration_minutes, active_duration_minutes, productivity_score')
        .eq('user_id', userId)
        .gte('started_at', startDate.toISOString())
        .not('ended_at', 'is', null);

      if (error) throw error;

      const sessions = data || [];
      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce(
        (sum, s) => sum + (s.active_duration_minutes || s.actual_duration_minutes || 0),
        0
      );
      const productivityScores = sessions
        .filter(s => s.productivity_score !== null)
        .map(s => s.productivity_score!);
      const avgProductivity =
        productivityScores.length > 0
          ? Math.round(productivityScores.reduce((a, b) => a + b, 0) / productivityScores.length)
          : 0;
      const avgSessionLength = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

      return {
        totalSessions,
        totalMinutes,
        avgProductivity,
        avgSessionLength,
      };
    } catch (_error) {
      logger.error('Error fetching session stats:', _error);
      throw error;
    }
  }

  // ===== Study Schedule =====

  /**
   * Get user's study schedule
   */
  async getStudySchedule(userId: string): Promise<StudyScheduleSlot[]> {
    try {
      const { data, error } = await supabase
        .from('user_study_schedule')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching study schedule:', _error);
      throw error;
    }
  }

  /**
   * Add schedule slot
   */
  async addScheduleSlot(
    userId: string,
    slot: Partial<StudyScheduleSlot>
  ): Promise<StudyScheduleSlot> {
    try {
      const { data, error } = await supabase
        .from('user_study_schedule')
        .insert({
          user_id: userId,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          session_type: slot.session_type || 'focused',
          is_flexible: slot.is_flexible || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (_error) {
      logger.error('Error adding schedule slot:', _error);
      throw error;
    }
  }

  /**
   * Remove schedule slot
   */
  async removeScheduleSlot(slotId: string): Promise<void> {
    try {
      const { error } = await supabase.from('user_study_schedule').delete().eq('id', slotId);

      if (error) throw error;
    } catch (_error) {
      logger.error('Error removing schedule slot:', _error);
      throw error;
    }
  }

  // ===== Recommendations =====

  /**
   * Get study plan recommendations
   */
  async getRecommendations(userId: string): Promise<PlanRecommendation[]> {
    try {
      const { data, error } = await supabase.rpc('get_plan_recommendations', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching recommendations:', _error);
      throw error;
    }
  }

  /**
   * Get today's schedule
   */
  async getTodaysSchedule(userId: string): Promise<TodayScheduleItem[]> {
    try {
      const { data, error } = await supabase.rpc('get_todays_schedule', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error("Error fetching today's schedule:", _error);
      throw error;
    }
  }

  // ===== Dashboard Summary =====

  /**
   * Get study planner dashboard summary
   */
  async getDashboardSummary(userId: string): Promise<{
    learningStyle: LearningStyleProfile | null;
    optimalTimes: OptimalTime[];
    activePlans: StudyPlan[];
    todaysSchedule: TodayScheduleItem[];
    recentSessions: StudySession[];
    recommendations: PlanRecommendation[];
    stats: {
      totalSessions: number;
      totalMinutes: number;
      avgProductivity: number;
      avgSessionLength: number;
    };
  }> {
    try {
      const [
        learningStyle,
        optimalTimes,
        activePlans,
        todaysSchedule,
        recentSessions,
        recommendations,
        stats,
      ] = await Promise.all([
        this.getLearningStyle(userId),
        this.getOptimalTimes(userId),
        this.getStudyPlans(userId, 'active'),
        this.getTodaysSchedule(userId),
        this.getRecentSessions(userId, 5),
        this.getRecommendations(userId),
        this.getSessionStats(userId, 7),
      ]);

      return {
        learningStyle,
        optimalTimes,
        activePlans,
        todaysSchedule,
        recentSessions,
        recommendations,
        stats,
      };
    } catch (_error) {
      logger.error('Error fetching dashboard summary:', _error);
      throw error;
    }
  }
}

export const StudyPlannerService = new StudyPlannerServiceClass();
