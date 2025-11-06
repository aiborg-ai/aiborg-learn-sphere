// Edge Function: bulk-create-event-sessions
// Creates recurring event sessions for event series
// Similar to bulk-create-sessions but for events instead of courses

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkCreateEventSessionsRequest {
  eventId: number;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  dayOfWeek: number; // 0-6, where 0 is Sunday, 5 is Friday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  frequency: 'weekly' | 'biweekly' | 'monthly';
  title?: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  maxCapacity?: number;
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
    const body: BulkCreateEventSessionsRequest = await req.json();
    const {
      eventId,
      startDate,
      endDate,
      dayOfWeek,
      startTime,
      endTime,
      frequency,
      title,
      description,
      location,
      meetingUrl,
      maxCapacity,
    } = body;

    // Validate required fields
    if (
      !eventId ||
      !startDate ||
      !endDate ||
      dayOfWeek === undefined ||
      !startTime ||
      !endTime ||
      !frequency
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Missing required fields: eventId, startDate, endDate, dayOfWeek, startTime, endTime, frequency',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin (only admins can create event series)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - only admins can create event sessions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify event exists and is a series
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('id, title, is_series, meeting_url')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate session dates
    const sessions: any[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let currentDate = new Date(start);

    // Find the first occurrence of the specified day of week
    while (currentDate.getDay() !== dayOfWeek) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get the highest existing session number for this event
    const { data: maxSessionData } = await supabaseClient
      .from('event_sessions')
      .select('session_number')
      .eq('event_id', eventId)
      .order('session_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    let sessionNumber = (maxSessionData?.session_number || 0) + 1;

    // Generate sessions based on frequency
    while (currentDate <= end) {
      const sessionTitle = title || `${event.title} - Session ${sessionNumber}`;

      sessions.push({
        event_id: eventId,
        session_number: sessionNumber,
        title: sessionTitle,
        description: description || null,
        session_type: 'scheduled',
        session_date: currentDate.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
        location: location || null,
        meeting_url: meetingUrl || event.meeting_url || null,
        max_capacity: maxCapacity || 50, // Default to 50 for events
        status: 'scheduled',
        check_in_enabled: true, // Enable check-in by default for events
      });

      sessionNumber++;

      // Move to next occurrence based on frequency
      if (frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (frequency === 'biweekly') {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (frequency === 'monthly') {
        // Move to same day next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Adjust for day of week if needed
        while (currentDate.getDay() !== dayOfWeek) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    if (sessions.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No sessions generated - check your date range and day of week',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert sessions (triggers will auto-generate tickets for registered users)
    const { data: createdSessions, error: insertError } = await supabaseClient
      .from('event_sessions')
      .insert(sessions)
      .select();

    if (insertError) {
      console.error('Session creation error:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create event sessions',
          details: insertError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${createdSessions?.length || 0} event sessions`,
        sessionsCreated: createdSessions?.length || 0,
        sessions: createdSessions,
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
