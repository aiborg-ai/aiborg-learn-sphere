import { useQuery } from '@tanstack/react-query';
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

const fetchEvents = async (): Promise<Event[]> => {
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
      .order('event_date', { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw error;
  }

  // Filter by is_visible client-side if column exists
  return (data || []).filter(event => event.is_visible === undefined || event.is_visible === true);
};

export const useEvents = () => {
  const {
    data: events = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
  });

  return {
    events,
    loading,
    error: error instanceof Error ? error.message : error ? 'Failed to fetch events' : null,
    refetch,
  };
};
