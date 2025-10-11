/**
 * Gamification Types
 * Type definitions for achievements, points, levels, and leaderboards
 */

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type AchievementCategory = 'completion' | 'performance' | 'streak' | 'social' | 'special';
export type LeaderboardType = 'global' | 'industry' | 'role' | 'friends' | 'team';
export type LeaderboardCriteria = 'points' | 'ability' | 'assessments' | 'streak' | 'improvement';
export type TimePeriod = 'weekly' | 'monthly' | 'all_time';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  tier: AchievementTier;
  category: AchievementCategory;
  criteria: AchievementCriteria;
  points_value: number;
  is_active: boolean;
  rarity_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface AchievementCriteria {
  type: 'count' | 'score' | 'time' | 'streak' | 'boolean' | 'percentile' | 'improvement' | 'time_of_day' | 'day_of_week' | 'ability' | 'category_score';
  threshold?: number;
  metric: string;
  category?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  metadata: Record<string, any>;
  achievement?: Achievement;
}

export interface UserProgress {
  user_id: string;
  total_points: number;
  current_level: number;
  lifetime_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  points_multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'earned' | 'spent' | 'bonus' | 'penalty';
  source: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PointsAwardResult {
  points_awarded: number;
  total_points: number;
  old_level: number;
  new_level: number;
  level_up: boolean;
}

export interface StreakUpdateResult {
  current_streak: number;
  longest_streak: number;
  bonus_points: number;
  multiplier: number;
}

export interface Leaderboard {
  id: string;
  name: string;
  description?: string;
  type: LeaderboardType;
  criteria: LeaderboardCriteria;
  time_period: TimePeriod;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;
  rank: number;
  score: number;
  metadata: {
    display_name?: string;
    avatar_url?: string;
    level?: number;
    badges?: number;
    assessments_completed?: number;
  };
  updated_at: string;
}

export interface UserLeaderboardPreferences {
  user_id: string;
  opt_in: boolean;
  show_real_name: boolean;
  visible_to: 'all' | 'friends' | 'team' | 'none';
  created_at: string;
  updated_at: string;
}

export interface UserLeaderboardPosition {
  rank: number;
  score: number;
  total_entries: number;
  percentile?: number;
}
