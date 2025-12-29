/**
 * LessonCard Component
 * Displays a lesson in the grid with progress indicator
 */

import { Lock, Check, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LingoLesson, LessonProgress } from '@/types/lingo.types';

interface LessonCardProps {
  lesson: LingoLesson;
  progress?: LessonProgress | null;
  isLocked?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LessonCard({
  lesson,
  progress,
  isLocked = false,
  onClick,
  className,
}: LessonCardProps) {
  const isComplete = progress?.completed || false;
  const isPerfect = progress?.perfect || false;

  const getSkillColor = (skill: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      Foundations: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500' },
      LLMs: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500' },
      Vision: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500' },
      NLP: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-500' },
      Safety: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500' },
      Advanced: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500' },
    };
    return (
      colors[skill] || { bg: 'bg-muted', border: 'border-muted', text: 'text-muted-foreground' }
    );
  };

  const skillColors = getSkillColor(lesson.skill);

  return (
    <button
      type="button"
      className={cn('w-full text-left', isLocked && 'cursor-not-allowed')}
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      tabIndex={isLocked ? -1 : 0}
    >
      <Card
        className={cn(
          'relative transition-all duration-200 hover:scale-[1.02]',
          isLocked && 'opacity-50',
          isComplete && 'ring-2 ring-green-500/50',
          isPerfect && 'ring-2 ring-yellow-500/50',
          skillColors.bg,
          skillColors.border,
          className
        )}
      >
        <CardContent className="p-4">
          {/* Status badge */}
          <div className="absolute top-2 right-2" data-testid="lesson-status-badge">
            {isLocked ? (
              <div className="p-1.5 rounded-full bg-muted" aria-label="Lesson locked">
                <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            ) : isComplete ? (
              <div
                className={cn('p-1.5 rounded-full', isPerfect ? 'bg-yellow-500' : 'bg-green-500')}
                aria-label={isPerfect ? 'Perfect score' : 'Lesson completed'}
              >
                <Check className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
            ) : (
              <div
                className={cn('p-1.5 rounded-full', skillColors.bg)}
                aria-label="Play lesson"
                data-testid="play-icon"
              >
                <Play className={cn('h-4 w-4', skillColors.text)} aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Lesson content */}
          <div className="space-y-2">
            <span className={cn('text-xs font-medium', skillColors.text)}>{lesson.skill}</span>
            <h3 className="font-semibold text-foreground line-clamp-2 pr-8">{lesson.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description}</p>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span data-testid="lesson-duration">{lesson.duration}</span>
            <span className="font-medium text-yellow-500" data-testid="lesson-xp">
              +{lesson.xp_reward} XP
            </span>
          </div>

          {/* Progress indicator for completed lessons */}
          {isComplete && progress?.best_score !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    isPerfect ? 'bg-yellow-500' : 'bg-green-500'
                  )}
                  style={{ width: `${progress.best_score}%` }}
                />
              </div>
              <span className="text-xs font-medium">{progress.best_score}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    </button>
  );
}
