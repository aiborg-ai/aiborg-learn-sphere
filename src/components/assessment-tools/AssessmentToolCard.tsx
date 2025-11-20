/**
 * AssessmentToolCard Component
 * Displays a single assessment tool with progress and status
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Trophy,
  TrendingUp,
  Lock,
  CheckCircle2,
  Play,
  RotateCcw,
  LucideIcon,
} from '@/components/ui/icons';
import * as Icons from '@/components/ui/icons';
import type { AssessmentToolWithProgress } from '@/types/assessmentTools';
import { cn } from '@/lib/utils';

interface AssessmentToolCardProps {
  tool: AssessmentToolWithProgress;
  className?: string;
}

export function AssessmentToolCard({ tool, className }: AssessmentToolCardProps) {
  const navigate = useNavigate();

  // Get icon component dynamically
  const IconComponent = (Icons[tool.icon as keyof typeof Icons] as LucideIcon) || Icons.Brain;

  // Determine card state
  const isLocked = tool.is_locked || false;
  const hasAttempts = (tool.user_attempts || 0) > 0;
  const hasIncompleteAttempt = tool.latest_attempt && !tool.latest_attempt.is_completed;
  const hasPassed =
    tool.latest_attempt &&
    tool.latest_attempt.is_completed &&
    tool.latest_attempt.score_percentage >= tool.passing_score_percentage;

  // Difficulty badge color
  const difficultyColor =
    {
      beginner: 'bg-green-500/10 text-green-700 dark:text-green-400',
      intermediate: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      advanced: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
      expert: 'bg-red-500/10 text-red-700 dark:text-red-400',
    }[tool.difficulty_level] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400';

  // Category type badge
  const categoryLabel =
    {
      readiness: 'Readiness',
      awareness: 'Awareness',
      fluency: 'Fluency',
    }[tool.category_type] || 'Assessment';

  const handleClick = () => {
    if (isLocked) return;

    // Navigate to assessment page
    navigate(`/assessment/${tool.slug}`);
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        isLocked && 'opacity-60 cursor-not-allowed',
        !isLocked && 'cursor-pointer hover:scale-[1.02]',
        className
      )}
      onClick={handleClick}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
              isLocked
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
            )}
          >
            {isLocked ? <Lock className="h-6 w-6" /> : <IconComponent className="h-6 w-6" />}
          </div>

          {/* Badges */}
          <div className="flex flex-col gap-2 items-end">
            <Badge variant="outline" className={difficultyColor}>
              {tool.difficulty_level}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {categoryLabel}
            </Badge>
          </div>
        </div>

        <CardTitle className="mt-4 text-xl">{tool.name}</CardTitle>
        <CardDescription className="line-clamp-2">{tool.description}</CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Duration and questions */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{tool.estimated_duration_minutes} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>{tool.min_questions_required}+ questions</span>
          </div>
        </div>

        {/* Progress section - only show if user has attempts */}
        {hasAttempts && !isLocked && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Progress</span>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold">Attempts: {tool.user_attempts}</span>
              </div>
            </div>

            {tool.latest_attempt && tool.latest_attempt.is_completed && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>Latest Score</span>
                    <span className="font-semibold">
                      {tool.latest_attempt.score_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={tool.latest_attempt.score_percentage} className="h-2" />
                </div>

                {tool.best_score && tool.best_score !== tool.latest_attempt.score_percentage && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Best Score</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">{tool.best_score.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-2">
          {isLocked ? (
            <Button disabled className="w-full" variant="outline">
              <Lock className="mr-2 h-4 w-4" />
              Not Available
            </Button>
          ) : hasIncompleteAttempt ? (
            <Button className="w-full" variant="default">
              <Play className="mr-2 h-4 w-4" />
              Continue Assessment
            </Button>
          ) : hasAttempts ? (
            <div className="flex gap-2">
              <Button className="flex-1" variant="default">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button
                variant="outline"
                onClick={e => {
                  e.stopPropagation();
                  navigate(`/assessment/${tool.slug}/history`);
                }}
              >
                View History
              </Button>
            </div>
          ) : (
            <Button className="w-full" variant="default">
              <Play className="mr-2 h-4 w-4" />
              Start Assessment
            </Button>
          )}
        </div>

        {/* Passing score indicator */}
        {!isLocked && (
          <div className="text-xs text-muted-foreground text-center">
            {hasPassed && (
              <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>Passed ({tool.passing_score_percentage}% required)</span>
              </div>
            )}
            {!hasPassed && <span>Passing score: {tool.passing_score_percentage}%</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
