/**
 * FillBlankQuestion Component
 * Renders a fill-in-the-blank question with text input
 */

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { LingoQuestion, AnswerResult } from '@/types/lingo.types';

interface FillBlankQuestionProps {
  question: LingoQuestion;
  onSubmit: (answer: string) => void;
  result?: AnswerResult;
  disabled?: boolean;
}

export function FillBlankQuestion({
  question,
  onSubmit,
  result,
  disabled = false,
}: FillBlankQuestionProps) {
  const [answer, setAnswer] = useState('');
  const hasSubmitted = !!result;

  const handleSubmit = () => {
    if (answer.trim() && !hasSubmitted) {
      onSubmit(answer.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && answer.trim() && !hasSubmitted) {
      handleSubmit();
    }
  };

  // Parse question text to highlight blank
  const renderQuestionText = () => {
    const text = question.question_text;
    const blankPattern = /___+|\[blank\]|\{blank\}/gi;
    const parts = text.split(blankPattern);

    if (parts.length === 1) {
      return <span>{text}</span>;
    }

    return (
      <>
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="inline-block min-w-[100px] mx-1 px-2 py-1 border-b-2 border-primary bg-primary/10 rounded">
                {hasSubmitted ? answer : '______'}
              </span>
            )}
          </span>
        ))}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{renderQuestionText()}</h2>
        {question.hint && !hasSubmitted && (
          <p className="text-sm text-muted-foreground">Hint: {question.hint}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            disabled={disabled || hasSubmitted}
            className={cn(
              'text-lg py-6',
              hasSubmitted && result?.correct && 'border-green-500 bg-green-500/10',
              hasSubmitted && !result?.correct && 'border-red-500 bg-red-500/10'
            )}
          />
          {hasSubmitted && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {result?.correct ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
            </div>
          )}
        </div>

        {!hasSubmitted && (
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim() || disabled}
            className="w-full"
            size="lg"
          >
            Check Answer
          </Button>
        )}
      </div>

      {hasSubmitted && result && (
        <div
          className={cn(
            'p-4 rounded-lg',
            result.correct
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-red-500/10 border border-red-500/30'
          )}
        >
          <p className={cn('font-medium', result.correct ? 'text-green-500' : 'text-red-500')}>
            {result.correct ? '✓ Correct!' : '✗ Incorrect'}
          </p>
          {!result.correct && (
            <p className="text-sm text-muted-foreground mt-1">
              Correct answer:{' '}
              <span className="font-medium text-foreground">{question.correct_answer}</span>
            </p>
          )}
          {result.feedback && (
            <p className="text-sm text-muted-foreground mt-1">{result.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}
