/**
 * AIBORGLingo Streak Reminder Edge Function
 * Sends push notifications and emails to users who haven't practiced today.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserToNotify {
  user_id: string;
  email: string;
  push_subscription: object | null;
  streak: number;
  last_session_date: string | null;
  push_enabled: boolean;
  email_enabled: boolean;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get users who need streak reminders
    const { data: users, error: usersError } = await supabase.rpc(
      'get_users_needing_streak_reminder'
    );

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: 'No users need notifications', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${users.length} users to notify`);

    let emailSent = 0;
    const errors: string[] = [];

    for (const user of users as UserToNotify[]) {
      const notification = getNotificationContent(user.streak);

      // Send email notification via Resend
      if (user.email_enabled && user.email) {
        try {
          const sent = await sendEmailNotification(user.email, notification);
          if (sent) {
            emailSent++;
            await supabase.from('lingo_notification_log').insert({
              user_id: user.user_id,
              notification_type: 'streak_reminder',
              channel: 'email',
              title: notification.title,
              body: notification.body,
              status: 'sent',
            });
          }
        } catch (err) {
          console.error(`Email failed for ${user.user_id}:`, err);
          errors.push(`Email error: ${err.message}`);
        }
      }

      // Update last notification sent
      await supabase.rpc('update_notification_sent', { p_user_id: user.user_id });
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        users_found: users.length,
        email_sent: emailSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getNotificationContent(streak: number) {
  if (streak >= 7) {
    return {
      title: `🔥 ${streak}-day streak at risk!`,
      body: "You've worked hard for this streak. Don't let it slip - just 5 minutes today!",
    };
  } else if (streak >= 3) {
    return {
      title: '🔥 Keep your streak alive!',
      body: `You're on a ${streak}-day streak! Complete a quick lesson to keep going.`,
    };
  }
  return {
    title: '⚡ Time to learn some AI!',
    body: 'Start building your streak today. Just 5 minutes can make a difference!',
  };
}

async function sendEmailNotification(email: string, payload: { title: string; body: string }) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.log(`Would send email to ${email}:`, payload);
    return false;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AIBORGLingo <noreply@aiborg.ai>',
      to: email,
      subject: payload.title,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0b1021 0%, #1a1f36 100%); border-radius: 16px; padding: 32px; color: white;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #6ef1c5; color: #0b1021; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 24px;">AI</div>
            </div>
            <h1 style="color: #6ef1c5; text-align: center; margin: 0 0 16px;">${payload.title}</h1>
            <p style="color: #a0aac8; text-align: center; font-size: 16px; line-height: 1.6;">${payload.body}</p>
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://aiborglingo.aiborg.ai" style="display: inline-block; background: #6ef1c5; color: #0b1021; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">Start Learning</a>
            </div>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 24px;">
            You received this because you enabled streak reminders. <a href="https://aiborglingo.aiborg.ai" style="color: #6ef1c5;">Manage preferences</a>
          </p>
        </div>
      `,
    }),
  });

  return response.ok;
}
