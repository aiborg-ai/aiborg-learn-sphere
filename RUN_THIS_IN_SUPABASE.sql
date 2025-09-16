-- IMPORTANT: Run this in your Supabase SQL Editor to fix the increment function error

-- Create a generic increment function for incrementing numeric columns
CREATE OR REPLACE FUNCTION increment(
  table_name text,
  column_name text,
  row_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate inputs to prevent SQL injection
  IF table_name IS NULL OR column_name IS NULL OR row_id IS NULL THEN
    RAISE EXCEPTION 'All parameters must be non-null';
  END IF;

  -- Only allow specific tables to be updated
  IF table_name NOT IN ('blog_posts', 'courses', 'events') THEN
    RAISE EXCEPTION 'Table % is not allowed', table_name;
  END IF;

  -- Only allow specific columns to be incremented
  IF column_name NOT IN ('view_count', 'enrollment_count', 'like_count', 'share_count') THEN
    RAISE EXCEPTION 'Column % is not allowed', column_name;
  END IF;

  -- Execute the increment
  EXECUTE format(
    'UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    table_name,
    column_name,
    column_name
  ) USING row_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment(text, text, uuid) TO anon;

-- Test the function (optional)
-- SELECT increment('blog_posts', 'view_count', (SELECT id FROM blog_posts LIMIT 1));