/**
 * Process Embedding Queue
 *
 * Scheduled edge function that processes pending embedding updates
 * from the embedding_update_queue table.
 *
 * Triggered by: Supabase Cron (every 15 minutes)
 * Schedule: Every 15 minutes (cron: star-slash-15 star star star star)
 */

import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ITEMS_PER_RUN = 100;
const MAX_RETRIES = 3;

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting embedding queue processing...');

    // Fetch pending items
    const { data: pendingItems, error: fetchError } = await supabase
      .from('embedding_update_queue')
      .select('*')
      .is('processed_at', null)
      .lt('retry_count', MAX_RETRIES)
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(MAX_ITEMS_PER_RUN);

    if (fetchError) {
      throw new Error(`Failed to fetch queue: ${fetchError.message}`);
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('Queue is empty');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Queue is empty',
          processed: 0,
          errors: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${pendingItems.length} pending items`);

    let processed = 0;
    let errors = 0;
    const results: any[] = [];

    // Group by content_type for batch processing
    const grouped: Record<string, typeof pendingItems> = {};
    pendingItems.forEach(item => {
      if (!grouped[item.content_type]) {
        grouped[item.content_type] = [];
      }
      grouped[item.content_type].push(item);
    });

    // Process each content type
    for (const [contentType, items] of Object.entries(grouped)) {
      console.log(`Processing ${items.length} ${contentType} items...`);

      for (const item of items) {
        try {
          if (item.action === 'delete') {
            // Delete embedding
            const { error: deleteError } = await supabase
              .from('content_embeddings')
              .delete()
              .eq('content_type', item.content_type)
              .eq('content_id', item.content_id);

            if (deleteError) {
              throw new Error(`Delete failed: ${deleteError.message}`);
            }

            // Mark as processed
            await supabase
              .from('embedding_update_queue')
              .update({ processed_at: new Date().toISOString() })
              .eq('id', item.id);

            processed++;
            console.log(`Deleted embedding: ${item.content_type}:${item.content_id}`);
          } else {
            // Create/Update: Call generate-embeddings function
            const { data: genResult, error: genError } = await supabase.functions.invoke(
              'generate-embeddings',
              {
                body: {
                  content_type: item.content_type,
                  content_id: item.content_id,
                  force_refresh: item.action === 'update',
                },
              }
            );

            if (genError) {
              throw new Error(`Generation failed: ${genError.message}`);
            }

            if (genResult?.errors && genResult.errors > 0) {
              throw new Error(`Generation had errors: ${JSON.stringify(genResult)}`);
            }

            // Mark as processed
            await supabase
              .from('embedding_update_queue')
              .update({ processed_at: new Date().toISOString() })
              .eq('id', item.id);

            processed++;
            console.log(`Generated embedding: ${item.content_type}:${item.content_id}`);
          }

          results.push({
            item_id: item.id,
            content_type: item.content_type,
            content_id: item.content_id,
            action: item.action,
            status: 'success',
          });
        } catch (error: any) {
          console.error(`Error processing item ${item.id}:`, error);
          errors++;

          // Update retry count
          const nextRetry = new Date();
          nextRetry.setMinutes(nextRetry.getMinutes() + Math.pow(3, item.retry_count) * 5);

          await supabase
            .from('embedding_update_queue')
            .update({
              retry_count: item.retry_count + 1,
              last_attempt_at: new Date().toISOString(),
              next_retry_at: nextRetry.toISOString(),
              error: error.message,
            })
            .eq('id', item.id);

          results.push({
            item_id: item.id,
            content_type: item.content_type,
            content_id: item.content_id,
            action: item.action,
            status: 'error',
            error: error.message,
          });
        }
      }
    }

    const elapsedMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total_items: pendingItems.length,
          processed,
          errors,
          elapsed_ms: elapsedMs,
        },
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Queue processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
