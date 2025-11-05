// Follow this Deno example template for the edge function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendReviewRequestPayload {
  sessionId: string;
  sessionType: 'workshop' | 'free_session' | 'classroom';
  userIds: string[];
  customMessage?: string;
  sessionTitle: string;
  sessionDate: string;
  isReminder?: boolean;
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: SendReviewRequestPayload = await req.json();
    const {
      sessionId,
      sessionType,
      userIds,
      customMessage,
      sessionTitle,
      sessionDate,
      isReminder,
    } = payload;

    let requestsCreated = 0;
    let notificationsCreated = 0;
    let emailsSent = 0;
    const errors: string[] = [];
    const successfulUserIds: string[] = [];
    const failedUserIds: string[] = [];

    for (const userId of userIds) {
      try {
        // Get user profile for email
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('display_name, email, notification_preferences, email_notifications')
          .eq('user_id', userId)
          .single();

        if (!profile?.email) {
          errors.push(`No email found for user ${userId}`);
          failedUserIds.push(userId);
          continue;
        }

        // Create notification
        const notificationTitle = isReminder
          ? `Reminder: Share your feedback for ${sessionTitle}`
          : `We'd love your feedback on ${sessionTitle}`;

        const notificationMessage =
          customMessage ||
          `Thank you for participating in "${sessionTitle}". Your feedback helps us improve and helps other learners make informed decisions. Please take 2-3 minutes to share your experience.`;

        const { data: notification, error: notifError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'review_request',
            title: notificationTitle,
            message: notificationMessage,
            action_url: `/review/submit?sessionId=${sessionId}&sessionType=${sessionType}`,
            is_read: false,
          })
          .select()
          .single();

        if (notifError) throw notifError;
        notificationsCreated++;

        // Create or update review request (upsert based on unique constraint)
        const { data: request, error: requestError } = await supabaseClient
          .from('review_requests')
          .upsert(
            {
              session_id: sessionId,
              session_type: sessionType,
              user_id: userId,
              notification_id: notification.id,
              custom_message: customMessage,
              session_title: sessionTitle,
              session_date: sessionDate,
              status: 'pending',
            },
            {
              onConflict: 'session_id,session_type,user_id',
            }
          )
          .select()
          .single();

        if (requestError) throw requestError;
        requestsCreated++;

        // Send email if user has email notifications enabled
        if (profile.email_notifications !== false) {
          const emailSubject = isReminder
            ? `Reminder: Share your feedback for ${sessionTitle}`
            : `We'd love your feedback on ${sessionTitle}`;

          const emailBody = `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #4F46E5;">${emailSubject}</h2>

                  <p>Hi ${profile.display_name || 'there'},</p>

                  <p>Thank you for participating in <strong>"${sessionTitle}"</strong>!</p>

                  <p>${notificationMessage}</p>

                  <div style="margin: 30px 0;">
                    <a href="${Deno.env.get('SITE_URL')}/review/submit?sessionId=${sessionId}&sessionType=${sessionType}&requestId=${request.id}"
                       style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      Submit Your Review
                    </a>
                  </div>

                  <p style="font-size: 14px; color: #666;">
                    This will only take 2-3 minutes. Your feedback is valuable to us and to the community.
                  </p>

                  <p style="margin-top: 30px;">Thank you for being part of our learning community!</p>

                  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                  <p style="font-size: 12px; color: #999;">
                    You're receiving this because you participated in a session.
                    You can manage your notification preferences in your <a href="${Deno.env.get('SITE_URL')}/profile">profile settings</a>.
                  </p>
                </div>
              </body>
            </html>
          `;

          // Use your existing email service
          const { error: emailError } = await supabaseClient.functions.invoke(
            'send-email-notification',
            {
              body: {
                to: profile.email,
                subject: emailSubject,
                html: emailBody,
                notificationType: 'review_request',
              },
            }
          );

          if (emailError) {
            console.error('Email send error:', emailError);
            errors.push(`Email failed for ${userId}: ${emailError.message}`);
          } else {
            emailsSent++;
          }
        }

        successfulUserIds.push(userId);
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
        errors.push(`Failed for user ${userId}: ${error.message}`);
        failedUserIds.push(userId);
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0 || successfulUserIds.length > 0,
        requestsCreated,
        notificationsCreated,
        emailsSent,
        errors,
        details: {
          successfulUserIds,
          failedUserIds,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-review-request function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        requestsCreated: 0,
        notificationsCreated: 0,
        emailsSent: 0,
        errors: [error.message],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
