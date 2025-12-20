/**
 * LingoLeaderboard Page
 * Shows top learners by XP with weekly/monthly/all-time filters
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Crown, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { LingoHeader } from '@/components/lingo/layout/LingoHeader';
import { XPDisplay } from '@/components/lingo/game/XPDisplay';
import { useLingoLeaderboard, useLingo } from '@/hooks/useLingo';
import { useAuth } from '@/hooks/useAuth';

type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time';

export default function LingoLeaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const { user } = useAuth();
  const { xpInfo } = useLingo();
  const { entries, userPosition, isLoading, error } = useLingoLeaderboard(period);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return (
      <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>
    );
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
    return '';
  };

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
        title="Leaderboard"
      />

      <main className="container px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">Top AIBORGLingo learners</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/lingo" aria-label="Back to Lingo">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Period Tabs */}
        <Tabs value={period} onValueChange={v => setPeriod(v as LeaderboardPeriod)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* User Position Card */}
        {user && userPosition && userPosition > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Your Position</p>
                    <p className="text-sm text-muted-foreground">Keep learning to climb!</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">#{userPosition}</p>
                  <XPDisplay xp={xpInfo.total} size="sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign-in prompt for anonymous */}
        {!user && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Sign in to see your ranking and compete!</span>
              <Button size="sm" variant="outline" asChild className="ml-4">
                <Link to="/auth">Sign In</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {period === 'weekly' && 'Weekly Champions'}
              {period === 'monthly' && 'Monthly Champions'}
              {period === 'all_time' && 'All-Time Champions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-6 text-center text-muted-foreground">
                Failed to load leaderboard. Please try again.
              </div>
            ) : entries.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No entries yet. Be the first to compete!
              </div>
            ) : (
              <div className="divide-y">
                {entries.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrentUser = user && entry.user_id === user.id;

                  return (
                    <div
                      key={entry.user_id}
                      className={cn(
                        'flex items-center gap-4 p-4 transition-colors',
                        getRankBadge(rank),
                        isCurrentUser && 'bg-primary/5'
                      )}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(rank)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback>
                          {entry.display_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-medium truncate', isCurrentUser && 'text-primary')}>
                          {entry.display_name || 'Anonymous Learner'}
                          {isCurrentUser && ' (You)'}
                        </p>
                        {rank <= 3 && (
                          <p className="text-xs text-muted-foreground">
                            {rank === 1 && '🏆 Champion'}
                            {rank === 2 && '🥈 Runner-up'}
                            {rank === 3 && '🥉 Third Place'}
                          </p>
                        )}
                      </div>

                      {/* XP */}
                      <div className="text-right">
                        <XPDisplay xp={entry.score} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Leaderboards update in real-time. Complete lessons to earn XP and climb the ranks!
        </p>
      </main>
    </div>
  );
}
