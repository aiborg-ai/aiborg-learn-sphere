// Supabase Edge Function: send-batch-email
// Purpose: Send batch emails to multiple recipients
// Used by: Admin dashboard for sending messages to registrants

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchEmailRequest {
  recipients: string[];
  subject: string;
  message: string;
  senderName?: string;
  replyTo?: string;
  entityType?: string;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the request is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const {
      recipients,
      subject,
      message,
      senderName = 'AIBorg Learn Sphere',
      replyTo = 'support@aiborg.ai',
      entityType,
    }: BatchEmailRequest = await req.json();

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid recipients list' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subject || subject.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Invalid subject' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!message || message.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit (max 100 recipients per request)
    if (recipients.length > 100) {
      return new Response(
        JSON.stringify({
          error: 'Too many recipients. Maximum 100 per batch.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send emails
    // Note: You'll need to configure your email service provider
    // Options: Resend, SendGrid, AWS SES, Postmark, etc.
    //
    // For this example, we'll use Resend (https://resend.com)
    // You'll need to set RESEND_API_KEY in your Supabase secrets

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      // For development, just log the email and return success
      console.log('Batch Email (DEV MODE):');
      console.log('To:', recipients);
      console.log('Subject:', subject);
      console.log('Message:', message);

      return new Response(
        JSON.stringify({
          success: true,
          sent: recipients.length,
          errors: [],
          message:
            'DEV MODE: Emails logged but not sent. Configure RESEND_API_KEY to send real emails.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send emails using Resend
    const errors: string[] = [];
    const sent: string[] = [];

    // Format message with HTML
    const htmlMessage = message.replace(/\n/g, '<br>');

    for (const email of recipients) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${senderName} <noreply@aiborg.ai>`,
            to: [email],
            reply_to: replyTo,
            subject: subject,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>AIBorg Learn Sphere</h1>
                    </div>
                    <div class="content">
                      <div class="message">
                        ${htmlMessage}
                      </div>
                    </div>
                    <div class="footer">
                      <p>This email was sent by ${senderName}</p>
                      <p>If you have any questions, please reply to this email or contact ${replyTo}</p>
                      <p>&copy; ${new Date().getFullYear()} AIBorg Learn Sphere. All rights reserved.</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          errors.push(`${email}: ${error}`);
        } else {
          sent.push(email);
        }

        // Rate limiting: wait 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(`${email}: ${error.message}`);
      }
    }

    // Log the batch email send
    await supabase.from('email_logs').insert({
      sent_by: user.id,
      recipient_count: recipients.length,
      subject,
      entity_type: entityType,
      success_count: sent.length,
      error_count: errors.length,
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: sent.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-batch-email function:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
