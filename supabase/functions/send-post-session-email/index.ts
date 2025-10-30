/**
 * Edge Function: send-post-session-email
 * Send post-session email with recording and survey
 * Feature: 001-create-a-free (Free Introductory AI Session)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, EMAIL_SUBJECTS } from '../_shared/resend-client.ts';
import { postSessionSchema, validateRequest } from '../_shared/validation-schemas.ts';

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
    const validation = validateRequest(postSessionSchema, body);
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

    const { sessionId, recordingUrl, surveyUrl } = validation.data;

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

    // Send post-session email to each registered user
    for (const registration of registrations) {
      // Build email HTML (TODO: Replace with React Email template in T030)
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
              .content { background: #f7fafc; padding: 30px; border-radius: 8px; margin-top: 20px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
              .courses { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Thank You for Attending!</h1>
              <p>We hope you enjoyed the session</p>
            </div>

            <div class="content">
              <h2>Hi ${registration.full_name}!</h2>
              <p>Thank you for attending <strong>${session.title}</strong>. We hope you found it valuable!</p>

              ${
                recordingUrl
                  ? `
                <h3>📹 Session Recording</h3>
                <p>Couldn't take notes? No problem! Watch the recording:</p>
                <a href="${recordingUrl}" class="button">Watch Recording</a>
              `
                  : ''
              }

              ${
                surveyUrl
                  ? `
                <h3>📝 Share Your Feedback</h3>
                <p>Help us improve! Your feedback is valuable:</p>
                <a href="${surveyUrl}" class="button">Share Feedback</a>
              `
                  : ''
              }

              <div class="courses">
                <h3>🚀 Ready to Learn More?</h3>
                <p>Check out our recommended courses:</p>
                <ul>
                  <li><strong>AI Fundamentals for Students</strong> - Master the basics of AI and machine learning</li>
                  <li><strong>Homework Helper with AI</strong> - Learn to use AI tools effectively for schoolwork</li>
                  <li><strong>Creative AI Projects</strong> - Build exciting AI-powered projects</li>
                </ul>
                <a href="https://aiborg-ai-web.vercel.app" class="button">Browse Courses</a>
              </div>

              <p><strong>Stay Connected!</strong></p>
              <p>☐ Opt-in for future free sessions<br>
              ☐ Subscribe to our newsletter<br>
              ☐ Follow us on social media</p>

              <p>Have questions? Contact us on WhatsApp: ${session.support_whatsapp || '+44 7404568207'}</p>
            </div>

            <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
              <p>AIborg Learn Sphere - Empowering the Next Generation with AI</p>
            </div>
          </body>
        </html>
      `;

      // Send email
      const emailResult = await sendEmail({
        to: registration.email,
        subject: EMAIL_SUBJECTS.post_session(session.title),
        html,
      });

      if (emailResult) {
        emailsSent++;

        // Log email
        await supabaseClient.from('email_logs').insert({
          session_id: sessionId,
          registration_id: registration.id,
          email_type: 'post_session',
          recipient_email: registration.email,
          recipient_name: registration.full_name,
          subject: EMAIL_SUBJECTS.post_session(session.title),
          resend_email_id: emailResult.id,
          resend_status: 'sent',
        });
      } else {
        errors.push({ registrationId: registration.id, email: registration.email });
      }
    }

    // Update session flag
    await supabaseClient
      .from('free_sessions')
      .update({
        post_session_email_sent: true,
        recording_url: recordingUrl || session.recording_url,
      })
      .eq('id', sessionId);

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
