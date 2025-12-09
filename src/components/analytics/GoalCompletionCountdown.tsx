/**
 * Goal Completion Countdown Component
 *
 * Displays goal completion prediction with countdown and probability.
 * Shows Monte Carlo simulation results, risk factors, and acceleration suggestions.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Calendar,
  Zap,
  ChevronRight,
  AlertCircle,
} from '@/components/ui/icons';
import { useGoalPredictions } from '@/hooks/useRealTimeAnalytics';
import { EnhancedGoalPrediction } from '@/services/feedback-loop/FeedbackLoopTypes';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isPast } from 'date-fns';

interface GoalCompletionCountdownProps {
  showAtRiskOnly?: boolean;
  maxGoals?: number;
  compact?: boolean;
  className?: string;
  onGoalClick?: (goalId: string) => void;
}

export function GoalCompletionCountdown({
  showAtRiskOnly = false,
  maxGoals = 5,
  compact = false,
  className,
  onGoalClick,
}: GoalCompletionCountdownProps) {
  const { predictions, atRisk, isLoading } = useGoalPredictions();

  const displayGoals = useMemo(() => {
    if (showAtRiskOnly) {
      return atRisk.slice(0, maxGoals);
    }
    return predictions.slice(0, maxGoals);
  }, [predictions, atRisk, showAtRiskOnly, maxGoals]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayGoals.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {showAtRiskOnly ? 'Goals at Risk' : 'Goal Predictions'}
          </CardTitle>
          <CardDescription>
            {showAtRiskOnly
              ? 'No goals currently at risk'
              : 'Set learning goals to track your progress'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500/50 mb-3" />
          <p className="text-muted-foreground">
            {showAtRiskOnly ? 'All goals on track!' : 'No active goals'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {showAtRiskOnly ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <Target className="h-5 w-5" />
              )}
              {showAtRiskOnly ? 'Goals at Risk' : 'Goal Predictions'}
            </CardTitle>
            <CardDescription>
              {showAtRiskOnly
                ? `${atRisk.length} goal${atRisk.length !== 1 ? 's' : ''} need attention`
                : `${predictions.length} active goal${predictions.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </div>
          {predictions.length > maxGoals && (
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className={cn('space-y-4', compact && 'space-y-3')}>
          {displayGoals.map(goal => (
            <GoalCard
              key={goal.goalId}
              goal={goal}
              compact={compact}
              onClick={() => onGoalClick?.(goal.goalId)}
            />
          ))}
        </div>

        {/* Summary */}
        {!compact && predictions.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {predictions.filter(p => p.successProbability >= 0.7).length}
                </p>
                <p className="text-xs text-muted-foreground">On Track</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    predictions.filter(
                      p => p.successProbability >= 0.4 && p.successProbability < 0.7
                    ).length
                  }
                </p>
                <p className="text-xs text-muted-foreground">Needs Attention</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {predictions.filter(p => p.successProbability < 0.4).length}
                </p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GoalCardProps {
  goal: EnhancedGoalPrediction;
  compact?: boolean;
  onClick?: () => void;
}

function GoalCard({ goal, compact = false, onClick }: GoalCardProps) {
  const {
    successProbability,
    predictedCompletionDate,
    confidenceInterval,
    riskFactors,
    accelerators,
  } = goal;

  // Determine status
  const status = useMemo(() => {
    if (successProbability >= 0.7) {
      return {
        label: 'On Track',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle,
      };
    }
    if (successProbability >= 0.4) {
      return {
        label: 'Needs Attention',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: AlertCircle,
      };
    }
    return {
      label: 'At Risk',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: AlertTriangle,
    };
  }, [successProbability]);

  const StatusIcon = status.icon;

  // Calculate days remaining
  const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date());
  const isOverdue = isPast(new Date(goal.targetDate));

  // Format predicted completion
  const predictedDate = new Date(predictedCompletionDate);
  const willMeetDeadline = predictedDate <= new Date(goal.targetDate);

  if (compact) {
    return (
      <div
        className={cn(
          'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50',
          status.borderColor,
          status.bgColor
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('h-4 w-4', status.color)} />
            <span className="font-medium text-sm truncate max-w-[200px]">
              {goal.goalTitle || `Goal ${goal.goalId.slice(0, 8)}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-lg font-bold', status.color)}>
              {(successProbability * 100).toFixed(0)}%
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <Progress value={successProbability * 100} className="h-1.5 mt-2" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/30',
        status.borderColor
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-full', status.bgColor)}>
            <StatusIcon className={cn('h-5 w-5', status.color)} />
          </div>
          <div>
            <h4 className="font-medium">{goal.goalTitle || `Goal ${goal.goalId.slice(0, 8)}`}</h4>
            <p className="text-sm text-muted-foreground">
              {goal.goalDescription || 'No description'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn(status.color, 'border-current')}>
          {status.label}
        </Badge>
      </div>

      {/* Probability Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Success Probability</span>
          <span className={cn('font-bold', status.color)}>
            {(successProbability * 100).toFixed(0)}%
          </span>
        </div>
        <Progress value={successProbability * 100} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>CI: {(confidenceInterval[0] * 100).toFixed(0)}%</span>
          <span>{(confidenceInterval[1] * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-2 rounded border bg-background/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Calendar className="h-3 w-3" />
            Target Date
          </div>
          <p className="font-medium text-sm">{format(new Date(goal.targetDate), 'MMM d, yyyy')}</p>
          <p className={cn('text-xs', isOverdue ? 'text-red-600' : 'text-muted-foreground')}>
            {isOverdue ? 'Overdue' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
          </p>
        </div>
        <div className="p-2 rounded border bg-background/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock className="h-3 w-3" />
            Predicted
          </div>
          <p className="font-medium text-sm">{format(predictedDate, 'MMM d, yyyy')}</p>
          <p className={cn('text-xs', willMeetDeadline ? 'text-green-600' : 'text-red-600')}>
            {willMeetDeadline
              ? 'Before deadline'
              : `${differenceInDays(predictedDate, new Date(goal.targetDate))} days late`}
          </p>
        </div>
      </div>

      {/* Risk Factors & Accelerators */}
      <div className="space-y-2">
        {riskFactors && riskFactors.length > 0 && (
          <div className="p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-400 mb-1">
              <TrendingDown className="h-3 w-3" />
              Risk Factors
            </div>
            <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
              {riskFactors.slice(0, 2).map((factor, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {accelerators && accelerators.length > 0 && (
          <div className="p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 text-xs font-medium text-green-700 dark:text-green-400 mb-1">
              <Zap className="h-3 w-3" />
              Accelerators
            </div>
            <ul className="text-xs text-green-600 dark:text-green-400 space-y-0.5">
              {accelerators.slice(0, 2).map((acc, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{acc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoalCompletionCountdown;
