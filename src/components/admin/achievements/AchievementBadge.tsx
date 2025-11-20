import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, Award } from '@/components/ui/icons';
import type { Achievement } from './types';
import { getRarityColor, getCategoryIcon } from './utils';

interface AchievementBadgeProps {
  achievement: Achievement;
  onEdit: (achievement: Achievement) => void;
  onDelete: (id: string) => void;
  onAllocate: (achievement: Achievement) => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  onEdit,
  onDelete,
  onAllocate,
}) => {
  const CategoryIcon = getCategoryIcon(achievement.category);

  return (
    <Card className={`${getRarityColor(achievement.rarity)} border`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{achievement.icon_emoji}</span>
            <div>
              <h3 className="font-medium text-white">{achievement.name}</h3>
              <p className="text-sm text-white/80 mt-1">{achievement.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Badge variant="outline" className="text-xs">
            <CategoryIcon className="h-4 w-4" />
            <span className="ml-1">{achievement.category.replace('_', ' ')}</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            {achievement.points} pts
          </Badge>
          {achievement.auto_allocate && (
            <Badge variant="outline" className="text-xs bg-green-500/10">
              Auto
            </Badge>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="ghost" onClick={() => onEdit(achievement)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(achievement.id)}>
            <Trash className="h-4 w-4 text-red-400" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onAllocate(achievement)}>
            <Award className="h-4 w-4 mr-1" />
            Allocate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
