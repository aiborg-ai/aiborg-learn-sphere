-- DIAGNOSTIC SCRIPT: Find out why RLS is still blocking inserts

-- 1. Check current RLS status
SELECT
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'contact_messages';

-- 2. List ALL current policies
SELECT
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'contact_messages'
ORDER BY policyname;

-- 3. Check permissions for anon role
SELECT
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'contact_messages'
AND grantee IN ('anon', 'public', 'authenticated')
ORDER BY grantee, privilege_type;

-- 4. Check if anon role exists and is enabled
SELECT
    rolname,
    rolcanlogin,
    rolreplication,
    rolbypassrls
FROM pg_roles
WHERE rolname = 'anon';

-- 5. Test what happens with a direct SQL insert as anon
SET ROLE anon;
-- Try to insert
INSERT INTO public.contact_messages (name, email, audience, message, subject)
VALUES ('Direct SQL Test', 'sql-test@example.com', 'general', 'Testing direct SQL insert', 'SQL Test');
-- Reset role
RESET ROLE;

-- 6. Check if there's a DEFAULT policy that might be interfering
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'contact_messages'
AND permissive = 'RESTRICTIVE';

-- 7. The nuclear option - completely recreate the policy
-- First, disable RLS temporarily
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "anyone_can_insert" ON public.contact_messages;
DROP POLICY IF EXISTS "admins_can_select" ON public.contact_messages;
DROP POLICY IF EXISTS "admins_can_update" ON public.contact_messages;
DROP POLICY IF EXISTS "admins_can_delete" ON public.contact_messages;

-- Re-enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create a PERMISSIVE policy specifically for anon
CREATE POLICY "anon_insert_only"
ON public.contact_messages
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Also create one for public just in case
CREATE POLICY "public_insert_only"
ON public.contact_messages
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

-- Grant explicit permissions
GRANT INSERT ON public.contact_messages TO anon;
GRANT INSERT ON public.contact_messages TO public;
GRANT SELECT ON public.contact_messages TO anon; -- For RETURNING clause

-- 8. Final test
INSERT INTO public.contact_messages (name, email, audience, message, subject)
VALUES ('Final Test', 'final-test@example.com', 'general', 'This should work now', 'Final');

-- Check if it worked
SELECT id, name, email, created_at
FROM public.contact_messages
WHERE email = 'final-test@example.com';