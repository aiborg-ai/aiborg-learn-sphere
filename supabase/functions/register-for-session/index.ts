/**
 * Edge Function: register-for-session
 * Handle session registration with capacity management and waitlist
 * Feature: 001-create-a-free (Free Introductory AI Session)
 * Maps to: contracts/register-for-session.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  registrationSchema,
  validateRequest,
  calculateAge,
  isAgeInTargetRange,
  requiresParentEmail,
} from '../_shared/validation-schemas.ts';

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
    // Parse request body
    const body = await req.json();

    // Validate request
    const validation = validateRequest(registrationSchema, body);
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

    const { sessionId, fullName, email, birthdate, parentEmail, source } = validation.data;

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if session exists and is published
    const { data: session, error: sessionError } = await supabaseClient
      .from('free_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_published', true)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'The requested session does not exist or is no longer available',
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if session has passed
    if (new Date(session.session_date) < new Date()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'SESSION_PASSED',
            message: 'Registration closed. This session has already occurred.',
            sessionDate: session.session_date,
          },
        }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate age and check requirements
    const birthdateObj = new Date(birthdate);
    const age = calculateAge(birthdateObj);
    const ageCheck = isAgeInTargetRange(birthdateObj);
    const needsParentConsent = requiresParentEmail(birthdateObj);

    // Check if already registered
    const { data: existingReg } = await supabaseClient
      .from('session_registrations')
      .select('id, status')
      .eq('session_id', sessionId)
      .eq('email', email)
      .single();

    if (existingReg) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'ALREADY_REGISTERED',
            message: 'This email is already registered for the session',
            existingRegistrationId: existingReg.id,
            status: existingReg.status,
          },
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check capacity
    const isFull = session.registered_count >= session.capacity;

    // Determine registration status
    let registrationStatus: 'confirmed' | 'waitlisted' | 'pending';
    if (isFull) {
      registrationStatus = 'waitlisted';
    } else if (needsParentConsent) {
      registrationStatus = 'pending';
    } else {
      registrationStatus = 'confirmed';
    }

    // Insert registration
    const { data: registration, error: regError } = await supabaseClient
      .from('session_registrations')
      .insert({
        session_id: sessionId,
        full_name: fullName,
        email: email,
        birthdate: birthdate,
        parent_email: parentEmail || null,
        parent_consent_given: needsParentConsent ? false : true,
        status: registrationStatus,
        registration_source: source,
        confirmed_at: registrationStatus === 'confirmed' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (regError || !registration) {
      console.error('Registration error:', regError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create registration. Please try again.',
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If waitlisted, add to waitlist table
    let waitlistPosition: number | undefined;
    if (registrationStatus === 'waitlisted') {
      const { data: waitlistEntry, error: waitlistError } = await supabaseClient
        .from('session_waitlist')
        .insert({
          session_id: sessionId,
          registration_id: registration.id,
        })
        .select('position')
        .single();

      if (!waitlistError && waitlistEntry) {
        waitlistPosition = waitlistEntry.position;
      }
    }

    // Trigger confirmation email (async - don't wait)
    if (registrationStatus === 'confirmed' || registrationStatus === 'waitlisted') {
      supabaseClient.functions
        .invoke('send-confirmation-email', {
          body: { registrationId: registration.id },
        })
        .catch(err => console.error('Failed to trigger confirmation email:', err));
    }

    // Build response based on status
    const response: any = {
      success: true,
      data: {
        registrationId: registration.id,
        status: registrationStatus,
        sessionDetails: {
          title: session.title,
          date: session.session_date,
          duration: session.duration_minutes,
        },
      },
    };

    // Add age warning if applicable
    if (!ageCheck.inRange) {
      response.data.ageWarning = ageCheck.warning;
    }

    // Add status-specific data
    if (registrationStatus === 'confirmed') {
      response.data.nextSteps = [
        'Check your email for confirmation',
        'Add session to your calendar',
        `Join via meeting link on ${new Date(session.session_date).toLocaleDateString()}`,
      ];
    } else if (registrationStatus === 'waitlisted') {
      response.data.waitlistPosition = waitlistPosition;
      response.data.message = `Session is full. You are #${waitlistPosition} on the waitlist. We'll email you if a spot opens.`;
    } else if (registrationStatus === 'pending') {
      response.data.parentConsentRequired = true;
      response.data.message = `Registration pending parent/guardian approval. An email has been sent to ${parentEmail}.`;
    }

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
