import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ReviewAcceptanceRequest {
  reviewId: string;
  userEmail: string;
  userName: string;
  courseName: string;
  reviewType: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Review acceptance notification function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewId, userEmail, userName, courseName, reviewType }: ReviewAcceptanceRequest = await req.json();

    console.log('Processing review acceptance notification:', { reviewId, userEmail, userName, courseName, reviewType });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Review Approved - AI Borg Academy</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Your Review is Live!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${userName},</p>
            
            <p style="margin-bottom: 20px;">
              Great news! Your ${reviewType} review for <strong>"${courseName}"</strong> has been approved and is now visible on the AI Borg Academy website.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; font-style: italic; color: #666;">
                "Thank you for sharing your experience with our learning community. Your honest feedback helps other learners make informed decisions about their AI education journey."
              </p>
            </div>
            
            <p style="margin-bottom: 20px;">
              Your review is helping other students discover the value of AI education and making a positive impact on our community.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://aiborg.academy" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold;
                        display: inline-block;">
                View Your Review on AI Borg Academy
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
              <strong>What's next?</strong>
            </p>
            <ul style="color: #666; font-size: 14px; padding-left: 20px;">
              <li>Share your success with friends and colleagues</li>
              <li>Explore our advanced AI courses for continued learning</li>
              <li>Join our alumni network for ongoing support and opportunities</li>
            </ul>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Best regards,<br>
              <strong>The AI Borg Academy Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>AI Borg Academy - Transforming Careers Through AI Education</p>
            <p>This email was sent regarding your course review. If you have any questions, please contact our support team.</p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AI Borg Academy <reviews@aiborg.academy>",
      to: [userEmail],
      subject: "🎉 Your Review is Now Live on AI Borg Academy!",
      html: emailHtml,
    });

    console.log('Review acceptance email sent successfully:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-review-acceptance-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);