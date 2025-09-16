# Blog Post Insertion Instructions

I've created a blog post comparing OpenAI Codex and Claude Code. Since there are no users in the database yet, you'll need to insert it manually. Here are the steps:

## Method 1: Browser Console (Recommended)

1. **Open your application**: Go to http://localhost:8081/ in your browser

2. **Create an account or log in**:
   - Click on "Sign In" or "Register"
   - Create a new account with your email
   - Verify your email if required

3. **Open the browser console**:
   - Press F12 or right-click and select "Inspect"
   - Go to the "Console" tab

4. **Insert the blog post**:
   - Copy ALL the contents from: `scripts/browser-insert-blog.js`
   - Paste it into the console
   - Press Enter

5. **Verify the post**:
   - The console will show success messages
   - Navigate to `/blog/openai-codex-vs-claude-code-developers-guide`
   - Or check the blog listing page

## Method 2: Direct Database Insertion

If you have Supabase Studio access:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the SQL from `scripts/direct-insert-blog.sql` (if needed, I can create this)

## Blog Post Details

- **Title**: OpenAI Codex vs Claude Code: A Developer's Guide to Choosing Your AI Pair Programmer
- **Slug**: openai-codex-vs-claude-code-developers-guide
- **Category**: AI Coding
- **Tags**: AI, Claude Code, OpenAI Codex, Development Tools, Code Assistants
- **Status**: Published
- **Featured**: Yes

## Deployment to Vercel

Once the blog post is inserted and verified locally:

```bash
# Deploy to production
VERCEL_FORCE_NO_BUILD_CACHE=1 npx vercel deploy --prod --token ogferIl3xcqkP9yIUXzMezgH

# The blog will be live at:
# https://aiborg-ai-web.vercel.app/blog/openai-codex-vs-claude-code-developers-guide
```

## Files Created

- `scripts/browser-insert-blog.js` - Browser console script
- `scripts/insert-blog-post.ts` - Node.js script (requires env vars)
- `scripts/insert-blog-direct.ts` - Direct insertion script

The blog post content is a comprehensive 500-word comparison covering:
- Architecture differences (cloud vs local)
- Performance benchmarks
- Pricing comparison
- Use case recommendations
- Latest 2025 updates