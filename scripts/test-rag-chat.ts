/**
 * Test RAG Chat System
 * Tests if the ai-chat-rag edge function works with existing embeddings
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRAGChat() {
  console.log('🧪 Testing RAG Chat System\n');

  const testQueries = [
    'How do I enroll in a course?',
    'What courses do you offer for beginners?',
    'Tell me about AI for Productivity',
  ];

  for (const query of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Query: "${query}"`);
    console.log('='.repeat(60));

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-rag', {
        body: {
          messages: [{ role: 'user', content: query }],
          audience: 'professional',
          enable_rag: true,
        },
      });

      if (error) {
        console.log('❌ Error:', error.message);
        continue;
      }

      console.log('\n✅ Response received:');
      console.log(
        `Content: ${data.content?.slice(0, 200)}${data.content?.length > 200 ? '...' : ''}`
      );

      if (data.sources && data.sources.length > 0) {
        console.log(`\nSources (${data.sources.length}):`);
        data.sources.slice(0, 3).forEach((source: any, idx: number) => {
          console.log(`  ${idx + 1}. [${source.content_type}] ${source.title}`);
          console.log(`     Similarity: ${(source.similarity * 100).toFixed(1)}%`);
        });
      } else {
        console.log('\n⚠️  No sources returned (RAG might not be working)');
      }

      if (data.performance) {
        console.log(`\nPerformance:`);
        console.log(`  Search: ${data.performance.search_ms}ms`);
        console.log(`  Total: ${data.performance.total_ms}ms`);
      }
    } catch (err: any) {
      console.log('❌ Exception:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ RAG chat test complete\n');
}

testRAGChat().catch(console.error);
