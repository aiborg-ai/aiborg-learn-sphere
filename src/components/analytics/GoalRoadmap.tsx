/**
 * Goal Roadmap Component
 * Visualizes learning goals with predictions, milestones, and recommendations
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GoalPredictionService,
  type LearningGoal,
  type GoalPrediction,
  type Milestone,
  type ProgressTrendData,
  type GoalRecommendation,
} from '@/services/analytics/GoalPredictionService';
import { ChartLoadingSkeleton } from './AnalyticsLoadingSkeleton';
import { AnalyticsErrorDisplay } from './AnalyticsErrorBoundary';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Calendar,
  Lightbulb,
  ChevronRight,
} from '@/components/ui/icons';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';

interface GoalRoadmapProps {
  userId: string;
}

export function GoalRoadmap({ userId }: GoalRoadmapProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<GoalPrediction | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progressTrend, setProgressTrend] = useState<ProgressTrendData[]>([]);
  const [recommendations, setRecommendations] = useState<GoalRecommendation[]>([]);

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  useEffect(() => {
    if (selectedGoalId) {
      fetchGoalDetails(selectedGoalId);
    }
  }, [selectedGoalId]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      const goalsData = await GoalPredictionService.getUserGoals(userId);
      setGoals(goalsData);

      // Auto-select first non-completed goal
      const activeGoal = goalsData.find(g => g.status !== 'completed');
      if (activeGoal) {
        setSelectedGoalId(activeGoal.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load goals'));
    } finally {
      setLoading(false);
    }
  };

  const fetchGoalDetails = async (goalId: string) => {
    try {
      const [predictionData, milestonesData, trendData, recommendationsData] = await Promise.all([
        GoalPredictionService.predictGoalCompletion(userId, goalId),
        GoalPredictionService.getGoalMilestones(userId, goalId),
        GoalPredictionService.getProgressTrend(userId, goalId),
        GoalPredictionService.getGoalRecommendations(userId, goalId),
      ]);

      setPrediction(predictionData);
      setMilestones(milestonesData);
      setProgressTrend(trendData);
      setRecommendations(recommendationsData);
    } catch (err) {
      logger.error('Error fetching goal details:', err);
    }
  };

  if (loading) {
    return <ChartLoadingSkeleton />;
  }

  if (error) {
    return <AnalyticsErrorDisplay error={error} retry={fetchGoals} />;
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Learning Goals Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set learning goals to track your progress and get personalized predictions.
          </p>
          <Button>Create Your First Goal</Button>
        </CardContent>
      </Card>
    );
  }

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; color: string }> = {
      completed: { variant: 'default', color: 'text-green-500' },
      on_track: { variant: 'secondary', color: 'text-blue-500' },
      in_progress: { variant: 'outline', color: 'text-yellow-500' },
      at_risk: { variant: 'destructive', color: 'text-red-500' },
      not_started: { variant: 'outline', color: 'text-gray-500' },
    };
    const config = variants[status] || variants.not_started;
    return <Badge variant={config.variant}>{status.replace('_', ' ')}</Badge>;
  };

  const getRiskBadge = (level: string) => {
    const variants: Record<string, any> = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
    };
    return <Badge variant={variants[level] || 'secondary'}>{level} risk</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.slice(0, 3).map((goal) => (
          <Card
            key={goal.id}
            className={`cursor-pointer transition-all ${
              selectedGoalId === goal.id ? 'ring-2 ring-primary' : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedGoalId(goal.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{goal.title}</CardTitle>
                {getStatusBadge(goal.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-bold">{goal.currentProgress}%</span>
                </div>
                <Progress value={goal.currentProgress} />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Due {format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Goal Details */}
      {selectedGoal && prediction && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Prediction Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Chance</p>
                      <p className="text-2xl font-bold">{prediction.completionProbability}%</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                  <Progress value={prediction.completionProbability} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Days Remaining</p>
                      <p className="text-2xl font-bold">{prediction.daysRemaining}</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Effort Needed</p>
                      <p className="text-2xl font-bold">{prediction.recommendedDailyEffort}m</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Risk Level</p>
                      <div className="mt-1">{getRiskBadge(prediction.riskLevel)}</div>
                    </div>
                    <AlertTriangle
                      className={`h-8 w-8 ${
                        prediction.riskLevel === 'high'
                          ? 'text-red-500'
                          : prediction.riskLevel === 'medium'
                            ? 'text-yellow-500'
                            : 'text-green-500'
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Trend Chart */}
            {progressTrend.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Progress Trend & Predictions</CardTitle>
                  <CardDescription>
                    Your actual progress vs. predicted and target progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="actualProgress"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        name="Actual Progress"
                      />
                      <Line
                        type="monotone"
                        dataKey="predictedProgress"
                        stroke="#3b82f6"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        name="Predicted"
                      />
                      <Line
                        type="monotone"
                        dataKey="targetProgress"
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        strokeWidth={2}
                        name="Target"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-4 bg-secondary/20 rounded-lg">
                    <p className="text-sm">
                      <strong>Estimated Completion:</strong>{' '}
                      {format(new Date(prediction.estimatedCompletionDate), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confidence: {prediction.confidenceScore}/100
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones">
            <Card>
              <CardHeader>
                <CardTitle>Milestone Tracking</CardTitle>
                <CardDescription>Track your progress through key milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className={`p-4 border-l-4 rounded-r-lg ${
                        milestone.completed
                          ? 'border-green-500 bg-green-50 dark:bg-green-950'
                          : milestone.isPastDue
                            ? 'border-red-500 bg-red-50 dark:bg-red-950'
                            : 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {milestone.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : milestone.isPastDue ? (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Flag className="h-5 w-5 text-blue-500" />
                            )}
                            <span className="font-semibold">{milestone.title}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Target: {format(new Date(milestone.targetDate), 'MMM d, yyyy')}
                            </span>
                            {!milestone.completed && (
                              <span>
                                Est: {format(new Date(milestone.estimatedCompletion), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Progress value={(milestone.progress / 25) * 100} className="w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No recommendations available at this time.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                recommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                          <div>
                            <CardTitle className="text-lg">{rec.title}</CardTitle>
                            <CardDescription>{rec.description}</CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={
                            rec.priority === 'high'
                              ? 'destructive'
                              : rec.priority === 'medium'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Action Items:</p>
                        <ul className="space-y-1">
                          {rec.actionItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
