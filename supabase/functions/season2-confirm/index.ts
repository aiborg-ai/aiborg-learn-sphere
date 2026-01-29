import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const APP_URL = Deno.env.get('APP_URL') || 'https://aiborg.ai';

serve(async req => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');
    const reason = url.searchParams.get('reason');

    if (!token || !action) {
      return new Response(renderHTML('error', 'Missing token or action'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (!['confirm', 'reject'].includes(action)) {
      return new Response(renderHTML('error', 'Invalid action'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find registration by token
    const { data: registration, error: findError } = await supabase
      .from('season2_registrations')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (findError || !registration) {
      return new Response(renderHTML('error', 'Registration not found or invalid token'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (registration.status !== 'pending') {
      return new Response(
        renderHTML(
          'already_processed',
          `This registration has already been ${registration.status}.`
        ),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    // Update registration status
    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';
    const { error: updateError } = await supabase
      .from('season2_registrations')
      .update({
        status: newStatus,
        confirmed_at: action === 'confirm' ? new Date().toISOString() : null,
        confirmed_by: 'admin_email',
        rejection_reason: action === 'reject' ? reason || 'Rejected by admin' : null,
        confirmation_email_sent_at: action === 'confirm' ? new Date().toISOString() : null,
      })
      .eq('id', registration.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(renderHTML('error', 'Failed to update registration'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Send confirmation/rejection email to registrant
    if (resendApiKey) {
      const programName =
        registration.program === 'under14'
          ? 'AI Explorers (Under 14)'
          : 'AI Mastery (14+ & Professionals)';

      const schedule =
        registration.program === 'under14'
          ? 'Saturdays at 11:00 AM UK Time'
          : 'Fridays at 8:00 PM UK Time';

      try {
        if (action === 'confirm') {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'AIBORG Season 2 <noreply@aiborg.ai>',
              to: registration.email,
              subject: `🎉 You're In! Welcome to AIBORG Season 2 - ${programName}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're Confirmed!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Welcome to AIBORG Season 2</p>
                  </div>

                  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
                    <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                      Hi <strong>${registration.full_name}</strong>,
                    </p>

                    <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                      Great news! Your registration for <strong>${programName}</strong> has been confirmed.
                      We're excited to have you join our free 12-week AI learning program!
                    </p>

                    <div style="background: white; border: 2px solid #10B981; border-radius: 12px; padding: 20px; margin: 25px 0;">
                      <h3 style="color: #059669; margin-top: 0;">📅 Your Schedule</h3>
                      <p style="color: #1f2937; margin: 0;"><strong>Program:</strong> ${programName}</p>
                      <p style="color: #1f2937; margin: 10px 0 0 0;"><strong>When:</strong> ${schedule}</p>
                      <p style="color: #1f2937; margin: 10px 0 0 0;"><strong>Starts:</strong> February 6, 2026</p>
                      <p style="color: #1f2937; margin: 10px 0 0 0;"><strong>Duration:</strong> 12 weeks</p>
                      <p style="color: #1f2937; margin: 10px 0 0 0;"><strong>Location:</strong> Online (link will be sent before each session)</p>
                    </div>

                    <h3 style="color: #1f2937;">📱 Stay Connected</h3>
                    <p style="color: #4b5563; line-height: 1.6;">
                      We'll send you session reminders and meeting links via WhatsApp at <strong>${registration.whatsapp_number}</strong>.
                      Make sure to save our number!
                    </p>

                    <h3 style="color: #1f2937;">🎯 What's Next?</h3>
                    <ul style="color: #4b5563; line-height: 1.8;">
                      <li>Mark your calendar for the first session</li>
                      <li>You'll receive the meeting link 24 hours before</li>
                      <li>Prepare a notebook and curious mind!</li>
                    </ul>

                    <div style="text-align: center; margin-top: 30px;">
                      <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                        Visit AIBORG
                      </a>
                    </div>

                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
                      Questions? Reply to this email or WhatsApp us!
                    </p>
                  </div>
                </div>
              `,
            }),
          });
        } else {
          // Rejection email
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'AIBORG Season 2 <noreply@aiborg.ai>',
              to: registration.email,
              subject: `AIBORG Season 2 - Registration Update`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-radius: 12px;">
                    <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                      Hi ${registration.full_name},
                    </p>

                    <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                      Thank you for your interest in AIBORG Season 2. Unfortunately, we're unable to confirm your
                      registration at this time.
                    </p>

                    <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                      If you believe this was a mistake or have questions, please contact us at hirendra.vikram@aiborg.ai.
                    </p>

                    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                      Best regards,<br>
                      The AIBORG Team
                    </p>
                  </div>
                </div>
              `,
            }),
          });
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    // Redirect to frontend confirmation page
    const successType = action === 'confirm' ? 'confirmed' : 'rejected';
    const redirectUrl = `${APP_URL}/season2/status?type=${successType}&name=${encodeURIComponent(registration.full_name)}&email=${encodeURIComponent(registration.email)}`;
    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('Error:', error);
    return new Response(renderHTML('error', error.message), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
});

function renderHTML(type: string, name?: string, email?: string): string {
  const styles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); min-height: 100vh; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { color: #1f2937; margin: 0 0 15px 0; font-size: 24px; }
    p { color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; }
    .name { color: #8B5CF6; font-weight: 600; }
    .email { color: #6b7280; font-size: 14px; }
    a { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px; }
  `;

  let content = '';

  if (type === 'confirmed') {
    content = `
      <div class="icon">✅</div>
      <h1>Registration Confirmed!</h1>
      <p><span class="name">${name}</span> has been confirmed for Season 2.</p>
      <p class="email">Confirmation email sent to ${email}</p>
      <a href="${APP_URL}">Back to AIBORG</a>
    `;
  } else if (type === 'rejected') {
    content = `
      <div class="icon">❌</div>
      <h1>Registration Rejected</h1>
      <p><span class="name">${name}</span>'s registration has been rejected.</p>
      <p class="email">Notification sent to ${email}</p>
      <a href="${APP_URL}">Back to AIBORG</a>
    `;
  } else if (type === 'already_processed') {
    content = `
      <div class="icon">ℹ️</div>
      <h1>Already Processed</h1>
      <p>${name}</p>
      <a href="${APP_URL}">Back to AIBORG</a>
    `;
  } else {
    content = `
      <div class="icon">⚠️</div>
      <h1>Error</h1>
      <p>${name || 'An error occurred'}</p>
      <a href="${APP_URL}">Back to AIBORG</a>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIBORG Season 2 - Registration</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">${content}</div>
</body>
</html>`;
}
