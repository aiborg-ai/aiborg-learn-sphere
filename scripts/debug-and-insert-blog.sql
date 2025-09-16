-- Debug and Insert Blog Post Script
-- This script includes debugging steps to identify and fix issues

-- STEP 1: Check if auth.users table has any users
SELECT 'Step 1: Checking for users...' as step;
SELECT id, email, created_at
FROM auth.users
LIMIT 5;

-- If no users exist, you need to create an account first at http://localhost:8081/

-- STEP 2: Check if blog tables exist
SELECT 'Step 2: Checking if blog tables exist...' as step;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'blog_%'
ORDER BY table_name;

-- STEP 3: Check RLS policies
SELECT 'Step 3: Checking RLS policies...' as step;
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename LIKE 'blog_%'
AND tablename = 'blog_posts'
LIMIT 5;

-- STEP 4: Try to insert without category first (simpler)
SELECT 'Step 4: Attempting simple insert...' as step;

-- Get the first available user ID
DO $$
DECLARE
    user_id_var UUID;
    post_id_var UUID;
BEGIN
    -- Get first user
    SELECT id INTO user_id_var FROM auth.users LIMIT 1;

    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'No users found. Please create a user account first.';
    END IF;

    -- Delete existing post if it exists (to avoid conflicts)
    DELETE FROM blog_post_tags
    WHERE post_id IN (SELECT id FROM blog_posts WHERE slug = 'openai-codex-vs-claude-code-developers-guide');

    DELETE FROM blog_posts
    WHERE slug = 'openai-codex-vs-claude-code-developers-guide';

    -- Insert the blog post
    INSERT INTO blog_posts (
        id,
        slug,
        title,
        excerpt,
        content,
        author_id,
        status,
        published_at,
        meta_title,
        meta_description,
        reading_time,
        view_count,
        is_featured,
        allow_comments,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'openai-codex-vs-claude-code-developers-guide',
        'OpenAI Codex vs Claude Code: A Developer''s Guide to Choosing Your AI Pair Programmer',
        'Torn between OpenAI Codex and Claude Code? This comprehensive comparison breaks down performance, pricing, and use cases to help you choose the right AI coding assistant for your workflow.',
        E'# OpenAI Codex vs Claude Code: A Developer''s Guide to Choosing Your AI Pair Programmer\n\nIf you''ve been coding with Claude Code, you''ve experienced the power of having an AI assistant that understands your entire codebase and can make complex, coordinated changes across multiple files. But with OpenAI''s recent launch of Codex, you might be wondering: should I switch? Let''s dive into what makes each tool unique and when you might want to choose one over the other.\n\n## The Architecture Divide: Cloud vs Local\n\nThe fundamental difference between these tools lies in where they run. **Claude Code operates locally on your machine**, giving you complete control over your development environment. It breaks down complex tasks into manageable chunks, maintains a todo list to track progress, and can recover gracefully from errors—all while keeping your code on your hardware.\n\n**OpenAI Codex takes a cloud-native approach**, spinning up isolated containers for each task. This means you can delegate multiple tasks simultaneously, each running in its own secure sandbox. While this offers powerful parallelization, it also means your code needs to be accessible via GitHub repositories.\n\n## Performance: The Numbers Don''t Lie\n\nWhen it comes to accuracy on complex software engineering tasks, **Claude Code edges ahead with 72.7% accuracy on SWE-bench Verified, compared to Codex''s 69.1%**. But raw accuracy isn''t everything. Codex, powered by a version of OpenAI''s o3 model optimized for coding, excels at precision and analytical depth. It''s been trained using reinforcement learning on real-world coding tasks, generating code that mirrors human style and PR preferences.\n\nClaude Code, leveraging Claude 3.7 Sonnet with hybrid reasoning capabilities, shines when you need extended thinking for complex architectural decisions. It can operate autonomously for up to seven hours (with Opus 4), making it ideal for large refactoring projects or system-wide changes.\n\n## The Price of Progress\n\nCost considerations might influence your decision. **Claude Code''s Pro plan runs about $20/month** for light usage, though power users report daily costs of $50-100 for sustained heavy usage. **Codex offers competitive token pricing** ($1.50/1M input, $6/1M output) with prompt caching discounts, and even includes a free tier with 2,000 monthly completions.\n\n## When to Choose What\n\n**Choose OpenAI Codex if:**\n- You prioritize cloud development and team collaboration\n- Security through isolated execution is paramount\n- You need to run multiple independent tasks in parallel\n- Your workflow revolves around GitHub repositories\n\n**Stick with Claude Code if:**\n- You prefer local development with full control\n- You work with sensitive code that can''t leave your machine\n- You need deep reasoning for complex architectural decisions\n- You value the ability to guide and interact with the AI through your workflow\n\n## The Verdict\n\nBoth tools represent the cutting edge of AI-assisted development, and many professional teams are adopting both for different workflows. Use Claude Code for complex refactoring and architecture work where deep understanding matters. Deploy Codex for routine tasks, rapid prototyping, and when you need multiple tasks handled simultaneously.\n\nThe future isn''t about choosing one tool—it''s about knowing when to use each one to maximize your productivity. As we move through 2025, both tools continue to evolve rapidly, with Anthropic and OpenAI pushing updates that blur the lines between local and cloud, making the choice less about limitations and more about preferences.\n\n**Ready to experiment?** Try using both tools for a week, assigning different types of tasks to each. You''ll quickly discover which tool fits naturally into different parts of your workflow, and you might just find that the best setup is having both in your toolkit.',
        user_id_var,
        'published',
        NOW(),
        'OpenAI Codex vs Claude Code: Complete Comparison Guide 2025',
        'Compare OpenAI Codex and Claude Code. Performance benchmarks, pricing, architecture differences, and use cases to help developers choose the right AI coding assistant.',
        3,
        0,
        true,
        true,
        NOW(),
        NOW()
    ) RETURNING id INTO post_id_var;

    RAISE NOTICE 'Blog post inserted successfully with ID: %', post_id_var;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE;
END $$;

-- STEP 5: Verify the blog post was inserted
SELECT 'Step 5: Verifying blog post...' as step;
SELECT
    id,
    title,
    slug,
    status,
    published_at,
    author_id,
    CASE
        WHEN status = 'published' AND published_at <= NOW()
        THEN '✅ Blog post is VISIBLE to all users'
        ELSE '❌ Blog post is NOT visible'
    END as visibility
FROM blog_posts
WHERE slug = 'openai-codex-vs-claude-code-developers-guide';

-- STEP 6: Check if it's accessible through the public view
SELECT 'Step 6: Checking public view...' as step;
SELECT COUNT(*) as post_count,
       CASE
           WHEN COUNT(*) > 0 THEN '✅ Blog post found in public view'
           ELSE '❌ Blog post NOT in public view'
       END as status
FROM blog_posts
WHERE slug = 'openai-codex-vs-claude-code-developers-guide'
AND status = 'published'
AND published_at <= NOW();