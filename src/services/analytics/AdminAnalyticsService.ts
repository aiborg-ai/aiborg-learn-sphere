/**
 * Admin Analytics Service
 * Provides comprehensive analytics data for admin dashboard
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface PlatformMetrics {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  activeUsersMonth: number;
}

export interface UserGrowth {
  date: string;
  newUsers: number;
  totalUsers: number;
  activeUsers: number;
}

export interface CourseAnalytics {
  courseId: number;
  courseTitle: string;
  enrollments: number;
  completions: number;
  completionRate: number;
  averageProgress: number;
  averageRating: number;
  revenue: number;
}

export interface RevenueMetrics {
  total: number;
  transactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageTransactionValue: number;
  revenueByDay: { date: string; amount: number }[];
  revenueByCourse: { courseTitle: string; amount: number }[];
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  averageCoursesPerUser: number;
  contentCompletionRate: number;
  assessmentTakeRate: number;
}

export interface AssessmentAnalytics {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  completionRate: number;
  averageTimeMinutes: number;
  assessmentsByType: { type: string; count: number }[];
  performanceTrend: { date: string; averageScore: number }[];
}

export class AdminAnalyticsService {
  /**
   * Get platform-wide metrics
   */
  static async getPlatformMetrics(): Promise<PlatformMetrics | null> {
    try {
      // Get user counts by role
      const { data: profiles } = await supabase.from('profiles').select('user_id, role, created_at');

      const totalUsers = profiles?.length || 0;
      const totalStudents = profiles?.filter(p => p.role === 'student').length || 0;
      const totalInstructors = profiles?.filter(p => p.role === 'instructor').length || 0;
      const totalAdmins = profiles?.filter(p => p.role === 'admin').length || 0;

      // Get total courses
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // Get total enrollments
      const { count: totalEnrollments } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      // Calculate revenue
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('payment_amount')
        .eq('payment_status', 'completed');

      const totalRevenue =
        enrollmentsData?.reduce((sum, e) => sum + (e.payment_amount || 0), 0) || 0;

      // Active users (based on recent activity)
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { count: activeToday } = await supabase
        .from('user_progress')
        .select('user_id', { count: 'exact', head: true })
        .gte('last_accessed', dayAgo.toISOString());

      const { count: activeWeek } = await supabase
        .from('user_progress')
        .select('user_id', { count: 'exact', head: true })
        .gte('last_accessed', weekAgo.toISOString());

      const { count: activeMonth } = await supabase
        .from('user_progress')
        .select('user_id', { count: 'exact', head: true })
        .gte('last_accessed', monthAgo.toISOString());

      return {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        totalCourses: totalCourses || 0,
        totalEnrollments: totalEnrollments || 0,
        totalRevenue,
        activeUsersToday: activeToday || 0,
        activeUsersWeek: activeWeek || 0,
        activeUsersMonth: activeMonth || 0,
      };
    } catch (error) {
      logger.error('Error fetching platform metrics:', error);
      return null;
    }
  }

  /**
   * Get user growth over time
   */
  static async getUserGrowth(days: number = 30): Promise<UserGrowth[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('user_id, created_at')
        .order('created_at', { ascending: true });

      const { data: activeUsers } = await supabase
        .from('user_progress')
        .select('user_id, last_accessed')
        .gte('last_accessed', startDate.toISOString());

      // Group by date
      const growthMap = new Map<string, UserGrowth>();

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const newUsers =
          profiles?.filter(p => p.created_at.split('T')[0] === dateStr).length || 0;
        const totalUsers =
          allProfiles?.filter(p => new Date(p.created_at) <= date).length || 0;
        const activeOnDay =
          activeUsers?.filter(
            p => new Set([p.last_accessed.split('T')[0]]).has(dateStr)
          ).length || 0;

        growthMap.set(dateStr, {
          date: dateStr,
          newUsers,
          totalUsers,
          activeUsers: activeOnDay,
        });
      }

      return Array.from(growthMap.values());
    } catch (error) {
      logger.error('Error fetching user growth:', error);
      return [];
    }
  }

  /**
   * Get course analytics
   */
  static async getCourseAnalytics(): Promise<CourseAnalytics[]> {
    try {
      const { data: courses } = await supabase.from('courses').select('id, title');

      if (!courses) return [];

      const analytics: CourseAnalytics[] = [];

      for (const course of courses) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('payment_amount, payment_status')
          .eq('course_id', course.id);

        const { data: progress } = await supabase
          .from('user_progress')
          .select('progress_percentage, completed_at')
          .eq('course_id', course.id);

        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('course_id', course.id)
          .eq('status', 'approved');

        const enrollmentCount = enrollments?.length || 0;
        const completions = progress?.filter(p => p.completed_at).length || 0;
        const avgProgress =
          progress?.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) /
            Math.max(1, progress?.length || 1) || 0;
        const avgRating =
          reviews?.reduce((sum, r) => sum + (r.rating || 0), 0) /
            Math.max(1, reviews?.length || 1) || 0;
        const revenue =
          enrollments
            ?.filter(e => e.payment_status === 'completed')
            .reduce((sum, e) => sum + (e.payment_amount || 0), 0) || 0;

        analytics.push({
          courseId: course.id,
          courseTitle: course.title,
          enrollments: enrollmentCount,
          completions,
          completionRate: enrollmentCount > 0 ? (completions / enrollmentCount) * 100 : 0,
          averageProgress: avgProgress,
          averageRating: avgRating,
          revenue,
        });
      }

      return analytics.sort((a, b) => b.enrollments - a.enrollments);
    } catch (error) {
      logger.error('Error fetching course analytics:', error);
      return [];
    }
  }

  /**
   * Get revenue metrics
   */
  static async getRevenueMetrics(days: number = 30): Promise<RevenueMetrics | null> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('payment_amount, payment_status, enrolled_at, course:courses(title)')
        .gte('enrolled_at', startDate.toISOString());

      const total =
        enrollments
          ?.filter(e => e.payment_status === 'completed')
          .reduce((sum, e) => sum + (e.payment_amount || 0), 0) || 0;

      const transactions = enrollments?.length || 0;
      const successful = enrollments?.filter(e => e.payment_status === 'completed').length || 0;
      const failed = enrollments?.filter(e => e.payment_status === 'failed').length || 0;
      const avgValue = successful > 0 ? total / successful : 0;

      // Revenue by day
      const revenueByDayMap = new Map<string, number>();
      enrollments
        ?.filter(e => e.payment_status === 'completed')
        .forEach(e => {
          const date = e.enrolled_at.split('T')[0];
          revenueByDayMap.set(date, (revenueByDayMap.get(date) || 0) + (e.payment_amount || 0));
        });

      const revenueByDay = Array.from(revenueByDayMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Revenue by course
      const revenueByCourseMap = new Map<string, number>();
      enrollments
        ?.filter(e => e.payment_status === 'completed')
        .forEach(e => {
          const courseTitle = e.course?.title || 'Unknown';
          revenueByCourseMap.set(
            courseTitle,
            (revenueByCourseMap.get(courseTitle) || 0) + (e.payment_amount || 0)
          );
        });

      const revenueByCourse = Array.from(revenueByCourseMap.entries())
        .map(([courseTitle, amount]) => ({ courseTitle, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      return {
        total,
        transactions,
        successfulTransactions: successful,
        failedTransactions: failed,
        averageTransactionValue: avgValue,
        revenueByDay,
        revenueByCourse,
      };
    } catch (error) {
      logger.error('Error fetching revenue metrics:', error);
      return null;
    }
  }

  /**
   * Get engagement metrics
   */
  static async getEngagementMetrics(): Promise<EngagementMetrics | null> {
    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Active users
      const { data: dailyActive } = await supabase
        .from('user_progress')
        .select('user_id')
        .gte('last_accessed', dayAgo.toISOString());

      const { data: weeklyActive } = await supabase
        .from('user_progress')
        .select('user_id')
        .gte('last_accessed', weekAgo.toISOString());

      const { data: monthlyActive } = await supabase
        .from('user_progress')
        .select('user_id')
        .gte('last_accessed', monthAgo.toISOString());

      // Average session duration (from progress table)
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('time_spent_minutes');

      const avgSession =
        progressData?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) /
          Math.max(1, progressData?.length || 1) || 0;

      // Average courses per user
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('user_id');

      const uniqueUsers = new Set(enrollmentData?.map(e => e.user_id)).size;
      const avgCoursesPerUser = uniqueUsers > 0 ? (enrollmentData?.length || 0) / uniqueUsers : 0;

      // Content completion rate
      const { data: allProgress } = await supabase
        .from('user_progress')
        .select('progress_percentage, completed_at');

      const completionRate =
        (allProgress?.filter(p => p.completed_at).length || 0) / Math.max(1, allProgress?.length || 1);

      // Assessment take rate
      const { count: totalEnrollments } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      const { count: assessmentsTaken } = await supabase
        .from('user_ai_assessments')
        .select('*', { count: 'exact', head: true });

      const assessmentTakeRate =
        (assessmentsTaken || 0) / Math.max(1, totalEnrollments || 1);

      return {
        dailyActiveUsers: new Set(dailyActive?.map(u => u.user_id)).size,
        weeklyActiveUsers: new Set(weeklyActive?.map(u => u.user_id)).size,
        monthlyActiveUsers: new Set(monthlyActive?.map(u => u.user_id)).size,
        averageSessionDuration: avgSession,
        averageCoursesPerUser: avgCoursesPerUser,
        contentCompletionRate: completionRate * 100,
        assessmentTakeRate: assessmentTakeRate * 100,
      };
    } catch (error) {
      logger.error('Error fetching engagement metrics:', error);
      return null;
    }
  }

  /**
   * Get assessment analytics
   */
  static async getAssessmentAnalytics(days: number = 30): Promise<AssessmentAnalytics | null> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: assessments } = await supabase
        .from('user_ai_assessments')
        .select('*')
        .gte('started_at', startDate.toISOString());

      const total = assessments?.length || 0;
      const completed = assessments?.filter(a => a.is_complete).length || 0;

      // Average score
      const scores = assessments?.filter(a => a.final_score !== null).map(a => a.final_score || 0) || [];
      const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;

      // Average time
      const completedWithTime = assessments?.filter(a => a.is_complete && a.started_at && a.completed_at) || [];
      const times = completedWithTime.map(a => {
        const start = new Date(a.started_at).getTime();
        const end = new Date(a.completed_at).getTime();
        return (end - start) / 60000; // minutes
      });
      const avgTime = times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 0;

      // Assessments by type
      const typeMap = new Map<string, number>();
      assessments?.forEach(a => {
        const type = a.is_adaptive ? 'Adaptive' : 'Standard';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });
      const assessmentsByType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

      // Performance trend
      const trendMap = new Map<string, { total: number; sum: number }>();
      assessments
        ?.filter(a => a.final_score !== null)
        .forEach(a => {
          const date = a.started_at.split('T')[0];
          const current = trendMap.get(date) || { total: 0, sum: 0 };
          trendMap.set(date, {
            total: current.total + 1,
            sum: current.sum + (a.final_score || 0),
          });
        });

      const performanceTrend = Array.from(trendMap.entries())
        .map(([date, data]) => ({
          date,
          averageScore: data.total > 0 ? data.sum / data.total : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalAssessments: total,
        completedAssessments: completed,
        averageScore: avgScore,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        averageTimeMinutes: avgTime,
        assessmentsByType,
        performanceTrend,
      };
    } catch (error) {
      logger.error('Error fetching assessment analytics:', error);
      return null;
    }
  }
}
