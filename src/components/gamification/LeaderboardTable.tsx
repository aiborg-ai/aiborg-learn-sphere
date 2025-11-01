/**
 * Leaderboard Table Component
 * Displays ranked users in a leaderboard
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Medal, Trophy, TrendingUp } from 'lucide-react';
import type { LeaderboardEntry, Leaderboard } from '@/services/gamification';

interface LeaderboardTableProps {
  leaderboard: Leaderboard;
  entries: LeaderboardEntry[];
  currentUserId?: string;
  highlightCurrent?: boolean;
  showMedals?: boolean;
}

const RANK_MEDALS = {
  1: { icon: <Crown className="h-5 w-5" />, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  2: { icon: <Medal className="h-5 w-5" />, color: 'text-gray-400', bg: 'bg-gray-50' },
  3: { icon: <Medal className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
};

export function LeaderboardTable({
  leaderboard,
  entries,
  currentUserId,
  highlightCurrent = true,
  showMedals = true,
}: LeaderboardTableProps) {
  const formatScore = (score: number, criteria: string) => {
    switch (criteria) {
      case 'points':
        return `${score.toLocaleString()} pts`;
      case 'ability':
        return `Level ${Math.floor(score)}`;
      case 'assessments':
        return `${score} completed`;
      case 'streak':
        return `${score} days`;
      case 'improvement':
        return `+${score.toFixed(1)}%`;
      default:
        return score.toLocaleString();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {leaderboard.name}
            </CardTitle>
            {leaderboard.description && (
              <CardDescription>{leaderboard.description}</CardDescription>
            )}
          </div>
          <Badge variant="outline" className="capitalize">
            {leaderboard.time_period.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No entries yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const isCurrentUser = currentUserId === entry.user_id;
              const topThree = entry.rank <= 3;
              const medalInfo =
                showMedals && topThree ? RANK_MEDALS[entry.rank as 1 | 2 | 3] : null;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                    isCurrentUser && highlightCurrent
                      ? 'bg-blue-50 border-2 border-blue-300 scale-105'
                      : medalInfo
                        ? medalInfo.bg
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 flex-shrink-0">
                    {medalInfo ? (
                      <div className={medalInfo.color}>{medalInfo.icon}</div>
                    ) : (
                      <span className="text-lg font-bold text-gray-600">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.metadata.avatar_url} />
                      <AvatarFallback>
                        {(entry.metadata.display_name || 'User')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">
                          {entry.metadata.display_name || 'Anonymous User'}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="default" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>

                      {entry.metadata.level && (
                        <div className="text-xs text-gray-500">Level {entry.metadata.level}</div>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-gray-900">
                      {formatScore(entry.score, leaderboard.criteria)}
                    </div>
                    {entry.metadata.assessments_completed && (
                      <div className="text-xs text-gray-500">
                        {entry.metadata.assessments_completed} assessments
                      </div>
                    )}
                  </div>

                  {/* Trend (optional) */}
                  {index === 0 && leaderboard.time_period !== 'all_time' && (
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Current User Position (if not in top list) */}
        {currentUserId && !entries.some(e => e.user_id === currentUserId) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500 text-center">
              You're not in the top {entries.length} yet. Keep earning points!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
