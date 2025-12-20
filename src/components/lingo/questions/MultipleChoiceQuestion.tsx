/**
 * MultipleChoiceQuestion Component
 * Renders a multiple choice question with answer options
 */

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LingoQuestion, AnswerResult } from '@/types/lingo.types';

interface MultipleChoiceQuestionProps {
  question: LingoQuestion;
  onSubmit: (answer: string) => void;
  result?: AnswerResult;
  disabled?: boolean;
}

export function MultipleChoiceQuestion({
  question,
  onSubmit,
  result,
  disabled = false,
}: MultipleChoiceQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const options = question.options || [];
  const hasSubmitted = !!result;

  const handleOptionClick = (option: string) => {
    if (disabled || hasSubmitted) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (selectedOption && !hasSubmitted) {
      onSubmit(selectedOption);
    }
  };

  const getOptionState = (option: string) => {
    if (!hasSubmitted) {
      return selectedOption === option ? 'selected' : 'default';
    }

    const isCorrect = option === question.correct_answer;
    const isSelected = selectedOption === option;

    if (isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'incorrect';
    return 'default';
  };

  const optionStyles = {
    default: 'border-muted hover:border-primary/50 hover:bg-muted/50',
    selected: 'border-primary bg-primary/10',
    correct: 'border-green-500 bg-green-500/10',
    incorrect: 'border-red-500 bg-red-500/10',
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{question.question_text}</h2>
        {question.hint && !hasSubmitted && (
          <p className="text-sm text-muted-foreground">Hint: {question.hint}</p>
        )}
      </div>

      <div className="grid gap-3">
        {options.map((option, index) => {
          const state = getOptionState(option);
          return (
            <button
              key={index}
              type="button"
              className="w-full text-left"
              onClick={() => handleOptionClick(option)}
              disabled={disabled || hasSubmitted}
              tabIndex={disabled || hasSubmitted ? -1 : 0}
            >
              <Card
                className={cn(
                  'p-4 transition-all border-2',
                  optionStyles[state],
                  !(disabled || hasSubmitted) && 'cursor-pointer'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                  </span>
                  {hasSubmitted && state === 'correct' && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                  {hasSubmitted && state === 'incorrect' && <X className="h-5 w-5 text-red-500" />}
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {!hasSubmitted && (
        <Button
          onClick={handleSubmit}
          disabled={!selectedOption || disabled}
          className="w-full"
          size="lg"
        >
          Check Answer
        </Button>
      )}

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
          {result.feedback && (
            <p className="text-sm text-muted-foreground mt-1">{result.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}
