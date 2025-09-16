import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ReviewNotificationRequest {
  reviewId: string;
  reviewContent: string;
  rating: number;
  courseName: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewId, reviewContent, rating, courseName, userName }: ReviewNotificationRequest = await req.json();

    // Create approval and rejection URLs
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const approveUrl = `${supabaseUrl}/functions/v1/approve-review?reviewId=${reviewId}&action=approve&key=${serviceKey}`;
    const rejectUrl = `${supabaseUrl}/functions/v1/approve-review?reviewId=${reviewId}&action=reject&key=${serviceKey}`;

    const emailHtml = `
      <h2>New Review Submitted for Approval</h2>
      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3>Course: ${courseName}</h3>
        <p><strong>Student:</strong> ${userName}</p>
        <p><strong>Rating:</strong> ${'⭐'.repeat(rating)} (${rating}/5)</p>
        <p><strong>Review:</strong></p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 10px 0;">
          ${reviewContent}
        </div>
      </div>
      
      <div style="margin: 30px 0;">
        <h3>Admin Actions:</h3>
        <p style="margin-bottom: 20px;">Click one of the buttons below to approve or reject this review:</p>
        
        <table style="margin: 20px 0;">
          <tr>
            <td style="padding: 10px;">
              <a href="${approveUrl}" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                ✅ APPROVE REVIEW
              </a>
            </td>
            <td style="padding: 10px;">
              <a href="${rejectUrl}" 
                 style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                ❌ REJECT REVIEW
              </a>
            </td>
          </tr>
        </table>
      </div>
      
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 14px;">
        This email was automatically generated when a new review was submitted to your platform.
        <br>Review ID: ${reviewId}
      </p>
    `;

    const emailResponse = await resend.emails.send({
      from: "AI Learning Platform <onboarding@resend.dev>",
      to: ["hirendra.vikram@aiborg.ai"],
      subject: `New Review Pending Approval - ${courseName}`,
      html: emailHtml,
    });

    console.log("Review notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("Error sending review notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);