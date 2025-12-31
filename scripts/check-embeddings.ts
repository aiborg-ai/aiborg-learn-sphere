/**
 * Check existing embeddings breakdown
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEmbeddings() {
  console.log('📊 Checking existing embeddings...\n');

  // Get all embeddings grouped by content_type
  const { data: embeddings, error } = await supabase
    .from('content_embeddings')
    .select('content_type, content_id, title, content_tokens, created_at');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Count by type
  const counts: Record<string, number> = {};
  embeddings?.forEach(emb => {
    counts[emb.content_type] = (counts[emb.content_type] || 0) + 1;
  });

  console.log('Embeddings by content type:');
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(15)} : ${count} embeddings`);
    });

  console.log(`\nTotal: ${embeddings?.length || 0} embeddings`);

  // Show a few examples
  console.log('\nExample embeddings:');
  embeddings?.slice(0, 5).forEach(emb => {
    console.log(`\n  Type: ${emb.content_type}`);
    console.log(`  Title: ${emb.title.slice(0, 60)}${emb.title.length > 60 ? '...' : ''}`);
    console.log(`  Tokens: ${emb.content_tokens}`);
    console.log(`  Created: ${new Date(emb.created_at).toLocaleDateString()}`);
  });

  // Check total token usage
  const totalTokens = embeddings?.reduce((sum, emb) => sum + (emb.content_tokens || 0), 0) || 0;
  const estimatedCost = (totalTokens / 1_000_000) * 0.02;
  console.log(`\n💰 Total tokens indexed: ${totalTokens.toLocaleString()}`);
  console.log(`💰 Estimated cost so far: $${estimatedCost.toFixed(4)}`);
}

checkEmbeddings().catch(console.error);
