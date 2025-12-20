/**
 * AI Awareness Assessment Page
 * Adaptive assessment for AI fundamentals, applications, and ethics
 * Target Audiences: Young Learners, Teenagers, Professionals
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAssessmentTool } from '@/hooks/useAssessmentTools';
import { useAssessmentTimer } from '@/hooks/useAssessmentTimer';
import {
  useCreateAssessmentAttempt,
  useCompleteAssessmentAttempt,
} from '@/hooks/useAssessmentAttempts';
import { createAdaptiveEngine } from '@/services/AdaptiveAssessmentEngine';
import type { AdaptiveAssessmentEngine } from '@/services/AdaptiveAssessmentEngine';
import { supabase } from '@/integrations/supabase/client';
import { Navbar, Footer } from '@/components/navigation';
import { AIAssessmentWizardAdaptive } from '@/components/ai-assessment';
import { Loader2 } from '@/components/ui/icons';
import { logger } from '@/utils/logger';

export default function AIAwarenessAssessment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [engine, setEngine] = useState<AdaptiveAssessmentEngine | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const { data: tool, isLoading: toolLoading } = useAssessmentTool('ai-awareness');
  const createAttempt = useCreateAssessmentAttempt();
  const completeAttempt = useCompleteAssessmentAttempt();
  const {
    elapsedSeconds,
    pause: pauseTimer,
    start: startTimer,
  } = useAssessmentTimer({ autoStart: false });

  // Wrap startTimer in useCallback to stabilize reference
  const stableStartTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  // Initialize assessment
  useEffect(() => {
    const initializeAssessment = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;

      // Check if user is authenticated after loading is complete
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to take the AI Awareness Assessment.',
          variant: 'destructive',
        });
        navigate('/auth', { state: { returnTo: '/assessment/ai-awareness' } });
        return;
      }

      if (!tool || attemptId || createAttempt.isPending) return;

      try {
        setIsInitializing(true);

        // 1. Create attempt record
        const attempt = await createAttempt.mutateAsync(tool.id);
        setAttemptId(attempt.id);

        // 2. Create user_ai_assessments record
        const { data: assessment, error: assessmentError } = await supabase
          .from('user_ai_assessments')
          .insert({
            user_id: user.id,
            tool_id: tool.id,
            audience_type: user.user_metadata?.audience || 'professional',
            is_complete: false,
          })
          .select()
          .single();

        if (assessmentError) throw assessmentError;
        setAssessmentId(assessment.id);

        // 3. Link assessment to attempt
        await supabase
          .from('assessment_tool_attempts')
          .update({ assessment_id: assessment.id })
          .eq('id', attempt.id);

        // 4. Create adaptive engine with tool filter
        const adaptiveEngine = await createAdaptiveEngine(assessment.id, tool.id);
        setEngine(adaptiveEngine);

        toast({
          title: 'Assessment Started',
          description: `Starting attempt #${attempt.attempt_number}`,
        });

        // Start the timer
        stableStartTimer();
      } catch (error) {
        logger.error('Error initializing assessment:', error);
        toast({
          title: 'Error',
          description: 'Failed to start assessment. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAssessment();
  }, [authLoading, user, tool, attemptId, createAttempt, toast, navigate, stableStartTimer]);

  // Handle assessment completion
  const _handleAssessmentComplete = async () => {
    if (!engine || !attemptId || !assessmentId) return;

    // Pause the timer when completing
    pauseTimer();

    try {
      // Get final results from engine
      const performanceSummary = await engine.getPerformanceSummary();
      const finalScore = await engine.calculateFinalScore();
      const state = engine.getState();

      // Calculate scores
      const totalScore = performanceSummary.correctAnswers * 10; // 10 points per question
      const maxScore = performanceSummary.totalQuestions * 10;

      // Complete the attempt
      await completeAttempt.mutateAsync({
        attemptId,
        assessmentId,
        totalScore,
        maxPossibleScore: maxScore,
        abilityEstimate: finalScore.abilityScore,
        abilityStandardError: state.standardError,
        questionsAnswered: performanceSummary.totalQuestions,
        correctAnswers: performanceSummary.correctAnswers,
        timeSpentSeconds: elapsedSeconds,
        performanceByCategory: {},
      });

      // Navigate to results
      navigate(`/assessment/ai-awareness/results/${attemptId}`);
    } catch (error) {
      logger.error('Error completing assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save results. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (toolLoading || isInitializing || !engine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Preparing your personalized AI Awareness Assessment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      <div className="container max-w-4xl mx-auto py-8 px-4">
        <AIAssessmentWizardAdaptive />
      </div>

      <Footer />
    </div>
  );
}
