import React from 'react';
import type { Achievement } from './types';
import { AchievementBadge } from './AchievementBadge';

interface AchievementListProps {
  achievements: Achievement[];
  onEdit: (achievement: Achievement) => void;
  onDelete: (id: string) => void;
  onAllocate: (achievement: Achievement) => void;
}

export const AchievementList: React.FC<AchievementListProps> = ({
  achievements,
  onEdit,
  onDelete,
  onAllocate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map(achievement => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          onEdit={onEdit}
          onDelete={onDelete}
          onAllocate={onAllocate}
        />
      ))}
    </div>
  );
};
