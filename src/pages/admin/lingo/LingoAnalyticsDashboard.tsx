/**
 * LingoAnalyticsDashboard Component
 *
 * Analytics dashboard showing lesson stats, completions, and user engagement.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@/utils/iconLoader';
import { logger } from '@/utils/logger';

interface DashboardStats {
  totalLessons: number;
  totalQuestions: number;
  totalXpAvailable: number;
  activeUsers7d: number;
  lessonsStarted: number;
  lessonsCompleted: number;
  questionsAnswered: number;
  totalXpEarned: number;
}

interface LessonStat {
  id: string;
  lesson_id: string;
  title: string;
  skill: string;
  xp_reward: number;
  question_count: number;
  starts: number;
  completions: number;
}

interface Props {
  showOverviewOnly?: boolean;
}

export function LingoAnalyticsDashboard({ showOverviewOnly = false }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lessonStats, setLessonStats] = useState<LessonStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get lesson and question counts
      const { data: lessons, error: lessonsError } = await supabase
        .from('lingo_lessons')
        .select('id, lesson_id, title, skill, xp_reward, is_active');

      if (lessonsError) throw lessonsError;

      const { data: questions, error: questionsError } = await supabase
        .from('lingo_questions')
        .select('id, lesson_id');

      if (questionsError) throw questionsError;

      // Get analytics events
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: analytics, error: analyticsError } = await supabase
        .from('lingo_analytics')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (analyticsError) throw analyticsError;

      // Calculate stats
      const totalLessons = lessons?.length || 0;
      const totalQuestions = questions?.length || 0;
      const totalXpAvailable = (lessons || []).reduce((sum, l) => sum + (l.xp_reward || 0), 0);

      // Get unique users/sessions from analytics
      const uniqueUsers = new Set(
        (analytics || []).map(a => a.user_id || a.session_id).filter(Boolean)
      );

      const lessonsStarted = (analytics || []).filter(
        a => a.event_type === 'lesson_started'
      ).length;
      const lessonsCompleted = (analytics || []).filter(
        a => a.event_type === 'lesson_completed'
      ).length;
      const questionsAnswered = (analytics || []).filter(
        a => a.event_type === 'question_answered'
      ).length;
      const totalXpEarned = (analytics || [])
        .filter(a => a.event_type === 'xp_earned')
        .reduce((sum, a) => sum + (a.event_data?.xp || 0), 0);

      setStats({
        totalLessons,
        totalQuestions,
        totalXpAvailable,
        activeUsers7d: uniqueUsers.size,
        lessonsStarted,
        lessonsCompleted,
        questionsAnswered,
        totalXpEarned,
      });

      // Calculate per-lesson stats
      const questionCountsByLesson: Record<string, number> = {};
      (questions || []).forEach(q => {
        questionCountsByLesson[q.lesson_id] = (questionCountsByLesson[q.lesson_id] || 0) + 1;
      });

      const lessonStartsByLesson: Record<string, number> = {};
      const lessonCompletionsByLesson: Record<string, number> = {};

      (analytics || []).forEach(a => {
        if (a.event_type === 'lesson_started' && a.lesson_id) {
          lessonStartsByLesson[a.lesson_id] = (lessonStartsByLesson[a.lesson_id] || 0) + 1;
        }
        if (a.event_type === 'lesson_completed' && a.lesson_id) {
          lessonCompletionsByLesson[a.lesson_id] =
            (lessonCompletionsByLesson[a.lesson_id] || 0) + 1;
        }
      });

      const lessonStatsData = (lessons || []).map(lesson => ({
        id: lesson.id,
        lesson_id: lesson.lesson_id,
        title: lesson.title,
        skill: lesson.skill,
        xp_reward: lesson.xp_reward,
        question_count: questionCountsByLesson[lesson.id] || 0,
        starts: lessonStartsByLesson[lesson.id] || 0,
        completions: lessonCompletionsByLesson[lesson.id] || 0,
      }));

      setLessonStats(lessonStatsData);
    } catch (error) {
      logger.error('Failed to load analytics', error);
      toast({ title: 'Error', description: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  function getSkillColor(skill: string) {
    const colors: Record<string, string> = {
      Foundations: 'bg-blue-500',
      LLMs: 'bg-purple-500',
      Vision: 'bg-green-500',
      NLP: 'bg-orange-500',
      Safety: 'bg-red-500',
      Advanced: 'bg-amber-500',
    };
    return colors[skill] || 'bg-gray-500';
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <Icon name="BookOpen" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLessons || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalQuestions || 0} questions total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP Available</CardTitle>
            <Icon name="Zap" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalXpAvailable || 0}</div>
            <p className="text-xs text-muted-foreground">Across all lessons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (7d)</CardTitle>
            <Icon name="Users" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers7d || 0}</div>
            <p className="text-xs text-muted-foreground">Unique sessions/users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Icon name="CheckCircle2" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.lessonsStarted
                ? Math.round((stats.lessonsCompleted / stats.lessonsStarted) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.lessonsCompleted || 0} / {stats?.lessonsStarted || 0} lessons
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Stats */}
      {!showOverviewOnly && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lessons Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats?.lessonsStarted || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats?.lessonsCompleted || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {stats?.questionsAnswered || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Lesson Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Performance</CardTitle>
              <CardDescription>
                Completion rates and engagement per lesson (last 7 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lessonStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No lesson data available yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessonStats.map(lesson => {
                    const completionRate =
                      lesson.starts > 0
                        ? Math.round((lesson.completions / lesson.starts) * 100)
                        : 0;

                    return (
                      <div key={lesson.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${getSkillColor(lesson.skill)}`}
                            />
                            <span className="font-medium">{lesson.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {lesson.question_count} Q
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{lesson.starts} starts</span>
                            <span>{lesson.completions} completed</span>
                            <span className="font-medium text-foreground">{completionRate}%</span>
                          </div>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Content Distribution</CardTitle>
              <CardDescription>Lessons and questions by skill category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                {['Foundations', 'LLMs', 'Vision', 'NLP', 'Safety', 'Advanced'].map(skill => {
                  const skillLessons = lessonStats.filter(l => l.skill === skill);
                  const lessonCount = skillLessons.length;
                  const questionCount = skillLessons.reduce((sum, l) => sum + l.question_count, 0);

                  return (
                    <Card key={skill} className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getSkillColor(skill)}`} />
                          <span className="font-medium text-sm">{skill}</span>
                        </div>
                        <div className="text-2xl font-bold">{lessonCount}</div>
                        <p className="text-xs text-muted-foreground">{questionCount} questions</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Stats for Overview Mode */}
      {showOverviewOnly && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 7 days summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Icon name="Play" className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.lessonsStarted || 0}</p>
                  <p className="text-sm text-muted-foreground">Lessons started</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Icon name="CheckCircle" className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.lessonsCompleted || 0}</p>
                  <p className="text-sm text-muted-foreground">Lessons completed</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Icon name="Zap" className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalXpEarned || 0}</p>
                  <p className="text-sm text-muted-foreground">XP earned</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
