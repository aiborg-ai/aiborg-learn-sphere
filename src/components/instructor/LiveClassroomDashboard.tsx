import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonitorPlay, Users, MessageCircle, TrendingUp, Circle } from 'lucide-react';
import { ActiveStudentsBar } from '@/components/classroom/ActiveStudentsBar';
import { QuestionQueue } from '@/components/instructor/QuestionQueue';
import { CohortProgressMap } from '@/components/instructor/CohortProgressMap';
import { useClassroomPresence } from '@/hooks/useClassroomPresence';
import { useClassroomQuestions } from '@/hooks/useClassroomQuestions';

interface LiveClassroomDashboardProps {
  courseId: number;
  courseName: string;
  lessonId?: string;
  lessonTitle?: string;
}

/**
 * Main instructor dashboard for live classroom management
 *
 * Features:
 * - Real-time student presence
 * - Live Q&A queue
 * - Cohort progress visualization
 * - Session controls
 * - Multi-tab layout for different views
 */
export function LiveClassroomDashboard({
  courseId,
  courseName,
  lessonId,
  lessonTitle,
}: LiveClassroomDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'progress'>('overview');

  const { currentSession, activeCount, isJoined, joinSession, leaveSession } = useClassroomPresence(
    {
      courseId,
      lessonId,
      autoJoin: false,
    }
  );

  const { unresolvedCount } = useClassroomQuestions({
    sessionId: currentSession?.id || null,
    autoSubscribe: true,
  });

  const handleStartSession = async () => {
    await joinSession();
  };

  const handleEndSession = async () => {
    if (window.confirm('Are you sure you want to end this classroom session?')) {
      await leaveSession();
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <MonitorPlay className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Live Classroom</h1>
                {isJoined && (
                  <Badge className="bg-green-500 text-white">
                    <Circle className="h-2 w-2 mr-1 fill-current animate-pulse" />
                    Live
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-semibold opacity-90">{courseName}</h2>
              {lessonTitle && <p className="text-white/80 mt-1">Lesson: {lessonTitle}</p>}

              {currentSession && (
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{activeCount} students online</span>
                  </div>
                  {unresolvedCount > 0 && (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>{unresolvedCount} questions pending</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Session Controls */}
            <div className="flex flex-col gap-2">
              {!isJoined ? (
                <Button
                  onClick={handleStartSession}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Start Session
                </Button>
              ) : (
                <Button
                  onClick={handleEndSession}
                  size="lg"
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600"
                >
                  End Session
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!isJoined ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MonitorPlay className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Active Session</h3>
            <p className="text-muted-foreground mb-6">
              Start a classroom session to see real-time student activity, answer questions, and
              monitor progress.
            </p>
            <Button onClick={handleStartSession} size="lg">
              Start Classroom Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                      Active Students
                    </p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {activeCount}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">
                      Pending Questions
                    </p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                      {unresolvedCount}
                    </p>
                  </div>
                  <MessageCircle className="h-10 w-10 text-orange-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                      Session Status
                    </p>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      Active & Live
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-purple-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="gap-2">
                <Users className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="questions" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Q&A Queue
                {unresolvedCount > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-orange-500 text-white">
                    {unresolvedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Active Students */}
                <div className="h-[500px]">
                  <ActiveStudentsBar courseId={courseId} lessonId={lessonId} />
                </div>

                {/* Recent Questions Preview */}
                <div className="h-[500px]">
                  <QuestionQueue sessionId={currentSession?.id || null} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="mt-4">
              <div className="h-[600px]">
                <QuestionQueue sessionId={currentSession?.id || null} />
              </div>
            </TabsContent>

            <TabsContent value="progress" className="mt-4">
              <div className="h-[600px]">
                <CohortProgressMap sessionId={currentSession?.id || null} courseId={courseId} />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
