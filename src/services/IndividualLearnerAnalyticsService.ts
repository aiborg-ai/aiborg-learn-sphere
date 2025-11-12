/**
 * Individual Learner Analytics Service
 * Comprehensive analytics for tracking individual learner performance,
 * progress, engagement, and risk factors
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  IndividualLearnerSummary,
  IndividualCoursePerformance,
  LearningVelocity,
  AssessmentPattern,
  EngagementTimeline,
  AtRiskLearner,
  LearningPathProgressDetailed,
  SkillsProgress,
  ManagerDirectReport,
  LearnerInsight,
} from '@/types';

export interface DateRangeParams {
  startDate?: Date;
  endDate?: Date;
}

export interface LearnerFilters {
  status?: 'active' | 'inactive' | 'dormant';
  organizationId?: string;
  department?: string;
  minRiskScore?: number;
  maxRiskScore?: number;
}

export class IndividualLearnerAnalyticsService {
  // ============================================================================
  // Learner Summary
  // ============================================================================

  /**
   * Get summary for a specific learner
   */
  static async getLearnerSummary(userId: string): Promise<IndividualLearnerSummary | null> {
    const { data, error } = await supabase
      .from('individual_learner_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Return null if not found (not an error)
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  /**
   * Get summaries for multiple learners
   */
  static async getLearnerSummaries(
    filters: LearnerFilters = {}
  ): Promise<IndividualLearnerSummary[]> {
    let query = supabase.from('individual_learner_summary').select('*');

    if (filters.status) {
      query = query.eq('learner_status', filters.status);
    }

    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }

    if (filters.department) {
      query = query.eq('department', filters.department);
    }

    const { data, error } = await query.order('full_name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get learner health score
   */
  static async getLearnerHealthScore(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_learner_health_score', {
      p_user_id: userId,
    });

    if (error) throw error;
    return data || 0;
  }

  /**
   * Get learner insights
   */
  static async getLearnerInsights(userId: string): Promise<LearnerInsight[]> {
    const { data, error } = await supabase.rpc('get_learner_insights', {
      p_user_id: userId,
    });

    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // Course Performance
  // ============================================================================

  /**
   * Get course performance for a learner
   */
  static async getLearnerCoursePerformance(userId: string): Promise<IndividualCoursePerformance[]> {
    const { data, error } = await supabase
      .from('individual_course_performance')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get specific course performance
   */
  static async getCoursePerformance(
    userId: string,
    courseId: number
  ): Promise<IndividualCoursePerformance | null> {
    const { data, error } = await supabase
      .from('individual_course_performance')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  /**
   * Get top performing courses for a learner
   */
  static async getTopPerformingCourses(
    userId: string,
    limit: number = 5
  ): Promise<IndividualCoursePerformance[]> {
    const { data, error } = await supabase
      .from('individual_course_performance')
      .select('*')
      .eq('user_id', userId)
      .order('engagement_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get struggling courses for a learner
   */
  static async getStrugglingCourses(
    userId: string,
    limit: number = 5
  ): Promise<IndividualCoursePerformance[]> {
    const { data, error } = await supabase
      .from('individual_course_performance')
      .select('*')
      .eq('user_id', userId)
      .lt('engagement_score', 50)
      .is('completed_at', null)
      .order('engagement_score', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // Learning Velocity
  // ============================================================================

  /**
   * Get learning velocity for a learner
   */
  static async getLearningVelocity(
    userId: string,
    weeks: number = 12
  ): Promise<LearningVelocity[]> {
    const { data, error } = await supabase
      .from('learning_velocity')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(weeks);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get current week velocity
   */
  static async getCurrentWeekVelocity(userId: string): Promise<LearningVelocity | null> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('learning_velocity')
      .select('*')
      .eq('user_id', userId)
      .gte('week_start', weekStart.toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // ============================================================================
  // Assessment Patterns
  // ============================================================================

  /**
   * Get assessment patterns for a learner
   */
  static async getAssessmentPatterns(userId: string): Promise<AssessmentPattern | null> {
    const { data, error } = await supabase
      .from('assessment_patterns')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // ============================================================================
  // Engagement Timeline
  // ============================================================================

  /**
   * Get engagement timeline for a learner
   */
  static async getEngagementTimeline(
    userId: string,
    days: number = 30
  ): Promise<EngagementTimeline[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('engagement_timeline')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', startDate.toISOString().split('T')[0])
      .order('activity_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get engagement by event type
   */
  static async getEngagementByType(
    userId: string,
    days: number = 30
  ): Promise<Record<string, number>> {
    const timeline = await this.getEngagementTimeline(userId, days);

    return timeline.reduce(
      (acc, event) => {
        if (!acc[event.event_type]) {
          acc[event.event_type] = 0;
        }
        acc[event.event_type] += event.event_count;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  // ============================================================================
  // At-Risk Learners
  // ============================================================================

  /**
   * Check if learner is at risk
   */
  static async isLearnerAtRisk(userId: string): Promise<AtRiskLearner | null> {
    const { data, error } = await supabase
      .from('at_risk_learners')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  /**
   * Get all at-risk learners
   */
  static async getAtRiskLearners(filters: LearnerFilters = {}): Promise<AtRiskLearner[]> {
    let query = supabase.from('at_risk_learners').select('*');

    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }

    if (filters.department) {
      query = query.eq('department', filters.department);
    }

    if (filters.minRiskScore !== undefined) {
      query = query.gte('risk_score', filters.minRiskScore);
    }

    if (filters.maxRiskScore !== undefined) {
      query = query.lte('risk_score', filters.maxRiskScore);
    }

    const { data, error } = await query.order('risk_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get high-risk learners (risk score >= 70)
   */
  static async getHighRiskLearners(organizationId?: string): Promise<AtRiskLearner[]> {
    return this.getAtRiskLearners({
      organizationId,
      minRiskScore: 70,
    });
  }

  // ============================================================================
  // Learning Paths
  // ============================================================================

  /**
   * Get learning path progress for a learner
   */
  static async getLearningPathProgress(userId: string): Promise<LearningPathProgressDetailed[]> {
    const { data, error } = await supabase
      .from('learning_path_progress_detailed')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get active learning paths
   */
  static async getActiveLearningPaths(userId: string): Promise<LearningPathProgressDetailed[]> {
    const { data, error } = await supabase
      .from('learning_path_progress_detailed')
      .select('*')
      .eq('user_id', userId)
      .is('completed_at', null)
      .order('progress_percentage', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // Skills Progress
  // ============================================================================

  /**
   * Get skills progress for a learner
   */
  static async getSkillsProgress(userId: string): Promise<SkillsProgress[]> {
    const { data, error } = await supabase
      .from('skills_progress')
      .select('*')
      .eq('user_id', userId)
      .order('completed_courses_with_skill', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get skills by proficiency level
   */
  static async getSkillsByProficiency(
    userId: string,
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  ): Promise<SkillsProgress[]> {
    const { data, error } = await supabase
      .from('skills_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('proficiency_level', proficiency)
      .order('completed_courses_with_skill', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get skill categories summary
   */
  static async getSkillCategoriesSummary(userId: string): Promise<Record<string, number>> {
    const skills = await this.getSkillsProgress(userId);

    return skills.reduce(
      (acc, skill) => {
        const category = skill.skill_category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += skill.completed_courses_with_skill;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  // ============================================================================
  // Manager Dashboard
  // ============================================================================

  /**
   * Get direct reports for a manager
   */
  static async getManagerDirectReports(managerId: string): Promise<ManagerDirectReport[]> {
    const { data, error } = await supabase
      .from('manager_direct_reports')
      .select('*')
      .eq('manager_id', managerId)
      .order('report_name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get at-risk direct reports
   */
  static async getAtRiskDirectReports(
    managerId: string,
    minRiskScore: number = 40
  ): Promise<ManagerDirectReport[]> {
    const { data, error } = await supabase
      .from('manager_direct_reports')
      .select('*')
      .eq('manager_id', managerId)
      .gte('risk_score', minRiskScore)
      .order('risk_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get top performing direct reports
   */
  static async getTopPerformingReports(
    managerId: string,
    limit: number = 5
  ): Promise<ManagerDirectReport[]> {
    const { data, error } = await supabase
      .from('manager_direct_reports')
      .select('*')
      .eq('manager_id', managerId)
      .eq('learner_status', 'active')
      .order('avg_progress_percentage', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // Combined Dashboard Data
  // ============================================================================

  /**
   * Get comprehensive learner dashboard data
   */
  static async getLearnerDashboard(userId: string) {
    const [
      summary,
      courses,
      velocity,
      assessments,
      timeline,
      atRisk,
      learningPaths,
      skills,
      healthScore,
      insights,
    ] = await Promise.all([
      this.getLearnerSummary(userId),
      this.getLearnerCoursePerformance(userId),
      this.getLearningVelocity(userId, 12),
      this.getAssessmentPatterns(userId),
      this.getEngagementTimeline(userId, 30),
      this.isLearnerAtRisk(userId),
      this.getLearningPathProgress(userId),
      this.getSkillsProgress(userId),
      this.getLearnerHealthScore(userId),
      this.getLearnerInsights(userId),
    ]);

    return {
      summary,
      courses,
      velocity,
      assessments,
      timeline,
      atRisk,
      learningPaths,
      skills,
      healthScore,
      insights,
    };
  }

  /**
   * Get manager dashboard data
   */
  static async getManagerDashboard(managerId: string) {
    const [directReports, atRiskReports, topPerformers] = await Promise.all([
      this.getManagerDirectReports(managerId),
      this.getAtRiskDirectReports(managerId),
      this.getTopPerformingReports(managerId),
    ]);

    return {
      directReports,
      atRiskReports,
      topPerformers,
      totalReports: directReports.length,
      atRiskCount: atRiskReports.length,
      activeCount: directReports.filter(r => r.learner_status === 'active').length,
      inactiveCount: directReports.filter(r => r.learner_status !== 'active').length,
    };
  }

  // ============================================================================
  // Comparison & Benchmarking
  // ============================================================================

  /**
   * Compare learner to department average
   */
  static async compareToDepartmentAverage(userId: string, department: string) {
    const [learner, deptLearners] = await Promise.all([
      this.getLearnerSummary(userId),
      this.getLearnerSummaries({ department }),
    ]);

    if (!learner || deptLearners.length === 0) {
      return null;
    }

    const deptAvg = {
      avg_progress_percentage:
        deptLearners.reduce((sum, l) => sum + l.avg_progress_percentage, 0) / deptLearners.length,
      avg_assignment_score:
        deptLearners.reduce((sum, l) => sum + l.avg_assignment_score, 0) / deptLearners.length,
      total_time_spent_minutes:
        deptLearners.reduce((sum, l) => sum + l.total_time_spent_minutes, 0) / deptLearners.length,
    };

    return {
      learner,
      departmentAverage: deptAvg,
      comparison: {
        progress_vs_avg: learner.avg_progress_percentage - deptAvg.avg_progress_percentage,
        score_vs_avg: learner.avg_assignment_score - deptAvg.avg_assignment_score,
        time_vs_avg: learner.total_time_spent_minutes - deptAvg.total_time_spent_minutes,
      },
    };
  }

  /**
   * Get learner percentile in organization
   */
  static async getLearnerPercentile(userId: string, organizationId: string) {
    const learners = await this.getLearnerSummaries({ organizationId });
    const learner = learners.find(l => l.user_id === userId);

    if (!learner) return null;

    const sortedByProgress = [...learners].sort(
      (a, b) => b.avg_progress_percentage - a.avg_progress_percentage
    );
    const sortedByScore = [...learners].sort(
      (a, b) => b.avg_assignment_score - a.avg_assignment_score
    );

    const progressRank = sortedByProgress.findIndex(l => l.user_id === userId) + 1;
    const scoreRank = sortedByScore.findIndex(l => l.user_id === userId) + 1;

    return {
      totalLearners: learners.length,
      progressPercentile: Math.round((1 - progressRank / learners.length) * 100),
      scorePercentile: Math.round((1 - scoreRank / learners.length) * 100),
      progressRank,
      scoreRank,
    };
  }
}
