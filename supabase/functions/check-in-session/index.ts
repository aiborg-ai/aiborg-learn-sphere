// Edge Function: check-in-session
// Handles all check-in methods: manual, QR scan, and instructor marking

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckInRequest {
  sessionId: string;
  userId: string;
  method: 'qr_scan' | 'manual' | 'instructor';
  qrData?: string;
  instructorId?: string;
  notes?: string;
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

    // Get request body
    const body: CheckInRequest = await req.json();
    const { sessionId, userId, method, qrData, instructorId, notes } = body;

    // Validate required fields
    if (!sessionId || !userId || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId, userId, method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate check-in permission using database function
    const { data: validation, error: validationError } = await supabaseClient.rpc(
      'can_check_in_to_session',
      {
        p_user_id: userId,
        p_session_id: sessionId,
      }
    );

    if (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate check-in', details: validationError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validation || validation.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', reason: 'No validation result' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = validation[0];
    if (!validationResult.can_check_in) {
      return new Response(
        JSON.stringify({
          error: 'Cannot check in',
          reason: validationResult.reason,
          canCheckIn: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If QR scan method, validate QR code
    if (method === 'qr_scan') {
      if (!qrData) {
        return new Response(JSON.stringify({ error: 'QR data required for QR scan method' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: qrValidation, error: qrError } = await supabaseClient.rpc(
        'validate_ticket_qr_code',
        { p_qr_code: qrData }
      );

      if (qrError || !qrValidation || qrValidation.length === 0 || !qrValidation[0].valid) {
        return new Response(
          JSON.stringify({
            error: 'Invalid QR code',
            reason: qrValidation?.[0]?.message || 'QR validation failed',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const ticketId = validationResult.ticket_id;
    const checkInTime = new Date().toISOString();

    // Create or update attendance record
    const { data: attendance, error: attendanceError } = await supabaseClient
      .from('session_attendance')
      .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          ticket_id: ticketId,
          status: 'present',
          check_in_time: checkInTime,
          marked_by: method === 'instructor' ? instructorId : userId,
          instructor_notes: notes || null,
        },
        {
          onConflict: 'session_id,user_id',
        }
      )
      .select()
      .single();

    if (attendanceError) {
      console.error('Attendance error:', attendanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to record attendance', details: attendanceError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update ticket status (triggers will handle this, but we can do it explicitly)
    const { error: ticketError } = await supabaseClient
      .from('session_tickets')
      .update({
        status: 'attended',
        checked_in_at: checkInTime,
        check_in_method: method,
        checked_in_by: method === 'instructor' ? instructorId : userId,
      })
      .eq('id', ticketId);

    if (ticketError) {
      console.error('Ticket update error:', ticketError);
      // Don't fail the request - trigger should handle this
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Check-in successful',
        attendance,
        checkedInAt: checkInTime,
        method,
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
