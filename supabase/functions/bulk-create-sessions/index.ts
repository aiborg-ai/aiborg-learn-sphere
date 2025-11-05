// Edge Function: bulk-create-sessions
// Creates recurring course sessions based on schedule

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkCreateRequest {
  courseId: number;
  startDate: string;
  endDate: string;
  dayOfWeek: number; // 0-6, where 0 is Sunday
  startTime: string;
  endTime: string;
  frequency: 'weekly' | 'biweekly';
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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated and has permission
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const body: BulkCreateRequest = await req.json();
    const {
      courseId,
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
      !courseId ||
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
            'Missing required fields: courseId, startDate, endDate, dayOfWeek, startTime, endTime, frequency',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is instructor or admin
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('id, title, instructor_id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return new Response(JSON.stringify({ error: 'Course not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is instructor of this course or an admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);
    const isInstructor = course.instructor_id === user.id;

    if (!isAdmin && !isInstructor) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - you must be the course instructor or an admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Get the highest existing session number for this course
    const { data: maxSessionData } = await supabaseClient
      .from('course_sessions')
      .select('session_number')
      .eq('course_id', courseId)
      .order('session_number', { ascending: false })
      .limit(1)
      .single();

    let sessionNumber = (maxSessionData?.session_number || 0) + 1;

    // Generate sessions
    while (currentDate <= end) {
      const sessionTitle = title || `${course.title} - Session ${sessionNumber}`;

      sessions.push({
        course_id: courseId,
        session_number: sessionNumber,
        title: sessionTitle,
        description: description || null,
        session_type: 'scheduled',
        session_date: currentDate.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
        location: location || null,
        meeting_url: meetingUrl || null,
        max_capacity: maxCapacity || null,
        status: 'scheduled',
        check_in_enabled: false,
      });

      sessionNumber++;

      // Move to next occurrence
      if (frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (frequency === 'biweekly') {
        currentDate.setDate(currentDate.getDate() + 14);
      }
    }

    if (sessions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No sessions generated - check your date range and day of week' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert sessions (triggers will auto-generate tickets)
    const { data: createdSessions, error: insertError } = await supabaseClient
      .from('course_sessions')
      .insert(sessions)
      .select();

    if (insertError) {
      console.error('Session creation error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create sessions', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${createdSessions.length} sessions`,
        sessionsCreated: createdSessions.length,
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
