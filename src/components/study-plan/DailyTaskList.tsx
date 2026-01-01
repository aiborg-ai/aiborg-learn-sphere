/**
 * Daily Task List Component
 * Focused view of today's study tasks with checkboxes and time tracking
 * Optimized for daily use with motivational elements
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Book,
  Dumbbell,
  FileText,
  RefreshCw,
  Target,
  Flame,
  Trophy,
  ChevronRight,
  Play,
} from '@/components/ui/icons';
import {
  StudyPlanGeneratorService,
  type GeneratedStudyPlan,
  type DailyTask,
} from '@/services/study-planner/StudyPlanGeneratorService';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
import { useStudyPlanUpdates } from '@/hooks/useRealtimeUpdates';

interface DailyTaskListProps {
  userId: string;
  compact?: boolean;
  showMotivation?: boolean;
  onTaskComplete?: (taskId: string) => void;
}

export function DailyTaskList({
  userId,
  compact = false,
  showMotivation = true,
  onTaskComplete,
}: DailyTaskListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studyPlan, setStudyPlan] = useState<GeneratedStudyPlan | null>(null);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  // Real-time updates: Auto-refresh when study plan changes
  useStudyPlanUpdates(userId, () => {
    logger.info('Study plan updated, refreshing tasks');
    fetchTodayTasks();
  });

  useEffect(() => {
    fetchTodayTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchTodayTasks = async () => {
    try {
      setLoading(true);
      const plan = await StudyPlanGeneratorService.getActiveStudyPlan(userId);

      if (!plan) {
        setStudyPlan(null);
        setTodayTasks([]);
        return;
      }

      setStudyPlan(plan);

      // Find today's tasks
      const today = new Date();
      const todayDayName = format(today, 'EEEE').toLowerCase();

      // Find current week
      const currentWeek = plan.weekly_schedules.find(week => {
        const weekStart = new Date(week.week_start_date);
        const weekEnd = new Date(week.week_end_date);
        return today >= weekStart && today <= weekEnd;
      });

      if (currentWeek) {
        const tasks = currentWeek.daily_tasks[todayDayName] || [];
        setTodayTasks(tasks.sort((a, b) => a.order_index - b.order_index));
      } else {
        setTodayTasks([]);
      }
    } catch (_error) {
      logger.error('Error fetching today tasks:', _error);
      toast({
        title: 'Error',
        description: "Failed to load today's tasks",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (task: DailyTask) => {
    if (!studyPlan || task.completed) return;

    try {
      setCompletingTask(task.task_id);

      const success = await StudyPlanGeneratorService.completeTask(
        userId,
        studyPlan.id,
        task.task_id
      );

      if (success) {
        // Update local state
        setTodayTasks(prev =>
          prev.map(t =>
            t.task_id === task.task_id
              ? { ...t, completed: true, completed_at: new Date().toISOString() }
              : t
          )
        );

        // Show success message
        toast({
          title: '🎉 Task Completed!',
          description: `Great job on "${task.title}"`,
        });

        if (onTaskComplete) {
          onTaskComplete(task.task_id);
        }

        // Check if all tasks completed
        const remaining = todayTasks.filter(t => !t.completed && t.task_id !== task.task_id);
        if (remaining.length === 0) {
          toast({
            title: '🏆 All Done for Today!',
            description: "You've completed all your daily tasks. Excellent work!",
          });
        }
      }
    } catch (_error) {
      logger.error('Error completing task:', _error);
      toast({
        title: 'Error',
        description: 'Failed to mark task as complete',
        variant: 'destructive',
      });
    } finally {
      setCompletingTask(null);
    }
  };

  const handleTaskStart = (task: DailyTask) => {
    // Navigate to appropriate content
    if (task.content_id) {
      if (task.task_type === 'course') {
        navigate(`/courses/${task.content_id}`);
      } else if (task.task_type === 'exercise') {
        navigate(`/exercises/${task.content_id}`);
      } else if (task.task_type === 'quiz' || task.task_type === 'assessment') {
        navigate(`/quizzes/${task.content_id}`);
      }
    }
  };

  const getTaskIcon = (taskType: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      course: Book,
      exercise: Dumbbell,
      quiz: FileText,
      review: RefreshCw,
      assessment: Target,
      reading: Book,
    };
    const Icon = icons[taskType] || Book;
    return <Icon className="h-4 w-4" />;
  };

  const calculateProgress = () => {
    if (todayTasks.length === 0) return 0;
    const completed = todayTasks.filter(t => t.completed).length;
    return Math.round((completed / todayTasks.length) * 100);
  };

  const _getTotalTime = () => {
    return todayTasks.reduce((sum, task) => sum + task.estimated_minutes, 0);
  };

  const getRemainingTime = () => {
    return todayTasks
      .filter(t => !t.completed)
      .reduce((sum, task) => sum + task.estimated_minutes, 0);
  };

  const getMotivationalMessage = () => {
    const progress = calculateProgress();
    if (progress === 100)
      return { icon: Trophy, message: 'All tasks completed! 🎉', color: 'text-green-600' };
    if (progress >= 75)
      return { icon: Flame, message: 'Almost there! Keep it up!', color: 'text-orange-500' };
    if (progress >= 50)
      return {
        icon: CheckCircle2,
        message: "Halfway done! You're doing great!",
        color: 'text-blue-500',
      };
    if (progress >= 25)
      return {
        icon: Circle,
        message: "Good start! Let's keep the momentum!",
        color: 'text-purple-500',
      };
    return { icon: Circle, message: "Ready to conquer today's tasks?", color: 'text-gray-500' };
  };

  if (loading) {
    return (
      <Card className={compact ? '' : 'shadow-lg'}>
        <CardContent className="p-8 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading today's tasks...</p>
        </CardContent>
      </Card>
    );
  }

  if (!studyPlan) {
    return (
      <Card className={compact ? '' : 'shadow-lg'}>
        <CardHeader>
          <CardTitle className="text-lg">Today's Tasks</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            No active study plan. Create one to get started!
          </p>
          <Button onClick={() => navigate('/study-planner')}>Create Study Plan</Button>
        </CardContent>
      </Card>
    );
  }

  if (todayTasks.length === 0) {
    return (
      <Card className={compact ? '' : 'shadow-lg'}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Tasks
          </CardTitle>
          <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-sm text-muted-foreground">
            No tasks scheduled for today. Enjoy your free time!
          </p>
        </CardContent>
      </Card>
    );
  }

  const progress = calculateProgress();
  const motivation = getMotivationalMessage();
  const MotivationIcon = motivation.icon;

  return (
    <Card className={compact ? '' : 'shadow-lg'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Tasks
            </CardTitle>
            <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
          </div>

          {!compact && (
            <Button variant="outline" size="sm" onClick={() => navigate('/study-planner/calendar')}>
              View Calendar
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Daily Progress</span>
            <span className="text-sm font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-secondary/20 rounded">
            <p className="text-lg font-bold">{todayTasks.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
            <p className="text-lg font-bold text-green-600">
              {todayTasks.filter(t => t.completed).length}
            </p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
            <p className="text-lg font-bold text-blue-600">{getRemainingTime()}m</p>
            <p className="text-xs text-muted-foreground">Left</p>
          </div>
        </div>

        {/* Motivational Message */}
        {showMotivation && (
          <div className={`mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10`}>
            <div className="flex items-center gap-2">
              <MotivationIcon className={`h-5 w-5 ${motivation.color}`} />
              <p className="text-sm font-medium">{motivation.message}</p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {todayTasks.map((task, index) => (
          <div
            key={task.task_id}
            className={`p-4 border rounded-lg transition-all ${
              task.completed
                ? 'bg-green-50 dark:bg-green-950 border-green-200 opacity-75'
                : 'hover:border-primary hover:shadow-md cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleTaskComplete(task)}
                disabled={task.completed || completingTask === task.task_id}
                className="mt-1"
              />

              {/* Task Icon */}
              <div className="flex-shrink-0 mt-0.5">{getTaskIcon(task.task_type)}</div>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4
                      className={`font-medium text-sm ${
                        task.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {index + 1}. {task.title}
                    </h4>

                    {task.description && !compact && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {task.estimated_minutes} min
                      </span>

                      {task.difficulty_level && (
                        <Badge variant="outline" className="text-xs h-5">
                          {task.difficulty_level}
                        </Badge>
                      )}

                      <Badge variant="secondary" className="text-xs h-5">
                        {task.task_type}
                      </Badge>
                    </div>

                    {task.topics && task.topics.length > 0 && !compact && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.topics.slice(0, 3).map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {!task.completed && (
                    <Button
                      size="sm"
                      onClick={() => handleTaskStart(task)}
                      disabled={!task.content_id}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}

                  {task.completed && task.completed_at && (
                    <div className="text-right">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.completed_at), 'h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Summary */}
        {!compact && progress === 100 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2" />
            <h3 className="font-bold text-lg mb-1">Perfect Day!</h3>
            <p className="text-sm opacity-90">
              You've completed all {todayTasks.length} tasks. Tomorrow's plan is ready when you are!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
