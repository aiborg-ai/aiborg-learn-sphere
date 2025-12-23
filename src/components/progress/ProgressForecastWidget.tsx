/**
 * Progress Forecast Widget
 * Displays AI-powered predictions about learning progress
 * Shows estimated completion dates, pace analysis, and recommendations
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight,
  Info,
} from '@/components/ui/icons';
import {
  GoalPredictionService,
  type GoalPrediction,
} from '@/services/analytics/GoalPredictionService';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGoalUpdates } from '@/hooks/useRealtimeUpdates';

interface ProgressForecastWidgetProps {
  userId: string;
  goalId?: string;
  compact?: boolean;
  showRecommendations?: boolean;
}

export function ProgressForecastWidget({
  userId,
  goalId,
  compact = false,
  showRecommendations = true,
}: ProgressForecastWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<GoalPrediction | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Real-time updates: Auto-refresh when goals are updated
  useGoalUpdates(userId, () => {
    logger.info('Goal updated, refreshing forecast');
    fetchPrediction();
  });

  useEffect(() => {
    fetchPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, goalId]);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's goals
      const goals = await GoalPredictionService.getUserGoals(userId);

      if (goals.length === 0) {
        setPrediction(null);
        return;
      }

      // Use specified goal or first active goal
      let targetGoal;
      if (goalId) {
        targetGoal = goals.find(g => g.id === goalId);
      } else {
        targetGoal = goals.find(g => g.status !== 'completed');
      }

      if (!targetGoal) {
        targetGoal = goals[0]; // Fallback to first goal
      }

      // Get prediction for this goal
      const predictionData = await GoalPredictionService.predictGoalCompletion(
        userId,
        targetGoal.id
      );

      setPrediction(predictionData);
    } catch (err) {
      logger.error('Error fetching progress forecast:', err);
      setError(err instanceof Error ? err : new Error('Failed to load forecast'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (riskLevel: string) => {
    const colors = {
      low: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-red-600 bg-red-50 border-red-200',
    };
    return colors[riskLevel as keyof typeof colors] || colors.medium;
  };

  const getStatusIcon = (isOnTrack: boolean, riskLevel: string) => {
    if (isOnTrack && riskLevel === 'low') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (riskLevel === 'high') {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    } else {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getPaceIndicator = (currentProgress: number, predictedProgress: number) => {
    const difference = predictedProgress - 100;

    if (difference >= 0) {
      return {
        icon: TrendingUp,
        text: 'Ahead of Schedule',
        color: 'text-green-600',
        description: `You're on track to complete ${Math.abs(difference).toFixed(0)}% ahead of your deadline`,
      };
    } else {
      return {
        icon: TrendingDown,
        text: 'Behind Schedule',
        color: 'text-red-600',
        description: `You're ${Math.abs(difference).toFixed(0)}% behind your target pace`,
      };
    }
  };

  if (loading) {
    return (
      <Card className={compact ? '' : 'shadow-lg'}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction) {
    return (
      <Card className={compact ? '' : 'shadow-lg'}>
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Forecast Available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set a learning goal to see your progress predictions
          </p>
          <Button>Create Learning Goal</Button>
        </CardContent>
      </Card>
    );
  }

  const pace = getPaceIndicator(prediction.currentProgress, prediction.predictedProgress);
  const PaceIcon = pace.icon;

  return (
    <Card className={compact ? '' : 'shadow-lg'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progress Forecast
            </CardTitle>
            <CardDescription className="mt-1">{prediction.goalTitle}</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More information about forecast">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  AI-powered prediction based on your current progress rate and study patterns.
                  Confidence: {prediction.confidenceScore}%
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Current Progress</span>
            <span className="text-2xl font-bold text-primary">{prediction.currentProgress}%</span>
          </div>
          <Progress value={prediction.currentProgress} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Started</span>
            <span>{prediction.currentProgress}% Complete</span>
            <span>Target: 100%</span>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Pace Status */}
          <div className={`p-4 border rounded-lg ${getStatusColor(prediction.riskLevel)}`}>
            <div className="flex items-center gap-2 mb-2">
              <PaceIcon className={`h-5 w-5 ${pace.color}`} />
              <span className="font-semibold">{pace.text}</span>
            </div>
            <p className="text-xs">{pace.description}</p>
          </div>

          {/* Completion Probability */}
          <div className="p-4 border rounded-lg bg-secondary/20">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(prediction.isOnTrack, prediction.riskLevel)}
              <span className="font-semibold">{prediction.completionProbability}% Likely</span>
            </div>
            <p className="text-xs text-muted-foreground">Chance of completing by target date</p>
          </div>
        </div>

        {/* Key Metrics */}
        {!compact && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-secondary/20 rounded-lg">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{prediction.daysRemaining}</p>
              <p className="text-xs text-muted-foreground">Days Left</p>
            </div>

            <div className="text-center p-3 bg-secondary/20 rounded-lg">
              <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{prediction.recommendedDailyEffort}m</p>
              <p className="text-xs text-muted-foreground">Daily Time</p>
            </div>

            <div className="text-center p-3 bg-secondary/20 rounded-lg">
              <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{prediction.predictedProgress}%</p>
              <p className="text-xs text-muted-foreground">Predicted</p>
            </div>

            <div className="text-center p-3 bg-secondary/20 rounded-lg">
              <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{prediction.confidenceScore}%</p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </div>
          </div>
        )}

        {/* Estimated Completion */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1">Estimated Completion</p>
              <p className="text-2xl font-bold text-primary">
                {format(new Date(prediction.estimatedCompletionDate), 'MMM d, yyyy')}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-primary/60" />
          </div>
          {prediction.daysRemaining < 0 && (
            <p className="text-xs text-red-600 mt-2">
              ⚠️ Target date has passed. Consider extending your deadline.
            </p>
          )}
        </div>

        {/* Recommendations */}
        {showRecommendations && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Recommendations
            </h4>

            {prediction.riskLevel === 'high' && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  ⚠️ Action Needed
                </p>
                <p className="text-xs text-red-800 dark:text-red-200">
                  Increase your daily study time to {prediction.recommendedDailyEffort} minutes to
                  stay on track. Focus on high-priority topics.
                </p>
              </div>
            )}

            {prediction.riskLevel === 'medium' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  📊 Stay Consistent
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  You're making good progress. Maintain your current pace of{' '}
                  {prediction.recommendedDailyEffort} minutes per day.
                </p>
              </div>
            )}

            {prediction.isOnTrack && prediction.riskLevel === 'low' && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  ✅ On Track!
                </p>
                <p className="text-xs text-green-800 dark:text-green-200">
                  Excellent progress! You're ahead of schedule. Keep up the momentum or consider
                  tackling more advanced topics.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {!compact && (
          <Button className="w-full" onClick={() => fetchPrediction()}>
            Refresh Forecast
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for dashboard widgets
 */
export function ProgressForecastCompact({
  userId,
  goalId,
}: Omit<ProgressForecastWidgetProps, 'compact' | 'showRecommendations'>) {
  return (
    <ProgressForecastWidget
      userId={userId}
      goalId={goalId}
      compact={true}
      showRecommendations={false}
    />
  );
}
