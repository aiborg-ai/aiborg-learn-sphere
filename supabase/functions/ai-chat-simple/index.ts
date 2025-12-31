/**
 * Simplified AI Chat with RAG
 * Minimal version without complex dependencies for debugging
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

  try {
    const { messages, enable_rag = true } = await req.json();

    // Check environment
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const userMessage = messages[messages.length - 1].content;
    let ragContext = '';

    // Simple RAG: Just search embeddings
    if (enable_rag) {
      try {
        // Generate embedding for query
        const embResp = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: userMessage,
          }),
        });

        if (embResp.ok) {
          const embData = await embResp.json();
          const embedding = embData.data[0].embedding;

          // Search database
          const { data: results } = await supabase.rpc('search_content_by_similarity', {
            query_embedding: embedding,
            match_threshold: 0.6,
            match_count: 3,
          });

          if (results && results.length > 0) {
            ragContext = results
              .map((r: any, i: number) => `[${i + 1}] ${r.title}\n${r.content.slice(0, 300)}...`)
              .join('\n\n');
          }
        }
      } catch (ragError) {
        console.error('RAG error:', ragError);
        // Continue without RAG if it fails
      }
    }

    // Build system prompt
    let systemPrompt = `You are an AI tutor for an AI education platform. Be helpful and encouraging.`;

    if (ragContext) {
      systemPrompt += `\n\nRelevant content from knowledge base:\n${ragContext}\n\nUse this information to answer accurately.`;
    }

    // Call GPT-4
    const chatResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!chatResp.ok) {
      const errorData = await chatResp.json();
      throw new Error(`OpenAI error: ${errorData.error?.message}`);
    }

    const chatData = await chatResp.json();

    return new Response(
      JSON.stringify({
        response: chatData.choices[0].message.content,
        rag_enabled: enable_rag,
        sources_count: ragContext ? 3 : 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
