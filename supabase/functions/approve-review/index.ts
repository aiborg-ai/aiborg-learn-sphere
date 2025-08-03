import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const reviewId = url.searchParams.get('reviewId');
    const action = url.searchParams.get('action'); // 'approve' or 'reject'
    const key = url.searchParams.get('key');

    if (!reviewId || !action || !key) {
      return new Response("Missing required parameters", { status: 400, headers: corsHeaders });
    }

    // Verify the service key
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (key !== serviceKey) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let responseHtml = '';

    if (action === 'approve') {
      // Get review details first
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();

      if (reviewError) {
        throw reviewError;
      }

      // Approve the review
      const { error } = await supabase
        .from('reviews')
        .update({ approved: true })
        .eq('id', reviewId);

      if (error) {
        throw error;
      }

      // Get profile and course data separately to avoid foreign key issues
      const [profileResult, courseResult] = await Promise.allSettled([
        supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', review.user_id)
          .single(),
        supabase
          .from('courses')
          .select('title')
          .eq('id', review.course_id)
          .single()
      ]);

      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const course = courseResult.status === 'fulfilled' ? courseResult.value.data : null;

      // Send acceptance notification email
      if (profile?.email) {
        try {
          await supabase.functions.invoke('send-review-acceptance-notification', {
            body: {
              reviewId: review.id,
              userEmail: profile.email,
              userName: profile.display_name || profile.email,
              courseName: course?.title || 'Course',
              reviewType: review.review_type
            }
          });
        } catch (emailError) {
          console.error('Failed to send acceptance notification:', emailError);
          // Don't fail the approval if email fails
        }
      }

      responseHtml = `
        <html>
          <head><title>Review Approved</title></head>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 40px; border-radius: 8px;">
              <h1 style="color: #28a745;">✅ Review Approved!</h1>
              <p style="font-size: 18px; color: #666;">The review has been successfully approved and is now visible on the website.</p>
              <p style="color: #888; font-size: 14px; margin-top: 30px;">Review ID: ${reviewId}</p>
            </div>
          </body>
        </html>
      `;

    } else if (action === 'reject') {
      // Reject the review (delete it)
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        throw error;
      }

      responseHtml = `
        <html>
          <head><title>Review Rejected</title></head>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 40px; border-radius: 8px;">
              <h1 style="color: #dc3545;">❌ Review Rejected</h1>
              <p style="font-size: 18px; color: #666;">The review has been rejected and removed from the system.</p>
              <p style="color: #888; font-size: 14px; margin-top: 30px;">Review ID: ${reviewId}</p>
            </div>
          </body>
        </html>
      `;
    } else {
      return new Response("Invalid action", { status: 400, headers: corsHeaders });
    }

    return new Response(responseHtml, {
      status: 200,
      headers: { "Content-Type": "text/html", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error processing review action:", error);
    
    const errorHtml = `
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 40px; border-radius: 8px;">
            <h1 style="color: #dc3545;">❌ Error</h1>
            <p style="font-size: 18px; color: #666;">An error occurred while processing the review action.</p>
            <p style="color: #888; font-size: 14px; margin-top: 30px;">Error: ${error.message}</p>
          </div>
        </body>
      </html>
    `;

    return new Response(errorHtml, {
      status: 500,
      headers: { "Content-Type": "text/html", ...corsHeaders },
    });
  }
};

serve(handler);