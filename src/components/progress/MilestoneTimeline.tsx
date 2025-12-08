/**
 * Milestone Timeline Component
 * Visualizes learning milestones in a timeline format
 * Shows past, current, and upcoming milestones with completion status
 * Displays rewards and progress for each milestone
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Target,
  CheckCircle2,
  Circle,
  Trophy,
  Gift,
  Clock,
  Calendar,
  Star,
  Award,
  Zap,
  Flag,
  ChevronRight,
} from '@/components/ui/icons';
import {
  StudyPlanGeneratorService,
  type GeneratedStudyPlan,
} from '@/services/study-planner/StudyPlanGeneratorService';
import { format, isFuture, differenceInDays } from 'date-fns';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import { useStudyPlanUpdates } from '@/hooks/useRealtimeUpdates';

interface MilestoneTimelineProps {
  userId: string;
  planId?: string;
  compact?: boolean;
  showUpcoming?: boolean;
  maxMilestones?: number;
}

interface MilestoneWithMetadata {
  title: string;
  description?: string;
  target_completion: number;
  reward?: string;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  actual_completion?: number;
  is_completed: boolean;
  is_current: boolean;
  is_upcoming: boolean;
  estimated_completion_date: string;
  actual_completion_date?: string;
  days_until_milestone: number;
}

export function MilestoneTimeline({
  userId,
  planId,
  compact = false,
  showUpcoming = true,
  maxMilestones,
}: MilestoneTimelineProps) {
  const [studyPlan, setStudyPlan] = useState<GeneratedStudyPlan | null>(null);
  const [milestones, setMilestones] = useState<MilestoneWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Real-time updates: Auto-refresh when study plan changes
  useStudyPlanUpdates(userId, () => {
    logger.info('Study plan updated, refreshing milestones');
    fetchMilestones();
  });

  useEffect(() => {
    fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, planId]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      setError(null);

      const plan = await StudyPlanGeneratorService.getActiveStudyPlan(userId);

      if (!plan) {
        setStudyPlan(null);
        setMilestones([]);
        return;
      }

      setStudyPlan(plan);

      // Extract and enrich milestones from weekly schedules
      const enrichedMilestones: MilestoneWithMetadata[] = [];
      const today = new Date();

      for (const week of plan.weekly_schedules) {
        if (!week.milestone) continue;

        const weekStart = new Date(week.week_start_date);
        const weekEnd = new Date(week.week_end_date);
        const estimatedCompletion = weekEnd;

        // Calculate actual completion based on tasks in that week
        const allTasks = Object.values(week.daily_tasks).flat();
        const completedTasks = allTasks.filter(t => t.completed).length;
        const totalTasks = allTasks.length;
        const actualCompletion =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Determine milestone status
        const isCompleted = actualCompletion >= week.milestone.target_completion;
        const isCurrent = today >= weekStart && today <= weekEnd;
        const isUpcoming = isFuture(weekStart);
        const daysUntil = differenceInDays(estimatedCompletion, today);

        enrichedMilestones.push({
          ...week.milestone,
          week_number: week.week_number,
          week_start_date: week.week_start_date,
          week_end_date: week.week_end_date,
          actual_completion: actualCompletion,
          is_completed: isCompleted,
          is_current: isCurrent,
          is_upcoming: isUpcoming,
          estimated_completion_date: estimatedCompletion.toISOString(),
          actual_completion_date: isCompleted ? new Date().toISOString() : undefined,
          days_until_milestone: daysUntil,
        });
      }

      // Sort by week number
      enrichedMilestones.sort((a, b) => a.week_number - b.week_number);

      // Apply filters if needed
      let filteredMilestones = enrichedMilestones;
      if (!showUpcoming) {
        filteredMilestones = enrichedMilestones.filter(m => !m.is_upcoming);
      }
      if (maxMilestones) {
        filteredMilestones = filteredMilestones.slice(0, maxMilestones);
      }

      setMilestones(filteredMilestones);
    } catch (err) {
      logger.error('Error fetching milestones:', err);
      setError(err instanceof Error ? err : new Error('Failed to load milestones'));
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneIcon = (milestone: MilestoneWithMetadata) => {
    if (milestone.is_completed) {
      return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    } else if (milestone.is_current) {
      return <Target className="h-6 w-6 text-primary animate-pulse" />;
    } else if (milestone.is_upcoming) {
      return <Circle className="h-6 w-6 text-gray-400" />;
    } else {
      return <Clock className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getMilestoneColor = (milestone: MilestoneWithMetadata) => {
    if (milestone.is_completed) {
      return 'border-green-500 bg-green-50 dark:bg-green-950';
    } else if (milestone.is_current) {
      return 'border-primary bg-primary/10 ring-2 ring-primary';
    } else if (milestone.is_upcoming) {
      return 'border-gray-300 bg-gray-50 dark:bg-gray-900';
    } else {
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
    }
  };

  const getStatusBadge = (milestone: MilestoneWithMetadata) => {
    if (milestone.is_completed) {
      return (
        <Badge className="bg-green-600 text-white">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    } else if (milestone.is_current) {
      return (
        <Badge className="bg-primary text-white">
          <Zap className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    } else if (milestone.is_upcoming) {
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Upcoming
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-600 text-white">
          <Flag className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const getProgressPercentage = (milestone: MilestoneWithMetadata) => {
    if (milestone.is_completed) return 100;
    if (milestone.actual_completion !== undefined) {
      return Math.min(
        100,
        Math.round((milestone.actual_completion / milestone.target_completion) * 100)
      );
    }
    return 0;
  };

  const getDaysUntilText = (milestone: MilestoneWithMetadata) => {
    if (milestone.is_completed) {
      return milestone.actual_completion_date
        ? `Completed ${format(new Date(milestone.actual_completion_date), 'MMM d, yyyy')}`
        : 'Completed';
    }

    if (milestone.days_until_milestone < 0) {
      return `${Math.abs(milestone.days_until_milestone)} days overdue`;
    } else if (milestone.days_until_milestone === 0) {
      return 'Due today';
    } else if (milestone.days_until_milestone === 1) {
      return 'Due tomorrow';
    } else if (milestone.days_until_milestone <= 7) {
      return `${milestone.days_until_milestone} days left`;
    } else {
      return `Due ${format(new Date(milestone.estimated_completion_date), 'MMM d, yyyy')}`;
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
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !studyPlan) {
    return (
      <Card className={compact ? '' : 'shadow-lg'}>
        <CardContent className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Milestones Available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a study plan to track your learning milestones
          </p>
          <Button>Create Study Plan</Button>
        </CardContent>
      </Card>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card className={compact ? '' : 'shadow-lg'}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Learning Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No milestones defined in your study plan</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall milestone progress
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.is_completed).length;
  const overallProgress = Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <Card className={compact ? '' : 'shadow-lg'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Learning Milestones
            </CardTitle>
            <CardDescription className="mt-1">
              Track your progress across key learning achievements
            </CardDescription>
          </div>
          {!compact && (
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {completedMilestones}/{totalMilestones}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          )}
        </div>

        {/* Overall Progress */}
        {!compact && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-bold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-primary to-gray-300" />

          {/* Milestones */}
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <div key={`${milestone.week_number}-${index}`} className="relative pl-14">
                {/* Timeline Node */}
                <div className="absolute left-3 top-3 transform -translate-x-1/2">
                  <div
                    className={cn(
                      'rounded-full p-2 border-4 border-white dark:border-gray-900 shadow-lg',
                      milestone.is_completed
                        ? 'bg-green-500'
                        : milestone.is_current
                          ? 'bg-primary'
                          : 'bg-gray-300'
                    )}
                  >
                    {getMilestoneIcon(milestone)}
                  </div>
                </div>

                {/* Milestone Card */}
                <Card className={cn('border-2 transition-all', getMilestoneColor(milestone))}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(milestone)}
                            <Badge variant="outline" className="text-xs">
                              Week {milestone.week_number}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-base">{milestone.title}</h4>
                          {milestone.description && !compact && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {milestone.description}
                            </p>
                          )}
                        </div>

                        {milestone.reward && (
                          <div className="flex-shrink-0">
                            {milestone.is_completed ? (
                              <div className="flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                                <Trophy className="h-4 w-4" />
                                <span className="text-xs font-medium">Earned!</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Gift className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {!milestone.is_completed && milestone.actual_completion !== undefined && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              Progress: {milestone.actual_completion}% / Target:{' '}
                              {milestone.target_completion}%
                            </span>
                            <span className="text-xs font-bold">
                              {getProgressPercentage(milestone)}%
                            </span>
                          </div>
                          <Progress value={getProgressPercentage(milestone)} className="h-2" />
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {getDaysUntilText(milestone)}
                          </span>
                          {milestone.reward && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Gift className="h-3 w-3" />
                              {milestone.reward}
                            </span>
                          )}
                        </div>

                        {milestone.is_completed && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Star className="h-4 w-4 fill-current" />
                            <Award className="h-4 w-4 fill-current" />
                          </div>
                        )}
                      </div>

                      {/* Completion Status for Current Milestone */}
                      {milestone.is_current && !compact && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-primary">
                              {milestone.actual_completion}% complete •{' '}
                              {milestone.target_completion - (milestone.actual_completion || 0)}% to
                              go
                            </p>
                            {milestone.actual_completion &&
                              milestone.actual_completion < milestone.target_completion && (
                                <Button size="sm" variant="outline">
                                  Continue Learning
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        {!compact && milestones.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-secondary/20 rounded-lg">
            <div className="text-center">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{completedMilestones}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <Target className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-xl font-bold">{milestones.filter(m => m.is_current).length}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-gray-600" />
              <p className="text-xl font-bold">{milestones.filter(m => m.is_upcoming).length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
            <div className="text-center">
              <Award className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
              <p className="text-xl font-bold">
                {milestones.filter(m => m.reward && m.is_completed).length}
              </p>
              <p className="text-xs text-muted-foreground">Rewards Earned</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for dashboard widgets
 */
export function MilestoneTimelineCompact({
  userId,
  planId,
}: Omit<MilestoneTimelineProps, 'compact' | 'showUpcoming' | 'maxMilestones'>) {
  return (
    <MilestoneTimeline
      userId={userId}
      planId={planId}
      compact={true}
      showUpcoming={true}
      maxMilestones={3}
    />
  );
}
