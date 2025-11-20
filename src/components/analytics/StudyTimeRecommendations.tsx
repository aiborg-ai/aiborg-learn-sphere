/**
 * StudyTimeRecommendations Component
 *
 * AI-powered study time recommendations based on learning patterns
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  Sparkles,
  Sun,
  Moon,
  Sunrise,
  Calendar,
  Target,
  TrendingUp,
  Bell,
  CheckCircle,
} from '@/components/ui/icons';

interface StudyPattern {
  dayOfWeek: string;
  preferredTime: string; // e.g., "morning", "afternoon", "evening"
  averageMinutes: number;
  performanceScore: number; // 0-100
}

interface StudyRecommendation {
  type: 'optimal_time' | 'duration' | 'frequency' | 'break';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  icon: React.ElementType;
}

interface StudyTimeRecommendationsProps {
  patterns: StudyPattern[];
  recommendations: StudyRecommendation[];
  optimalTimeSlots: {
    time: string;
    dayOfWeek: string;
    confidence: number;
  }[];
  weeklyGoal: number; // minutes
  currentWeeklyMinutes: number;
  isLoading?: boolean;
  onSetReminder?: (time: string, dayOfWeek: string) => void;
}

function getTimeIcon(time: string) {
  switch (time.toLowerCase()) {
    case 'morning':
      return Sunrise;
    case 'afternoon':
      return Sun;
    case 'evening':
    case 'night':
      return Moon;
    default:
      return Clock;
  }
}

function getImpactColor(impact: string): string {
  switch (impact) {
    case 'high':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'low':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function StudyTimeRecommendations({
  patterns,
  recommendations,
  optimalTimeSlots,
  weeklyGoal,
  currentWeeklyMinutes,
  isLoading = false,
  onSetReminder,
}: StudyTimeRecommendationsProps) {
  const goalProgress = Math.min((currentWeeklyMinutes / weeklyGoal) * 100, 100);

  // Find best performing time
  const bestPattern = patterns.reduce(
    (best, current) => (current.performanceScore > best.performanceScore ? current : best),
    patterns[0]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Study Time Recommendations
            </CardTitle>
            <CardDescription>Personalized based on your learning patterns</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Target className="h-3 w-3" />
            {Math.round(goalProgress)}% of weekly goal
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Optimal study slots */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Your Optimal Study Times
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {optimalTimeSlots.slice(0, 3).map((slot, index) => {
              const TimeIcon = getTimeIcon(slot.time);
              return (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <TimeIcon className="h-5 w-5 text-primary" />
                    <Badge variant="secondary" className="text-xs">
                      {slot.confidence}% match
                    </Badge>
                  </div>
                  <div className="font-medium">{slot.dayOfWeek}</div>
                  <div className="text-sm text-muted-foreground capitalize">{slot.time}</div>
                  {onSetReminder && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 h-7 text-xs"
                      onClick={() => onSetReminder(slot.time, slot.dayOfWeek)}
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      Set Reminder
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            AI Recommendations
          </h4>
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const Icon = rec.icon;
              return (
                <div key={index} className={`p-3 rounded-lg border ${getImpactColor(rec.impact)}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{rec.title}</div>
                      <div className="text-xs opacity-80 mt-0.5">{rec.description}</div>
                    </div>
                    <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">
                      {rec.impact} impact
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly pattern summary */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Your Weekly Pattern
          </h4>
          <div className="grid grid-cols-7 gap-1">
            {patterns.map((pattern, index) => {
              const isHighPerformance = pattern.performanceScore >= 70;
              return (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {pattern.dayOfWeek.slice(0, 3)}
                  </div>
                  <div
                    className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                      isHighPerformance
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {pattern.averageMinutes}m
                  </div>
                  {isHighPerformance && (
                    <CheckCircle className="h-3 w-3 text-primary mx-auto mt-1" />
                  )}
                </div>
              );
            })}
          </div>
          {bestPattern && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              You perform best on <strong>{bestPattern.dayOfWeek}s</strong> during the{' '}
              <strong>{bestPattern.preferredTime}</strong>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
