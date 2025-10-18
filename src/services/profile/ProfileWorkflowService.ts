import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { LearnerProfile } from '../curriculum/CurriculumGenerationService';

/**
 * Profile Workflow Service
 * Manages step-by-step profile creation wizard
 */

export interface WorkflowStep {
  id: string;
  step_order: number;
  step_name: string;
  title: string;
  description: string;
  step_type: 'form' | 'assessment' | 'selection' | 'review';
  fields_to_collect: FieldDefinition[];
  validation_rules: Record<string, any>;
  is_required: boolean;
  is_skippable: boolean;
  estimated_minutes: number;
  help_text?: string;
  icon_name?: string;
}

export interface FieldDefinition {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: any[];
  conditional?: {
    field: string;
    value?: string;
    values?: string[];
  };
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
  default?: any;
}

export interface WorkflowProgress {
  id: string;
  user_id: string;
  profile_id?: string;
  current_step_order: number;
  completed_steps: number[];
  step_data: Record<string, any>;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
  last_activity_at: string;
}

export interface WorkflowSummary {
  profile_name: string;
  description?: string;
  background: {
    target_audience: string;
    experience_level: string;
    industry?: string;
    job_role?: string;
  };
  learning_goals: Array<{ id: string; label: string }>;
  preferences: {
    learning_style: string;
    hours_per_week: number;
  };
  assessment_linked: boolean;
}

class ProfileWorkflowService {
  /**
   * Get workflow steps template
   */
  async getWorkflowSteps(): Promise<WorkflowStep[]> {
    try {
      const { data, error } = await supabase
        .from('profile_workflow_steps')
        .select('*')
        .order('step_order', { ascending: true });

      if (error) throw error;
      return (data || []) as WorkflowStep[];
    } catch (error) {
      logger.error('Error fetching workflow steps:', error);
      throw error;
    }
  }

  /**
   * Get specific step by order
   */
  async getStep(stepOrder: number): Promise<WorkflowStep | null> {
    try {
      const { data, error } = await supabase
        .from('profile_workflow_steps')
        .select('*')
        .eq('step_order', stepOrder)
        .single();

      if (error) throw error;
      return data as WorkflowStep;
    } catch (error) {
      logger.error(`Error fetching step ${stepOrder}:`, error);
      return null;
    }
  }

