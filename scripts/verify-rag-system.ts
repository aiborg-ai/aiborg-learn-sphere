/**
 * RAG System Verification Script
 * Checks the current state of the RAG system before implementation
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRAGSystem() {
  console.log('🔍 RAG System Verification\n');
  console.log('='.repeat(60));

  // 1. Check content_embeddings table
  console.log('\n📊 1. Checking content_embeddings table...');
  try {
    const { count, error } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('   ❌ Error:', error.message);
    } else {
      console.log(`   ✅ content_embeddings exists with ${count || 0} embeddings`);
    }
  } catch (err) {
    console.log('   ❌ Table does not exist or error:', err);
  }

  // 2. Check embeddable_content view
  console.log('\n📋 2. Checking embeddable_content view...');
  try {
    const { data, error } = await supabase
      .from('embeddable_content')
      .select('content_type', { count: 'exact' })
      .limit(1000);

    if (error) {
      console.log('   ❌ Error:', error.message);
    } else {
      // Count by type
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        counts[item.content_type] = (counts[item.content_type] || 0) + 1;
      });

      console.log('   ✅ embeddable_content view exists');
      console.log('   Content available for indexing:');
      Object.entries(counts).forEach(([type, count]) => {
        console.log(`      - ${type}: ${count} items`);
      });
      console.log(`   📦 Total: ${data?.length || 0} items available`);
    }
  } catch (err) {
    console.log('   ❌ View does not exist or error:', err);
  }

  // 3. Check FAQs table
  console.log('\n❓ 3. Checking FAQs table...');
  try {
    const { count, error } = await supabase
      .from('faqs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.log('   ❌ Error:', error.message);
    } else {
      console.log(`   ✅ FAQs table exists with ${count || 0} active FAQs`);
    }
  } catch (err) {
    console.log('   ❌ Table does not exist or error:', err);
  }

  // 4. Check embedding_update_queue
  console.log('\n⏳ 4. Checking embedding_update_queue...');
  try {
    const { data, error } = await supabase
      .from('embedding_update_queue')
      .select('*')
      .is('processed_at', null);

    if (error) {
      console.log('   ❌ Error:', error.message);
    } else {
      console.log(`   ✅ Queue exists with ${data?.length || 0} pending items`);
    }
  } catch (err) {
    console.log('   ❌ Table does not exist or error:', err);
  }

  // 5. Check rag_query_analytics
  console.log('\n📈 5. Checking rag_query_analytics...');
  try {
    const { count, error } = await supabase
      .from('rag_query_analytics')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('   ❌ Error:', error.message);
    } else {
      console.log(`   ✅ Analytics table exists with ${count || 0} queries logged`);
    }
  } catch (err) {
    console.log('   ❌ Table does not exist or error:', err);
  }

  // 6. Test generate-embeddings function
  console.log('\n🧪 6. Testing generate-embeddings edge function...');
  try {
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: {
        content_type: 'faq',
        content_id: 'test-verification-only',
      },
    });

    if (error) {
      console.log('   ❌ Function error:', error.message);
    } else {
      console.log('   ✅ Function responded:', JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.log('   ⚠️  Function test:', err.message || err);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Verification complete!\n');
}

verifyRAGSystem().catch(console.error);
