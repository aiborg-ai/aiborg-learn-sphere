import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

import { logger } from '@/utils/logger';
export interface CourseMaterial {
  id: string;
  course_id: number;
  title: string;
  description: string | null;
  material_type: 'recording' | 'handbook' | 'presentation' | 'other';
  file_url: string;
  file_size: number | null;
  duration: number | null; // in seconds
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useCourseMaterials = (courseId: number) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMaterials = useCallback(async () => {
    if (!user || !courseId) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      setMaterials((data || []) as CourseMaterial[]);
    } catch (err) {
      logger.error('Error fetching course materials:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch course materials');
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  const isUserEnrolled = useCallback(async (courseId: number) => {
    if (!user) return false;
    
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('payment_status', 'completed')
      .single();
    
    return !!data;
  }, [user]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return {
    materials,
    loading,
    error,
    refetch: fetchMaterials,
    isUserEnrolled
  };
};