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

export interface DateRange {
  start: string;
  end: string;
}

export interface ChatbotMetrics {
  totalConversations: number;
  uniqueUsers: number;
  avgSatisfaction: number;
  resolutionRate: number;
  avgDurationMinutes: number;
}

export interface ChatbotTrendData {
  date: string;
  conversations: number;
  satisfaction: number;
  resolutions: number;
}

export interface TopQuery {
  topic: string;
  count: number;
  avgSatisfaction: number;
  resolutionRate: number;
}

export interface TeamMetrics {
  totalTeams: number;
  totalMembers: number;
  avgEngagementScore: number;
  avgCompletionRate: number;
  activeTeamsWeek: number;
}

export interface TeamPerformanceData {
  teamId: string;
  teamName: string;
  memberCount: number;
  completionRate: number;
  engagementScore: number;
}

export class AdminAnalyticsService {
  /**
   * Get platform-wide metrics
   */
  static async getPlatformMetrics(): Promise<PlatformMetrics | null> {
    try {
      // Get user counts by role
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, role, created_at');

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
    } catch (_error) {
      logger._error('Error fetching platform metrics:', _error);
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

        const newUsers = profiles?.filter(p => p.created_at.split('T')[0] === dateStr).length || 0;
        const totalUsers = allProfiles?.filter(p => new Date(p.created_at) <= date).length || 0;
        const activeOnDay =
          activeUsers?.filter(p => new Set([p.last_accessed.split('T')[0]]).has(dateStr)).length ||
          0;

        growthMap.set(dateStr, {
          date: dateStr,
          newUsers,
          totalUsers,
          activeUsers: activeOnDay,
        });
      }

      return Array.from(growthMap.values());
    } catch (_error) {
      logger._error('Error fetching user growth:', _error);
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
    } catch (_error) {
      logger._error('Error fetching course analytics:', _error);
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
    } catch (_error) {
      logger._error('Error fetching revenue metrics:', _error);
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
      const { data: enrollmentData } = await supabase.from('enrollments').select('user_id');

      const uniqueUsers = new Set(enrollmentData?.map(e => e.user_id)).size;
      const avgCoursesPerUser = uniqueUsers > 0 ? (enrollmentData?.length || 0) / uniqueUsers : 0;

      // Content completion rate
      const { data: allProgress } = await supabase
        .from('user_progress')
        .select('progress_percentage, completed_at');

      const completionRate =
        (allProgress?.filter(p => p.completed_at).length || 0) /
        Math.max(1, allProgress?.length || 1);

      // Assessment take rate
      const { count: totalEnrollments } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      const { count: assessmentsTaken } = await supabase
        .from('user_ai_assessments')
        .select('*', { count: 'exact', head: true });

      const assessmentTakeRate = (assessmentsTaken || 0) / Math.max(1, totalEnrollments || 1);

      return {
        dailyActiveUsers: new Set(dailyActive?.map(u => u.user_id)).size,
        weeklyActiveUsers: new Set(weeklyActive?.map(u => u.user_id)).size,
        monthlyActiveUsers: new Set(monthlyActive?.map(u => u.user_id)).size,
        averageSessionDuration: avgSession,
        averageCoursesPerUser: avgCoursesPerUser,
        contentCompletionRate: completionRate * 100,
        assessmentTakeRate: assessmentTakeRate * 100,
      };
    } catch (_error) {
      logger._error('Error fetching engagement metrics:', _error);
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
      const scores =
        assessments?.filter(a => a.final_score !== null).map(a => a.final_score || 0) || [];
      const avgScore =
        scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;

      // Average time
      const completedWithTime =
        assessments?.filter(a => a.is_complete && a.started_at && a.completed_at) || [];
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
      const assessmentsByType = Array.from(typeMap.entries()).map(([type, count]) => ({
        type,
        count,
      }));

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
    } catch (_error) {
      logger._error('Error fetching assessment analytics:', _error);
      return null;
    }
  }

  /**
   * Get chatbot analytics metrics
   * @param dateRange - Date range for analytics
   * @returns Chatbot metrics or null if error
   */
  static async getChatbotAnalytics(dateRange: DateRange): Promise<ChatbotMetrics | null> {
    try {
      // Query chatbot_analytics_daily view
      const { data, error } = await supabase
        .from('chatbot_analytics_daily')
        .select('*')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalConversations: 0,
          uniqueUsers: 0,
          avgSatisfaction: 0,
          resolutionRate: 0,
          avgDurationMinutes: 0,
        };
      }

      // Aggregate metrics across date range
      const totalConversations = data.reduce((sum, row) => sum + (row.total_conversations || 0), 0);
      const uniqueUsersSet = new Set<string>();
      let totalSatisfaction = 0;
      let satisfactionCount = 0;
      let totalResolved = 0;
      let totalDuration = 0;

      data.forEach(row => {
        // Track unique users
        if (row.unique_users) {
          uniqueUsersSet.add(row.unique_users);
        }

        // Sum satisfaction ratings
        if (row.avg_satisfaction_rating !== null) {
          totalSatisfaction += row.avg_satisfaction_rating * (row.total_conversations || 1);
          satisfactionCount += row.total_conversations || 0;
        }

        // Sum resolved conversations
        totalResolved += row.resolved_count || 0;

        // Sum duration
        if (row.avg_duration_minutes !== null) {
          totalDuration += row.avg_duration_minutes * (row.total_conversations || 1);
        }
      });

      const avgSatisfaction = satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0;
      const resolutionRate =
        totalConversations > 0 ? (totalResolved / totalConversations) * 100 : 0;
      const avgDurationMinutes = totalConversations > 0 ? totalDuration / totalConversations : 0;

      logger.info('Fetched chatbot analytics', { dateRange, totalConversations });

      return {
        totalConversations,
        uniqueUsers: uniqueUsersSet.size,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10, // Round to 1 decimal
        resolutionRate: Math.round(resolutionRate * 10) / 10, // Round to 1 decimal
        avgDurationMinutes: Math.round(avgDurationMinutes * 10) / 10, // Round to 1 decimal
      };
    } catch (_error) {
      logger._error('Error fetching chatbot analytics:', _error);
      return null;
    }
  }

  /**
   * Get chatbot trends over time
   * @param dateRange - Date range for trends
   * @returns Array of daily trend data
   */
  static async getChatbotTrends(dateRange: DateRange): Promise<ChatbotTrendData[]> {
    try {
      // Query chatbot_analytics_daily view
      const { data, error } = await supabase
        .from('chatbot_analytics_daily')
        .select('date, total_conversations, avg_satisfaction_rating, resolved_count')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform to trend data
      const trends: ChatbotTrendData[] = data.map(row => ({
        date: row.date,
        conversations: row.total_conversations || 0,
        satisfaction: row.avg_satisfaction_rating || 0,
        resolutions: row.resolved_count || 0,
      }));

      logger.info('Fetched chatbot trends', { dateRange, dataPoints: trends.length });

      return trends;
    } catch (_error) {
      logger._error('Error fetching chatbot trends:', _error);
      return [];
    }
  }

  /**
   * Get top queries by topic
   * @param dateRange - Date range for query analysis
   * @param limit - Maximum number of top queries to return (default: 10)
   * @returns Array of top queries with metrics
   */
  static async getTopQueries(dateRange: DateRange, limit: number = 10): Promise<TopQuery[]> {
    try {
      // Query chatbot_top_queries view
      const { data, error } = await supabase
        .from('chatbot_top_queries')
        .select('*')
        .gte('first_query_date', dateRange.start)
        .lte('last_query_date', dateRange.end)
        .order('query_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform to top query data
      const topQueries: TopQuery[] = data.map(row => ({
        topic: row.topic || 'Unknown',
        count: row.query_count || 0,
        avgSatisfaction: row.avg_satisfaction || 0,
        resolutionRate: row.resolution_rate || 0,
      }));

      logger.info('Fetched top queries', { dateRange, count: topQueries.length });

      return topQueries;
    } catch (_error) {
      logger._error('Error fetching top queries:', _error);
      return [];
    }
  }

  /**
   * Get team analytics metrics
   * @param dateRange - Date range for analytics
   * @returns Team metrics or null if error
   */
  static async getTeamAnalytics(dateRange: DateRange): Promise<TeamMetrics | null> {
    try {
      // Query team_analytics_summary view
      const { data, error } = await supabase.from('team_analytics_summary').select('*');

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalTeams: 0,
          totalMembers: 0,
          avgEngagementScore: 0,
          avgCompletionRate: 0,
          activeTeamsWeek: 0,
        };
      }

      // Aggregate metrics
      const totalTeams = data.length;
      const totalMembers = data.reduce((sum, row) => sum + (row.member_count || 0), 0);
      const sumEngagement = data.reduce((sum, row) => sum + (row.engagement_score || 0), 0);
      const sumCompletion = data.reduce((sum, row) => sum + (row.completion_rate || 0), 0);

      // Calculate average engagement score and completion rate
      const avgEngagementScore = totalTeams > 0 ? sumEngagement / totalTeams : 0;
      const avgCompletionRate = totalTeams > 0 ? sumCompletion / totalTeams : 0;

      // Count active teams (teams with activity in the last week)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const activeTeamsWeek = data.filter(row => {
        const lastActive = row.last_activity_date ? new Date(row.last_activity_date) : null;
        return lastActive && lastActive >= weekAgo;
      }).length;

      logger.info('Fetched team analytics', { dateRange, totalTeams });

      return {
        totalTeams,
        totalMembers,
        avgEngagementScore: Math.round(avgEngagementScore * 10) / 10, // Round to 1 decimal
        avgCompletionRate: Math.round(avgCompletionRate * 10) / 10, // Round to 1 decimal
        activeTeamsWeek,
      };
    } catch (_error) {
      logger._error('Error fetching team analytics:', _error);
      return null;
    }
  }

  /**
   * Get team performance data
   * @param dateRange - Date range for performance analysis
   * @returns Array of team performance data sorted by engagement score
   */
  static async getTeamPerformance(dateRange: DateRange): Promise<TeamPerformanceData[]> {
    try {
      // Query team_analytics_summary view
      const { data, error } = await supabase
        .from('team_analytics_summary')
        .select('*')
        .order('engagement_score', { ascending: false });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform to team performance data
      const teamPerformance: TeamPerformanceData[] = data.map(row => ({
        teamId: row.team_id || '',
        teamName: row.team_name || 'Unknown Team',
        memberCount: row.member_count || 0,
        completionRate: row.completion_rate || 0,
        engagementScore: row.engagement_score || 0,
      }));

      logger.info('Fetched team performance', { dateRange, count: teamPerformance.length });

      return teamPerformance;
    } catch (_error) {
      logger._error('Error fetching team performance:', _error);
      return [];
    }
  }
}
