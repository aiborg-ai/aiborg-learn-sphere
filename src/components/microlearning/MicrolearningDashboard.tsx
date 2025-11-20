/**
 * Microlearning Dashboard
 *
 * Daily learning hub with:
 * - Today's progress vs goals
 * - Streak tracking
 * - Learning recommendations
 * - Nuggets due for review
 * - Quick actions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Flame,
  Clock,
  Target,
  Play,
  BookOpen,
  Video,
  HelpCircle,
  FileText,
  Code,
  RefreshCw,
  Trophy,
  Zap,
  Settings,
  CheckCircle,
} from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  MicrolearningService,
  type DailyLearning,
  type LearningStreak,
  type LearningGoals,
  type LearningRecommendation,
} from '@/services/microlearning/MicrolearningService';
import { logger } from '@/utils/logger';

const contentTypeIcons: Record<string, React.ElementType> = {
  video: Video,
  reading: FileText,
  quiz: HelpCircle,
  exercise: Code,
  flashcard: BookOpen,
  summary: FileText,
};

export function MicrolearningDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [today, setToday] = useState<DailyLearning | null>(null);
  const [streak, setStreak] = useState<LearningStreak>({
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
    total_learning_days: 0,
    freeze_days_remaining: 0,
  });
  const [goals, setGoals] = useState<LearningGoals | null>(null);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [dueNuggets, setDueNuggets] = useState<
    Array<{
      nugget_id: string;
      title: string;
      content_type: string;
      duration_minutes: number;
      days_overdue: number;
    }>
  >([]);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [editedGoals, setEditedGoals] = useState({
    daily_minutes_goal: 15,
    daily_nuggets_goal: 3,
  });

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [summary, due, recs] = await Promise.all([
        MicrolearningService.getDashboardSummary(user.id),
        MicrolearningService.getDueNuggets(user.id),
        MicrolearningService.getRecommendations(user.id),
      ]);

      setToday(summary.today);
      setStreak(summary.streak);
      setGoals(summary.goals);
      setDueNuggets(due);
      setRecommendations(recs);

      if (summary.goals) {
        setEditedGoals({
          daily_minutes_goal: summary.goals.daily_minutes_goal,
          daily_nuggets_goal: summary.goals.daily_nuggets_goal,
        });
      }
    } catch (error) {
      logger.error('Error loading microlearning dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load learning data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGoals = async () => {
    if (!user?.id) return;

    try {
      await MicrolearningService.updateLearningGoals(user.id, editedGoals);
      setGoals(prev => (prev ? { ...prev, ...editedGoals } : null));
      setShowGoalSettings(false);
      toast({
        description: 'Learning goals updated',
      });
    } catch (error) {
      logger.error('Error saving goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to save goals',
        variant: 'destructive',
      });
    }
  };

  const handleDismissRecommendation = async (recId: string) => {
    try {
      await MicrolearningService.dismissRecommendation(recId);
      setRecommendations(prev => prev.filter(r => r.id !== recId));
    } catch (error) {
      logger.error('Error dismissing recommendation:', error);
    }
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

  const minutesGoal = goals?.daily_minutes_goal || 15;
  const nuggetsGoal = goals?.daily_nuggets_goal || 3;
  const minutesProgress = today?.minutes_learned || 0;
  const nuggetsProgress = today?.nuggets_completed || 0;
  const minutesPercentage = Math.min(100, Math.round((minutesProgress / minutesGoal) * 100));
  const nuggetsPercentage = Math.min(100, Math.round((nuggetsProgress / nuggetsGoal) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Daily Learning
          </h2>
          <p className="text-muted-foreground">Learn in bite-sized chunks, every day</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showGoalSettings} onOpenChange={setShowGoalSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Goals
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Daily Learning Goals</DialogTitle>
                <DialogDescription>Set your daily learning targets</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Daily minutes: {editedGoals.daily_minutes_goal}
                  </label>
                  <Slider
                    value={[editedGoals.daily_minutes_goal]}
                    onValueChange={([value]) =>
                      setEditedGoals(prev => ({ ...prev, daily_minutes_goal: value }))
                    }
                    min={5}
                    max={60}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 15-30 minutes for optimal retention
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Daily nuggets: {editedGoals.daily_nuggets_goal}
                  </label>
                  <Slider
                    value={[editedGoals.daily_nuggets_goal]}
                    onValueChange={([value]) =>
                      setEditedGoals(prev => ({ ...prev, daily_nuggets_goal: value }))
                    }
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <Button onClick={handleSaveGoals} className="w-full">
                  Save Goals
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Streak and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Card */}
        <Card className="border-orange-200 dark:border-orange-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-3xl font-bold">{streak.current_streak}</p>
                  <p className="text-xs text-muted-foreground">day streak</p>
                </div>
              </div>
              {streak.current_streak >= 7 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  On fire!
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Best: {streak.longest_streak} days</span>
              <span className="text-muted-foreground">
                Total: {streak.total_learning_days} days
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Minutes Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Minutes</span>
              </div>
              <span className="text-sm">
                {minutesProgress} / {minutesGoal}
              </span>
            </div>
            <Progress value={minutesPercentage} className="h-3 mb-2" />
            {today?.goal_achieved ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Goal achieved!
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {Math.max(0, minutesGoal - minutesProgress)} minutes to go
              </p>
            )}
          </CardContent>
        </Card>

        {/* Nuggets Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Nuggets</span>
              </div>
              <span className="text-sm">
                {nuggetsProgress} / {nuggetsGoal}
              </span>
            </div>
            <Progress value={nuggetsPercentage} className="h-3 mb-2" />
            <p className="text-xs text-muted-foreground">
              {Math.max(0, nuggetsGoal - nuggetsProgress)} nuggets remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Due for Review */}
      {dueNuggets.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-yellow-600" />
              Due for Review
            </CardTitle>
            <CardDescription>Strengthen your memory with spaced repetition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dueNuggets.slice(0, 5).map(nugget => {
                const Icon = contentTypeIcons[nugget.content_type] || FileText;
                return (
                  <div
                    key={nugget.nugget_id}
                    className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{nugget.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {nugget.duration_minutes} min •{' '}
                          {nugget.days_overdue > 0
                            ? `${nugget.days_overdue} days overdue`
                            : 'Due today'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary">
                      <Play className="h-3 w-3 mr-1" />
                      Review
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended for You</CardTitle>
          <CardDescription>AI-selected content based on your goals and progress</CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map(rec => {
                const nugget = rec.nugget;
                if (!nugget) return null;
                const Icon = contentTypeIcons[nugget.content_type] || FileText;

                return (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{nugget.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{nugget.duration_minutes} min</span>
                          <span>•</span>
                          <span className="capitalize">{nugget.difficulty}</span>
                          {rec.recommendation_type === 'spaced_review' && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                Review
                              </Badge>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm">
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recommendations right now</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points Earned Today */}
      {today && today.points_earned > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">+{today.points_earned}</p>
                  <p className="text-sm text-green-600">Points earned today</p>
                </div>
              </div>
              {today.goal_achieved && <Badge className="bg-green-600">Daily Goal Bonus!</Badge>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MicrolearningDashboard;
