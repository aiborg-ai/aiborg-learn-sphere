/**
 * Badge Showcase Component
 * Displays featured badges in a visually stunning showcase with animations
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedBadge } from './AnimatedBadge';
import { Trophy, Sparkles, ChevronRight } from 'lucide-react';
import type { Achievement, UserAchievement } from '@/services/gamification';

interface BadgeShowcaseProps {
  featuredBadges: Array<{
    achievement: Achievement;
    userAchievement?: UserAchievement;
    isUnlocked: boolean;
  }>;
  onViewAll?: () => void;
  title?: string;
  description?: string;
}

export function BadgeShowcase({
  featuredBadges,
  onViewAll,
  title = 'Featured Achievements',
  description = 'Your most impressive badges on display',
}: BadgeShowcaseProps) {
  // Show top 5 featured or recently earned
  const displayBadges = featuredBadges.slice(0, 5);

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950 dark:via-gray-900 dark:to-blue-950">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {displayBadges.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <Trophy className="h-16 w-16 text-gray-300" />
                <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <p className="text-gray-500 mb-2">No achievements unlocked yet</p>
            <p className="text-sm text-gray-400">
              Complete courses and challenges to earn your first badge!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main featured badge */}
            <div className="flex flex-col items-center justify-center py-8 relative">
              {/* Radial gradient background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 bg-gradient-radial from-yellow-200/30 via-transparent to-transparent rounded-full blur-2xl" />
              </div>

              {displayBadges[0] && (
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <AnimatedBadge
                    iconUrl={displayBadges[0].achievement.icon_url}
                    icon="🏆"
                    name={displayBadges[0].achievement.name}
                    description={displayBadges[0].achievement.description}
                    tier={displayBadges[0].achievement.tier}
                    points={displayBadges[0].achievement.points_value}
                    isUnlocked={displayBadges[0].isUnlocked}
                    rarity={displayBadges[0].achievement.rarity_percentage}
                    earnedDate={displayBadges[0].userAchievement?.earned_at}
                    size="lg"
                    showSparkles={true}
                  />
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{displayBadges[0].achievement.name}</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {displayBadges[0].achievement.description}
                    </p>
                    {displayBadges[0].isUnlocked && displayBadges[0].userAchievement && (
                      <Badge variant="outline" className="mt-2">
                        Earned{' '}
                        {new Date(displayBadges[0].userAchievement.earned_at).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Secondary badges in a row */}
            {displayBadges.length > 1 && (
              <div className="flex justify-center gap-4 flex-wrap">
                {displayBadges.slice(1).map((badge, _index) => (
                  <AnimatedBadge
                    key={badge.achievement.id}
                    iconUrl={badge.achievement.icon_url}
                    icon="🏆"
                    name={badge.achievement.name}
                    description={badge.achievement.description}
                    tier={badge.achievement.tier}
                    points={badge.achievement.points_value}
                    isUnlocked={badge.isUnlocked}
                    rarity={badge.achievement.rarity_percentage}
                    earnedDate={badge.userAchievement?.earned_at}
                    size="md"
                    showSparkles={true}
                  />
                ))}
              </div>
            )}

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {featuredBadges.filter(b => b.isUnlocked).length}
                </p>
                <p className="text-xs text-muted-foreground">Unlocked</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {featuredBadges
                    .filter(b => b.isUnlocked)
                    .reduce((sum, b) => sum + b.achievement.points_value, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {
                    featuredBadges
                      .filter(
                        b =>
                          b.achievement.tier === 'gold' ||
                          b.achievement.tier === 'platinum' ||
                          b.achievement.tier === 'diamond'
                      )
                      .filter(b => b.isUnlocked).length
                  }
                </p>
                <p className="text-xs text-muted-foreground">Rare Badges</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
