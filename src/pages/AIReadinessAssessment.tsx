// ============================================================================
// AI-Readiness Assessment Page
// Main assessment interface using BaseAssessmentWizard and all sections
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateAssessment,
  useAssessment,
  useSaveSection,
  useCompleteAssessment,
} from '@/hooks/useAIReadinessAssessment';
import { BaseAssessmentWizard } from '@/components/ai-readiness';
import {
  StrategicAlignmentSection,
  DataMaturitySection,
  TechInfrastructureSection,
  HumanCapitalSection,
  ProcessMaturitySection,
  ChangeReadinessSection,
} from '@/components/ai-readiness/sections';
import { Loader2, Target, Database, Cpu, Users, GitBranch, RefreshCw } from 'lucide-react';
import type { DimensionType, AIReadinessFormData } from '@/types/aiReadiness';
import { defaultFormData } from '@/types/aiReadiness';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export default function AIReadinessAssessment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [assessmentId, setAssessmentId] = useState<string | null>(searchParams.get('id') || null);
  const [formData, setFormData] = useState<AIReadinessFormData>(defaultFormData);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hooks
  const createAssessment = useCreateAssessment();
  const { data: assessment, isLoading: assessmentLoading } = useAssessment(assessmentId);
  const saveSection = useSaveSection();
  const completeAssessment = useCompleteAssessment();

  // Check authentication
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to take the AI-Readiness Assessment.',
        variant: 'destructive',
      });
      navigate('/auth', { state: { returnTo: '/assessment/ai-readiness' } });
    }
  }, [authLoading, user, navigate, toast]);

  // Initialize assessment
  useEffect(() => {
    if (authLoading || !user || isInitialized) return;

    // If no assessment ID, create new one
    if (!assessmentId && !createAssessment.isPending) {
      const companyName = searchParams.get('company') || undefined;
      const industry = searchParams.get('industry') || undefined;
      const companySize = searchParams.get('size') || undefined;

      createAssessment.mutate(
        {
          company_name: companyName,
          industry,
          company_size: companySize,
          assessment_tier: 'freemium',
        },
        {
          onSuccess: newAssessment => {
            setAssessmentId(newAssessment.id);
            setIsInitialized(true);
            toast({
              title: 'Assessment Started',
              description: 'Your AI-Readiness assessment has been created.',
            });
          },
          onError: () => {
            toast({
              title: 'Error',
              description: 'Failed to start assessment. Please try again.',
              variant: 'destructive',
            });
          },
        }
      );
    } else if (assessmentId) {
      setIsInitialized(true);
    }
  }, [authLoading, user, assessmentId, searchParams, createAssessment, toast, isInitialized]);

  // Load existing responses into form data
  useEffect(() => {
    if (!assessment || !assessmentId) return;

    // Load responses from dimension tables
    const loadResponses = async () => {
      const tableMap: Record<DimensionType, string> = {
        overall: 'ai_readiness_assessments',
        strategic: 'readiness_strategic_alignment',
        data: 'readiness_data_maturity',
        tech: 'readiness_tech_infrastructure',
        human: 'readiness_human_capital',
        process: 'readiness_process_maturity',
        change: 'readiness_change_readiness',
      };

      const loadedData: Partial<AIReadinessFormData> = {};
      const sections: DimensionType[] = ['strategic', 'data', 'tech', 'human', 'process', 'change'];

      for (const section of sections) {
        try {
          const { data, error } = await supabase
            .from(tableMap[section])
            .select('*')
            .eq('assessment_id', assessmentId)
            .single();

          if (!error && data) {
            // Remove system fields and store responses
            const { id, assessment_id, created_at, updated_at, ...responses } = data;
            loadedData[section] = responses;
          }
        } catch (_error) {
          // Section might not exist yet, that's okay
          logger.warn(`Could not load section ${section}:`, _error);
        }
      }

      // Only update if we found any data
      if (Object.keys(loadedData).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...loadedData,
        }));
      }
    };

    loadResponses();
  }, [assessment, assessmentId]);

  // Handle section change
  const handleSectionChange = (sectionId: DimensionType, data: Record<string, unknown>) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: data,
    }));
  };

  // Handle save draft
  const handleSaveDraft = async () => {
    if (!assessmentId) return;

    // Save all sections
    const sections: DimensionType[] = ['strategic', 'data', 'tech', 'human', 'process', 'change'];

    for (const section of sections) {
      const sectionData = formData[section];
      if (sectionData && Object.keys(sectionData).length > 0) {
        try {
          await saveSection.mutateAsync({
            assessmentId,
            section,
            responses: sectionData,
          });
        } catch {
          // Continue saving other sections even if one fails
        }
      }
    }
  };

  // Handle completion
  const handleComplete = async () => {
    if (!assessmentId) return;

    try {
      await completeAssessment.mutateAsync({
        assessmentId,
        formData,
      });

      toast({
        title: 'Assessment Complete!',
        description: 'Generating your personalized readiness report...',
      });

      // Navigate to results page
      navigate(`/assessment/ai-readiness/results/${assessmentId}`);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to complete assessment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Define sections
  const sections = [
    {
      id: 'strategic' as DimensionType,
      title: 'Strategic Alignment',
      description: 'Assess leadership commitment, budget, and strategic clarity for AI adoption',
      icon: Target,
      component: StrategicAlignmentSection,
      questionsCount: 10,
    },
    {
      id: 'data' as DimensionType,
      title: 'Data Maturity',
      description:
        'Evaluate data quality, accessibility, governance, and readiness for AI applications',
      icon: Database,
      component: DataMaturitySection,
      questionsCount: 12,
    },
    {
      id: 'tech' as DimensionType,
      title: 'Technical Infrastructure',
      description: 'Review IT systems, cloud readiness, APIs, and technical capabilities',
      icon: Cpu,
      component: TechInfrastructureSection,
      questionsCount: 10,
    },
    {
      id: 'human' as DimensionType,
      title: 'Human Capital',
      description: 'Assess team AI literacy, skills, training, and learning culture',
      icon: Users,
      component: HumanCapitalSection,
      questionsCount: 12,
    },
    {
      id: 'process' as DimensionType,
      title: 'Process Maturity',
      description: 'Evaluate process documentation, standardization, and automation readiness',
      icon: GitBranch,
      component: ProcessMaturitySection,
      questionsCount: 10,
    },
    {
      id: 'change' as DimensionType,
      title: 'Change Readiness',
      description: 'Measure organizational capacity for change management and cultural adaptation',
      icon: RefreshCw,
      component: ChangeReadinessSection,
      questionsCount: 10,
    },
  ];

  // Show loading state
  if (authLoading || !isInitialized || (assessmentId && assessmentLoading)) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80">Loading AI-Readiness Assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">AI-Readiness Assessment</h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Evaluate your organization's readiness for AI adoption across 6 critical dimensions.
            Receive a personalized roadmap and actionable recommendations.
          </p>
        </div>

        {/* Assessment Wizard */}
        <BaseAssessmentWizard
          sections={sections}
          formData={formData}
          onSectionChange={handleSectionChange}
          onSaveDraft={handleSaveDraft}
          onComplete={handleComplete}
          autoSaveInterval={30000}
        />
      </div>
    </div>
  );
}
