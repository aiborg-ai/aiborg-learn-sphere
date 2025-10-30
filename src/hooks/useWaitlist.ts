import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { SessionWaitlist } from '@/types/session';

export const useWaitlist = (sessionId: string | null) => {
  const [waitlist, setWaitlist] = useState<SessionWaitlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaitlist = useCallback(async () => {
    if (!sessionId) {
      setWaitlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('session_waitlist')
        .select('*, session_registrations(*)')
        .eq('session_id', sessionId)
        .order('position', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setWaitlist(data || []);
    } catch (err) {
      logger.error('Error fetching waitlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch waitlist');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  return {
    waitlist,
    loading,
    error,
    refetch: fetchWaitlist,
  };
};

export const useWaitlistActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Promote next user(s) from waitlist to confirmed
  const promoteFromWaitlist = useCallback(
    async (sessionId: string, count: number = 1): Promise<number> => {
      try {
        setLoading(true);
        setError(null);

        // Get the next N users in waiting status
        const { data: waitingUsers, error: fetchError } = await supabase
          .from('session_waitlist')
          .select('*, session_registrations(*)')
          .eq('session_id', sessionId)
          .eq('status', 'waiting')
          .order('position', { ascending: true })
          .limit(count);

        if (fetchError) {
          throw fetchError;
        }

        if (!waitingUsers || waitingUsers.length === 0) {
          return 0;
        }

        let promotedCount = 0;

        // Process each promotion
        for (const waitlistEntry of waitingUsers) {
          try {
            // Update waitlist status to promoted
            const { error: waitlistError } = await supabase
              .from('session_waitlist')
              .update({
                status: 'promoted',
                promoted_at: new Date().toISOString(),
                promotion_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours to respond
                notified: true,
                notification_sent_at: new Date().toISOString(),
              })
              .eq('id', waitlistEntry.id);

            if (waitlistError) {
              logger.error('Error updating waitlist entry:', waitlistError);
              continue;
            }

            // Update registration status to confirmed
            const { error: regError } = await supabase
              .from('session_registrations')
              .update({
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
              })
              .eq('id', waitlistEntry.registration_id);

            if (regError) {
              logger.error('Error updating registration:', regError);
              continue;
            }

            promotedCount++;

            // TODO: Send promotion notification email
            logger.info(
              `Promoted waitlist entry ${waitlistEntry.id} for registration ${waitlistEntry.registration_id}`
            );
          } catch (entryError) {
            logger.error('Error processing waitlist promotion:', entryError);
            continue;
          }
        }

        return promotedCount;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to promote from waitlist';
        logger.error('Error promoting from waitlist:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // User accepts their promotion
  const acceptPromotion = useCallback(async (waitlistId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('session_waitlist')
        .update({
          accepted_promotion: true,
          responded_at: new Date().toISOString(),
        })
        .eq('id', waitlistId)
        .eq('status', 'promoted');

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept promotion';
      logger.error('Error accepting promotion:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // User declines their promotion
  const declinePromotion = useCallback(
    async (waitlistId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase
          .from('session_waitlist')
          .update({
            status: 'declined',
            accepted_promotion: false,
            responded_at: new Date().toISOString(),
          })
          .eq('id', waitlistId)
          .eq('status', 'promoted');

        if (updateError) {
          throw updateError;
        }

        // Also update the registration status back to waitlisted
        const { data: waitlistEntry } = await supabase
          .from('session_waitlist')
          .select('registration_id, session_id')
          .eq('id', waitlistId)
          .single();

        if (waitlistEntry) {
          await supabase
            .from('session_registrations')
            .update({
              status: 'waitlisted',
            })
            .eq('id', waitlistEntry.registration_id);

          // Try to promote the next person
          await promoteFromWaitlist(waitlistEntry.session_id, 1);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to decline promotion';
        logger.error('Error declining promotion:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [promoteFromWaitlist]
  );

  // Expire promotions that haven't been responded to
  const expireStalePromotions = useCallback(
    async (sessionId: string): Promise<number> => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date().toISOString();

        // Find expired promotions
        const { data: expiredPromotions, error: fetchError } = await supabase
          .from('session_waitlist')
          .select('id, registration_id')
          .eq('session_id', sessionId)
          .eq('status', 'promoted')
          .is('accepted_promotion', null)
          .lt('promotion_expires_at', now);

        if (fetchError) {
          throw fetchError;
        }

        if (!expiredPromotions || expiredPromotions.length === 0) {
          return 0;
        }

        // Update expired entries
        const expiredIds = expiredPromotions.map(p => p.id);
        const { error: updateError } = await supabase
          .from('session_waitlist')
          .update({
            status: 'expired',
          })
          .in('id', expiredIds);

        if (updateError) {
          throw updateError;
        }

        // Update registrations back to waitlisted
        const registrationIds = expiredPromotions.map(p => p.registration_id);
        await supabase
          .from('session_registrations')
          .update({
            status: 'waitlisted',
          })
          .in('id', registrationIds);

        // Promote next users
        await promoteFromWaitlist(sessionId, expiredPromotions.length);

        return expiredPromotions.length;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to expire stale promotions';
        logger.error('Error expiring stale promotions:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [promoteFromWaitlist]
  );

  // Remove user from waitlist
  const removeFromWaitlist = useCallback(async (waitlistId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Get the registration ID first
      const { data: waitlistEntry } = await supabase
        .from('session_waitlist')
        .select('registration_id')
        .eq('id', waitlistId)
        .single();

      if (!waitlistEntry) {
        throw new Error('Waitlist entry not found');
      }

      // Delete the waitlist entry (this will trigger count updates)
      const { error: deleteError } = await supabase
        .from('session_waitlist')
        .delete()
        .eq('id', waitlistId);

      if (deleteError) {
        throw deleteError;
      }

      // Update the registration status
      await supabase
        .from('session_registrations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_reason: 'Removed from waitlist',
        })
        .eq('id', waitlistEntry.registration_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from waitlist';
      logger.error('Error removing from waitlist:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get waitlist position for a specific registration
  const getWaitlistPosition = useCallback(
    async (registrationId: string): Promise<number | null> => {
      try {
        const { data, error: fetchError } = await supabase
          .from('session_waitlist')
          .select('position')
          .eq('registration_id', registrationId)
          .eq('status', 'waiting')
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        return data?.position || null;
      } catch (err) {
        logger.error('Error getting waitlist position:', err);
        return null;
      }
    },
    []
  );

  return {
    promoteFromWaitlist,
    acceptPromotion,
    declinePromotion,
    expireStalePromotions,
    removeFromWaitlist,
    getWaitlistPosition,
    loading,
    error,
  };
};
