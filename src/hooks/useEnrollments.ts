import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { MembershipService } from '@/services/membership';
import { logger } from '@/utils/logger';
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
      const { data, error } = await supabase.from('enrollments').select('*').eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setEnrollments(data || []);
    } catch (err) {
      logger.error('Error fetching enrollments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const enrollInCourse = async (courseId: number, paymentAmount?: number) => {
    if (!user) {
      throw new Error('User must be logged in to enroll');
    }

    // Check if already enrolled (duplicate detection)
    const existingEnrollment = enrollments.find(enrollment => enrollment.course_id === courseId);

    if (existingEnrollment) {
      const error = new Error(
        'You are already enrolled in this course. Check your dashboard to access it!'
      );
      error.name = 'DuplicateEnrollmentError';
      throw error;
    }

    // Double-check with database in case local state is stale
    const { data: dbCheck, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (checkError) {
      logger.error('Error checking existing enrollment:', checkError);
      // Continue with enrollment attempt - constraint will catch it
    }

    if (dbCheck) {
      const error = new Error(
        'You are already enrolled in this course. Check your dashboard to access it!'
      );
      error.name = 'DuplicateEnrollmentError';
      throw error;
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        payment_status: 'completed',
        payment_amount: paymentAmount,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (23505 is PostgreSQL unique violation code)
      if (error.code === '23505' || error.message.includes('duplicate')) {
        const duplicateError = new Error(
          'You are already enrolled in this course. Check your dashboard to access it!'
        );
        duplicateError.name = 'DuplicateEnrollmentError';
        throw duplicateError;
      }
      throw error;
    }

    // Generate and send invoice
    try {
      await supabase.functions.invoke('generate-invoice', {
        body: {
          enrollmentId: data.id,
          userId: user.id,
          itemType: 'course',
        },
      });
    } catch (invoiceError) {
      logger.error('Invoice generation failed:', invoiceError);
      // Don't fail the enrollment if invoice generation fails
    }

    setEnrollments(prev => [...prev, data]);
    return data;
  };

  const enrollWithFamilyPass = async (courseId: number) => {
    if (!user) {
      throw new Error('User must be logged in to enroll');
    }

    // Check if already enrolled (duplicate detection)
    const existingEnrollment = enrollments.find(enrollment => enrollment.course_id === courseId);

    if (existingEnrollment) {
      const error = new Error(
        'You are already enrolled in this course. Check your dashboard to access it!'
      );
      error.name = 'DuplicateEnrollmentError';
      throw error;
    }

    // Double-check with database in case local state is stale
    const { data: dbCheck, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (checkError) {
      logger.error('Error checking existing enrollment:', checkError);
      // Continue with enrollment attempt - constraint will catch it
    }

    if (dbCheck) {
      const error = new Error(
        'You are already enrolled in this course. Check your dashboard to access it!'
      );
      error.name = 'DuplicateEnrollmentError';
      throw error;
    }

    // Verify active family pass subscription
    const hasActiveMembership = await MembershipService.hasActiveMembership();

    if (!hasActiveMembership) {
      const error = new Error('Active Family Pass required. Subscribe to access all courses free!');
      error.name = 'NoActiveMembershipError';
      throw error;
    }

    // Enroll with family_pass status
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        payment_status: 'family_pass',
        payment_amount: 0.0,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (23505 is PostgreSQL unique violation code)
      if (error.code === '23505' || error.message.includes('duplicate')) {
        const duplicateError = new Error(
          'You are already enrolled in this course. Check your dashboard to access it!'
        );
        duplicateError.name = 'DuplicateEnrollmentError';
        throw duplicateError;
      }
      throw error;
    }

    // Generate and send invoice (optional for family pass, but keeps consistency)
    try {
      await supabase.functions.invoke('generate-invoice', {
        body: {
          enrollmentId: data.id,
          userId: user.id,
          itemType: 'course',
        },
      });
    } catch (invoiceError) {
      logger.error('Invoice generation failed:', invoiceError);
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
    enrollWithFamilyPass,
    isEnrolled,
    getEnrollmentStatus,
    refetch: fetchEnrollments,
  };
};
