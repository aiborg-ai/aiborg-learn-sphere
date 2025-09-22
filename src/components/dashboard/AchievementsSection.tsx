import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Star, Award } from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  rarity: string;
  earnedAt: string;
  isFeatured: boolean;
}

interface AchievementsSectionProps {
  achievements: Achievement[];
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return 'text-yellow-500 bg-yellow-50 border-yellow-300';
      case 'epic':
        return 'text-purple-500 bg-purple-50 border-purple-300';
      case 'rare':
        return 'text-blue-500 bg-blue-50 border-blue-300';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-300';
    }
  };

  const featuredAchievements = achievements.filter(a => a.isFeatured);
  const regularAchievements = achievements.filter(a => !a.isFeatured);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements
        </CardTitle>
        <CardDescription>
          Your earned badges and accomplishments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {achievements.length > 0 ? (
            <div className="space-y-6">
              {/* Featured Achievements */}
              {featuredAchievements.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      FEATURED
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {featuredAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 border-2 rounded-lg ${getRarityColor(achievement.rarity)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{achievement.iconEmoji}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{achievement.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {achievement.rarity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(achievement.earnedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Achievements */}
              {regularAchievements.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                    ALL ACHIEVEMENTS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {regularAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{achievement.iconEmoji}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {achievement.name}
                            </h4>
                            <Badge variant="outline" className="text-xs mt-1">
                              {achievement.rarity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No achievements earned yet. Keep learning to unlock achievements!
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}