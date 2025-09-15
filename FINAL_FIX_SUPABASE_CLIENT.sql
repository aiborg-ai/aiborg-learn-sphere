-- FINAL FIX: Supabase JS Client Specific Solution
-- The issue is that Supabase JS client uses the 'anon' role differently than direct SQL

-- Step 1: Drop ALL existing policies (clean slate)
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

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Step 3: Create a SINGLE universal INSERT policy
-- This is the key - one policy that covers all cases
CREATE POLICY "universal_insert_policy"
ON public.contact_messages
AS PERMISSIVE
FOR INSERT
TO public  -- This applies to ALL roles including anon
WITH CHECK (true);

-- Step 4: Admin policies for read/update/delete
CREATE POLICY "admin_select_policy"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "admin_update_policy"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
)
WITH CHECK (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "admin_delete_policy"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

-- Step 5: Grant ALL necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.contact_messages TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Step 6: Alternative - If above doesn't work, create RPC function
CREATE OR REPLACE FUNCTION public.insert_contact_message_simple(
    p_name TEXT,
    p_email TEXT,
    p_subject TEXT,
    p_audience TEXT,
    p_message TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id UUID;
    created_time TIMESTAMPTZ;
BEGIN
    INSERT INTO public.contact_messages (name, email, subject, audience, message)
    VALUES (p_name, p_email, p_subject, p_audience, p_message)
    RETURNING id, created_at INTO new_id, created_time;

    RETURN json_build_object(
        'id', new_id,
        'created_at', created_time,
        'success', true
    );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.insert_contact_message_simple TO anon;
GRANT EXECUTE ON FUNCTION public.insert_contact_message_simple TO public;

-- Step 7: Test both approaches
-- Test direct insert (should work now)
INSERT INTO public.contact_messages (name, email, audience, message, subject)
VALUES ('Policy Test', 'policy-test@example.com', 'general', 'Testing universal policy', 'Policy Test');

-- Test function approach
SELECT insert_contact_message_simple(
    'Function Test',
    'function-test@example.com',
    'Function Test',
    'general',
    'Testing function approach'
);

-- Step 8: Verify policies
SELECT
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies
WHERE tablename = 'contact_messages'
ORDER BY policyname;

-- Step 9: Check recent inserts
SELECT id, name, email, created_at
FROM public.contact_messages
ORDER BY created_at DESC
LIMIT 5;