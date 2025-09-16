import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: number;
  title: string;
  description: string;
  audience: string; // Kept for backward compatibility, will be deprecated
  audiences: string[]; // New field for multiple audiences
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

      // First fetch courses with their audiences from the view
      const { data: coursesWithAudiences, error: viewError } = await supabase
        .from('courses_with_audiences')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (viewError) {
        // Fallback to regular courses table if view doesn't exist yet
        console.warn('View not available, falling back to regular table:', viewError);
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) {
          throw error;
        }

        // For backward compatibility, create audiences array from single audience field
        const coursesWithAudienceArrays = (data || []).map(course => ({
          ...course,
          audiences: course.audience ? [course.audience] : []
        }));

        setCourses(coursesWithAudienceArrays);
      } else {
        // Ensure backward compatibility by setting audience field from audiences array
        const processedCourses = (coursesWithAudiences || []).map(course => ({
          ...course,
          audience: course.audiences?.[0] || course.audience || '', // Use first audience for backward compatibility
          audiences: course.audiences || (course.audience ? [course.audience] : [])
        }));

        setCourses(processedCourses);
      }
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