/**
 * Batch Index Content Edge Function
 *
 * One-time batch indexing with progress tracking and cost estimation.
 * Used for initial population of the knowledge base or bulk re-indexing.
 *
 * Usage:
 * - Full reindex: POST {}
 * - Specific type: POST { content_types: ['course'] }
 * - Dry run: POST { dry_run: true }
 * - Force refresh: POST { force_refresh: true }
 */

import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 20; // OpenAI allows up to 2048, but we'll use smaller batches
const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_RETRIES = 3;

// Priority order for content types
const CONTENT_TYPES_PRIORITY = ['faq', 'course', 'blog_post', 'learning_path', 'flashcard'];

interface BatchIndexRequest {
  content_types?: string[]; // Filter by specific types
  batch_size?: number; // Override default batch size
  dry_run?: boolean; // Preview only, don't actually generate
  force_refresh?: boolean; // Re-generate even if embedding exists
}

interface BatchResult {
  content_type: string;
  total_items: number;
  processed: number;
  errors: number;
  tokens_used: number;
  cost_usd: number;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const body: BatchIndexRequest = await req.json();
    const {
      content_types = CONTENT_TYPES_PRIORITY,
      batch_size = BATCH_SIZE,
      dry_run = false,
      force_refresh = false,
    } = body;

    console.log('Batch indexing request:', {
      content_types,
      batch_size,
      dry_run,
      force_refresh,
    });

    const results: BatchResult[] = [];
    let totalProcessed = 0;
    let totalErrors = 0;
    let totalTokens = 0;

    // Process each content type in priority order
    for (const contentType of content_types) {
      console.log(`\n=== Processing content type: ${contentType} ===`);

      // Fetch content to index
      const { data: contentItems, error: fetchError } = await supabase
        .from('embeddable_content')
        .select('*')
        .eq('content_type', contentType);

      if (fetchError) {
        console.error(`Error fetching ${contentType}:`, fetchError);
        results.push({
          content_type: contentType,
          total_items: 0,
          processed: 0,
          errors: 1,
          tokens_used: 0,
          cost_usd: 0,
        });
        continue;
      }

      if (!contentItems || contentItems.length === 0) {
        console.log(`No ${contentType} items found`);
        results.push({
          content_type: contentType,
          total_items: 0,
          processed: 0,
          errors: 0,
          tokens_used: 0,
          cost_usd: 0,
        });
        continue;
      }

      console.log(`Found ${contentItems.length} ${contentType} items`);

      if (dry_run) {
        // Dry run: just count and estimate cost
        const estimatedTokens = contentItems.reduce((sum, item) => {
          const text = `${item.title}\n\n${item.content}`;
          return sum + Math.ceil(text.length / 4);
        }, 0);

        const estimatedCost = (estimatedTokens / 1_000_000) * 0.02;

        results.push({
          content_type: contentType,
          total_items: contentItems.length,
          processed: 0,
          errors: 0,
          tokens_used: estimatedTokens,
          cost_usd: estimatedCost,
        });

        console.log(`[DRY RUN] Would process ${contentItems.length} items`);
        console.log(`[DRY RUN] Estimated tokens: ${estimatedTokens}`);
        console.log(`[DRY RUN] Estimated cost: $${estimatedCost.toFixed(4)}`);
        continue;
      }

      // Filter out items that already have embeddings (unless force_refresh)
      let itemsToProcess = contentItems;

      if (!force_refresh) {
        const { data: existingEmbeddings } = await supabase
          .from('content_embeddings')
          .select('content_type, content_id')
          .eq('content_type', contentType);

        if (existingEmbeddings && existingEmbeddings.length > 0) {
          const existingSet = new Set(existingEmbeddings.map(e => e.content_id));
          itemsToProcess = contentItems.filter(item => !existingSet.has(item.content_id));
          console.log(
            `Filtered ${existingEmbeddings.length} existing embeddings, ` +
              `${itemsToProcess.length} new items to process`
          );
        }
      }

      if (itemsToProcess.length === 0) {
        console.log(`All ${contentType} items already have embeddings`);
        results.push({
          content_type: contentType,
          total_items: contentItems.length,
          processed: 0,
          errors: 0,
          tokens_used: 0,
          cost_usd: 0,
        });
        continue;
      }

      // Process in batches
      let processed = 0;
      let errors = 0;
      let tokensUsed = 0;

      for (let i = 0; i < itemsToProcess.length; i += batch_size) {
        const batch = itemsToProcess.slice(i, i + batch_size);
        const batchNum = Math.floor(i / batch_size) + 1;
        const totalBatches = Math.ceil(itemsToProcess.length / batch_size);

        console.log(`Processing batch ${batchNum}/${totalBatches} ` + `(${batch.length} items)...`);

        // Retry logic
        let retryCount = 0;
        let success = false;

        while (retryCount < MAX_RETRIES && !success) {
          try {
            // Prepare text for embedding
            const texts = batch.map(item => {
              const text = `${item.title}\n\n${item.content}`;
              const maxChars = 8000 * 4; // 8000 tokens max
              return text.length > maxChars ? text.slice(0, maxChars) : text;
            });

            // Call OpenAI Embeddings API
            const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: texts,
                encoding_format: 'float',
              }),
            });

