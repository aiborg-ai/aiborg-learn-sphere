import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  GoalsAnalyticsService,
  type LearningGoal,
  type CareerGoal,
  type StudyPlanGoal,
  type GoalsSummary,
  type GoalMilestone,
} from '@/services/analytics/GoalsAnalyticsService';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
  Award,
  BookOpen,
  Briefcase,
  Zap,
  Flag,
} from '@/components/ui/icons';
import { format, formatDistance } from 'date-fns';

export const GoalProgressDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);
  const [careerGoals, setCareerGoals] = useState<CareerGoal[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlanGoal[]>([]);
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);

  const loadGoalsData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [summaryData, learning, career, plans, milestonesData] = await Promise.all([
        GoalsAnalyticsService.getGoalsSummary(user.id),
        GoalsAnalyticsService.getLearningGoals(user.id),
        GoalsAnalyticsService.getCareerGoals(user.id),
        GoalsAnalyticsService.getStudyPlans(user.id),
        GoalsAnalyticsService.getGoalMilestones(user.id),
      ]);

      setSummary(summaryData);
      setLearningGoals(learning);
      setCareerGoals(career);
      setStudyPlans(plans);
      setMilestones(milestonesData);
    } catch (error) {
      logger.error('Error loading goals data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadGoalsData();
    }
  }, [user, loadGoalsData]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'paused':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'learning':
        return <BookOpen className="h-4 w-4" />;
      case 'career':
        return <Briefcase className="h-4 w-4" />;
      case 'study_plan':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalGoals === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              No goals found. Set learning goals to track your progress!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-3xl font-bold">{summary.totalGoals}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {summary.activeGoals} active, {summary.completedGoals} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-3xl font-bold">{summary.overallProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={summary.overallProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Track</p>
                <p className="text-3xl font-bold text-green-600">{summary.goalsOnTrack}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {summary.averageCompletionRate}% avg completion
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-3xl font-bold text-orange-600">{summary.goalsAtRisk}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Need attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Goals Tracking
          </CardTitle>
          <CardDescription>Track progress across all your learning objectives</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Goals</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="career">Career</TabsTrigger>
              <TabsTrigger value="study">Study Plans</TabsTrigger>
            </TabsList>

            {/* All Goals - Timeline View */}
            <TabsContent value="all" className="space-y-4 mt-6">
              {milestones.length === 0 ? (
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    No active milestones. Set goals to track your progress!
                  </AlertDescription>
                </Alert>
              ) : (
                milestones.map(milestone => (
                  <Card
                    key={milestone.id}
                    className="border-l-4"
                    style={{
                      borderLeftColor:
                        milestone.status === 'completed'
                          ? '#10b981'
                          : milestone.status === 'overdue'
                            ? '#ef4444'
                            : milestone.daysRemaining !== null && milestone.daysRemaining < 7
                              ? '#f97316'
                              : '#3b82f6',
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getGoalTypeIcon(milestone.goal_type)}
                            <h4 className="font-semibold">{milestone.title}</h4>
                            <Badge className={getStatusColor(milestone.status)}>
                              {milestone.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold">
                                {Math.round((milestone.current_value / milestone.target_value) * 100)}%
                              </span>
                            </div>
                            <Progress
                              value={(milestone.current_value / milestone.target_value) * 100}
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {milestone.current_value} / {milestone.target_value}
                              </span>
                              {milestone.deadline && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {milestone.daysRemaining !== null
                                    ? milestone.daysRemaining > 0
                                      ? `${milestone.daysRemaining} days left`
                                      : `${Math.abs(milestone.daysRemaining)} days overdue`
                                    : format(new Date(milestone.deadline), 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Learning Goals */}
            <TabsContent value="learning" className="space-y-4 mt-6">
              {learningGoals.length === 0 ? (
                <Alert>
                  <BookOpen className="h-4 w-4" />
                  <AlertDescription>
                    No learning goals set. Create daily or weekly learning targets!
                  </AlertDescription>
                </Alert>
              ) : (
                learningGoals
                  .filter(goal => goal.status === 'active')
                  .map(goal => (
                    <Card key={goal.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold">
                              {goal.goal_type.replace('_', ' ').toUpperCase()}
                            </h4>
                          </div>
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Progress</span>
                            <span className="font-semibold">
                              {goal.current_progress} / {goal.target_value}
                            </span>
                          </div>
                          <Progress
                            value={(goal.current_progress / goal.target_value) * 100}
                            className="h-2"
                          />

                          {goal.deadline && (
                            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Deadline: {format(new Date(goal.deadline), 'MMM dd, yyyy')} (
                              {formatDistance(new Date(goal.deadline), new Date(), {
                                addSuffix: true,
                              })}
                              )
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            {/* Career Goals */}
            <TabsContent value="career" className="space-y-4 mt-6">
              {careerGoals.length === 0 ? (
                <Alert>
                  <Briefcase className="h-4 w-4" />
                  <AlertDescription>
                    No career goals set. Set a target role to track skill requirements!
                  </AlertDescription>
                </Alert>
              ) : (
                careerGoals
                  .filter(goal => goal.is_active)
                  .map(goal => (
                    <Card key={goal.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold">{goal.target_role_name}</h4>
                          </div>
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Skills Progress</span>
                            <span className="font-semibold">{goal.progress_percentage}%</span>
                          </div>
                          <Progress value={goal.progress_percentage} className="h-2" />

                          <div className="flex items-center justify-between mt-3">
                            {goal.skills_achieved !== undefined &&
                              goal.skills_required !== undefined && (
                                <div className="text-sm text-muted-foreground">
                                  {goal.skills_achieved} / {goal.skills_required} skills acquired
                                </div>
                              )}
                            {goal.target_date && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(goal.target_date), 'MMM yyyy')}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            {/* Study Plans */}
            <TabsContent value="study" className="space-y-4 mt-6">
              {studyPlans.length === 0 ? (
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    No study plans created. Create an AI-powered study plan to structure your learning!
                  </AlertDescription>
                </Alert>
              ) : (
                studyPlans
                  .filter(plan => plan.status === 'active' || plan.status === 'draft')
                  .map(plan => (
                    <Card key={plan.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              {plan.title}
                              {plan.is_ai_generated && (
                                <Badge variant="outline" className="text-xs">
                                  AI
                                </Badge>
                              )}
                            </h4>
                            {plan.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {plan.description}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Completion</span>
                            <span className="font-semibold">{plan.completion_percentage}%</span>
                          </div>
                          <Progress value={plan.completion_percentage} className="h-2" />

                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Duration</p>
                              <p className="font-semibold">
                                {format(new Date(plan.start_date), 'MMM dd')} -{' '}
                                {plan.end_date
                                  ? format(new Date(plan.end_date), 'MMM dd')
                                  : 'Ongoing'}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Time Commitment</p>
                              <p className="font-semibold">
                                {plan.hours_per_week}h/week
                                {plan.total_hours_planned && ` (${plan.total_hours_planned}h total)`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
