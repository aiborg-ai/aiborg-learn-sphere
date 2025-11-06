// Edge Function: register-event-series
// Handles user registration for recurring event series
// Auto-generates tickets for all scheduled sessions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterEventSeriesRequest {
  eventId: number;
  paymentMethod?: string;
  notes?: string;
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized - please login' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const body: RegisterEventSeriesRequest = await req.json();
    const { eventId, paymentMethod, notes } = body;

    // Validate required fields
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Missing required field: eventId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify event exists and is a series
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('id, title, is_series, series_name, price')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!event.is_series) {
      return new Response(JSON.stringify({ error: 'This event is not a recurring series' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is already registered
    const { data: existingRegistration } = await supabaseClient
      .from('event_series_registrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingRegistration) {
      return new Response(
        JSON.stringify({ error: 'You are already registered for this event series' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for email notifications
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email, display_name')
      .eq('id', user.id)
      .single();

    // Create series registration
    // The database trigger will auto-generate tickets for all future sessions
    const { data: registration, error: registrationError } = await supabaseClient
      .from('event_series_registrations')
      .insert({
        user_id: user.id,
        event_id: eventId,
        payment_status: 'completed', // For free events, mark as completed
        payment_amount: parseFloat(event.price) || 0.0,
        payment_method: paymentMethod || 'free',
        auto_generate_tickets: true,
        notes: notes || null,
      })
      .select()
      .single();

    if (registrationError) {
      console.error('Registration error:', registrationError);
      return new Response(
        JSON.stringify({
          error: 'Failed to register for event series',
          details: registrationError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count how many tickets were generated
    const { count: ticketsCount } = await supabaseClient
      .from('event_session_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_id', eventId);

    // Get upcoming sessions for confirmation
    const { data: upcomingSessions } = await supabaseClient
      .from('event_sessions')
      .select('id, session_number, title, session_date, start_time, end_time, meeting_url')
      .eq('event_id', eventId)
      .gte('session_date', new Date().toISOString().split('T')[0])
      .eq('status', 'scheduled')
      .order('session_date', { ascending: true })
      .limit(3);

    // TODO: Send confirmation email
    // This would integrate with your email service
    // For now, we'll return the data for the frontend to display

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully registered for ${event.title}`,
        registration: registration,
        ticketsGenerated: ticketsCount || 0,
        upcomingSessions: upcomingSessions || [],
        userEmail: profile?.email,
        userName: profile?.display_name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