  /**
   * Get or create user's workflow progress
   */
  async getOrCreateProgress(userId: string): Promise<WorkflowProgress> {
    try {
      // Try to find existing active workflow
      const { data: existing, error: fetchError } = await supabase
        .from('user_profile_workflow_progress')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['not_started', 'in_progress'])
        .order('last_activity_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existing) {
        return existing as WorkflowProgress;
      }

      // Create new workflow progress
      const { data: newProgress, error: createError } = await supabase
        .from('user_profile_workflow_progress')
        .insert({
          user_id: userId,
          status: 'not_started',
          current_step_order: 1,
          step_data: {},
          completed_steps: [],
        })
        .select()
        .single();

      if (createError) throw createError;
      return newProgress as WorkflowProgress;
    } catch (error) {
      logger.error('Error getting or creating workflow progress:', error);
      throw error;
    }
  }

  /**
   * Get workflow progress by ID
   */
  async getProgress(progressId: string): Promise<WorkflowProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_profile_workflow_progress')
        .select('*')
        .eq('id', progressId)
        .single();

      if (error) throw error;
      return data as WorkflowProgress;
    } catch (error) {
      logger.error('Error fetching workflow progress:', error);
      return null;
    }
  }

  /**
   * Update step data
   */
  async updateStepData(
    progressId: string,
    stepOrder: number,
    stepData: Record<string, any>
  ): Promise<void> {
    try {
      const progress = await this.getProgress(progressId);
      if (!progress) throw new Error('Progress not found');

      // Merge new step data
      const updatedStepData = {
        ...progress.step_data,
        [`step_${stepOrder}`]: stepData,
      };

      const { error } = await supabase
        .from('user_profile_workflow_progress')
        .update({
          step_data: updatedStepData,
          last_activity_at: new Date().toISOString(),
          status: 'in_progress',
        })
        .eq('id', progressId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating step data:', error);
      throw error;
    }
  }

  /**
   * Complete step and advance workflow
   */
  async completeStep(progressId: string, stepOrder: number): Promise<WorkflowProgress> {
    try {
      const progress = await this.getProgress(progressId);
      if (!progress) throw new Error('Progress not found');

      // Add to completed steps if not already there
      const completedSteps = progress.completed_steps.includes(stepOrder)
        ? progress.completed_steps
        : [...progress.completed_steps, stepOrder];

      // Move to next step
      const nextStepOrder = stepOrder + 1;

      const { data, error } = await supabase
        .from('user_profile_workflow_progress')
        .update({
          completed_steps: completedSteps,
          current_step_order: nextStepOrder,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', progressId)
        .select()
        .single();

      if (error) throw error;
      return data as WorkflowProgress;
    } catch (error) {
      logger.error('Error completing step:', error);
      throw error;
    }
  }

  /**
   * Go to specific step
   */
  async goToStep(progressId: string, stepOrder: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profile_workflow_progress')
        .update({
          current_step_order: stepOrder,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', progressId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error navigating to step:', error);
      throw error;
    }
  }

  /**
   * Go to previous step
   */
  async goToPreviousStep(progressId: string): Promise<void> {
    try {
      const progress = await this.getProgress(progressId);
      if (!progress) throw new Error('Progress not found');

      const previousStep = Math.max(1, progress.current_step_order - 1);
      await this.goToStep(progressId, previousStep);
    } catch (error) {
      logger.error('Error going to previous step:', error);
      throw error;
    }
  }

  /**
   * Get workflow summary for review
   */
  async getWorkflowSummary(progressId: string): Promise<WorkflowSummary> {
    try {
      const progress = await this.getProgress(progressId);
      if (!progress) throw new Error('Progress not found');

      const stepData = progress.step_data;

      return {
        profile_name: stepData.step_1?.profile_name || 'Untitled Profile',
        description: stepData.step_1?.description,
        background: {
          target_audience: stepData.step_2?.target_audience || '',
          experience_level: stepData.step_2?.experience_level || 'beginner',
          industry: stepData.step_2?.industry,
          job_role: stepData.step_2?.job_role,
        },
        learning_goals: stepData.step_3?.learning_goals || [],
        preferences: {
          learning_style: stepData.step_4?.preferred_learning_style || 'mixed',
          hours_per_week: stepData.step_4?.available_hours_per_week || 5,
        },
        assessment_linked: !!stepData.step_5?.latest_assessment_id,
      };
    } catch (error) {
      logger.error('Error getting workflow summary:', error);
      throw error;
    }
  }

  /**
   * Finalize workflow and create profile
   */
  async finalizeWorkflow(progressId: string): Promise<LearnerProfile> {
    try {
      const progress = await this.getProgress(progressId);
      if (!progress) throw new Error('Progress not found');

      const stepData = progress.step_data;

      // Create learner profile
      const { data: profile, error: profileError } = await supabase
        .from('learner_profiles')
        .insert({
          user_id: progress.user_id,
          profile_name: stepData.step_1?.profile_name,
          description: stepData.step_1?.description,
          target_audience: stepData.step_2?.target_audience,
          experience_level: stepData.step_2?.experience_level,
          industry: stepData.step_2?.industry,
          job_role: stepData.step_2?.job_role,
          company_size: stepData.step_2?.company_size,
          years_experience: stepData.step_2?.years_experience,
          learning_goals: stepData.step_3?.learning_goals || [],
          preferred_learning_style: stepData.step_4?.preferred_learning_style,
          available_hours_per_week: stepData.step_4?.available_hours_per_week,
          preferred_schedule: stepData.step_4?.preferred_schedule || {},
          latest_assessment_id: stepData.step_5?.latest_assessment_id,
          is_active: true,
          is_primary: true, // First profile is primary by default
          completion_percentage: 100,
          created_via: 'workflow',
          workflow_completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Link assessment if provided
      if (stepData.step_5?.latest_assessment_id) {
        await this.linkAssessmentToProfile(profile.id, stepData.step_5.latest_assessment_id);
      }

      // Update workflow progress
      const { error: updateError } = await supabase
        .from('user_profile_workflow_progress')
        .update({
          status: 'completed',
          profile_id: profile.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', progressId);

      if (updateError) throw updateError;

      logger.info(`Profile created successfully: ${profile.profile_name}`);
      return profile as LearnerProfile;
    } catch (error) {
      logger.error('Error finalizing workflow:', error);
      throw error;
    }
  }

  /**
   * Link assessment to profile and extract IRT scores
   */
  private async linkAssessmentToProfile(profileId: string, assessmentId: string): Promise<void> {
    try {
      // Fetch assessment data
      const { data: assessment, error: assessmentError } = await supabase
        .from('user_ai_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Extract proficiency data
      const proficiencyAreas = this.extractProficiencyAreas(assessment);

      // Update profile with assessment data
      const { error: updateError } = await supabase
        .from('learner_profiles')
        .update({
          latest_assessment_id: assessmentId,
          irt_ability_score: assessment.final_irt_ability,
          proficiency_areas: proficiencyAreas,
        })
        .eq('id', profileId);

      if (updateError) throw updateError;
    } catch (error) {
      logger.error('Error linking assessment to profile:', error);
      // Don't throw - assessment linking is optional
    }
  }

  /**
   * Extract proficiency areas from assessment
   */
  private extractProficiencyAreas(assessment: any): any[] {
    try {
      if (!assessment.category_scores) return [];

      return Object.entries(assessment.category_scores).map(([category, score]) => ({
        category,
        score: typeof score === 'number' ? score : 0.5,
        level: this.scoreToLevel(typeof score === 'number' ? score : 0.5),
      }));
    } catch (error) {
      logger.error('Error extracting proficiency areas:', error);
      return [];
    }
  }

  /**
   * Convert numeric score to level
   */
  private scoreToLevel(score: number): string {
    if (score >= 0.8) return 'expert';
    if (score >= 0.6) return 'advanced';
    if (score >= 0.4) return 'intermediate';
    return 'beginner';
  }

  /**
   * Abandon workflow
   */
  async abandonWorkflow(progressId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profile_workflow_progress')
        .update({
          status: 'abandoned',
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', progressId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error abandoning workflow:', error);
      throw error;
    }
  }

  /**
   * Validate step data
   */
  validateStepData(step: WorkflowStep, data: Record<string, any>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    step.fields_to_collect.forEach((field) => {
      const value = data[field.name];

      // Required field check
      if (field.required && (value === undefined || value === null || value === '')) {
        errors[field.name] = `${field.label} is required`;
        return;
      }

      // Skip further validation if field is empty and not required
      if (!value && !field.required) return;

      // Type-specific validation
      if (field.type === 'text' && typeof value === 'string') {
        if (field.min_length && value.length < field.min_length) {
          errors[field.name] = `${field.label} must be at least ${field.min_length} characters`;
        }
        if (field.max_length && value.length > field.max_length) {
          errors[field.name] = `${field.label} must be at most ${field.max_length} characters`;
        }
      }

      if (field.type === 'number' && typeof value === 'number') {
        if (field.min !== undefined && value < field.min) {
          errors[field.name] = `${field.label} must be at least ${field.min}`;
        }
        if (field.max !== undefined && value > field.max) {
          errors[field.name] = `${field.label} must be at most ${field.max}`;
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

export const profileWorkflowService = new ProfileWorkflowService();
