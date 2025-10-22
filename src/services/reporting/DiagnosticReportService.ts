/**
 * Diagnostic Report Service
 * Generates learner progress reports and team performance analytics
 */

import { supabase } from '@/integrations/supabase/client';
import type { DiagnosticReport } from './types';

export class DiagnosticReportService {
  /**
   * Generate learner progress report
   */
  static async generateLearnerProgress(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DiagnosticReport> {
    // Get user activity data
    const [courses, assessments, sessions] = await Promise.all([
      this.getUserCourseProgress(userId, startDate, endDate),
      this.getUserAssessmentResults(userId, startDate, endDate),
      this.getUserLearningSessions(userId, startDate, endDate),
    ]);

    // Calculate metrics
    const coursesCompleted = courses.filter((c: { progress: number }) => c.progress === 100).length;
    const avgAssessmentScore =
      assessments.length > 0
        ? assessments.reduce((sum: number, a: { score: number }) => sum + a.score, 0) /
          assessments.length
        : 0;

    // Analyze strengths and weaknesses
    const skillScores = this.analyzeSkillPerformance(assessments);
    const strengths = Object.entries(skillScores)
      .filter(([_, score]) => score >= 80)
      .map(([skill]) => skill);
    const weaknesses = Object.entries(skillScores)
      .filter(([_, score]) => score < 60)
      .map(([skill]) => skill);

    // Generate recommendations
    const recommendations = this.generateRecommendations(strengths, weaknesses, courses);

    // Create report
    const { data: report, error } = await supabase
      .from('diagnostic_reports')
      .insert({
        user_id: userId,
        report_type: 'learner_progress',
        title: `Progress Report: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        overall_score: avgAssessmentScore,
        completion_rate: courses.length > 0 ? (coursesCompleted / courses.length) * 100 : 0,
        engagement_score: this.calculateEngagementScore(sessions, courses),
        strengths,
        weaknesses,
        recommendations,
        skill_breakdown: skillScores,
        progress_timeline: this.buildProgressTimeline(courses, assessments),
        period_start: startDate,
        period_end: endDate,
        report_data: {
          courses_completed: coursesCompleted,
          assessments_taken: assessments.length,
          study_hours:
            sessions.reduce(
              (sum: number, s: { duration_minutes?: number }) => sum + (s.duration_minutes || 0),
              0
            ) / 60,
        },
      })
      .select()
      .single();

    if (error) throw error;
    return report;
  }

  /**
   * Generate team performance report
   */
  static async generateTeamPerformance(
    organizationId: string,
    departmentFilter?: string
  ): Promise<DiagnosticReport> {
    // Get team members
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id, department')
      .eq('organization_id', organizationId)
      .eq('department', departmentFilter || '');

    if (membersError) throw membersError;

    // Aggregate team metrics
    const teamData = await Promise.all(
      members!.map((m: { user_id: string }) => this.getUserMetrics(m.user_id))
    );

    const avgScore = teamData.reduce((sum, d) => sum + (d.avg_score || 0), 0) / teamData.length;
    const avgCompletion =
      teamData.reduce((sum, d) => sum + (d.completion_rate || 0), 0) / teamData.length;

    // Create report
    const { data: report, error } = await supabase
      .from('diagnostic_reports')
      .insert({
        user_id: members![0].user_id,
        report_type: 'team_performance',
        title: `Team Performance Report - ${departmentFilter || 'All Departments'}`,
        overall_score: avgScore,
        completion_rate: avgCompletion,
        report_data: {
          team_size: members!.length,
          department: departmentFilter,
          member_data: teamData,
        },
      })
      .select()
      .single();

    if (error) throw error;
    return report;
  }

  // Helper methods
  private static async getUserCourseProgress(
    userId: string,
    start: Date,
    end: Date
  ): Promise<unknown[]> {
    const { data } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', start.toISOString())
      .lte('updated_at', end.toISOString());
    return data || [];
  }

  private static async getUserAssessmentResults(
    userId: string,
    start: Date,
    end: Date
  ): Promise<unknown[]> {
    const { data } = await supabase
      .from('ai_assessment_results')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
    return data || [];
  }

  private static async getUserLearningSessions(
    userId: string,
    start: Date,
    end: Date
  ): Promise<unknown[]> {
    const { data } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('session_date', start.toISOString())
      .lte('session_date', end.toISOString());
    return data || [];
  }

  private static analyzeSkillPerformance(assessments: unknown[]): Record<string, number> {
    const skillScores: Record<string, number[]> = {};

    assessments.forEach(assessment => {
      const a = assessment as { results?: Record<string, number> };
      if (a.results) {
        Object.entries(a.results).forEach(([skill, score]) => {
          if (!skillScores[skill]) skillScores[skill] = [];
          skillScores[skill].push(score);
        });
      }
    });

    return Object.fromEntries(
      Object.entries(skillScores).map(([skill, scores]) => [
        skill,
        scores.reduce((sum, s) => sum + s, 0) / scores.length,
      ])
    );
  }

  private static generateRecommendations(
    strengths: string[],
    weaknesses: string[],
    courses: unknown[]
  ): string[] {
    const recommendations: string[] = [];

    if (weaknesses.length > 0) {
      recommendations.push(`Focus on improving: ${weaknesses.slice(0, 3).join(', ')}`);
    }

    if (courses.length > 0) {
      recommendations.push('Complete ongoing courses to boost your progress');
    }

    if (strengths.length > 0) {
      recommendations.push(`Leverage your strengths in ${strengths[0]} for advanced topics`);
    }

    return recommendations;
  }

  private static calculateEngagementScore(sessions: unknown[], courses: unknown[]): number {
    const sessionCount = sessions.length;
    const avgSessionDuration =
      sessions.reduce(
        (sum, s) => sum + ((s as { duration_minutes?: number }).duration_minutes || 0),
        0
      ) / Math.max(sessionCount, 1);

    const score = Math.min(100, sessionCount * 5 + avgSessionDuration / 2);
    return Math.round(score);
  }

  private static buildProgressTimeline(courses: unknown[], assessments: unknown[]): unknown[] {
    const events = [
      ...courses.map(c => ({
        date: (c as { updated_at: string }).updated_at,
        type: 'course',
        data: c,
      })),
      ...assessments.map(a => ({
        date: (a as { created_at: string }).created_at,
        type: 'assessment',
        data: a,
      })),
    ];

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private static async getUserMetrics(
    userId: string
  ): Promise<{ avg_score: number; completion_rate: number }> {
    const { data: courses } = await supabase
      .from('course_enrollments')
      .select('progress')
      .eq('user_id', userId);

    const { data: assessments } = await supabase
      .from('ai_assessment_results')
      .select('score')
      .eq('user_id', userId);

    return {
      avg_score: assessments?.reduce((sum, a) => sum + a.score, 0) / (assessments?.length || 1),
      completion_rate: courses?.reduce((sum, c) => sum + c.progress, 0) / (courses?.length || 1),
    };
  }
}
