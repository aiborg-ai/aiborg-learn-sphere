-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;

-- Create a new policy that allows anonymous inserts
CREATE POLICY "Allow public to insert contact messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (true);

-- Also ensure anon role can insert
CREATE POLICY "Allow anon to insert contact messages"
ON public.contact_messages
FOR INSERT
TO anon
WITH CHECK (true);