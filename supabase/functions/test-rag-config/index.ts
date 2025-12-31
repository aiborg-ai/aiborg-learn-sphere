/**
 * Test RAG Configuration
 * Checks if all required environment variables and database components are working
 */

import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const results: Record<string, any> = {};

  try {
    // Check 1: Environment variables
    results.env_check = {
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      OPENAI_API_KEY: !!Deno.env.get('OPENAI_API_KEY'),
    };

    // Check 2: Database connection
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count: embeddingsCount, error: countError } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true });

    results.database_check = {
      content_embeddings_exists: !countError,
      embeddings_count: embeddingsCount || 0,
      error: countError?.message || null,
    };

    // Check 3: Search function exists
    const { data: searchTest, error: searchError } = await supabase.rpc(
      'search_content_by_similarity',
      {
        query_embedding: Array(1536).fill(0), // Dummy embedding
        match_threshold: 0.9,
        match_count: 1,
      }
    );

    results.search_function_check = {
      exists: !searchError,
      error: searchError?.message || null,
    };

    // Check 4: OpenAI API (if key exists)
    if (Deno.env.get('OPENAI_API_KEY')) {
      try {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          },
        });

        results.openai_check = {
          api_accessible: testResponse.ok,
          status: testResponse.status,
          error: testResponse.ok ? null : await testResponse.text(),
        };
      } catch (error: any) {
        results.openai_check = {
          api_accessible: false,
          error: error.message,
        };
      }
    } else {
      results.openai_check = {
        api_accessible: false,
        error: 'OPENAI_API_KEY not configured',
      };
    }

    // Check 5: Analytics table
    const { error: analyticsError } = await supabase
      .from('rag_query_analytics')
      .select('*', { count: 'exact', head: true });

    results.analytics_check = {
      table_exists: !analyticsError,
      error: analyticsError?.message || null,
    };

    return new Response(
      JSON.stringify({
        success: true,
        all_checks_passed:
          results.env_check.OPENAI_API_KEY &&
          results.database_check.content_embeddings_exists &&
          results.search_function_check.exists &&
          results.openai_check.api_accessible,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        results,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
