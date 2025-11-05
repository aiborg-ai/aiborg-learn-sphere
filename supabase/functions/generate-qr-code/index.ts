// Edge Function: generate-qr-code
// Generates QR code image for session tickets

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import QRCode from 'https://esm.sh/qrcode@1.5.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get ticket ID from URL path or query params
    const url = new URL(req.url);
    const ticketId = url.pathname.split('/').pop() || url.searchParams.get('ticketId');
    const format = url.searchParams.get('format') || 'png'; // png, svg, or data-url

    if (!ticketId) {
      return new Response(JSON.stringify({ error: 'Ticket ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch ticket with QR code data
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('session_tickets')
      .select(
        'id, qr_code, ticket_number, user_id, session:course_sessions(title, session_date, start_time)'
      )
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user owns this ticket (RLS should handle this, but double-check)
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user || ticket.user_id !== user.id) {
      // Allow admins/instructors to generate QR codes
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (!profile || !['admin', 'super_admin', 'instructor'].includes(profile.role)) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized - you can only generate QR codes for your own tickets',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate QR code based on format
    try {
      if (format === 'svg') {
        // Generate SVG
        const qrSvg = await QRCode.toString(ticket.qr_code, {
          type: 'svg',
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 300,
        });

        return new Response(qrSvg, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/svg+xml',
          },
        });
      } else if (format === 'data-url') {
        // Generate data URL (base64)
        const dataUrl = await QRCode.toDataURL(ticket.qr_code, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 300,
        });

        return new Response(
          JSON.stringify({
            success: true,
            ticketNumber: ticket.ticket_number,
            sessionTitle: ticket.session?.title,
            sessionDate: ticket.session?.session_date,
            qrCodeDataUrl: dataUrl,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Generate PNG buffer (default)
        const qrBuffer = await QRCode.toBuffer(ticket.qr_code, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 300,
          type: 'png',
        });

        return new Response(qrBuffer, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/png',
            'Content-Disposition': `inline; filename="ticket-${ticket.ticket_number}.png"`,
          },
        });
      }
    } catch (qrError) {
      console.error('QR generation error:', qrError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate QR code', details: qrError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
