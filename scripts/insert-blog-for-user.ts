import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = "https://afrulkxxzcmngbrdfuzj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const blogPost = {
  slug: 'openai-codex-vs-claude-code-developers-guide',
  title: 'OpenAI Codex vs Claude Code: A Developer\'s Guide to Choosing Your AI Pair Programmer',
  excerpt: 'Torn between OpenAI Codex and Claude Code? This comprehensive comparison breaks down performance, pricing, and use cases to help you choose the right AI coding assistant for your workflow.',
  content: `# OpenAI Codex vs Claude Code: A Developer's Guide to Choosing Your AI Pair Programmer

If you've been coding with Claude Code, you've experienced the power of having an AI assistant that understands your entire codebase and can make complex, coordinated changes across multiple files. But with OpenAI's recent launch of Codex, you might be wondering: should I switch? Let's dive into what makes each tool unique and when you might want to choose one over the other.

## The Architecture Divide: Cloud vs Local

The fundamental difference between these tools lies in where they run. **Claude Code operates locally on your machine**, giving you complete control over your development environment. It breaks down complex tasks into manageable chunks, maintains a todo list to track progress, and can recover gracefully from errors—all while keeping your code on your hardware.

**OpenAI Codex takes a cloud-native approach**, spinning up isolated containers for each task. This means you can delegate multiple tasks simultaneously, each running in its own secure sandbox. While this offers powerful parallelization, it also means your code needs to be accessible via GitHub repositories.

## Performance: The Numbers Don't Lie

When it comes to accuracy on complex software engineering tasks, **Claude Code edges ahead with 72.7% accuracy on SWE-bench Verified, compared to Codex's 69.1%**. But raw accuracy isn't everything. Codex, powered by a version of OpenAI's o3 model optimized for coding, excels at precision and analytical depth. It's been trained using reinforcement learning on real-world coding tasks, generating code that mirrors human style and PR preferences.

Claude Code, leveraging Claude 3.7 Sonnet with hybrid reasoning capabilities, shines when you need extended thinking for complex architectural decisions. It can operate autonomously for up to seven hours (with Opus 4), making it ideal for large refactoring projects or system-wide changes.

## The Price of Progress

Cost considerations might influence your decision. **Claude Code's Pro plan runs about $20/month** for light usage, though power users report daily costs of $50-100 for sustained heavy usage. **Codex offers competitive token pricing** ($1.50/1M input, $6/1M output) with prompt caching discounts, and even includes a free tier with 2,000 monthly completions.

## When to Choose What

**Choose OpenAI Codex if:**
- You prioritize cloud development and team collaboration
- Security through isolated execution is paramount
- You need to run multiple independent tasks in parallel
- Your workflow revolves around GitHub repositories

**Stick with Claude Code if:**
- You prefer local development with full control
- You work with sensitive code that can't leave your machine
- You need deep reasoning for complex architectural decisions
- You value the ability to guide and interact with the AI through your workflow

## The Verdict

Both tools represent the cutting edge of AI-assisted development, and many professional teams are adopting both for different workflows. Use Claude Code for complex refactoring and architecture work where deep understanding matters. Deploy Codex for routine tasks, rapid prototyping, and when you need multiple tasks handled simultaneously.

The future isn't about choosing one tool—it's about knowing when to use each one to maximize your productivity. As we move through 2025, both tools continue to evolve rapidly, with Anthropic and OpenAI pushing updates that blur the lines between local and cloud, making the choice less about limitations and more about preferences.

**Ready to experiment?** Try using both tools for a week, assigning different types of tasks to each. You'll quickly discover which tool fits naturally into different parts of your workflow, and you might just find that the best setup is having both in your toolkit.`,
  featured_image: null,
  status: 'published' as const,
  published_at: new Date().toISOString(),
  meta_title: 'OpenAI Codex vs Claude Code: Complete Comparison Guide 2025',
  meta_description: 'Compare OpenAI Codex and Claude Code. Performance benchmarks, pricing, architecture differences, and use cases to help developers choose the right AI coding assistant.',
  reading_time: 3,
  view_count: 0,
  is_featured: true,
  allow_comments: true
};

