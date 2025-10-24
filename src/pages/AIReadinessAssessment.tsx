/**
 * AI Readiness Assessment Page
 * Wrapper for the existing SME Assessment with Assessment Tools integration
 * Target Audience: SMEs (Business)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAssessmentTool } from '@/hooks/useAssessmentTools';
import { useCreateAssessmentAttempt } from '@/hooks/useAssessmentAttempts';
import { Loader2 } from 'lucide-react';

// Import the existing SME Assessment component
import SMEAssessment from './SMEAssessment';

export default function AIReadinessAssessment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Fetch the AI-Readiness tool
  const { data: tool, isLoading: toolLoading } = useAssessmentTool('ai-readiness');
  const createAttempt = useCreateAssessmentAttempt();

  // Create attempt on mount
  useEffect(() => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to take the AI Readiness Assessment.',
        variant: 'destructive',
      });
      navigate('/auth', { state: { returnTo: '/assessment/ai-readiness' } });
      return;
    }

    if (tool && !attemptId && !createAttempt.isPending) {
      // Create a new attempt
      createAttempt.mutate(tool.id, {
        onSuccess: attempt => {
          setAttemptId(attempt.id);
          toast({
            title: 'Assessment Started',
            description: `Starting attempt #${attempt.attempt_number}`,
          });
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to start assessment. Please try again.',
            variant: 'destructive',
          });
        },
      });
    }
  }, [user, tool, attemptId, createAttempt, toast, navigate]);

  if (toolLoading || createAttempt.isPending || !attemptId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading AI Readiness Assessment...</p>
        </div>
      </div>
    );
  }

  // Render the existing SME Assessment component
  // The SME Assessment already has all the logic, we just track it as an assessment tool attempt
  return <SMEAssessment />;
}
