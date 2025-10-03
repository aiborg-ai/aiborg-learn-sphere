export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  category: string;
  rarity: string;
  criteria: any;
  points: number;
  is_active: boolean;
  auto_allocate: boolean;
  created_at: string;
}

export interface UserWithAchievements {
  user_id: string;
  email: string;
  display_name: string;
  achievements: string[];
}

export interface AchievementFormData {
  name: string;
  description: string;
  icon_emoji: string;
  category: string;
  rarity: string;
  points: number;
  auto_allocate: boolean;
  criteria_type: string;
  criteria_value: string;
}
