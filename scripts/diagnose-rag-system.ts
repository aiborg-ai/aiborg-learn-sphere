/**
 * Diagnose RAG System
 * Tests all components without needing to deploy edge functions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseSystem() {
  console.log('🔍 RAG System Diagnosis\n');
  console.log('='.repeat(70));

  // Test 1: Check embeddings table
  console.log('\n1️⃣  Checking content_embeddings table...');
  try {
    const { count, error } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Table exists with ${count} embeddings`);
    }
  } catch (err: any) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  // Test 2: Check search function
  console.log('\n2️⃣  Checking search_content_by_similarity function...');
  try {
    // Create a dummy embedding (all zeros - won't match anything meaningful)
    const dummyEmbedding = Array(1536).fill(0);

    const { data, error } = await supabase.rpc('search_content_by_similarity', {
      query_embedding: dummyEmbedding,
      match_threshold: 0.5,
      match_count: 1,
    });

    if (error) {
      console.log(`   ❌ Function error: ${error.message}`);
      console.log(`   Details: ${JSON.stringify(error, null, 2)}`);
    } else {
      console.log(`   ✅ Function exists and returned ${data?.length || 0} results`);
    }
  } catch (err: any) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  // Test 3: Check analytics table
  console.log('\n3️⃣  Checking rag_query_analytics table...');
  try {
    const { count, error } = await supabase
      .from('rag_query_analytics')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Table exists with ${count} logged queries`);
    }
  } catch (err: any) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  // Test 4: Check question classifier dependency
  console.log('\n4️⃣  Checking ai-chat-rag dependencies...');
  const dependencies = [
    'supabase/functions/ai-chat-rag/index.ts',
    'supabase/functions/ai-chat-rag/question-classifier.ts',
    'supabase/functions/ai-chat-rag/prompts.ts',
    'supabase/functions/ai-chat-rag/domain-knowledge.ts',
  ];

  for (const dep of dependencies) {
    try {
      const fs = await import('fs');
      if (fs.existsSync(dep)) {
        console.log(`   ✅ ${dep.split('/').pop()} exists`);
      } else {
        console.log(`   ❌ ${dep.split('/').pop()} missing`);
      }
    } catch (err) {
      console.log(`   ❓ Cannot check ${dep.split('/').pop()}`);
    }
  }

  // Test 5: Call generate-embeddings (check if functions are deployed)
  console.log('\n5️⃣  Testing generate-embeddings function...');
  try {
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { content_type: 'faq', content_id: 'test-123' },
    });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Function responded: ${JSON.stringify(data).slice(0, 100)}...`);
    }
  } catch (err: any) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  // Test 6: Call ai-chat-rag with minimal payload
  console.log('\n6️⃣  Testing ai-chat-rag function...');
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-rag', {
      body: {
        messages: [{ role: 'user', content: 'Hello, test message' }],
        audience: 'professional',
        enable_rag: false, // Disable RAG to test basic response
      },
    });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   Context: ${error.context || 'none'}`);
    } else if (data.error) {
      console.log(`   ❌ Function error: ${data.error}`);
    } else {
      console.log(`   ✅ Function responded successfully`);
      console.log(`   Response preview: ${data.response?.slice(0, 100) || 'N/A'}...`);
    }
  } catch (err: any) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  // Test 7: Call ai-chat-rag WITH RAG enabled
  console.log('\n7️⃣  Testing ai-chat-rag WITH RAG enabled...');
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-rag', {
      body: {
        messages: [{ role: 'user', content: 'How do I enroll in a course?' }],
        audience: 'professional',
        enable_rag: true,
      },
    });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else if (data.error) {
      console.log(`   ❌ Function error: ${data.error}`);
      console.log(`   Fallback: ${data.fallback || 'none'}`);
    } else {
      console.log(`   ✅ RAG function worked!`);
      console.log(`   Sources found: ${data.sources_used || 0}`);
      console.log(`   Search time: ${data.performance?.search_ms || 'N/A'}ms`);
      if (data.sources && data.sources.length > 0) {
        console.log(`   Top source: [${data.sources[0].type}] ${data.sources[0].title}`);
      }
    }
  } catch (err: any) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Diagnosis complete!\n');
}

diagnoseSystem().catch(console.error);
