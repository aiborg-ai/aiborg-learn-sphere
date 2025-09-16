import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://afrulkxxzcmngbrdfuzj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkBlogContent() {
  try {
    console.log('Checking blog post content in database...\n');

    // Check the AI Sales Rep post
    const { data, error } = await supabase
      .from('blog_posts')
      .select('title, slug, content, excerpt')
      .eq('slug', 'ai-sales-rep-247')
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return;
    }

    if (data) {
      console.log('Post Title:', data.title);
      console.log('Post Slug:', data.slug);
      console.log('Excerpt:', data.excerpt);
      console.log('Content Length:', data.content ? data.content.length : 0, 'characters');
      console.log('\nFirst 500 characters of content:');
      console.log(data.content ? data.content.substring(0, 500) + '...' : 'No content');
    }

    // Also check what the blog service is actually fetching
    console.log('\n----------------------------');
    console.log('Fetching via blog service pattern...\n');

    const { data: serviceData, error: serviceError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        blog_categories (
          id,
          name,
          slug,
          color
        ),
        blog_post_tags (
          blog_tags (
            id,
            name,
            slug
          )
        )
      `)
      .eq('slug', 'ai-sales-rep-247')
      .eq('status', 'published')
      .single();

    if (serviceError) {
      console.error('Error with service pattern:', serviceError);
    } else if (serviceData) {
      console.log('Service fetch successful');
      console.log('Content present:', !!serviceData.content);
      console.log('Content length from service:', serviceData.content ? serviceData.content.length : 0);
    }

  } catch (error) {
    console.error('Error during check:', error);
  }
}

// Run the check
checkBlogContent();