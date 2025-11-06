// Edge Function: check-in-event-session
// Handles event session check-in via QR code or manual check-in

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckInRequest {
  ticketId?: string;
  sessionId?: string;
  qrCode?: string;
  method: 'manual' | 'qr_scan' | 'host' | 'auto';
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
    const body: CheckInRequest = await req.json();
    const { ticketId, sessionId, qrCode, method } = body;

    // Validate required fields
    if (!method) {
      return new Response(JSON.stringify({ error: 'Missing required field: method' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let ticket;

    // Find ticket based on provided information
    if (ticketId) {
      // Check-in by ticket ID
      const { data, error } = await supabaseClient
        .from('event_session_tickets')
        .select(
          `
          *,
          event_sessions (
            id,
            title,
            session_date,
            start_time,
            end_time,
            check_in_window_start,
            check_in_window_end,
            status,
            meeting_url
          )
        `
        )
        .eq('id', ticketId)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Ticket not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      ticket = data;
    } else if (sessionId) {
      // Check-in by session ID (find user's ticket for this session)
      const { data, error } = await supabaseClient
        .from('event_session_tickets')
        .select(
          `
          *,
          event_sessions (
            id,
            title,
            session_date,
            start_time,
            end_time,
            check_in_window_start,
            check_in_window_end,
            status,
            meeting_url
          )
        `
        )
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'No ticket found for this session' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      ticket = data;
    } else if (qrCode) {
      // Check-in by QR code (extract ticket ID from QR data)
      // QR format: QR:EVT:{user_id}:{session_id}:{ticket_id}:{timestamp}
      const qrParts = qrCode.split(':');
      if (qrParts.length < 5 || qrParts[0] !== 'QR' || qrParts[1] !== 'EVT') {
        return new Response(JSON.stringify({ error: 'Invalid QR code format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const qrTicketId = qrParts[3];
      const { data, error } = await supabaseClient
        .from('event_session_tickets')
        .select(
          `
          *,
          event_sessions (
            id,
            title,
            session_date,
            start_time,
            end_time,
            check_in_window_start,
            check_in_window_end,
            status,
            meeting_url
          )
        `
        )
        .eq('qr_code', qrCode)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Invalid QR code' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      ticket = data;
    } else {
      return new Response(
        JSON.stringify({ error: 'Must provide ticketId, sessionId, or qrCode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ticket belongs to user (unless admin/host is checking in)
    if (ticket.user_id !== user.id && method !== 'host') {
      return new Response(JSON.stringify({ error: 'This ticket does not belong to you' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if ticket is already checked in
    if (ticket.status === 'attended') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Already checked in',
          alreadyCheckedIn: true,
          ticket: ticket,
          session: ticket.event_sessions,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if ticket is cancelled
    if (ticket.status === 'cancelled') {
      return new Response(JSON.stringify({ error: 'This ticket has been cancelled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify check-in window (allow admins to bypass)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);
    const now = new Date();
    const checkInStart = new Date(ticket.event_sessions.check_in_window_start);
    const checkInEnd = new Date(ticket.event_sessions.check_in_window_end);

    if (!isAdmin && method !== 'host') {
      if (now < checkInStart) {
        return new Response(
          JSON.stringify({
            error: 'Check-in window has not opened yet',
            checkInOpensAt: checkInStart.toISOString(),
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (now > checkInEnd) {
        return new Response(
          JSON.stringify({
            error: 'Check-in window has closed',
            checkInClosedAt: checkInEnd.toISOString(),
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update ticket status to attended
    const { data: updatedTicket, error: updateError } = await supabaseClient
      .from('event_session_tickets')
      .update({
        status: 'attended',
        checked_in_at: new Date().toISOString(),
        check_in_method: method,
        checked_in_by: method === 'host' ? user.id : ticket.user_id,
      })
      .eq('id', ticket.id)
      .select(
        `
        *,
        event_sessions (
          id,
          title,
          session_date,
          start_time,
          end_time,
          meeting_url
        )
      `
      )
      .single();

    if (updateError) {
      console.error('Check-in error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to check in', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully checked in',
        ticket: updatedTicket,
        session: updatedTicket.event_sessions,
        meetingUrl: updatedTicket.event_sessions.meeting_url,
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
