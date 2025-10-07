import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Trophy,
  Star,
  Award,
  Target,
  Sparkles,
  Lock,
  Loader2,
  Medal,
  Crown,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

interface Achievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  is_featured: boolean;
  achievements: {
    name: string;
    description: string;
    icon_emoji: string;
    icon_url?: string;
    category: string;
    rarity: string;
    points: number;
  };
}

interface AvailableAchievement {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  icon_url?: string;
  category: string;
  rarity: string;
  points: number;
  criteria: Record<string, unknown>;
}

const rarityConfig = {
  common: {
    color: 'bg-gray-500',
    icon: Star,
    label: 'Common',
    gradient: 'from-gray-400 to-gray-600',
  },
  rare: {
    color: 'bg-blue-500',
    icon: Sparkles,
    label: 'Rare',
    gradient: 'from-blue-400 to-blue-600',
  },
  epic: {
    color: 'bg-purple-500',
    icon: Crown,
    label: 'Epic',
    gradient: 'from-purple-400 to-purple-600',
  },
  legendary: {
    color: 'bg-yellow-500',
    icon: Zap,
    label: 'Legendary',
    gradient: 'from-yellow-400 to-orange-500',
  },
};

const categoryConfig = {
  course_completion: { label: 'Course Completion', icon: Trophy, color: 'text-blue-500' },
  skill_mastery: { label: 'Skill Mastery', icon: Target, color: 'text-purple-500' },
  engagement: { label: 'Engagement', icon: TrendingUp, color: 'text-green-500' },
  milestone: { label: 'Milestone', icon: Medal, color: 'text-orange-500' },
  special: { label: 'Special', icon: Award, color: 'text-pink-500' },
};

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [earnedAchievements, setEarnedAchievements] = useState<Achievement[]>([]);
  const [availableAchievements, setAvailableAchievements] = useState<AvailableAchievement[]>([]);
  const [activeTab, setActiveTab] = useState('earned');
  const [totalPoints, setTotalPoints] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAchievements();
  }, [user, navigate]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch earned achievements
      const { data: earnedData, error: earnedError } = await supabase
        .from('user_achievements')
        .select(
          `
          *,
          achievements!inner(*)
        `
        )
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (earnedError) throw earnedError;

      setEarnedAchievements(earnedData || []);

      // Calculate stats
      const points = earnedData?.reduce((sum, a) => sum + (a.achievements?.points || 0), 0) || 0;
      setTotalPoints(points);

      const rarityStats = {
        total: earnedData?.length || 0,
        common: earnedData?.filter(a => a.achievements?.rarity === 'common').length || 0,
        rare: earnedData?.filter(a => a.achievements?.rarity === 'rare').length || 0,
        epic: earnedData?.filter(a => a.achievements?.rarity === 'epic').length || 0,
        legendary: earnedData?.filter(a => a.achievements?.rarity === 'legendary').length || 0,
      };
      setStats(rarityStats);

      // Fetch all available achievements
      const { data: availableData, error: availableError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: false });

      if (availableError) throw availableError;

      // Filter out already earned
      const earnedIds = new Set(earnedData?.map(a => a.achievement_id) || []);
      const notEarned = availableData?.filter(a => !earnedIds.has(a.id)) || [];
      setAvailableAchievements(notEarned);
    } catch (error) {
      logger.error('Error fetching achievements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load achievements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureAchievement = async (achievementId: string, currentFeatured: boolean) => {
    try {
      // First, unfeature all others if we're featuring this one
      if (!currentFeatured) {
        await supabase
          .from('user_achievements')
          .update({ is_featured: false })
          .eq('user_id', user?.id);
      }

      const { error } = await supabase
        .from('user_achievements')
        .update({ is_featured: !currentFeatured })
        .eq('id', achievementId);

      if (error) throw error;

      setEarnedAchievements(prev =>
        prev.map(a =>
          a.id === achievementId
            ? { ...a, is_featured: !currentFeatured }
            : { ...a, is_featured: false }
        )
      );

      toast({
        title: currentFeatured ? 'Unfeatured' : 'Featured!',
        description: currentFeatured
          ? 'Achievement removed from featured display'
          : 'This achievement will be shown on your profile',
      });
    } catch (error) {
      logger.error('Error featuring achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update achievement',
        variant: 'destructive',
      });
    }
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
                <Trophy className="h-8 w-8 text-yellow-400" />
                Achievements & Badges
              </h1>
              <p className="text-white/80">
                Track your learning milestones and showcase your accomplishments
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Total Points</p>
              <p className="text-3xl font-bold text-white">{totalPoints}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Trophy className="h-8 w-8 text-white/40" />
              </div>
            </CardContent>
          </Card>

          {(['common', 'rare', 'epic', 'legendary'] as const).map(rarity => {
            const config = rarityConfig[rarity];
            const Icon = config.icon;
            return (
              <Card key={rarity} className={`bg-gradient-to-br ${config.gradient} border-0`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm">{config.label}</p>
                      <p className="text-2xl font-bold text-white">{stats[rarity]}</p>
                    </div>
                    <Icon className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="earned" className="text-white data-[state=active]:bg-white/20">
              <Trophy className="h-4 w-4 mr-2" />
              Earned ({earnedAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="text-white data-[state=active]:bg-white/20">
              <Lock className="h-4 w-4 mr-2" />
              Locked ({availableAchievements.length})
            </TabsTrigger>
          </TabsList>

          {/* Earned Achievements */}
          <TabsContent value="earned">
            {earnedAchievements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No achievements yet</p>
                  <p className="text-muted-foreground">
                    Start learning and complete courses to earn your first achievement!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {earnedAchievements.map(achievement => {
                  const rarity = achievement.achievements?.rarity || 'common';
                  const category = achievement.achievements?.category || 'special';
                  const rarityInfo = rarityConfig[rarity as keyof typeof rarityConfig];
                  const categoryInfo = categoryConfig[category as keyof typeof categoryConfig];
                  const CategoryIcon = categoryInfo?.icon || Award;

                  return (
                    <Card
                      key={achievement.id}
                      className={`relative overflow-hidden transition-all hover:shadow-lg ${
                        achievement.is_featured ? 'ring-2 ring-yellow-400' : ''
                      }`}
                    >
                      {/* Rarity gradient background */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${rarityInfo.gradient} opacity-10`}
                      />

                      <CardHeader className="relative">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-4xl">
                              {achievement.achievements?.icon_emoji || '🏆'}
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {achievement.achievements?.name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {achievement.achievements?.description}
                              </CardDescription>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant="secondary" className="gap-1">
                            <CategoryIcon className="h-3 w-3" />
                            {categoryInfo?.label}
                          </Badge>
                          <Badge className={rarityInfo.color}>{rarityInfo.label}</Badge>
                          <Badge variant="outline">{achievement.achievements?.points} pts</Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="relative">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Earned {new Date(achievement.earned_at).toLocaleDateString()}
                          </p>
                          <Button
                            variant={achievement.is_featured ? 'default' : 'outline'}
                            size="sm"
                            onClick={() =>
                              handleFeatureAchievement(achievement.id, achievement.is_featured)
                            }
                          >
                            <Star
                              className={`h-3 w-3 mr-1 ${achievement.is_featured ? 'fill-current' : ''}`}
                            />
                            {achievement.is_featured ? 'Featured' : 'Feature'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Available (Locked) Achievements */}
          <TabsContent value="available">
            {availableAchievements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">All achievements earned!</p>
                  <p className="text-muted-foreground">
                    Congratulations! You've unlocked all available achievements.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableAchievements.map(achievement => {
                  const rarity = achievement.rarity || 'common';
                  const category = achievement.category || 'special';
                  const rarityInfo = rarityConfig[rarity as keyof typeof rarityConfig];
                  const categoryInfo = categoryConfig[category as keyof typeof categoryConfig];
                  const CategoryIcon = categoryInfo?.icon || Award;

                  return (
                    <Card
                      key={achievement.id}
                      className="relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity"
                    >
                      {/* Locked overlay */}
                      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <Lock className="h-8 w-8 text-white/60" />
                      </div>

                      <CardHeader className="relative">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-4xl grayscale">
                              {achievement.icon_emoji || '🏆'}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{achievement.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {achievement.description}
                              </CardDescription>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant="secondary" className="gap-1">
                            <CategoryIcon className="h-3 w-3" />
                            {categoryInfo?.label}
                          </Badge>
                          <Badge className={rarityInfo.color}>{rarityInfo.label}</Badge>
                          <Badge variant="outline">{achievement.points} pts</Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
