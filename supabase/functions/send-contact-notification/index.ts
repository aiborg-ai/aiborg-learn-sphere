import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = 'hirendra.vikram@aiborg.ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactMessage {
  name: string;
  email: string;
  subject?: string;
  audience: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contactData: ContactMessage = await req.json();

    // Format audience display text
    const audienceDisplay = {
      'primary': 'Primary School (Ages 6-11)',
      'secondary': 'Secondary School (Ages 12-18)',
      'professional': 'Professional Development',
      'business': 'Business/Enterprise',
      'general': 'General Inquiry'
    }[contactData.audience] || contactData.audience;

    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #6b7280; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
            .value { margin-top: 5px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; }
            .message { background: white; padding: 20px; border-left: 4px solid #667eea; margin-top: 20px; border-radius: 6px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .badge { display: inline-block; padding: 4px 12px; background: #667eea; color: white; border-radius: 12px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🎯 New Contact Form Submission</h2>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Aiborg™ Learning Platform</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">From</div>
                <div class="value">
                  <strong>${contactData.name}</strong><br>
                  <a href="mailto:${contactData.email}" style="color: #667eea;">${contactData.email}</a>
                </div>
              </div>

              <div class="field">
                <div class="label">Target Audience</div>
                <div class="value">
                  <span class="badge">${audienceDisplay}</span>
                </div>
              </div>

              ${contactData.subject ? `
              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${contactData.subject}</div>
              </div>
              ` : ''}

              <div class="field">
                <div class="label">Message</div>
                <div class="message">${contactData.message.replace(/\n/g, '<br>')}</div>
              </div>

              <div class="footer">
                <p>This message was sent from the Aiborg™ website contact form.</p>
                <p>Please respond within 24 hours.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Aiborg Contact Form <noreply@aiborg.ai>',
        to: [ADMIN_EMAIL],
        reply_to: contactData.email,
        subject: `New Contact: ${contactData.subject || 'Website Inquiry'} - ${audienceDisplay}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await emailResponse.json();
    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contact notification sent successfully',
        emailId: result.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in send-contact-notification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});