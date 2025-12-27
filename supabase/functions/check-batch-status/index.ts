import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(JSON.stringify({ error: 'job_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch batch job
    const { data: batchJob, error: jobError } = await supabaseClient
      .from('blog_batch_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !batchJob) {
      return new Response(JSON.stringify({ error: 'Batch job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate progress percentage
    const progressPercentage =
      batchJob.total_posts > 0
        ? Math.round(
            ((batchJob.completed_posts + batchJob.failed_posts) / batchJob.total_posts) * 100
          )
        : 0;

    // Estimate time remaining (rough estimate: 15 seconds per post)
    const remaining_posts = batchJob.total_posts - batchJob.completed_posts - batchJob.failed_posts;
    const estimated_time_remaining = batchJob.status === 'processing' ? remaining_posts * 15 : 0;

    // Get successfully created posts
    const successful_posts: Array<{
      id: string;
      title: string;
      slug: string;
      scheduled_for?: string;
    }> = [];

    const failed_posts: Array<{ topic: string; error: string }> = [];

    // Extract failed posts from error_log
    if (batchJob.error_log && Array.isArray(batchJob.error_log)) {
      batchJob.error_log.forEach((errorEntry: any) => {
        failed_posts.push({
          topic: errorEntry.topic,
          error: errorEntry.error,
        });
      });
    }

    // Get successful posts created within the job timeframe
    if (batchJob.started_at) {
      const { data: posts } = await supabaseClient
        .from('blog_posts')
        .select('id, title, slug, scheduled_for')
        .eq('author_id', batchJob.created_by)
        .gte('created_at', batchJob.started_at)
        .lte('created_at', batchJob.completed_at || new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(batchJob.completed_posts);

      if (posts) {
        successful_posts.push(...posts);
      }
    }

    // Return progress data
    return new Response(
      JSON.stringify({
        job_id: batchJob.id,
        status: batchJob.status,
        total_posts: batchJob.total_posts,
        completed_posts: batchJob.completed_posts,
        failed_posts: batchJob.failed_posts,
        progress_percentage: progressPercentage,
        estimated_time_remaining,
        successful_posts,
        failed_posts,
        started_at: batchJob.started_at,
        completed_at: batchJob.completed_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error checking batch status:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
