/**
 * Gamification Configuration
 * AIBORG Points, Levels, Badges, and Rewards
 */

export const GAMIFICATION_CONFIG = {
  /**
   * Points awarded for various activities
   */
  POINTS: {
    // Quizzes
    QUIZ_COMPLETION: 50,
    QUIZ_PERFECT_SCORE_BONUS: 25,
    QUIZ_FIRST_ATTEMPT_BONUS: 10,

    // Exercises
    EXERCISE_SUBMISSION: 100,
    EXERCISE_PERFECT_SCORE_BONUS: 50,
    EXERCISE_EARLY_SUBMISSION_BONUS: 20,

    // Workshops
    WORKSHOP_PARTICIPATION: 200,
    WORKSHOP_LEADER_BONUS: 50,
    WORKSHOP_COMPLETION_BONUS: 30,

    // Assessments
    ASSESSMENT_COMPLETION: 150,
    ASSESSMENT_HIGH_SCORE_BONUS: 75, // Score > 80%

    // Engagement
    DAILY_STREAK: 10,
    WEEKLY_STREAK: 50,
    MONTHLY_STREAK: 200,
    FIRST_LOGIN_OF_DAY: 5,

    // Social
    HELP_ANOTHER_STUDENT: 15,
    SHARE_RESOURCE: 10,
    PEER_REVIEW: 25,

    // Content
    COMPLETE_VIDEO: 5,
    COMPLETE_READING: 10,
    TAKE_NOTES: 5,
  },

  /**
   * Level system - Journey to becoming an AIBORG
   */
  LEVELS: [
    {
      level: 1,
      name: 'AI Newbie',
      minPoints: 0,
      maxPoints: 99,
      icon: '🌱',
      color: '#10b981',
      description: 'Just started your AI augmentation journey',
    },
    {
      level: 2,
      name: 'AI Explorer',
      minPoints: 100,
      maxPoints: 499,
      icon: '🔍',
      color: '#3b82f6',
      description: 'Exploring the possibilities of AI',
    },
    {
      level: 3,
      name: 'AI Apprentice',
      minPoints: 500,
      maxPoints: 999,
      icon: '🎓',
      color: '#8b5cf6',
      description: 'Learning the fundamentals of AI augmentation',
    },
    {
      level: 4,
      name: 'AI Practitioner',
      minPoints: 1000,
      maxPoints: 2499,
      icon: '⚡',
      color: '#f59e0b',
      description: 'Applying AI in your daily work',
    },
    {
      level: 5,
      name: 'Augmented Human',
      minPoints: 2500,
      maxPoints: 4999,
      icon: '🤖',
      color: '#ec4899',
      description: 'Significantly enhanced by AI tools',
    },
    {
      level: 6,
      name: 'AIBORG',
      minPoints: 5000,
      maxPoints: 9999,
      icon: '🦾',
      color: '#ef4444',
      description: 'Fully AI-augmented professional',
    },
    {
      level: 7,
      name: 'AIBORG Master',
      minPoints: 10000,
      maxPoints: Infinity,
      icon: '👑',
      color: '#fbbf24',
      description: 'Master of AI augmentation, teaching others',
    },
  ] as const,

  /**
   * Achievement badges
   */
  BADGES: {
    // Quiz badges
    FIRST_QUIZ: {
      id: 'first_quiz',
      name: 'Quiz Taker',
      icon: '📝',
      description: 'Completed your first quiz',
      category: 'quiz',
      rarity: 'common',
      points: 10,
      criteria: { quizzes_completed: 1 },
    },
    QUIZ_STREAK_5: {
      id: 'quiz_streak_5',
      name: 'Quiz Enthusiast',
      icon: '📚',
      description: 'Completed 5 quizzes',
      category: 'quiz',
      rarity: 'common',
      points: 25,
      criteria: { quizzes_completed: 5 },
    },
    QUIZ_STREAK_10: {
      id: 'quiz_streak_10',
      name: 'Quiz Master',
      icon: '🏆',
      description: 'Completed 10 quizzes',
      category: 'quiz',
      rarity: 'rare',
      points: 50,
      criteria: { quizzes_completed: 10 },
    },
    PERFECT_QUIZ: {
      id: 'perfect_quiz',
      name: 'Perfectionist',
      icon: '⭐',
      description: 'Scored 100% on a quiz',
      category: 'quiz',
      rarity: 'rare',
      points: 40,
      criteria: { perfect_quiz_score: 1 },
    },
    PERFECT_QUIZ_3: {
      id: 'perfect_quiz_3',
      name: 'Triple Perfect',
      icon: '🌟',
      description: 'Scored 100% on 3 quizzes',
      category: 'quiz',
      rarity: 'epic',
      points: 100,
      criteria: { perfect_quiz_score: 3 },
    },

    // Exercise badges
    FIRST_EXERCISE: {
      id: 'first_exercise',
      name: 'Hands-On Learner',
      icon: '💪',
      description: 'Submitted your first exercise',
      category: 'exercise',
      rarity: 'common',
      points: 20,
      criteria: { exercises_submitted: 1 },
    },
    EXERCISE_STREAK_5: {
      id: 'exercise_streak_5',
      name: 'Practice Makes Perfect',
      icon: '🎯',
      description: 'Submitted 5 exercises',
      category: 'exercise',
      rarity: 'rare',
      points: 50,
      criteria: { exercises_submitted: 5 },
    },
    EARLY_SUBMITTER: {
      id: 'early_submitter',
      name: 'Early Bird',
      icon: '🐦',
      description: 'Submitted an exercise early',
      category: 'exercise',
      rarity: 'common',
      points: 15,
      criteria: { early_submissions: 1 },
    },

    // Workshop badges
    FIRST_WORKSHOP: {
      id: 'first_workshop',
      name: 'Team Player',
      icon: '👥',
      description: 'Participated in your first workshop',
      category: 'workshop',
      rarity: 'common',
      points: 30,
      criteria: { workshops_attended: 1 },
    },
    WORKSHOP_LEADER: {
      id: 'workshop_leader',
      name: 'Natural Leader',
      icon: '🎖️',
      description: 'Led a workshop group',
      category: 'workshop',
      rarity: 'rare',
      points: 60,
      criteria: { workshops_led: 1 },
    },
    WORKSHOP_VETERAN: {
      id: 'workshop_veteran',
      name: 'Collaboration Expert',
      icon: '🤝',
      description: 'Participated in 5 workshops',
      category: 'workshop',
      rarity: 'epic',
      points: 150,
      criteria: { workshops_attended: 5 },
    },

    // Streak badges
    WEEK_STREAK: {
      id: 'week_streak',
      name: 'Consistent Learner',
      icon: '🔥',
      description: '7-day learning streak',
      category: 'streak',
      rarity: 'rare',
      points: 75,
      criteria: { streak_days: 7 },
    },
    MONTH_STREAK: {
      id: 'month_streak',
      name: 'Dedicated Student',
      icon: '💎',
      description: '30-day learning streak',
      category: 'streak',
      rarity: 'epic',
      points: 300,
      criteria: { streak_days: 30 },
    },

    // Course completion badges
    FIRST_COURSE: {
      id: 'first_course',
      name: 'Course Completer',
      icon: '🎓',
      description: 'Completed your first course',
      category: 'course',
      rarity: 'common',
      points: 100,
      criteria: { courses_completed: 1 },
    },
    COURSE_STREAK_3: {
      id: 'course_streak_3',
      name: 'Learning Machine',
      icon: '🚀',
      description: 'Completed 3 courses',
      category: 'course',
      rarity: 'epic',
      points: 300,
      criteria: { courses_completed: 3 },
    },

    // Speed badges
    SPEED_DEMON: {
      id: 'speed_demon',
      name: 'Speed Demon',
      icon: '⚡',
      description: 'Completed a quiz in record time',
      category: 'achievement',
      rarity: 'rare',
      points: 30,
      criteria: { fast_quiz_completion: 1 },
    },

    // Special badges
    NIGHT_OWL: {
      id: 'night_owl',
      name: 'Night Owl',
      icon: '🦉',
      description: 'Completed activities late at night',
      category: 'special',
      rarity: 'rare',
      points: 20,
      criteria: { night_activities: 5 },
    },
    EARLY_BIRD: {
      id: 'early_bird_learner',
      name: 'Early Bird',
      icon: '🌅',
      description: 'Completed activities early in the morning',
      category: 'special',
      rarity: 'rare',
      points: 20,
      criteria: { morning_activities: 5 },
    },
    WEEKEND_WARRIOR: {
      id: 'weekend_warrior',
      name: 'Weekend Warrior',
      icon: '🎯',
      description: 'Active learner on weekends',
      category: 'special',
      rarity: 'rare',
      points: 25,
      criteria: { weekend_activities: 10 },
    },
  } as const,

  /**
   * Badge rarity colors and labels
   */
  RARITY: {
    common: {
      label: 'Common',
      color: '#9ca3af',
      glow: 'shadow-gray-500/50',
    },
    rare: {
      label: 'Rare',
      color: '#3b82f6',
      glow: 'shadow-blue-500/50',
    },
    epic: {
      label: 'Epic',
      color: '#a855f7',
      glow: 'shadow-purple-500/50',
    },
    legendary: {
      label: 'Legendary',
      color: '#f59e0b',
      glow: 'shadow-amber-500/50',
    },
  } as const,

  /**
   * Leaderboard configuration
   */
  LEADERBOARD: {
    WEEKLY_TOP: 10,
    MONTHLY_TOP: 20,
    ALL_TIME_TOP: 50,
    SHOW_RANK_ICONS: true,
    RANKS: {
      1: '🥇',
      2: '🥈',
      3: '🥉',
    },
  },

  /**
   * Notification templates
   */
  NOTIFICATIONS: {
    POINTS_EARNED: (points: number, source: string) =>
      `🎉 You earned ${points} AIBORG Points from ${source}!`,
    LEVEL_UP: (newLevel: string) => `⭐ Level up! You're now ${newLevel}!`,
    BADGE_UNLOCKED: (badgeName: string) => `🏆 New badge unlocked: ${badgeName}!`,
    STREAK_MILESTONE: (days: number) => `🔥 ${days}-day streak! Keep it going!`,
    QUIZ_PASSED: (quizName: string, score: number) => `✅ Quiz passed: ${quizName} (${score}%)`,
    EXERCISE_GRADED: (exerciseName: string, score: number) =>
      `📊 Exercise graded: ${exerciseName} (${score}%)`,
    WORKSHOP_REMINDER: (workshopName: string, hours: number) =>
      `⏰ Workshop "${workshopName}" starts in ${hours} hours!`,
  },
} as const;

