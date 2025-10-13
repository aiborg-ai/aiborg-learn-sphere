/**
 * QuizProgress Component
 * Visual progress indicator for quiz completion
 */

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface QuizProgressProps {
  totalQuestions: number;
  answeredQuestions: number;
  currentQuestion: number;
  questionStatuses?: ('answered' | 'skipped' | 'unanswered')[];
}

export function QuizProgress({
  totalQuestions,
  answeredQuestions,
  currentQuestion,
  questionStatuses,
}: QuizProgressProps) {
  const percentage = (answeredQuestions / totalQuestions) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium">
            Question {currentQuestion + 1} of {totalQuestions}
          </div>
          <div className="text-xs text-muted-foreground">
            {answeredQuestions} answered, {totalQuestions - answeredQuestions} remaining
          </div>
        </div>
        <Badge variant={answeredQuestions === totalQuestions ? 'default' : 'secondary'}>
          {Math.round(percentage)}% Complete
        </Badge>
      </div>

      <Progress value={percentage} className="h-2" />

      {questionStatuses && (
        <div className="flex flex-wrap gap-1">
          {questionStatuses.map((status, index) => (
            <button
              key={index}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                index === currentQuestion ? 'ring-2 ring-primary ring-offset-2' : ''
              } ${
                status === 'answered'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : status === 'skipped'
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={`Question ${index + 1} - ${status}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-100" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-orange-100" />
          <span>Skipped</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <span>Not answered</span>
        </div>
      </div>
    </div>
  );
}