async function insertBlogPost() {
  try {
    console.log('🔍 Looking for user with email: hirendra@gmail.com');

    // First, try to find the user in profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .or('email.eq.hirendra@gmail.com,email.ilike.%hirendra%');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
    }

    if (profiles && profiles.length > 0) {
      console.log('Found profiles:', profiles);
    } else {
      console.log('No profiles found with that email pattern.');
      console.log('Attempting to use any available user...');

      // Get any user from profiles
      const { data: anyProfiles, error: anyError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .limit(1);

      if (anyProfiles && anyProfiles.length > 0) {
        console.log('Using first available user:', anyProfiles[0]);
        profiles.push(anyProfiles[0]);
      } else {
        console.error('No users found in the database at all.');
        console.log('\n📝 Manual insertion required:');
        console.log('1. First, create an account at http://localhost:8081/');
        console.log('2. Log in with your credentials');
        console.log('3. Then run this script again, OR');
        console.log('4. Use the browser console method with scripts/browser-insert-blog.js');
        return;
      }
    }

    const authorId = profiles[0].user_id;
    console.log(`\n✅ Using author: ${profiles[0].display_name || profiles[0].email || 'User'}`);

    // Check if blog post already exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id, slug, title')
      .eq('slug', blogPost.slug)
      .single();

    if (existingPost) {
      console.log('\n⚠️ Blog post already exists:');
      console.log('- Title:', existingPost.title);
      console.log('- URL: http://localhost:8081/blog/' + existingPost.slug);
      console.log('\nUpdating the existing post...');

      // Update the existing post
      const { data: updatedPost, error: updateError } = await supabase
        .from('blog_posts')
        .update({
          title: blogPost.title,
          excerpt: blogPost.excerpt,
          content: blogPost.content,
          status: blogPost.status,
          published_at: blogPost.published_at,
          meta_title: blogPost.meta_title,
          meta_description: blogPost.meta_description,
          reading_time: blogPost.reading_time,
          is_featured: blogPost.is_featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPost.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating blog post:', updateError);
        return;
      }

      console.log('✅ Blog post updated successfully!');
      console.log('🌐 View at: http://localhost:8081/blog/' + updatedPost.slug);
      return;
    }

    // Create or get category
    const { data: existingCategories } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('slug', 'ai-coding');

    let categoryId = null;

    if (!existingCategories || existingCategories.length === 0) {
      console.log('\n📁 Creating AI Coding category...');
      const { data: newCategory, error: categoryError } = await supabase
        .from('blog_categories')
        .insert({
          slug: 'ai-coding',
          name: 'AI Coding',
          description: 'Articles about AI-powered coding assistants and development tools',
          color: '#6366F1',
          icon: '🤖',
          is_active: true,
          sort_order: 1
        })
        .select()
        .single();

      if (categoryError) {
        console.warn('Warning: Could not create category:', categoryError.message);
      } else {
        categoryId = newCategory.id;
        console.log('✅ Created category:', newCategory.name);
      }
    } else {
      categoryId = existingCategories[0].id;
      console.log('✅ Using existing category:', existingCategories[0].name);
    }

    // Insert the blog post
    console.log('\n📝 Inserting blog post...');
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...blogPost,
        author_id: authorId,
        category_id: categoryId
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting blog post:', error);

      if (error.message.includes('violates foreign key constraint')) {
        console.log('\n⚠️ The user ID does not exist in auth.users.');
        console.log('This usually means the profiles table has orphaned records.');
        console.log('\n📝 Please use the browser console method:');
        console.log('1. Log in at http://localhost:8081/');
        console.log('2. Open browser console (F12)');
        console.log('3. Paste and run the contents of scripts/browser-insert-blog.js');
      }
      return;
    }

    console.log('\n✅ Successfully inserted blog post!');
    console.log('📝 Title:', data.title);
    console.log('🔗 Slug:', data.slug);
    console.log('📊 Status:', data.status);
    console.log('👤 Author ID:', data.author_id);
    console.log('🌐 View at: http://localhost:8081/blog/' + data.slug);

    // Add tags
    const tags = ['AI', 'Claude Code', 'OpenAI Codex', 'Development Tools', 'Code Assistants'];
    console.log('\n🏷️ Adding tags...');

    for (const tagName of tags) {
      const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');

      // Try to insert tag
      let { data: tag } = await supabase
        .from('blog_tags')
        .insert({
          slug: tagSlug,
          name: tagName
        })
        .select()
        .single();

      // If tag exists, fetch it
      if (!tag) {
        const { data: existingTag } = await supabase
          .from('blog_tags')
          .select()
          .eq('slug', tagSlug)
          .single();
        tag = existingTag;
      }

      if (tag && data) {
        // Link tag to post
        const { error: linkError } = await supabase
          .from('blog_post_tags')
          .insert({
            post_id: data.id,
            tag_id: tag.id
          });

        if (!linkError) {
          console.log('  ✅ Added tag:', tagName);
        }
      }
    }

    console.log('\n🎉 Blog post insertion complete!');
    console.log('📱 The post is now visible to all registered users including hirendra@gmail.com');
    console.log('🌐 Local URL: http://localhost:8081/blog/' + data.slug);
    console.log('\n📤 To deploy to production, run:');
    console.log('VERCEL_FORCE_NO_BUILD_CACHE=1 npx vercel deploy --prod --token ogferIl3xcqkP9yIUXzMezgH');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the insertion
console.log('🚀 Starting blog post insertion...\n');
insertBlogPost();