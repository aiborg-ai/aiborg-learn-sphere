import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

import { logger } from '@/utils/logger';
export interface EventRegistration {
  id: string;
  user_id: string;
  event_id: number;
  registered_at: string;
  payment_status: string;
  payment_amount: number | null;
  created_at: string;
  updated_at: string;
}

export const useEventRegistrations = () => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRegistrations = useCallback(async () => {
    if (!user) {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setRegistrations(data || []);
    } catch (err) {
      logger.error('Error fetching event registrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const registerForEvent = async (eventId: number, paymentAmount: number) => {
    if (!user) {
      throw new Error('User must be logged in to register for events');
    }

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          user_id: user.id,
          event_id: eventId,
          payment_amount: paymentAmount,
          payment_status: 'completed'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Generate and send invoice
      try {
        await supabase.functions.invoke('generate-invoice', {
          body: {
            eventRegistrationId: data.id,
            userId: user.id,
            itemType: 'event'
          }
        });
      } catch (invoiceError) {
        logger.error('Invoice generation failed:', invoiceError);
        // Don't fail the registration if invoice generation fails
      }

      // Refresh registrations
      await fetchRegistrations();
      return data;
    } catch (err) {
      logger.error('Error registering for event:', err);
      throw err;
    }
  };

  const isRegisteredForEvent = (eventId: number): boolean => {
    return registrations.some(reg => reg.event_id === eventId);
  };

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return { 
    registrations, 
    loading, 
    error, 
    refetch: fetchRegistrations,
    registerForEvent,
    isRegisteredForEvent
  };
};