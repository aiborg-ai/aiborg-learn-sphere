import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: number;
  title: string;
  description: string;
  audience: string;
  mode: string;
  duration: string;
  price: string;
  level: string;
  start_date: string;
  features: string[];
  category: string;
  keywords: string[];
  prerequisites: string;
  is_active: boolean;
  currently_enrolling: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, []);

  return { 
    courses, 
    loading, 
    error, 
    refetch: fetchCourses
  };
};