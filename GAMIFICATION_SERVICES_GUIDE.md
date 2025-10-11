# Gamification Services - Developer Guide

**Status:** ✅ IMPLEMENTED
**Date:** 2025-10-09
**Version:** 1.0.0

---

## 📋 Overview

Complete gamification system with achievements, points, levels, streaks, and leaderboards. This guide covers all three core services and how to use them.

---

## 🗂️ Service Structure

```
src/services/gamification/
├── types.ts                    # Type definitions
├── AchievementService.ts       # Badge & achievement management
├── PointsService.ts            # Points, levels & streaks
├── LeaderboardService.ts       # Rankings & leaderboards
└── index.ts                    # Service exports
```

---

## 🏆 Achievement Service

### Import

```typescript
import { AchievementService } from '@/services/gamification';
```

### Core Methods

#### Get All Achievements
```typescript
const achievements = await AchievementService.getAll();
// Returns: Achievement[]
```

#### Get User's Achievements
```typescript
const userBadges = await AchievementService.getUserAchievements(userId);
// Returns: UserAchievement[]
```

#### Get User Progress
```typescript
const progress = await AchievementService.getUserProgress(userId);
// Returns: {
//   unlocked: number;
//   total: number;
//   percentage: number;
//   byTier: Record<AchievementTier, number>;
//   byCategory: Record<AchievementCategory, number>;
// }
```

#### Unlock Achievement
```typescript
const unlocked = await AchievementService.unlock(
  userId,
  achievementId,
  { metadata: 'optional' }
);
// Returns: boolean
```

#### Check & Auto-Unlock
```typescript
const newBadges = await AchievementService.checkAndUnlock(userId, {
  action: 'assessment_completed',
  metadata: {
    score: 95,
    completion_time_seconds: 420,
    ability_percentage: 90
  }
});
// Returns: UserAchievement[]
```

### Achievement Actions

Supported actions for `checkAndUnlock()`:
- `'assessment_completed'` - User completes assessment
- `'streak_updated'` - Daily streak updated
- `'share'` - User shares result
- `'group_joined'` - User joins study group

### Achievement Criteria Types

1. **Count** - Count-based achievements
   ```json
   {
     "type": "count",
     "threshold": 5,
     "metric": "assessments_completed"
   }
   ```

2. **Score** - Score-based achievements
   ```json
   {
     "type": "score",
     "threshold": 90,
     "metric": "ability_percentage"
   }
   ```

3. **Time** - Time-based achievements
   ```json
   {
     "type": "time",
     "threshold": 480,
     "metric": "completion_time"
   }
   ```

4. **Streak** - Streak-based achievements
   ```json
   {
     "type": "streak",
     "threshold": 7,
     "metric": "login_streak"
   }
   ```

### Example: Award Achievement After Assessment

```typescript
import { AchievementService } from '@/services/gamification';

async function handleAssessmentComplete(userId: string, assessmentData: any) {
  // Check for new achievements
  const newAchievements = await AchievementService.checkAndUnlock(userId, {
    action: 'assessment_completed',
    metadata: {
      score: assessmentData.score,
      completion_time_seconds: assessmentData.timeSeconds,
      ability_percentage: assessmentData.abilityPercentage,
    }
  });

  // Show toast for each new achievement
  newAchievements.forEach(achievement => {
    toast({
      title: '🏆 Achievement Unlocked!',
      description: `You earned: ${achievement.achievement?.name}`,
    });
  });
}
```

---

## 💎 Points Service

### Import

```typescript
import { PointsService, LEVEL_TIERS, STREAK_MULTIPLIERS } from '@/services/gamification';
```

### Core Methods

#### Get User Progress
```typescript
const progress = await PointsService.getUserProgress(userId);
// Returns: UserProgress | null
// {
//   total_points: number;
//   current_level: number;
//   current_streak: number;
//   longest_streak: number;
//   points_multiplier: number;
// }
```

#### Award Points
```typescript
const result = await PointsService.awardPoints(
  userId,
  100,
  'assessment_complete',
  'Completed assessment',
  { assessment_id: '123' }
);
// Returns: PointsAwardResult | null
// {
//   points_awarded: number;
//   total_points: number;
//   old_level: number;
//   new_level: number;
//   level_up: boolean;
// }
```

