-- Fix the profiles table issue and insert blog post
-- The error shows that the profiles table or foreign key is missing

-- STEP 1: Check if profiles table exists
SELECT 'Checking profiles table...' as step;
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
) as profiles_table_exists;

-- STEP 2: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- STEP 3: Create profile for existing users if not exists
INSERT INTO profiles (user_id, email, display_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- STEP 4: Now insert the blog post (simplified without category first)
DO $$
DECLARE
    user_id_var UUID;
    post_id_var UUID;
BEGIN
    -- Get first user
    SELECT id INTO user_id_var FROM auth.users LIMIT 1;

    IF user_id_var IS NULL THEN
        RAISE NOTICE 'No users found. Creating a default user...';
        -- You'll need to create a user through the app
        RAISE EXCEPTION 'Please create a user account first at http://localhost:8081/';
    END IF;

    -- Delete existing post if it exists
    DELETE FROM blog_post_tags
    WHERE post_id IN (SELECT id FROM blog_posts WHERE slug = 'openai-codex-vs-claude-code-developers-guide');

    DELETE FROM blog_posts
    WHERE slug = 'openai-codex-vs-claude-code-developers-guide';

    -- Insert the blog post
    INSERT INTO blog_posts (
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
        is_featured,
        allow_comments
    ) VALUES (
        'openai-codex-vs-claude-code-developers-guide',
        'OpenAI Codex vs Claude Code: A Developer''s Guide to Choosing Your AI Pair Programmer',
        'Torn between OpenAI Codex and Claude Code? This comprehensive comparison breaks down performance, pricing, and use cases to help you choose the right AI coding assistant for your workflow.',
        E'# OpenAI Codex vs Claude Code: A Developer''s Guide to Choosing Your AI Pair Programmer\n\nIf you''ve been coding with Claude Code, you''ve experienced the power of having an AI assistant that understands your entire codebase and can make complex, coordinated changes across multiple files. But with OpenAI''s recent launch of Codex, you might be wondering: should I switch? Let''s dive into what makes each tool unique and when you might want to choose one over the other.\n\n## The Architecture Divide: Cloud vs Local\n\nThe fundamental difference between these tools lies in where they run. **Claude Code operates locally on your machine**, giving you complete control over your development environment. It breaks down complex tasks into manageable chunks, maintains a todo list to track progress, and can recover gracefully from errors—all while keeping your code on your hardware.\n\n**OpenAI Codex takes a cloud-native approach**, spinning up isolated containers for each task. This means you can delegate multiple tasks simultaneously, each running in its own secure sandbox. While this offers powerful parallelization, it also means your code needs to be accessible via GitHub repositories.\n\n## Performance: The Numbers Don''t Lie\n\nWhen it comes to accuracy on complex software engineering tasks, **Claude Code edges ahead with 72.7% accuracy on SWE-bench Verified, compared to Codex''s 69.1%**. But raw accuracy isn''t everything. Codex, powered by a version of OpenAI''s o3 model optimized for coding, excels at precision and analytical depth.\n\nClaude Code, leveraging Claude 3.7 Sonnet with hybrid reasoning capabilities, shines when you need extended thinking for complex architectural decisions. It can operate autonomously for up to seven hours (with Opus 4), making it ideal for large refactoring projects.\n\n## The Price of Progress\n\nCost considerations might influence your decision. **Claude Code''s Pro plan runs about $20/month** for light usage, though power users report daily costs of $50-100 for sustained heavy usage. **Codex offers competitive token pricing** ($1.50/1M input, $6/1M output) with prompt caching discounts, and even includes a free tier with 2,000 monthly completions.\n\n## When to Choose What\n\n**Choose OpenAI Codex if:**\n- You prioritize cloud development and team collaboration\n- Security through isolated execution is paramount\n- You need to run multiple independent tasks in parallel\n- Your workflow revolves around GitHub repositories\n\n**Stick with Claude Code if:**\n- You prefer local development with full control\n- You work with sensitive code that can''t leave your machine\n- You need deep reasoning for complex architectural decisions\n- You value the ability to guide and interact with the AI through your workflow\n\n## The Verdict\n\nBoth tools represent the cutting edge of AI-assisted development, and many professional teams are adopting both for different workflows. Use Claude Code for complex refactoring and architecture work where deep understanding matters. Deploy Codex for routine tasks, rapid prototyping, and when you need multiple tasks handled simultaneously.\n\nThe future isn''t about choosing one tool—it''s about knowing when to use each one to maximize your productivity. As we move through 2025, both tools continue to evolve rapidly, making the choice less about limitations and more about preferences.\n\n**Ready to experiment?** Try using both tools for a week, assigning different types of tasks to each. You''ll quickly discover which tool fits naturally into different parts of your workflow.',
        user_id_var,
        'published',
        NOW(),
        'OpenAI Codex vs Claude Code: Complete Comparison Guide 2025',
        'Compare OpenAI Codex and Claude Code. Performance benchmarks, pricing, architecture differences, and use cases to help developers choose the right AI coding assistant.',
        3,
        true,
        true
    ) RETURNING id INTO post_id_var;

    RAISE NOTICE 'Blog post inserted successfully with ID: %', post_id_var;

END $$;

-- STEP 5: Verify the insertion
SELECT
    bp.id,
    bp.title,
    bp.slug,
    bp.status,
    p.display_name as author_name,
    '✅ Blog post successfully inserted and visible to all users' as status_message
FROM blog_posts bp
LEFT JOIN profiles p ON p.user_id = bp.author_id
WHERE bp.slug = 'openai-codex-vs-claude-code-developers-guide';