/**
 * Helper function to get level info from points
 */
export function getLevelInfo(totalPoints: number) {
  const level = GAMIFICATION_CONFIG.LEVELS.find(
    l => totalPoints >= l.minPoints && totalPoints <= l.maxPoints
  );

  if (!level) return GAMIFICATION_CONFIG.LEVELS[0]; // Default to level 1

  const nextLevel = GAMIFICATION_CONFIG.LEVELS.find(l => l.level === level.level + 1);
  const progress = nextLevel
    ? ((totalPoints - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100
    : 100;

  return {
    ...level,
    progress: Math.min(100, Math.max(0, progress)),
    pointsToNextLevel: nextLevel ? nextLevel.minPoints - totalPoints : 0,
    nextLevel: nextLevel || null,
  };
}

/**
 * Helper function to get badge info
 */
export function getBadgeInfo(badgeId: string) {
  const badges = Object.values(GAMIFICATION_CONFIG.BADGES);
  return badges.find(b => b.id === badgeId) || null;
}

/**
 * Helper function to check if user earned a badge
 */
export function checkBadgeEarned(badgeId: string, userStats: Record<string, number>): boolean {
  const badge = getBadgeInfo(badgeId);
  if (!badge) return false;

  return Object.entries(badge.criteria).every(([key, value]) => {
    return (userStats[key] || 0) >= value;
  });
}

/**
 * Helper function to calculate points for quiz
 */
export function calculateQuizPoints(
  basePoints: number,
  scorePercentage: number,
  isPerfectScore: boolean,
  isFirstAttempt: boolean
): number {
  let points = basePoints;

  if (isPerfectScore) {
    points += GAMIFICATION_CONFIG.POINTS.QUIZ_PERFECT_SCORE_BONUS;
  }

  if (isFirstAttempt && scorePercentage >= 70) {
    points += GAMIFICATION_CONFIG.POINTS.QUIZ_FIRST_ATTEMPT_BONUS;
  }

  return points;
}

/**
 * Helper function to calculate points for exercise
 */
export function calculateExercisePoints(
  basePoints: number,
  scorePercentage: number,
  isPerfectScore: boolean,
  isEarlySubmission: boolean
): number {
  let points = basePoints;

  if (isPerfectScore) {
    points += GAMIFICATION_CONFIG.POINTS.EXERCISE_PERFECT_SCORE_BONUS;
  }

  if (isEarlySubmission) {
    points += GAMIFICATION_CONFIG.POINTS.EXERCISE_EARLY_SUBMISSION_BONUS;
  }

  return points;
}

/**
 * Helper function to get rarity styling
 */
export function getRarityStyle(rarity: keyof typeof GAMIFICATION_CONFIG.RARITY) {
  return GAMIFICATION_CONFIG.RARITY[rarity];
}

export type GamificationConfig = typeof GAMIFICATION_CONFIG;
export type LevelInfo = (typeof GAMIFICATION_CONFIG.LEVELS)[number];
export type BadgeInfo =
  (typeof GAMIFICATION_CONFIG.BADGES)[keyof typeof GAMIFICATION_CONFIG.BADGES];
export type BadgeRarity = keyof typeof GAMIFICATION_CONFIG.RARITY;
