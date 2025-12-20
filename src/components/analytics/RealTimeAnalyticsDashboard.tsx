/**
 * Real-Time Analytics Dashboard Component
 *
 * Comprehensive dashboard combining all analytics components.
 * Provides real-time updates via Supabase subscriptions.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  RefreshCw,
  Activity,
  Target,
  Lightbulb,
  TrendingUp,
  Zap,
  Calendar,
  Clock,
  Wifi,
  WifiOff,
} from '@/components/ui/icons';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { AbilityTrajectoryChart } from './AbilityTrajectoryChart';
import { LearningVelocityGauge } from './LearningVelocityGauge';
import { GoalCompletionCountdown } from './GoalCompletionCountdown';
import { StudyPatternInsights } from './StudyPatternInsights';
import { cn } from '@/lib/utils';

interface RealTimeAnalyticsDashboardProps {
  categoryId?: string;
  autoRefreshInterval?: number;
  enableRealtime?: boolean;
  layout?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export function RealTimeAnalyticsDashboard({
  categoryId,
  autoRefreshInterval = 60000, // 1 minute default
  enableRealtime = true,
  layout = 'full',
  className,
}: RealTimeAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const {
    abilityTrajectory,
    learningVelocity,
    studyStats,
    goalPredictions,
    isLoading,
    isRefreshing,
    error,
    refresh,
    subscribeToUpdates,
  } = useRealTimeAnalytics(categoryId, autoRefreshInterval);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enableRealtime) return;

    const unsubscribe = subscribeToUpdates();
    setIsSubscribed(true);

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [enableRealtime, subscribeToUpdates]);

  // Quick stats
  const quickStats = [
    {
      label: 'Current Ability',
      value: abilityTrajectory?.trajectory.currentAbility.toFixed(2) || '--',
      icon: Activity,
      color: 'text-blue-600',
    },
    {
      label: 'Velocity',
      value: learningVelocity ? `${(learningVelocity.velocity * 100).toFixed(1)}%/wk` : '--',
      icon: TrendingUp,
      color:
        learningVelocity?.trend === 'accelerating'
          ? 'text-green-600'
          : learningVelocity?.trend === 'decelerating'
            ? 'text-red-600'
            : 'text-blue-600',
    },
    {
      label: 'Goals on Track',
      value: `${goalPredictions.filter(g => g.successProbability >= 0.7).length}/${goalPredictions.length}`,
      icon: Target,
      color: 'text-purple-600',
    },
    {
      label: 'Study Streak',
      value: studyStats ? `${studyStats.studyStreak} days` : '--',
      icon: Zap,
      color: 'text-orange-600',
    },
  ];

  if (layout === 'minimal') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Quick Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {quickStats.map(stat => (
                <div key={stat.label} className="text-center p-2 border rounded-lg">
                  <stat.icon className={cn('h-4 w-4 mx-auto mb-1', stat.color)} />
                  <p className={cn('text-lg font-bold', stat.color)}>{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (layout === 'compact') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5" />
            <div>
              <h2 className="font-semibold">Learning Analytics</h2>
              <p className="text-xs text-muted-foreground">Real-time progress tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSubscribed && (
              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => refresh()} disabled={isRefreshing}>
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickStats.map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <stat.icon className={cn('h-4 w-4', stat.color)} />
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <p className={cn('text-xl font-bold mt-1', stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <LearningVelocityGauge categoryId={categoryId} compact />
          <GoalCompletionCountdown showAtRiskOnly maxGoals={3} compact />
        </div>

        <StudyPatternInsights compact maxInsights={3} />
      </div>
    );
  }

  // Full layout
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Learning Analytics Dashboard</h1>
            <p className="text-muted-foreground">Real-time insights into your learning progress</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Wifi className="h-3 w-3 mr-1" />
              Real-time Updates Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              <WifiOff className="h-3 w-3 mr-1" />
              Updates Paused
            </Badge>
          )}
          <Button variant="outline" onClick={() => refresh()} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
              <Activity className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Error loading analytics</p>
              <p className="text-sm text-red-600/80">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-red-300 text-red-700"
              onClick={() => refresh()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
                </div>
                <div className={cn('p-3 rounded-lg bg-muted/50')}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AbilityTrajectoryChart categoryId={categoryId} />
            </div>
            <div className="space-y-6">
              <LearningVelocityGauge categoryId={categoryId} />
              <GoalCompletionCountdown showAtRiskOnly maxGoals={3} />
            </div>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6 mt-6">
          <AbilityTrajectoryChart categoryId={categoryId} height={400} />
          <div className="grid md:grid-cols-2 gap-6">
            <LearningVelocityGauge categoryId={categoryId} />
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Study Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studyStats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold">{studyStats.totalSessions}</p>
                      <p className="text-xs text-muted-foreground">Total Sessions</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {Math.round(studyStats.totalMinutes / 60)}h
                      </p>
                      <p className="text-xs text-muted-foreground">Total Time</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold">{studyStats.totalQuestions}</p>
                      <p className="text-xs text-muted-foreground">Questions Answered</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {(studyStats.overallAccuracy * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Overall Accuracy</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold">{studyStats.averageSessionLength}m</p>
                      <p className="text-xs text-muted-foreground">Avg Session</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        +{studyStats.abilityGain.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Ability Gain</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No study data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <GoalCompletionCountdown maxGoals={10} />
            <GoalCompletionCountdown showAtRiskOnly maxGoals={5} />
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <StudyPatternInsights showSchedule showHourlyChart maxInsights={10} />
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>
          Last updated: {new Date().toLocaleTimeString()}
          {isRefreshing && ' • Refreshing...'}
        </span>
      </div>
    </div>
  );
}

export default RealTimeAnalyticsDashboard;
