import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignmentReminderRequest {
  assignmentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  courseName: string;
  assignmentTitle: string;
  dueDate: string;
  assignmentDescription?: string;
  courseUrl: string;
  assignmentUrl: string;
  organizationName?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AssignmentReminderRequest = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate days/hours until due date
    const dueDate = new Date(payload.dueDate);
    const now = new Date();
    const timeUntilDue = dueDate.getTime() - now.getTime();
    const daysUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24));
    const hoursUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60));

    // Determine urgency and colors
    let urgencyLevel = payload.priority || 'medium';
    if (hoursUntilDue <= 24) urgencyLevel = 'urgent';
    else if (daysUntilDue <= 3) urgencyLevel = 'high';
    else if (daysUntilDue <= 7) urgencyLevel = 'medium';
    else urgencyLevel = 'low';

    const urgencyColors = {
      low: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
      medium: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
      high: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
      urgent: { bg: '#fee2e2', border: '#dc2626', text: '#7f1d1d' },
    };

    const colors = urgencyColors[urgencyLevel];

    const formattedDueDate = dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Build email HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Inter', 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background: #f9fafb;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
            }
            .header {
              background: linear-gradient(135deg, ${urgencyLevel === 'urgent' ? '#dc2626 0%, #991b1b' : urgencyLevel === 'high' ? '#ef4444 0%, #dc2626' : urgencyLevel === 'medium' ? '#f59e0b 0%, #d97706' : '#3b82f6 0%, #2563eb'} 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            .alert-box {
              background: ${colors.bg};
              padding: 25px;
              border-radius: 12px;
              margin: 20px 0;
              border-left: 4px solid ${colors.border};
            }
            .countdown {
              font-size: ${urgencyLevel === 'urgent' ? '48px' : '36px'};
              font-weight: bold;
              color: ${colors.border};
              text-align: center;
              margin: 15px 0;
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: ${colors.border};
              color: white !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 700;
              margin: 20px 0;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .course-info {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .tips-box {
              background: #f0fdf4;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #10b981;
              margin: 20px 0;
            }
            .tips-box ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .tips-box li {
              margin: 8px 0;
              color: #065f46;
            }
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
            h1 {
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            h2 {
              color: ${colors.text};
              font-size: 20px;
              margin: 20px 0 10px 0;
            }
            p {
              margin: 0 0 15px 0;
            }
            .highlight {
              color: ${colors.border};
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: white;">
                ${urgencyLevel === 'urgent' ? '🚨 URGENT' : urgencyLevel === 'high' ? '⚠️ HIGH PRIORITY' : '⏰'} Assignment Reminder
              </h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">
                ${urgencyLevel === 'urgent' ? 'Due Very Soon!' : urgencyLevel === 'high' ? 'Action Needed Soon' : 'Upcoming Deadline'}
              </p>
            </div>
            <div class="content">
              <p>Hi ${payload.userName},</p>
              <p>This is a reminder about your upcoming assignment${urgencyLevel === 'urgent' ? ' that is due very soon' : ''}:</p>

              <div class="alert-box">
                <h2 style="margin: 0 0 15px 0; text-align: center;">${payload.assignmentTitle}</h2>
                <div class="countdown">
                  ${hoursUntilDue <= 48 ? `${hoursUntilDue} Hours` : `${daysUntilDue} Days`} Remaining
                </div>
                <p style="margin: 10px 0 0 0; text-align: center; color: ${colors.text};">
                  <strong>Due:</strong> ${formattedDueDate}
                </p>
              </div>

              <div class="course-info">
                <div class="detail-row">
                  <span style="color: #6b7280;">Course:</span>
                  <strong>${payload.courseName}</strong>
                </div>
                ${
                  payload.organizationName
                    ? `
                <div class="detail-row">
                  <span style="color: #6b7280;">Organization:</span>
                  <strong>${payload.organizationName}</strong>
                </div>
                `
                    : ''
                }
                ${
                  payload.assignmentDescription
                    ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Description:</p>
                  <p style="margin: 5px 0 0 0;">${payload.assignmentDescription}</p>
                </div>
                `
                    : ''
                }
              </div>

              ${
                urgencyLevel === 'urgent'
                  ? `
              <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border: 2px solid #dc2626; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #991b1b; font-weight: 700; font-size: 18px;">
                  ⚠️ URGENT: This assignment is due in less than 24 hours!
                </p>
                <p style="margin: 10px 0 0 0; color: #991b1b;">
                  Complete it now to avoid late penalties.
                </p>
              </div>
              `
                  : ''
              }

              <center>
                <a href="${payload.assignmentUrl}" class="button">
                  ${urgencyLevel === 'urgent' ? 'Complete Assignment Now →' : 'Start Assignment →'}
                </a>
              </center>

              <div class="tips-box">
                <h2 style="margin: 0 0 15px 0; color: #065f46;">📚 Tips to Complete Successfully:</h2>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Review the assignment requirements carefully</li>
                  <li>Check if you have all necessary resources</li>
                  <li>Save your work frequently to avoid data loss</li>
                  <li>Submit before the deadline to avoid late penalties</li>
                  <li>Reach out to your instructor if you need help</li>
                </ul>
              </div>

              <p style="margin-top: 30px; padding: 20px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <strong style="color: #1e40af;">💡 Need Help?</strong> If you're having trouble with this assignment, don't hesitate to contact your instructor or visit the course discussion forum. We're here to support your learning!
              </p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; text-align: center;">
                <small>This is an automated reminder. You can manage your notification preferences in your <a href="${payload.courseUrl}" style="color: #3b82f6;">account settings</a>.</small>
              </p>
            </div>
            <div class="footer">
              <p><strong>Aiborg™ Learning Platform</strong></p>
              <p>AI-Augmented Human Learning</p>
              <p style="margin-top: 15px;">
                <a href="${payload.courseUrl}" style="color: #667eea;">Go to Course</a> |
                <a href="${payload.assignmentUrl}" style="color: #667eea;">View Assignment</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Aiborg Learning <notifications@aiborg.ai>',
        to: [payload.userEmail],
        subject: `${urgencyLevel === 'urgent' ? '🚨 URGENT' : '⏰'} Reminder: ${payload.assignmentTitle} due ${hoursUntilDue <= 48 ? `in ${hoursUntilDue} hours` : `in ${daysUntilDue} days`}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await emailResponse.json();

    // Log the reminder email
    await supabase.from('email_notifications_log').insert({
      user_email: payload.userEmail,
      notification_type: 'assignment_reminder',
      email_id: result.id,
      sent_at: new Date().toISOString(),
      metadata: {
        assignment_id: payload.assignmentId,
        user_id: payload.userId,
        course_name: payload.courseName,
        due_date: payload.dueDate,
        urgency_level: urgencyLevel,
      },
    });

    // Update reminder_sent_at in team_assignment_users
    await supabase
      .from('team_assignment_users')
      .update({
        reminder_sent_at: new Date().toISOString(),
      })
      .eq('assignment_id', payload.assignmentId)
      .eq('user_id', payload.userId);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: result.id,
        urgencyLevel,
        message: 'Assignment reminder sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending assignment reminder:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
