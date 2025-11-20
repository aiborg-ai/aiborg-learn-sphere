/**
 * Skill Extraction Service
 *
 * AI-powered service for:
 * - Extracting skills from course content
 * - Matching skills to industry taxonomy
 * - Generating skill recommendations
 * - Managing user skill inventory
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface IndustrySkill {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  industry: string[];
  proficiency_levels: string[];
  is_trending: boolean;
  demand_score: number;
}

export interface UserSkill {
  id: string;
  skill_id: string;
  skill: IndustrySkill;
  proficiency_level: string;
  proficiency_score: number;
  verified: boolean;
  source: string;
  last_practiced_at: string | null;
}

export interface SkillRecommendation {
  id: string;
  skill_id: string;
  skill: IndustrySkill;
  reason: string;
  priority_score: number;
  estimated_hours: number;
  business_impact: string;
  recommended_courses: string[];
}

export interface JobRoleMatch {
  match_percentage: number;
  matched_skills: number;
  total_required: number;
  skill_gaps: {
    skill_name: string;
    required_level: string;
    current_level: string;
    importance: string;
  }[];
  strengths: {
    skill_name: string;
    required_level: string;
    current_level: string;
  }[];
}

export interface JobRole {
  id: string;
  title: string;
  slug: string;
  description: string;
  industry: string[];
  experience_level: string;
  average_salary_usd: number;
  growth_rate: number;
}

class SkillExtractionServiceClass {
  /**
   * Get all industry skills from taxonomy
   */
  async getIndustrySkills(options?: {
    category?: string;
    trending_only?: boolean;
    search?: string;
  }): Promise<IndustrySkill[]> {
    try {
      let query = supabase
        .from('industry_skills')
        .select('*')
        .order('demand_score', { ascending: false });

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.trending_only) {
        query = query.eq('is_trending', true);
      }

      if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching industry skills:', error);
      throw error;
    }
  }

  /**
   * Get user's skill inventory
   */
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    try {
      const { data, error } = await supabase
        .from('user_skills_inventory')
        .select(
          `
          *,
          skill:industry_skills(*)
        `
        )
        .eq('user_id', userId)
        .order('proficiency_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching user skills:', error);
      throw error;
    }
  }

  /**
   * Add or update a skill in user's inventory
   */
  async updateUserSkill(
    userId: string,
    skillId: string,
    data: {
      proficiency_level: string;
      proficiency_score: number;
      source?: string;
      verified?: boolean;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase.from('user_skills_inventory').upsert(
        {
          user_id: userId,
          skill_id: skillId,
          ...data,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,skill_id',
        }
      );

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating user skill:', error);
      throw error;
    }
  }

  /**
   * Get skill recommendations for user
   */
  async getRecommendations(userId: string): Promise<SkillRecommendation[]> {
    try {
      // First generate recommendations
      await supabase.rpc('generate_skill_recommendations', { p_user_id: userId });

      // Then fetch them
      const { data, error } = await supabase
        .from('skill_recommendations')
        .select(
          `
          *,
          skill:industry_skills(*)
        `
        )
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('priority_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching skill recommendations:', error);
      throw error;
    }
  }

  /**
   * Dismiss a skill recommendation
   */
  async dismissRecommendation(recommendationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('skill_recommendations')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', recommendationId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error dismissing recommendation:', error);
      throw error;
    }
  }

  /**
   * Get all job roles
   */
  async getJobRoles(options?: {
    industry?: string;
    experience_level?: string;
  }): Promise<JobRole[]> {
    try {
      let query = supabase.from('job_roles').select('*').order('growth_rate', { ascending: false });

      if (options?.experience_level) {
        query = query.eq('experience_level', options.experience_level);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching job roles:', error);
      throw error;
    }
  }

  /**
   * Get skill match for a job role
   */
  async getJobRoleMatch(userId: string, jobRoleId: string): Promise<JobRoleMatch> {
    try {
      const { data, error } = await supabase.rpc('get_job_role_skill_match', {
        p_user_id: userId,
        p_job_role_id: jobRoleId,
      });

      if (error) throw error;

      return (
        data?.[0] || {
          match_percentage: 0,
          matched_skills: 0,
          total_required: 0,
          skill_gaps: [],
          strengths: [],
        }
      );
    } catch (error) {
      logger.error('Error getting job role match:', error);
      throw error;
    }
  }

  /**
   * Set user's career goal
   */
  async setCareerGoal(userId: string, jobRoleId: string, targetDate?: Date): Promise<void> {
    try {
      const { error } = await supabase.from('user_career_goals').upsert(
        {
          user_id: userId,
          job_role_id: jobRoleId,
          target_date: targetDate?.toISOString().split('T')[0],
          is_active: true,
          priority: 1,
        },
        {
          onConflict: 'user_id,job_role_id',
        }
      );

      if (error) throw error;
    } catch (error) {
      logger.error('Error setting career goal:', error);
      throw error;
    }
  }

  /**
   * Get user's career goals
   */
  async getCareerGoals(userId: string): Promise<
    Array<{
      id: string;
      job_role: JobRole;
      target_date: string | null;
      priority: number;
      is_active: boolean;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from('user_career_goals')
        .select(
          `
          *,
          job_role:job_roles(*)
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching career goals:', error);
      throw error;
    }
  }

  /**
   * Get skill percentile for user
   */
  async getSkillPercentile(
    userId: string,
    skillId: string,
    benchmarkGroup: string = 'industry'
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_user_skill_percentile', {
        p_user_id: userId,
        p_skill_id: skillId,
        p_benchmark_group: benchmarkGroup,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      logger.error('Error getting skill percentile:', error);
      throw error;
    }
  }

  /**
   * Record skill assessment result
   */
  async recordAssessment(
    userId: string,
    skillId: string,
    data: {
      assessment_type: string;
      course_id?: string;
      score: number;
      proficiency_level: string;
      time_taken_seconds?: number;
      questions_answered?: number;
      correct_answers?: number;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase.from('skill_assessments').insert({
        user_id: userId,
        skill_id: skillId,
        ...data,
      });

      if (error) throw error;

      // Update user skill inventory based on assessment
      await this.updateUserSkill(userId, skillId, {
        proficiency_level: data.proficiency_level,
        proficiency_score: data.score,
        source: 'assessment',
        verified: true,
      });
    } catch (error) {
      logger.error('Error recording skill assessment:', error);
      throw error;
    }
  }

  /**
   * Get skills by category summary
   */
  async getSkillsByCategorySummary(userId: string): Promise<
    Record<
      string,
      {
        total: number;
        average_score: number;
        skills: UserSkill[];
      }
    >
  > {
    try {
      const skills = await this.getUserSkills(userId);

      const summary: Record<
        string,
        {
          total: number;
          average_score: number;
          skills: UserSkill[];
        }
      > = {};

      for (const skill of skills) {
        const category = skill.skill.category;
        if (!summary[category]) {
          summary[category] = {
            total: 0,
            average_score: 0,
            skills: [],
          };
        }
        summary[category].total++;
        summary[category].skills.push(skill);
      }

      // Calculate averages
      for (const category in summary) {
        const total = summary[category].skills.reduce((sum, s) => sum + s.proficiency_score, 0);
        summary[category].average_score = Math.round(total / summary[category].total);
      }

      return summary;
    } catch (error) {
      logger.error('Error getting skills by category:', error);
      throw error;
    }
  }

  /**
   * Get trending skills not in user's inventory
   */
  async getTrendingSkillsToLearn(userId: string, limit: number = 5): Promise<IndustrySkill[]> {
    try {
      const userSkills = await this.getUserSkills(userId);
      const userSkillIds = new Set(userSkills.map(s => s.skill_id));

      const allTrending = await this.getIndustrySkills({ trending_only: true });

      return allTrending.filter(skill => !userSkillIds.has(skill.id)).slice(0, limit);
    } catch (error) {
      logger.error('Error getting trending skills to learn:', error);
      throw error;
    }
  }
}

export const SkillExtractionService = new SkillExtractionServiceClass();
