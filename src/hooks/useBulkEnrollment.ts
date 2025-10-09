import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { BulkEnrollmentRow } from '@/utils/csvParser';

/**
 * Result of a single enrollment operation
 */
export interface EnrollmentResult {
  row: BulkEnrollmentRow;
  success: boolean;
  error?: string;
  enrollmentId?: string;
}

/**
 * Progress information for bulk enrollment
 */
export interface BulkEnrollmentProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  percentage: number;
}

/**
 * Hook for processing bulk enrollments
 */
export function useBulkEnrollment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkEnrollmentProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    percentage: 0,
  });

  /**
   * Check if user already enrolled in course
   */
  const checkExistingEnrollment = async (userId: string, courseId: number): Promise<boolean> => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok
      logger.error('Error checking enrollment:', error);
    }

    return !!data;
  };

  /**
   * Get user ID by email
   */
  const getUserByEmail = async (email: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .single();

    if (error) {
      logger.error(`User not found for email ${email}:`, error);
      return null;
    }

    return data?.user_id || null;
  };

  /**
   * Create a single enrollment
   */
  const createEnrollment = async (row: BulkEnrollmentRow): Promise<EnrollmentResult> => {
    try {
      // Get user ID from email
      const userId = await getUserByEmail(row.email);
      if (!userId) {
        return {
          row,
          success: false,
          error: `User not found with email: ${row.email}`,
        };
      }

      // Check for existing enrollment
      const exists = await checkExistingEnrollment(userId, row.course_id);
      if (exists) {
        return {
          row,
          success: false,
          error: `User already enrolled in course ${row.course_id}`,
        };
      }

      // Create enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: row.course_id,
          payment_status: row.payment_status,
          payment_amount: row.payment_amount,
        })
        .select()
        .single();

      if (enrollmentError) {
        logger.error('Enrollment creation error:', enrollmentError);
        return {
          row,
          success: false,
          error: `Failed to create enrollment: ${enrollmentError.message}`,
        };
      }

      // Create payment transaction
      const { error: paymentError } = await supabase.from('payment_transactions').insert({
        enrollment_id: enrollment.id,
        user_id: userId,
        course_id: row.course_id,
        amount: row.payment_amount,
        currency: 'INR',
        payment_status: row.payment_status,
        payment_method: row.payment_method,
        transaction_type: 'enrollment',
        metadata: {
          source: 'bulk_upload',
          created_by: 'admin',
        },
      });

      if (paymentError) {
        logger.error('Payment transaction error:', paymentError);
        // Don't fail the whole enrollment, just log it
      }

      // Log to audit trail
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from('admin_audit_logs').insert({
          admin_id: currentUser.id,
          action_type: 'enrollment_created',
          resource_type: 'enrollment',
          resource_id: enrollment.id,
          details: {
            student_email: row.email,
            course_id: row.course_id,
            payment_amount: row.payment_amount,
            source: 'bulk_upload',
          },
        });
      }

      return {
        row,
        success: true,
        enrollmentId: enrollment.id,
      };
    } catch (error) {
      logger.error('Unexpected error creating enrollment:', error);
      return {
        row,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  /**
   * Process enrollments in batches
   */
  const processBatch = async (batch: BulkEnrollmentRow[]): Promise<EnrollmentResult[]> => {
    const results = await Promise.all(batch.map(row => createEnrollment(row)));
    return results;
  };

  /**
   * Process all enrollments with progress tracking
   */
  const processEnrollments = async (
    enrollments: BulkEnrollmentRow[]
  ): Promise<EnrollmentResult[]> => {
    setIsProcessing(true);
    const batchSize = 10; // Process 10 at a time to avoid timeouts
    const allResults: EnrollmentResult[] = [];

    setProgress({
      total: enrollments.length,
      processed: 0,
      successful: 0,
      failed: 0,
      percentage: 0,
    });

    try {
      for (let i = 0; i < enrollments.length; i += batchSize) {
        const batch = enrollments.slice(i, i + batchSize);
        const batchResults = await processBatch(batch);
        allResults.push(...batchResults);

        // Update progress
        const successful = allResults.filter(r => r.success).length;
        const failed = allResults.filter(r => !r.success).length;
        const processed = allResults.length;

        setProgress({
          total: enrollments.length,
          processed,
          successful,
          failed,
          percentage: Math.round((processed / enrollments.length) * 100),
        });

        // Small delay between batches to avoid overwhelming the database
        if (i + batchSize < enrollments.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      logger.log(
        `Bulk enrollment completed: ${allResults.filter(r => r.success).length}/${enrollments.length} successful`
      );

      return allResults;
    } catch (error) {
      logger.error('Bulk enrollment processing error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Reset progress
   */
  const resetProgress = () => {
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      percentage: 0,
    });
  };

  return {
    isProcessing,
    progress,
    processEnrollments,
    resetProgress,
  };
}
