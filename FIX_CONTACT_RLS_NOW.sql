-- IMPORTANT: Run this entire script in your Supabase SQL Editor
-- This will fix the RLS policy issue for contact_messages table

-- Step 1: Drop ALL existing policies on contact_messages
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow public to insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow anon to insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;

-- Step 2: Temporarily disable RLS to test
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS with proper policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a single, simple INSERT policy that definitely works
CREATE POLICY "Enable insert for all users"
ON public.contact_messages
FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);

-- Step 5: Re-create admin policies
CREATE POLICY "Enable read for admins"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
  OR false  -- This ensures the policy always evaluates
);

CREATE POLICY "Enable update for admins"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin'));

-- Step 6: Grant necessary permissions to anon role
GRANT INSERT ON public.contact_messages TO anon;
GRANT USAGE ON SEQUENCE contact_messages_id_seq TO anon; -- if there's a sequence

-- Step 7: Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'contact_messages';

-- Step 8: Test insert (this should work now)
-- INSERT INTO public.contact_messages (name, email, audience, message)
-- VALUES ('Test User', 'test@example.com', 'general', 'Test message after RLS fix');

-- If the test insert works, delete it:
-- DELETE FROM public.contact_messages WHERE email = 'test@example.com' AND name = 'Test User';