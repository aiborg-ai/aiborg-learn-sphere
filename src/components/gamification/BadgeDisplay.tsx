import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBadges } from '@/hooks/useBadges';
import { getRarityStyle } from '@/config/gamification';
import { Star, Lock, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeDisplayProps {
  variant?: 'grid' | 'showcase' | 'compact';
  className?: string;
  limit?: number;
  showLocked?: boolean;
}

export function BadgeDisplay({
  variant = 'grid',
  className,
  limit,
  showLocked = true,
}: BadgeDisplayProps) {
  const { earnedAchievements, allAchievements, isLoading, toggleFeatured, isTogglingFeatured } =
    useBadges();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedIds = new Set(earnedAchievements?.map(ua => ua.achievement_id) || []);
  const displayAchievements = showLocked
    ? allAchievements
    : allAchievements?.filter(a => earnedIds.has(a.id));
  const limitedAchievements = limit ? displayAchievements?.slice(0, limit) : displayAchievements;

  const isShowcase = variant === 'showcase';
  const isCompact = variant === 'compact';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievement Badges
            </CardTitle>
            <CardDescription>
              {earnedAchievements?.length || 0} of {allAchievements?.length || 0} unlocked
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono">
            {Math.round(((earnedAchievements?.length || 0) / (allAchievements?.length || 1)) * 100)}
            %
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea
          className={cn(isShowcase ? 'h-[400px]' : isCompact ? 'h-[200px]' : 'max-h-[600px]')}
        >
          <div
            className={cn(
              'grid gap-4',
              isShowcase
                ? 'grid-cols-3'
                : isCompact
                  ? 'grid-cols-4'
                  : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
            )}
          >
            {limitedAchievements?.map(achievement => {
              const isEarned = earnedIds.has(achievement.id);
              const userAchievement = earnedAchievements?.find(
                ua => ua.achievement_id === achievement.id
              );
              const rarityStyle = getRarityStyle(achievement.rarity);

              return (
                <TooltipProvider key={achievement.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'relative p-4 rounded-lg border-2 transition-all cursor-pointer group',
                          isEarned
                            ? `border-[${rarityStyle.color}] bg-gradient-to-br from-${rarityStyle.color}/10 to-transparent hover:shadow-lg ${rarityStyle.glow}`
                            : 'border-muted bg-muted/50 opacity-60 hover:opacity-80'
                        )}
                      >
                        {/* Featured star */}
                        {isEarned && userAchievement?.is_featured && (
                          <div className="absolute -top-2 -right-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}

                        {/* Lock icon for locked badges */}
                        {!isEarned && (
                          <div className="absolute top-2 right-2">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}

                        {/* Badge icon */}
                        <div className="text-center">
                          <div
                            className={cn('text-4xl mb-2', isEarned ? 'grayscale-0' : 'grayscale')}
                          >
                            {achievement.icon_emoji}
                          </div>
                          <div className="text-xs font-semibold line-clamp-2 min-h-[2rem]">
                            {achievement.name}
                          </div>
                          {isEarned && (
                            <Badge
                              variant="outline"
                              className="mt-2 text-[10px]"
                              style={{ borderColor: rarityStyle.color, color: rarityStyle.color }}
                            >
                              {rarityStyle.label}
                            </Badge>
                          )}
                        </div>

                        {/* Feature toggle button (on hover) */}
                        {isEarned && !isCompact && (
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              size="sm"
                              variant={userAchievement?.is_featured ? 'default' : 'outline'}
                              disabled={isTogglingFeatured}
                              onClick={e => {
                                e.stopPropagation();
                                if (userAchievement) {
                                  toggleFeatured({
                                    userAchievementId: userAchievement.id,
                                    isFeatured: !userAchievement.is_featured,
                                  });
                                }
                              }}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              {userAchievement?.is_featured ? 'Featured' : 'Feature'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{achievement.icon_emoji}</span>
                          <div>
                            <div className="font-bold">{achievement.name}</div>
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                              style={{ borderColor: rarityStyle.color, color: rarityStyle.color }}
                            >
                              {rarityStyle.label}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <Sparkles className="h-3 w-3 text-yellow-500" />
                          <span className="font-semibold">{achievement.points} points</span>
                        </div>
                        {isEarned && userAchievement && (
                          <div className="text-xs text-muted-foreground">
                            Unlocked: {new Date(userAchievement.earned_at).toLocaleDateString()}
                          </div>
                        )}
                        {!isEarned && (
                          <div className="text-xs text-muted-foreground italic">
                            <Lock className="h-3 w-3 inline mr-1" />
                            Not yet unlocked
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
