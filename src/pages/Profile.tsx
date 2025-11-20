import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useUserReviews } from '@/hooks/useUserReviews';
import {
  Loader2,
  User,
  ArrowLeft,
  Brain,
  Target,
  Trophy,
  ExternalLink,
} from '@/components/ui/icons';
import { Link } from 'react-router-dom';
import { NotificationSettings } from '@/components/shared';
import { supabase } from '@/integrations/supabase/client';
import { AchievementService, PointsService, LeaderboardService } from '@/services/gamification';
import type {
  UserProgress,
  Achievement,
  UserAchievement,
  Leaderboard,
  LeaderboardEntry,
  PointTransaction,
} from '@/services/gamification';
import {
  ProfileTab,
  AssessmentsTab,
  GamificationTab,
  LearningPathsTab,
  ReviewsTab,
} from '@/components/profile';

export default function Profile() {
  const [assessments, setAssessments] = useState<unknown[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  // Gamification state
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<Record<string, LeaderboardEntry[]>>(
    {}
  );
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [progressData, setProgressData] = useState<
    Array<{ date: string; points: number; level: number; streak: number }>
  >([]);
  const [gamificationLoading, setGamificationLoading] = useState(false);

  const { user, profile, updateProfile, loading } = useAuth();
  const { userReviews, loading: reviewsLoading, refetch: refetchReviews } = useUserReviews();
  const navigate = useNavigate();

  // Get tab from URL query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const defaultTab = searchParams.get('tab') || 'profile';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchAssessments();
      fetchGamificationData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, navigate]);

  const fetchAssessments = async () => {
    if (!user) return;

    setAssessmentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_ai_assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_complete', true)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      logger.error('Error fetching assessments:', error);
    } finally {
      setAssessmentsLoading(false);
    }
  };

  const fetchGamificationData = async () => {
    if (!user) return;

    setGamificationLoading(true);
    try {
      // Fetch user progress
      const progress = await PointsService.getUserProgress(user.id);
      setUserProgress(progress);

      // Fetch all achievements
      const allAchievements = await AchievementService.getAll();
      setAchievements(allAchievements);

      // Fetch user's unlocked achievements
      const unlocked = await AchievementService.getUserAchievements(user.id);
      setUserAchievements(unlocked);

      // Fetch all leaderboards
      const allLeaderboards = await LeaderboardService.getAll();
      setLeaderboards(allLeaderboards);

      // Fetch top entries for each leaderboard
      const entriesMap: Record<string, LeaderboardEntry[]> = {};
      for (const leaderboard of allLeaderboards) {
        const entries = await LeaderboardService.getTopEntries(leaderboard.id, 10);
        entriesMap[leaderboard.id] = entries;
      }
      setLeaderboardEntries(entriesMap);

      // Fetch recent transactions
      const recentTransactions = await PointsService.getRecentTransactions(user.id, 20);
      setTransactions(recentTransactions);

      // Fetch progress chart data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: progressHistory } = await supabase
        .from('user_points')
        .select('created_at, points, description')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (progressHistory) {
        // Aggregate by day
        const aggregated: Record<string, { points: number; level: number; streak: number }> = {};
        let cumulativePoints = progress?.total_points || 0;

        progressHistory.forEach((transaction: { created_at: string; points: number }) => {
          const date = new Date(transaction.created_at).toISOString().split('T')[0];
          if (!aggregated[date]) {
            aggregated[date] = { points: cumulativePoints, level: progress?.level || 1, streak: 0 };
          }
          aggregated[date].points = cumulativePoints;
          cumulativePoints += transaction.points;
        });

        setProgressData(
          Object.entries(aggregated).map(([date, data]) => ({
            date,
            ...data,
          }))
        );
      }
    } catch (error) {
      logger.error('Error fetching gamification data:', error);
    } finally {
      setGamificationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = profile?.display_name || user.email || 'AIBORG Learner';

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <User className="h-8 w-8 text-secondary" />
            <span className="text-3xl font-display font-bold text-white">meAiborg</span>
          </div>
          <p className="text-white/80">Your personal AI learning dashboard</p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-6 bg-white/10 backdrop-blur-md border-white/20 md:grid-cols-6 overflow-x-auto">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-white/20">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="assessments" className="text-white data-[state=active]:bg-white/20">
              <Brain className="h-4 w-4 mr-2" />
              Assessments
            </TabsTrigger>
            <TabsTrigger
              value="gamification"
              className="text-white data-[state=active]:bg-white/20"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="learning-paths"
              className="text-white data-[state=active]:bg-white/20"
            >
              <Target className="h-4 w-4 mr-2" />
              Learning Paths
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-white data-[state=active]:bg-white/20"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-white data-[state=active]:bg-white/20">
              Reviews ({userReviews.length})
            </TabsTrigger>
          </TabsList>

          {/* Public Profile Link */}
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/user/${user?.id}`, '_blank')}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Profile
            </Button>
          </div>

          {/* Tab Content - Now using extracted components */}
          <TabsContent value="profile">
            <ProfileTab user={user} profile={profile} onUpdate={updateProfile} />
          </TabsContent>

          <TabsContent value="assessments">
            <AssessmentsTab
              assessments={assessments}
              loading={assessmentsLoading}
              onRefresh={fetchAssessments}
              onTakeAssessment={() => navigate('/ai-assessment')}
            />
          </TabsContent>

          <TabsContent value="gamification">
            <GamificationTab
              userProgress={userProgress}
              achievements={achievements}
              userAchievements={userAchievements}
              leaderboards={leaderboards}
              leaderboardEntries={leaderboardEntries}
              transactions={transactions}
              progressData={progressData}
              loading={gamificationLoading}
              onRefresh={fetchGamificationData}
              currentUserId={user?.id}
              userName={userName}
            />
          </TabsContent>

          <TabsContent value="learning-paths">
            <LearningPathsTab
              onGeneratePath={() => navigate('/learning-path/generate')}
              onBrowsePaths={() => navigate('/learning-paths')}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsTab
              reviews={userReviews}
              loading={reviewsLoading}
              onRefresh={refetchReviews}
              onWriteReview={() => navigate('/#reviews')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
