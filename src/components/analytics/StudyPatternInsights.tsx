/**
 * Study Pattern Insights Component
 *
 * Displays actionable insights based on study patterns.
 * Shows optimal study times, session recommendations, and focus analysis.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Lightbulb,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Target,
  TrendingUp,
  Flame,
  AlertCircle,
  CheckCircle,
  Timer,
  Calendar,
  Brain,
  Zap,
} from '@/components/ui/icons';
import { useStudyEffectiveness } from '@/hooks/useRealTimeAnalytics';
import {
  StudyPatternInsight,
  OptimalStudySchedule,
} from '@/services/feedback-loop/FeedbackLoopTypes';
import { cn } from '@/lib/utils';

interface StudyPatternInsightsProps {
  showSchedule?: boolean;
  showHourlyChart?: boolean;
  maxInsights?: number;
  compact?: boolean;
  className?: string;
}

export function StudyPatternInsights({
  showSchedule = true,
  showHourlyChart = true,
  maxInsights = 5,
  compact = false,
  className,
}: StudyPatternInsightsProps) {
  const { insights, schedule, stats, isLoading } = useStudyEffectiveness();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Study Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Study Insights
          </CardTitle>
          <CardDescription>Personalized study recommendations</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Not enough data for insights</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Complete more study sessions to get personalized recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayInsights = insights.slice(0, maxInsights);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Study Insights
            </CardTitle>
            <CardDescription>
              {insights.length} personalized recommendation{insights.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          {stats && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Flame className="h-3 w-3 mr-1 text-orange-500" />
                {stats.studyStreak} day streak
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Stats */}
        {stats && !compact && (
          <div className="grid grid-cols-4 gap-3">
            <QuickStat
              icon={<Timer className="h-4 w-4 text-blue-500" />}
              label="Total Time"
              value={`${Math.round(stats.totalMinutes / 60)}h`}
            />
            <QuickStat
              icon={<Target className="h-4 w-4 text-green-500" />}
              label="Questions"
              value={stats.totalQuestions.toString()}
            />
            <QuickStat
              icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
              label="Accuracy"
              value={`${(stats.overallAccuracy * 100).toFixed(0)}%`}
            />
            <QuickStat
              icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
              label="Ability Gain"
              value={`+${stats.abilityGain.toFixed(2)}`}
            />
          </div>
        )}

        {/* Optimal Schedule */}
        {showSchedule && schedule && (
          <OptimalScheduleSection schedule={schedule} compact={compact} />
        )}

        {/* Hourly Performance Chart */}
        {showHourlyChart && schedule?.hourlyPerformance && !compact && (
          <HourlyPerformanceChart data={schedule.hourlyPerformance} />
        )}

        {/* Insights Cards */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Actionable Insights
          </h4>
          <div className={cn('space-y-2', compact && 'space-y-1.5')}>
            {displayInsights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} compact={compact} />
            ))}
          </div>
        </div>

        {/* View More */}
        {insights.length > maxInsights && (
          <p className="text-xs text-center text-muted-foreground">
            +{insights.length - maxInsights} more insights available
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function QuickStat({ icon, label, value }: QuickStatProps) {
  return (
    <div className="text-center p-2 border rounded-lg">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

interface OptimalScheduleSectionProps {
  schedule: OptimalStudySchedule;
  compact?: boolean;
}

function OptimalScheduleSection({ schedule, compact }: OptimalScheduleSectionProps) {
  const getTimeIcon = (hour: number) => {
    if (hour >= 5 && hour < 12) return <Sunrise className="h-4 w-4 text-orange-400" />;
    if (hour >= 12 && hour < 17) return <Sun className="h-4 w-4 text-yellow-500" />;
    if (hour >= 17 && hour < 21) return <Sunset className="h-4 w-4 text-orange-500" />;
    return <Moon className="h-4 w-4 text-blue-400" />;
  };

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm}`;
  };

  if (compact) {
    return (
      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
        <div className="flex items-center gap-2">
          {getTimeIcon(schedule.optimalStartHour)}
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Best time: {formatHour(schedule.optimalStartHour)} -{' '}
            {formatHour(schedule.optimalEndHour)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30">
      <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4" />
        Your Optimal Study Schedule
      </h4>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex justify-center mb-1">{getTimeIcon(schedule.optimalStartHour)}</div>
          <p className="text-lg font-bold">
            {formatHour(schedule.optimalStartHour)} - {formatHour(schedule.optimalEndHour)}
          </p>
          <p className="text-xs text-muted-foreground">Peak Performance</p>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-1">
            <Timer className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-lg font-bold">{schedule.recommendedSessionLength} min</p>
          <p className="text-xs text-muted-foreground">Ideal Session</p>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-1">
            <Calendar className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-lg font-bold">{schedule.suggestedDaysPerWeek}</p>
          <p className="text-xs text-muted-foreground">Days/Week</p>
        </div>
      </div>

      {schedule.reasoning && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">{schedule.reasoning}</p>
      )}
    </div>
  );
}

interface HourlyPerformanceChartProps {
  data: { hour: number; performance: number; sessions: number }[];
}

function HourlyPerformanceChart({ data }: HourlyPerformanceChartProps) {
  const chartData = data.map(d => ({
    hour: `${d.hour % 12 || 12}${d.hour >= 12 ? 'pm' : 'am'}`,
    performance: d.performance * 100,
    sessions: d.sessions,
  }));

  const maxPerformance = Math.max(...chartData.map(d => d.performance));

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4" />
        Performance by Time of Day
      </h4>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
          <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload[0]) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-popover border rounded-lg p-2 shadow-lg text-xs">
                  <p className="font-medium">{data.hour}</p>
                  <p>Performance: {data.performance.toFixed(0)}%</p>
                  <p className="text-muted-foreground">{data.sessions} sessions</p>
                </div>
              );
            }}
          />
          <Bar dataKey="performance" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.performance >= maxPerformance * 0.9 ? '#22c55e' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface InsightCardProps {
  insight: StudyPatternInsight;
  compact?: boolean;
}

function InsightCard({ insight, compact }: InsightCardProps) {
  const getInsightIcon = (type: StudyPatternInsight['type']) => {
    const iconClass = 'h-4 w-4';
    switch (type) {
      case 'optimal_time':
        return <Clock className={cn(iconClass, 'text-blue-500')} />;
      case 'session_length':
        return <Timer className={cn(iconClass, 'text-purple-500')} />;
      case 'focus_pattern':
        return <Target className={cn(iconClass, 'text-green-500')} />;
      case 'break_suggestion':
        return <AlertCircle className={cn(iconClass, 'text-yellow-500')} />;
      case 'consistency':
        return <Calendar className={cn(iconClass, 'text-indigo-500')} />;
      default:
        return <Lightbulb className={cn(iconClass, 'text-yellow-500')} />;
    }
  };

  const getPriorityStyles = (priority: StudyPatternInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20';
      case 'medium':
        return 'border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/20';
      default:
        return 'bg-background/50';
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg border',
          getPriorityStyles(insight.priority)
        )}
      >
        {getInsightIcon(insight.type)}
        <span className="text-sm flex-1">{insight.title}</span>
        <Badge variant="secondary" className="text-[10px]">
          {insight.priority}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn('p-3 rounded-lg border', getPriorityStyles(insight.priority))}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm">{insight.title}</p>
            <Badge variant="secondary" className="text-[10px]">
              {insight.priority}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{insight.description}</p>
          {insight.action && (
            <p className="text-xs text-primary font-medium mt-2">Suggestion: {insight.action}</p>
          )}
        </div>
        {insight.impact && (
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">+{insight.impact}%</p>
            <p className="text-[10px] text-muted-foreground">potential</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyPatternInsights;
