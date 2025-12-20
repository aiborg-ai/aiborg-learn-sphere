/**
 * Notification Scheduler Service
 * Smart notifications system for study reminders, deadlines, and motivational messages
 * Respects user preferences for timing and frequency
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { StudyPlanGeneratorService } from '../study-planner/StudyPlanGeneratorService';
import { addHours, addDays, isBefore, format, startOfDay } from 'date-fns';

export type NotificationType =
  | 'study_reminder'
  | 'deadline_alert'
  | 'achievement'
  | 'encouragement'
  | 'milestone'
  | 'streak'
  | 'recommendation';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationPreferences {
  user_id: string;
  enable_study_reminders: boolean;
  enable_deadline_alerts: boolean;
  enable_achievements: boolean;
  enable_encouragement: boolean;
  preferred_reminder_times: string[]; // ['09:00', '14:00', '19:00']
  quiet_hours_start?: string; // '22:00'
  quiet_hours_end?: string; // '07:00'
  frequency: 'high' | 'medium' | 'low'; // high = multiple/day, medium = daily, low = weekly
  notification_channels: ('in_app' | 'email' | 'push')[]; // Future: email and push
}

export interface ScheduledNotification {
  id?: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  scheduled_for: string; // ISO datetime
  metadata?: Record<string, unknown>;
  delivered: boolean;
  delivered_at?: string;
  created_at?: string;
}

export class NotificationScheduler {
  /**
   * Get or create user notification preferences
   */
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_ai_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Return defaults if no preferences exist
        return {
          user_id: userId,
          enable_study_reminders: true,
          enable_deadline_alerts: true,
          enable_achievements: true,
          enable_encouragement: true,
          preferred_reminder_times: ['09:00', '19:00'], // Morning and evening
          quiet_hours_start: '22:00',
          quiet_hours_end: '07:00',
          frequency: 'medium',
          notification_channels: ['in_app'],
        };
      }

      return {
        user_id: data.user_id,
        enable_study_reminders: data.enable_study_reminders ?? true,
        enable_deadline_alerts: data.enable_deadline_alerts ?? true,
        enable_achievements: data.enable_achievements ?? true,
        enable_encouragement: data.enable_encouragement ?? true,
        preferred_reminder_times: data.preferred_reminder_times || ['09:00', '19:00'],
        quiet_hours_start: data.quiet_hours_start,
        quiet_hours_end: data.quiet_hours_end,
        frequency: data.notification_frequency || 'medium',
        notification_channels: data.notification_channels || ['in_app'],
      };
    } catch (error) {
      logger.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  static async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const { error } = await supabase.from('user_ai_preferences').upsert({
        user_id: userId,
        enable_study_reminders: preferences.enable_study_reminders,
        enable_deadline_alerts: preferences.enable_deadline_alerts,
        enable_achievements: preferences.enable_achievements,
        enable_encouragement: preferences.enable_encouragement,
        preferred_reminder_times: preferences.preferred_reminder_times,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        notification_frequency: preferences.frequency,
        notification_channels: preferences.notification_channels,
      });

      if (error) {
        throw error;
      }

      logger.info('Notification preferences updated', { userId });
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Schedule study reminder for today's tasks
   */
  static async scheduleStudyReminder(userId: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);

      if (!preferences.enable_study_reminders) {
        return; // User has disabled study reminders
      }

      // Get today's tasks
      const studyPlan = await StudyPlanGeneratorService.getActiveStudyPlan(userId);
      if (!studyPlan) {
        return; // No active study plan
      }

      const today = new Date();
      const todayDayName = format(today, 'EEEE').toLowerCase();

      // Find current week and today's tasks
      const currentWeek = studyPlan.weekly_schedules.find(week => {
        const weekStart = new Date(week.week_start_date);
        const weekEnd = new Date(week.week_end_date);
        return today >= weekStart && today <= weekEnd;
      });

      if (!currentWeek) {
        return; // Not in current week range
      }

      const todayTasks = currentWeek.daily_tasks[todayDayName] || [];
      const incompleteTasks = todayTasks.filter(t => !t.completed);

      if (incompleteTasks.length === 0) {
        return; // All tasks completed
      }

      // Schedule reminder for preferred time
      const nextReminderTime = this.getNextReminderTime(preferences);
      if (!nextReminderTime) {
        return; // Outside reminder window
      }

      // Create notification
      const totalMinutes = incompleteTasks.reduce((sum, t) => sum + t.estimated_minutes, 0);

      await this.createNotification({
        user_id: userId,
        type: 'study_reminder',
        title: `Time to Study! ${incompleteTasks.length} task${incompleteTasks.length > 1 ? 's' : ''} waiting`,
        message: `You have ${incompleteTasks.length} task${incompleteTasks.length > 1 ? 's' : ''} scheduled for today (${totalMinutes} minutes total). Let's make progress on your learning goals!`,
        priority: 'medium',
        scheduled_for: nextReminderTime.toISOString(),
        metadata: {
          task_count: incompleteTasks.length,
          total_minutes: totalMinutes,
          plan_id: studyPlan.id,
        },
        delivered: false,
      });

      logger.info('Study reminder scheduled', {
        userId,
        scheduledFor: nextReminderTime,
        taskCount: incompleteTasks.length,
      });
    } catch (error) {
      logger.error('Error scheduling study reminder:', error);
    }
  }

  /**
   * Schedule deadline alert
   */
  static async scheduleDeadlineAlert(
    userId: string,
    deadlineDate: Date,
    itemTitle: string,
    itemType: 'assignment' | 'quiz' | 'course' | 'goal'
  ): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);

      if (!preferences.enable_deadline_alerts) {
        return;
      }

      const now = new Date();
      const daysUntilDeadline = Math.ceil(
        (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Schedule alerts at 3 days, 1 day, and 1 hour before
      const alertIntervals = [
        { days: 3, priority: 'medium' as NotificationPriority, message: '3 days left' },
        { days: 1, priority: 'high' as NotificationPriority, message: '1 day left' },
        { hours: 1, priority: 'urgent' as NotificationPriority, message: '1 hour left' },
      ];

      for (const interval of alertIntervals) {
        let scheduledTime: Date;

        if (interval.days) {
          if (daysUntilDeadline <= interval.days) {
            continue; // Too late for this alert
          }
          scheduledTime = addDays(deadlineDate, -interval.days);
        } else if (interval.hours) {
          scheduledTime = addHours(deadlineDate, -interval.hours);
        } else {
          continue;
        }

        // Don't schedule in the past
        if (isBefore(scheduledTime, now)) {
          continue;
        }

        await this.createNotification({
          user_id: userId,
          type: 'deadline_alert',
          title: `⏰ Deadline Approaching: ${itemTitle}`,
          message: `Your ${itemType} "${itemTitle}" is due in ${interval.message}. Make sure you're on track!`,
          priority: interval.priority,
          scheduled_for: scheduledTime.toISOString(),
          metadata: {
            deadline: deadlineDate.toISOString(),
            item_type: itemType,
            item_title: itemTitle,
          },
          delivered: false,
        });
      }

      logger.info('Deadline alerts scheduled', { userId, deadline: deadlineDate });
    } catch (error) {
      logger.error('Error scheduling deadline alert:', error);
    }
  }

  /**
   * Send achievement notification
   */
  static async sendAchievementNotification(
    userId: string,
    achievementTitle: string,
    achievementDescription: string,
    points?: number
  ): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);

      if (!preferences.enable_achievements) {
        return;
      }

      await this.createNotification({
        user_id: userId,
        type: 'achievement',
        title: `🏆 Achievement Unlocked: ${achievementTitle}`,
        message: `${achievementDescription}${points ? ` You earned ${points} points!` : ''}`,
        priority: 'medium',
        scheduled_for: new Date().toISOString(),
        metadata: {
          achievement: achievementTitle,
          points,
        },
        delivered: false,
      });

      logger.info('Achievement notification sent', { userId, achievement: achievementTitle });
    } catch (error) {
      logger.error('Error sending achievement notification:', error);
    }
  }

  /**
   * Send encouragement notification
   */
  static async sendEncouragement(
    userId: string,
    context: 'low_activity' | 'streak' | 'milestone' | 'struggling'
  ): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);

      if (!preferences.enable_encouragement) {
        return;
      }

      const messages: Record<typeof context, { title: string; message: string }> = {
        low_activity: {
          title: '📚 We Miss You!',
          message:
            "It's been a while since your last study session. Even 15 minutes can make a difference. Ready to jump back in?",
        },
        streak: {
          title: '🔥 Amazing Streak!',
          message:
            "You're on fire! Keep up this fantastic learning momentum. Your consistency is impressive!",
        },
        milestone: {
          title: '🎯 Milestone Reached!',
          message:
            "You've reached an important milestone in your learning journey. Celebrate your progress and keep going!",
        },
        struggling: {
          title: "💪 Don't Give Up!",
          message:
            "Challenging topics are part of growth. Remember, every expert was once a beginner. You've got this!",
        },
      };

      const notification = messages[context];

      await this.createNotification({
        user_id: userId,
        type: 'encouragement',
        title: notification.title,
        message: notification.message,
        priority: 'low',
        scheduled_for: new Date().toISOString(),
        metadata: { context },
        delivered: false,
      });

      logger.info('Encouragement notification sent', { userId, context });
    } catch (error) {
      logger.error('Error sending encouragement:', error);
    }
  }

  /**
   * Get next reminder time based on preferences
   */
  private static getNextReminderTime(preferences: NotificationPreferences): Date | null {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // Check if in quiet hours
    if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
      const quietStart = this.parseTime(preferences.quiet_hours_start);
      const quietEnd = this.parseTime(preferences.quiet_hours_end);

      if (quietStart > quietEnd) {
        // Quiet hours span midnight
        if (currentTimeMinutes >= quietStart || currentTimeMinutes < quietEnd) {
          return null; // In quiet hours
        }
      } else {
        if (currentTimeMinutes >= quietStart && currentTimeMinutes < quietEnd) {
          return null; // In quiet hours
        }
      }
    }

    // Find next preferred reminder time
    const preferredTimes = preferences.preferred_reminder_times
      .map(time => this.parseTime(time))
      .sort((a, b) => a - b);

    for (const timeMinutes of preferredTimes) {
      if (timeMinutes > currentTimeMinutes) {
        // Found next reminder time today
        const reminderTime = new Date(now);
        reminderTime.setHours(Math.floor(timeMinutes / 60));
        reminderTime.setMinutes(timeMinutes % 60);
        reminderTime.setSeconds(0);
        return reminderTime;
      }
    }

    // No more times today, schedule for tomorrow's first time
    if (preferredTimes.length > 0) {
      const tomorrow = addDays(startOfDay(now), 1);
      tomorrow.setHours(Math.floor(preferredTimes[0] / 60));
      tomorrow.setMinutes(preferredTimes[0] % 60);
      return tomorrow;
    }

    return null;
  }

  /**
   * Parse time string (HH:MM) to minutes since midnight
   */
  private static parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Create notification record
   */
  private static async createNotification(notification: ScheduledNotification): Promise<void> {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        metadata: notification.metadata,
        read: false,
        created_at: notification.scheduled_for,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get pending notifications for user
   */
  static async getPendingNotifications(userId: string): Promise<ScheduledNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching pending notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        throw error;
      }

      logger.info('All notifications marked as read', { userId });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Background job: Schedule daily study reminders for all users
   * This would typically run via a cron job or edge function scheduler
   */
  static async scheduleDailyReminders(): Promise<void> {
    try {
      // Get all users with active study plans
      const { data: users, error } = await supabase
        .from('ai_study_plans')
        .select('user_id')
        .eq('status', 'active')
        .not('user_id', 'is', null);

      if (error) {
        throw error;
      }

      if (!users || users.length === 0) {
        return;
      }

      // Get unique user IDs
      const uniqueUserIds = [...new Set(users.map(u => u.user_id))];

      // Schedule reminders for each user
      for (const userId of uniqueUserIds) {
        await this.scheduleStudyReminder(userId);
      }

      logger.info('Daily reminders scheduled', { userCount: uniqueUserIds.length });
    } catch (error) {
      logger.error('Error scheduling daily reminders:', error);
    }
  }
}
