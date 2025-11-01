import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamInvitationRequest {
  invitationId: string;
  inviteeEmail: string;
  inviteeFirstName?: string;
  inviteeLastName?: string;
  organizationName: string;
  inviterName: string;
  role?: string;
  department?: string;
  expiresAt: string;
  acceptUrl: string;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: TeamInvitationRequest = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate days until expiry
    const expiryDate = new Date(payload.expiresAt);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Build email HTML
    const inviteeName = payload.inviteeFirstName
      ? `${payload.inviteeFirstName} ${payload.inviteeLastName || ''}`.trim()
      : 'there';

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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .invitation-card {
              background: #faf5ff;
              padding: 25px;
              border-radius: 12px;
              margin: 20px 0;
              border: 2px solid #8b5cf6;
              text-align: center;
            }
            .avatar {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 36px;
              margin-bottom: 15px;
              color: white;
            }
            .org-name {
              font-size: 24px;
              font-weight: bold;
              color: #6b21a8;
              margin: 10px 0;
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: #8b5cf6;
              color: white !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 700;
              margin: 20px 0;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .button:hover {
              background: #7c3aed;
            }
            .details-box {
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
            .expiry-warning {
              background: #fef3c7;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
              margin: 20px 0;
            }
            .features-list {
              background: #eff6ff;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
              margin: 20px 0;
            }
            .features-list ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .features-list li {
              margin: 8px 0;
              color: #1e40af;
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
              color: #374151;
              font-size: 20px;
              margin: 20px 0 10px 0;
            }
            p {
              margin: 0 0 15px 0;
            }
            .highlight {
              color: #8b5cf6;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ai<span style="color: #fbbf24;">BORG</span>™</div>
              <h1 style="margin: 0; color: white;">Team Invitation</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Join Your Organization's Learning Platform</p>
            </div>
            <div class="content">
              <div class="invitation-card">
                <div class="avatar">🤝</div>
                <h2 style="margin: 0 0 10px 0; color: #6b21a8;">${payload.inviterName}</h2>
                <p style="margin: 0; color: #7c3aed;">from</p>
                <div class="org-name">${payload.organizationName}</div>
                <p style="margin: 10px 0 0 0; color: #7c3aed;">has invited you to join their team</p>
              </div>

              <p>Hi ${inviteeName},</p>
              <p>You've been invited to join <span class="highlight">${payload.organizationName}</span>'s team on the Aiborg Learning Platform!</p>

              ${
                payload.role || payload.department
                  ? `
              <div class="details-box">
                <h2 style="margin: 0 0 15px 0; color: #374151;">Your Team Details</h2>
                ${
                  payload.role
                    ? `
                <div class="detail-row">
                  <span style="color: #6b7280;">Role:</span>
                  <strong>${payload.role}</strong>
                </div>
                `
                    : ''
                }
                ${
                  payload.department
                    ? `
                <div class="detail-row">
                  <span style="color: #6b7280;">Department:</span>
                  <strong>${payload.department}</strong>
                </div>
                `
                    : ''
                }
              </div>
              `
                  : ''
              }

              <h2>🚀 What You'll Get:</h2>
              <div class="features-list">
                <ul style="margin: 0; padding-left: 20px;">
                  <li>📚 <strong>Access to Organization Courses</strong> - Learn with your team</li>
                  <li>🎯 <strong>Personalized Learning Path</strong> - Customized for your role</li>
                  <li>📊 <strong>Progress Tracking</strong> - Monitor your learning journey</li>
                  <li>🤝 <strong>Team Collaboration</strong> - Connect with colleagues</li>
                  <li>🎓 <strong>Certificates</strong> - Earn professional credentials</li>
                  <li>💬 <strong>Discussion Forums</strong> - Engage with your team</li>
                </ul>
              </div>

              <div class="expiry-warning">
                <p style="margin: 0; color: #92400e;"><strong>⏰ Important:</strong> This invitation expires in <strong>${daysUntilExpiry} days</strong>. Accept now to join your team!</p>
              </div>

              <center>
                <a href="${payload.acceptUrl}" class="button">Accept Invitation & Join Team →</a>
              </center>

              <p style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
                <strong style="color: #065f46;">How it works:</strong> Click the button above to create your account (if you don't have one) or join the organization with your existing account. You'll get immediate access to your team's learning resources.
              </p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; text-align: center;">
                <small>This invitation was sent to ${payload.inviteeEmail} by ${payload.inviterName} from ${payload.organizationName}.<br>
                If you didn't expect this invitation or have questions, please contact ${payload.inviterName} directly.</small>
              </p>
            </div>
            <div class="footer">
              <p><strong>Aiborg™ Learning Platform</strong></p>
              <p>AI-Augmented Human Learning for Organizations</p>
              <p style="margin-top: 15px;">
                <a href="https://aiborg.ai" style="color: #667eea;">Visit Aiborg</a>
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
        from: 'Aiborg Team <team@aiborg.ai>',
        to: [payload.inviteeEmail],
        subject: `${payload.inviterName} invited you to join ${payload.organizationName} on Aiborg`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await emailResponse.json();

    // Log the invitation email
    await supabase.from('email_notifications_log').insert({
      user_email: payload.inviteeEmail,
      notification_type: 'team_invitation',
      email_id: result.id,
      sent_at: new Date().toISOString(),
      metadata: {
        invitation_id: payload.invitationId,
        organization_name: payload.organizationName,
        inviter_name: payload.inviterName,
      },
    });

    // Update invitation status
    await supabase
      .from('organization_invitations')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', payload.invitationId);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: result.id,
        message: 'Team invitation email sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending team invitation:', error);
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
