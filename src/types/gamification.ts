/**
 * Gamification type definitions for achievements and criteria
 */

export interface AchievementCriteria {
  type: 'score' | 'time' | 'streak' | 'boolean' | 'improvement' | 'time_of_day';
  metric: string;
  threshold?: number;
  target_value?: unknown;
}

export interface AchievementContext {
  action: string;
  userId: string;
  metadata?: {
    ability_percentage?: number;
    completion_time_seconds?: number;
    current_streak?: number;
    improvement_percentage?: number;
    previous_score?: number;
    current_score?: number;
    [key: string]: unknown; // Allow additional metadata fields
  };
  timestamp?: string;
}

export interface LeaderboardUser {
  id: string;
  display_name?: string;
  avatar_url?: string;
  total_points?: number;
  level?: number;
  current_streak?: number;
  total_achievements?: number;
  courses_completed?: number;
  [key: string]: unknown; // Allow additional user fields
}

export interface MetricData {
  user_id: string;
  metric_type: string;
  metric_value: number | string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}
