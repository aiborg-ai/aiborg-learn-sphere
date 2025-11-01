/**
 * Team Analytics Service
 *
 * Provides analytics and reporting functionality for organizations:
 * - Team progress metrics
 * - Member activity tracking
 * - Assignment completion statistics
 * - Learning trends over time
 * - Top performers and department comparisons
 * - Popular courses within organization
 *
 * @module services/team/TeamAnalyticsService
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  TeamProgressSummary,
  MemberActivitySummary,
  AssignmentCompletionSummary,
  TeamLearningTrend,
  TopPerformer,
  DepartmentComparison,
  PopularCourse,
  LearningVelocity,
} from './types';

export class TeamAnalyticsService {
  // ============================================================================
  // Dashboard Metrics
  // ============================================================================

  /**
   * Get high-level progress summary for organization
   */
  static async getProgressSummary(organizationId: string): Promise<TeamProgressSummary> {
    const { data, error } = await supabase
      .from('team_progress_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get cached dashboard data (faster, updated hourly)
   */
  static async getCachedDashboard(organizationId: string): Promise<TeamProgressSummary> {
    const { data, error } = await supabase
      .from('team_dashboard_cache')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      // Fallback to real-time view if cache doesn't exist
      return this.getProgressSummary(organizationId);
    }

    return data;
  }

  /**
   * Refresh dashboard cache (should be run hourly via cron)
   */
  static async refreshDashboardCache(): Promise<void> {
    const { error } = await supabase.rpc('refresh_team_analytics_cache');
    if (error) throw error;
  }

  // ============================================================================
  // Member Analytics
  // ============================================================================

  /**
   * Get activity summary for all members
   */
  static async getMemberActivities(
    organizationId: string,
    filters?: {
      department?: string;
      minCoursesCompleted?: number;
      sortBy?: 'courses_completed' | 'avg_progress' | 'last_login';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<MemberActivitySummary[]> {
    let query = supabase
      .from('member_activity_summary')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters?.department) {
      query = query.eq('department', filters.department);
    }

    if (filters?.minCoursesCompleted) {
      query = query.gte('courses_completed', filters.minCoursesCompleted);
    }

    const sortBy = filters?.sortBy || 'courses_completed';
    const sortOrder = filters?.sortOrder === 'asc';
    query = query.order(sortBy, { ascending: sortOrder });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get detailed activity for a specific member
   */
  static async getMemberActivity(
    organizationId: string,
    userId: string
  ): Promise<MemberActivitySummary> {
    const { data, error } = await supabase
      .from('member_activity_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get top performers in organization
   */
  static async getTopPerformers(
    organizationId: string,
    limit: number = 10
  ): Promise<TopPerformer[]> {
    const { data, error } = await supabase.rpc('get_top_performers', {
      p_organization_id: organizationId,
      p_limit: limit,
    });

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // Assignment Analytics
  // ============================================================================

  /**
   * Get all assignment completion summaries
   */
  static async getAssignmentSummaries(
    organizationId: string,
    filters?: {
      status?: 'no_due_date' | 'overdue' | 'due_soon' | 'on_track';
      isMandatory?: boolean;
    }
  ): Promise<AssignmentCompletionSummary[]> {
    let query = supabase
      .from('assignment_completion_summary')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.isMandatory !== undefined) {
      query = query.eq('is_mandatory', filters.isMandatory);
    }

    query = query.order('assigned_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get overdue assignments count
   */
  static async getOverdueCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('assignment_completion_summary')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'overdue');

    if (error) throw error;
    return count || 0;
  }

  // ============================================================================
  // Learning Trends
  // ============================================================================

  /**
   * Get learning trends over time (last 90 days)
   */
  static async getLearningTrends(
    organizationId: string,
    days: number = 90
  ): Promise<TeamLearningTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('team_learning_trends')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Get learning velocity (courses per member per month)
   */
  static async getLearningVelocity(
    organizationId: string,
    months: number = 6
  ): Promise<LearningVelocity[]> {
    const { data, error } = await supabase.rpc('get_learning_velocity', {
      p_organization_id: organizationId,
      p_months: months,
    });

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // Department Analytics
  // ============================================================================

  /**
   * Compare performance across departments
   */
  static async getDepartmentComparison(organizationId: string): Promise<DepartmentComparison[]> {
    const { data, error } = await supabase.rpc('get_department_comparison', {
      p_organization_id: organizationId,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get member count by department
   */
  static async getMemberCountByDepartment(
    organizationId: string
  ): Promise<Array<{ department: string; count: number }>> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('department')
      .eq('organization_id', organizationId);

    if (error) throw error;

    // Group by department
    const deptMap = new Map<string, number>();
    data.forEach(member => {
      const dept = member.department || 'Unassigned';
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });

    return Array.from(deptMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ============================================================================
  // Course Analytics
  // ============================================================================

  /**
   * Get most popular courses in organization
   */
  static async getPopularCourses(
    organizationId: string,
    limit: number = 10
  ): Promise<PopularCourse[]> {
    const { data, error } = await supabase.rpc('get_popular_courses', {
      p_organization_id: organizationId,
      p_limit: limit,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get course completion rates for organization
   */
  static async getCourseCompletionRates(organizationId: string): Promise<
    Array<{
      courseId: string;
      courseTitle: string;
      enrollments: number;
      completions: number;
      completionRate: number;
    }>
  > {
    const { data, error } = await supabase.rpc('get_course_completion_rates', {
      p_organization_id: organizationId,
    });

    if (error) {
      // Fallback query if function doesn't exist
      const popularCourses = await this.getPopularCourses(organizationId, 100);
      return popularCourses.map(course => ({
        courseId: course.course_id,
        courseTitle: course.course_title,
        enrollments: course.enrollment_count,
        completions: course.completion_count,
        completionRate: course.completion_rate,
      }));
    }

    return data;
  }

  // ============================================================================
  // Engagement Metrics
  // ============================================================================

  /**
   * Get active user count for different time periods
   */
  static async getActiveUserCounts(organizationId: string): Promise<{
    today: number;
    last7Days: number;
    last30Days: number;
    last90Days: number;
  }> {
    const summary = await this.getProgressSummary(organizationId);

    const { count: todayCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('profiles.last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { count: last90Days } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('profiles.last_login', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    return {
      today: todayCount || 0,
      last7Days: summary.active_members_7d,
      last30Days: summary.active_members_30d,
      last90Days: last90Days || 0,
    };
  }

  /**
   * Get engagement rate (% of members active in last 30 days)
   */
  static async getEngagementRate(organizationId: string): Promise<number> {
    const summary = await this.getProgressSummary(organizationId);

    if (summary.total_members === 0) return 0;

    return Math.round((summary.active_members_30d / summary.total_members) * 100 * 100) / 100;
  }

  // ============================================================================
  // Export Data
  // ============================================================================

  /**
   * Export member progress data as CSV-ready format
   */
  static async exportMemberProgress(
    organizationId: string
  ): Promise<Array<Record<string, string | number>>> {
    const members = await this.getMemberActivities(organizationId);

    return members.map(member => ({
      Name: member.full_name || 'N/A',
      Email: member.email,
      Department: member.department || 'Unassigned',
      Role: member.org_role,
      'Member Since': new Date(member.member_since).toLocaleDateString(),
      'Last Login': member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never',
      'Courses Enrolled': member.courses_enrolled,
      'Courses Completed': member.courses_completed,
      'Courses In Progress': member.courses_in_progress,
      'Average Progress (%)': member.avg_course_progress,
      'Assignments Total': member.assignments_total,
      'Assignments Completed': member.assignments_completed,
      'Assignments Overdue': member.assignments_overdue,
      'Assessments Taken': member.assessments_taken,
      'Average Assessment Score': member.avg_assessment_score,
    }));
  }

  /**
   * Export assignment completion data
   */
  static async exportAssignmentData(
    organizationId: string
  ): Promise<Array<Record<string, string | number>>> {
    const assignments = await this.getAssignmentSummaries(organizationId);

    return assignments.map(assignment => ({
      'Assignment Title': assignment.assignment_title,
      'Course Title': assignment.course_title,
      Mandatory: assignment.is_mandatory ? 'Yes' : 'No',
      'Assigned Date': new Date(assignment.assigned_at).toLocaleDateString(),
      'Due Date': assignment.due_date
        ? new Date(assignment.due_date).toLocaleDateString()
        : 'No due date',
      'Total Assigned': assignment.total_assigned,
      Started: assignment.total_started,
      Completed: assignment.total_completed,
      Overdue: assignment.total_overdue,
      'Completion Rate (%)': assignment.completion_rate_percentage,
      'Engagement Rate (%)': assignment.engagement_rate_percentage,
      Status:
        assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1).replace('_', ' '),
    }));
  }

  // ============================================================================
  // Summary Statistics
  // ============================================================================

  /**
   * Get comprehensive statistics for organization
   */
  static async getComprehensiveStats(organizationId: string): Promise<{
    organization: TeamProgressSummary;
    engagement: {
      rate: number;
      activeCounts: {
        today: number;
        last7Days: number;
        last30Days: number;
        last90Days: number;
      };
    };
    topPerformers: TopPerformer[];
    departments: DepartmentComparison[];
    popularCourses: PopularCourse[];
    overdueAssignments: number;
  }> {
    const [
      organization,
      engagementRate,
      activeCounts,
      topPerformers,
      departments,
      popularCourses,
      overdueAssignments,
    ] = await Promise.all([
      this.getProgressSummary(organizationId),
      this.getEngagementRate(organizationId),
      this.getActiveUserCounts(organizationId),
      this.getTopPerformers(organizationId, 5),
      this.getDepartmentComparison(organizationId),
      this.getPopularCourses(organizationId, 5),
      this.getOverdueCount(organizationId),
    ]);

    return {
      organization,
      engagement: {
        rate: engagementRate,
        activeCounts,
      },
      topPerformers,
      departments,
      popularCourses,
      overdueAssignments,
    };
  }
}
