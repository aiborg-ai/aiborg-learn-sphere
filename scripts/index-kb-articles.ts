/**
 * Index KB Articles for RAG Search
 * Calls the generate-embeddings edge function for each KB article
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY required');
  console.log('\nUsage:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your-key npx tsx scripts/index-kb-articles.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function indexKBArticles() {
  console.log('🔍 Indexing KB articles for RAG search...\n');

  // Fetch all published KB articles
  const { data: articles, error } = await supabase
    .from('vault_content')
    .select('id, title, slug, content, excerpt, kb_category, kb_difficulty, tags')
    .eq('is_knowledge_base', true)
    .eq('status', 'published');

  if (error) {
    console.error('❌ Error fetching articles:', error.message);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log('⚠️  No KB articles found');
    return;
  }

  console.log(`Found ${articles.length} KB articles to index\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const article of articles) {
    try {
      console.log(`📝 ${article.title}`);

      // Check if already indexed
      const { data: existing } = await supabase
        .from('content_embeddings')
        .select('id')
        .eq('content_type', 'knowledge_base')
        .eq('content_id', article.id)
        .single();

      if (existing) {
        console.log(`   ⏭️  Already indexed, skipping\n`);
        skippedCount++;
        continue;
      }

      // Call the generate-embeddings function
      console.log(`   🤖 Generating embedding via Supabase function...`);

      const { data, error: funcError } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          content_type: 'knowledge_base',
          content_id: article.id,
        },
      });

      if (funcError) {
        console.error(`   ❌ Function error: ${funcError.message}\n`);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Indexed successfully`);
      console.log(`   🔗 /kb/${article.slug}\n`);
      successCount++;

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('=====================================');
  console.log(`✨ Indexing complete!`);
  console.log(`   Success: ${successCount} articles`);
  console.log(`   Skipped: ${skippedCount} articles (already indexed)`);
  console.log(`   Errors: ${errorCount} articles`);

  if (successCount > 0) {
    console.log(
      `\n🤖 Chatbot can now search and cite these ${successCount + skippedCount} KB articles!`
    );
    console.log(`\n💡 Test it by asking:`);
    console.log(`   - "What is machine learning?"`);
    console.log(`   - "How do I use PyTorch?"`);
    console.log(`   - "Explain prompt engineering"`);
  }
}

indexKBArticles().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
