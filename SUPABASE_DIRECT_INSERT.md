# Direct Supabase Database Insertion Instructions

## Steps to Insert Blog Post Directly in Supabase

### 1. Open Supabase Dashboard
- Go to your Supabase project: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
- Navigate to **SQL Editor** (in the left sidebar)

### 2. Find Your User ID
First, run this query in the SQL Editor to get your user ID:

```sql
SELECT id, email FROM auth.users WHERE email = 'hirendra@gmail.com';
```

**Copy the `id` value from the result** - you'll need it for the next step.

### 3. Insert the Blog Post
Open the file `scripts/direct-supabase-insert.sql` and:
1. Replace `'YOUR_USER_ID_HERE'` with the actual user ID you copied
2. Copy the entire SQL content
3. Paste it in the Supabase SQL Editor
4. Click "Run" or press Ctrl+Enter

### 4. Verify the Insertion
The script includes a verification query at the end that will show you:
- Blog post details
- Category
- Author email
- Associated tags

### 5. Check in Your App
After successful insertion, the blog post will be available at:
- **Local**: http://localhost:8081/blog/openai-codex-vs-claude-code-developers-guide
- **Supabase Table Viewer**: Check the `blog_posts` table in your Supabase dashboard

### 6. Deploy to Vercel
Once verified, deploy to production:

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere
VERCEL_FORCE_NO_BUILD_CACHE=1 npx vercel deploy --prod --token ogferIl3xcqkP9yIUXzMezgH
```

**Production URL**: https://aiborg-ai-web.vercel.app/blog/openai-codex-vs-claude-code-developers-guide

## Alternative: Use Supabase Table Editor

If you prefer a visual approach:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `blog_posts` table
3. Click "Insert row"
4. Fill in the fields:
   - **slug**: `openai-codex-vs-claude-code-developers-guide`
   - **title**: `OpenAI Codex vs Claude Code: A Developer's Guide to Choosing Your AI Pair Programmer`
   - **excerpt**: (copy from the SQL file)
   - **content**: (copy the markdown content from the SQL file)
   - **author_id**: (your user ID from step 2)
   - **status**: `published`
   - **published_at**: Current timestamp
   - **is_featured**: true
   - **allow_comments**: true
   - **reading_time**: 3

## What the Blog Post Contains

- **500-word comparison** of OpenAI Codex vs Claude Code
- **Performance benchmarks**: 72.7% vs 69.1% accuracy
- **Architecture comparison**: Cloud vs Local
- **Pricing analysis**: $20/month vs token-based pricing
- **Use case recommendations**
- **SEO optimized** with meta tags
- **5 relevant tags**: AI, Claude Code, OpenAI Codex, Development Tools, Code Assistants

## Troubleshooting

If you get an error about foreign key constraints:
- Make sure you're using the correct user ID from `auth.users` table
- Ensure the user exists and is active

If the category doesn't exist:
- The script creates it automatically, but you can also create it manually in the `blog_categories` table

If you can't see the blog post after insertion:
- Check that `status` is set to `published`
- Verify `published_at` is not in the future
- Ensure your user has proper permissions