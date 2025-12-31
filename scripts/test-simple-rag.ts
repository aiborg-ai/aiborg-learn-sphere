/**
 * Test Simplified RAG Chat
 * Tests the ai-chat-simple function after deployment
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSimpleRAG() {
  console.log('🧪 Testing Simplified RAG Chat\n');
  console.log('='.repeat(70));

  const queries = [
    { q: 'How do I enroll in a course?', rag: true },
    { q: 'What courses do you offer?', rag: true },
    { q: 'Tell me about your platform', rag: false },
  ];

  for (const { q, rag } of queries) {
    console.log(`\n📝 Query: "${q}"`);
    console.log(`   RAG: ${rag ? 'Enabled' : 'Disabled'}`);
    console.log('-'.repeat(70));

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-simple', {
        body: {
          messages: [{ role: 'user', content: q }],
          enable_rag: rag,
        },
      });

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        continue;
      }

      if (data.error) {
        console.log(`   ❌ Function error: ${data.error}`);
        continue;
      }

      console.log(`   ✅ Success!`);
      console.log(`   Response: ${data.response?.slice(0, 150)}...`);
      console.log(`   Sources: ${data.sources_count || 0} found`);
    } catch (err: any) {
      console.log(`   ❌ Exception: ${err.message}`);
    }

    console.log('');
  }

  console.log('='.repeat(70));
  console.log('\n✅ Test complete!\n');
}

testSimpleRAG().catch(console.error);
