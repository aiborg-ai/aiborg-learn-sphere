import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailNotification {
  to: string;
  type: 'course_enrollment' | 'assignment_due' | 'assignment_graded' | 'course_update' | 'new_announcement' | 'deadline_reminder' | 'certificate_ready' | 'discussion_reply';
  data: Record<string, any>;
}

const emailTemplates = {
  course_enrollment: (data: any) => ({
    subject: `Welcome to ${data.courseName}! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Inter', 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .course-card { background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #667eea; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            h1 { margin: 0 0 10px 0; font-size: 28px; }
            h2 { color: #374151; font-size: 20px; margin: 0 0 10px 0; }
            p { margin: 0 0 15px 0; }
            .highlight { color: #667eea; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ai<span style="color: #fbbf24;">BORG</span>™</div>
              <p style="margin: 0; opacity: 0.9;">AI-Augmented Human Learning</p>
            </div>
            <div class="content">
              <h1>Welcome Aboard! 🚀</h1>
              <p>Hi ${data.studentName},</p>
              <p>Congratulations on enrolling in <span class="highlight">${data.courseName}</span>! You're about to embark on an exciting learning journey.</p>

              <div class="course-card">
                <h2>${data.courseName}</h2>
                <p><strong>Instructor:</strong> ${data.instructorName}</p>
                <p><strong>Duration:</strong> ${data.duration}</p>
                <p><strong>Start Date:</strong> ${data.startDate}</p>
              </div>

              <p><strong>What's Next?</strong></p>
              <ul style="color: #4b5563;">
                <li>Access your course materials and syllabus</li>
                <li>Join the course discussion forum</li>
                <li>Review the first module to get started</li>
                <li>Mark your calendar for upcoming deadlines</li>
              </ul>

              <center>
                <a href="${data.courseUrl}" class="button">Go to Course Dashboard</a>
              </center>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
                Need help? Reply to this email or contact our support team.
              </p>
            </div>
            <div class="footer">
              <p><strong>Aiborg™ Learning Platform</strong></p>
              <p>Empowering education through AI</p>
              <p style="margin-top: 20px;">
                <a href="${data.settingsUrl}" style="color: #667eea;">Notification Settings</a> |
                <a href="${data.dashboardUrl}" style="color: #667eea;">Dashboard</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  assignment_due: (data: any) => ({
    subject: `⏰ Reminder: ${data.assignmentName} due ${data.dueDate}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 14px 28px; background: #ef4444; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">⏰ Assignment Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>
              <div class="alert-box">
                <h2 style="margin: 0 0 10px 0; color: #92400e;">Upcoming Deadline</h2>
                <p style="margin: 0;"><strong>${data.assignmentName}</strong></p>
                <p style="margin: 5px 0 0 0; color: #92400e;">Due: ${data.dueDate} (${data.daysLeft} days remaining)</p>
              </div>
              <p><strong>Course:</strong> ${data.courseName}</p>
              <p>${data.description}</p>
              <center>
                <a href="${data.assignmentUrl}" class="button">Start Assignment</a>
              </center>
            </div>
            <div class="footer">
              <p>Aiborg™ Learning Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  assignment_graded: (data: any) => ({
    subject: `📝 Your assignment "${data.assignmentName}" has been graded`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .grade-card { background: #f0fdf4; border: 2px solid #10b981; padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; }
          .grade-score { font-size: 48px; font-weight: bold; color: #059669; margin: 10px 0; }
          .button { display: inline-block; padding: 14px 28px; background: #10b981; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .feedback { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📝 Assignment Graded</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>
              <p>Great news! Your assignment has been graded.</p>

              <div class="grade-card">
                <h2 style="margin: 0; color: #059669;">${data.assignmentName}</h2>
                <div class="grade-score">${data.score}/${data.totalPoints}</div>
                <p style="margin: 0; color: #065f46; font-size: 18px;">${data.grade} (${data.percentage}%)</p>
              </div>

              ${data.feedback ? `
              <div class="feedback">
                <h3 style="margin: 0 0 10px 0; color: #374151;">Instructor Feedback:</h3>
                <p style="margin: 0;">${data.feedback}</p>
              </div>
              ` : ''}

              <p><strong>Course:</strong> ${data.courseName}<br>
              <strong>Submitted:</strong> ${data.submittedDate}<br>
              <strong>Graded:</strong> ${data.gradedDate}</p>

              <center>
                <a href="${data.assignmentUrl}" class="button">View Full Results</a>
              </center>
            </div>
            <div class="footer">
              <p>Aiborg™ Learning Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  course_update: (data: any) => ({
    subject: `📢 Update: ${data.courseName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .update-box { background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
          .button { display: inline-block; padding: 14px 28px; background: #3b82f6; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📢 Course Update</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>
              <p>There's an important update for <strong>${data.courseName}</strong>:</p>

              <div class="update-box">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">${data.updateTitle}</h3>
                <p style="margin: 0;">${data.updateMessage}</p>
              </div>

              <p><strong>Posted by:</strong> ${data.instructorName}<br>
              <strong>Date:</strong> ${data.updateDate}</p>

              <center>
                <a href="${data.courseUrl}" class="button">Go to Course</a>
              </center>
            </div>
            <div class="footer">
              <p>Aiborg™ Learning Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  new_announcement: (data: any) => ({
    subject: `📣 ${data.announcementTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .announcement { background: #faf5ff; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid #8b5cf6; }
          .button { display: inline-block; padding: 14px 28px; background: #8b5cf6; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📣 New Announcement</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>

              <div class="announcement">
                <h2 style="margin: 0 0 15px 0; color: #6b21a8;">${data.announcementTitle}</h2>
                <p style="margin: 0;">${data.announcementBody}</p>
              </div>

              <p><strong>Course:</strong> ${data.courseName}<br>
              <strong>From:</strong> ${data.instructorName}<br>
              <strong>Date:</strong> ${data.date}</p>

              <center>
                <a href="${data.courseUrl}" class="button">View in Course</a>
              </center>
            </div>
            <div class="footer">
              <p>Aiborg™ Learning Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  deadline_reminder: (data: any) => ({
    subject: `🚨 Deadline Alert: ${data.itemName} due in ${data.hoursLeft} hours`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .urgent-box { background: #fee2e2; border: 3px solid #dc2626; padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; }
          .countdown { font-size: 42px; font-weight: bold; color: #dc2626; margin: 10px 0; }
          .button { display: inline-block; padding: 14px 28px; background: #dc2626; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">🚨 URGENT DEADLINE</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>
              <p style="color: #dc2626; font-weight: 600;">This is a final reminder!</p>

              <div class="urgent-box">
                <h2 style="margin: 0 0 10px 0; color: #7f1d1d;">${data.itemName}</h2>
                <div class="countdown">${data.hoursLeft} Hours Left</div>
                <p style="margin: 0; color: #991b1b;">Due: ${data.dueDateTime}</p>
              </div>

              <p><strong>Course:</strong> ${data.courseName}</p>
              <p style="color: #dc2626;">⚠️ Don't miss this deadline! Submit your work now to avoid late penalties.</p>

              <center>
                <a href="${data.submissionUrl}" class="button">Submit Now</a>
              </center>
            </div>
            <div class="footer">
              <p>Aiborg™ Learning Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  certificate_ready: (data: any) => ({
    subject: `🎓 Congratulations! Your certificate for ${data.courseName} is ready`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #78350f; padding: 40px; text-align: center; }
          .content { padding: 40px 30px; }
          .certificate-box { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; border: 3px solid #fbbf24; }
          .trophy { font-size: 64px; margin: 10px 0; }
          .button { display: inline-block; padding: 16px 32px; background: #f59e0b; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button:hover { background: #d97706; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <div class="trophy">🎓</div>
              <h1 style="margin: 0; font-size: 32px;">Congratulations!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>
              <p style="font-size: 18px;">We're thrilled to announce that you've successfully completed <strong>${data.courseName}</strong>!</p>

              <div class="certificate-box">
                <h2 style="margin: 0 0 15px 0; color: #78350f;">Certificate of Completion</h2>
                <p style="margin: 0 0 10px 0; font-size: 20px; color: #92400e;"><strong>${data.courseName}</strong></p>
                <p style="margin: 0; color: #92400e;">Completed: ${data.completionDate}</p>
                <p style="margin: 10px 0 0 0; color: #92400e;">Final Grade: ${data.finalGrade}</p>
              </div>

              <p><strong>Your Achievement:</strong></p>
              <ul style="color: #4b5563;">
                <li>✅ ${data.totalModules} modules completed</li>
                <li>✅ ${data.totalAssignments} assignments submitted</li>
                <li>✅ ${data.totalHours} hours of learning</li>
              </ul>

              <center>
                <a href="${data.certificateUrl}" class="button">📥 Download Certificate</a>
              </center>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Share your achievement on LinkedIn and other social media!
              </p>
            </div>
            <div class="footer">
              <p><strong>Aiborg™ Learning Platform</strong></p>
              <p>Continue your learning journey with our other courses!</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  discussion_reply: (data: any) => ({
    subject: `💬 ${data.replierName} replied to your discussion post`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .discussion { background: #f0fdfa; padding: 20px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #14b8a6; }
          .reply { background: #ffffff; padding: 20px; border-radius: 8px; margin: 10px 0; border: 1px solid #99f6e4; }
          .button { display: inline-block; padding: 14px 28px; background: #14b8a6; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">💬 New Reply</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>
              <p><strong>${data.replierName}</strong> replied to your post in <strong>${data.courseName}</strong>:</p>

              <div class="discussion">
                <p style="margin: 0; color: #115e59; font-size: 12px; text-transform: uppercase; font-weight: 600;">Your Post</p>
                <p style="margin: 5px 0 0 0; color: #134e4a;">${data.originalPost}</p>
              </div>

              <div class="reply">
                <p style="margin: 0 0 10px 0; color: #0f766e; font-weight: 600;">${data.replierName}:</p>
                <p style="margin: 0;">${data.replyContent}</p>
              </div>

              <p><strong>Topic:</strong> ${data.topicName}<br>
              <strong>Posted:</strong> ${data.replyDate}</p>

              <center>
                <a href="${data.discussionUrl}" class="button">View Discussion</a>
              </center>
            </div>
            <div class="footer">
              <p>Aiborg™ Learning Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: EmailNotification = await req.json();

    // Get user's notification preferences
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_notifications, notification_preferences')
      .eq('email', to)
      .single();

    // Check if user has email notifications enabled and this type is allowed
    if (profile && !profile.email_notifications) {
      return new Response(
        JSON.stringify({ success: true, message: 'Email notifications disabled for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (profile?.notification_preferences && profile.notification_preferences[type] === false) {
      return new Response(
        JSON.stringify({ success: true, message: `${type} notifications disabled for user` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get email template
    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Unknown email type: ${type}`);
    }

    const { subject, html } = template(data);

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Aiborg Learning <notifications@aiborg.ai>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await emailResponse.json();

    // Log notification
    await supabase.from('email_notifications_log').insert({
      user_email: to,
      notification_type: type,
      email_id: result.id,
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
