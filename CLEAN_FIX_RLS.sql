-- Run this to clean up and fix the RLS policies

-- Step 1: Drop the existing policy that's causing the error
DROP POLICY IF EXISTS "Enable insert for all users" ON public.contact_messages;

-- Step 2: Drop any other policies that might exist
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow public to insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow anon to insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Enable read for admins" ON public.contact_messages;
DROP POLICY IF EXISTS "Enable update for admins" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;

-- Step 3: Create fresh INSERT policy
CREATE POLICY "Enable insert for all users"
ON public.contact_messages
FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);

-- Step 4: Ensure permissions are granted
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT ON public.contact_messages TO anon;

-- Step 5: Verify current policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'contact_messages'
ORDER BY policyname;

-- Step 6: Test with a simple insert
INSERT INTO public.contact_messages (name, email, audience, message, subject)
VALUES ('RLS Test', 'rls-test@example.com', 'general', 'Testing after RLS fix', 'RLS Test');

-- Step 7: Check if the test worked
SELECT id, name, email, created_at
FROM public.contact_messages
WHERE email = 'rls-test@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- Step 8: Clean up test data
DELETE FROM public.contact_messages
WHERE email = 'rls-test@example.com' AND name = 'RLS Test';