#### Update Streak
```typescript
const streakResult = await PointsService.updateStreak(userId);
// Returns: StreakUpdateResult | null
// {
//   current_streak: number;
//   longest_streak: number;
//   bonus_points: number;
//   multiplier: number;
// }
```

#### Get Transaction History
```typescript
const history = await PointsService.getTransactionHistory(userId, 50);
// Returns: PointTransaction[]
```

#### Get User Summary (All Metrics)
```typescript
const summary = await PointsService.getUserSummary(userId);
// Returns: {
//   progress: UserProgress;
//   levelTier: { name, color, min, max };
//   pointsToNextLevel: number;
//   levelProgress: number;
//   streakMultiplier: { multiplier, label, nextTier };
//   recentTransactions: PointTransaction[];
//   leaderboardStats: { totalPoints, level, rank, percentile };
// }
```

### Point Sources

Pre-built methods for common actions:

```typescript
// Assessment points
await PointsService.awardAssessmentPoints(userId, {
  type: 'complete',
  points: 100,
  metadata: { assessment_id: '123' }
});

// Types: 'complete', 'correct_answer', 'first_try', 'speed_bonus', 'perfect_score'

// Daily login bonus
const { streakUpdate, pointsAwarded } = await PointsService.awardDailyBonus(userId);

// Referral points
await PointsService.awardReferralPoints(referrerId, referredUserId);

// Social sharing points
await PointsService.awardSharePoints(userId, 'twitter');
```

### Level Calculation

```typescript
// Calculate level from points
const level = PointsService.calculateLevelFromPoints(10000);
// Returns: 10

// Calculate points needed for specific level
const pointsNeeded = PointsService.calculatePointsForLevel(20);
// Returns: 40000

// Get points to next level
const toNext = PointsService.getPointsToNextLevel(9500, 9);
// Returns: 500

// Get level progress percentage
const progress = PointsService.getLevelProgress(9500, 9);
// Returns: 90 (90% to level 10)
```

### Level Tiers

```typescript
const tier = PointsService.getLevelTier(25);
// Returns: {
//   min: 21,
//   max: 30,
//   name: 'Practitioner',
//   color: '#8b5cf6'
// }

// Available tiers:
// 1-10:   Novice (gray)
// 11-20:  Learner (blue)
// 21-30:  Practitioner (purple)
// 31-40:  Expert (orange)
// 41-50:  Master (red)
// 51+:    Legend (pink)
```

### Streak Multipliers

```typescript
const multiplier = PointsService.getStreakMultiplier(15);
// Returns: {
//   multiplier: 1.5,
//   label: '1.5x (14+ days)',
//   nextTier: { minStreak: 30, multiplier: 2.0 }
// }

// Multiplier tiers:
// 0-6 days:   1.0x
// 7-13 days:  1.25x
// 14-29 days: 1.5x
// 30+ days:   2.0x
```

### Example: Award Points After Assessment

```typescript
import { PointsService } from '@/services/gamification';

async function handleAssessmentSubmit(userId: string, results: any) {
  // Update streak (daily bonus)
  const streakResult = await PointsService.updateStreak(userId);

  // Award base completion points
  const basePoints = await PointsService.awardAssessmentPoints(userId, {
    type: 'complete',
    points: 100,
    metadata: { assessment_id: results.id }
  });

  // Award correct answer points
  if (results.isCorrect) {
    await PointsService.awardAssessmentPoints(userId, {
      type: 'correct_answer',
      points: 20,
      metadata: { question_id: results.questionId }
    });
  }

  // Check for level up
  if (basePoints?.level_up) {
    toast({
      title: '🎉 Level Up!',
      description: `You reached level ${basePoints.new_level}!`,
    });
  }
}
```

---

## 🏅 Leaderboard Service

### Import

```typescript
import { LeaderboardService } from '@/services/gamification';
```

### Core Methods

#### Get All Leaderboards
```typescript
const leaderboards = await LeaderboardService.getAll();
// Returns: Leaderboard[]
```

#### Get Leaderboard Entries (Top Users)
```typescript
const topUsers = await LeaderboardService.getTopEntries(leaderboardId, 10);
// Returns: LeaderboardEntry[]
```

#### Get User Position
```typescript
const position = await LeaderboardService.getUserPosition(userId, leaderboardId);
// Returns: UserLeaderboardPosition | null
// {
//   rank: number;
//   score: number;
//   total_entries: number;
//   percentile: number;
// }
```

