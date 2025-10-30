/**
 * Edge Function: track-attendance
 * Track session attendance (join/leave events from Jitsi)
 * Feature: 001-create-a-free (Free Introductory AI Session)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { attendanceSchema, validateRequest } from '../_shared/validation-schemas.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate request
    const validation = validateRequest(attendanceSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const {
      sessionId,
      userId,
      event,
      timestamp,
      jitsiParticipantId,
      displayName,
      deviceType,
      browser,
    } = validation.data;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify session exists
    const { data: session, error: sessionError } = await supabaseClient
      .from('free_sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (event === 'join') {
      // Record join event
      const { data: attendance, error: insertError } = await supabaseClient
        .from('session_attendance')
        .insert({
          session_id: sessionId,
          user_id: userId || null,
          jitsi_participant_id: jitsiParticipantId || null,
          display_name: displayName || null,
          joined_at: timestamp,
          device_type: deviceType || null,
          browser: browser || null,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to record join event:', insertError);
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'INSERT_FAILED', message: 'Failed to record attendance' },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: { attendanceRecordId: attendance.id, event: 'join' },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (event === 'leave') {
      // Update existing attendance record with leave time
      const { data: updated, error: updateError } = await supabaseClient
        .from('session_attendance')
        .update({
          left_at: timestamp,
        })
        .eq('session_id', sessionId)
        .eq('jitsi_participant_id', jitsiParticipantId)
        .is('left_at', null) // Only update if not already set
        .select('id, joined_at, left_at')
        .single();

      if (updateError) {
        console.error('Failed to record leave event:', updateError);
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'UPDATE_FAILED', message: 'Failed to update attendance' },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Calculate duration
      const duration = updated
        ? Math.floor(
            (new Date(updated.left_at).getTime() - new Date(updated.joined_at).getTime()) / 1000
          )
        : null;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            attendanceRecordId: updated?.id,
            event: 'leave',
            durationSeconds: duration,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INVALID_EVENT', message: 'Event must be "join" or "leave"' },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
