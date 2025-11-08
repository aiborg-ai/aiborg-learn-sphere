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
  SkillsGap,
  TeamMomentum,
  MomentumSummary,
  CollaborationMetrics,
  CollaborationSummary,
  LearningPathEffectiveness,
  TimeToCompetency,
  CompetencyFilters,
  TeamHealthScore,
  HealthScoreBreakdown,
  ManagerMetrics,
  ManagerDashboardSummary,
  ROIMetrics,
  ROISummary,
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

  // ============================================================================
  // Enhanced Team Analytics (8 New Metrics)
  // ============================================================================

  /**
   * METRIC 1: Get Skills Gap Analysis
   * Identifies skills not yet acquired by team members
   */
  static async getSkillsGap(organizationId: string, department?: string): Promise<SkillsGap[]> {
    const { data, error } = await supabase.rpc('get_skills_gap', {
      p_organization_id: organizationId,
      p_department: department || null,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * METRIC 2: Get Team Momentum Score
   * Tracks learning acceleration/deceleration over time
   */
  static async getTeamMomentum(
    organizationId: string,
    weeks: number = 4
  ): Promise<MomentumSummary> {
    const { data, error } = await supabase.rpc('get_team_momentum', {
      p_organization_id: organizationId,
      p_weeks: weeks,
    });

    if (error) throw error;

    const trends: TeamMomentum[] = data || [];

    // Calculate overall trend and momentum score
    const currentTrend = trends[0];
    const overallTrend = this.calculateOverallMomentumTrend(trends);
    const momentumScore = this.calculateMomentumScore(trends);

    return {
      current_momentum: currentTrend,
      historical_trends: trends,
      overall_trend: overallTrend,
      momentum_score: momentumScore,
    };
  }

  /**
   * Helper: Calculate overall momentum trend
   */
  private static calculateOverallMomentumTrend(
    trends: TeamMomentum[]
  ): 'accelerating' | 'stable' | 'decelerating' {
    if (trends.length < 2) return 'stable';

    const acceleratingCount = trends.filter(t => t.trend === 'accelerating').length;
    const deceleratingCount = trends.filter(t => t.trend === 'decelerating').length;

    if (acceleratingCount > deceleratingCount * 1.5) return 'accelerating';
    if (deceleratingCount > acceleratingCount * 1.5) return 'decelerating';
    return 'stable';
  }

  /**
   * Helper: Calculate momentum score (0-100)
   */
  private static calculateMomentumScore(trends: TeamMomentum[]): number {
    if (trends.length === 0) return 50;

    const avgChange = trends.reduce((sum, t) => sum + t.week_over_week_change, 0) / trends.length;

    // Normalize to 0-100 scale (assuming -50% to +50% change is normal range)
    const normalized = 50 + (avgChange / 100) * 100;
    return Math.max(0, Math.min(100, normalized));
  }

  /**
   * METRIC 3: Get Collaboration Metrics
   * Analyzes cross-team enrollment patterns
   */
  static async getCollaborationMetrics(organizationId: string): Promise<CollaborationSummary> {
    const { data, error } = await supabase.rpc('get_collaboration_metrics', {
      p_organization_id: organizationId,
    });

    if (error) throw error;

    const collaborationData: CollaborationMetrics[] = data || [];

    const totalCrossTeamCourses = collaborationData.length;
    const avgTeamsPerCourse =
      collaborationData.length > 0
        ? collaborationData.reduce((sum, c) => sum + c.teams_enrolled, 0) / collaborationData.length
        : 0;
    const mostCollaborative = collaborationData[0] || null;
    const collaborationScore = Math.min(100, avgTeamsPerCourse * 25); // Scale: 4+ teams = 100

    return {
      total_cross_team_courses: totalCrossTeamCourses,
      avg_teams_per_course: avgTeamsPerCourse,
      most_collaborative_course: mostCollaborative!,
      collaboration_score: collaborationScore,
    };
  }

  /**
   * METRIC 4: Get Learning Path Effectiveness
   * Analyzes success rates and completion patterns for learning paths
   */
  static async getLearningPathEffectiveness(
    organizationId: string
  ): Promise<LearningPathEffectiveness[]> {
    const { data, error } = await supabase.rpc('get_learning_path_stats', {
      p_organization_id: organizationId,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * METRIC 5: Get Time-to-Competency Metrics
   * Measures time from enrollment to course completion
   */
  static async getTimeToCompetency(
    organizationId: string,
    filters?: CompetencyFilters
  ): Promise<TimeToCompetency[]> {
    const { data, error } = await supabase.rpc('get_time_to_competency', {
      p_organization_id: organizationId,
      p_department: filters?.department || null,
      p_course_level: filters?.course_level || null,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * METRIC 6: Get Team Health Score
   * Composite metric combining engagement, completion, activity, and velocity
   */
  static async getTeamHealthScore(organizationId: string): Promise<HealthScoreBreakdown> {
    const { data, error } = await supabase.rpc('calculate_team_health', {
      p_organization_id: organizationId,
    });

    if (error) throw error;

    const healthData: TeamHealthScore = data?.[0] || {
      engagement_score: 0,
      completion_rate: 0,
      activity_consistency: 0,
      on_time_rate: 0,
      velocity_score: 0,
      health_score: 0,
      health_status: 'poor',
    };

    // Generate recommendations based on metrics
    const recommendations = this.generateHealthRecommendations(healthData);
    const areasOfConcern = this.identifyAreasOfConcern(healthData);
    const strengths = this.identifyStrengths(healthData);

    return {
      ...healthData,
      recommendations,
      areas_of_concern: areasOfConcern,
      strengths,
    };
  }

  /**
   * Helper: Generate health recommendations
   */
  private static generateHealthRecommendations(health: TeamHealthScore): string[] {
    const recommendations: string[] = [];

    if (health.engagement_score < 50) {
      recommendations.push('Increase engagement through gamification and incentives');
    }
    if (health.completion_rate < 60) {
      recommendations.push('Review course difficulty and provide additional support');
    }
    if (health.activity_consistency < 50) {
      recommendations.push('Implement regular learning schedules and reminders');
    }
    if (health.on_time_rate < 70) {
      recommendations.push('Review assignment deadlines and workload balance');
    }
    if (health.velocity_score < 30) {
      recommendations.push('Encourage more frequent learning sessions');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current excellent performance');
    }

    return recommendations;
  }

  /**
   * Helper: Identify areas of concern
   */
  private static identifyAreasOfConcern(health: TeamHealthScore): string[] {
    const concerns: string[] = [];

    if (health.engagement_score < 40) concerns.push('Low engagement');
    if (health.completion_rate < 50) concerns.push('Low completion rate');
    if (health.activity_consistency < 40) concerns.push('Inconsistent activity');
    if (health.on_time_rate < 60) concerns.push('High overdue rate');

    return concerns;
  }

  /**
   * Helper: Identify strengths
   */
  private static identifyStrengths(health: TeamHealthScore): string[] {
    const strengths: string[] = [];

    if (health.engagement_score >= 70) strengths.push('High engagement');
    if (health.completion_rate >= 70) strengths.push('Strong completion rate');
    if (health.activity_consistency >= 70) strengths.push('Consistent activity');
    if (health.on_time_rate >= 80) strengths.push('Excellent on-time performance');
    if (health.velocity_score >= 60) strengths.push('Good learning velocity');

    return strengths;
  }

  /**
   * METRIC 7: Get Manager Dashboard Metrics
   * Provides team metrics for managers based on role='manager'
   */
  static async getManagerDashboard(managerId: string): Promise<ManagerDashboardSummary> {
    const { data, error } = await supabase.rpc('get_manager_dashboard', {
      p_manager_id: managerId,
    });

    if (error) throw error;

    const managerData: ManagerMetrics = data?.[0] || {
      organization_id: '',
      organization_name: '',
      manager_department: '',
      direct_reports_count: 0,
      avg_team_progress: 0,
      team_completion_rate: 0,
      active_members_week: 0,
      members_with_overdue: 0,
      team_members_detail: [],
    };

    // Identify at-risk members and top performers
    const atRiskMembers = this.identifyAtRiskMembers(managerData.team_members_detail);
    const topPerformers = this.identifyTopPerformersFromTeam(managerData.team_members_detail);

    return {
      ...managerData,
      at_risk_members: atRiskMembers,
      top_performers: topPerformers,
    };
  }

  /**
   * Helper: Identify at-risk team members
   */
  private static identifyAtRiskMembers(
    teamMembers: Array<{
      user_id: string;
      name: string;
      enrollments: number;
      completions: number;
      last_active?: string;
    }>
  ): Array<{ user_id: string; name: string; risk_factors: string[] }> {
    return teamMembers
      .map(member => {
        const riskFactors: string[] = [];

        // Check for inactivity
        const lastActive = member.last_active ? new Date(member.last_active) : null;
        const daysSinceActive = lastActive
          ? (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
          : 999;

        if (daysSinceActive > 14) riskFactors.push('Inactive for 14+ days');
        if (member.enrollments > 0 && member.completions === 0) riskFactors.push('No completions');
        if (member.enrollments > 2 && member.completions / member.enrollments < 0.3) {
          riskFactors.push('Low completion rate');
        }

        return {
          user_id: member.user_id,
          name: member.name,
          risk_factors: riskFactors,
        };
      })
      .filter(m => m.risk_factors.length > 0)
      .slice(0, 5); // Top 5 at-risk
  }

  /**
   * Helper: Identify top performers from team
   */
  private static identifyTopPerformersFromTeam(
    teamMembers: Array<{ user_id: string; name: string; enrollments: number; completions: number }>
  ): Array<{ user_id: string; name: string; performance_score: number }> {
    return teamMembers
      .map(member => ({
        user_id: member.user_id,
        name: member.name,
        performance_score:
          member.completions * 10 +
          (member.enrollments > 0 ? (member.completions / member.enrollments) * 50 : 0),
      }))
      .sort((a, b) => b.performance_score - a.performance_score)
      .slice(0, 5); // Top 5 performers
  }

  /**
   * METRIC 8: Get ROI Metrics
   * Analyzes financial return on learning investments
   */
  static async getROIMetrics(organizationId: string): Promise<ROISummary> {
    const { data, error } = await supabase.rpc('get_roi_metrics', {
      p_organization_id: organizationId,
    });

    if (error) throw error;

    const roiData: ROIMetrics = data?.[0] || {
      total_enrollments: 0,
      total_completions: 0,
      total_investment: 0,
      overall_completion_rate: 0,
      cost_per_enrollment: 0,
      cost_per_completion: 0,
      roi_ratio: 0,
      course_breakdown: [],
    };

    // Sort courses by ROI
    const sortedCourses = [...(roiData.course_breakdown || [])].sort(
      (a, b) => b.completion_rate - a.completion_rate
    );

    const bestValueCourses = sortedCourses.slice(0, 5).map(c => ({
      course: c.course,
      roi_score: c.completion_rate,
      completion_rate: c.completion_rate,
    }));

    const worstValueCourses = sortedCourses
      .slice(-5)
      .reverse()
      .map(c => ({
        course: c.course,
        roi_score: c.completion_rate,
        completion_rate: c.completion_rate,
      }));

    // Project annual spend based on current rate
    const monthlySpend = roiData.total_investment; // Assuming data is for current period
    const projectedAnnualSpend = monthlySpend * 12; // Rough projection

    return {
      ...roiData,
      best_value_courses: bestValueCourses,
      worst_value_courses: worstValueCourses,
      projected_annual_spend: projectedAnnualSpend,
    };
  }
}
