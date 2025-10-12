/**
 * Deploy blog articles via Supabase REST API
 * Alternative to direct psql connection
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase credentials
const SUPABASE_URL = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // Replace with actual key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Article {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  featured_image: string;
  reading_time: number;
  meta_title: string;
  meta_description: string;
  seo_keywords: string;
  tags: string[];
}

async function deploySingleArticle(article: Article, batchNum: number, index: number) {
  try {
    // Get category ID
    const { data: category } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', article.category)
      .single();

    if (!category) {
      console.error(`Category not found: ${article.category}`);
      return false;
    }

    // Calculate days ago for staggered dates
    const daysAgo = 500 - ((batchNum - 1) * 50 + index);
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - daysAgo);

    // Insert article
    const { error } = await supabase.from('blog_posts').insert({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      category_id: category.id,
      author_id: '00000000-0000-0000-0000-000000000000',
      status: 'published',
      is_featured: index === 0, // First article in each batch is featured
      published_at: publishedAt.toISOString(),
      reading_time: article.reading_time,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      featured_image: article.featured_image,
      allow_comments: true,
    });

    if (error) {
      console.error(`Error inserting article: ${article.title}`, error);
      return false;
    }

    console.log(`✓ Inserted: ${article.title}`);
    return true;
  } catch (error) {
    console.error(`Exception inserting article: ${article.title}`, error);
    return false;
  }
}

async function deployBatch(batchNum: number) {
  const articlesFile = path.join(__dirname, '../articles_with_content.json');
  const articles = JSON.parse(fs.readFileSync(articlesFile, 'utf-8'));

  const start = (batchNum - 1) * 50;
  const end = Math.min(start + 50, articles.length);
  const batchArticles = articles.slice(start, end);

  console.log(`\nDeploying Batch ${batchNum} (${batchArticles.length} articles)...`);

  let successCount = 0;
  for (let i = 0; i < batchArticles.length; i++) {
    const article = batchArticles[i];
    const success = await deploySingleArticle(article, batchNum, i);
    if (success) successCount++;

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`Batch ${batchNum}: ${successCount}/${batchArticles.length} articles deployed`);
  return successCount;
}

async function deployAll() {
  console.log('Starting deployment of 500 articles via Supabase API...\n');

  let totalSuccess = 0;
  for (let batch = 1; batch <= 10; batch++) {
    const count = await deployBatch(batch);
    totalSuccess += count;
  }

  console.log(`\n========================================`);
  console.log(`Deployment complete!`);
  console.log(`Total articles deployed: ${totalSuccess}/500`);
  console.log(`========================================`);
}

// Run deployment
deployAll().catch(console.error);
