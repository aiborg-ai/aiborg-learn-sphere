/**
 * Exercise Submission Page
 * Wrapper page that fetches exercise data and renders ExerciseSubmission component
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useExercise } from '@/hooks/useExercise';
import { ExerciseSubmission } from '@/components/exercise';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ExerciseSubmissionPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const { data: exercise, isLoading, error } = useExercise(exerciseId || '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading exercise...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Exercise not found</h2>
          <p className="text-muted-foreground">
            The exercise you're looking for doesn't exist or you don't have access to it.
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
      <ExerciseSubmission exercise={exercise} />
    </div>
  );
}
