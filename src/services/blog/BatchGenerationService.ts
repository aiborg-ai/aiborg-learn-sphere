/**
 * Batch Generation Service
 * Handles batch blog post generation operations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  BatchGenerationRequest,
  BatchGenerationResponse,
  BatchJob,
  BatchJobProgress,
} from '@/types/blog-scheduler';

export class BatchGenerationService {
  /**
   * Create a batch job and start generation
   */
  static async createBatchJob(request: BatchGenerationRequest): Promise<BatchGenerationResponse> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated to create batch jobs');
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('No active session');
    }

    try {
      // Call the generate-batch-blogs Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-batch-blogs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start batch generation');
      }

      const result = await response.json();

      return {
        success: result.success,
        job_id: result.job_id,
        total_posts: result.total_posts,
        message: result.message,
      };
    } catch (_error) {
      logger._error('Error creating batch job:', _error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create batch job');
    }
  }

  /**
   * Check the status of a batch job
   */
  static async checkJobStatus(jobId: string): Promise<BatchJobProgress> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('No active session');
    }

    try {
      // Call the check-batch-status Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-batch-status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ job_id: jobId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check batch status');
      }

      const result = await response.json();
      return result;
    } catch (_error) {
      logger._error('Error checking job status:', _error);
      throw new Error(error instanceof Error ? error.message : 'Failed to check job status');
    }
  }

  /**
   * Cancel a batch job
   */
  static async cancelBatchJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_batch_jobs')
      .update({ status: 'cancelled' })
      .eq('id', jobId)
      .in('status', ['pending', 'processing']);

    if (error) {
      logger.error('Error cancelling batch job:', error);
      throw new Error(`Failed to cancel batch job: ${error.message}`);
    }
  }

  /**
   * Get a batch job by ID
   */
  static async getBatchJobById(jobId: string): Promise<BatchJob> {
    const { data, error } = await supabase
      .from('blog_batch_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      logger.error('Error fetching batch job:', error);
      throw new Error(`Failed to fetch batch job: ${error.message}`);
    }

    if (!data) {
      throw new Error('Batch job not found');
    }

    return data;
  }

  /**
   * Get batch job history for current user
   */
  static async getJobHistory(limit: number = 20): Promise<BatchJob[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const { data, error } = await supabase
      .from('blog_batch_jobs')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching job history:', error);
      throw new Error(`Failed to fetch job history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all batch jobs (admin only)
   */
  static async getAllJobs(limit: number = 50): Promise<BatchJob[]> {
    const { data, error } = await supabase
      .from('blog_batch_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching all jobs:', error);
      throw new Error(`Failed to fetch all jobs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Retry failed posts from a batch job
   */
  static async retryFailedPosts(jobId: string): Promise<BatchGenerationResponse> {
    const job = await this.getBatchJobById(jobId);

    if (job.failed_posts === 0) {
      throw new Error('No failed posts to retry');
    }

    // Extract failed topics from error_log
    const failedTopics = job.error_log.map(error => ({
      topic: error.topic,
    }));

    // Get generation params from original job
    const originalParams = job.generation_params as any;

    // Create a new batch request with only failed topics
    const retryRequest: BatchGenerationRequest = {
      campaign_id: job.campaign_id || undefined,
      template_id: job.template_id || undefined,
      topics: failedTopics,
      category_id: originalParams.category_id,
      default_tags: originalParams.default_tags,
    };

    return this.createBatchJob(retryRequest);
  }

  /**
   * Get posts generated by a batch job
   */
  static async getJobPosts(jobId: string): Promise<any[]> {
    const job = await this.getBatchJobById(jobId);

    // Get all posts created within the job timeframe
    // This is a simple heuristic - in production, you might want to track this more explicitly
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug, title, status, scheduled_for, published_at, excerpt')
      .gte('created_at', job.created_at)
      .lte('created_at', job.completed_at || new Date().toISOString())
      .eq('author_id', job.created_by);

    if (error) {
      logger.error('Error fetching job posts:', error);
      return [];
    }

    // If campaign_id exists, filter by campaign posts
    if (job.campaign_id) {
      const campaignPostIds = data.map(post => post.id);
      const { data: campaignPosts } = await supabase
        .from('blog_post_campaigns')
        .select('post_id')
        .eq('campaign_id', job.campaign_id)
        .in('post_id', campaignPostIds);

      const campaignPostIdSet = new Set(campaignPosts?.map(cp => cp.post_id) || []);
      return data.filter(post => campaignPostIdSet.has(post.id));
    }

    return data || [];
  }

  /**
   * Get statistics for batch jobs
   */
  static async getBatchStatistics(): Promise<{
    total_jobs: number;
    total_posts_generated: number;
    success_rate: number;
    avg_posts_per_job: number;
  }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const { data: jobs, error } = await supabase
      .from('blog_batch_jobs')
      .select('total_posts, completed_posts, failed_posts, status')
      .eq('created_by', user.id);

    if (error) {
      logger.error('Error fetching batch statistics:', error);
      return {
        total_jobs: 0,
        total_posts_generated: 0,
        success_rate: 0,
        avg_posts_per_job: 0,
      };
    }

    const total_jobs = jobs.length;
    const total_posts_generated = jobs.reduce((sum, job) => sum + job.completed_posts, 0);
    const total_failed = jobs.reduce((sum, job) => sum + job.failed_posts, 0);
    const total_attempted = total_posts_generated + total_failed;
    const success_rate = total_attempted > 0 ? (total_posts_generated / total_attempted) * 100 : 0;
    const avg_posts_per_job = total_jobs > 0 ? total_posts_generated / total_jobs : 0;

    return {
      total_jobs,
      total_posts_generated,
      success_rate: Math.round(success_rate * 100) / 100,
      avg_posts_per_job: Math.round(avg_posts_per_job * 100) / 100,
    };
  }
}
