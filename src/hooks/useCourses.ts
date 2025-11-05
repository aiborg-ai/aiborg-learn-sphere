import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

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
  display: boolean;
  created_at: string;
  updated_at: string;
}

const fetchCourses = async (): Promise<Course[]> => {
  // First fetch courses with their audiences from the view
  const { data: coursesWithAudiences, error: viewError } = await supabase
    .from('courses_with_audiences')
    .select('*')
    .eq('is_active', true)
    .eq('display', true)
    .order('sort_order', { ascending: true });

  if (viewError) {
    // Fallback to regular courses table if view doesn't exist yet
    logger.warn('View not available, falling back to regular table:', viewError);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .eq('display', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    // For backward compatibility, create audiences array from single audience field
    return (data || []).map(course => ({
      ...course,
      audiences: course.audience ? [course.audience] : [],
    }));
  }

  // Ensure backward compatibility by setting audience field from audiences array
  return (coursesWithAudiences || []).map(course => ({
    ...course,
    audience: course.audiences?.[0] || course.audience || '', // Use first audience for backward compatibility
    audiences: course.audiences || (course.audience ? [course.audience] : []),
  }));
};

export const useCourses = () => {
  const {
    data: courses = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
  });

  return {
    courses,
    loading,
    error: error instanceof Error ? error.message : error ? 'Failed to fetch courses' : null,
    refetch,
  };
};
