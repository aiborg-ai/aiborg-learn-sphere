import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase configuration
const SUPABASE_URL = "https://afrulkxxzcmngbrdfuzj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function insertBlogPosts() {
  try {
    console.log('Starting blog post insertion...');

    // First, ensure categories exist
    const categories = [
      { name: 'Young Learners', slug: 'young-learners', description: 'AI content for kids aged 8-12', color: '#FF6B6B', is_active: true, sort_order: 1 },
      { name: 'Teenagers', slug: 'teenagers', description: 'Tech content for teens aged 13-18', color: '#4ECDC4', is_active: true, sort_order: 2 },
      { name: 'Professionals', slug: 'professionals', description: 'Career and productivity content', color: '#45B7D1', is_active: true, sort_order: 3 },
      { name: 'Business Owners', slug: 'business-owners', description: 'SME and business AI content', color: '#96CEB4', is_active: true, sort_order: 4 }
    ];

    for (const category of categories) {
      const { error } = await supabase
        .from('blog_categories')
        .upsert(category, { onConflict: 'slug' });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error inserting category:', error);
      }
    }
    console.log('✓ Categories created/updated');

    // Create tags
    const tags = [
      { name: 'AI', slug: 'ai' },
      { name: 'Education', slug: 'education' },
      { name: 'Business', slug: 'business' },
      { name: 'Productivity', slug: 'productivity' },
      { name: 'Gaming', slug: 'gaming' },
      { name: 'Social Media', slug: 'social-media' },
      { name: 'Career', slug: 'career' },
      { name: 'Tutorial', slug: 'tutorial' }
    ];

    for (const tag of tags) {
      const { error } = await supabase
        .from('blog_tags')
        .upsert(tag, { onConflict: 'slug' });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error inserting tag:', error);
      }
    }
    console.log('✓ Tags created/updated');

    // Get category IDs
    const { data: categoryData } = await supabase
      .from('blog_categories')
      .select('id, slug');

    const categoryMap = categoryData?.reduce((acc, cat) => {
      acc[cat.slug] = cat.id;
      return acc;
    }, {} as Record<string, string>) || {};

    // Get a default author ID (use system user or first user)
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const defaultAuthorId = users?.[0]?.id || '00000000-0000-0000-0000-000000000000';

    // Insert blog posts
    const blogPosts = [
      {
        title: 'My First AI Friend: How Computers Learn',
        slug: 'my-first-ai-friend',
        content: 'Imagine having a computer friend who learns just like you do! AI is like teaching your computer to be smart...',
        excerpt: 'Discover how AI works in simple terms',
        category_id: categoryMap['young-learners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: true,
        published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e'
      },
      {
        title: 'Robot Pets vs Real Pets: The AI Difference',
        slug: 'robot-pets-vs-real-pets',
        content: 'Would you like a pet that never needs feeding? Robot pets are becoming smarter with AI...',
        excerpt: 'Explore the world of AI pets',
        category_id: categoryMap['young-learners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1563396983906-b3795482a59a'
      },
      {
        title: 'How AI Helps Doctors Keep You Healthy',
        slug: 'ai-helps-doctors',
        content: 'Doctors have a new helper called AI that can spot problems faster than ever...',
        excerpt: 'Learn how AI helps medicine',
        category_id: categoryMap['young-learners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d'
      },
      {
        title: 'The Computer That Draws Pictures',
        slug: 'computer-that-draws',
        content: 'AI can now create amazing artwork! Learn how computers became artists...',
        excerpt: 'AI art generation explained for kids',
        category_id: categoryMap['young-learners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: true,
        published_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8'
      },
      {
        title: 'Why Homework Helps Your Brain Grow',
        slug: 'homework-helps-brain',
        content: 'Even though AI can do homework, doing it yourself makes you smarter...',
        excerpt: 'Understanding learning vs AI',
        category_id: categoryMap['young-learners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7'
      },
      {
        title: 'TikTok Algorithm: Why You Can\'t Stop Scrolling',
        slug: 'tiktok-algorithm-addiction',
        content: 'The TikTok For You Page knows you better than you know yourself. Here\'s the science behind the addiction...',
        excerpt: 'Deep dive into TikTok\'s AI',
        category_id: categoryMap['teenagers'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: true,
        published_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0'
      },
      {
        title: 'AI Influencers Making Millions While Being Fake',
        slug: 'ai-influencers-millions',
        content: 'Virtual influencers are earning more than real people. Meet the AI models taking over Instagram...',
        excerpt: 'The rise of virtual influencers',
        category_id: categoryMap['teenagers'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1607734834519-d8576ae60ea6'
      },
      {
        title: 'Instagram\'s AI: The Psychology of Addiction',
        slug: 'instagram-ai-psychology',
        content: 'Every scroll, like, and story view trains Instagram\'s AI to keep you hooked...',
        excerpt: 'How Instagram manipulates engagement',
        category_id: categoryMap['teenagers'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: true,
        published_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868'
      },
      {
        title: 'Gaming NPCs That Remember Everything',
        slug: 'gaming-npcs-ai-memory',
        content: 'Next-gen games have NPCs that remember your choices and adapt. The future of gaming AI...',
        excerpt: 'AI revolution in gaming',
        category_id: categoryMap['teenagers'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc'
      },
      {
        title: 'ChatGPT for Homework: Smart Ways to Use It',
        slug: 'chatgpt-homework-guide',
        content: 'Using AI for homework without cheating - the guide your teachers won\'t give you...',
        excerpt: 'Ethical AI use for students',
        category_id: categoryMap['teenagers'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8'
      },
      {
        title: 'The 4-Hour Workday: AI Automation That Works',
        slug: '4-hour-workday-ai',
        content: 'Professionals using the right AI stack are working 4-hour days while outperforming colleagues...',
        excerpt: 'AI productivity strategies',
        category_id: categoryMap['professionals'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: true,
        published_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 5,
        featured_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978'
      },
      {
        title: 'Copilot vs Claude: Choosing Your AI Coder',
        slug: 'copilot-vs-claude',
        content: 'GitHub Copilot or Claude? The definitive comparison for developers...',
        excerpt: 'AI coding assistant comparison',
        category_id: categoryMap['professionals'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6'
      },
      {
        title: 'Email Zero in 15 Minutes with AI',
        slug: 'email-zero-ai',
        content: 'From 3 hours to 15 minutes - the AI email system that actually works...',
        excerpt: 'AI email management',
        category_id: categoryMap['professionals'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: true,
        published_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2'
      },
      {
        title: 'AI Meeting Notes: Never Write Again',
        slug: 'ai-meeting-notes',
        content: 'Transcription AI that captures everything while you actually participate...',
        excerpt: 'Meeting automation tools',
        category_id: categoryMap['professionals'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4'
      },
      {
        title: 'Prompt Engineering: The $200K Skill',
        slug: 'prompt-engineering-salary',
        content: 'Why prompt engineers are earning senior developer salaries...',
        excerpt: 'High-paying AI skills',
        category_id: categoryMap['professionals'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f'
      },
      {
        title: '$10K AI Setup Replaces $100K Employee',
        slug: '10k-ai-replaces-100k-employee',
        content: 'Case study: How an SME used AI tools to fill an operations manager role...',
        excerpt: 'AI ROI for small business',
        category_id: categoryMap['business-owners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: true,
        published_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 5,
        featured_image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984'
      },
      {
        title: 'Customer Service Bots That Don\'t Suck',
        slug: 'customer-service-bots-guide',
        content: 'Implementing AI customer service while maintaining human touch...',
        excerpt: 'AI customer service guide',
        category_id: categoryMap['business-owners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'
      },
      {
        title: 'AI Inventory: Never Stock Out Again',
        slug: 'ai-inventory-management',
        content: 'Predictive inventory management that cuts costs by 30%...',
        excerpt: 'Smart inventory systems',
        category_id: categoryMap['business-owners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1553413077-190dd305871c'
      },
      {
        title: 'Automated Invoicing That Gets You Paid',
        slug: 'automated-invoicing-ai',
        content: 'AI invoicing that reduces payment delays by 50%...',
        excerpt: 'Financial automation for SMEs',
        category_id: categoryMap['business-owners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: true,
        published_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c'
      },
      {
        title: 'The AI Sales Rep That Never Sleeps',
        slug: 'ai-sales-rep-247',
        content: 'Lead generation and qualification on autopilot...',
        excerpt: '24/7 sales automation',
        category_id: categoryMap['business-owners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d'
      },
      {
        title: 'Teaching Robots to Dance',
        slug: 'teaching-robots-dance',
        content: 'How do robots learn to move? It\'s like teaching a friend a new dance...',
        excerpt: 'Robot movement and AI',
        category_id: categoryMap['young-learners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485'
      },
      {
        title: 'AI in Your Favorite Games',
        slug: 'ai-favorite-games',
        content: 'The computer players in your games use AI to challenge you...',
        excerpt: 'Gaming AI for kids',
        category_id: categoryMap['young-learners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc'
      },
      {
        title: 'Snapchat Filters: The AI Behind the Magic',
        slug: 'snapchat-filters-ai',
        content: 'How does Snapchat know where to put dog ears? AI face recognition explained...',
        excerpt: 'Filter technology explained',
        category_id: categoryMap['teenagers'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1496065187959-7f07b8353c55'
      },
      {
        title: 'Discord Bots: Build Your Own AI Mod',
        slug: 'discord-bots-build',
        content: 'Create custom Discord bots that moderate, play music, and more...',
        excerpt: 'DIY Discord automation',
        category_id: categoryMap['teenagers'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41'
      },
      {
        title: 'AI Code Review: Catch Bugs Before Production',
        slug: 'ai-code-review',
        content: 'Automated code review that catches what humans miss...',
        excerpt: 'Development automation',
        category_id: categoryMap['professionals'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c'
      },
      {
        title: 'The Death of PowerPoint: AI Presentations',
        slug: 'death-of-powerpoint',
        content: 'AI presentation tools that design themselves...',
        excerpt: 'Next-gen presentation tools',
        category_id: categoryMap['professionals'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'
      },
      {
        title: 'AI Price Optimization: Maximum Profits',
        slug: 'ai-price-optimization',
        content: 'Dynamic pricing that responds to demand in real-time...',
        excerpt: 'Smart pricing strategies',
        category_id: categoryMap['business-owners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 4,
        featured_image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07'
      },
      {
        title: 'Social Media on Autopilot: AI Management',
        slug: 'social-media-autopilot',
        content: 'Manage 10 platforms with one AI tool...',
        excerpt: 'Social media automation',
        category_id: categoryMap['business-owners'],
        author_id: defaultAuthorId,
        status: 'published',
        is_featured: false,
        published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        reading_time: 3,
        featured_image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113'
      }
    ];

    // Insert posts in batches
    const batchSize = 5;
    for (let i = 0; i < blogPosts.length; i += batchSize) {
      const batch = blogPosts.slice(i, i + batchSize);

      for (const post of batch) {
        // Check if post already exists
        const { data: existing } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('slug', post.slug)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('blog_posts')
            .insert(post);

          if (error) {
            console.error(`Error inserting post "${post.title}":`, error);
          } else {
            console.log(`✓ Inserted: ${post.title}`);
          }
        } else {
          console.log(`⚠ Skipped (already exists): ${post.title}`);
        }
      }
    }

    // Update post counts
    const { error: countError } = await supabase.rpc('update_category_post_counts');
    if (countError) {
      console.log('Note: Could not update post counts (function may not exist)');
    }

    console.log('\n✅ Blog post insertion complete!');
    console.log(`Total posts processed: ${blogPosts.length}`);

  } catch (error) {
    console.error('Error during insertion:', error);
  }
}

// Run the insertion
insertBlogPosts();