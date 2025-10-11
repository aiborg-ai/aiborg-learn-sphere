/**
 * Gamification Services
 * Export all gamification-related services and types
 */

// Services
export { AchievementService } from './AchievementService';
export { PointsService, LEVEL_TIERS, STREAK_MULTIPLIERS } from './PointsService';
export { LeaderboardService } from './LeaderboardService';

// Types
export type {
  Achievement,
  AchievementTier,
  AchievementCategory,
  AchievementCriteria,
  UserAchievement,
  UserProgress,
  PointTransaction,
  PointsAwardResult,
  StreakUpdateResult,
  Leaderboard,
  LeaderboardEntry,
  LeaderboardType,
  LeaderboardCriteria,
  TimePeriod,
  UserLeaderboardPreferences,
  UserLeaderboardPosition,
} from './types';
