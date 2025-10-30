/**
 * Edge Function: create-session-meeting
 * Generate Jitsi meeting room for a session (admin-only)
 * Feature: 001-create-a-free (Free Introductory AI Session)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateJitsiRoom } from '../_shared/session-helpers.ts';
import { sessionCreationSchema, validateRequest } from '../_shared/validation-schemas.ts';

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
    const validation = validateRequest(sessionCreationSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { sessionId } = validation.data;

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if session exists
    const { data: session, error: sessionError } = await supabaseClient
      .from('free_sessions')
      .select('id, title, meeting_url')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found',
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if meeting already exists
    if (session.meeting_url) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            meetingUrl: session.meeting_url,
            message: 'Meeting room already exists',
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate Jitsi room
    const { url, roomName } = generateJitsiRoom(sessionId);

    // Update session with meeting details
    const { error: updateError } = await supabaseClient
      .from('free_sessions')
      .update({
        meeting_url: url,
        meeting_room_name: roomName,
        meeting_provider: 'jitsi',
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to save meeting details',
          },
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
        data: {
          meetingUrl: url,
          roomName: roomName,
          provider: 'jitsi',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
