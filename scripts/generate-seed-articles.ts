/**
 * Generate Seed KB Articles
 *
 * Creates initial knowledge base articles across all categories
 * Run with: npx tsx scripts/generate-seed-articles.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ArticleTopic {
  topic: string;
  category: string;
  difficulty: string;
  target_length: string;
  outline?: string[];
}

const SEED_ARTICLES: ArticleTopic[] = [
  // AI Fundamentals (3 articles)
  {
    topic: "What is Machine Learning? A Complete Beginner's Guide",
    category: 'ai_fundamentals',
    difficulty: 'beginner',
    target_length: 'medium',
    outline: [
      'What is Machine Learning?',
      'Types of Machine Learning',
      'How Machine Learning Works',
      'Real-World Applications',
      'Getting Started with ML',
    ],
  },
  {
    topic: 'Understanding Neural Networks: From Perceptrons to Deep Learning',
    category: 'ai_fundamentals',
    difficulty: 'intermediate',
    target_length: 'long',
    outline: [
      'Introduction to Neural Networks',
      'The Perceptron: Building Block of Neural Networks',
      'Multi-Layer Neural Networks',
      'Activation Functions Explained',
      'Backpropagation and Training',
      'Deep Learning Architectures',
    ],
  },
  {
    topic: 'Transformer Architecture: How Attention Revolutionized AI',
    category: 'ai_fundamentals',
    difficulty: 'advanced',
    target_length: 'long',
    outline: [
      'The Attention Mechanism',
      'Self-Attention and Multi-Head Attention',
      'Positional Encoding',
      'The Transformer Architecture',
      'BERT, GPT, and Modern Transformers',
      'Applications and Future Directions',
    ],
  },

  // Practical Tools (3 articles)
  {
    topic: 'Getting Started with PyTorch: Your First Neural Network',
    category: 'practical_tools',
    difficulty: 'beginner',
    target_length: 'medium',
    outline: [
      'Installing PyTorch',
      'PyTorch Basics: Tensors and Operations',
      'Building Your First Neural Network',
      'Training and Evaluation',
      'Saving and Loading Models',
    ],
  },
  {
    topic: 'Building a RAG System with LangChain: Step-by-Step Tutorial',
    category: 'practical_tools',
    difficulty: 'intermediate',
    target_length: 'long',
    outline: [
      'What is RAG (Retrieval Augmented Generation)?',
      'Setting Up LangChain',
      'Creating a Vector Database',
      'Implementing Semantic Search',
      'Connecting to LLMs',
      'Building the RAG Pipeline',
      'Testing and Optimization',
    ],
  },
  {
    topic: 'Fine-Tuning Large Language Models with HuggingFace Transformers',
    category: 'practical_tools',
    difficulty: 'advanced',
    target_length: 'long',
    outline: [
      'Introduction to Fine-Tuning',
      'Choosing the Right Model',
      'Preparing Your Dataset',
      'Training Configuration and Hyperparameters',
      'Fine-Tuning Process',
      'Evaluation and Deployment',
    ],
  },

  // Business AI (2 articles)
  {
    topic: 'AI Strategy for Small Businesses: A Practical Roadmap',
    category: 'business_ai',
    difficulty: 'beginner',
    target_length: 'medium',
    outline: [
      'Why AI Matters for Small Businesses',
      'Identifying AI Opportunities',
      'Starting Small: Low-Hanging Fruit',
      'Building an AI Team',
      'Measuring Success and ROI',
    ],
  },
  {
    topic: 'Calculating ROI for AI Projects: A Complete Framework',
    category: 'business_ai',
    difficulty: 'intermediate',
    target_length: 'long',
    outline: [
      'Understanding AI ROI Metrics',
      'Cost Components of AI Projects',
      'Measuring Business Impact',
      'Building the ROI Model',
      'Case Studies and Examples',
      'Common Pitfalls to Avoid',
    ],
  },

  // Prompt Engineering (1 article)
  {
    topic: 'Prompt Engineering Best Practices: From Basic to Advanced',
    category: 'prompt_engineering',
    difficulty: 'intermediate',
    target_length: 'medium',
    outline: [
      'What is Prompt Engineering?',
      'Basic Prompting Techniques',
      'Chain-of-Thought Prompting',
      'Few-Shot Learning',
      'Advanced Strategies',
      'Common Mistakes and How to Avoid Them',
    ],
  },

  // MLOps & Deployment (1 article)
  {
    topic: 'Deploying ML Models to Production: A Complete Guide',
    category: 'deployment',
    difficulty: 'intermediate',
    target_length: 'long',
    outline: [
      'Production Readiness Checklist',
      'Containerization with Docker',
      'Building REST APIs with FastAPI',
      'Model Versioning and Monitoring',
      'Scaling and Load Balancing',
      'CI/CD for Machine Learning',
    ],
  },
];

async function generateArticle(topic: ArticleTopic, index: number): Promise<void> {
  console.log(`\n[${index + 1}/${SEED_ARTICLES.length}] Generating: "${topic.topic}"`);
  console.log(`   Category: ${topic.category} | Difficulty: ${topic.difficulty}`);

  try {
    const { data, error } = await supabase.functions.invoke('generate-kb-article', {
      body: {
        topic: topic.topic,
        category: topic.category,
        difficulty: topic.difficulty,
        target_length: topic.target_length,
        outline: topic.outline,
      },
    });

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return;
    }

    if (!data.success) {
      console.error(`   ❌ Failed: ${data.error}`);
      return;
    }

    console.log(`   ✅ Generated: "${data.article.title}"`);
    console.log(
      `   📊 ${data.article.word_count} words | ${data.article.reading_time_minutes} min read`
    );
    console.log(`   🔗 Preview: /kb/${data.article.slug}`);
    console.log(`   💾 Saved as draft (ID: ${data.article.id})`);

    // Wait 2 seconds between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error: any) {
    console.error(`   ❌ Exception: ${error.message}`);
  }
}

async function publishAllDrafts(): Promise<void> {
  console.log('\n📢 Publishing all draft articles...');

  const { data: drafts, error: fetchError } = await supabase
    .from('vault_content')
    .select('id, title, slug')
    .eq('is_knowledge_base', true)
    .eq('status', 'draft');

  if (fetchError) {
    console.error('❌ Failed to fetch drafts:', fetchError.message);
    return;
  }

  if (!drafts || drafts.length === 0) {
    console.log('⚠️  No draft articles found');
    return;
  }

  console.log(`Found ${drafts.length} draft articles to publish`);

  const { error: updateError } = await supabase
    .from('vault_content')
    .update({
      status: 'published',
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('is_knowledge_base', true)
    .eq('status', 'draft');

  if (updateError) {
    console.error('❌ Failed to publish articles:', updateError.message);
    return;
  }

  console.log(`✅ Published ${drafts.length} articles`);
  drafts.forEach(article => {
    console.log(`   • ${article.title}`);
    console.log(`     URL: /kb/${article.slug}`);
  });
}

async function main() {
  console.log('🚀 Knowledge Base Seed Article Generator');
  console.log('=========================================');
  console.log(`Generating ${SEED_ARTICLES.length} articles across categories...\n`);

  const startTime = Date.now();

  // Generate all articles
  for (let i = 0; i < SEED_ARTICLES.length; i++) {
    await generateArticle(SEED_ARTICLES[i], i);
  }

  // Publish all articles
  await publishAllDrafts();

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n✨ Complete! Generated ${SEED_ARTICLES.length} articles in ${elapsed}s`);
  console.log(`\n🌐 View your knowledge base at: /kb`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