#### Get Nearby Users (Context Ranking)
```typescript
const nearby = await LeaderboardService.getNearbyUsers(userId, leaderboardId, 5);
// Returns: {
//   above: LeaderboardEntry[];      // 5 users above
//   current: LeaderboardEntry;       // Current user
//   below: LeaderboardEntry[];       // 5 users below
// }
```

#### Get User Preferences
```typescript
const prefs = await LeaderboardService.getUserPreferences(userId);
// Returns: UserLeaderboardPreferences | null
```

#### Update Preferences
```typescript
await LeaderboardService.updateUserPreferences(userId, {
  opt_in: true,
  show_real_name: true,
  visible_to: 'all'
});
```

#### Opt In/Out
```typescript
await LeaderboardService.setOptIn(userId, true);
```

#### Refresh Leaderboard (Admin)
```typescript
await LeaderboardService.refreshLeaderboard(leaderboardId);
// Recalculates and caches rankings
```

#### Get Multiple Leaderboards with Entries
```typescript
const leaderboardsData = await LeaderboardService.getLeaderboardsWithEntries(10);
// Returns: Array<{
//   leaderboard: Leaderboard;
//   entries: LeaderboardEntry[];
// }>
```

#### Get User Positions Across All Leaderboards
```typescript
const positions = await LeaderboardService.getUserPositions(userId);
// Returns: Array<{
//   leaderboard: Leaderboard;
//   position: UserLeaderboardPosition;
// }>
```

### Default Leaderboards

6 pre-configured leaderboards:
1. **Global Champions** - All-time points
2. **Weekly Warriors** - This week's points
3. **Monthly Masters** - This month's points
4. **Ability Elite** - Highest ability scores
5. **Most Improved** - Biggest improvement
6. **Assessment Champions** - Most assessments completed

### Example: Display Leaderboard

```typescript
import { LeaderboardService } from '@/services/gamification';

async function DisplayLeaderboard({ leaderboardId }: { leaderboardId: string }) {
  const [leaderboard, topUsers, userPosition] = await Promise.all([
    LeaderboardService.getById(leaderboardId),
    LeaderboardService.getTopEntries(leaderboardId, 10),
    LeaderboardService.getUserPosition(userId, leaderboardId),
  ]);

  return (
    <div>
      <h2>{leaderboard.name}</h2>
      {topUsers.map((entry, index) => (
        <div key={entry.id}>
          #{entry.rank} - {entry.metadata.display_name} - {entry.score} points
        </div>
      ))}

      {userPosition && (
        <div>
          Your rank: #{userPosition.rank} (Top {userPosition.percentile}%)
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Common Workflows

### 1. User Completes Assessment

```typescript
import {
  AchievementService,
  PointsService,
  LeaderboardService
} from '@/services/gamification';

async function onAssessmentComplete(userId: string, assessment: any) {
  // 1. Update streak
  const streakResult = await PointsService.updateStreak(userId);

  // 2. Award points
  const pointsResult = await PointsService.awardAssessmentPoints(userId, {
    type: 'complete',
    points: 100,
    metadata: { assessment_id: assessment.id }
  });

  // 3. Check for achievements
  const newAchievements = await AchievementService.checkAndUnlock(userId, {
    action: 'assessment_completed',
    metadata: {
      score: assessment.score,
      completion_time_seconds: assessment.durationSeconds,
      ability_percentage: assessment.abilityScore * 10 + 50,
    }
  });

  // 4. Refresh leaderboards (optional, can be done via cron)
  // await LeaderboardService.refreshAllLeaderboards();

  // 5. Return results for UI
  return {
    pointsAwarded: pointsResult?.points_awarded,
    levelUp: pointsResult?.level_up,
    newLevel: pointsResult?.new_level,
    newAchievements: newAchievements.length,
    streakBonus: streakResult?.bonus_points,
  };
}
```

### 2. Display User Profile

```typescript
async function getUserProfileData(userId: string) {
  const [
    progress,
    summary,
    achievements,
    positions,
  ] = await Promise.all([
    PointsService.getUserProgress(userId),
    PointsService.getUserSummary(userId),
    AchievementService.getUserProgress(userId),
    LeaderboardService.getUserPositions(userId),
  ]);

  return {
    level: progress?.current_level,
    points: progress?.total_points,
    streak: progress?.current_streak,
    tier: summary.levelTier,
    achievements: achievements.unlocked,
    achievementPercentage: achievements.percentage,
    leaderboardRanks: positions,
  };
}
```

### 3. Daily Login Bonus

```typescript
async function handleDailyLogin(userId: string) {
  // Award daily bonus (includes streak update)
  const { streakUpdate, pointsAwarded } = await PointsService.awardDailyBonus(userId);

  // Check for streak achievements
  if (streakUpdate) {
    await AchievementService.checkAndUnlock(userId, {
      action: 'streak_updated',
      metadata: {
        current_streak: streakUpdate.current_streak,
        longest_streak: streakUpdate.longest_streak,
      }
    });
  }

  return {
    pointsEarned: pointsAwarded?.points_awarded,
    streak: streakUpdate?.current_streak,
    multiplier: streakUpdate?.multiplier,
  };
}
```

---

## 📊 Database Functions

SQL functions available for direct use:

```sql
-- Initialize user
SELECT initialize_user_progress('user-id');

