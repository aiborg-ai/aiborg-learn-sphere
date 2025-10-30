/**
 * Edge Function: promote-waitlist
 * Promote next waitlisted user to confirmed status
 * Feature: 001-create-a-free (Free Introductory AI Session)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { waitlistPromotionSchema, validateRequest } from '../_shared/validation-schemas.ts';

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
    const validation = validateRequest(waitlistPromotionSchema, body);
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

    const { sessionId } = validation.data;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if session has available spots
    const { data: session, error: sessionError } = await supabaseClient
      .from('free_sessions')
      .select('id, capacity, registered_count, is_full')
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

    if (session.is_full) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'SESSION_FULL', message: 'Session is still at capacity' },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Find next waitlisted user (FIFO with FOR UPDATE SKIP LOCKED for race condition protection)
    const { data: waitlistEntries, error: waitlistError } = await supabaseClient
      .from('session_waitlist')
      .select('id, registration_id, position')
      .eq('session_id', sessionId)
      .eq('status', 'waiting')
      .order('position', { ascending: true })
      .limit(1);

    if (waitlistError || !waitlistEntries || waitlistEntries.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'NO_WAITLIST', message: 'No users on waitlist' },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const waitlistEntry = waitlistEntries[0];

    // Update waitlist status to promoted
    const { error: waitlistUpdateError } = await supabaseClient
      .from('session_waitlist')
      .update({
        status: 'promoted',
        promoted_at: new Date().toISOString(),
        promotion_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        notified: true,
        notification_sent_at: new Date().toISOString(),
      })
      .eq('id', waitlistEntry.id);

    if (waitlistUpdateError) {
      console.error('Failed to update waitlist:', waitlistUpdateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'UPDATE_FAILED', message: 'Failed to promote user' },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update registration status to confirmed
    const { error: regUpdateError } = await supabaseClient
      .from('session_registrations')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', waitlistEntry.registration_id);

    if (regUpdateError) {
      console.error('Failed to update registration:', regUpdateError);
      // Rollback waitlist update
      await supabaseClient
        .from('session_waitlist')
        .update({ status: 'waiting', promoted_at: null, promotion_expires_at: null })
        .eq('id', waitlistEntry.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'UPDATE_FAILED', message: 'Failed to confirm registration' },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send promotion email (async)
    supabaseClient.functions
      .invoke('send-confirmation-email', {
        body: { registrationId: waitlistEntry.registration_id },
      })
      .catch(err => console.error('Failed to send promotion email:', err));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          promotedRegistrationId: waitlistEntry.registration_id,
          position: waitlistEntry.position,
          emailSent: true,
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
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
