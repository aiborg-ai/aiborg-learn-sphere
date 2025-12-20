/**
 * LingoLessonComplete Page
 * Celebration page shown after completing a lesson
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { Trophy, Star, Zap, Clock, Target, ArrowRight, Home, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { XPEarnedAnimation } from '@/components/lingo/game/XPDisplay';
import { StreakBadge } from '@/components/lingo/game/StreakBadge';
import { useLingo, useLingoLesson } from '@/hooks/useLingo';
import { useAuth } from '@/hooks/useAuth';
import type { LessonStats } from '@/types/lingo.types';

export default function LingoLessonComplete() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { xpInfo, lessons } = useLingo();
  const { lesson } = useLingoLesson(lessonId || '');

  const [showXPAnimation, setShowXPAnimation] = useState(true);
  const [animateStats, setAnimateStats] = useState(false);

  // Get stats from navigation state
  const stats = (location.state as { stats?: LessonStats })?.stats;

  useEffect(() => {
    // Animate stats after XP animation
    const timer = setTimeout(() => {
      setAnimateStats(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!stats) {
    // Redirect if no stats available
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold">No lesson data</h2>
            <p className="text-muted-foreground">Please complete a lesson to see your results.</p>
            <Button onClick={() => navigate('/lingo')}>Go to Lingo</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find next lesson
  const currentLessonIndex = lessons.findIndex(l => l.lesson_id === lessonId);
  const nextLesson = currentLessonIndex >= 0 ? lessons[currentLessonIndex + 1] : null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* XP Animation */}
      {showXPAnimation && (
        <XPEarnedAnimation amount={stats.xp_earned} onComplete={() => setShowXPAnimation(false)} />
      )}

      <main className="flex-1 container px-4 py-8 max-w-lg mx-auto flex flex-col items-center justify-center">
        {/* Success Icon */}
        <div
          className={`mb-6 transition-all duration-500 ${
            animateStats ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        >
          {stats.perfect ? (
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-yellow-500/50">
                <Trophy className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Star className="h-8 w-8 text-yellow-400 fill-yellow-400 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-green-500/50">
              <Target className="h-12 w-12 text-white" />
            </div>
          )}
        </div>

        {/* Title */}
        <div
          className={`text-center mb-8 transition-all duration-500 delay-100 ${
            animateStats ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <h1 className="text-3xl font-bold mb-2">
            {stats.perfect ? 'Perfect!' : 'Lesson Complete!'}
          </h1>
          <p className="text-muted-foreground">
            {lesson?.title || 'Great work on completing this lesson'}
          </p>
        </div>

        {/* Stats Cards */}
        <div
          className={`w-full grid grid-cols-2 gap-4 mb-8 transition-all duration-500 delay-200 ${
            animateStats ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {/* XP Earned */}
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-500">+{stats.xp_earned}</p>
              <p className="text-xs text-muted-foreground">XP Earned</p>
            </CardContent>
          </Card>

          {/* Accuracy */}
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-500">{stats.accuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-green-500 font-bold">{stats.questions_correct}</span>
                <span className="text-muted-foreground">/</span>
                <span>{stats.questions_total}</span>
              </div>
              <p className="text-xs text-muted-foreground">Questions</p>
            </CardContent>
          </Card>

          {/* Time */}
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-lg font-bold">{formatTime(stats.time_spent_seconds)}</p>
              <p className="text-xs text-muted-foreground">Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Progress */}
        <div
          className={`w-full mb-8 transition-all duration-500 delay-300 ${
            animateStats ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Daily Goal Progress</span>
                <StreakBadge streak={xpInfo.streak} size="sm" />
              </div>
              <Progress
                value={Math.min(100, (xpInfo.today / xpInfo.dailyGoal) * 100)}
                className="h-2 mb-2"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{xpInfo.today} XP today</span>
                <span>{xpInfo.dailyGoal} XP goal</span>
              </div>
              {xpInfo.today >= xpInfo.dailyGoal && (
                <p className="text-sm text-green-500 mt-2 text-center">🎉 Daily goal complete!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sign-in Prompt for Anonymous */}
        {!user && (
          <div
            className={`w-full mb-8 transition-all duration-500 delay-400 ${
              animateStats ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="font-medium mb-2">Save your progress!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in to save your XP, compete on leaderboards, and track achievements.
                </p>
                <Button asChild size="sm">
                  <Link to="/auth">Create Free Account</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className={`w-full space-y-3 transition-all duration-500 delay-500 ${
            animateStats ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {nextLesson ? (
            <Button
              onClick={() => navigate(`/lingo/lesson/${nextLesson.lesson_id}`)}
              className="w-full"
              size="lg"
            >
              Next Lesson
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => navigate('/lingo')} className="w-full" size="lg">
              Back to Lessons
              <Home className="ml-2 h-4 w-4" />
            </Button>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/lingo')} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Share functionality
                if (navigator.share) {
                  navigator.share({
                    title: 'AIBORGLingo',
                    text: `I just completed "${lesson?.title}" with ${stats.accuracy}% accuracy on AIBORGLingo!`,
                    url: window.location.origin + '/lingo',
                  });
                }
              }}
              className="flex-1"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
