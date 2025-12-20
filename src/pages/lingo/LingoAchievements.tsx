/**
 * LingoAchievements Page
 * Shows badges and achievements for Lingo
 */

import { Link } from 'react-router-dom';
import { Award, Lock, ArrowLeft, CheckCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { LingoHeader } from '@/components/lingo/layout/LingoHeader';
import { useLingo } from '@/hooks/useLingo';
import { useAuth } from '@/hooks/useAuth';

// Achievement definitions
const LINGO_ACHIEVEMENTS = [
  // Lesson Completion
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    category: 'Lessons',
    tier: 'bronze',
    requirement: { type: 'lessons_completed', value: 1 },
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Complete 5 lessons',
    icon: '📚',
    category: 'Lessons',
    tier: 'bronze',
    requirement: { type: 'lessons_completed', value: 5 },
  },
  {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Complete 10 lessons',
    icon: '🎓',
    category: 'Lessons',
    tier: 'silver',
    requirement: { type: 'lessons_completed', value: 10 },
  },
  {
    id: 'ai_scholar',
    name: 'AI Scholar',
    description: 'Complete 20 lessons',
    icon: '🏆',
    category: 'Lessons',
    tier: 'gold',
    requirement: { type: 'lessons_completed', value: 20 },
  },
  // Streaks
  {
    id: 'on_fire',
    name: 'On Fire',
    description: 'Achieve a 3-day streak',
    icon: '🔥',
    category: 'Streaks',
    tier: 'bronze',
    requirement: { type: 'streak', value: 3 },
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Achieve a 7-day streak',
    icon: '⚡',
    category: 'Streaks',
    tier: 'silver',
    requirement: { type: 'streak', value: 7 },
  },
  {
    id: 'two_week_champion',
    name: 'Two Week Champion',
    description: 'Achieve a 14-day streak',
    icon: '💪',
    category: 'Streaks',
    tier: 'gold',
    requirement: { type: 'streak', value: 14 },
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Achieve a 30-day streak',
    icon: '👑',
    category: 'Streaks',
    tier: 'platinum',
    requirement: { type: 'streak', value: 30 },
  },
  // XP Milestones
  {
    id: 'xp_hunter',
    name: 'XP Hunter',
    description: 'Earn 500 total XP',
    icon: '⭐',
    category: 'XP',
    tier: 'bronze',
    requirement: { type: 'total_xp', value: 500 },
  },
  {
    id: 'xp_champion',
    name: 'XP Champion',
    description: 'Earn 2,000 total XP',
    icon: '🌟',
    category: 'XP',
    tier: 'silver',
    requirement: { type: 'total_xp', value: 2000 },
  },
  {
    id: 'xp_legend',
    name: 'XP Legend',
    description: 'Earn 5,000 total XP',
    icon: '✨',
    category: 'XP',
    tier: 'gold',
    requirement: { type: 'total_xp', value: 5000 },
  },
  // Accuracy
  {
    id: 'perfect_lesson',
    name: 'Perfect Lesson',
    description: 'Complete a lesson with 100% accuracy',
    icon: '💯',
    category: 'Accuracy',
    tier: 'silver',
    requirement: { type: 'perfect_lessons', value: 1 },
  },
  {
    id: 'perfection_streak',
    name: 'Perfection Streak',
    description: 'Complete 5 perfect lessons',
    icon: '🎯',
    category: 'Accuracy',
    tier: 'gold',
    requirement: { type: 'perfect_lessons', value: 5 },
  },
];

const TIER_COLORS = {
  bronze: 'from-amber-600 to-amber-700 text-amber-100',
  silver: 'from-gray-400 to-gray-500 text-gray-100',
  gold: 'from-yellow-400 to-yellow-500 text-yellow-900',
  platinum: 'from-purple-400 to-purple-500 text-purple-100',
};

const TIER_BORDERS = {
  bronze: 'border-amber-600/50',
  silver: 'border-gray-400/50',
  gold: 'border-yellow-400/50',
  platinum: 'border-purple-400/50',
};

export default function LingoAchievements() {
  const { user } = useAuth();
  const { xpInfo, completedLessonsCount, userProgress } = useLingo();

  // Calculate achievement progress
  const getAchievementProgress = (achievement: (typeof LINGO_ACHIEVEMENTS)[0]) => {
    const { type, value } = achievement.requirement;
    let current = 0;

    switch (type) {
      case 'lessons_completed':
        current = completedLessonsCount;
        break;
      case 'streak':
        current = xpInfo.streak;
        break;
      case 'total_xp':
        current = xpInfo.total;
        break;
      case 'perfect_lessons':
        // Count perfect lessons from progress
        current = Object.values(userProgress?.lesson_progress || {}).filter(p => p.perfect).length;
        break;
    }

    return {
      current,
      required: value,
      progress: Math.min(100, (current / value) * 100),
      isComplete: current >= value,
    };
  };

  // Group achievements by category
  const achievementsByCategory = LINGO_ACHIEVEMENTS.reduce(
    (acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    },
    {} as Record<string, typeof LINGO_ACHIEVEMENTS>
  );

  // Count unlocked
  const unlockedCount = LINGO_ACHIEVEMENTS.filter(a => getAchievementProgress(a).isComplete).length;

  return (
    <div className="min-h-screen bg-background">
      <LingoHeader
        hearts={xpInfo.hearts}
        streak={xpInfo.streak}
        xp={xpInfo.total}
        xpToday={xpInfo.today}
        dailyGoal={xpInfo.dailyGoal}
        showBackButton
        backTo="/lingo"
        title="Achievements"
      />

      <main className="container px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold">Achievements</h1>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} of {LINGO_ACHIEVEMENTS.length} unlocked
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/lingo" aria-label="Back to Lingo">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((unlockedCount / LINGO_ACHIEVEMENTS.length) * 100)}%
              </span>
            </div>
            <Progress value={(unlockedCount / LINGO_ACHIEVEMENTS.length) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Sign-in prompt for anonymous */}
        {!user && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Sign in to save your achievements permanently!</span>
              <Button size="sm" variant="outline" asChild className="ml-4">
                <Link to="/auth">Sign In</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Achievement Categories */}
        {Object.entries(achievementsByCategory).map(([category, achievements]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid gap-3">
                {achievements.map(achievement => {
                  const { current, required, progress, isComplete } =
                    getAchievementProgress(achievement);
                  const tier = achievement.tier as keyof typeof TIER_COLORS;

                  return (
                    <div
                      key={achievement.id}
                      className={cn(
                        'flex items-center gap-4 p-3 rounded-lg border transition-all',
                        isComplete ? TIER_BORDERS[tier] : 'border-muted bg-muted/30 opacity-70'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex items-center justify-center w-12 h-12 rounded-full',
                          isComplete ? `bg-gradient-to-br ${TIER_COLORS[tier]}` : 'bg-muted'
                        )}
                      >
                        {isComplete ? (
                          <span className="text-2xl">{achievement.icon}</span>
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{achievement.name}</p>
                          {isComplete && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {!isComplete && (
                          <div className="mt-2">
                            <Progress value={progress} className="h-1.5" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {current} / {required}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Tier Badge */}
                      <div
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium capitalize',
                          isComplete
                            ? `bg-gradient-to-r ${TIER_COLORS[tier]}`
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {tier}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Complete lessons and maintain streaks to unlock achievements!
        </p>
      </main>
    </div>
  );
}
