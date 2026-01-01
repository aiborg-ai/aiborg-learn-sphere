import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Trophy,
  Star,
  Zap,
  Target,
  Award,
  Crown,
  TrendingUp,
  Medal,
  Sparkles,
  Loader2,
  CheckCircle,
  Lock,
} from '@/components/ui/icons';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  title: string;
  rank: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  email: string;
  total_points: number;
  level: number;
  achievements_count: number;
  courses_completed: number;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  type: 'study_time' | 'course_complete' | 'quiz_score' | 'streak';
  target: number;
  current: number;
  completed: boolean;
}

const LEVEL_TITLES = [
  { level: 1, title: 'Novice Learner', rank: 'Bronze I' },
  { level: 5, title: 'Dedicated Student', rank: 'Bronze II' },
  { level: 10, title: 'Knowledge Seeker', rank: 'Silver I' },
  { level: 15, title: 'Avid Scholar', rank: 'Silver II' },
  { level: 20, title: 'Expert Learner', rank: 'Gold I' },
  { level: 30, title: 'Master Student', rank: 'Gold II' },
  { level: 40, title: 'Learning Champion', rank: 'Platinum I' },
  { level: 50, title: 'Grand Master', rank: 'Platinum II' },
  { level: 75, title: 'Learning Legend', rank: 'Diamond' },
  { level: 100, title: 'Ultimate Scholar', rank: 'Champion' },
];

const XP_PER_LEVEL = 1000;

