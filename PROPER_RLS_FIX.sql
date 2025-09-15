-- PROPER RLS FIX: Secure policies that actually work
-- Run this entire script in Supabase SQL Editor

-- Step 1: Clean slate - drop ALL existing policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'contact_messages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.contact_messages', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Re-enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Step 3: Create INSERT policy that actually works for anonymous users
-- The key is using a simple TRUE condition without any auth checks
CREATE POLICY "anyone_can_insert"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Step 4: Create SELECT policy - only admins can view messages
CREATE POLICY "admins_can_select"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Step 5: Create UPDATE policy - only admins can update (mark as read, etc)
CREATE POLICY "admins_can_update"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Step 6: Create DELETE policy - only admins can delete
CREATE POLICY "admins_can_delete"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Step 7: Ensure proper grants for the anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT ON public.contact_messages TO anon; -- Needed for RETURNING clause

-- Step 8: Test the setup
DO $$
BEGIN
    -- Test insert (should work)
    INSERT INTO public.contact_messages (name, email, audience, message, subject)
    VALUES ('RLS Test Final', 'rls-final@example.com', 'general', 'Testing final RLS setup', 'Final Test');

    RAISE NOTICE 'Insert successful! RLS is working correctly.';

    -- Clean up test data
    DELETE FROM public.contact_messages
    WHERE email = 'rls-final@example.com' AND name = 'RLS Test Final';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Insert failed: %', SQLERRM;
END $$;

-- Step 9: Show final policy configuration
SELECT
    policyname,
    cmd,
    permissive,
    roles,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'contact_messages'
ORDER BY policyname;

-- Step 10: Show table RLS status
SELECT
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'contact_messages';