import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { logger } from '@/utils/logger';
export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  event_date: string;
  start_time: string;
  end_time: string;
  price: number;
  activities: string[];
  category: string;
  max_capacity: number | null;
  current_registrations: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true });

      if (error) {
        throw error;
      }

      setEvents(data || []);
    } catch (err) {
      logger.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  return { 
    events, 
    loading, 
    error, 
    refetch: fetchEvents
  };
};