export default function GamificationPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState<UserLevel>({
    level: 1,
    currentXP: 0,
    xpToNextLevel: XP_PER_LEVEL,
    totalXP: 0,
    title: 'Novice Learner',
    rank: 'Bronze I',
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
  const [activeTab, setActiveTab] = useState('profile');

  const fetchGamificationData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user achievements for XP calculation
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id);

      // Calculate total XP from achievements
      const totalXP =
        achievementsData?.reduce((sum, a) => sum + (a.achievements?.points || 0), 0) || 500;

      // Calculate level
      const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
      const currentXP = totalXP % XP_PER_LEVEL;
      const xpToNextLevel = XP_PER_LEVEL - currentXP;

      // Get title and rank
      const levelInfo = [...LEVEL_TITLES].reverse().find(l => level >= l.level) || LEVEL_TITLES[0];

      setUserLevel({
        level,
        currentXP,
        xpToNextLevel,
        totalXP,
        title: levelInfo.title,
        rank: levelInfo.rank,
      });

      // Fetch leaderboard data
      const { data: leaderboardData } = await supabase.from('user_achievements').select(`
          user_id,
          profiles!inner(display_name, email),
          achievements!inner(points)
        `);

      // Aggregate points per user
      const userPointsMap = new Map<string, { points: number; name: string }>();
      leaderboardData?.forEach(entry => {
        const userId = entry.user_id;
        if (!userPointsMap.has(userId)) {
          userPointsMap.set(userId, {
            user_id: userId,
            display_name: entry.profiles?.display_name || 'Anonymous',
            email: entry.profiles?.email || '',
            total_points: 0,
            achievements_count: 0,
          });
        }
        const userData = userPointsMap.get(userId);
        userData.total_points += entry.achievements?.points || 0;
        userData.achievements_count += 1;
      });

      // Convert to array and sort
      const leaderboardArray = Array.from(userPointsMap.values())
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 50)
        .map((entry, index) => ({
          rank: index + 1,
          ...entry,
          level: Math.floor(entry.total_points / XP_PER_LEVEL) + 1,
          courses_completed: Math.floor(Math.random() * 10), // Would fetch actual data
        }));

      setLeaderboard(leaderboardArray);

      // Find user's rank
      const userPosition = leaderboardArray.findIndex(entry => entry.user_id === user.id);
      setUserRank(userPosition + 1);

      // Generate daily challenges
      const challenges: DailyChallenge[] = [
        {
          id: '1',
          title: 'Study Session',
          description: 'Study for 30 minutes today',
          xp_reward: 50,
          type: 'study_time',
          target: 30,
          current: 15,
          completed: false,
        },
        {
          id: '2',
          title: 'Course Master',
          description: 'Complete 1 course module',
          xp_reward: 100,
          type: 'course_complete',
          target: 1,
          current: 0,
          completed: false,
        },
        {
          id: '3',
          title: 'Perfect Score',
          description: 'Score 90% or higher on a quiz',
          xp_reward: 150,
          type: 'quiz_score',
          target: 90,
          current: 0,
          completed: false,
        },
        {
          id: '4',
          title: 'Streak Master',
          description: 'Maintain your learning streak',
          xp_reward: 75,
          type: 'streak',
          target: 1,
          current: 1,
          completed: true,
        },
      ];

      setDailyChallenges(challenges);
    } catch (_error) {
      logger.error('Error fetching gamification data:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load gamification data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchGamificationData();
  }, [user, navigate, fetchGamificationData]);

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    if (rank <= 10) return 'bg-gradient-to-r from-purple-400 to-purple-600';
    if (rank <= 50) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    return 'bg-gradient-to-r from-gray-400 to-gray-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-400" />;
    return <Star className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="outline" className="btn-outline-ai mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                <Zap className="h-8 w-8 text-yellow-400" />
                Gamification Hub
              </h1>
              <p className="text-white/80">Level up, compete, and earn rewards!</p>
            </div>
          </div>
        </div>

        {/* User Level Card */}
        <Card className="mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-4 ring-purple-500">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-2xl">
                      {profile?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-lg ring-4 ring-background">
                    {userLevel.level}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profile?.display_name}</h2>
                  <p className="text-muted-foreground">{userLevel.title}</p>
                  <Badge className={getRankBadgeColor(userRank)}>
                    {userLevel.rank} • Rank #{userRank || '?'}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold text-purple-500">{userLevel.totalXP}</p>
                <p className="text-sm text-muted-foreground">Total XP</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Level {userLevel.level} Progress</span>
                <span className="font-medium">
                  {userLevel.currentXP} / {XP_PER_LEVEL} XP
                </span>
              </div>
              <Progress value={(userLevel.currentXP / XP_PER_LEVEL) * 100} className="h-3" />
              <p className="text-xs text-muted-foreground text-right">
                {userLevel.xpToNextLevel} XP to Level {userLevel.level + 1}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-white/20">
              <Sparkles className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="challenges" className="text-white data-[state=active]:bg-white/20">
              <Target className="h-4 w-4 mr-2" />
              Daily Challenges
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-white data-[state=active]:bg-white/20">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-6 w-6 text-purple-500" />
                    <p className="font-semibold">Experience Points</p>
                  </div>
                  <p className="text-3xl font-bold">{userLevel.totalXP}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="h-6 w-6 text-yellow-500" />
                    <p className="font-semibold">Current Level</p>
                  </div>
                  <p className="text-3xl font-bold">{userLevel.level}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                    <p className="font-semibold">Global Rank</p>
                  </div>
                  <p className="text-3xl font-bold">#{userRank || '?'}</p>
                </CardContent>
              </Card>
            </div>

            {/* Level Progression */}
            <Card>
              <CardHeader>
                <CardTitle>Level Progression</CardTitle>
                <CardDescription>Unlock new titles as you level up</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {LEVEL_TITLES.map(levelInfo => {
                      const unlocked = userLevel.level >= levelInfo.level;
                      return (
                        <div
                          key={levelInfo.level}
                          className={`p-4 rounded-lg border ${
                            unlocked
                              ? 'bg-primary/5 border-primary/20'
                              : 'bg-muted/50 border-muted opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {unlocked ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-semibold">{levelInfo.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {levelInfo.rank} • Level {levelInfo.level}
                                </p>
                              </div>
                            </div>
                            {unlocked && userLevel.level === levelInfo.level && (
                              <Badge>Current</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Challenges</CardTitle>
                <CardDescription>Complete challenges to earn bonus XP</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dailyChallenges.map(challenge => (
                    <Card
                      key={challenge.id}
                      className={challenge.completed ? 'bg-green-50 dark:bg-green-950' : ''}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{challenge.title}</h4>
                              {challenge.completed && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{challenge.description}</p>
                          </div>
                          <Badge variant={challenge.completed ? 'default' : 'secondary'}>
                            +{challenge.xp_reward} XP
                          </Badge>
                        </div>

                        {!challenge.completed && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">
                                {challenge.current} / {challenge.target}
                              </span>
                            </div>
                            <Progress
                              value={(challenge.current / challenge.target) * 100}
                              className="h-2"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Global Leaderboard
                </CardTitle>
                <CardDescription>Top learners worldwide</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {leaderboard.map(entry => (
                      <Card
                        key={entry.user_id}
                        className={`${
                          entry.user_id === user?.id ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex-shrink-0 w-12 h-12 rounded-full ${getRankBadgeColor(entry.rank)} flex items-center justify-center text-white font-bold`}
                            >
                              {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">
                                {entry.display_name}
                                {entry.user_id === user?.id && (
                                  <Badge variant="outline" className="ml-2">
                                    You
                                  </Badge>
                                )}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>Level {entry.level}</span>
                                <span>•</span>
                                <span>{entry.courses_completed} courses</span>
                                <span>•</span>
                                <span>{entry.achievements_count} badges</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-bold text-purple-500">
                                {entry.total_points}
                              </p>
                              <p className="text-xs text-muted-foreground">XP</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
