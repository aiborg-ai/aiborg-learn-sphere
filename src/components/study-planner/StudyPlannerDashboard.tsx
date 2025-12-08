/**
 * AI Study Planner Dashboard
 *
 * Smart scheduling hub with:
 * - Today's schedule overview
 * - Learning style insights
 * - Optimal study time detection
 * - Active study plans
 * - Session tracking
 * - AI recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import {
  Calendar,
  Clock,
  Brain,
  Play,
  Pause,
  CheckCircle,
  Target,
  Zap,
  Eye,
  Headphones,
  BookOpen,
  Hand,
  TrendingUp,
  AlertCircle,
  Plus,
  RefreshCw,
  Timer,
  Coffee,
  BarChart3,
  ListTodo,
} from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  StudyPlannerService,
  type LearningStyleProfile,
  type OptimalTime,
  type StudyPlan,
  type StudySession,
  type TodayScheduleItem,
  type PlanRecommendation,
} from '@/services/study-planner/StudyPlannerService';
import { logger } from '@/utils/logger';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const learningStyleIcons: Record<string, React.ElementType> = {
  visual: Eye,
  auditory: Headphones,
  reading: BookOpen,
  kinesthetic: Hand,
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export function StudyPlannerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [learningStyle, setLearningStyle] = useState<LearningStyleProfile | null>(null);
  const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([]);
  const [activePlans, setActivePlans] = useState<StudyPlan[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<TodayScheduleItem[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    avgProductivity: 0,
    avgSessionLength: 0,
  });

  // Session timer state
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionPaused, setIsSessionPaused] = useState(false);

  // Create plan dialog
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanHours, setNewPlanHours] = useState(5);
  const [newPlanWeeks, setNewPlanWeeks] = useState(4);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && !isSessionPaused) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, isSessionPaused]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const data = await StudyPlannerService.getDashboardSummary(user.id);
      setLearningStyle(data.learningStyle);
      setOptimalTimes(data.optimalTimes);
      setActivePlans(data.activePlans);
      setTodaysSchedule(data.todaysSchedule);
      setRecentSessions(data.recentSessions);
      setRecommendations(data.recommendations);
      setStats(data.stats);
    } catch (error) {
      logger.error('Error loading study planner dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load study planner data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (title?: string) => {
    if (!user?.id) return;

    try {
      const session = await StudyPlannerService.startSession(user.id, {
        title: title || 'Quick Study Session',
        plannedDuration: learningStyle?.preferred_session_length || 25,
      });
      setActiveSession(session);
      setSessionTime(0);
      setIsSessionPaused(false);
      toast({
        description: 'Study session started! Stay focused.',
      });
    } catch (error) {
      logger.error('Error starting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start session',
        variant: 'destructive',
      });
    }
  };

  const handlePauseSession = () => {
    setIsSessionPaused(!isSessionPaused);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      const result = await StudyPlannerService.completeSession(activeSession.id, {
        completionPercentage: 100,
      });
      setActiveSession(null);
      setSessionTime(0);
      toast({
        description: `Session completed! ${result.duration_minutes} minutes of focused study.`,
      });
      loadDashboardData();
    } catch (error) {
      logger.error('Error ending session:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete session',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePlan = async () => {
    if (!user?.id || !newPlanTitle) return;

    try {
      await StudyPlannerService.generateAIStudyPlan(user.id, newPlanTitle, {
        hoursPerWeek: newPlanHours,
        durationWeeks: newPlanWeeks,
      });
      setShowCreatePlan(false);
      setNewPlanTitle('');
      toast({
        description: 'AI Study Plan created successfully!',
      });
      loadDashboardData();
    } catch (error) {
      logger.error('Error creating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to create study plan',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDominantStyle = (): { name: string; score: number } | null => {
    if (!learningStyle) return null;
    const styles = [
      { name: 'visual', score: learningStyle.visual_score },
      { name: 'auditory', score: learningStyle.auditory_score },
      { name: 'reading', score: learningStyle.reading_score },
      { name: 'kinesthetic', score: learningStyle.kinesthetic_score },
    ];
    return styles.reduce((max, curr) => (curr.score > max.score ? curr : max));
  };

  const getTodayOptimalTime = (): OptimalTime | undefined => {
    const dayOfWeek = new Date().getDay();
    return optimalTimes.find(t => t.day_of_week === dayOfWeek);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const dominantStyle = getDominantStyle();
  const todayOptimal = getTodayOptimalTime();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            AI Study Planner
          </h2>
          <p className="text-muted-foreground">Smart scheduling and adaptive learning</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create AI Study Plan</DialogTitle>
                <DialogDescription>
                  Let AI generate an optimized study plan for you
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Plan Title</Label>
                  <Input
                    value={newPlanTitle}
                    onChange={e => setNewPlanTitle(e.target.value)}
                    placeholder="e.g., Master React Development"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hours per Week: {newPlanHours}</Label>
                  <Slider
                    value={[newPlanHours]}
                    onValueChange={([value]) => setNewPlanHours(value)}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration: {newPlanWeeks} weeks</Label>
                  <Slider
                    value={[newPlanWeeks]}
                    onValueChange={([value]) => setNewPlanWeeks(value)}
                    min={1}
                    max={12}
                    step={1}
                  />
                </div>
                <Button onClick={handleCreatePlan} className="w-full">
                  Generate Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Session Card */}
      {activeSession ? (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Timer className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Session</p>
                  <p className="text-3xl font-bold font-mono">{formatTime(sessionTime)}</p>
                  <p className="text-sm">{activeSession.title || 'Study Session'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePauseSession}>
                  {isSessionPaused ? (
                    <Play className="h-4 w-4 mr-1" />
                  ) : (
                    <Pause className="h-4 w-4 mr-1" />
                  )}
                  {isSessionPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Record break
                    StudyPlannerService.recordBreak(activeSession.id, 5);
                    setIsSessionPaused(true);
                  }}
                >
                  <Coffee className="h-4 w-4 mr-1" />
                  Break
                </Button>
                <Button onClick={handleEndSession}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  End Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to study?</p>
                <p className="text-sm text-muted-foreground">
                  {learningStyle
                    ? `Recommended: ${learningStyle.preferred_session_length} min sessions`
                    : 'Start a quick session or pick from your schedule'}
                </p>
              </div>
              <Button onClick={() => handleStartSession()}>
                <Play className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Sessions this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.totalMinutes / 60)}h</p>
                <p className="text-xs text-muted-foreground">Study time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgProductivity}%</p>
                <p className="text-xs text-muted-foreground">Avg productivity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgSessionLength}m</p>
                <p className="text-xs text-muted-foreground">Avg session</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="plans">My Plans</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="style">Learning Style</TabsTrigger>
        </TabsList>

        {/* Today's Schedule */}
        <TabsContent value="today" className="space-y-4">
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-900">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg"
                    >
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{rec.title}</p>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>{todaysSchedule.length} items scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              {todaysSchedule.length > 0 ? (
                <div className="space-y-3">
                  {todaysSchedule.map(item => (
                    <div
                      key={item.item_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                          {item.scheduled_time || '--:--'}
                        </div>
                        <div>
                          <p className="font-medium">{item.item_title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{item.plan_title}</span>
                            <span>•</span>
                            <span>{item.duration_minutes} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>
                        <Button
                          size="sm"
                          onClick={() => handleStartSession(item.item_title)}
                          disabled={!!activeSession}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items scheduled for today</p>
                  <p className="text-sm">Create a study plan to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optimal Time Today */}
          {todayOptimal && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Best Time Today</p>
                      <p className="text-sm text-muted-foreground">
                        Based on your productivity history
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {todayOptimal.peak_hour !== null
                        ? `${todayOptimal.peak_hour > 12 ? todayOptimal.peak_hour - 12 : todayOptimal.peak_hour}:00 ${todayOptimal.peak_hour >= 12 ? 'PM' : 'AM'}`
                        : 'No data yet'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {todayOptimal.sample_count} sessions analyzed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Plans */}
        <TabsContent value="plans" className="space-y-4">
          {activePlans.length > 0 ? (
            activePlans.map(plan => (
              <Card key={plan.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{plan.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {plan.hours_per_week}h/week • Ends{' '}
                          {plan.end_date
                            ? new Date(plan.end_date).toLocaleDateString()
                            : 'No deadline'}
                        </p>
                      </div>
                      {plan.is_ai_generated && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          AI Generated
                        </Badge>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{plan.completion_percentage}%</span>
                      </div>
                      <Progress value={plan.completion_percentage} className="h-2" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {plan.skip_mastered && <Badge variant="outline">Skip Mastered</Badge>}
                      {plan.deep_dive_struggling && <Badge variant="outline">Deep Dive Mode</Badge>}
                      <Badge variant="outline" className="capitalize">
                        {plan.pace_adjustment} Pace
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active study plans</p>
                  <p className="text-sm">Create an AI-powered study plan to get started</p>
                  <Button className="mt-4" onClick={() => setShowCreatePlan(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          {/* Weekly Productivity Pattern */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Productivity Pattern</CardTitle>
              <CardDescription>Your optimal study times throughout the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, i) => {
                  const dayData = optimalTimes.find(t => t.day_of_week === i);
                  const maxScore = dayData
                    ? Math.max(
                        dayData.morning_score,
                        dayData.afternoon_score,
                        dayData.evening_score,
                        dayData.night_score
                      )
                    : 50;

                  return (
                    <div key={day} className="text-center">
                      <p className="text-xs font-medium mb-2">{day}</p>
                      <div
                        className="h-20 rounded-lg flex items-end justify-center"
                        style={{
                          background: `linear-gradient(to top, rgba(147, 51, 234, ${maxScore / 100}) 0%, rgba(147, 51, 234, 0.1) 100%)`,
                        }}
                      >
                        <span className="text-xs font-medium pb-1">{maxScore}</span>
                      </div>
                      {dayData?.peak_hour !== null && (
                        <p className="text-xs text-muted-foreground mt-1">{dayData.peak_hour}:00</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.map(session => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{session.title || 'Study Session'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.started_at).toLocaleDateString()} •{' '}
                          {session.active_duration_minutes || session.actual_duration_minutes || 0}{' '}
                          min
                        </p>
                      </div>
                      {session.productivity_score && (
                        <Badge
                          variant={
                            session.productivity_score >= 80
                              ? 'default'
                              : session.productivity_score >= 60
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {session.productivity_score}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">No recent sessions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Style */}
        <TabsContent value="style" className="space-y-4">
          {learningStyle ? (
            <>
              {/* Dominant Style */}
              {dominantStyle && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const Icon = learningStyleIcons[dominantStyle.name] || Brain;
                        return <Icon className="h-12 w-12 text-purple-600" />;
                      })()}
                      <div>
                        <p className="text-sm text-muted-foreground">Dominant Learning Style</p>
                        <p className="text-2xl font-bold capitalize">
                          {dominantStyle.name} Learner
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Score: {dominantStyle.score}/100
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Style Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Learning Style Profile</CardTitle>
                  <CardDescription>How you best absorb information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'Visual', score: learningStyle.visual_score, icon: Eye, color: 'blue' },
                    {
                      name: 'Auditory',
                      score: learningStyle.auditory_score,
                      icon: Headphones,
                      color: 'green',
                    },
                    {
                      name: 'Reading',
                      score: learningStyle.reading_score,
                      icon: BookOpen,
                      color: 'orange',
                    },
                    {
                      name: 'Kinesthetic',
                      score: learningStyle.kinesthetic_score,
                      icon: Hand,
                      color: 'purple',
                    },
                  ].map(style => (
                    <div key={style.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <style.icon className={`h-4 w-4 text-${style.color}-500`} />
                          <span className="text-sm font-medium">{style.name}</span>
                        </div>
                        <span className="text-sm">{style.score}</span>
                      </div>
                      <Progress value={style.score} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Session Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Session Length</p>
                      <p className="text-lg font-bold">
                        {learningStyle.preferred_session_length} min
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Break Length</p>
                      <p className="text-lg font-bold">
                        {learningStyle.preferred_break_length} min
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Before Long Break</p>
                      <p className="text-lg font-bold">
                        {learningStyle.sessions_before_long_break} sessions
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Pace</p>
                      <p className="text-lg font-bold capitalize">{learningStyle.preferred_pace}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No learning style data yet</p>
                  <p className="text-sm">
                    Complete some study sessions to detect your learning style
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StudyPlannerDashboard;
