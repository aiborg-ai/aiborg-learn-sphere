/**
 * Badge Collection Component
 * Displays a grid of achievements with filtering
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Zap, Users, Star } from 'lucide-react';
import { AchievementCard } from './AchievementCard';
import { ShareAchievementDialog } from './ShareAchievementDialog';
import type { Achievement, UserAchievement, AchievementCategory } from '@/services/gamification';

interface BadgeCollectionProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  showProgress?: boolean;
  userName?: string;
}

const CATEGORY_ICONS: Record<AchievementCategory, React.ReactNode> = {
  completion: <Trophy className="h-4 w-4" />,
  performance: <Award className="h-4 w-4" />,
  streak: <Zap className="h-4 w-4" />,
  social: <Users className="h-4 w-4" />,
  special: <Star className="h-4 w-4" />,
};

export function BadgeCollection({
  achievements,
  userAchievements,
  showProgress = true,
  userName,
}: BadgeCollectionProps) {
  const [filter, setFilter] = useState<'all' | AchievementCategory>('all');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedUserAchievement, setSelectedUserAchievement] = useState<UserAchievement | null>(
    null
  );

  // Create map of unlocked achievements
  const unlockedMap = new Map(userAchievements.map(ua => [ua.achievement_id, ua]));

  const handleShare = (achievement: Achievement, userAchievement?: UserAchievement) => {
    setSelectedAchievement(achievement);
    setSelectedUserAchievement(userAchievement || null);
    setShareDialogOpen(true);
  };

  // Filter achievements
  const filteredAchievements =
    filter === 'all' ? achievements : achievements.filter(a => a.category === filter);

  // Sort: unlocked first, then by tier and points
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const aUnlocked = unlockedMap.has(a.id);
    const bUnlocked = unlockedMap.has(b.id);

    if (aUnlocked !== bUnlocked) {
      return bUnlocked ? 1 : -1; // Unlocked first
    }

    // Then by points (descending)
    return b.points_value - a.points_value;
  });

  // Calculate stats
  const totalAchievements = achievements.length;
  const unlockedCount = userAchievements.length;
  const percentage =
    totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  const categoryCounts: Record<AchievementCategory, { total: number; unlocked: number }> = {
    completion: { total: 0, unlocked: 0 },
    performance: { total: 0, unlocked: 0 },
    streak: { total: 0, unlocked: 0 },
    social: { total: 0, unlocked: 0 },
    special: { total: 0, unlocked: 0 },
  };

  achievements.forEach(achievement => {
    categoryCounts[achievement.category].total++;
    if (unlockedMap.has(achievement.id)) {
      categoryCounts[achievement.category].unlocked++;
    }
  });

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      {showProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Achievement Progress</CardTitle>
            <CardDescription>
              {unlockedCount} of {totalAchievements} achievements unlocked ({percentage}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(Object.keys(categoryCounts) as AchievementCategory[]).map(category => (
                <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {CATEGORY_ICONS[category]}
                  </div>
                  <div className="text-sm font-medium capitalize">{category}</div>
                  <div className="text-lg font-bold">
                    {categoryCounts[category].unlocked}/{categoryCounts[category].total}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={v => setFilter(v as typeof filter)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2 text-xs">
              {achievements.length}
            </Badge>
          </TabsTrigger>
          {(Object.keys(categoryCounts) as AchievementCategory[]).map(category => (
            <TabsTrigger key={category} value={category} className="capitalize">
              <span className="hidden md:inline">{category}</span>
              <span className="md:hidden">{CATEGORY_ICONS[category]}</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {categoryCounts[category].total}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {sortedAchievements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No achievements in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAchievements.map(achievement => {
                const userAch = unlockedMap.get(achievement.id);
                return (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    userAchievement={userAch}
                    isUnlocked={unlockedMap.has(achievement.id)}
                    size="md"
                    showPoints={true}
                    onShare={
                      unlockedMap.has(achievement.id)
                        ? () => handleShare(achievement, userAch)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      {selectedAchievement && (
        <ShareAchievementDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          achievement={selectedAchievement}
          userAchievement={selectedUserAchievement || undefined}
          userName={userName}
        />
      )}
    </div>
  );
}
