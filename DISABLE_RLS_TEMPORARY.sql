-- TEMPORARY SOLUTION: Disable RLS completely to test if form works
-- WARNING: This removes all security on the table - use only for testing!

-- Step 1: Disable RLS entirely on the contact_messages table
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant full permissions to everyone
GRANT ALL ON public.contact_messages TO anon;
GRANT ALL ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO public;

-- Step 3: Test insert
INSERT INTO public.contact_messages (name, email, audience, message, subject)
VALUES ('RLS Disabled Test', 'test-no-rls@example.com', 'general', 'Testing with RLS disabled', 'Test');

-- Step 4: Verify it worked
SELECT id, name, email, created_at
FROM public.contact_messages
WHERE email = 'test-no-rls@example.com'
ORDER BY created_at DESC;

-- Step 5: Check RLS status
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'contact_messages';

-- If RLS is disabled, the form WILL work.
-- After testing, you can re-enable RLS with proper policies later.