import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AssessmentFormData } from '@/types/aiAssessment';
import { RoadmapGenerator } from '@/services/sme-assessment/RoadmapGenerator';
import { ROICalculator } from '@/services/sme-assessment/ROICalculator';
import { NurturingCampaignService } from '@/services/sme-assessment/NurturingCampaignService';

interface UseSMEAssessmentSubmitProps {
  user: User | null;
  formData: Partial<AssessmentFormData>;
  companyId?: string | null;
  onSuccess?: (assessmentId: string) => void;
}

interface UseSMEAssessmentSubmitReturn {
  saveDraft: () => Promise<string | null>;
  submitAssessment: () => Promise<void>;
  isSaving: boolean;
  assessmentId: string | null;
}

export const useSMEAssessmentSubmit = ({
  user,
  formData,
  companyId,
  onSuccess,
}: UseSMEAssessmentSubmitProps): UseSMEAssessmentSubmitReturn => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  /**
   * Save assessment as draft (is_completed = false)
   */
  const saveDraft = async (): Promise<string | null> => {
    if (!user) {
      logger.warn('User not logged in, cannot save draft');
      return null;
    }

    try {
      setIsSaving(true);

      // Create or update main assessment record
      const assessmentData = {
        user_id: user.id,
        company_id: companyId || null,
        company_name: formData.companyName || '',
        company_mission: formData.companyMission,
        ai_enhancement_description: formData.aiEnhancementDescription,
        strategic_alignment_rating: formData.strategicAlignmentRating,
        current_ai_adoption_level: formData.currentAIAdoptionLevel,
        internal_ai_expertise: formData.internalAIExpertise,
        data_availability_rating: formData.dataAvailabilityRating,
        additional_ai_capabilities: formData.additionalAICapabilities,
        overall_opportunity_rating: formData.overallOpportunityRating,
        ai_adoption_benefit_summary: formData.aiAdoptionBenefitSummary,
        completed_by: formData.completedBy,
        is_completed: false,
        updated_at: new Date().toISOString(),
      };

      let currentAssessmentId = assessmentId;

      if (assessmentId) {
        // Update existing draft
        const { error } = await supabase
          .from('ai_opportunity_assessments')
          .update(assessmentData)
          .eq('id', assessmentId);

        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('ai_opportunity_assessments')
          .insert({ ...assessmentData, created_at: new Date().toISOString() })
          .select()
          .single();

        if (error) throw error;
        currentAssessmentId = data.id;
        setAssessmentId(data.id);
      }

      if (!currentAssessmentId) {
        throw new Error('Failed to get assessment ID');
      }

      // Save pain points
      if (formData.painPoints && formData.painPoints.length > 0) {
        // Delete existing pain points
        await supabase
          .from('assessment_pain_points')
          .delete()
          .eq('assessment_id', currentAssessmentId);

        // Insert new pain points
        const painPointsData = formData.painPoints.map(pp => ({
          assessment_id: currentAssessmentId,
          pain_point: pp.painPoint,
          current_impact: pp.currentImpact,
          ai_capability_to_address: pp.aiCapabilityToAddress,
          impact_after_ai: pp.impactAfterAI,
        }));

        await supabase.from('assessment_pain_points').insert(painPointsData);
      }

      // Save user impacts
      if (formData.userImpacts && formData.userImpacts.length > 0) {
        await supabase
          .from('assessment_user_impacts')
          .delete()
          .eq('assessment_id', currentAssessmentId);

        const userImpactsData = formData.userImpacts.map(ui => ({
          assessment_id: currentAssessmentId,
          user_group: ui.userGroup,
          satisfaction_rating: ui.satisfactionRating,
          user_pain_points: ui.userPainPoints,
          ai_improvements: ui.aiImprovements,
          impact_rating: ui.impactRating,
        }));

        await supabase.from('assessment_user_impacts').insert(userImpactsData);
      }

      // Save benefits
      if (formData.benefits && formData.benefits.length > 0) {
        await supabase
          .from('assessment_benefits')
          .delete()
          .eq('assessment_id', currentAssessmentId);

        const benefitsData = formData.benefits.map(b => ({
          assessment_id: currentAssessmentId,
          benefit_area: b.benefitArea,
          current_status: b.currentStatus,
          ai_improvement: b.aiImprovement,
          impact_rating: b.impactRating,
        }));

        await supabase.from('assessment_benefits').insert(benefitsData);
      }

      // Save risks
      if (formData.risks && formData.risks.length > 0) {
        await supabase.from('assessment_risks').delete().eq('assessment_id', currentAssessmentId);

        const risksData = formData.risks.map(r => ({
          assessment_id: currentAssessmentId,
          risk_factor: r.riskFactor,
          specific_risk: r.specificRisk,
          likelihood: r.likelihood,
          impact_rating: r.impactRating,
          mitigation_strategy: r.mitigationStrategy,
        }));

        await supabase.from('assessment_risks').insert(risksData);
      }

      // Save resources
      if (formData.resources && formData.resources.length > 0) {
        await supabase
          .from('assessment_resources')
          .delete()
          .eq('assessment_id', currentAssessmentId);

        const resourcesData = formData.resources.map(r => ({
          assessment_id: currentAssessmentId,
          resource_type: r.resourceType,
          is_available: r.isAvailable,
          additional_requirements: r.additionalRequirements,
        }));

        await supabase.from('assessment_resources').insert(resourcesData);
      }

      // Save competitors
      if (formData.competitors && formData.competitors.length > 0) {
        await supabase
          .from('assessment_competitors')
          .delete()
          .eq('assessment_id', currentAssessmentId);

        const competitorsData = formData.competitors.map(c => ({
          assessment_id: currentAssessmentId,
          competitor_name: c.competitorName,
          ai_use_case: c.aiUseCase,
          advantage: c.advantage,
          threat_level: c.threatLevel,
        }));

        await supabase.from('assessment_competitors').insert(competitorsData);
      }

      // Save action plan
      if (formData.recommendedNextSteps && formData.recommendedNextSteps.length > 0) {
        await supabase
          .from('assessment_action_plans')
          .delete()
          .eq('assessment_id', currentAssessmentId);

        await supabase.from('assessment_action_plans').insert({
          assessment_id: currentAssessmentId,
          recommended_next_steps: formData.recommendedNextSteps,
        });
      }

      logger.log('Assessment draft saved successfully:', currentAssessmentId);
      return currentAssessmentId;
    } catch (error) {
      logger.error('Error saving assessment draft:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Submit final assessment (is_completed = true)
   */
  const submitAssessment = async (): Promise<void> => {
    try {
      setIsSaving(true);

      // First save as draft to ensure all data is persisted
      const finalAssessmentId = await saveDraft();

      if (!finalAssessmentId) {
        throw new Error('Failed to save assessment');
      }

      // Mark as completed
      const { error } = await supabase
        .from('ai_opportunity_assessments')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', finalAssessmentId);

      if (error) throw error;

      logger.log('Assessment submitted successfully:', finalAssessmentId);

      // Generate roadmap, ROI, and nurturing campaign in parallel
      try {
        logger.log('Generating roadmap, ROI, and nurturing campaign...');

        await Promise.all([
          RoadmapGenerator.generateRoadmap(finalAssessmentId, formData as AssessmentFormData),
          ROICalculator.calculateROI(finalAssessmentId, formData as AssessmentFormData),
          NurturingCampaignService.createCampaign(
            finalAssessmentId,
            user?.id || '',
            user?.email || ''
          ),
        ]);

        logger.log('✓ Successfully generated roadmap, ROI, and nurturing campaign');
      } catch (generationError) {
        // Log error but don't block submission - user can still view basic report
        logger.error('Error generating assessment outputs:', generationError);
        console.error('Generation error details:', generationError);
        // Continue to navigate even if generation fails
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(finalAssessmentId);
      }

      // Navigate to results page
      navigate(`/sme-assessment-report/${finalAssessmentId}`);
    } catch (error) {
      logger.error('Error submitting assessment:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveDraft,
    submitAssessment,
    isSaving,
    assessmentId,
  };
};
