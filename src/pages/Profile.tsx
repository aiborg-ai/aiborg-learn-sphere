import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useUserReviews } from '@/hooks/useUserReviews';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  User,
  ArrowLeft,
  Save,
  Star,
  MessageSquare,
  Mic,
  Video,
  RefreshCw,
  ExternalLink,
  Brain,
  Target,
  Trophy,
  Award,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotificationSettings } from '@/components/shared';
import AssessmentResultsCard from '@/components/assessment/AssessmentResultsCard';
import { supabase } from '@/integrations/supabase/client';
import { AchievementService, PointsService, LeaderboardService } from '@/services/gamification';
import {
  LevelProgressBar,
  PointsDisplay,
  BadgeCollection,
  LeaderboardTable,
  TransactionHistory,
  ProgressChart,
} from '@/components/gamification';
import type {
  UserProgress,
  Achievement,
  UserAchievement,
  Leaderboard,
  LeaderboardEntry,
  PointTransaction,
} from '@/services/gamification';

export default function Profile() {
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
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
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get tab from URL query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const defaultTab = searchParams.get('tab') || 'profile';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (profile) {
      setDisplayName(profile.display_name || '');
    }

    if (user) {
      fetchAssessments();
      fetchGamificationData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, loading, navigate]);

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

      // Generate progress data from transactions for charting
      if (recentTransactions.length > 0) {
        const progressPoints: Array<{
          date: string;
          points: number;
          level: number;
          streak: number;
        }> = [];
        let runningPoints = 0;

        // Sort transactions by date
        const sorted = [...recentTransactions].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        sorted.forEach((transaction, index) => {
          runningPoints += transaction.amount;
          const level = PointsService.calculateLevelFromPoints(runningPoints);
          const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          // Only add if date changed or it's the last one
          if (
            index === 0 ||
            date !== progressPoints[progressPoints.length - 1]?.date ||
            index === sorted.length - 1
          ) {
            progressPoints.push({
              date,
              points: runningPoints,
              level,
              streak: progress?.current_streak || 0,
            });
          }
        });

        setProgressData(progressPoints);
      }
    } catch (error) {
      logger.error('Error fetching gamification data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gamification data',
        variant: 'destructive',
      });
    } finally {
      setGamificationLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await updateProfile({
      display_name: displayName,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    }
    setIsLoading(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getReviewTypeIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Mic className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
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

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-4xl">
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

          <TabsContent value="profile">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Account Information</CardTitle>
                <CardDescription className="text-white/80 text-center">
                  Update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="bg-white/5 border-white/20 text-white/60"
                    />
                    <p className="text-xs text-white/60">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-white">
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Enter your display name"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  {profile && (
                    <div className="space-y-2">
                      <Label className="text-white">Role</Label>
                      <div className="p-2 bg-white/5 border border-white/20 rounded-md">
                        <span className="text-white/80 capitalize">{profile.role}</span>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
                  </Button>
                </form>

                {profile && (
                  <div className="mt-6 p-4 bg-white/5 rounded-lg">
                    <h3 className="text-white font-medium mb-2">Account Details</h3>
                    <div className="space-y-1 text-sm text-white/60">
                      <p>Member since: {new Date(profile.created_at).toLocaleDateString()}</p>
                      <p>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Your AI Assessments
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Track your AI skill progress over time
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAssessments}
                    disabled={assessmentsLoading}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    <RefreshCw className={`h-4 w-4 ${assessmentsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
                    <p className="text-white/80">Loading your assessments...</p>
                  </div>
                ) : assessments.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-white/50 mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-2 text-xl">No Assessments Yet</h3>
                    <p className="text-white/60 mb-6 max-w-md mx-auto">
                      Take your first AI assessment to discover your augmentation level and get
                      personalized learning recommendations
                    </p>
                    <Button onClick={() => navigate('/ai-assessment')} className="btn-hero">
                      <Brain className="h-4 w-4 mr-2" />
                      Take Assessment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Latest Assessment - Full Card */}
                    {assessments[0] && (
                      <div>
                        <h3 className="text-white/80 text-sm font-medium mb-4 flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Latest Assessment
                        </h3>
                        <AssessmentResultsCard assessment={assessments[0]} />
                      </div>
                    )}

                    {/* Previous Assessments - Compact */}
                    {assessments.length > 1 && (
                      <div>
                        <h3 className="text-white/80 text-sm font-medium mb-4">
                          Assessment History
                        </h3>
                        <div className="space-y-3">
                          {assessments.slice(1).map(assessment => (
                            <AssessmentResultsCard
                              key={assessment.id}
                              assessment={assessment}
                              compact
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Take New Assessment Button */}
                    <div className="pt-4">
                      <Button
                        onClick={() => navigate('/ai-assessment')}
                        className="w-full btn-hero"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Take New Assessment
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gamification">
            <div className="space-y-6">
              {gamificationLoading ? (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
                      <p className="text-white/80">Loading your stats...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Progress & Points Overview */}
                  {userProgress && (
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white flex items-center gap-2">
                              <Award className="h-5 w-5" />
                              Your Progress
                            </CardTitle>
                            <CardDescription className="text-white/80">
                              Level, points, and achievements
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchGamificationData}
                            className="text-white border-white/20 hover:bg-white/10"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Level Progress Bar */}
                        <div className="bg-white/5 rounded-lg p-4">
                          <LevelProgressBar progress={userProgress} showDetails={true} />
                        </div>

                        {/* Points Display */}
                        <div className="bg-white/5 rounded-lg p-4">
                          <PointsDisplay progress={userProgress} variant="full" showStreak={true} />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Progress Chart */}
                  {progressData.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-1">
                      <ProgressChart
                        data={progressData}
                        type="area"
                        showStreak={true}
                        height={300}
                      />
                    </div>
                  )}

                  {/* Transaction History */}
                  {transactions.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-md rounded-lg">
                      <TransactionHistory
                        transactions={transactions}
                        showTitle={true}
                        maxHeight="400px"
                      />
                    </div>
                  )}

                  {/* Achievements / Badges */}
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Achievements ({userAchievements.length}/{achievements.length})
                      </CardTitle>
                      <CardDescription className="text-white/80">
                        Unlock badges by completing challenges
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {achievements.length === 0 ? (
                        <div className="text-center py-8">
                          <Trophy className="h-12 w-12 text-white/50 mx-auto mb-4" />
                          <p className="text-white/60">No achievements available yet</p>
                        </div>
                      ) : (
                        <BadgeCollection
                          achievements={achievements}
                          userAchievements={userAchievements}
                          showProgress={true}
                          userName={profile?.display_name || user?.email || 'AIBORG Learner'}
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Leaderboards */}
                  {leaderboards.map(leaderboard => (
                    <div key={leaderboard.id}>
                      <LeaderboardTable
                        leaderboard={leaderboard}
                        entries={leaderboardEntries[leaderboard.id] || []}
                        currentUserId={user?.id}
                        highlightCurrent={true}
                        showMedals={true}
                      />
                    </div>
                  ))}

                  {leaderboards.length === 0 && (
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardContent className="p-12">
                        <div className="text-center">
                          <Trophy className="h-12 w-12 text-white/50 mx-auto mb-4" />
                          <p className="text-white/60">Leaderboards coming soon!</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="learning-paths">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Your Learning Paths
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      AI-powered personalized learning journeys
                    </CardDescription>
                  </div>
                  <Button onClick={() => navigate('/learning-path/generate')} className="btn-hero">
                    <Brain className="h-4 w-4 mr-2" />
                    Create New Path
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Target className="h-16 w-16 text-white/50 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2 text-xl">
                    Start Your Learning Journey
                  </h3>
                  <p className="text-white/60 mb-6 max-w-md mx-auto">
                    Create an AI-powered personalized learning path based on your assessment results
                    and goals
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => navigate('/learning-path/generate')}
                      className="btn-hero"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Learning Path
                    </Button>
                    <Button
                      onClick={() => navigate('/learning-paths')}
                      variant="outline"
                      className="text-white border-white/20 hover:bg-white/10"
                    >
                      Browse All Paths
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-center">Reviews Given</CardTitle>
                    <CardDescription className="text-white/80 text-center">
                      Your reviews and feedback on AI courses
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetchReviews}
                    disabled={reviewsLoading}
                    className="ml-4"
                  >
                    <RefreshCw className={`h-4 w-4 ${reviewsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
                    <p className="text-white/80">Loading your reviews...</p>
                  </div>
                ) : userReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-white/50 mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-2">No Reviews Yet</h3>
                    <p className="text-white/60 mb-4">You haven't written any reviews yet.</p>
                    <Button onClick={() => navigate('/#reviews')} className="btn-hero">
                      Write Your First Review
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {userReviews.map(review => (
                      <Card key={review.id} className="bg-white/5 border-white/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-sm text-white/60">{review.rating}/5</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={review.approved ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {review.approved ? 'Approved' : 'Pending'}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 text-xs border-white/20"
                              >
                                {getReviewTypeIcon(review.review_type)}
                                {review.review_type}
                              </Badge>
                            </div>
                          </div>

                          <h4 className="text-white font-medium mb-2">
                            {review.courses?.title || `Course ${review.course_id}`}
                          </h4>

                          <div className="text-sm text-white/60 mb-2">
                            {review.course_period} • {review.course_mode.replace('-', ' ')}
                          </div>

                          {review.review_type === 'written' && review.written_review && (
                            <p className="text-white/80 text-sm leading-relaxed">
                              "{review.written_review}"
                            </p>
                          )}

                          {review.review_type === 'voice' && review.voice_review_url && (
                            <div className="text-center py-2">
                              <Mic className="h-6 w-6 text-white/60 mx-auto mb-1" />
                              <p className="text-xs text-white/60">Voice review submitted</p>
                            </div>
                          )}

                          {review.review_type === 'video' && review.video_review_url && (
                            <div className="text-center py-2">
                              <Video className="h-6 w-6 text-white/60 mx-auto mb-1" />
                              <p className="text-xs text-white/60">Video review submitted</p>
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-white/20">
                            <p className="text-xs text-white/50">
                              Submitted on {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
