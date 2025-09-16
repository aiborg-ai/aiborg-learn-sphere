import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://afrulkxxzcmngbrdfuzj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupCategories() {
  // Check existing categories
  const { data: existing } = await supabase
    .from('blog_categories')
    .select('name, slug');

  console.log('Existing categories:');
  existing?.forEach(c => console.log('- ' + c.slug + ': ' + c.name));

  // Use existing categories for the posts
  console.log('\nUsing existing categories for batch 2 posts:');
  console.log('- "ai-technology" for future tech posts');
  console.log('- "ai-for-everyone" for social impact posts');
}

setupCategories();