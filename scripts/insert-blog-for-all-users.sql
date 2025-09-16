-- SQL Script to insert blog post visible to ALL REGISTERED USERS
-- Note: With current RLS policies, published posts are visible to everyone (even anonymous)
-- This script ensures the blog post is properly published and visible

-- Step 1: Get ANY user ID to use as author (doesn't affect who can view)
-- Run this query first:
SELECT id, email FROM auth.users LIMIT 1;
-- Copy the ID and replace 'YOUR_USER_ID_HERE' below

-- Step 2: Create category if it doesn't exist
INSERT INTO blog_categories (slug, name, description, color, icon, is_active, sort_order)
VALUES (
    'ai-coding',
    'AI Coding',
    'Articles about AI-powered coding assistants and development tools',
    '#6366F1',
    '🤖',
    true,
    1
)
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Insert the blog post (WILL BE VISIBLE TO ALL REGISTERED USERS)
INSERT INTO blog_posts (
    slug,
    title,
    excerpt,
    content,
    author_id,
    category_id,
    status,           -- ✅ 'published' = visible to users per RLS policy
    published_at,     -- ✅ NOW() = immediately visible
    meta_title,
    meta_description,
    reading_time,
    view_count,
    is_featured,
    allow_comments
) VALUES (
    'openai-codex-vs-claude-code-developers-guide',
    'OpenAI Codex vs Claude Code: A Developer''s Guide to Choosing Your AI Pair Programmer',
    'Torn between OpenAI Codex and Claude Code? This comprehensive comparison breaks down performance, pricing, and use cases to help you choose the right AI coding assistant for your workflow.',
    E'# OpenAI Codex vs Claude Code: A Developer''s Guide to Choosing Your AI Pair Programmer

If you''ve been coding with Claude Code, you''ve experienced the power of having an AI assistant that understands your entire codebase and can make complex, coordinated changes across multiple files. But with OpenAI''s recent launch of Codex, you might be wondering: should I switch? Let''s dive into what makes each tool unique and when you might want to choose one over the other.

## The Architecture Divide: Cloud vs Local

The fundamental difference between these tools lies in where they run. **Claude Code operates locally on your machine**, giving you complete control over your development environment. It breaks down complex tasks into manageable chunks, maintains a todo list to track progress, and can recover gracefully from errors—all while keeping your code on your hardware.

**OpenAI Codex takes a cloud-native approach**, spinning up isolated containers for each task. This means you can delegate multiple tasks simultaneously, each running in its own secure sandbox. While this offers powerful parallelization, it also means your code needs to be accessible via GitHub repositories.

## Performance: The Numbers Don''t Lie

When it comes to accuracy on complex software engineering tasks, **Claude Code edges ahead with 72.7% accuracy on SWE-bench Verified, compared to Codex''s 69.1%**. But raw accuracy isn''t everything. Codex, powered by a version of OpenAI''s o3 model optimized for coding, excels at precision and analytical depth. It''s been trained using reinforcement learning on real-world coding tasks, generating code that mirrors human style and PR preferences.

Claude Code, leveraging Claude 3.7 Sonnet with hybrid reasoning capabilities, shines when you need extended thinking for complex architectural decisions. It can operate autonomously for up to seven hours (with Opus 4), making it ideal for large refactoring projects or system-wide changes.

## The Price of Progress

Cost considerations might influence your decision. **Claude Code''s Pro plan runs about $20/month** for light usage, though power users report daily costs of $50-100 for sustained heavy usage. **Codex offers competitive token pricing** ($1.50/1M input, $6/1M output) with prompt caching discounts, and even includes a free tier with 2,000 monthly completions.

## When to Choose What

**Choose OpenAI Codex if:**
- You prioritize cloud development and team collaboration
- Security through isolated execution is paramount
- You need to run multiple independent tasks in parallel
- Your workflow revolves around GitHub repositories

**Stick with Claude Code if:**
- You prefer local development with full control
- You work with sensitive code that can''t leave your machine
- You need deep reasoning for complex architectural decisions
- You value the ability to guide and interact with the AI through your workflow

## The Verdict

Both tools represent the cutting edge of AI-assisted development, and many professional teams are adopting both for different workflows. Use Claude Code for complex refactoring and architecture work where deep understanding matters. Deploy Codex for routine tasks, rapid prototyping, and when you need multiple tasks handled simultaneously.

The future isn''t about choosing one tool—it''s about knowing when to use each one to maximize your productivity. As we move through 2025, both tools continue to evolve rapidly, with Anthropic and OpenAI pushing updates that blur the lines between local and cloud, making the choice less about limitations and more about preferences.

**Ready to experiment?** Try using both tools for a week, assigning different types of tasks to each. You''ll quickly discover which tool fits naturally into different parts of your workflow, and you might just find that the best setup is having both in your toolkit.',
    'YOUR_USER_ID_HERE',  -- ⚠️ REPLACE with any user ID from Step 1
    (SELECT id FROM blog_categories WHERE slug = 'ai-coding' LIMIT 1),
    'published',      -- ✅ Makes it visible
    NOW(),           -- ✅ Published immediately
    'OpenAI Codex vs Claude Code: Complete Comparison Guide 2025',
    'Compare OpenAI Codex and Claude Code. Performance benchmarks, pricing, architecture differences, and use cases to help developers choose the right AI coding assistant.',
    3,
    0,
    true,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    is_featured = EXCLUDED.is_featured,
    updated_at = NOW();

-- Step 4: Create and link tags
INSERT INTO blog_tags (slug, name) VALUES
    ('ai', 'AI'),
    ('claude-code', 'Claude Code'),
    ('openai-codex', 'OpenAI Codex'),
    ('development-tools', 'Development Tools'),
    ('code-assistants', 'Code Assistants')
ON CONFLICT (slug) DO NOTHING;

-- Link tags to the blog post
WITH post AS (
    SELECT id FROM blog_posts WHERE slug = 'openai-codex-vs-claude-code-developers-guide'
),
tags AS (
    SELECT id FROM blog_tags WHERE slug IN ('ai', 'claude-code', 'openai-codex', 'development-tools', 'code-assistants')
)
INSERT INTO blog_post_tags (post_id, tag_id)
SELECT post.id, tags.id
FROM post CROSS JOIN tags
ON CONFLICT DO NOTHING;

-- Step 5: VERIFY the blog post visibility
SELECT
    bp.title,
    bp.slug,
    bp.status,
    bp.published_at,
    au.email as author_email,
    CASE
        WHEN bp.status = 'published' AND bp.published_at <= NOW()
        THEN '✅ VISIBLE to all registered users (and anonymous visitors per RLS policy)'
        WHEN bp.status = 'draft'
        THEN '❌ Only visible to author and admins'
        ELSE '❌ Not visible'
    END as visibility_status,
    '📝 RLS Policy: "Public can view published posts" allows anyone to see published posts' as policy_note
FROM blog_posts bp
LEFT JOIN auth.users au ON bp.author_id = au.id
WHERE bp.slug = 'openai-codex-vs-claude-code-developers-guide';

-- IMPORTANT NOTE ABOUT VISIBILITY:
-- The current RLS policy "Public can view published posts" (line 37-39 of blog_rls_policies.sql)
-- allows ANYONE (including non-logged-in users) to view published blog posts.
--
-- If you want to restrict to ONLY registered/authenticated users, you would need to modify
-- the RLS policy from:
--   USING (status = 'published' AND published_at <= NOW())
-- To:
--   USING (auth.uid() IS NOT NULL AND status = 'published' AND published_at <= NOW())
--
-- But with the CURRENT policies, this blog post WILL be visible to:
-- ✅ All registered users (including hirendra@gmail.com)
-- ✅ All other registered users
-- ✅ Even anonymous/non-logged-in visitors