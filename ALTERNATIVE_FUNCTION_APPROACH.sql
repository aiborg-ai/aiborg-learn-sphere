-- ALTERNATIVE APPROACH: Using a Security Definer Function
-- This bypasses RLS for inserts while keeping the table secure

-- Step 1: Create a function that inserts messages (bypasses RLS)
CREATE OR REPLACE FUNCTION public.insert_contact_message(
    p_name TEXT,
    p_email TEXT,
    p_subject TEXT,
    p_audience TEXT,
    p_message TEXT
)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function owner (bypasses RLS)
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.contact_messages (name, email, subject, audience, message)
    VALUES (p_name, p_email, p_subject, p_audience, p_message)
    RETURNING contact_messages.id, contact_messages.created_at;
END;
$$;

-- Step 2: Grant execute permission to anon and public
GRANT EXECUTE ON FUNCTION public.insert_contact_message TO anon;
GRANT EXECUTE ON FUNCTION public.insert_contact_message TO public;
GRANT EXECUTE ON FUNCTION public.insert_contact_message TO authenticated;

-- Step 3: Keep RLS enabled with strict policies (no public insert)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop any insert policies for anon (not needed with function approach)
DROP POLICY IF EXISTS "anyone_can_insert" ON public.contact_messages;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.contact_messages;

-- Only admins can directly access the table
CREATE POLICY "admins_only_all_operations"
ON public.contact_messages
FOR ALL
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

-- Step 4: Test the function
SELECT * FROM public.insert_contact_message(
    'Function Test',
    'function-test@example.com',
    'Testing Function Approach',
    'general',
    'This tests the security definer function approach'
);

-- Step 5: Verify the message was inserted
SELECT id, name, email, created_at
FROM public.contact_messages
WHERE email = 'function-test@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- Step 6: Clean up test data (requires admin privileges)
-- DELETE FROM public.contact_messages WHERE email = 'function-test@example.com';

-- NOTE: With this approach, you need to update ContactSection.tsx to use:
-- const { data, error } = await supabase.rpc('insert_contact_message', {
--     p_name: formData.name,
--     p_email: formData.email,
--     p_subject: formData.subject,
--     p_audience: formData.audience,
--     p_message: formData.message
-- });