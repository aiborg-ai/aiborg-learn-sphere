import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: number;
  enrolled_at: string;
  payment_status: string;
  payment_amount: number | null;
  created_at: string;
  updated_at: string;
}

export const useEnrollments = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEnrollments = useCallback(async () => {
    if (!user) {
      setEnrollments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setEnrollments(data || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const enrollInCourse = async (courseId: number, paymentAmount?: number) => {
    if (!user) {
      throw new Error('User must be logged in to enroll');
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        payment_status: 'completed',
        payment_amount: paymentAmount
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
          enrollmentId: data.id,
          userId: user.id,
          itemType: 'course'
        }
      });
    } catch (invoiceError) {
      console.error('Invoice generation failed:', invoiceError);
      // Don't fail the enrollment if invoice generation fails
    }

    setEnrollments(prev => [...prev, data]);
    return data;
  };

  const isEnrolled = (courseId: number) => {
    return enrollments.some(enrollment => enrollment.course_id === courseId);
  };

  const getEnrollmentStatus = (courseId: number, courseStartDate: string) => {
    const enrollment = enrollments.find(e => e.course_id === courseId);
    if (!enrollment) return 'not_enrolled';
    
    const startDate = new Date(courseStartDate);
    const now = new Date();
    
    if (startDate < now) {
      return 'completed';
    }
    
    return 'enrolled';
  };

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  return {
    enrollments,
    loading,
    error,
    enrollInCourse,
    isEnrolled,
    getEnrollmentStatus,
    refetch: fetchEnrollments
  };
};