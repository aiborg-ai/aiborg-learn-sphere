import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchTopic {
  topic: string;
  audience?: string;
  tone?: string;
  length?: string;
  keywords?: string;
  scheduled_for?: string;
}

interface AutoScheduleConfig {
  enabled: boolean;
  start_date: string;
  frequency: 'daily' | 'weekly' | 'biweekly';
  preferred_time: string;
}

interface BatchGenerationRequest {
  campaign_id?: string;
  template_id?: string;
  topics: BatchTopic[];
  auto_schedule?: AutoScheduleConfig;
  category_id?: string;
  default_tags?: string[];
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
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

    // Get auth user from request
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
    const request: BatchGenerationRequest = await req.json();

    // Validate request
    if (!request.topics || request.topics.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (request.topics.length > 50) {
      return new Response(JSON.stringify({ error: 'Maximum 50 posts per batch' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting batch generation for ${request.topics.length} posts...`);

    // Calculate scheduled dates if auto_schedule is enabled
    let scheduledDates: Date[] = [];
    if (request.auto_schedule?.enabled) {
      scheduledDates = distributeSchedule(
        new Date(request.auto_schedule.start_date),
        request.topics.length,
        request.auto_schedule.frequency,
        request.auto_schedule.preferred_time
      );
    }

    // Create batch job record
    const { data: batchJob, error: jobError } = await supabaseClient
      .from('blog_batch_jobs')
      .insert({
        campaign_id: request.campaign_id || null,
        template_id: request.template_id || null,
        total_posts: request.topics.length,
        completed_posts: 0,
        failed_posts: 0,
        status: 'processing',
        generation_params: request,
        error_log: [],
        created_by: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError || !batchJob) {
      console.error('Error creating batch job:', jobError);
      throw new Error('Failed to create batch job');
    }

    console.log(`Created batch job: ${batchJob.id}`);

    // Process topics sequentially (to avoid rate limits)
    const errors: Array<{ topic: string; error: string; timestamp: string }> = [];
    let completedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < request.topics.length; i++) {
      const topicData = request.topics[i];

      try {
        console.log(`Generating post ${i + 1}/${request.topics.length}: ${topicData.topic}`);

        // Call the existing generate-blog-post function
        const generateResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-blog-post`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic: topicData.topic,
              audience: topicData.audience || 'professional',
              tone: topicData.tone || 'professional',
              length: topicData.length || 'medium',
              keywords: topicData.keywords,
              aiProvider: 'ollama', // Use Ollama as default
            }),
          }
        );

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();
          throw new Error(errorData.error || 'Generation failed');
        }

        const generatedContent = await generateResponse.json();

        // Determine scheduled_for date
        let scheduled_for = null;
        let status: 'draft' | 'scheduled' = 'draft';

        if (topicData.scheduled_for) {
          scheduled_for = topicData.scheduled_for;
          status = 'scheduled';
        } else if (scheduledDates.length > 0 && scheduledDates[i]) {
          scheduled_for = scheduledDates[i].toISOString();
          status = 'scheduled';
        }

        // Calculate reading time
        const wordCount = generatedContent.content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        // Generate slug
        const slug = generatedContent.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Insert blog post
        const { data: newPost, error: postError } = await supabaseClient
          .from('blog_posts')
          .insert({
            slug,
            title: generatedContent.title,
            excerpt: generatedContent.excerpt,
            content: generatedContent.content,
            featured_image: null, // Can be added later via image search
            author_id: user.id,
            category_id: request.category_id || null,
            status,
            published_at: null,
            scheduled_for,
            meta_title: generatedContent.metaTitle || generatedContent.title,
            meta_description: generatedContent.metaDescription || generatedContent.excerpt,
            reading_time: readingTime,
            view_count: 0,
            is_featured: false,
            allow_comments: true,
          })
          .select()
          .single();

        if (postError) {
          throw new Error(`Failed to create blog post: ${postError.message}`);
        }

        // Insert tags if provided
        const tagsToInsert = request.default_tags || generatedContent.suggestedTags || [];
        if (tagsToInsert.length > 0) {
          // Find or create tags
          const { data: existingTags } = await supabaseClient
            .from('blog_tags')
            .select('id, name')
            .in('name', tagsToInsert);

          const existingTagNames = existingTags?.map(t => t.name) || [];
          const newTagNames = tagsToInsert.filter(t => !existingTagNames.includes(t));

          let allTagIds = existingTags?.map(t => t.id) || [];

          if (newTagNames.length > 0) {
            const { data: newTags } = await supabaseClient
              .from('blog_tags')
              .insert(
                newTagNames.map(name => ({
                  name,
                  slug: name.toLowerCase().replace(/\s+/g, '-'),
                }))
              )
              .select('id');

            if (newTags) {
              allTagIds = [...allTagIds, ...newTags.map(t => t.id)];
            }
          }

          // Link tags to post
          if (allTagIds.length > 0) {
            await supabaseClient
              .from('blog_post_tags')
              .insert(allTagIds.map(tag_id => ({ post_id: newPost.id, tag_id })));
          }
        }

        // Link to campaign if provided
        if (request.campaign_id) {
          await supabaseClient.from('blog_post_campaigns').insert({
            post_id: newPost.id,
            campaign_id: request.campaign_id,
            position_in_campaign: i + 1,
          });
        }

        completedCount++;

        console.log(`Successfully created post: ${newPost.title} (${newPost.slug})`);
      } catch (error) {
        console.error(`Error generating post for topic "${topicData.topic}":`, error);
        failedCount++;
        errors.push({
          topic: topicData.topic,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }

      // Update batch job progress
      await supabaseClient
        .from('blog_batch_jobs')
        .update({
          completed_posts: completedCount,
          failed_posts: failedCount,
          error_log: errors,
        })
        .eq('id', batchJob.id);
    }

    // Mark batch job as completed or failed
    const finalStatus = failedCount === request.topics.length ? 'failed' : 'completed';

    await supabaseClient
      .from('blog_batch_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batchJob.id);

    console.log(
      `Batch job ${batchJob.id} completed: ${completedCount} succeeded, ${failedCount} failed`
    );

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        job_id: batchJob.id,
        total_posts: request.topics.length,
        completed_posts: completedCount,
        failed_posts: failedCount,
        message: `Batch generation ${finalStatus}: ${completedCount}/${request.topics.length} posts created successfully`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Fatal error in generate-batch-blogs:', error);
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

/**
 * Helper function to distribute schedule dates
 */
function distributeSchedule(
  startDate: Date,
  postCount: number,
  frequency: 'daily' | 'weekly' | 'biweekly',
  preferredTime: string
): Date[] {
  const schedules: Date[] = [];
  const intervalDays = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 14;
  const [hours, minutes] = preferredTime.split(':').map(Number);

  for (let i = 0; i < postCount; i++) {
    const scheduleDate = new Date(startDate);
    scheduleDate.setDate(scheduleDate.getDate() + i * intervalDays);
    scheduleDate.setHours(hours, minutes, 0, 0);
    schedules.push(scheduleDate);
  }

  return schedules;
}
