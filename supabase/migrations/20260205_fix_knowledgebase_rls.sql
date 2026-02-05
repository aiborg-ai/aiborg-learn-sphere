-- Fix RLS policies for knowledgebase_entries
-- The original policy was querying auth.users which anon role can't access

-- Drop problematic policies
DROP POLICY IF EXISTS "knowledgebase_admin_all" ON knowledgebase_entries;
DROP POLICY IF EXISTS "knowledgebase_public_read" ON knowledgebase_entries;
DROP POLICY IF EXISTS "public_read_published" ON knowledgebase_entries;
DROP POLICY IF EXISTS "admin_full_access" ON knowledgebase_entries;

-- Ensure RLS is enabled
ALTER TABLE knowledgebase_entries ENABLE ROW LEVEL SECURITY;

-- Create simple public read policy (no auth.users query needed)
-- This allows anyone (anon or authenticated) to read published entries
CREATE POLICY "public_read_published"
ON knowledgebase_entries
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Create admin policy that only applies to authenticated users
-- Uses auth.jwt() instead of querying auth.users table directly
CREATE POLICY "admin_full_access"
ON knowledgebase_entries
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('hirendra.vikram@aiborg.ai', 'demo-admin@aiborg.ai')
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('hirendra.vikram@aiborg.ai', 'demo-admin@aiborg.ai')
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Grant necessary permissions
GRANT SELECT ON knowledgebase_entries TO anon;
GRANT SELECT ON knowledgebase_entries TO authenticated;
GRANT ALL ON knowledgebase_entries TO authenticated;