-- Award points
SELECT award_points('user-id', 100, 'source', 'description', '{"key": "value"}'::jsonb);

-- Unlock achievement
SELECT unlock_achievement('user-id', 'achievement-id', '{"key": "value"}'::jsonb);

-- Update streak
SELECT update_user_streak('user-id');

-- Get leaderboard position
SELECT get_user_leaderboard_position('user-id', 'leaderboard-id');
```

---

## 🔒 Privacy & Security

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can view their own data
- Users can view public achievements/leaderboards
- Leaderboard visibility respects privacy settings

### User Privacy Controls

```typescript
// Opt out of leaderboards
await LeaderboardService.setOptIn(userId, false);

// Hide real name
await LeaderboardService.updateUserPreferences(userId, {
  show_real_name: false
});

// Limit visibility
await LeaderboardService.updateUserPreferences(userId, {
  visible_to: 'friends' // or 'team', 'none'
});
```

---

## 🧪 Testing

### Test Achievement Unlock

```typescript
import { AchievementService } from '@/services/gamification';

// Get achievement ID
const achievements = await AchievementService.getByCategory('completion');
const firstTimer = achievements.find(a => a.name === 'First Timer');

// Manually unlock for testing
if (firstTimer) {
  await AchievementService.unlock(userId, firstTimer.id);
}
```

### Test Points Award

```typescript
import { PointsService } from '@/services/gamification';

// Award test points
const result = await PointsService.awardPoints(
  userId,
  1000,
  'test',
  'Test points'
);

console.log(`Awarded ${result?.points_awarded} points`);
console.log(`New level: ${result?.new_level}`);
```

---

## 📚 Type Reference

### Achievement Types

```typescript
type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type AchievementCategory = 'completion' | 'performance' | 'streak' | 'social' | 'special';

interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  category: AchievementCategory;
  points_value: number;
  // ... more fields
}
```

### Points Types

```typescript
interface UserProgress {
  user_id: string;
  total_points: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  points_multiplier: number;
  // ... more fields
}

interface PointsAwardResult {
  points_awarded: number;
  total_points: number;
  old_level: number;
  new_level: number;
  level_up: boolean;
}
```

### Leaderboard Types

```typescript
type LeaderboardType = 'global' | 'industry' | 'role' | 'friends' | 'team';
type LeaderboardCriteria = 'points' | 'ability' | 'assessments' | 'streak' | 'improvement';
type TimePeriod = 'weekly' | 'monthly' | 'all_time';

interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;
  rank: number;
  score: number;
  metadata: {
    display_name?: string;
    avatar_url?: string;
    level?: number;
  };
}
```

---

## 🚀 Next Steps

1. **UI Components** - Create visual components for badges, leaderboards
2. **Integration** - Wire into assessment wizard
3. **Social Sharing** - Add share buttons
4. **Notifications** - Toast notifications for achievements
5. **Cron Jobs** - Automated leaderboard updates

---

**Services Status:** ✅ COMPLETE & TESTED
**TypeScript:** ✅ Passing
**Ready for:** UI Integration

---

*Last Updated: 2025-10-09*
*Version: 1.0.0*
