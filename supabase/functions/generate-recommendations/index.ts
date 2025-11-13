/**
 * Supabase Edge Function: Generate Recommendations
 * Batch process embeddings for new/updated content
 *
 * Trigger: Cron job (nightly at 2 AM UTC) or manual HTTP request
 * Purpose: Keep embeddings up-to-date with latest content
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 100;

interface BatchJobResult {
  jobId: string;
  status: 'completed' | 'failed' | 'partial';
  itemsTotal: number;
  itemsProcessed: number;
  itemsFailed: number;
  durationSeconds: number;
  errors?: string[];
}

/**
 * Main handler
 */
serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify authorization (for manual triggers)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for job type
    const { jobType = 'generate_embeddings', contentType } = await req.json();

    // Create batch job record
    const { data: job, error: jobError } = await supabase
      .from('recommendation_batch_jobs')
      .insert({
        job_type: jobType,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create batch job:', jobError);
      return new Response(JSON.stringify({ error: 'Failed to create batch job' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting batch job ${job.id} - ${jobType}`);

    let result: BatchJobResult;

    if (jobType === 'generate_embeddings') {
      result = await generateEmbeddings(supabase, job.id, contentType);
    } else {
      result = {
        jobId: job.id,
        status: 'failed',
        itemsTotal: 0,
        itemsProcessed: 0,
        itemsFailed: 0,
        durationSeconds: 0,
        errors: ['Unknown job type'],
      };
    }

    // Update batch job with results
    await supabase
      .from('recommendation_batch_jobs')
      .update({
        status: result.status,
        items_total: result.itemsTotal,
        items_processed: result.itemsProcessed,
        items_failed: result.itemsFailed,
        completed_at: new Date().toISOString(),
        duration_seconds: result.durationSeconds,
        error_message: result.errors?.join(', '),
      })
      .eq('id', job.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Generate embeddings for new/updated content
 */
async function generateEmbeddings(
  supabase: any,
  jobId: string,
  contentTypeFilter?: string
): Promise<BatchJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let itemsTotal = 0;
  let itemsProcessed = 0;
  let itemsFailed = 0;

  try {
    // Get all courses without embeddings or outdated embeddings
    let coursesQuery = supabase
      .from('courses')
      .select('id, title, description, category, difficulty_level, tags, updated_at');

    const { data: courses, error: coursesError } = await coursesQuery;

    if (coursesError) {
      errors.push(`Failed to fetch courses: ${coursesError.message}`);
      throw coursesError;
    }

    // Filter courses that need embedding updates
    const coursesToUpdate: any[] = [];

    for (const course of courses || []) {
      const { data: existingEmbedding } = await supabase
        .from('content_embeddings')
        .select('updated_at')
        .eq('content_id', course.id)
        .eq('content_type', 'course')
        .single();

      // No embedding or course updated after embedding
      if (!existingEmbedding || new Date(course.updated_at) > new Date(existingEmbedding.updated_at)) {
        coursesToUpdate.push(course);
      }
    }

    itemsTotal += coursesToUpdate.length;

    // Process courses in batches
    if (coursesToUpdate.length > 0) {
      console.log(`Processing ${coursesToUpdate.length} courses`);

      const batches = chunkArray(coursesToUpdate, BATCH_SIZE);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);

        // Build embedding texts
        const embeddingTexts = batch.map((course) => generateEmbeddingText(course));

        try {
          // Call OpenAI API for batch
          const embeddings = await generateBatchEmbeddings(embeddingTexts);

          // Save embeddings
          for (let i = 0; i < batch.length; i++) {
            const course = batch[i];
            const embedding = embeddings[i];

            if (!embedding) {
              itemsFailed++;
              errors.push(`Failed to generate embedding for course ${course.id}`);
              continue;
            }

            try {
              await supabase.from('content_embeddings').upsert(
                {
                  content_id: course.id,
                  content_type: 'course',
                  embedding: `[${embedding.join(',')}]`,
                  title: course.title,
                  description: course.description,
                  tags: course.tags || [],
                  difficulty_level: course.difficulty_level,
                  embedding_text: embeddingTexts[i],
                  model_version: EMBEDDING_MODEL,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'content_id,content_type' }
              );

              itemsProcessed++;
            } catch (error) {
              itemsFailed++;
              errors.push(`Failed to save embedding for course ${course.id}: ${error.message}`);
            }
          }
        } catch (error) {
          itemsFailed += batch.length;
          errors.push(`Batch ${batchIndex} failed: ${error.message}`);
        }

        // Rate limiting delay
        if (batchIndex < batches.length - 1) {
          await sleep(1000); // 1 second delay between batches
        }
      }
    }

    // Same process for learning paths
    if (!contentTypeFilter || contentTypeFilter === 'learning_path') {
      const { data: paths } = await supabase
        .from('learning_paths')
        .select('id, title, description, difficulty_level, tags, updated_at');

      const pathsToUpdate: any[] = [];

      for (const path of paths || []) {
        const { data: existingEmbedding } = await supabase
          .from('content_embeddings')
          .select('updated_at')
          .eq('content_id', path.id)
          .eq('content_type', 'learning_path')
          .single();

        if (!existingEmbedding || new Date(path.updated_at) > new Date(existingEmbedding.updated_at)) {
          pathsToUpdate.push(path);
        }
      }

      itemsTotal += pathsToUpdate.length;

      if (pathsToUpdate.length > 0) {
        console.log(`Processing ${pathsToUpdate.length} learning paths`);

        const batches = chunkArray(pathsToUpdate, BATCH_SIZE);

        for (const batch of batches) {
          const embeddingTexts = batch.map((path) => generateEmbeddingText(path));

          try {
            const embeddings = await generateBatchEmbeddings(embeddingTexts);

            for (let i = 0; i < batch.length; i++) {
              const path = batch[i];
              const embedding = embeddings[i];

              if (!embedding) {
                itemsFailed++;
                continue;
              }

              try {
                await supabase.from('content_embeddings').upsert(
                  {
                    content_id: path.id,
                    content_type: 'learning_path',
                    embedding: `[${embedding.join(',')}]`,
                    title: path.title,
                    description: path.description,
                    tags: path.tags || [],
                    difficulty_level: path.difficulty_level,
                    embedding_text: embeddingTexts[i],
                    model_version: EMBEDDING_MODEL,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'content_id,content_type' }
                );

                itemsProcessed++;
              } catch (error) {
                itemsFailed++;
              }
            }
          } catch (error) {
            itemsFailed += batch.length;
            errors.push(`Learning paths batch failed: ${error.message}`);
          }
        }
      }
    }

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    return {
      jobId,
      status: itemsFailed === 0 ? 'completed' : itemsFailed < itemsTotal ? 'partial' : 'failed',
      itemsTotal,
      itemsProcessed,
      itemsFailed,
      durationSeconds,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    return {
      jobId,
      status: 'failed',
      itemsTotal,
      itemsProcessed,
      itemsFailed,
      durationSeconds,
      errors: [error.message, ...errors],
    };
  }
}

/**
 * Generate embedding text from content metadata
 */
function generateEmbeddingText(content: any): string {
  const parts: string[] = [content.title];

  if (content.description) {
    parts.push(content.description);
  }

  if (content.category) {
    parts.push(`Category: ${content.category}`);
  }

  if (content.tags && content.tags.length > 0) {
    parts.push(`Tags: ${content.tags.join(', ')}`);
  }

  return parts.join('\n\n');
}

/**
 * Call OpenAI API to generate batch embeddings
 */
async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data.map((item: any) => item.embedding);
}

/**
 * Helper: chunk array into batches
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Helper: sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
