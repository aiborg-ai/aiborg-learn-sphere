/**
 * FreeResponseQuestion Component
 * Renders a free response question with AI grading
 */

import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { LingoQuestion, AnswerResult } from '@/types/lingo.types';

interface FreeResponseQuestionProps {
  question: LingoQuestion;
  onSubmit: (answer: string) => Promise<void> | void;
  result?: AnswerResult;
  disabled?: boolean;
  isSubmitting?: boolean;
}

export function FreeResponseQuestion({
  question,
  onSubmit,
  result,
  disabled = false,
  isSubmitting = false,
}: FreeResponseQuestionProps) {
  const [answer, setAnswer] = useState('');
  const hasSubmitted = !!result;

  const handleSubmit = async () => {
    if (answer.trim() && !hasSubmitted && !isSubmitting) {
      await onSubmit(answer.trim());
    }
  };

  const minLength = question.free_response_config?.min_length || 10;
  const maxLength = question.free_response_config?.max_length || 500;
  const isValidLength = answer.length >= minLength && answer.length <= maxLength;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{question.question_text}</h2>
        {question.hint && !hasSubmitted && (
          <p className="text-sm text-muted-foreground">Hint: {question.hint}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Write your answer here..."
            disabled={disabled || hasSubmitted || isSubmitting}
            className={cn(
              'min-h-[150px] resize-none',
              hasSubmitted && result?.correct && 'border-green-500 bg-green-500/10',
              hasSubmitted && !result?.correct && 'border-red-500 bg-red-500/10'
            )}
            maxLength={maxLength}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {answer.length < minLength
                ? `Minimum ${minLength} characters`
                : `${answer.length}/${maxLength} characters`}
            </span>
            {!hasSubmitted && answer.length > 0 && !isValidLength && (
              <span className="text-orange-500">
                {answer.length < minLength
                  ? `Need ${minLength - answer.length} more characters`
                  : 'Too long'}
              </span>
            )}
          </div>
        </div>

        {!hasSubmitted && (
          <Button
            onClick={handleSubmit}
            disabled={!isValidLength || disabled || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Grading...
              </>
            ) : (
              'Submit Answer'
            )}
          </Button>
        )}
      </div>

      {hasSubmitted && result && (
        <div
          className={cn(
            'p-4 rounded-lg space-y-3',
            result.correct
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-orange-500/10 border border-orange-500/30'
          )}
        >
          <div className="flex items-center gap-2">
            {result.correct ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-orange-500" />
            )}
            <p className={cn('font-medium', result.correct ? 'text-green-500' : 'text-orange-500')}>
              {result.correct ? 'Great answer!' : 'Needs improvement'}
            </p>
            {result.score !== undefined && (
              <span className="ml-auto text-sm font-medium">
                Score: {Math.round(result.score * 100)}%
              </span>
            )}
          </div>

          {result.feedback && (
            <div className="text-sm">
              <p className="font-medium mb-1">Feedback:</p>
              <p className="text-muted-foreground">{result.feedback}</p>
            </div>
          )}

          {question.free_response_config?.ideal_answer && (
            <div className="text-sm border-t border-border pt-3 mt-3">
              <p className="font-medium mb-1">Example answer:</p>
              <p className="text-muted-foreground italic">
                {question.free_response_config.ideal_answer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
