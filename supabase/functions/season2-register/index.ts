import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = 'hirendra.vikram@aiborg.ai';
const APP_URL = Deno.env.get('APP_URL') || 'https://aiborg.ai';

interface RegistrationData {
  fullName: string;
  email: string;
  whatsappNumber: string;
  country: string;
  city?: string;
  program: 'under14' | 'professionals';
  ageGroup: string;
  occupation: string;
  occupationDetails?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: RegistrationData = await req.json();

    // Validate required fields
    if (
      !data.fullName ||
      !data.email ||
      !data.whatsappNumber ||
      !data.country ||
      !data.program ||
      !data.ageGroup ||
      !data.occupation
    ) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate registration
    const { data: existing } = await supabase
      .from('season2_registrations')
      .select('id, status')
      .eq('email', data.email.toLowerCase())
      .eq('program', data.program)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({
          error: 'Already registered',
          message: `You have already registered for this program. Status: ${existing.status}`,
          status: existing.status,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request metadata
    const userAgent = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    // Insert registration
    const { data: registration, error: insertError } = await supabase
      .from('season2_registrations')
      .insert({
        full_name: data.fullName.trim(),
        email: data.email.toLowerCase().trim(),
        whatsapp_number: data.whatsappNumber.trim(),
        country: data.country.trim(),
        city: data.city?.trim() || null,
        program: data.program,
        age_group: data.ageGroup,
        occupation: data.occupation,
        occupation_details: data.occupationDetails?.trim() || null,
        utm_source: data.utmSource || null,
        utm_medium: data.utmMedium || null,
        utm_campaign: data.utmCampaign || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        notification_sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save registration', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification email to admin
    const programName =
      data.program === 'under14' ? 'AI Explorers (Under 14)' : 'AI Mastery (14+ & Professionals)';
    const confirmUrl = `${supabaseUrl}/functions/v1/season2-confirm?token=${registration.confirmation_token}&action=confirm`;
    const rejectUrl = `${supabaseUrl}/functions/v1/season2-confirm?token=${registration.confirmation_token}&action=reject`;

    let emailStatus = 'not_attempted';
    let emailError = null;

    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'AIBORG Season 2 <noreply@aiborg.ai>',
            to: ADMIN_EMAIL,
            subject: `🎓 New Season 2 Registration: ${data.fullName} - ${programName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 30px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🎓 New Season 2 Registration</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Someone wants to join the free AI classes!</p>
                </div>

                <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
                  <h2 style="color: #1f2937; margin-top: 0;">Program: ${programName}</h2>

                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #6b7280; width: 140px;">Full Name</td>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #1f2937; font-weight: 600;">${data.fullName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #6b7280;">Email</td>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #1f2937;">${data.email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #6b7280;">WhatsApp</td>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #1f2937;">${data.whatsappNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #6b7280;">Location</td>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #1f2937;">${data.city ? `${data.city}, ` : ''}${data.country}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #6b7280;">Age Group</td>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #1f2937;">${data.ageGroup}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #6b7280;">Occupation</td>
                      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #1f2937;">${data.occupation}${data.occupationDetails ? ` - ${data.occupationDetails}` : ''}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; color: #6b7280;">Registered At</td>
                      <td style="padding: 10px; color: #1f2937;">${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })} UK</td>
                    </tr>
                  </table>

                  <div style="margin-top: 30px; text-align: center;">
                    <a href="${confirmUrl}" style="display: inline-block; background: #10B981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 10px;">
                      ✅ Confirm Registration
                    </a>
                    <a href="${rejectUrl}" style="display: inline-block; background: #EF4444; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                      ❌ Reject
                    </a>
                  </div>

                  <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
                    Registration ID: ${registration.id}
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          emailStatus = 'sent';
        } else {
          const errorText = await emailResponse.text();
          emailStatus = 'failed';
          emailError = errorText;
          console.error('Email send failed:', errorText);
        }
      } catch (err) {
        emailStatus = 'error';
        emailError = err.message;
        console.error('Email error:', err);
        // Don't fail registration if email fails
      }
    } else {
      emailStatus = 'no_api_key';
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          'Registration submitted successfully! You will receive a confirmation email once approved.',
        registrationId: registration.id,
        emailStatus,
        emailError,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
