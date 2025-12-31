import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import type { BulkItem, FilterType } from '../types';

interface UseBulkItemsProps {
  filterCategory: string;
  filterStatus: string;
  filterType: FilterType;
}

export function useBulkItems({ filterCategory, filterStatus, filterType }: UseBulkItemsProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<BulkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setIsLoading(true);

      // Fetch courses
      let coursesQuery = supabase.from('courses').select('*');

      if (filterCategory !== 'all') {
        coursesQuery = coursesQuery.eq('category', filterCategory);
      }

      const { data: courses } = await coursesQuery;

      // Fetch events
      let eventsQuery = supabase.from('events').select('*');

      if (filterCategory !== 'all') {
        eventsQuery = eventsQuery.eq('category', filterCategory);
      }

      const { data: events } = await eventsQuery;

      // Combine and format items
      const allItems: BulkItem[] = [];

      if (filterType === 'all' || filterType === 'course') {
        courses?.forEach(course => {
          allItems.push({
            id: course.id,
            title: course.title,
            description: course.description,
            category: course.category,
            price: course.price || 'Free',
            date: course.start_date,
            status: course.is_active ? 'active' : 'inactive',
            is_featured: course.is_featured || false,
            type: 'course',
            created_at: course.created_at,
            updated_at: course.updated_at,
          });
        });
      }

      if (filterType === 'all' || filterType === 'event') {
        events?.forEach(event => {
          allItems.push({
            id: event.id,
            name: event.name,
            description: event.description,
            category: event.category,
            price: event.price || 'Free',
            date: event.date,
            status: event.is_active ? 'active' : 'inactive',
            is_featured: event.is_featured || false,
            type: 'event',
            created_at: event.created_at,
            updated_at: event.updated_at,
          });
        });
      }

      // Apply status filter
      const filteredItems =
        filterStatus === 'all' ? allItems : allItems.filter(item => item.status === filterStatus);

      setItems(filteredItems);
    } catch (_error) {
      logger._error('Error fetching items:', _error);
      toast({
        title: 'Error',
        description: 'Failed to fetch items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // Dependencies intentionally limited - fetchItems is not memoized to avoid stale closures
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterStatus, filterType]);

  return { items, isLoading, fetchItems };
}
