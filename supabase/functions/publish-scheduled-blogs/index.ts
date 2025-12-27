import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishResult {
  id: string;
  slug: string;
  title: string;
  scheduled_for: string;
  published_at: string;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const now = new Date();
    console.log(`[${now.toISOString()}] Checking for scheduled blog posts to publish...`);

    // Query for blog posts that are scheduled and past their scheduled_for time
    const { data: scheduledPosts, error: queryError } = await supabaseClient
      .from('blog_posts')
      .select('id, slug, title, scheduled_for')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true });

    if (queryError) {
      console.error('Error querying scheduled posts:', queryError);
      throw queryError;
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log('No scheduled posts ready for publishing.');
      return new Response(
        JSON.stringify({
          success: true,
          published_count: 0,
          message: 'No posts ready for publishing',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${scheduledPosts.length} post(s) ready for publishing.`);

    const publishedPosts: PublishResult[] = [];
    const errors: Array<{ id: string; title: string; error: string }> = [];

    // Publish each post
    for (const post of scheduledPosts) {
      try {
        const { error: updateError } = await supabaseClient
          .from('blog_posts')
          .update({
            status: 'published',
            published_at: now.toISOString(),
          })
          .eq('id', post.id);

        if (updateError) {
          console.error(`Error publishing post ${post.id}:`, updateError);
          errors.push({
            id: post.id,
            title: post.title,
            error: updateError.message,
          });
        } else {
          console.log(`Successfully published: ${post.title} (${post.slug})`);
          publishedPosts.push({
            id: post.id,
            slug: post.slug,
            title: post.title,
            scheduled_for: post.scheduled_for,
            published_at: now.toISOString(),
          });
        }
      } catch (error) {
        console.error(`Exception publishing post ${post.id}:`, error);
        errors.push({
          id: post.id,
          title: post.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log summary
    console.log(
      `Publishing complete: ${publishedPosts.length} succeeded, ${errors.length} failed.`
    );

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        published_count: publishedPosts.length,
        failed_count: errors.length,
        published_posts: publishedPosts,
        errors: errors.length > 0 ? errors : undefined,
        execution_time: now.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Fatal error in publish-scheduled-blogs:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
