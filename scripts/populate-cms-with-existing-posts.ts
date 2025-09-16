import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://afrulkxxzcmngbrdfuzj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Full article content for existing posts
const articleContents: Record<string, string> = {
  'ai-sales-rep-247': `Your customers are drowning in leads they can't handle, losing sales while they sleep, and burning out from repetitive qualification calls. Enter the AI sales rep: 24/7 availability, perfect recall, infinite patience, and costs less than coffee. Here's how to build one that actually converts.

## The Math That Makes This Inevitable

Traditional Sales Rep:
- Salary: $50,000-$80,000
- Works 40 hours/week (really 30 productive)
- Handles 50 leads/day maximum
- Converts at 2-5% (when fresh, not tired)
- Takes vacation, gets sick, quits

AI Sales Rep:
- Setup cost: $2,000
- Running cost: $200/month
- Works 168 hours/week
- Handles 1,000+ leads/day
- Converts at 3-7% consistently
- Never stops, never complains

ROI: 2,400% in year one.

## What AI Sales Reps Actually Do

**Level 1: Lead Capture & Qualification**
- Responds to inquiries in <30 seconds
- Asks qualifying questions naturally
- Scores leads based on your criteria
- Routes hot leads to humans immediately
- Nurtures cold leads automatically

**Level 2: Engagement & Education**
- Answers product questions accurately
- Sends relevant case studies
- Books meetings with human reps
- Follows up at optimal times
- Handles objections with tested responses

**Level 3: Transaction Processing**
- Takes orders for standard products
- Processes payments
- Sends contracts
- Manages renewals
- Upsells based on usage patterns`,

  'tiktok-algorithm-addiction': `The TikTok For You Page knows you better than you know yourself. Here's the science behind the addiction that keeps billions scrolling.

## The Data Collection Machine

Every single action on TikTok is data. The AI tracks:
- Videos watched multiple times
- Instant scrolls past content
- Comments typed but deleted
- Shares and saves
- Hesitation time before scrolling
- Profile visits from videos
- Time of day preferences
- Device and network data

TikTok processes billions of these micro-interactions to build a profile more detailed than any personality test.

## Multiple AIs Working Together

It's not just one algorithm - it's an orchestra of AI systems:

**Interest Graph**: Maps connections between content types
**Collaborative Filtering**: Finds users with similar patterns
**Natural Language Processing**: Understands comments and captions
**Computer Vision**: Analyzes what's actually in videos
**Feedback Loop**: Continuously learns and adapts

The algorithm even deliberately shows random videos to test new interests and prevent echo chambers (while still keeping you hooked).

## The Psychology of Addiction

TikTok uses casino psychology:
- **Variable Ratio Reinforcement**: You never know when the next amazing video will appear
- **Instant Gratification**: Short videos provide quick dopamine hits
- **FOMO Generation**: Algorithm creates urgency around trends
- **Social Validation**: Likes and views trigger reward centers

It's literally designed like a slot machine for your brain.`,

  'my-first-ai-friend': `Have you ever wondered how computers can be smart like your best friend? Today, we're going on an amazing adventure to discover how artificial intelligence works - and it's way cooler than you think!

## What Makes a Computer Smart?

Imagine teaching your dog a new trick. You show them what to do, give them treats when they get it right, and after lots of practice, they learn! AI works in a similar way. Computer scientists are like pet trainers, but instead of teaching dogs to sit or fetch, they're teaching computers to recognize pictures, understand words, and even play games.

Think about your favorite video game character. They know when to jump over obstacles, when to collect coins, and when to avoid enemies. That's AI in action! The game developers taught the computer character how to make these decisions, just like you learned how to ride a bike or tie your shoes.

## The Secret Behind AI Learning

Here's something super cool: AI learns from examples, just like you do! Remember when you were learning to read? You looked at lots of books, sounded out words, and gradually got better. AI does the same thing but much faster.

Let's say we want to teach a computer to recognize cats. We show it thousands of cat pictures - fluffy cats, sleepy cats, playful cats, grumpy cats. The AI starts noticing patterns: "Hey, these things called cats usually have pointy ears, whiskers, and cute little noses!" After seeing enough examples, it can spot a cat even in pictures it's never seen before.

## Your AI Friends Are Already Here

Guess what? You probably already have AI friends helping you every day! When you ask Alexa or Siri a question, that's AI listening to your voice and figuring out what you mean. When Netflix suggests a new show you might like, that's AI remembering what you've watched before and finding similar stuff.

Even your favorite photo apps use AI! Those funny filters that give you dog ears or make you look like a cartoon? That's AI recognizing your face and knowing exactly where to put those silly decorations. It's like having an invisible artist who can draw on your pictures instantly!`
};

