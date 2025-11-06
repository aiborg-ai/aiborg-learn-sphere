// Edge Function: manage-event-session-tickets
// Handles ticket management actions: claim, cancel, reactivate

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManageTicketRequest {
  action: 'cancel' | 'reactivate' | 'claim';
  ticketId?: string;
  sessionId?: string;
  eventId?: number;
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
    const body: ManageTicketRequest = await req.json();
    const { action, ticketId, sessionId, eventId, notes } = body;

    // Validate action
    if (!action || !['cancel', 'reactivate', 'claim'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be: cancel, reactivate, or claim' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle CLAIM action (create new ticket for a session)
    if (action === 'claim') {
      if (!sessionId || !eventId) {
        return new Response(
          JSON.stringify({ error: 'sessionId and eventId required for claim action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify session exists and is not full
      const { data: session, error: sessionError } = await supabaseClient
        .from('event_sessions')
        .select('id, max_capacity, current_registrations, status, session_date')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (session.status === 'cancelled') {
        return new Response(JSON.stringify({ error: 'This session has been cancelled' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (session.max_capacity && session.current_registrations >= session.max_capacity) {
        return new Response(JSON.stringify({ error: 'This session is full' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user already has a ticket for this session
      const { data: existingTicket } = await supabaseClient
        .from('event_session_tickets')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existingTicket) {
        if (existingTicket.status === 'cancelled') {
          // Reactivate the cancelled ticket instead of creating new one
          const { data: reactivatedTicket, error: reactivateError } = await supabaseClient
            .from('event_session_tickets')
            .update({ status: 'active', notes: notes })
            .eq('id', existingTicket.id)
            .select()
            .single();

          if (reactivateError) {
            return new Response(
              JSON.stringify({
                error: 'Failed to reactivate ticket',
                details: reactivateError.message,
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Ticket reactivated successfully',
              ticket: reactivatedTicket,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: 'You already have an active ticket for this session' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Generate QR code
      const qrData = `QR:EVT:${user.id}:${sessionId}:${crypto.randomUUID()}:${Date.now()}`;

      // Create new ticket
      const { data: newTicket, error: createError } = await supabaseClient
        .from('event_session_tickets')
        .insert({
          user_id: user.id,
          event_id: eventId,
          session_id: sessionId,
          status: 'active',
          qr_code: qrData,
          notes: notes,
        })
        .select()
        .single();

      if (createError) {
        console.error('Ticket creation error:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create ticket', details: createError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Ticket claimed successfully',
          ticket: newTicket,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle CANCEL and REACTIVATE actions
    if (!ticketId) {
      return new Response(JSON.stringify({ error: 'ticketId required for this action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get ticket
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('event_session_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify ticket belongs to user
    if (ticket.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'This ticket does not belong to you' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle CANCEL
    if (action === 'cancel') {
      if (ticket.status === 'cancelled') {
        return new Response(JSON.stringify({ error: 'Ticket is already cancelled' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (ticket.status === 'attended') {
        return new Response(
          JSON.stringify({ error: 'Cannot cancel a ticket that has already been used' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: updatedTicket, error: updateError } = await supabaseClient
        .from('event_session_tickets')
        .update({ status: 'cancelled', notes: notes || ticket.notes })
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to cancel ticket', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Ticket cancelled successfully',
          ticket: updatedTicket,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle REACTIVATE
    if (action === 'reactivate') {
      if (ticket.status !== 'cancelled') {
        return new Response(
          JSON.stringify({ error: 'Only cancelled tickets can be reactivated' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if session is still available
      const { data: session } = await supabaseClient
        .from('event_sessions')
        .select('max_capacity, current_registrations, status')
        .eq('id', ticket.session_id)
        .single();

      if (session?.status === 'cancelled') {
        return new Response(JSON.stringify({ error: 'This session has been cancelled' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (
        session &&
        session.max_capacity &&
        session.current_registrations >= session.max_capacity
      ) {
        return new Response(JSON.stringify({ error: 'This session is now full' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: updatedTicket, error: updateError } = await supabaseClient
        .from('event_session_tickets')
        .update({ status: 'active', notes: notes || ticket.notes })
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to reactivate ticket', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Ticket reactivated successfully',
          ticket: updatedTicket,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
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
