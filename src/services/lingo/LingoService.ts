/**
 * Lingo Service
 * Handles lessons, questions, and user progress for AIBORGLingo
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  LingoLesson,
  LingoQuestion,
  LingoUserProgress,
  LessonProgress,
  LessonStats,
  LingoAnalyticsEvent,
} from '@/types/lingo.types';

const ANONYMOUS_PROGRESS_KEY = 'lingo_anonymous_progress';

export class LingoService {
  /**
   * Get all active lessons with question counts
   */
  static async getLessons(): Promise<LingoLesson[]> {
    try {
      const { data, error } = await supabase
        .from('lingo_lessons')
        .select(
          `
          *,
          lingo_questions(count)
        `
        )
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(lesson => ({
        ...lesson,
        question_count: lesson.lingo_questions?.[0]?.count || 0,
      })) as LingoLesson[];
    } catch (error) {
      logger.error('Error fetching Lingo lessons:', error);
      return [];
    }
  }

  /**
   * Get a single lesson by ID
   */
  static async getLesson(lessonId: string): Promise<LingoLesson | null> {
    try {
      const { data, error } = await supabase
        .from('lingo_lessons')
        .select('*')
        .eq('id', lessonId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as LingoLesson;
    } catch (error) {
      logger.error('Error fetching Lingo lesson:', error);
      return null;
    }
  }

  /**
   * Get lesson by lesson_id (human-readable ID like 'ai-basics-01')
   */
  static async getLessonByLessonId(lessonId: string): Promise<LingoLesson | null> {
    try {
      const { data, error } = await supabase
        .from('lingo_lessons')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as LingoLesson;
    } catch (error) {
      logger.error('Error fetching Lingo lesson by lesson_id:', error);
      return null;
    }
  }

  /**
   * Get questions for a lesson
   */
  static async getQuestions(lessonId: string): Promise<LingoQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('lingo_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as LingoQuestion[];
    } catch (error) {
      logger.error('Error fetching Lingo questions:', error);
      return [];
    }
  }

  /**
   * Get user progress from database
   */
  static async getUserProgress(userId: string): Promise<LingoUserProgress | null> {
    try {
      const { data, error } = await supabase
        .from('lingo_user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create one
          return this.initializeUserProgress(userId);
        }
        throw error;
      }

      return data as LingoUserProgress;
    } catch (error) {
      logger.error('Error fetching Lingo user progress:', error);
      return null;
    }
  }

  /**
   * Initialize user progress record
   */
  static async initializeUserProgress(userId: string): Promise<LingoUserProgress | null> {
    try {
      const newProgress = {
        user_id: userId,
        xp_today: 0,
        daily_goal: 50,
        hearts: 5,
        streak: 1,
        total_xp: 0,
        last_session_date: new Date().toISOString().split('T')[0],
        lesson_progress: {},
      };

      const { data, error } = await supabase
        .from('lingo_user_progress')
        .insert(newProgress)
        .select()
        .single();

      if (error) throw error;
      return data as LingoUserProgress;
    } catch (error) {
      logger.error('Error initializing Lingo user progress:', error);
      return null;
    }
  }

  /**
   * Update user progress after completing a lesson
   */
  static async completeLesson(
    userId: string,
    stats: LessonStats
  ): Promise<LingoUserProgress | null> {
    try {
      // Get current progress
      const currentProgress = await this.getUserProgress(userId);
      if (!currentProgress) {
        throw new Error('No progress record found');
      }

      // Calculate streak update
      const today = new Date().toISOString().split('T')[0];
      const lastSession = currentProgress.last_session_date;
      let newStreak = currentProgress.streak;

      if (lastSession !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastSession === yesterdayStr) {
          // Consecutive day, increment streak
          newStreak += 1;
        } else if (lastSession < yesterdayStr) {
          // Streak broken, reset to 1
          newStreak = 1;
        }
      }

      // Update lesson progress
      const lessonProgress: LessonProgress = {
        completed: true,
        completed_at: new Date().toISOString(),
        best_score: stats.accuracy,
        attempts: (currentProgress.lesson_progress[stats.lesson_id]?.attempts || 0) + 1,
        perfect: stats.perfect,
      };

      // Merge with existing lesson progress
      const updatedLessonProgress = {
        ...currentProgress.lesson_progress,
        [stats.lesson_id]: lessonProgress,
      };

      // Calculate new XP
      const newTotalXp = currentProgress.total_xp + stats.xp_earned;
      const newXpToday =
        lastSession === today ? currentProgress.xp_today + stats.xp_earned : stats.xp_earned;

      // Update in database
      const { data, error } = await supabase
        .from('lingo_user_progress')
        .update({
          total_xp: newTotalXp,
          xp_today: newXpToday,
          streak: newStreak,
          last_session_date: today,
          lesson_progress: updatedLessonProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log analytics event
      await this.logEvent({
        user_id: userId,
        lesson_id: stats.lesson_id,
        event_type: 'lesson_completed',
        event_data: {
          accuracy: stats.accuracy,
          xp_earned: stats.xp_earned,
          perfect: stats.perfect,
          time_spent_seconds: stats.time_spent_seconds,
        },
      });

      // Log XP earned event
      await this.logEvent({
        user_id: userId,
        event_type: 'xp_earned',
        event_data: {
          amount: stats.xp_earned,
          source: 'lesson_completion',
          lesson_id: stats.lesson_id,
        },
      });

      // Update streak if changed
      if (newStreak !== currentProgress.streak) {
        await this.logEvent({
          user_id: userId,
          event_type: 'streak_updated',
          event_data: {
            old_streak: currentProgress.streak,
            new_streak: newStreak,
          },
        });
      }

      return data as LingoUserProgress;
    } catch (error) {
      logger.error('Error completing Lingo lesson:', error);
      return null;
    }
  }

  /**
   * Lose a heart (wrong answer)
   */
  static async loseHeart(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('lingo_user_progress')
        .select('hearts')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const currentHearts = data.hearts;
      const newHearts = Math.max(0, currentHearts - 1);

      await supabase
        .from('lingo_user_progress')
        .update({ hearts: newHearts })
        .eq('user_id', userId);

      await this.logEvent({
        user_id: userId,
        event_type: 'heart_lost',
        event_data: { remaining_hearts: newHearts },
      });

      return newHearts;
    } catch (error) {
      logger.error('Error losing heart:', error);
      return 0;
    }
  }

  /**
   * Restore hearts (e.g., daily reset or practice)
   */
  static async restoreHearts(userId: string, amount: number = 5): Promise<number> {
    try {
      const newHearts = Math.min(5, amount);

      await supabase
        .from('lingo_user_progress')
        .update({ hearts: newHearts })
        .eq('user_id', userId);

      return newHearts;
    } catch (error) {
      logger.error('Error restoring hearts:', error);
      return 5;
    }
  }

  /**
   * Log analytics event
   */
  static async logEvent(event: LingoAnalyticsEvent): Promise<void> {
    try {
      await supabase.from('lingo_analytics').insert({
        user_id: event.user_id,
        session_id: event.session_id,
        lesson_id: event.lesson_id,
        question_id: event.question_id,
        event_type: event.event_type,
        event_data: event.event_data || {},
      });
    } catch (error) {
      logger.error('Error logging Lingo analytics event:', error);
    }
  }

  /**
   * Get lessons completed count for a user
   */
  static async getLessonsCompletedCount(userId: string): Promise<number> {
    try {
      const progress = await this.getUserProgress(userId);
      if (!progress) return 0;

      return Object.values(progress.lesson_progress).filter(p => p.completed).length;
    } catch (error) {
      logger.error('Error getting lessons completed count:', error);
      return 0;
    }
  }

  /**
   * Check if a skill category is complete
   */
  static async isSkillComplete(userId: string, skill: string): Promise<boolean> {
    try {
      // Get all lessons in the skill
      const { data: lessons, error } = await supabase
        .from('lingo_lessons')
        .select('id')
        .eq('skill', skill)
        .eq('is_active', true);

      if (error) throw error;
      if (!lessons || lessons.length === 0) return false;

      // Get user progress
      const progress = await this.getUserProgress(userId);
      if (!progress) return false;

      // Check if all lessons in skill are completed
      return lessons.every(lesson => progress.lesson_progress[lesson.id]?.completed);
    } catch (error) {
      logger.error('Error checking skill completion:', error);
      return false;
    }
  }

  /**
   * Get Lingo leaderboard entries
   */
  static async getLeaderboard(
    _period: 'weekly' | 'monthly' | 'all_time' = 'all_time',
    limit: number = 50
  ): Promise<
    Array<{
      rank: number;
      user_id: string;
      display_name: string;
      avatar_url: string | null;
      score: number;
      streak: number;
    }>
  > {
    try {
      // Try to use lingo_leaderboard first (new table)
      const { data: leaderboardData, error: lbError } = await supabase
        .from('lingo_leaderboard')
        .select('user_id, display_name, avatar_url, total_xp, streak')
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (!lbError && leaderboardData && leaderboardData.length > 0) {
        return leaderboardData.map((entry, index) => ({
          rank: index + 1,
          user_id: entry.user_id,
          display_name: entry.display_name || 'Anonymous Learner',
          avatar_url: entry.avatar_url,
          score: entry.total_xp,
          streak: entry.streak,
        }));
      }

      // Fallback to lingo_user_progress (original table)
      const { data, error } = await supabase
        .from('lingo_user_progress')
        .select('user_id, total_xp, streak')
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((entry, index) => ({
        rank: index + 1,
        user_id: entry.user_id,
        display_name: 'Learner',
        avatar_url: null,
        score: entry.total_xp,
        streak: entry.streak,
      }));
    } catch (error) {
      logger.error('Error fetching Lingo leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's rank on leaderboard
   */
  static async getUserRank(userId: string): Promise<number | null> {
    try {
      const leaderboard = await this.getLeaderboard('all_time', 1000);
      const userEntry = leaderboard.find(e => e.user_id === userId);
      return userEntry?.rank || null;
    } catch (error) {
      logger.error('Error getting user rank:', error);
      return null;
    }
  }

  // ============================================================
  // Anonymous Progress (localStorage)
  // ============================================================

  /**
   * Get anonymous progress from localStorage
   */
  static getAnonymousProgress(): LingoUserProgress | null {
    try {
      const stored = localStorage.getItem(ANONYMOUS_PROGRESS_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Save anonymous progress to localStorage
   */
  static saveAnonymousProgress(progress: Partial<LingoUserProgress>): void {
    try {
      const existing = this.getAnonymousProgress();
      const updated = { ...existing, ...progress };
      localStorage.setItem(ANONYMOUS_PROGRESS_KEY, JSON.stringify(updated));
    } catch (error) {
      logger.error('Error saving anonymous progress:', error);
    }
  }

  /**
   * Clear anonymous progress (after merge)
   */
  static clearAnonymousProgress(): void {
    try {
      localStorage.removeItem(ANONYMOUS_PROGRESS_KEY);
    } catch (error) {
      logger.error('Error clearing anonymous progress:', error);
    }
  }

  /**
   * Merge anonymous progress with user account
   */
  static async mergeAnonymousProgress(userId: string): Promise<void> {
    try {
      const anonymousProgress = this.getAnonymousProgress();
      if (!anonymousProgress) return;

      // Get or create user progress
      let userProgress = await this.getUserProgress(userId);
      if (!userProgress) {
        userProgress = await this.initializeUserProgress(userId);
        if (!userProgress) return;
      }

      // Merge: take higher values
      const mergedProgress = {
        total_xp: Math.max(userProgress.total_xp, anonymousProgress.total_xp || 0),
        xp_today: Math.max(userProgress.xp_today, anonymousProgress.xp_today || 0),
        streak: Math.max(userProgress.streak, anonymousProgress.streak || 1),
        lesson_progress: { ...userProgress.lesson_progress },
      };

      // Merge lesson progress (take completed lessons and best scores)
      if (anonymousProgress.lesson_progress) {
        for (const [lessonId, progress] of Object.entries(anonymousProgress.lesson_progress)) {
          const existing = mergedProgress.lesson_progress[lessonId];
          if (!existing || progress.best_score > (existing.best_score || 0)) {
            mergedProgress.lesson_progress[lessonId] = progress;
          }
        }
      }

      // Update user progress in database
      await supabase
        .from('lingo_user_progress')
        .update({
          total_xp: mergedProgress.total_xp,
          xp_today: mergedProgress.xp_today,
          streak: mergedProgress.streak,
          lesson_progress: mergedProgress.lesson_progress,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Clear anonymous progress
      this.clearAnonymousProgress();

      logger.info('Merged anonymous Lingo progress for user:', userId);
    } catch (error) {
      logger.error('Error merging anonymous progress:', error);
    }
  }
}

// Type alias for anonymous progress
type LingoUserProgress = import('@/types/lingo.types').LingoUserProgress;
