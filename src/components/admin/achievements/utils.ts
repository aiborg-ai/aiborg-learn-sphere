import { CheckCircle, Star, Users, Trophy, Shield, Award } from 'lucide-react';

export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'legendary':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'epic':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'rare':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'course_completion':
      return CheckCircle;
    case 'skill_mastery':
      return Star;
    case 'engagement':
      return Users;
    case 'milestone':
      return Trophy;
    case 'special':
      return Shield;
    default:
      return Award;
  }
};
