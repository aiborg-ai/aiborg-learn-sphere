import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useAuth } from './useAuth';
import type {
  SessionRegistration,
  CreateRegistrationInput,
  RegistrationResponse,
  RegistrationStatus,
} from '@/types/session';

export const useSessionRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Register for a session
  const registerForSession = useCallback(
    async (input: CreateRegistrationInput): Promise<RegistrationResponse> => {
      try {
        setLoading(true);
        setError(null);

        // Validate age if under 13
        const birthdate = new Date(input.birthdate);
        const age = Math.floor((Date.now() - birthdate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

        if (age < 13 && (!input.parent_email || !input.parent_consent_given)) {
          throw new Error(
            'Parent email and consent are required for participants under 13 years old (COPPA compliance)'
          );
        }

        // Check if already registered for this session
        const { data: existingReg, error: checkError } = await supabase
          .from('session_registrations')
          .select('id, status')
          .eq('session_id', input.session_id)
          .eq('email', input.email)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingReg) {
          if (existingReg.status === 'confirmed' || existingReg.status === 'waitlisted') {
            throw new Error(
              `You are already registered for this session with status: ${existingReg.status}`
            );
          } else if (existingReg.status === 'pending') {
            throw new Error('Your registration is pending. Please check your email to confirm.');
          }
        }

        // Get session details to check capacity
        const { data: session, error: sessionError } = await supabase
          .from('free_sessions')
          .select('capacity, registered_count, is_full, status, is_published')
          .eq('id', input.session_id)
          .single();

        if (sessionError) {
          throw sessionError;
        }

        if (!session.is_published) {
          throw new Error('This session is not yet available for registration');
        }

        if (session.status === 'cancelled') {
          throw new Error('This session has been cancelled');
        }

        if (session.status === 'completed') {
          throw new Error('This session has already been completed');
        }

        // Determine registration status based on capacity
        const isFull = session.registered_count >= session.capacity;
        const registrationStatus: RegistrationStatus = isFull ? 'waitlisted' : 'pending';

        // Create the registration
        const registrationData = {
          session_id: input.session_id,
          user_id: user?.id || null,
          full_name: input.full_name,
          email: input.email,
          birthdate: input.birthdate,
          parent_email: input.parent_email || null,
          parent_consent_given: input.parent_consent_given || false,
          parent_consent_at: input.parent_consent_given ? new Date().toISOString() : null,
          status: registrationStatus,
          registration_source: 'web' as const,
        };

        const { data: registration, error: regError } = await supabase
          .from('session_registrations')
          .insert(registrationData)
          .select()
          .single();

        if (regError) {
          if (regError.code === '23505') {
            throw new Error('You are already registered for this session');
          }
          throw regError;
        }

        let waitlistEntry = null;

        // If waitlisted, create waitlist entry
        if (registrationStatus === 'waitlisted') {
          const { data: waitlist, error: waitlistError } = await supabase
            .from('session_waitlist')
            .insert({
              session_id: input.session_id,
              registration_id: registration.id,
            })
            .select()
            .single();

          if (waitlistError) {
            logger.error('Error creating waitlist entry:', waitlistError);
            // Don't fail the registration, just log the error
          } else {
            waitlistEntry = waitlist;
          }
        }

        const message = isFull
          ? `You have been added to the waitlist at position ${waitlistEntry?.position || 'N/A'}. We'll notify you if a spot opens up!`
          : 'Registration submitted! Please check your email to confirm your registration.';

        return {
          registration,
          waitlist: waitlistEntry,
          message,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to register for session';
        logger.error('Error registering for session:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Cancel a registration
  const cancelRegistration = useCallback(
    async (registrationId: string, reason?: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase
          .from('session_registrations')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancelled_reason: reason || null,
          })
          .eq('id', registrationId);

        if (updateError) {
          throw updateError;
        }

        // Note: Database triggers will automatically update the session's registered_count
        // and promote waitlist users if needed
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to cancel registration';
        logger.error('Error cancelling registration:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Confirm a pending registration
  const confirmRegistration = useCallback(async (registrationId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('session_registrations')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', registrationId)
        .eq('status', 'pending');

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm registration';
      logger.error('Error confirming registration:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update registration status (admin function)
  const updateRegistrationStatus = useCallback(
    async (registrationId: string, status: RegistrationStatus): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const updateData: Partial<SessionRegistration> = {
          status,
        };

        if (status === 'confirmed') {
          updateData.confirmed_at = new Date().toISOString();
        } else if (status === 'cancelled') {
          updateData.cancelled_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('session_registrations')
          .update(updateData)
          .eq('id', registrationId);

        if (updateError) {
          throw updateError;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update registration status';
        logger.error('Error updating registration status:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get user's registrations
  const getUserRegistrations = useCallback(async (userEmail: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('session_registrations')
        .select('*, free_sessions(*), session_waitlist(*)')
        .eq('email', userEmail)
        .order('registered_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch registrations';
      logger.error('Error fetching user registrations:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    registerForSession,
    cancelRegistration,
    confirmRegistration,
    updateRegistrationStatus,
    getUserRegistrations,
    loading,
    error,
  };
};
