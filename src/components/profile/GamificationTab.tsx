import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, Trophy, Award } from '@/components/ui/icons';
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

interface GamificationTabProps {
  userProgress: UserProgress | null;
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  leaderboards: Leaderboard[];
  leaderboardEntries: Record<string, LeaderboardEntry[]>;
  transactions: PointTransaction[];
  progressData: Array<{ date: string; points: number; level: number; streak: number }>;
  loading: boolean;
  onRefresh: () => void;
  currentUserId?: string;
  userName: string;
}

export function GamificationTab({
  userProgress,
  achievements,
  userAchievements,
  leaderboards,
  leaderboardEntries,
  transactions,
  progressData,
  loading,
  onRefresh,
  currentUserId,
  userName,
}: GamificationTabProps) {
  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
            <p className="text-white/80">Loading your stats...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
                onClick={onRefresh}
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
          <ProgressChart data={progressData} type="area" showStreak={true} height={300} />
        </div>
      )}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg">
          <TransactionHistory transactions={transactions} showTitle={true} maxHeight="400px" />
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
              userName={userName}
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
            currentUserId={currentUserId}
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
    </div>
  );
}
