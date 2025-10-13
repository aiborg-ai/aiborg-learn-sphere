/**
 * CourseExercisesTab Component
 * Displays exercises for a course using the ExerciseList component
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useExercisesWithSubmissions } from '@/hooks/useExercise';
import { useAuth } from '@/hooks/useAuth';
import { ExerciseList } from '@/components/exercise';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';
import type { ExerciseWithSubmission } from '@/services/exercise/types';

interface CourseExercisesTabProps {
  courseId: number;
}

export function CourseExercisesTab({ courseId }: CourseExercisesTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || '';

  // Fetch exercises with user's submission status
  const { data: exercises, isLoading } = useExercisesWithSubmissions(courseId, userId);

  const handleExerciseClick = (exercise: ExerciseWithSubmission) => {
    // If user has a submission, navigate based on status
    if (exercise.user_submission) {
      const submission = exercise.user_submission;

      // If completed or passed, show results
      if (submission.status === 'completed' || submission.status === 'passed') {
        navigate(`/exercise/${exercise.id}/results/${submission.id}`);
        return;
      }

      // If under review, show results page
      if (submission.status === 'submitted' || submission.status === 'under_review') {
        navigate(`/exercise/${exercise.id}/results/${submission.id}`);
        return;
      }
    }

    // Otherwise, navigate to submission page (new or continue draft)
    navigate(`/exercise/${exercise.id}/submit`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Practice Exercises
        </CardTitle>
        <CardDescription>
          Complete exercises to practice your skills and earn points
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ExerciseList
          exercises={exercises || []}
          onExerciseClick={handleExerciseClick}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
