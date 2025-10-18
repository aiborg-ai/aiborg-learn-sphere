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
  type: 'course_enrollment' | 'assignment_due' | 'assignment_graded' | 'course_update' | 'new_announcement' | 'deadline_reminder' | 'certificate_ready' | 'discussion_reply' | 'family_membership_welcome' | 'family_invitation' | 'membership_payment_success' | 'membership_payment_failed' | 'membership_lifecycle' | 'membership_expiration_warning';
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

  // ============================================================================
  // FAMILY MEMBERSHIP EMAIL TEMPLATES
  // ============================================================================

  family_membership_welcome: (data: any) => ({
    subject: `🎉 Welcome to the Aiborg Family Membership!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #78350f; padding: 40px 30px; text-align: center; }
          .logo { font-size: 36px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; padding: 16px 32px; background: #f59e0b; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 20px 0; }
          .benefit-card { background: #fffbeb; padding: 20px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #fbbf24; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-box { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-number { font-size: 32px; font-weight: bold; color: #f59e0b; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          h1 { margin: 0 0 15px 0; font-size: 28px; color: #78350f; }
          h2 { color: #374151; font-size: 20px; margin: 20px 0 10px 0; }
          p { margin: 0 0 15px 0; }
          .highlight { color: #f59e0b; font-weight: 600; }
          ul { color: #4b5563; margin: 10px 0; padding-left: 25px; }
          li { margin: 8px 0; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ai<span style="color: white;">BORG</span>™</div>
              <h1 style="margin: 15px 0 5px 0; color: white; font-size: 24px;">Family Membership Activated!</h1>
              <p style="margin: 0; opacity: 0.9; color: white;">Lifetime AI Learning for Your Entire Family</p>
            </div>
            <div class="content">
              <p>Hi ${data.primaryMemberName},</p>
              <p>🎊 Congratulations! Your <span class="highlight">Family Membership Pass</span> is now active. You've unlocked unlimited AI learning for up to ${data.maxFamilyMembers} family members!</p>

              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-number">${data.maxFamilyMembers}</div>
                  <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Family Members</p>
                </div>
                <div class="stat-box">
                  <div class="stat-number">∞</div>
                  <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Lifetime Access</p>
                </div>
              </div>

              <h2>🚀 What's Included:</h2>

              <div class="benefit-card">
                <strong>✅ All AI Courses & Workshops</strong>
                <p style="margin: 5px 0 0 0; color: #92400e;">Complete access to our entire course library, including future releases</p>
              </div>

              <div class="benefit-card">
                <strong>✅ Exclusive Vault Resources</strong>
                <p style="margin: 5px 0 0 0; color: #92400e;">Premium templates, tools, and downloadable content</p>
              </div>

              <div class="benefit-card">
                <strong>✅ Community Events</strong>
                <p style="margin: 5px 0 0 0; color: #92400e;">Live workshops, networking events, and expert Q&A sessions</p>
              </div>

              <div class="benefit-card">
                <strong>✅ Priority Support</strong>
                <p style="margin: 5px 0 0 0; color: #92400e;">Fast-track assistance for all family members</p>
              </div>

              <h2>👨‍👩‍👧‍👦 Next Steps:</h2>
              <ul>
                <li><strong>Invite Your Family:</strong> Add up to ${data.maxFamilyMembers} family members with unique logins</li>
                <li><strong>Explore the Dashboard:</strong> Browse courses and start learning immediately</li>
                <li><strong>Access the Vault:</strong> Download exclusive AI resources and templates</li>
                <li><strong>Join Events:</strong> Register for upcoming workshops and webinars</li>
              </ul>

              <center>
                <a href="${data.dashboardUrl}" class="button">Go to Family Dashboard →</a>
              </center>

              <p style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
                <strong style="color: #065f46;">💡 Pro Tip:</strong> Invite your family members now so they can start learning right away. Each member gets their own account with personalized progress tracking!
              </p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
                Questions? We're here to help! Reply to this email or contact our support team.
              </p>
            </div>
            <div class="footer">
              <p><strong>Aiborg™ Family Membership</strong></p>
              <p>Empowering families through AI education</p>
              <p style="margin-top: 20px;">
                <a href="${data.dashboardUrl}" style="color: #f59e0b;">Dashboard</a> |
                <a href="${data.inviteFamilyUrl}" style="color: #f59e0b;">Invite Family</a> |
                <a href="${data.settingsUrl}" style="color: #f59e0b;">Settings</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  family_invitation: (data: any) => ({
    subject: `🎁 ${data.primaryMemberName} invited you to Aiborg Family Membership!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; padding: 16px 32px; background: #8b5cf6; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .invitation-card { background: #faf5ff; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid #8b5cf6; text-align: center; }
          .avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); display: inline-flex; align-items: center; justify-content: center; font-size: 36px; margin-bottom: 15px; }
          .expiry-warning { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .benefits-list { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          h1 { margin: 0 0 10px 0; font-size: 28px; }
          h2 { color: #374151; font-size: 20px; margin: 20px 0 10px 0; }
          p { margin: 0 0 15px 0; }
          .highlight { color: #8b5cf6; font-weight: 600; }
          ul { margin: 10px 0; padding-left: 25px; }
          li { margin: 8px 0; color: #4b5563; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: white;">🎁 You're Invited!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Join Your Family's AI Learning Journey</p>
            </div>
            <div class="content">
              <div class="invitation-card">
                <div class="avatar">👋</div>
                <h2 style="margin: 0 0 10px 0; color: #6b21a8;">${data.primaryMemberName}</h2>
                <p style="margin: 0; color: #7c3aed;">has invited you to join</p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #6b21a8;">Aiborg Family Membership</p>
              </div>

              <p>Hi ${data.inviteeName},</p>
              <p>Great news! ${data.primaryMemberName} wants to share <span class="highlight">lifetime access to AI learning</span> with you through their Family Membership Pass.</p>

              <h2>✨ What You'll Get:</h2>
              <div class="benefits-list">
                <ul style="margin: 0; padding-left: 20px;">
                  <li>🎓 <strong>Unlimited AI Courses</strong> - Access all current and future courses</li>
                  <li>📚 <strong>Exclusive Vault</strong> - Premium resources, templates & tools</li>
                  <li>🎯 <strong>Live Workshops</strong> - Expert-led sessions and Q&A</li>
                  <li>🤝 <strong>Community Access</strong> - Network with AI enthusiasts</li>
                  <li>📊 <strong>Personal Dashboard</strong> - Track your learning progress</li>
                  <li>🎖️ <strong>Certificates</strong> - Earn credentials for completed courses</li>
                </ul>
              </div>

              <div class="expiry-warning">
                <p style="margin: 0; color: #92400e;"><strong>⏰ Important:</strong> This invitation expires in <strong>${data.daysUntilExpiry} days</strong> (${data.expiryDate}). Accept now to secure your access!</p>
              </div>

              <center>
                <a href="${data.acceptInvitationUrl}" class="button">Accept Invitation & Create Account →</a>
              </center>

              <p style="margin-top: 30px; padding: 20px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <strong style="color: #1e40af;">How it works:</strong> Click the button above to create your personal account. You'll get your own login credentials and personalized learning dashboard. Your progress is tracked separately from other family members.
              </p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; text-align: center;">
                <small>This invitation was sent to ${data.inviteeEmail} by ${data.primaryMemberName}.<br>
                If you didn't expect this invitation, you can safely ignore this email.</small>
              </p>
            </div>
            <div class="footer">
              <p><strong>Aiborg™ Learning Platform</strong></p>
              <p>AI-Augmented Human Learning</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  membership_payment_success: (data: any) => ({
    subject: `✅ Payment Confirmed - Aiborg Family Membership`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .success-icon { font-size: 64px; margin: 10px 0; }
          .payment-card { background: #f0fdf4; border: 2px solid #10b981; padding: 25px; border-radius: 12px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #d1fae5; }
          .detail-row:last-child { border-bottom: none; }
          .amount { font-size: 36px; font-weight: bold; color: #059669; text-align: center; margin: 15px 0; }
          .button { display: inline-block; padding: 14px 28px; background: #10b981; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #374151; font-size: 20px; margin: 20px 0 10px 0; }
          p { margin: 0 0 15px 0; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1 style="color: white;">Payment Successful!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Family Membership is Active</p>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>Thank you for your payment! Your <strong>Aiborg Family Membership</strong> subscription has been successfully renewed.</p>

              <div class="payment-card">
                <h2 style="margin: 0 0 20px 0; color: #065f46; text-align: center;">Payment Details</h2>

                <div class="detail-row">
                  <span style="color: #6b7280;">Plan:</span>
                  <strong>${data.planName}</strong>
                </div>

                <div class="detail-row">
                  <span style="color: #6b7280;">Billing Period:</span>
                  <strong>${data.billingPeriod}</strong>
                </div>

                <div class="detail-row">
                  <span style="color: #6b7280;">Invoice Number:</span>
                  <strong>${data.invoiceNumber}</strong>
                </div>

                <div class="detail-row">
                  <span style="color: #6b7280;">Payment Method:</span>
                  <strong>${data.paymentMethod}</strong>
                </div>

                <div class="detail-row">
                  <span style="color: #6b7280;">Date:</span>
                  <strong>${data.paymentDate}</strong>
                </div>

                <div class="amount">${data.amount}</div>
                <p style="text-align: center; color: #6b7280; margin: 0;">Paid</p>
              </div>

              <h2>📅 Your Membership:</h2>
              <ul style="color: #4b5563;">
                <li><strong>Status:</strong> Active</li>
                <li><strong>Current Period:</strong> ${data.currentPeriodStart} - ${data.currentPeriodEnd}</li>
                <li><strong>Next Billing Date:</strong> ${data.nextBillingDate}</li>
                <li><strong>Family Members:</strong> ${data.activeFamilyMembers} / ${data.maxFamilyMembers}</li>
              </ul>

              <center>
                <a href="${data.invoiceUrl}" class="button">Download Invoice</a>
              </center>

              <p style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
                <strong>Need to make changes?</strong> You can update your payment method, manage family members, or view billing history in your account settings.
              </p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
                Questions about your payment? Contact our billing support team at billing@aiborg.ai
              </p>
            </div>
            <div class="footer">
              <p><strong>Aiborg™ Family Membership</strong></p>
              <p style="margin-top: 15px;">
                <a href="${data.dashboardUrl}" style="color: #10b981;">Dashboard</a> |
                <a href="${data.billingUrl}" style="color: #10b981;">Billing History</a> |
                <a href="${data.settingsUrl}" style="color: #10b981;">Settings</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  membership_payment_failed: (data: any) => ({
    subject: `⚠️ Payment Failed - Action Required for Family Membership`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .alert-icon { font-size: 64px; margin: 10px 0; }
          .alert-card { background: #fee2e2; border: 3px solid #ef4444; padding: 25px; border-radius: 12px; margin: 20px 0; }
          .button { display: inline-block; padding: 16px 32px; background: #ef4444; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .info-box { background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #374151; font-size: 20px; margin: 20px 0 10px 0; }
          p { margin: 0 0 15px 0; }
          ul { color: #4b5563; margin: 10px 0; padding-left: 25px; }
          li { margin: 8px 0; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <div class="alert-icon">⚠️</div>
              <h1 style="color: white;">Payment Failed</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required to Continue Your Membership</p>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>

              <div class="alert-card">
                <h2 style="margin: 0 0 15px 0; color: #991b1b;">Payment Unsuccessful</h2>
                <p style="margin: 0; color: #7f1d1d;">We were unable to process your payment for the Aiborg Family Membership. Your subscription is currently <strong>past due</strong>.</p>
              </div>

              <h2>💳 Payment Details:</h2>
              <ul>
                <li><strong>Amount Due:</strong> ${data.amountDue}</li>
                <li><strong>Billing Period:</strong> ${data.billingPeriod}</li>
                <li><strong>Payment Method:</strong> ${data.paymentMethod}</li>
                <li><strong>Attempted On:</strong> ${data.attemptDate}</li>
              </ul>

              <h2>📋 Common Reasons:</h2>
              <ul>
                <li>Insufficient funds in your account</li>
                <li>Expired or invalid payment method</li>
                <li>Card limit reached</li>
                <li>Bank declined the transaction</li>
              </ul>

              <div class="info-box">
                <p style="margin: 0 0 10px 0; color: #1e40af;"><strong>⏰ Your Access:</strong></p>
                <p style="margin: 0; color: #1e3a8a;">Your family still has access to all features for now. However, if payment is not received within ${data.gracePeriodDays} days, access will be suspended on <strong>${data.suspensionDate}</strong>.</p>
              </div>

              <h2>🔧 How to Fix:</h2>
              <p><strong>Option 1: Update Payment Method</strong></p>
              <p>Add a new credit card or update your existing payment details.</p>

              <center>
                <a href="${data.updatePaymentUrl}" class="button">Update Payment Method →</a>
              </center>

              <p style="margin-top: 20px;"><strong>Option 2: Retry Current Payment</strong></p>
              <p>We'll automatically retry charging your current payment method in 3 days. You can also trigger a manual retry from your dashboard.</p>

              <center>
                <a href="${data.retryPaymentUrl}" class="button" style="background: #3b82f6;">Retry Payment Now</a>
              </center>

              <p style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <strong style="color: #92400e;">Need Help?</strong> Our billing team is here to assist you. Contact us at <a href="mailto:billing@aiborg.ai" style="color: #d97706;">billing@aiborg.ai</a> or reply to this email.
              </p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; text-align: center;">
                <small>This is an automated notification. Your account will be retried automatically.</small>
              </p>
            </div>
            <div class="footer">
              <p><strong>Aiborg™ Billing Support</strong></p>
              <p style="margin-top: 15px;">
                <a href="${data.dashboardUrl}" style="color: #ef4444;">Dashboard</a> |
                <a href="${data.billingUrl}" style="color: #ef4444;">Billing</a> |
                <a href="${data.supportUrl}" style="color: #ef4444;">Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  membership_lifecycle: (data: any) => ({
    subject: `📋 ${data.actionTitle} - Family Membership Update`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .status-card { background: #eff6ff; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .button { display: inline-block; padding: 14px 28px; background: #3b82f6; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .info-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #374151; font-size: 20px; margin: 20px 0 10px 0; }
          p { margin: 0 0 15px 0; }
          ul { color: #4b5563; margin: 10px 0; padding-left: 25px; }
          li { margin: 8px 0; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white;">Membership ${data.actionTitle}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.actionSubtitle}</p>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>${data.message}</p>

              <div class="status-card">
                <h2 style="margin: 0 0 15px 0; color: #1e40af;">Membership Status</h2>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #bfdbfe;">
                  <span style="color: #6b7280;">Status:</span>
                  <strong>${data.currentStatus}</strong>
                </div>
                ${data.effectiveDate ? `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #bfdbfe;">
                  <span style="color: #6b7280;">Effective Date:</span>
                  <strong>${data.effectiveDate}</strong>
                </div>
                ` : ''}
                ${data.endDate ? `
                <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                  <span style="color: #6b7280;">End Date:</span>
                  <strong>${data.endDate}</strong>
                </div>
                ` : ''}
              </div>

              ${data.whatHappensNext ? `
              <h2>What Happens Next:</h2>
              <div class="info-box">
                ${data.whatHappensNext}
              </div>
              ` : ''}

              ${data.actionRequired ? `
              <h2>Action Required:</h2>
              <p>${data.actionRequired}</p>
              ` : ''}

              <center>
                <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
              </center>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
                Questions about this change? Contact us at support@aiborg.ai or visit our <a href="${data.helpUrl}" style="color: #3b82f6;">help center</a>.
              </p>
            </div>
            <div class="footer">
              <p><strong>Aiborg™ Family Membership</strong></p>
              <p style="margin-top: 15px;">
                <a href="${data.dashboardUrl}" style="color: #3b82f6;">Dashboard</a> |
                <a href="${data.settingsUrl}" style="color: #3b82f6;">Settings</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  membership_expiration_warning: (data: any) => ({
    subject: `⏰ Your Family Membership Access Expires in ${data.daysRemaining} Days`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .countdown-box { background: #fef3c7; border: 3px solid #f59e0b; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; }
          .countdown { font-size: 56px; font-weight: bold; color: #d97706; margin: 10px 0; }
          .button { display: inline-block; padding: 16px 32px; background: #f59e0b; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .benefits-reminder { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #374151; font-size: 20px; margin: 20px 0 10px 0; }
          p { margin: 0 0 15px 0; }
          ul { color: #4b5563; margin: 10px 0; padding-left: 25px; }
          li { margin: 8px 0; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white;">⏰ Access Expiring Soon</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Don't Lose Your Family Membership Benefits</p>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>

              <div class="countdown-box">
                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">Your membership access ends in:</p>
                <div class="countdown">${data.daysRemaining}</div>
                <p style="margin: 10px 0 0 0; color: #92400e; font-size: 18px;">Days</p>
                <p style="margin: 15px 0 0 0; color: #78350f;">Expiration Date: <strong>${data.expirationDate}</strong></p>
              </div>

              <p>Your Family Membership subscription will expire soon. After <strong>${data.expirationDate}</strong>, you and your family members will lose access to:</p>

              <div class="benefits-reminder">
                <h2 style="margin: 0 0 15px 0; color: #065f46;">What You'll Lose:</h2>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>❌ <strong>All AI Courses</strong> - ${data.totalCourses}+ courses</li>
                  <li>❌ <strong>Exclusive Vault Resources</strong> - Premium templates & tools</li>
                  <li>❌ <strong>Live Workshops & Events</strong> - Expert-led sessions</li>
                  <li>❌ <strong>Family Member Access</strong> - ${data.familyMembersCount} active members</li>
                  <li>❌ <strong>Community Forum</strong> - Networking & support</li>
                  <li>❌ <strong>Course Certificates</strong> - Professional credentials</li>
                </ul>
              </div>

              <h2>💡 Renew Now to Keep Learning:</h2>
              <p>Continue your family's AI learning journey without interruption. Renew your membership today and keep all your progress and benefits.</p>

              <center>
                <a href="${data.renewUrl}" class="button">Renew Membership Now →</a>
              </center>

              <p style="margin-top: 30px; padding: 20px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <strong style="color: #1e40af;">💰 Current Progress:</strong><br>
                • ${data.coursesCompleted} courses completed<br>
                • ${data.certificatesEarned} certificates earned<br>
                • ${data.learningHours} hours of learning<br>
                <br>
                Don't lose your family's achievements!
              </p>

              <h2>❓ Have Questions?</h2>
              <p>Need help or want to discuss your renewal options? We're here to help:</p>
              <ul>
                <li>📧 Email: support@aiborg.ai</li>
                <li>💬 Live Chat: <a href="${data.dashboardUrl}" style="color: #f59e0b;">Available in dashboard</a></li>
                <li>📞 Phone: Available for premium members</li>
              </ul>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; text-align: center;">
                <small>This is a courtesy reminder. You'll receive another notification 3 days before expiration.</small>
              </p>
            </div>
            <div class="footer">
              <p><strong>Aiborg™ Family Membership</strong></p>
              <p>Don't Let Your Learning Journey End</p>
              <p style="margin-top: 15px;">
                <a href="${data.renewUrl}" style="color: #f59e0b;">Renew Now</a> |
                <a href="${data.dashboardUrl}" style="color: #f59e0b;">Dashboard</a> |
                <a href="${data.settingsUrl}" style="color: #f59e0b;">Settings</a>
              </p>
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
