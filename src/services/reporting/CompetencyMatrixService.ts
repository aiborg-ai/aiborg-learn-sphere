/**
 * Competency Matrix Service
 * Manages job role competency matrices and user skill assessments
 */

import { supabase } from '@/integrations/supabase/client';
import type { CompetencyMatrix, CompetencySkill, CompetencyAssessment, SkillRating } from './types';

export class CompetencyMatrixService {
  /**
   * Create competency matrix for a job role
   */
  static async create(
    matrix: Partial<CompetencyMatrix>,
    skills: Partial<CompetencySkill>[]
  ): Promise<CompetencyMatrix> {
    const { data: createdMatrix, error: matrixError } = await supabase
      .from('competency_matrices')
      .insert({
        name: matrix.name,
        description: matrix.description,
        industry: matrix.industry,
        job_role: matrix.job_role,
        experience_level: matrix.experience_level,
      })
      .select()
      .single();

    if (matrixError) throw matrixError;

    // Add skills
    const skillsData = skills.map(skill => ({
      matrix_id: createdMatrix.id,
      skill_name: skill.skill_name,
      skill_category: skill.skill_category,
      required_level: skill.required_level,
      importance: skill.importance || 'required',
      description: skill.description,
      assessment_criteria: skill.assessment_criteria,
    }));

    const { error: skillsError } = await supabase.from('competency_skills').insert(skillsData);

    if (skillsError) throw skillsError;

    return { ...createdMatrix, skills: skillsData as CompetencySkill[] };
  }

  /**
   * Assess user against competency matrix
   */
  static async assessUser(
    userId: string,
    matrixId: string,
    skillRatings: { skill_id: string; current_level: number; evidence?: string }[]
  ): Promise<CompetencyAssessment> {
    // Create assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('user_competency_assessments')
      .insert({
        user_id: userId,
        matrix_id: matrixId,
        status: 'draft',
      })
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    // Add skill ratings
    const ratingsData = skillRatings.map(rating => ({
      assessment_id: assessment.id,
      skill_id: rating.skill_id,
      current_level: rating.current_level,
      evidence: rating.evidence,
    }));

    const { error: ratingsError } = await supabase.from('user_skill_ratings').insert(ratingsData);

    if (ratingsError) throw ratingsError;

    // Calculate match score
    const { data: matchScore } = await supabase.rpc('calculate_competency_match', {
      assessment_uuid: assessment.id,
    });

    // Update assessment with score
    await supabase
      .from('user_competency_assessments')
      .update({ overall_match_score: matchScore, status: 'completed' })
      .eq('id', assessment.id);

    return {
      ...assessment,
      overall_match_score: matchScore,
      skill_ratings: ratingsData as SkillRating[],
    };
  }

  /**
   * Get competency gap analysis
   */
  static async getGapAnalysis(userId: string, matrixId: string): Promise<SkillRating[]> {
    const { data: assessment, error } = await supabase
      .from('user_competency_assessments')
      .select(
        `
        *,
        skill_ratings:user_skill_ratings (
          *,
          skill:competency_skills (*)
        )
      `
      )
      .eq('user_id', userId)
      .eq('matrix_id', matrixId)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    return (
      assessment?.skill_ratings.map(
        (rating: {
          skill_id: string;
          current_level: number;
          evidence?: string;
          verified: boolean;
          skill: {
            skill_name: string;
            required_level: number;
          };
        }) => ({
          skill_id: rating.skill_id,
          skill_name: rating.skill.skill_name,
          required_level: rating.skill.required_level,
          current_level: rating.current_level,
          gap: rating.skill.required_level - rating.current_level,
          evidence: rating.evidence,
          verified: rating.verified,
        })
      ) || []
    );
  }
}