async function populateCMSWithExistingPosts() {
  try {
    console.log('Starting to populate CMS with existing blog posts...\n');

    // Step 1: Update existing posts with full content
    for (const [slug, content] of Object.entries(articleContents)) {
      console.log(`Updating post: ${slug}`);

      const { data: post, error: fetchError } = await supabase
        .from('blog_posts')
        .select('id, title')
        .eq('slug', slug)
        .single();

      if (fetchError || !post) {
        console.log(`  ⚠️  Post not found: ${slug}`);
        continue;
      }

      // Calculate reading time
      const wordCount = content.trim().split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      // Update with full content and metadata
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          content: content,
          reading_time: readingTime,
          meta_title: post.title.substring(0, 60),
          meta_description: content.substring(0, 160).replace(/\n/g, ' '),
          seo_keywords: extractKeywords(content),
          og_title: post.title,
          og_description: content.substring(0, 160).replace(/\n/g, ' '),
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (updateError) {
        console.log(`  ❌ Error updating: ${updateError.message}`);
      } else {
        console.log(`  ✅ Updated successfully`);
      }
    }

    // Step 2: Ensure all posts have proper metadata
    console.log('\nUpdating metadata for all posts...');

    const { data: allPosts, error: allPostsError } = await supabase
      .from('blog_posts')
      .select('id, title, content, slug, category_id, meta_title, meta_description');

    if (allPostsError) {
      console.error('Error fetching all posts:', allPostsError);
      return;
    }

    for (const post of allPosts || []) {
      // Skip if already has metadata
      if (post.meta_title && post.meta_description) continue;

      const updates: any = {};

      if (!post.meta_title) {
        updates.meta_title = post.title.substring(0, 60);
      }

      if (!post.meta_description && post.content) {
        updates.meta_description = post.content
          .substring(0, 160)
          .replace(/\n/g, ' ')
          .replace(/#+\s/g, '');
      }

      if (post.content && post.content.length > 100) {
        const wordCount = post.content.trim().split(/\s+/).length;
        updates.reading_time = Math.ceil(wordCount / 200);
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('blog_posts')
          .update(updates)
          .eq('id', post.id);

        console.log(`Updated metadata for: ${post.slug}`);
      }
    }

    // Step 3: Create sample media entries for featured images
    console.log('\nCreating media library entries for featured images...');

    const { data: postsWithImages } = await supabase
      .from('blog_posts')
      .select('id, featured_image, title')
      .not('featured_image', 'is', null);

    for (const post of postsWithImages || []) {
      if (!post.featured_image) continue;

      // Check if media entry already exists
      const { data: existingMedia } = await supabase
        .from('blog_media')
        .select('id')
        .eq('file_url', post.featured_image)
        .single();

      if (!existingMedia) {
        const filename = post.featured_image.split('/').pop() || 'image.jpg';

        await supabase
          .from('blog_media')
          .insert({
            filename: filename,
            original_filename: filename,
            file_url: post.featured_image,
            file_type: 'image/jpeg',
            file_size: 500000, // Approximate
            alt_text: post.title,
            post_id: post.id,
            is_featured: true
          });

        console.log(`Added media entry for: ${post.title}`);
      }
    }

    // Step 4: Update category post counts
    console.log('\nUpdating category post counts...');

    const { data: categories } = await supabase
      .from('blog_categories')
      .select('id');

    for (const category of categories || []) {
      const { count } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'published');

      await supabase
        .from('blog_categories')
        .update({ post_count: count || 0 })
        .eq('id', category.id);
    }

    // Step 5: Update tag post counts
    console.log('\nUpdating tag post counts...');

    const { data: tags } = await supabase
      .from('blog_tags')
      .select('id');

    for (const tag of tags || []) {
      const { count } = await supabase
        .from('blog_post_tags')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', tag.id);

      await supabase
        .from('blog_tags')
        .update({ post_count: count || 0 })
        .eq('id', tag.id);
    }

    // Step 6: Generate sample analytics data
    console.log('\nGenerating sample analytics data...');

    const { data: publishedPosts } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('status', 'published');

    const today = new Date();
    for (const post of publishedPosts || []) {
      // Generate data for last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const analyticsData = {
          post_id: post.id,
          date: date.toISOString().split('T')[0],
          views: Math.floor(Math.random() * 500) + 50,
          unique_visitors: Math.floor(Math.random() * 300) + 30,
          avg_time_seconds: Math.floor(Math.random() * 300) + 60,
          bounce_rate: Math.random() * 50 + 25,
          shares: Math.floor(Math.random() * 20),
          comments: Math.floor(Math.random() * 10),
          likes: Math.floor(Math.random() * 50)
        };

        await supabase
          .from('blog_analytics')
          .upsert(analyticsData, { onConflict: 'post_id,date' });
      }
    }

    console.log('\n✅ CMS population complete!');
    console.log('All existing blog posts have been updated with:');
    console.log('- Full content');
    console.log('- SEO metadata');
    console.log('- Media library entries');
    console.log('- Analytics data');
    console.log('- Updated counts');

  } catch (error) {
    console.error('Error populating CMS:', error);
  }
}

function extractKeywords(content: string): string {
  // Simple keyword extraction - get most common meaningful words
  const words = content
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4);

  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
    .join(', ');
}

// Run the population script
populateCMSWithExistingPosts();