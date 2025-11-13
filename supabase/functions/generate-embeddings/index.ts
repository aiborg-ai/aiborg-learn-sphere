/**
 * Generate Embeddings Edge Function
 * Creates vector embeddings for content using OpenAI's embedding API
 *
 * Usage:
 * 1. Batch indexing: POST { content_type?: string } - reindex all content of type
 * 2. Single item: POST { content_type: string, content_id: string }
 * 3. Auto-trigger: Called by database triggers when content changes
 */

import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-application-name',
};

// OpenAI embedding model
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions, $0.02/1M tokens
const MAX_TOKENS = 8000; // Max tokens per embedding (model supports 8191)

interface EmbeddingRequest {
  content_type?: string; // Filter by content type for batch processing
  content_id?: string; // Process single item
  force_refresh?: boolean; // Re-generate even if embedding exists
}

interface ContentItem {
  content_type: string;
  content_id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenAI API key
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const body: EmbeddingRequest = await req.json();
    const { content_type, content_id, force_refresh } = body;

    console.log('Embedding request:', { content_type, content_id, force_refresh });

    // Fetch content to embed
    let query = supabase.from('embeddable_content').select('*');

    if (content_type) {
      query = query.eq('content_type', content_type);
    }

    if (content_id) {
      query = query.eq('content_id', content_id);
    }

    const { data: contentItems, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch content: ${fetchError.message}`);
    }

    if (!contentItems || contentItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No content found matching criteria',
          processed: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${contentItems.length} content items to process`);

    // Filter out items that already have embeddings (unless force_refresh)
    let itemsToProcess = contentItems as ContentItem[];

    if (!force_refresh) {
      const existingIds = contentItems.map(item => `${item.content_type}:${item.content_id}`);
      const { data: existingEmbeddings } = await supabase
        .from('content_embeddings')
        .select('content_type, content_id')
        .in(
          'content_id',
          contentItems.map(i => i.content_id)
        );

      if (existingEmbeddings && existingEmbeddings.length > 0) {
        const existingSet = new Set(
          existingEmbeddings.map(e => `${e.content_type}:${e.content_id}`)
        );
        itemsToProcess = contentItems.filter(
          item => !existingSet.has(`${item.content_type}:${item.content_id}`)
        );
        console.log(
          `Filtered ${existingEmbeddings.length} existing embeddings, ${itemsToProcess.length} new items to process`
        );
      }
    }

    if (itemsToProcess.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All content already has embeddings. Use force_refresh=true to regenerate.',
          processed: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Process items in batches (OpenAI allows up to 2048 inputs per request, but we'll use smaller batches)
    const BATCH_SIZE = 20;
    const results = [];
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < itemsToProcess.length; i += BATCH_SIZE) {
      const batch = itemsToProcess.slice(i, i + BATCH_SIZE);

      try {
        // Prepare text for embedding (title + content)
        const texts = batch.map(item => {
          const text = `${item.title}\n\n${item.content}`;
          // Truncate if too long (rough estimate: 1 token ≈ 4 characters)
          const maxChars = MAX_TOKENS * 4;
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
            encoding_format: 'float', // Return as float array
          }),
        });

        if (!embeddingResponse.ok) {
          const errorData = await embeddingResponse.json();
          throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const embeddingData = await embeddingResponse.json();
        console.log(
          `Generated ${embeddingData.data.length} embeddings, used ${embeddingData.usage.total_tokens} tokens`
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
              content_tokens: Math.ceil(texts[j].length / 4), // Rough estimate
            },
            {
              onConflict: 'content_type,content_id',
            }
          );

          if (upsertError) {
            console.error(
              `Failed to upsert embedding for ${item.content_type}:${item.content_id}:`,
              upsertError
            );
            errors++;
          } else {
            processed++;
          }
        }

        results.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          items: batch.length,
          tokens_used: embeddingData.usage.total_tokens,
        });
      } catch (error) {
        console.error(`Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        errors += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processed} embeddings with ${errors} errors`,
        processed,
        errors,
        total_items: itemsToProcess.length,
        batches: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-embeddings function:', error);
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
