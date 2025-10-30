/**
 * Edge Function: send-session-reminder
 * Send pre-session reminders (24h or 1h before session)
 * Feature: 001-create-a-free (Free Introductory AI Session)
 * Triggered by: pg_cron scheduled job
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, EMAIL_SUBJECTS } from '../_shared/resend-client.ts';
import { reminderSchema, validateRequest } from '../_shared/validation-schemas.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate request
    const validation = validateRequest(reminderSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { sessionId, timeUntil } = validation.data;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch session details
    const { data: session, error: sessionError } = await supabaseClient
      .from('free_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch all confirmed registrations
    const { data: registrations, error: regError } = await supabaseClient
      .from('session_registrations')
      .select('id, full_name, email')
      .eq('session_id', sessionId)
      .eq('status', 'confirmed');

    if (regError || !registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'NO_REGISTRATIONS', message: 'No confirmed registrations found' },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let emailsSent = 0;
    const errors = [];

    // Send reminder to each registered user
    for (const registration of registrations) {
      // Build email HTML (TODO: Replace with React Email template in T028/T029)
      const reminderTime = timeUntil === '24h' ? 'tomorrow' : 'in 1 hour';
      const subject =
        timeUntil === '24h'
          ? EMAIL_SUBJECTS.reminder_24h(session.title)
          : EMAIL_SUBJECTS.reminder_1h(session.title);

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: ${timeUntil === '1h' ? '#f59e0b' : '#667eea'}; color: white; padding: 30px; text-align: center; border-radius: 8px; }
              .content { background: #f7fafc; padding: 30px; border-radius: 8px; margin-top: 20px; }
              .button { display: inline-block; background: ${timeUntil === '1h' ? '#f59e0b' : '#667eea'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
              .urgent { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Session Reminder</h1>
              <p>Your session is ${reminderTime}!</p>
            </div>

            <div class="content">
              <h2>Hi ${registration.full_name}!</h2>
              ${timeUntil === '1h' ? '<div class="urgent"><strong>⏰ Starting Soon!</strong> Your session begins in just 1 hour.</div>' : '<p>Just a friendly reminder that your AI session is tomorrow!</p>'}

              <h3>${session.title}</h3>
              <p><strong>📅 Date:</strong> ${new Date(session.session_date).toLocaleDateString(
                'en-GB',
                {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}</p>
              <p><strong>🕐 Time:</strong> ${new Date(session.session_date).toLocaleTimeString(
                'en-GB',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'UTC',
                }
              )} GMT</p>

              <a href="${session.meeting_url}" class="button">${timeUntil === '1h' ? 'Join Now' : 'Join Meeting'}</a>

              <p><strong>Need Help?</strong> WhatsApp: ${session.support_whatsapp || '+44 7404568207'}</p>
            </div>
          </body>
        </html>
      `;

      // Send email
      const emailResult = await sendEmail({
        to: registration.email,
        subject,
        html,
      });

      if (emailResult) {
        emailsSent++;

        // Log email
        await supabaseClient.from('email_logs').insert({
          session_id: sessionId,
          registration_id: registration.id,
          email_type: timeUntil === '24h' ? 'reminder_24h' : 'reminder_1h',
          recipient_email: registration.email,
          recipient_name: registration.full_name,
          subject,
          resend_email_id: emailResult.id,
          resend_status: 'sent',
        });

        // Update registration
        if (timeUntil === '24h') {
          await supabaseClient
            .from('session_registrations')
            .update({ reminder_24h_sent: true })
            .eq('id', registration.id);
        } else {
          await supabaseClient
            .from('session_registrations')
            .update({ reminder_1h_sent: true })
            .eq('id', registration.id);
        }
      } else {
        errors.push({ registrationId: registration.id, email: registration.email });
      }
    }

    // Update session reminder flag
    if (timeUntil === '24h') {
      await supabaseClient
        .from('free_sessions')
        .update({ reminder_24h_sent: true })
        .eq('id', sessionId);
    } else {
      await supabaseClient
        .from('free_sessions')
        .update({ reminder_1h_sent: true })
        .eq('id', sessionId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          emailsSent,
          totalRecipients: registrations.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
