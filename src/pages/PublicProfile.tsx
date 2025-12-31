import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  Trophy,
  Award,
  Star,
  Calendar,
  Clock,
  Target,
  Flame,
  Shield,
  CheckCircle,
  TrendingUp,
  ArrowLeft,
  Share2,
  Loader2,
  Medal,
  Zap,
  Crown,
  Diamond,
} from '@/components/ui/icons';

interface PublicProfileData {
  userId: string;
  displayName: string;
  email: string;
  memberSince: string;
  certificatesEarned: number;
  totalAchievements: number;
  featuredAchievements: Achievement[];
  completedCourses: CompletedCourse[];
  learningStats: LearningStats;
  socialLinks?: SocialLinks;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  rarity: string;
  earnedAt: string;
  category: string;
  points: number;
}

interface CompletedCourse {
  id: number;
  title: string;
  completedAt: string;
  certificateNumber?: string;
  score?: number;
}

interface LearningStats {
  totalCoursesCompleted: number;
  totalLearningHours: number;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
}

interface SocialLinks {
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [activeTab, setActiveTab] = useState('achievements');
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchPublicProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPublicProfile is stable
  }, [userId]);

  const fetchPublicProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch basic profile info
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, email, created_at')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch featured achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(
          `
          *,
          achievements!inner(name, description, icon_emoji, rarity, category, points)
        `
        )
        .eq('user_id', userId)
        .eq('is_featured', true)
        .order('earned_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      // Fetch completed courses with certificates
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('certificates')
        .select(
          `
          *,
          courses!inner(title)
        `
        )
        .eq('user_id', userId)
        .order('issued_date', { ascending: false });

      if (certificatesError) throw certificatesError;

      // Fetch learning statistics
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('time_spent_minutes')
        .eq('user_id', userId)
        .eq('completed_at', 'not.null');

      const totalLearningMinutes =
        progressData?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) || 0;

      // Fetch current streak
      const { data: streakData } = await supabase.rpc('calculate_learning_streak', {
        p_user_id: userId,
      });

      // Count total achievements
      const { count: totalAchievementsCount } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Prepare profile data
      const profileInfo: PublicProfileData = {
        userId: userId,
        displayName: profileData?.display_name || 'Anonymous Learner',
        email: profileData?.email || '',
        memberSince: profileData?.created_at || '',
        certificatesEarned: certificatesData?.length || 0,
        totalAchievements: totalAchievementsCount || 0,
        featuredAchievements:
          achievementsData?.map(a => ({
            id: a.id,
            name: a.achievements.name,
            description: a.achievements.description,
            iconEmoji: a.achievements.icon_emoji,
            rarity: a.achievements.rarity,
            category: a.achievements.category,
            points: a.achievements.points,
            earnedAt: a.earned_at,
          })) || [],
        completedCourses:
          certificatesData?.map(c => ({
            id: c.course_id,
            title: c.courses?.title || '',
            completedAt: c.issued_date,
            certificateNumber: c.certificate_number,
            score: c.final_score,
          })) || [],
        learningStats: {
          totalCoursesCompleted: certificatesData?.length || 0,
          totalLearningHours: Math.round(totalLearningMinutes / 60),
          currentStreak: streakData || 0,
          longestStreak: 0, // Would need additional tracking
          averageScore:
            certificatesData?.reduce((sum, c) => sum + (c.final_score || 0), 0) /
              (certificatesData?.length || 1) || 0,
        },
      };

      setProfile(profileInfo);
    } catch {
      logger.error('Error fetching public profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'epic':
        return 'bg-gradient-to-r from-purple-400 to-pink-500 text-white';
      case 'rare':
        return 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return <Crown className="h-5 w-5" />;
      case 'epic':
        return <Diamond className="h-5 w-5" />;
      case 'rare':
        return <Star className="h-5 w-5" />;
      default:
        return <Medal className="h-5 w-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'course_completion':
        return <CheckCircle className="h-4 w-4" />;
      case 'skill_mastery':
        return <Target className="h-4 w-4" />;
      case 'engagement':
        return <TrendingUp className="h-4 w-4" />;
      case 'milestone':
        return <Trophy className="h-4 w-4" />;
      case 'special':
        return <Zap className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const shareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    // Would add toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8">
            <p className="text-white text-center">Profile not found</p>
            <Button className="w-full mt-4" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent" />
        <div className="container mx-auto px-6 py-12 relative">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{profile.displayName}</h1>
                <p className="text-white/80 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member since {new Date(profile.memberSince).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Button onClick={shareProfile} className="bg-white/10 hover:bg-white/20">
              <Share2 className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{profile.totalAchievements}</p>
                <p className="text-white/60 text-sm">Achievements</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{profile.certificatesEarned}</p>
                <p className="text-white/60 text-sm">Certificates</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {profile.learningStats.totalLearningHours}
                </p>
                <p className="text-white/60 text-sm">Learning Hours</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 text-center">
                <Flame className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {profile.learningStats.currentStreak}
                </p>
                <p className="text-white/60 text-sm">Day Streak</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {Math.round(profile.learningStats.averageScore)}%
                </p>
                <p className="text-white/60 text-sm">Avg Score</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 bg-white/10 backdrop-blur-md border-white/20">
            <TabsTrigger
              value="achievements"
              className="text-white data-[state=active]:bg-white/20"
            >
              Featured Achievements
            </TabsTrigger>
            <TabsTrigger
              value="certificates"
              className="text-white data-[state=active]:bg-white/20"
            >
              Certificates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.featuredAchievements.length > 0 ? (
                profile.featuredAchievements.map(achievement => (
                  <Card
                    key={achievement.id}
                    className={`relative overflow-hidden ${getRarityColor(achievement.rarity)} border-0`}
                  >
                    <div className="absolute top-2 right-2">
                      {getRarityIcon(achievement.rarity)}
                    </div>
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <span className="text-5xl">{achievement.iconEmoji}</span>
                      </div>
                      <h3 className="text-xl font-bold text-center mb-2">{achievement.name}</h3>
                      <p className="text-sm text-center opacity-90 mb-4">
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur">
                          {getCategoryIcon(achievement.category)}
                          <span className="ml-1">{achievement.category.replace('_', ' ')}</span>
                        </Badge>
                        <span className="text-sm font-bold">{achievement.points} pts</span>
                      </div>
                      <p className="text-xs text-center mt-3 opacity-75">
                        Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-12 text-center">
                    <Trophy className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">No featured achievements yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certificates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.completedCourses.length > 0 ? (
                profile.completedCourses.map(course => (
                  <Card key={course.id} className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white">{course.title}</CardTitle>
                          <CardDescription className="text-white/60">
                            Completed on {new Date(course.completedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Shield className="h-8 w-8 text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white/80 text-sm">Certificate Number</span>
                          <span className="text-white font-mono text-sm">
                            {course.certificateNumber}
                          </span>
                        </div>
                        {course.score && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-white/60">Final Score</span>
                              <span className="text-white font-medium">
                                {Math.round(course.score)}%
                              </span>
                            </div>
                            <Progress value={course.score} className="h-2" />
                          </div>
                        )}
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() =>
                            window.open(`/certificate/${course.certificateNumber}`, '_blank')
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify Certificate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-12 text-center">
                    <Award className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">No certificates earned yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
