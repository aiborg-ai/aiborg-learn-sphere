/**
 * Study Calendar Component
 * Weekly calendar view for personalized study plans
 * Displays daily tasks with drag-drop capability and progress tracking
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Book,
  FileText,
  Dumbbell,
  RefreshCw,
  Target,
  AlertCircle,
} from '@/components/ui/icons';
import { StudyPlanGeneratorService, type GeneratedStudyPlan, type DailyTask } from '@/services/study-planner/StudyPlanGeneratorService';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, isSameDay, isToday, isPast, isFuture } from 'date-fns';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
import { useStudyPlanUpdates } from '@/hooks/useRealtimeUpdates';

interface StudyCalendarProps {
  userId: string;
  planId?: string;
  onTaskComplete?: (taskId: string) => void;
  onTaskClick?: (task: DailyTask, day: Date) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function StudyCalendar({
  userId,
  planId,
  onTaskComplete,
  onTaskClick,
}: StudyCalendarProps) {
  const { toast } = useToast();
  const [studyPlan, setStudyPlan] = useState<GeneratedStudyPlan | null>(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);

  // Real-time updates: Auto-refresh when study plan changes
  useStudyPlanUpdates(userId, () => {
    logger.info('Study plan updated, refreshing calendar');
    fetchStudyPlan();
  });

  useEffect(() => {
    fetchStudyPlan();
  }, [userId, planId]);

  const fetchStudyPlan = async () => {
    try {
      setLoading(true);
      const plan = await StudyPlanGeneratorService.getActiveStudyPlan(userId);

      if (!plan) {
        logger.warn('No active study plan found');
        setStudyPlan(null);
        return;
      }

      setStudyPlan(plan);

      // Find current week based on today's date
      const today = new Date();
      const weekIndex = plan.weekly_schedules.findIndex(week => {
        const weekStart = new Date(week.week_start_date);
        const weekEnd = new Date(week.week_end_date);
        return today >= weekStart && today <= weekEnd;
      });

      setCurrentWeekIndex(weekIndex >= 0 ? weekIndex : 0);
    } catch (error) {
      logger.error('Error fetching study plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to load study plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (task: DailyTask) => {
    if (!studyPlan) return;

    try {
      const success = await StudyPlanGeneratorService.completeTask(
        userId,
        studyPlan.id,
        task.task_id
      );

      if (success) {
        toast({
          title: 'Task Completed!',
          description: `Great job completing "${task.title}"`,
        });

        // Refresh plan to show updated completion
        await fetchStudyPlan();

        if (onTaskComplete) {
          onTaskComplete(task.task_id);
        }
      }
    } catch (error) {
      logger.error('Error completing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark task as complete',
        variant: 'destructive',
      });
    }
  };

  const getTaskIcon = (taskType: string) => {
    const icons: Record<string, any> = {
      course: Book,
      exercise: Dumbbell,
      quiz: FileText,
      review: RefreshCw,
      assessment: Target,
      reading: Book,
    };
    return icons[taskType] || Book;
  };

  const getTaskColor = (task: DailyTask) => {
    if (task.completed) return 'border-green-500 bg-green-50 dark:bg-green-950';
    if (task.task_type === 'review') return 'border-purple-500 bg-purple-50 dark:bg-purple-950';
    if (task.task_type === 'assessment') return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
    return 'border-gray-300 bg-white dark:bg-gray-900';
  };

  const calculateDayProgress = (tasks: DailyTask[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const calculateWeekProgress = () => {
    if (!studyPlan || !studyPlan.weekly_schedules[currentWeekIndex]) return 0;

    const week = studyPlan.weekly_schedules[currentWeekIndex];
    let totalTasks = 0;
    let completedTasks = 0;

    Object.values(week.daily_tasks).forEach(tasks => {
      totalTasks += tasks.length;
      completedTasks += tasks.filter(t => t.completed).length;
    });

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading your study calendar...</p>
        </CardContent>
      </Card>
    );
  }

  if (!studyPlan) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Active Study Plan</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a personalized study plan to get started
          </p>
          <Button>Create Study Plan</Button>
        </CardContent>
      </Card>
    );
  }

  const currentWeek = studyPlan.weekly_schedules[currentWeekIndex];
  const weekProgress = calculateWeekProgress();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {studyPlan.name}
            </CardTitle>
            <CardDescription className="mt-1">
              Week {currentWeek.week_number} of {studyPlan.total_weeks} •{' '}
              {format(new Date(currentWeek.week_start_date), 'MMM d')} -{' '}
              {format(new Date(currentWeek.week_end_date), 'MMM d, yyyy')}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
              disabled={currentWeekIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select
              value={currentWeekIndex.toString()}
              onValueChange={(value) => setCurrentWeekIndex(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {studyPlan.weekly_schedules.map((week, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    Week {week.week_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentWeekIndex(
                  Math.min(studyPlan.weekly_schedules.length - 1, currentWeekIndex + 1)
                )
              }
              disabled={currentWeekIndex === studyPlan.weekly_schedules.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Week Progress</span>
            <span className="text-sm font-bold">{weekProgress}%</span>
          </div>
          <Progress value={weekProgress} className="h-2" />
        </div>

        {/* Focus Topics */}
        {currentWeek.focus_topics && currentWeek.focus_topics.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Focus Topics:</p>
            <div className="flex flex-wrap gap-2">
              {currentWeek.focus_topics.map((topic, index) => (
                <Badge key={index} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Milestone */}
        {currentWeek.milestone && (
          <div className="mt-4 p-3 bg-primary/10 border-l-4 border-primary rounded">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">{currentWeek.milestone.title}</p>
                <p className="text-xs text-muted-foreground">
                  Target: {currentWeek.milestone.target_completion}% completion
                  {currentWeek.milestone.reward && ` • Reward: ${currentWeek.milestone.reward}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {DAYS_OF_WEEK.map((dayName, dayIndex) => {
            const dayKey = DAY_KEYS[dayIndex];
            const tasks = currentWeek.daily_tasks[dayKey] || [];
            const dayProgress = calculateDayProgress(tasks);
            const weekStartDate = new Date(currentWeek.week_start_date);
            const currentDayDate = addWeeks(startOfWeek(weekStartDate, { weekStartsOn: 1 }), 0);
            currentDayDate.setDate(currentDayDate.getDate() + dayIndex);

            const isDayToday = isToday(currentDayDate);
            const isDayPast = isPast(currentDayDate) && !isDayToday;
            const isDayFuture = isFuture(currentDayDate);

            return (
              <div
                key={dayName}
                className={`border rounded-lg p-3 min-h-[200px] ${
                  isDayToday ? 'ring-2 ring-primary bg-primary/5' : ''
                } ${isDayPast ? 'opacity-75' : ''}`}
              >
                {/* Day Header */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm">{dayName}</h3>
                    {isDayToday && (
                      <Badge variant="default" className="text-xs">
                        Today
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(currentDayDate, 'MMM d')}
                  </p>

                  {tasks.length > 0 && (
                    <div className="mt-2">
                      <Progress value={dayProgress} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {tasks.filter(t => t.completed).length}/{tasks.length} tasks
                      </p>
                    </div>
                  )}
                </div>

                {/* Task List */}
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No tasks scheduled
                    </p>
                  ) : (
                    tasks.map((task) => {
                      const TaskIcon = getTaskIcon(task.task_type);
                      return (
                        <div
                          key={task.task_id}
                          className={`p-2 border rounded cursor-pointer hover:shadow-md transition-all ${getTaskColor(task)}`}
                          onClick={() => {
                            setSelectedTask(task);
                            if (onTaskClick) {
                              onTaskClick(task, currentDayDate);
                            }
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <TaskIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium line-clamp-2">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {task.estimated_minutes}m
                                </span>
                                {task.difficulty_level && (
                                  <Badge variant="outline" className="text-xs py-0">
                                    {task.difficulty_level}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {!task.completed && !isDayFuture && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskComplete(task);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {task.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/20 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold">{currentWeek.total_hours}h</p>
            <p className="text-xs text-muted-foreground">Weekly Hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {Object.values(currentWeek.daily_tasks).reduce(
                (sum, tasks) => sum + tasks.length,
                0
              )}
            </p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {Object.values(currentWeek.daily_tasks).reduce(
                (sum, tasks) => sum + tasks.filter(t => t.completed).length,
                0
              )}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {Object.values(currentWeek.daily_tasks).reduce(
                (sum, tasks) =>
                  sum + tasks.filter(t => !t.completed).length,
                0
              )}
            </p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
