import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { logger } from '@/utils/logger';
export interface EventPhoto {
  id: string;
  event_id: number;
  photo_url: string;
  photo_caption?: string;
  display_order: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

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
  is_visible?: boolean; // Optional for backward compatibility
  is_past: boolean;
  created_at: string;
  updated_at: string;
  photos?: EventPhoto[];
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try with is_visible filter first
      let { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .eq('is_visible', true)
        .order('event_date', { ascending: true });

      // Fallback if is_visible column doesn't exist yet
      if (error && error.message?.includes('column')) {
        logger.warn('is_visible column not found, falling back to is_active only');
        const fallback = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .order('event_date', { ascending: true});
        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        throw error;
      }

      // Filter by is_visible client-side if column exists
      const filteredData = (data || []).filter(event =>
        event.is_visible === undefined || event.is_visible === true
      );

      setEvents(filteredData);
    } catch (err) {
      logger.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
};
