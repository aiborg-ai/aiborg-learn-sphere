import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import type { AssessmentQuestion } from './types';

interface AssessmentHeaderProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: AssessmentQuestion;
  progress: number;
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  currentQuestionIndex,
  totalQuestions,
  currentQuestion,
  progress,
}) => {
  return (
    <CardHeader role="banner" aria-label="Assessment information">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10" aria-hidden="true">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">AIBORG Assessment</CardTitle>
            <CardDescription>
              Discover your AI adoption level and get personalized recommendations
            </CardDescription>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-lg px-3 py-1"
          aria-label={`Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
        >
          {currentQuestionIndex + 1} / {totalQuestions}
        </Badge>
      </div>

      <Progress
        value={progress}
        className="h-2"
        aria-label={`Assessment progress: ${Math.round(progress)}% complete`}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {currentQuestion.category && (
        <div className="mt-4 flex items-center gap-2" role="group" aria-label="Question metadata">
          <Badge variant="secondary" aria-label={`Category: ${currentQuestion.category.name}`}>
            {currentQuestion.category.name}
          </Badge>
          {currentQuestion.difficulty_level && (
            <Badge
              variant="outline"
              className={
                currentQuestion.difficulty_level === 'foundational'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : currentQuestion.difficulty_level === 'applied'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : currentQuestion.difficulty_level === 'advanced'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : currentQuestion.difficulty_level === 'strategic'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : ''
              }
              aria-label={`Difficulty level: ${currentQuestion.difficulty_level}`}
            >
              {currentQuestion.difficulty_level.charAt(0).toUpperCase() +
                currentQuestion.difficulty_level.slice(1)}
            </Badge>
          )}
        </div>
      )}
    </CardHeader>
  );
};
