/**
 * Organization Service
 * Manages organizations, team members, and team assessments
 */

import { supabase } from '@/integrations/supabase/client';
import type { Organization, TeamAssessment } from './types';

export class OrganizationService {
  /**
   * Create organization
   */
  static async create(org: Partial<Organization>): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: org.name,
        description: org.description,
        industry: org.industry,
        size_range: org.size_range,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add member to organization
   */
  static async addMember(
    orgId: string,
    userId: string,
    role: string = 'member',
    department?: string
  ): Promise<void> {
    const { error } = await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: userId,
      role,
      department,
    });

    if (error) throw error;
  }

  /**
   * Create team assessment
   */
  static async createTeamAssessment(assessment: Partial<TeamAssessment>): Promise<TeamAssessment> {
    const { data, error } = await supabase
      .from('team_assessments')
      .insert({
        organization_id: assessment.organization_id,
        assessment_type: 'ai_opportunity',
        title: assessment.title,
        description: assessment.description,
        is_mandatory: assessment.is_mandatory ?? false,
        due_date: assessment.due_date,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Submit team assessment result
   */
  static async submitAssessmentResult(
    assessmentId: string,
    userId: string,
    score: number,
    resultsData: unknown
  ): Promise<void> {
    const { error } = await supabase.from('team_assessment_results').insert({
      team_assessment_id: assessmentId,
      user_id: userId,
      individual_score: score,
      completed_at: new Date().toISOString(),
      results_data: resultsData,
    });

    if (error) throw error;

    // Update team average
    await this.updateAssessmentStats(assessmentId);
  }

  /**
   * Update team assessment statistics
   */
  private static async updateAssessmentStats(assessmentId: string): Promise<void> {
    const { data: results, error: resultsError } = await supabase
      .from('team_assessment_results')
      .select('individual_score')
      .eq('team_assessment_id', assessmentId);

    if (resultsError) throw resultsError;

    const { data: assessment, error: assessmentError } = await supabase
      .from('team_assessments')
      .select('organization_id')
      .eq('id', assessmentId)
      .single();

    if (assessmentError) throw assessmentError;

    const { count: totalMembers } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', assessment.organization_id);

    const completedCount = results?.length || 0;
    const avgScore =
      results && results.length > 0
        ? results.reduce((sum, r) => sum + (r.individual_score || 0), 0) / results.length
        : 0;
    const completionRate = totalMembers ? (completedCount / totalMembers) * 100 : 0;

    await supabase
      .from('team_assessments')
      .update({
        team_average_score: avgScore,
        completion_rate: completionRate,
      })
      .eq('id', assessmentId);
  }

  /**
   * Get organization team assessment overview
   */
  static async getAssessmentOverview(orgId: string): Promise<unknown> {
    const { data: assessments, error } = await supabase
      .from('team_assessments')
      .select(
        `
        *,
        results:team_assessment_results(count)
      `
      )
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return assessments;
  }
}
