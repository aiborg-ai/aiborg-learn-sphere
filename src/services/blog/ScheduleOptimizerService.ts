/**
 * Schedule Optimizer Service
 * Provides intelligent scheduling algorithms and analytics
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { ScheduleAnalytics, ScheduleGap } from '@/types/blog-scheduler';

export class ScheduleOptimizerService {
  /**
   * Distribute posts evenly across a date range
   */
  static distributeSchedule(
    startDate: Date,
    postCount: number,
    frequency: 'daily' | 'weekly' | 'biweekly',
    preferredTime: string
  ): Date[] {
    const schedules: Date[] = [];
    const intervalDays = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 14;

    // Parse preferred time (HH:mm format)
    const [hours, minutes] = preferredTime.split(':').map(Number);

    for (let i = 0; i < postCount; i++) {
      const scheduleDate = new Date(startDate);
      scheduleDate.setDate(scheduleDate.getDate() + i * intervalDays);

      // Set preferred time
      scheduleDate.setHours(hours, minutes, 0, 0);

      schedules.push(scheduleDate);
    }

    return schedules;
  }

  /**
   * Analyze existing publishing pattern
   */
  static async analyzePublishingPattern(): Promise<ScheduleAnalytics> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get scheduled posts
    const { data: allScheduled, error: scheduledError } = await supabase
      .from('blog_posts')
      .select('id, scheduled_for, published_at')
      .eq('status', 'scheduled');

    const { data: publishedThisWeek, error: weekError } = await supabase
      .from('blog_posts')
      .select('id, published_at')
      .eq('status', 'published')
      .gte('published_at', oneWeekAgo.toISOString());

    const { data: publishedThisMonth, error: monthError } = await supabase
      .from('blog_posts')
      .select('id, published_at')
      .eq('status', 'published')
      .gte('published_at', oneMonthAgo.toISOString());

    if (scheduledError || weekError || monthError) {
      logger.error('Error analyzing publishing pattern');
      throw new Error('Failed to analyze publishing pattern');
    }

    const total_scheduled = allScheduled?.length || 0;
    const posts_this_week = publishedThisWeek?.length || 0;
    const posts_this_month = publishedThisMonth?.length || 0;

    // Calculate busiest day and hour
    const dayCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};

    publishedThisMonth?.forEach(post => {
      const date = new Date(post.published_at);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();

      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const busiest_day =
      Object.keys(dayCounts).length > 0
        ? Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'Monday';

    const busiest_hour =
      Object.keys(hourCounts).length > 0
        ? parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0])
        : 9;

    // Calculate average posts per week (based on last month)
    const average_posts_per_week =
      posts_this_month > 0 ? Math.round((posts_this_month / 30) * 7 * 10) / 10 : 0;

    // Recommend posting times (opposite of busiest to distribute evenly)
    const recommended_posting_times = this.getRecommendedPostingTimes(busiest_hour);

    return {
      total_scheduled,
      posts_this_week,
      posts_this_month,
      busiest_day,
      busiest_hour,
      average_posts_per_week,
      recommended_posting_times,
    };
  }

  /**
   * Get recommended posting times to avoid clustering
   */
  private static getRecommendedPostingTimes(busiestHour: number): string[] {
    // Suggest times that are spread throughout the day, avoiding busiest hour
    const recommendedHours = [9, 12, 15, 18];

    // If busiest hour is in recommended list, replace it
    const index = recommendedHours.indexOf(busiestHour);
    if (index !== -1) {
      // Replace with an alternative hour
      const alternatives = [10, 13, 16, 19];
      recommendedHours[index] = alternatives[index];
    }

    return recommendedHours.map(hour => `${hour.toString().padStart(2, '0')}:00`);
  }

  /**
   * Find gaps in the publishing schedule
   */
  static async findScheduleGaps(dateRange: { start: Date; end: Date }): Promise<ScheduleGap[]> {
    // Get all scheduled posts in the date range
    const { data: scheduledPosts, error } = await supabase
      .from('blog_posts')
      .select('id, scheduled_for')
      .eq('status', 'scheduled')
      .gte('scheduled_for', dateRange.start.toISOString())
      .lte('scheduled_for', dateRange.end.toISOString());

    if (error) {
      logger.error('Error finding schedule gaps:', error);
      throw new Error('Failed to find schedule gaps');
    }

    // Count posts per day
    const postsByDay: Record<string, number> = {};

    scheduledPosts?.forEach(post => {
      const date = new Date(post.scheduled_for);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      postsByDay[dateKey] = (postsByDay[dateKey] || 0) + 1;
    });

    // Iterate through each day in the range
    const gaps: ScheduleGap[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      const dateKey = current.toISOString().split('T')[0];
      const postCount = postsByDay[dateKey] || 0;
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;

      gaps.push({
        date: dateKey,
        is_weekend: isWeekend,
        current_post_count: postCount,
        recommended: postCount === 0 && !isWeekend, // Recommend weekdays with no posts
      });

      current.setDate(current.getDate() + 1);
    }

    return gaps;
  }

  /**
   * Suggest optimal start date based on existing schedule
   */
  static async suggestStartDate(): Promise<Date> {
    // Find the latest scheduled post
    const { data: latestPost } = await supabase
      .from('blog_posts')
      .select('scheduled_for')
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: false })
      .limit(1)
      .single();

    if (latestPost && latestPost.scheduled_for) {
      // Suggest 1 day after the latest scheduled post
      const latestDate = new Date(latestPost.scheduled_for);
      latestDate.setDate(latestDate.getDate() + 1);
      return latestDate;
    }

    // If no scheduled posts, suggest tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
    return tomorrow;
  }

  /**
   * Check if a date has too many posts scheduled (>3)
   */
  static async checkDateOverload(date: Date): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { count, error } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('scheduled_for', startOfDay.toISOString())
      .lte('scheduled_for', endOfDay.toISOString());

    if (error) {
      logger.error('Error checking date overload:', error);
      return false;
    }

    return (count || 0) > 3;
  }

  /**
   * Get next available time slot (no posts within 2 hours)
   */
  static async getNextAvailableSlot(preferredDate: Date, preferredHour: number = 9): Promise<Date> {
    const checkDate = new Date(preferredDate);
    checkDate.setHours(preferredHour, 0, 0, 0);

    // Check if any posts are scheduled within 2 hours of this time
    const twoHoursBefore = new Date(checkDate.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAfter = new Date(checkDate.getTime() + 2 * 60 * 60 * 1000);

    const { data: nearbyPosts } = await supabase
      .from('blog_posts')
      .select('id, scheduled_for')
      .eq('status', 'scheduled')
      .gte('scheduled_for', twoHoursBefore.toISOString())
      .lte('scheduled_for', twoHoursAfter.toISOString());

    if (!nearbyPosts || nearbyPosts.length === 0) {
      return checkDate; // This slot is available
    }

    // If slot is taken, try next day at the same time
    const nextDay = new Date(checkDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return this.getNextAvailableSlot(nextDay, preferredHour);
  }
}
