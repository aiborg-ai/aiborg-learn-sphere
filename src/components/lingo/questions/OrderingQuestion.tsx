/**
 * OrderingQuestion Component
 * Renders a question where items must be put in correct order
 */

import { useState, useMemo } from 'react';
import { Check, X, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LingoQuestion, AnswerResult } from '@/types/lingo.types';

interface OrderingQuestionProps {
  question: LingoQuestion;
  onSubmit: (answer: string[]) => void;
  result?: AnswerResult;
  disabled?: boolean;
}

export function OrderingQuestion({
  question,
  onSubmit,
  result,
  disabled = false,
}: OrderingQuestionProps) {
  // Shuffle items initially
  const shuffledItems = useMemo(() => {
    const items = question.ordering_items || [];
    return [...items].sort(() => Math.random() - 0.5);
  }, [question.ordering_items]);

  const [orderedItems, setOrderedItems] = useState<string[]>(shuffledItems);
  const hasSubmitted = !!result;

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (disabled || hasSubmitted) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedItems.length) return;

    const newItems = [...orderedItems];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setOrderedItems(newItems);
  };

  const handleSubmit = () => {
    if (!hasSubmitted) {
      onSubmit(orderedItems);
    }
  };

  const getItemState = (item: string, index: number) => {
    if (!hasSubmitted) return 'default';

    const correctOrder = question.ordering_items || [];
    const correctIndex = correctOrder.indexOf(item);

    if (correctIndex === index) return 'correct';
    return 'incorrect';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{question.question_text}</h2>
        {question.hint && !hasSubmitted && (
          <p className="text-sm text-muted-foreground">Hint: {question.hint}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {hasSubmitted
            ? 'Review the correct order below'
            : 'Use the arrows to arrange items in the correct order'}
        </p>
      </div>

      <div className="space-y-2">
        {orderedItems.map((item, index) => {
          const state = getItemState(item, index);
          return (
            <Card
              key={item}
              className={cn(
                'p-3 transition-all border-2',
                state === 'default' && 'border-muted',
                state === 'correct' && 'border-green-500 bg-green-500/10',
                state === 'incorrect' && 'border-red-500 bg-red-500/10'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                  <span className="w-6 text-center font-medium">{index + 1}</span>
                </div>

                <span className="flex-1">{item}</span>

                {!hasSubmitted && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0 || disabled}
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === orderedItems.length - 1 || disabled}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {hasSubmitted && (
                  <div>
                    {state === 'correct' ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {!hasSubmitted && (
        <Button onClick={handleSubmit} disabled={disabled} className="w-full" size="lg">
          Check Order
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
          <div className="flex items-center gap-2">
            {result.correct ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
            <p className={cn('font-medium', result.correct ? 'text-green-500' : 'text-red-500')}>
              {result.correct
                ? 'Perfect order!'
                : `${Math.round((result.score || 0) * 100)}% correct`}
            </p>
          </div>
          {!result.correct && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p>Correct order:</p>
              <ol className="list-decimal list-inside mt-1">
                {(question.ordering_items || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>
          )}
          {result.feedback && (
            <p className="text-sm text-muted-foreground mt-1">{result.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}
