/**
 * User Analytics Service
 * Provides comprehensive analytics data for individual user dashboards
 * Replaces simulated data with real database queries
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { startOfWeek, endOfWeek, subWeeks, format, parseISO } from 'date-fns';

export interface DateRange {
  start: string;
  end: string;
}

export interface WeeklyActivityData {
  week: string;
  studyTime: number; // minutes
  completedLessons: number;
  quizzesTaken: number;
  averageScore: number;
}

export interface CategoryDistribution {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface ProgressTrend {
  week: string;
  progress: number; // percentage
  coursesInProgress: number;
  coursesCompleted: number;
}

export interface SkillRadarData {
  skill: string;
  proficiency: number; // 0-100
  assessments: number;
  lastUpdated: string;
}

export interface StudyTimeByDay {
  day: string; // Monday, Tuesday, etc.
  hours: number;
  sessions: number;
}

export interface UserDashboardStats {
  totalStudyTime: number; // minutes
  completedCourses: number;
  currentStreak: number; // days
  longestStreak: number; // days
  averageScore: number; // percentage
  totalAssessments: number;
  certificatesEarned: number;
  achievementsCount: number;
}

export class UserAnalyticsService {
  /**
   * Get weekly activity data for the user
   * @param userId - User ID
   * @param weeks - Number of weeks to fetch (default: 6)
   */
  static async getUserWeeklyActivity(
    userId: string,
    weeks: number = 6
  ): Promise<WeeklyActivityData[]> {
    try {
      const weeklyData: WeeklyActivityData[] = [];
      const currentDate = new Date();

      // Generate data for each week
      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(currentDate, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(currentDate, i), { weekStartsOn: 1 });
        const weekLabel = format(weekStart, 'MMM d');

        // Fetch study time from user_progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('time_spent_minutes')
          .eq('user_id', userId)
          .gte('last_accessed', weekStart.toISOString())
          .lte('last_accessed', weekEnd.toISOString());

        if (progressError) {
          logger.error('Error fetching user progress:', progressError);
        }

        const studyTime =
          progressData?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) || 0;

        // Fetch completed lessons (course progress)
        const { data: completionsData, error: completionsError } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', userId)
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString())
          .not('completed_at', 'is', null);

        if (completionsError) {
          logger.error('Error fetching completions:', completionsError);
        }

        const completedLessons = completionsData?.length || 0;

        // Fetch quizzes taken
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quiz_attempts')
          .select('score')
          .eq('user_id', userId)
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString())
          .not('completed_at', 'is', null);

        if (quizzesError) {
          logger.error('Error fetching quizzes:', quizzesError);
        }

        const quizzesTaken = quizzesData?.length || 0;
        const averageScore =
          quizzesData && quizzesData.length > 0
            ? quizzesData.reduce((sum, q) => sum + (q.score || 0), 0) / quizzesData.length
            : 0;

        weeklyData.push({
          week: weekLabel,
          studyTime: Math.round(studyTime),
          completedLessons,
          quizzesTaken,
          averageScore: Math.round(averageScore),
        });
      }

      return weeklyData;
    } catch (_error) {
      logger._error('Error in getUserWeeklyActivity:', _error);
      return [];
    }
  }

  /**
   * Get category distribution for the user's enrolled courses
   */
  static async getUserCategoryDistribution(userId: string): Promise<CategoryDistribution[]> {
    try {
      // Fetch user enrollments with course categories
      const { data, error } = await supabase
        .from('enrollments')
        .select(
          `
          id,
          courses (
            category
          )
        `
        )
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching category distribution:', error);
        return [];
      }

      // Count by category
      const categoryCount: Record<string, number> = {};
      let total = 0;

      interface EnrollmentWithCategory {
        id: string;
        courses?: {
          category?: string;
        } | null;
      }

      data?.forEach((enrollment: EnrollmentWithCategory) => {
        const category = enrollment.courses?.category || 'Uncategorized';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        total++;
      });

      // Convert to array with percentages and colors
      const colors = [
        'hsl(var(--primary))',
        'hsl(var(--secondary))',
        'hsl(var(--accent))',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
      ];
      const distribution = Object.entries(categoryCount).map(([category, count], index) => ({
        category,
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colors[index % colors.length],
      }));

      return distribution.sort((a, b) => b.value - a.value);
    } catch (_error) {
      logger._error('Error in getUserCategoryDistribution:', _error);
      return [];
    }
  }

  /**
   * Get progress trends over time
   */
  static async getUserProgressTrends(userId: string, weeks: number = 6): Promise<ProgressTrend[]> {
    try {
      const trends: ProgressTrend[] = [];
      const currentDate = new Date();

      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(currentDate, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(currentDate, i), { weekStartsOn: 1 });
        const weekLabel = format(weekStart, 'MMM d');

        // Get courses in progress during this week
        const { data: inProgressData, error: inProgressError } = await supabase
          .from('user_progress')
          .select('course_id, progress_percentage')
          .eq('user_id', userId)
          .lt('progress_percentage', 100)
          .gte('last_accessed', weekStart.toISOString())
          .lte('last_accessed', weekEnd.toISOString());

        if (inProgressError) {
          logger.error('Error fetching in-progress courses:', inProgressError);
        }

        // Get courses completed during this week
        const { data: completedData, error: completedError } = await supabase
          .from('user_progress')
          .select('course_id')
          .eq('user_id', userId)
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString())
          .not('completed_at', 'is', null);

        if (completedError) {
          logger.error('Error fetching completed courses:', completedError);
        }

        const coursesInProgress = inProgressData?.length || 0;
        const coursesCompleted = completedData?.length || 0;
        const avgProgress =
          inProgressData && inProgressData.length > 0
            ? inProgressData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) /
              inProgressData.length
            : 0;

        trends.push({
          week: weekLabel,
          progress: Math.round(avgProgress),
          coursesInProgress,
          coursesCompleted,
        });
      }

      return trends;
    } catch (_error) {
      logger._error('Error in getUserProgressTrends:', _error);
      return [];
    }
  }

  /**
   * Get skills radar data for the user
   * Based on assessment performance across different skill categories
   */
  static async getUserSkillsRadar(userId: string): Promise<SkillRadarData[]> {
    try {
      // Fetch assessment data grouped by skill category
      const { data, error } = await supabase
        .from('user_ai_assessments')
        .select('overall_score, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) {
        logger.error('Error fetching skills data:', error);
        return [];
      }

      // For now, create sample skill categories
      // In production, this would be based on actual skill taxonomy
      const skills = [
        'JavaScript',
        'Python',
        'React',
        'Data Structures',
        'Algorithms',
        'Database Design',
      ];

      // Calculate proficiency based on assessment scores
      // This is a simplified version - in production, you'd map assessments to skills
      const skillData: SkillRadarData[] = skills.map((skill, index) => {
        const relevantAssessments = data?.slice(index, index + 3) || [];
        const proficiency =
          relevantAssessments.length > 0
            ? relevantAssessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) /
              relevantAssessments.length
            : 0;

        return {
          skill,
          proficiency: Math.round(proficiency),
          assessments: relevantAssessments.length,
          lastUpdated: relevantAssessments[0]?.completed_at || new Date().toISOString(),
        };
      });

      return skillData;
    } catch (_error) {
      logger._error('Error in getUserSkillsRadar:', _error);
      return [];
    }
  }

  /**
   * Get study time by day of week
   */
  static async getUserStudyTimeByDay(
    userId: string,
    dateRange?: DateRange
  ): Promise<StudyTimeByDay[]> {
    try {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      let query = supabase
        .from('user_progress')
        .select('time_spent_minutes, last_accessed')
        .eq('user_id', userId);

      if (dateRange) {
        query = query.gte('last_accessed', dateRange.start).lte('last_accessed', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching study time by day:', error);
        return [];
      }

      // Group by day of week
      const dayData: Record<string, { totalMinutes: number; sessions: number }> = {};
      days.forEach(day => {
        dayData[day] = { totalMinutes: 0, sessions: 0 };
      });

      data?.forEach(record => {
        if (record.last_accessed) {
          const date = parseISO(record.last_accessed);
          const dayName = format(date, 'EEEE');
          if (dayData[dayName]) {
            dayData[dayName].totalMinutes += record.time_spent_minutes || 0;
            dayData[dayName].sessions += 1;
          }
        }
      });

      return days.map(day => ({
        day,
        hours: parseFloat((dayData[day].totalMinutes / 60).toFixed(2)),
        sessions: dayData[day].sessions,
      }));
    } catch (_error) {
      logger._error('Error in getUserStudyTimeByDay:', _error);
      return [];
    }
  }

  /**
   * Get dashboard stats summary for the user
   */
  static async getUserDashboardStats(userId: string): Promise<UserDashboardStats> {
    try {
      // Fetch total study time
      const { data: progressData, error: _progressError } = await supabase
        .from('user_progress')
        .select('time_spent_minutes')
        .eq('user_id', userId);

      const totalStudyTime =
        progressData?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) || 0;

      // Fetch completed courses
      const { data: completedData, error: _completedError } = await supabase
        .from('user_progress')
        .select('course_id')
        .eq('user_id', userId)
        .eq('progress_percentage', 100)
        .not('completed_at', 'is', null);

      const completedCourses = completedData?.length || 0;

      // Fetch streak data from user_dashboard
      const { data: dashboardData, error: _dashboardError } = await supabase
        .from('user_dashboard')
        .select('current_streak')
        .eq('user_id', userId)
        .single();

      const currentStreak = dashboardData?.current_streak || 0;

      // Fetch average assessment score
      const { data: assessmentData, error: _assessmentError } = await supabase
        .from('user_ai_assessments')
        .select('overall_score')
        .eq('user_id', userId);

      const averageScore =
        assessmentData && assessmentData.length > 0
          ? assessmentData.reduce((sum, a) => sum + (a.overall_score || 0), 0) /
            assessmentData.length
          : 0;

      const totalAssessments = assessmentData?.length || 0;

      // Fetch certificates
      const { data: certificatesData, error: _certificatesError } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId);

      const certificatesEarned = certificatesData?.length || 0;

      // Fetch achievements
      const { data: achievementsData, error: _achievementsError } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId);

      const achievementsCount = achievementsData?.length || 0;

      return {
        totalStudyTime: Math.round(totalStudyTime),
        completedCourses,
        currentStreak,
        longestStreak: currentStreak, // Simplified - in production, track separately
        averageScore: Math.round(averageScore),
        totalAssessments,
        certificatesEarned,
        achievementsCount,
      };
    } catch (_error) {
      logger._error('Error in getUserDashboardStats:', _error);
      return {
        totalStudyTime: 0,
        completedCourses: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageScore: 0,
        totalAssessments: 0,
        certificatesEarned: 0,
        achievementsCount: 0,
      };
    }
  }
}
