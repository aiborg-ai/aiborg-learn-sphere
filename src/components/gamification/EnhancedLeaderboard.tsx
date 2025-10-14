/**
 * Enhanced Leaderboard Component
 * Beautiful leaderboard with podium, animations, and visual effects
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Medal, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  level?: number;
  badges?: number;
  trend?: 'up' | 'down' | 'same';
  trendChange?: number;
}

interface EnhancedLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  title?: string;
  description?: string;
  scoreLabel?: string;
  timePeriod?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  onTimePeriodChange?: (period: string) => void;
  showPodium?: boolean;
  maxEntries?: number;
}

const RANK_CONFIG = {
  1: {
    icon: Crown,
    iconColor: 'text-yellow-500',
    bgGradient: 'from-yellow-400 to-yellow-600',
    badgeGradient: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    glowColor: 'shadow-yellow-500/50',
    podiumHeight: 'h-32',
    title: '1st Place',
  },
  2: {
    icon: Medal,
    iconColor: 'text-gray-400',
    bgGradient: 'from-gray-300 to-gray-500',
    badgeGradient: 'bg-gradient-to-r from-gray-300 to-gray-500',
    glowColor: 'shadow-gray-400/50',
    podiumHeight: 'h-24',
    title: '2nd Place',
  },
  3: {
    icon: Medal,
    iconColor: 'text-orange-500',
    bgGradient: 'from-orange-400 to-orange-600',
    badgeGradient: 'bg-gradient-to-r from-orange-400 to-orange-600',
    glowColor: 'shadow-orange-500/50',
    podiumHeight: 'h-20',
    title: '3rd Place',
  },
};

export function EnhancedLeaderboard({
  entries,
  currentUserId,
  title = 'Leaderboard',
  description = 'Top performers',
  scoreLabel = 'points',
  timePeriod = 'all_time',
  onTimePeriodChange,
  showPodium = true,
  maxEntries = 50,
}: EnhancedLeaderboardProps) {
  const [activeTab, setActiveTab] = useState(timePeriod);

  const topThree = entries.slice(0, 3);
  const restOfList = entries.slice(3, maxEntries);
  const currentUserEntry = entries.find(e => e.userId === currentUserId);
  const currentUserInList = currentUserEntry && currentUserEntry.rank <= maxEntries;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTimePeriodChange?.(value);
  };

  const _formatScore = (score: number) => {
    return score.toLocaleString();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>

        {/* Time period tabs */}
        {onTimePeriodChange && (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="all_time">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No entries yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Podium Display for Top 3 */}
            {showPodium && topThree.length > 0 && (
              <div className="relative">
                <div className="flex items-end justify-center gap-4 pb-4">
                  {/* 2nd Place */}
                  {topThree[1] && (
                    <PodiumPlace
                      entry={topThree[1]}
                      config={RANK_CONFIG[2]}
                      isCurrentUser={topThree[1].userId === currentUserId}
                      scoreLabel={scoreLabel}
                    />
                  )}

                  {/* 1st Place (Center, Tallest) */}
                  {topThree[0] && (
                    <PodiumPlace
                      entry={topThree[0]}
                      config={RANK_CONFIG[1]}
                      isCurrentUser={topThree[0].userId === currentUserId}
                      scoreLabel={scoreLabel}
                      isFeatured
                    />
                  )}

                  {/* 3rd Place */}
                  {topThree[2] && (
                    <PodiumPlace
                      entry={topThree[2]}
                      config={RANK_CONFIG[3]}
                      isCurrentUser={topThree[2].userId === currentUserId}
                      scoreLabel={scoreLabel}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Rest of the leaderboard */}
            {restOfList.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Top {maxEntries}</h4>
                </div>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {restOfList.map(entry => (
                      <LeaderboardRow
                        key={entry.userId}
                        entry={entry}
                        isCurrentUser={entry.userId === currentUserId}
                        scoreLabel={scoreLabel}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Current User Position (if not in top list) */}
            {currentUserId && currentUserEntry && !currentUserInList && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Your Position</p>
                <LeaderboardRow
                  entry={currentUserEntry}
                  isCurrentUser={true}
                  scoreLabel={scoreLabel}
                  highlighted
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Podium Place Component
function PodiumPlace({
  entry,
  config,
  isCurrentUser,
  scoreLabel,
  isFeatured = false,
}: {
  entry: LeaderboardEntry;
  config: (typeof RANK_CONFIG)[1];
  isCurrentUser: boolean;
  scoreLabel: string;
  isFeatured?: boolean;
}) {
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center transition-all duration-300 hover:scale-105',
        isFeatured && 'scale-110'
      )}
    >
      {/* Crown/Medal Icon */}
      <div className="mb-2 relative">
        <Icon className={cn('h-8 w-8', config.iconColor, isFeatured && 'animate-pulse')} />
        {isFeatured && <div className="absolute -inset-2 bg-yellow-400/20 rounded-full blur-lg" />}
      </div>

      {/* Avatar */}
      <Avatar
        className={cn(
          'h-16 w-16 ring-4 mb-2',
          `ring-${config.iconColor.split('-')[1]}-500`,
          isFeatured && 'h-20 w-20',
          isCurrentUser && 'ring-blue-500'
        )}
      >
        <AvatarImage src={entry.avatarUrl} />
        <AvatarFallback
          className={cn(`bg-gradient-to-br ${config.bgGradient} text-white text-lg font-bold`)}
        >
          {entry.displayName.charAt(0)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <p className="font-bold text-sm text-center max-w-24 truncate mb-1">
        {entry.displayName}
        {isCurrentUser && <Badge className="ml-1 text-[10px]">You</Badge>}
      </p>

      {/* Score */}
      <Badge className={cn(config.badgeGradient, 'text-white font-bold shadow-lg')}>
        {entry.score.toLocaleString()} {scoreLabel}
      </Badge>

      {/* Podium */}
      <div
        className={cn(
          'w-24 rounded-t-lg mt-3 transition-all duration-300',
          `bg-gradient-to-br ${config.bgGradient}`,
          config.glowColor,
          'shadow-lg',
          config.podiumHeight
        )}
      >
        <div className="h-full flex items-end justify-center pb-2">
          <span className="text-white font-bold text-2xl">#{entry.rank}</span>
        </div>
      </div>
    </div>
  );
}

// Leaderboard Row Component
function LeaderboardRow({
  entry,
  isCurrentUser,
  scoreLabel,
  highlighted = false,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  scoreLabel: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all',
        isCurrentUser || highlighted
          ? 'bg-blue-50 border-2 border-blue-300 dark:bg-blue-950 dark:border-blue-700'
          : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
      )}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-10 text-center">
        <span className="text-lg font-bold text-gray-600 dark:text-gray-400">#{entry.rank}</span>
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.avatarUrl} />
        <AvatarFallback>{entry.displayName.charAt(0)}</AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">
            {entry.displayName}
            {isCurrentUser && (
              <Badge variant="default" className="ml-2 text-xs">
                You
              </Badge>
            )}
          </p>
        </div>
        {(entry.level || entry.badges) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {entry.level && <span>Level {entry.level}</span>}
            {entry.level && entry.badges && <span>•</span>}
            {entry.badges && <span>{entry.badges} badges</span>}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-lg">{formatScore(entry.score)}</p>
        <p className="text-xs text-muted-foreground">{scoreLabel}</p>
      </div>

      {/* Trend */}
      {entry.trend && (
        <div className="flex-shrink-0">
          {entry.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {entry.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
        </div>
      )}
    </div>
  );
}
