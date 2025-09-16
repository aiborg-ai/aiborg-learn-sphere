import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the project credentials
const supabaseUrl = "https://afrulkxxzcmngbrdfuzj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8";
const supabase = createClient(supabaseUrl, supabaseKey);

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
    // First, check if we need to create a category for AI/Tech
    const { data: existingCategories } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('slug', 'ai-coding');

    let categoryId = null;

    if (!existingCategories || existingCategories.length === 0) {
      // Create the AI Coding category
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
        console.error('Error creating category:', categoryError);
      } else {
        categoryId = newCategory.id;
        console.log('Created category:', newCategory);
      }
    } else {
      categoryId = existingCategories[0].id;
      console.log('Using existing category:', existingCategories[0]);
    }

    // Get the authenticated user (you need to be logged in as admin)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Authentication required. Please ensure you are logged in as an admin user.');
      console.log('You may need to run this script from the browser console while logged in, or provide auth credentials.');
      return;
    }

    // Insert the blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...blogPost,
        author_id: user.id,
        category_id: categoryId
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting blog post:', error);
    } else {
      console.log('Successfully inserted blog post:');
      console.log('- ID:', data.id);
      console.log('- Slug:', data.slug);
      console.log('- Title:', data.title);
      console.log('- Status:', data.status);
      console.log('- URL: /blog/' + data.slug);
    }

    // Optionally add some tags
    const tags = ['AI', 'Claude Code', 'OpenAI Codex', 'Development Tools', 'Code Assistants'];

    for (const tagName of tags) {
      const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');

      // Insert or get tag
      const { data: tag } = await supabase
        .from('blog_tags')
        .insert({
          slug: tagSlug,
          name: tagName
        })
        .select()
        .single()
        .then(result => {
          if (result.error) {
            // Tag might already exist, try to fetch it
            return supabase
              .from('blog_tags')
              .select()
              .eq('slug', tagSlug)
              .single();
          }
          return result;
        });

      if (tag && data) {
        // Link tag to post
        await supabase
          .from('blog_post_tags')
          .insert({
            post_id: data.id,
            tag_id: tag.id
          });
      }
    }

    console.log('Blog post insertion complete!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the insertion
insertBlogPost();