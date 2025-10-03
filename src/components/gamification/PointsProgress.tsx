import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAiborgPoints } from '@/hooks/useAiborgPoints';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsProgressProps {
  variant?: 'default' | 'compact' | 'dashboard';
  className?: string;
  showHistory?: boolean;
}

export function PointsProgress({ variant = 'default', className, showHistory = false }: PointsProgressProps) {
  const { pointsData, levelInfo, pointsLoading, historyData } = useAiborgPoints();

  if (pointsLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!pointsData || !levelInfo) {
    return null;
  }

  const isCompact = variant === 'compact';
  const isDashboard = variant === 'dashboard';

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with gradient background based on level */}
      <CardHeader
        className="pb-3"
        style={{
          background: `linear-gradient(135deg, ${levelInfo.color}20 0%, ${levelInfo.color}05 100%)`,
        }}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{levelInfo.icon}</span>
            <div>
              <div className="text-sm font-normal text-muted-foreground">AIBORG Level {levelInfo.level}</div>
              <div className="text-xl font-bold" style={{ color: levelInfo.color }}>
                {levelInfo.rank}
              </div>
            </div>
          </div>
          {!isCompact && (
            <Badge variant="outline" className="font-mono text-lg">
              {pointsData.total_points.toLocaleString()} pts
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress to next level */}
        {levelInfo.nextLevel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progress to {levelInfo.nextLevel.name}
              </span>
              <span className="font-semibold">
                {Math.round(levelInfo.progress)}%
              </span>
            </div>
            <Progress
              value={levelInfo.progress}
              className="h-3"
              style={
                {
                  '--progress-background': levelInfo.color,
                } as React.CSSProperties
              }
            />
            <div className="text-xs text-muted-foreground text-right">
              {levelInfo.pointsToNextLevel.toLocaleString()} points to go
            </div>
          </div>
        )}

        {/* Max level reached */}
        {!levelInfo.nextLevel && (
          <div className="text-center py-4">
            <Trophy className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
            <div className="font-bold text-lg">Max Level Reached!</div>
            <div className="text-sm text-muted-foreground">You are an AIBORG Master</div>
          </div>
        )}

        {/* Stats grid */}
        {!isCompact && (
          <div className="grid grid-cols-3 gap-3 pt-3 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="h-3 w-3 text-orange-500" />
                <div className="text-xs text-muted-foreground">This Week</div>
              </div>
              <div className="font-bold">{pointsData.points_this_week}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-blue-500" />
                <div className="text-xs text-muted-foreground">This Month</div>
              </div>
              <div className="font-bold">{pointsData.points_this_month}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="h-3 w-3 text-red-500" />
                <div className="text-xs text-muted-foreground">Streak</div>
              </div>
              <div className="font-bold">
                {pointsData.streak_days} {pointsData.streak_days > 0 && '🔥'}
              </div>
            </div>
          </div>
        )}

        {/* Recent history */}
        {showHistory && historyData && historyData.length > 0 && (
          <div className="pt-3 border-t">
            <div className="text-sm font-semibold mb-2">Recent Activity</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {historyData.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-xs p-2 rounded bg-muted/50"
                >
                  <span className="text-muted-foreground line-clamp-1 flex-1">
                    {entry.description}
                  </span>
                  <Badge variant="secondary" className="ml-2 font-mono">
                    +{entry.points_earned}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
