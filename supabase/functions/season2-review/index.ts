import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewData {
  token: string;
  rating: number;
  testimonial: string;
  displayName: string;
  showCountry: boolean;
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // GET request - verify token and return registration info
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return new Response(JSON.stringify({ error: 'Missing review token' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find registration by review token
      const { data: registration, error: findError } = await supabase
        .from('season2_registrations')
        .select('id, full_name, program, country, status, review_token')
        .eq('review_token', token)
        .single();

      if (findError || !registration) {
        return new Response(JSON.stringify({ error: 'Invalid or expired review token' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if registration is confirmed
      if (registration.status !== 'confirmed') {
        return new Response(
          JSON.stringify({
            error: 'Registration not confirmed',
            message: 'Only confirmed registrants can submit reviews',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('season2_reviews')
        .select('id, status')
        .eq('registration_id', registration.id)
        .single();

      if (existingReview) {
        return new Response(
          JSON.stringify({
            error: 'Already reviewed',
            message: 'You have already submitted a review. Thank you!',
            reviewStatus: existingReview.status,
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return registration info for the form
      return new Response(
        JSON.stringify({
          valid: true,
          name: registration.full_name,
          program: registration.program,
          country: registration.country,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST request - submit review
    if (req.method === 'POST') {
      const data: ReviewData = await req.json();

      // Validate required fields
      if (!data.token || !data.rating || !data.testimonial || !data.displayName) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        return new Response(JSON.stringify({ error: 'Rating must be between 1 and 5' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate testimonial length
      if (data.testimonial.length < 20 || data.testimonial.length > 1000) {
        return new Response(
          JSON.stringify({ error: 'Testimonial must be between 20 and 1000 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find registration by review token
      const { data: registration, error: findError } = await supabase
        .from('season2_registrations')
        .select('id, full_name, program, country, status')
        .eq('review_token', data.token)
        .single();

      if (findError || !registration) {
        return new Response(JSON.stringify({ error: 'Invalid or expired review token' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if registration is confirmed
      if (registration.status !== 'confirmed') {
        return new Response(
          JSON.stringify({ error: 'Only confirmed registrants can submit reviews' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('season2_reviews')
        .select('id')
        .eq('registration_id', registration.id)
        .single();

      if (existingReview) {
        return new Response(JSON.stringify({ error: 'You have already submitted a review' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get request metadata
      const userAgent = req.headers.get('user-agent') || '';
      const forwardedFor = req.headers.get('x-forwarded-for');
      const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

      // Insert review
      const { data: review, error: insertError } = await supabase
        .from('season2_reviews')
        .insert({
          registration_id: registration.id,
          rating: data.rating,
          testimonial: data.testimonial.trim(),
          display_name: data.displayName.trim(),
          show_country: data.showCountry ?? true,
          program: registration.program,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save review', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Thank you for your review! It will be visible after approval.',
          reviewId: review.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
