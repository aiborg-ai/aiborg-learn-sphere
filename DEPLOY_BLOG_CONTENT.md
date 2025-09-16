# How to Deploy Blog Content to Production

The blog CMS code has been deployed to Vercel. Now you need to populate the production Supabase database with the blog content.

## Steps to Complete:

### 1. Run Database Migrations on Production Supabase

Go to your Supabase dashboard and run the migration to create CMS tables:
- Navigate to SQL Editor in Supabase Dashboard
- Open and run: `supabase/migrations/20241220_blog_cms_enhancements.sql`

### 2. Populate Blog Content

After migrations are complete, run this script to populate the blog posts with full content:

```bash
# Run the population script against production
npx tsx scripts/populate-cms-with-existing-posts.ts
```

### 3. Alternative: Direct SQL Method

If the script doesn't work, you can use the SQL scripts directly in Supabase SQL Editor:

1. First, run `scripts/UPDATE_EXISTING_POSTS_FULL_CONTENT.sql` to update existing posts with full content
2. Make sure to temporarily disable RLS if needed

### 4. Verify on Production

Visit your production site at https://aiborg-ai-web.vercel.app/blog to verify the content is showing.

## Important Notes:

- The blog content is stored in the database, not in code files
- You need to ensure your production Supabase has the same content as local
- The CMS is now available at `/cms/blog` (admin only)
- Make sure the production environment variables are set correctly

## Production Database Connection

To run scripts against production, you may need to update the Supabase URL and keys in the scripts to point to your production instance instead of local.