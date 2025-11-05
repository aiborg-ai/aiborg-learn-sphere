// Edge Function: manage-session-tickets
// Handles ticket lifecycle: claim, cancel, reactivate

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketManagementRequest {
  action: 'claim' | 'cancel' | 'reactivate';
  sessionId?: string;
  ticketId?: string;
  userId: string;
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
    const body: TicketManagementRequest = await req.json();
    const { action, sessionId, ticketId, userId, notes } = body;

    // Validate required fields
    if (!action || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required fields: action, userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'claim': {
        // Claim a ticket for an extra session
        if (!sessionId) {
          return new Response(JSON.stringify({ error: 'sessionId required for claim action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if session exists and has capacity
        const { data: session, error: sessionError } = await supabaseClient
          .from('course_sessions')
          .select('*, course:courses(id)')
          .eq('id', sessionId)
          .single();

        if (sessionError || !session) {
          return new Response(JSON.stringify({ error: 'Session not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if user is enrolled in the course
        const { data: enrollment, error: enrollmentError } = await supabaseClient
          .from('enrollments')
          .select('*')
          .eq('user_id', userId)
          .eq('course_id', session.course_id)
          .eq('payment_status', 'completed')
          .single();

        if (enrollmentError || !enrollment) {
          return new Response(JSON.stringify({ error: 'User is not enrolled in this course' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check session capacity
        if (session.max_capacity && session.current_attendance >= session.max_capacity) {
          return new Response(JSON.stringify({ error: 'Session is at full capacity' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create ticket
        const { data: ticket, error: ticketError } = await supabaseClient
          .from('session_tickets')
          .insert({
            user_id: userId,
            course_id: session.course_id,
            session_id: sessionId,
            status: 'active',
            notes: notes || null,
          })
          .select()
          .single();

        if (ticketError) {
          // Check if it's a duplicate (user already has ticket)
          if (ticketError.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'You already have a ticket for this session' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.error('Ticket creation error:', ticketError);
          return new Response(
            JSON.stringify({ error: 'Failed to create ticket', details: ticketError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Ticket claimed successfully', ticket }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cancel': {
        // Cancel a ticket
        if (!ticketId) {
          return new Response(JSON.stringify({ error: 'ticketId required for cancel action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify ticket belongs to user
        const { data: ticket, error: fetchError } = await supabaseClient
          .from('session_tickets')
          .select('*, session:course_sessions(session_date, start_time)')
          .eq('id', ticketId)
          .eq('user_id', userId)
          .single();

        if (fetchError || !ticket) {
          return new Response(
            JSON.stringify({ error: 'Ticket not found or does not belong to you' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if already attended or cancelled
        if (ticket.status === 'attended') {
          return new Response(
            JSON.stringify({ error: 'Cannot cancel a ticket you have already used' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (ticket.status === 'cancelled') {
          return new Response(JSON.stringify({ error: 'Ticket is already cancelled' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update ticket status
        const { error: updateError } = await supabaseClient
          .from('session_tickets')
          .update({ status: 'cancelled' })
          .eq('id', ticketId);

        if (updateError) {
          console.error('Ticket cancellation error:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to cancel ticket', details: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Ticket cancelled successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'reactivate': {
        // Reactivate a cancelled ticket
        if (!ticketId) {
          return new Response(
            JSON.stringify({ error: 'ticketId required for reactivate action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify ticket belongs to user and is cancelled
        const { data: ticket, error: fetchError } = await supabaseClient
          .from('session_tickets')
          .select('*, session:course_sessions(session_date, start_time, status)')
          .eq('id', ticketId)
          .eq('user_id', userId)
          .single();

        if (fetchError || !ticket) {
          return new Response(
            JSON.stringify({ error: 'Ticket not found or does not belong to you' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (ticket.status !== 'cancelled') {
          return new Response(JSON.stringify({ error: 'Can only reactivate cancelled tickets' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if session is still available
        if (ticket.session.status === 'cancelled' || ticket.session.status === 'completed') {
          return new Response(JSON.stringify({ error: 'Session is no longer available' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Reactivate ticket
        const { error: updateError } = await supabaseClient
          .from('session_tickets')
          .update({ status: 'active' })
          .eq('id', ticketId);

        if (updateError) {
          console.error('Ticket reactivation error:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to reactivate ticket', details: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Ticket reactivated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Must be: claim, cancel, or reactivate' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
