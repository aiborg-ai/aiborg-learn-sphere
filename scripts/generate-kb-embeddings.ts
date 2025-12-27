/**
 * Generate Embeddings for KB Articles
 * Creates vector embeddings for RAG-based search
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit to avoid token limits
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function generateKBEmbeddings() {
  console.log('🔍 Fetching KB articles...\n');

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

  console.log(`Found ${articles.length} KB articles\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const article of articles) {
    try {
      console.log(`📝 Processing: ${article.title}`);

      // Check if embedding already exists
      const { data: existing } = await supabase
        .from('content_embeddings')
        .select('id')
        .eq('content_type', 'knowledge_base')
        .eq('content_id', article.id)
        .single();

      if (existing) {
        console.log(`   ⏭️  Embedding already exists, skipping\n`);
        continue;
      }

      // Combine title, excerpt, and content for embedding
      const textToEmbed = `${article.title}\n\n${article.excerpt || ''}\n\n${article.content.substring(0, 6000)}`;

      // Generate embedding
      console.log(`   🤖 Generating embedding...`);
      const embedding = await generateEmbedding(textToEmbed);

      // Insert into content_embeddings table
      const { error: insertError } = await supabase.from('content_embeddings').insert({
        content_type: 'knowledge_base',
        content_id: article.id,
        title: article.title,
        content: article.content,
        embedding,
        metadata: {
          slug: article.slug,
          kb_category: article.kb_category,
          kb_difficulty: article.kb_difficulty,
          category: article.kb_category,
          difficulty: article.kb_difficulty,
          tags: article.tags,
        },
      });

      if (insertError) {
        console.error(`   ❌ Failed to insert embedding: ${insertError.message}\n`);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Embedding generated and indexed`);
      console.log(`   🔗 Article: /kb/${article.slug}\n`);
      successCount++;

      // Rate limit: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n=====================================');
  console.log(`✨ Embedding generation complete!`);
  console.log(`   Success: ${successCount} articles`);
  console.log(`   Errors: ${errorCount} articles`);
  console.log(`   Skipped: ${articles.length - successCount - errorCount} articles`);
  console.log(`\n🤖 Chatbot can now cite these KB articles!`);
}

generateKBEmbeddings().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
