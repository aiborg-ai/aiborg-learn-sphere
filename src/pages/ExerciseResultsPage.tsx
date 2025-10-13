/**
 * Exercise Results Page
 * Wrapper page that fetches exercise and submission data, renders ExerciseResults component
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useExercise } from '@/hooks/useExercise';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExerciseResults } from '@/components/exercise';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { ExerciseSubmission } from '@/services/exercise/types';

export default function ExerciseResultsPage() {
  const { exerciseId, submissionId } = useParams<{ exerciseId: string; submissionId: string }>();
  const navigate = useNavigate();

  // Fetch exercise
  const {
    data: exercise,
    isLoading: isLoadingExercise,
    error: exerciseError,
  } = useExercise(exerciseId || '');

  // Fetch submission
  const {
    data: submission,
    isLoading: isLoadingSubmission,
    error: submissionError,
  } = useQuery({
    queryKey: ['exercise-submission', submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;
      return data as ExerciseSubmission;
    },
    enabled: !!submissionId,
  });

  const isLoading = isLoadingExercise || isLoadingSubmission;
  const error = exerciseError || submissionError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Results not found</h2>
          <p className="text-muted-foreground">
            The results you're looking for don't exist or you don't have access to them.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <ExerciseResults exercise={exercise} submission={submission} />
    </div>
  );
}
