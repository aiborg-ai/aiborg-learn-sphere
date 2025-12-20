/**
 * MatchingQuestion Component
 * Renders a matching pairs question
 */

import { useState, useMemo } from 'react';
import { Check, X, Link2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LingoQuestion, AnswerResult } from '@/types/lingo.types';

interface MatchingQuestionProps {
  question: LingoQuestion;
  onSubmit: (answer: Record<string, string>) => void;
  result?: AnswerResult;
  disabled?: boolean;
}

export function MatchingQuestion({
  question,
  onSubmit,
  result,
  disabled = false,
}: MatchingQuestionProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const hasSubmitted = !!result;

  // Parse matching pairs from question
  const { leftItems, rightItems } = useMemo(() => {
    const pairs = question.matching_pairs || [];
    const left = pairs.map(p => p.left);
    const right = pairs.map(p => p.right);
    // Shuffle right items for display
    const shuffled = [...right].sort(() => Math.random() - 0.5);
    return { leftItems: left, rightItems: shuffled };
  }, [question.matching_pairs]);

  const handleLeftClick = (item: string) => {
    if (disabled || hasSubmitted) return;
    setSelectedLeft(selectedLeft === item ? null : item);
  };

  const handleRightClick = (item: string) => {
    if (disabled || hasSubmitted || !selectedLeft) return;

    // Check if right item is already matched
    const existingLeft = Object.entries(matches).find(([, v]) => v === item)?.[0];
    if (existingLeft) {
      // Remove existing match
      const newMatches = { ...matches };
      delete newMatches[existingLeft];
      setMatches(newMatches);
    }

    // Add new match
    setMatches(prev => ({ ...prev, [selectedLeft]: item }));
    setSelectedLeft(null);
  };

  const handleUnmatch = (leftItem: string) => {
    if (disabled || hasSubmitted) return;
    const newMatches = { ...matches };
    delete newMatches[leftItem];
    setMatches(newMatches);
  };

  const handleSubmit = () => {
    if (Object.keys(matches).length === leftItems.length && !hasSubmitted) {
      onSubmit(matches);
    }
  };

  const isLeftMatched = (item: string) => item in matches;
  const isRightMatched = (item: string) => Object.values(matches).includes(item);

  const getMatchColor = (index: number) => {
    const colors = [
      'border-blue-500 bg-blue-500/10',
      'border-purple-500 bg-purple-500/10',
      'border-green-500 bg-green-500/10',
      'border-orange-500 bg-orange-500/10',
      'border-pink-500 bg-pink-500/10',
    ];
    return colors[index % colors.length];
  };

  const getLeftItemColor = (item: string) => {
    if (!isLeftMatched(item)) return '';
    const index = leftItems.indexOf(item);
    return getMatchColor(index);
  };

  const getRightItemColor = (item: string) => {
    const leftItem = Object.entries(matches).find(([, v]) => v === item)?.[0];
    if (!leftItem) return '';
    const index = leftItems.indexOf(leftItem);
    return getMatchColor(index);
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
            ? 'Review your matches below'
            : 'Click items on the left, then match them with items on the right'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {leftItems.map((item, index) => (
            <button
              key={`left-${index}`}
              type="button"
              className="w-full text-left"
              onClick={() => handleLeftClick(item)}
              disabled={disabled || hasSubmitted}
              tabIndex={disabled || hasSubmitted ? -1 : 0}
            >
              <Card
                className={cn(
                  'p-3 transition-all border-2',
                  selectedLeft === item && 'border-primary ring-2 ring-primary/30',
                  isLeftMatched(item) && getLeftItemColor(item),
                  !(disabled || hasSubmitted) && 'cursor-pointer'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{item}</span>
                  {isLeftMatched(item) && !hasSubmitted && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={e => {
                        e.stopPropagation();
                        handleUnmatch(item);
                      }}
                    >
                      <Unlink className="h-3 w-3" />
                    </Button>
                  )}
                  {isLeftMatched(item) && hasSubmitted && (
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </Card>
            </button>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {rightItems.map((item, index) => {
            const isDisabled = !selectedLeft || isRightMatched(item) || disabled || hasSubmitted;
            return (
              <button
                key={`right-${index}`}
                type="button"
                className="w-full text-left"
                onClick={() => handleRightClick(item)}
                disabled={isDisabled}
                tabIndex={isDisabled ? -1 : 0}
              >
                <Card
                  className={cn(
                    'p-3 transition-all border-2',
                    selectedLeft &&
                      !isRightMatched(item) &&
                      'hover:border-primary/50 cursor-pointer',
                    isRightMatched(item) && getRightItemColor(item)
                  )}
                >
                  <span className="text-sm">{item}</span>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {!hasSubmitted && (
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length !== leftItems.length || disabled}
          className="w-full"
          size="lg"
        >
          Check Answer ({Object.keys(matches).length}/{leftItems.length} matched)
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
                ? 'All correct!'
                : `${Math.round((result.score || 0) * 100)}% correct`}
            </p>
          </div>
          {result.feedback && (
            <p className="text-sm text-muted-foreground mt-1">{result.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}
