/**
 * AI Explanation Card Component
 * Displays AI-generated explanations for wrong answers
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { WrongAnswerExplanationService } from '@/services/ai/WrongAnswerExplanationService';
import { cn } from '@/lib/utils';

interface AIExplanationCardProps {
  explanation: string;
  keyTakeaway?: string;
  suggestions?: string[];
  cached?: boolean;
  model?: string;
  onRate?: (rating: number) => void;
  explanationId?: string;
  className?: string;
}

export function AIExplanationCard({
  explanation,
  keyTakeaway,
  suggestions = [],
  cached = false,
  onRate,
  explanationId,
  className,
}: AIExplanationCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);

  const handleRate = async (rating: number) => {
    if (hasRated) return;

    setUserRating(rating);
    setHasRated(true);

    // Call the rating service if we have an explanation ID
    if (explanationId) {
      try {
        await WrongAnswerExplanationService.rateExplanation(explanationId, rating);
      } catch {
        // Silently fail - rating is not critical
      }
    }

    // Call the callback if provided
    onRate?.(rating);
  };

  return (
    <Card
      className={cn(
        'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Sparkles className="h-5 w-5" />
            AI Tutor Explanation
          </CardTitle>
          <div className="flex items-center gap-2">
            {cached && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Cached
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Main explanation */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-foreground leading-relaxed">{explanation}</p>
          </div>

          {/* Key takeaway */}
          {keyTakeaway && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                  Key Takeaway
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">{keyTakeaway}</p>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tips to improve:</p>
              <ul className="list-disc list-inside space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rating section */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-200 dark:border-amber-800">
            <p className="text-xs text-muted-foreground">Was this explanation helpful?</p>
            <div className="flex items-center gap-2">
              {hasRated ? (
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  Thanks for your feedback!
                </span>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRate(5)}
                    className={cn(
                      'h-8 w-8 p-0 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30',
                      userRating === 5 && 'text-green-600 bg-green-100'
                    )}
                    aria-label="Helpful"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRate(1)}
                    className={cn(
                      'h-8 w-8 p-0 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30',
                      userRating === 1 && 'text-red-600 bg-red-100'
                    )}
                    aria-label="Not helpful"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Compact version for inline display
export function AIExplanationInline({
  explanation,
  keyTakeaway,
  className,
}: {
  explanation: string;
  keyTakeaway?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-sm text-foreground">{explanation}</p>
          {keyTakeaway && (
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{keyTakeaway}</p>
          )}
        </div>
      </div>
    </div>
  );
}
