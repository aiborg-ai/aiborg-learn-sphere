/**
 * LingoHome Page
 * Main Lingo dashboard with lesson grid, user stats, daily goal
 */

import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Award, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LingoHeader } from '@/components/lingo/layout/LingoHeader';
import { SkillSection } from '@/components/lingo/layout/SkillSection';
import { DailyGoalTracker } from '@/components/lingo/game/DailyGoalTracker';
import { useLingo } from '@/hooks/useLingo';
import { useAuth } from '@/hooks/useAuth';
import type { LingoLesson, LingoSkillCategory } from '@/types/lingo.types';

export default function LingoHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lessons, xpInfo, completedLessonsCount, isLoading, error, getLessonProgress } =
    useLingo();

  // Group lessons by skill
  const lessonsBySkill = useMemo(() => {
    const skillOrder: LingoSkillCategory[] = [
      'Foundations',
      'LLMs',
      'Vision',
      'NLP',
      'Safety',
      'Advanced',
    ];

    const grouped: Record<string, LingoLesson[]> = {};

    skillOrder.forEach(skill => {
      const skillLessons = lessons.filter(l => l.skill === skill);
      if (skillLessons.length > 0) {
        grouped[skill] = skillLessons.sort((a, b) => a.sort_order - b.sort_order);
      }
    });

    return grouped;
  }, [lessons]);

  // Create progress map
  const progressMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof getLessonProgress>> = {};
    lessons.forEach(lesson => {
      map[lesson.id] = getLessonProgress(lesson.id);
    });
    return map;
  }, [lessons, getLessonProgress]);

  const handleLessonClick = (lessonId: string) => {
    navigate(`/lingo/lesson/${lessonId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading lessons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>Failed to load lessons. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LingoHeader
        hearts={xpInfo.hearts}
        streak={xpInfo.streak}
        xp={xpInfo.total}
        xpToday={xpInfo.today}
        dailyGoal={xpInfo.dailyGoal}
      />

      <main className="container px-4 py-6 space-y-8">
        {/* Welcome Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {user
                  ? `Welcome back, ${user.user_metadata?.full_name?.split(' ')[0] || 'Learner'}!`
                  : 'Welcome to AIBORGLingo!'}
              </h1>
              <p className="text-muted-foreground">
                {completedLessonsCount > 0
                  ? `You've completed ${completedLessonsCount} lesson${completedLessonsCount !== 1 ? 's' : ''}. Keep going!`
                  : 'Start your AI learning journey today.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/lingo/leaderboard">
                  <Trophy className="h-4 w-4 mr-2" />
                  Leaderboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/lingo/achievements">
                  <Award className="h-4 w-4 mr-2" />
                  Achievements
                </Link>
              </Button>
              {!user && (
                <Button size="sm" asChild>
                  <Link to="/auth">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Daily Goal Card (visible on mobile) */}
          <Card className="md:hidden">
            <CardContent className="py-4">
              <DailyGoalTracker current={xpInfo.today} goal={xpInfo.dailyGoal} size="lg" />
            </CardContent>
          </Card>

          {/* Sign in prompt for anonymous users */}
          {!user && completedLessonsCount >= 2 && (
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Sign in to save your progress and compete on the leaderboard!</span>
                <Button size="sm" variant="outline" asChild className="ml-4">
                  <Link to="/auth">Sign In</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{xpInfo.total}</p>
              <p className="text-sm text-muted-foreground">Total XP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{xpInfo.streak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{completedLessonsCount}</p>
              <p className="text-sm text-muted-foreground">Lessons Done</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{xpInfo.hearts}</p>
              <p className="text-sm text-muted-foreground">Hearts</p>
            </CardContent>
          </Card>
        </section>

        {/* Lessons by Skill */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold">Lessons</h2>
          {Object.entries(lessonsBySkill).map(([skill, skillLessons]) => (
            <SkillSection
              key={skill}
              skill={skill}
              lessons={skillLessons}
              progressMap={progressMap}
              onLessonClick={handleLessonClick}
            />
          ))}

          {Object.keys(lessonsBySkill).length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No lessons available yet. Check back soon!</p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
