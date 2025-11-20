/**
 * Check Deadlines Edge Function
 *
 * Scheduled function to check for upcoming deadlines and send reminder notifications
 * Call this function via a cron job (e.g., every hour)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeadlineReminder {
  userId: string;
  email: string;
  assignmentTitle: string;
  courseTitle: string;
  dueDate: Date;
  hoursUntilDue: number;
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for upcoming deadlines...');

    // Get assignments due in the next 24 hours
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Query for upcoming assignments with enrolled users
    const { data: upcomingDeadlines, error: queryError } = await supabase
      .from('assignments')
      .select(
        `
        id,
        title,
        due_date,
        course:courses (
          id,
          title,
          enrollments (
            user_id,
            status
          )
        )
      `
      )
      .gte('due_date', now.toISOString())
      .lte('due_date', in24Hours.toISOString());

    if (queryError) {
      throw queryError;
    }

    if (!upcomingDeadlines || upcomingDeadlines.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No upcoming deadlines found',
          notificationsSent: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Group reminders by user
    const remindersByUser = new Map<string, DeadlineReminder[]>();

    for (const assignment of upcomingDeadlines) {
      const dueDate = new Date(assignment.due_date);
      const hoursUntilDue = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Skip if not at a reminder threshold (1h, 3h, 6h, 12h, 24h)
      const reminderThresholds = [1, 3, 6, 12, 24];
      if (!reminderThresholds.includes(hoursUntilDue)) {
        continue;
      }

      const course = assignment.course as any;
      if (!course || !course.enrollments) continue;

      for (const enrollment of course.enrollments) {
        if (enrollment.status !== 'active') continue;

        const userId = enrollment.user_id;

        if (!remindersByUser.has(userId)) {
          remindersByUser.set(userId, []);
        }

        remindersByUser.get(userId)!.push({
          userId,
          email: '', // Will be filled later
          assignmentTitle: assignment.title,
          courseTitle: course.title,
          dueDate,
          hoursUntilDue,
        });
      }
    }

    // Check which users haven't already received this reminder
    const usersToNotify: string[] = [];

    for (const [userId, reminders] of remindersByUser.entries()) {
      // Check notification log to avoid duplicate notifications
      const { data: recentLogs } = await supabase
        .from('notification_log')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', 'deadline')
        .gte('sent_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString()) // Last hour
        .limit(1);

      if (!recentLogs || recentLogs.length === 0) {
        usersToNotify.push(userId);
      }
    }

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All users already notified',
          notificationsSent: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send notifications
    let notificationsSent = 0;
    const errors: string[] = [];

    for (const userId of usersToNotify) {
      const reminders = remindersByUser.get(userId)!;

      // Create notification message
      let title: string;
      let body: string;

      if (reminders.length === 1) {
        const reminder = reminders[0];
        title = `Assignment Due Soon`;
        body = `"${reminder.assignmentTitle}" is due in ${reminder.hoursUntilDue} hour${reminder.hoursUntilDue === 1 ? '' : 's'}`;
      } else {
        title = `${reminders.length} Assignments Due Soon`;
        const soonest = reminders.reduce((a, b) => (a.hoursUntilDue < b.hoursUntilDue ? a : b));
        body = `Including "${soonest.assignmentTitle}" due in ${soonest.hoursUntilDue} hour${soonest.hoursUntilDue === 1 ? '' : 's'}`;
      }

      // Call send-push-notification function
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title,
          body,
          notificationType: 'deadline',
          tag: 'deadline-reminder',
          data: {
            type: 'deadline',
            url: '/assignments',
            assignments: reminders.map(r => ({
              title: r.assignmentTitle,
              course: r.courseTitle,
              dueDate: r.dueDate.toISOString(),
            })),
          },
        },
      });

      if (error) {
        errors.push(`User ${userId}: ${error.message}`);
      } else {
        notificationsSent++;
      }
    }

    console.log(`Deadline check complete. Sent ${notificationsSent} notifications.`);

    return new Response(
      JSON.stringify({
        success: true,
        deadlinesFound: upcomingDeadlines.length,
        usersToNotify: usersToNotify.length,
        notificationsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error checking deadlines:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
