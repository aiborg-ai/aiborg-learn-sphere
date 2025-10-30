/**
 * Edge Function: send-confirmation-email
 * Send confirmation email to registered user
 * Feature: 001-create-a-free (Free Introductory AI Session)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, EMAIL_SUBJECTS } from '../_shared/resend-client.ts';
import {
  generateGoogleCalendarLink,
  generateICalContent,
  generateICalDataURI,
} from '../_shared/session-helpers.ts';
import { emailSendSchema, validateRequest } from '../_shared/validation-schemas.ts';

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
    const validation = validateRequest(emailSendSchema, body);
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

    const { registrationId } = validation.data;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch registration and session details
    const { data: registration, error: regError } = await supabaseClient
      .from('session_registrations')
      .select(
        `
        *,
        free_sessions (*)
      `
      )
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'REGISTRATION_NOT_FOUND', message: 'Registration not found' },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const session = (registration as any).free_sessions;

    // Generate calendar links
    const googleCalLink = generateGoogleCalendarLink({
      title: session.title,
      description: session.description,
      session_date: session.session_date,
      duration_minutes: session.duration_minutes,
      meeting_url: session.meeting_url,
    });

    const icalContent = generateICalContent({
      id: session.id,
      title: session.title,
      description: session.description,
      session_date: session.session_date,
      duration_minutes: session.duration_minutes,
      meeting_url: session.meeting_url,
    });

    const icalDataUri = generateICalDataURI(icalContent);

    // Build email HTML (TODO: Replace with React Email template in T027)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
            .content { background: #f7fafc; padding: 30px; border-radius: 8px; margin-top: 20px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to AIborg Learn Sphere!</h1>
            <p>Your session is confirmed</p>
          </div>

          <div class="content">
            <h2>Hi ${registration.full_name}!</h2>
            <p>Great news! You're confirmed for our free AI introductory session:</p>

            <div class="details">
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
              <p><strong>⏱️ Duration:</strong> ${session.duration_minutes} minutes</p>
            </div>

            <p><strong>Join the Session:</strong></p>
            <a href="${session.meeting_url}" class="button">Join Google Meet</a>

            <p><strong>Add to Calendar:</strong></p>
            <a href="${googleCalLink}" class="button">Add to Google Calendar</a>
            <a href="${icalDataUri}" download="session.ics" class="button">Download .ics File</a>

            <p><strong>Need Help?</strong></p>
            <p>Contact us on WhatsApp: ${session.support_whatsapp || '+44 7404568207'}</p>
          </div>

          <div class="footer">
            <p>Looking forward to seeing you!</p>
            <p>AIborg Learn Sphere Team</p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const emailResult = await sendEmail({
      to: registration.email,
      subject: EMAIL_SUBJECTS.confirmation(session.title),
      html,
    });

    if (!emailResult) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'EMAIL_SEND_FAILED', message: 'Failed to send email' },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log email
    await supabaseClient.from('email_logs').insert({
      session_id: session.id,
      registration_id: registrationId,
      email_type: 'confirmation',
      recipient_email: registration.email,
      recipient_name: registration.full_name,
      subject: EMAIL_SUBJECTS.confirmation(session.title),
      resend_email_id: emailResult.id,
      resend_status: 'sent',
    });

    // Update registration
    await supabaseClient
      .from('session_registrations')
      .update({
        confirmation_email_sent: true,
        confirmation_email_sent_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    return new Response(
      JSON.stringify({
        success: true,
        data: { emailId: emailResult.id },
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