            if (!embeddingResponse.ok) {
              const errorData = await embeddingResponse.json();
              throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const embeddingData = await embeddingResponse.json();
            tokensUsed += embeddingData.usage.total_tokens;

            console.log(
              `Generated ${embeddingData.data.length} embeddings, ` +
                `used ${embeddingData.usage.total_tokens} tokens`
            );

            // Upsert embeddings to database
            for (let j = 0; j < batch.length; j++) {
              const item = batch[j];
              const embedding = embeddingData.data[j].embedding;

              const { error: upsertError } = await supabase.from('content_embeddings').upsert(
                {
                  content_type: item.content_type,
                  content_id: item.content_id,
                  title: item.title,
                  content: item.content,
                  metadata: item.metadata,
                  embedding: embedding,
                  content_tokens: Math.ceil(texts[j].length / 4),
                },
                {
                  onConflict: 'content_type,content_id',
                }
              );

              if (upsertError) {
                console.error(
                  `Failed to upsert ${item.content_type}:${item.content_id}:`,
                  upsertError
                );
                errors++;
              } else {
                processed++;
              }
            }

            success = true;
          } catch (error) {
            retryCount++;
            console.error(`Batch ${batchNum} attempt ${retryCount} failed:`, error);

            if (retryCount < MAX_RETRIES) {
              const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff
              console.log(`Retrying in ${delayMs}ms...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
              console.error(`Batch ${batchNum} failed after ${MAX_RETRIES} attempts`);
              errors += batch.length;
            }
          }
        }

        // Progress update
        const progressPercent = Math.round(((i + batch.length) / itemsToProcess.length) * 100);
        console.log(`Progress: ${progressPercent}% (${processed}/${itemsToProcess.length} items)`);
      }

      const cost = (tokensUsed / 1_000_000) * 0.02;

      results.push({
        content_type: contentType,
        total_items: contentItems.length,
        processed,
        errors,
        tokens_used: tokensUsed,
        cost_usd: cost,
      });

      totalProcessed += processed;
      totalErrors += errors;
      totalTokens += tokensUsed;

      console.log(`\n✅ Completed ${contentType}:`);
      console.log(`   Processed: ${processed}`);
      console.log(`   Errors: ${errors}`);
      console.log(`   Tokens: ${tokensUsed.toLocaleString()}`);
      console.log(`   Cost: $${cost.toFixed(4)}`);
    }

    const totalCost = (totalTokens / 1_000_000) * 0.02;
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    return new Response(
      JSON.stringify({
        success: true,
        dry_run,
        force_refresh,
        summary: {
          total_items_processed: totalProcessed,
          total_errors: totalErrors,
          total_tokens_used: totalTokens,
          total_cost_usd: totalCost,
          elapsed_seconds: elapsedSeconds,
        },
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in batch-index-content function:', error);
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
