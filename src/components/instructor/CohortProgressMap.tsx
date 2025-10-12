import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Clock, CheckCircle2, AlertCircle, Users, BarChart3 } from 'lucide-react';
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress';
import { formatDistanceToNow } from 'date-fns';

interface CohortProgressMapProps {
  sessionId: string | null;
  courseId: number | null;
}

/**
 * Real-time cohort progress visualization for instructors
 *
 * Features:
 * - Live progress bars for all students
 * - Sort by progress, activity, or alphabetical
 * - Identify struggling students
 * - Show engagement metrics
 * - Recent activity feed
 */
export function CohortProgressMap({ sessionId, courseId }: CohortProgressMapProps) {
  const { studentProgress, recentEvents, stats, studentsNeedingHelp, loading } =
    useRealtimeProgress({
      sessionId,
      courseId,
      autoSubscribe: true,
    });

  // Sort options
  const sortedByProgress = useMemo(
    () => [...studentProgress].sort((a, b) => b.progress_percentage - a.progress_percentage),
    [studentProgress]
  );

  const sortedByActivity = useMemo(
    () =>
      [...studentProgress].sort(
        (a, b) => new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime()
      ),
    [studentProgress]
  );

  const sortedByName = useMemo(
    () =>
      [...studentProgress].sort((a, b) => {
        const nameA = a.user_profile?.display_name || '';
        const nameB = b.user_profile?.display_name || '';
        return nameA.localeCompare(nameB);
      }),
    [studentProgress]
  );

  if (!courseId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No course selected</p>
        </CardContent>
      </Card>
    );
  }

  const StudentRow = ({ student }: { student: (typeof studentProgress)[0] }) => {
    const profile = student.user_profile;
    const displayName = profile?.display_name || profile?.email || 'Student';
    const initials = displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const needsHelp = studentsNeedingHelp.some(s => s.user_id === student.user_id);
    const isCompleted = student.progress_percentage === 100;
    const isInactive =
      new Date().getTime() - new Date(student.last_accessed).getTime() > 24 * 60 * 60 * 1000;

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{displayName}</span>
            {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
            {needsHelp && <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />}
            {isInactive && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <Progress value={student.progress_percentage} className="h-2" />
            </div>
            <span className="text-sm font-medium min-w-[3rem] text-right">
              {Math.round(student.progress_percentage)}%
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Math.floor(student.time_spent_minutes / 60)}h {student.time_spent_minutes % 60}m
            </div>
            <div>
              Last active{' '}
              {formatDistanceToNow(new Date(student.last_accessed), { addSuffix: true })}
            </div>
            {student.current_position && (
              <div className="truncate">At: {student.current_position}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Cohort Progress
        </CardTitle>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                Total Students
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-900 dark:text-green-100">
                Completed
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.completedCount}</p>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-900 dark:text-yellow-100">
                In Progress
              </span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgressCount}</p>
          </div>

          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-900 dark:text-orange-100">
                Need Help
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{studentsNeedingHelp.length}</p>
          </div>
        </div>

        {/* Average Progress Bar */}
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Average Progress
            </span>
            <span className="text-lg font-bold text-purple-600">{stats.averageProgress}%</span>
          </div>
          <Progress value={stats.averageProgress} className="h-3" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        <Tabs defaultValue="progress" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">By Progress</TabsTrigger>
            <TabsTrigger value="activity">By Activity</TabsTrigger>
            <TabsTrigger value="name">Alphabetical</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full -mx-4 px-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : sortedByProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No student progress data yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedByProgress.map(student => (
                    <StudentRow key={student.user_id} student={student} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full -mx-4 px-4">
              <div className="space-y-2">
                {sortedByActivity.map(student => (
                  <StudentRow key={student.user_id} student={student} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="name" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full -mx-4 px-4">
              <div className="space-y-2">
                {sortedByName.map(student => (
                  <StudentRow key={student.user_id} student={student} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Recent Activity</h4>
            <div className="space-y-2">
              {recentEvents.slice(0, 5).map(event => {
                const profile = event.user_profile;
                const displayName = profile?.display_name || 'Student';

                let icon = <TrendingUp className="h-4 w-4" />;
                let color = 'text-blue-600';
                let message = '';

                switch (event.event_type) {
                  case 'milestone_reached':
                    icon = <TrendingUp className="h-4 w-4" />;
                    color = 'text-blue-600';
                    message = `reached ${(event.event_data as { milestone?: string }).milestone}`;
                    break;
                  case 'lesson_completed':
                    icon = <CheckCircle2 className="h-4 w-4" />;
                    color = 'text-green-600';
                    message = 'completed the lesson';
                    break;
                  case 'help_needed':
                    icon = <AlertCircle className="h-4 w-4" />;
                    color = 'text-orange-600';
                    message = 'needs help';
                    break;
                  default:
                    message = event.event_type;
                }

                return (
                  <div key={event.id} className="flex items-center gap-2 text-sm">
                    <div className={color}>{icon}</div>
                    <span className="font-medium">{displayName}</span>
                    <span className="text-muted-foreground">{message}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
