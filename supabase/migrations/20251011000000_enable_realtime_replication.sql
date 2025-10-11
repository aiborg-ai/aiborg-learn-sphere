-- Enable realtime replication for tables that need WebSocket subscriptions
-- This allows Supabase Realtime to listen for database changes

-- Enable realtime for reviews table
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- Enable realtime for blog comments table
ALTER PUBLICATION supabase_realtime ADD TABLE blog_comments;

-- Enable realtime for other interactive tables
ALTER PUBLICATION supabase_realtime ADD TABLE blog_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE blog_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE blog_bookmarks;

-- Add comments for documentation
COMMENT ON TABLE reviews IS 'Realtime enabled for instant review updates';
COMMENT ON TABLE blog_comments IS 'Realtime enabled for live comment threads';
COMMENT ON TABLE blog_likes IS 'Realtime enabled for instant like counts';
COMMENT ON TABLE blog_shares IS 'Realtime enabled for share tracking';
COMMENT ON TABLE blog_bookmarks IS 'Realtime enabled for bookmark syncing';

-- Create a function to check realtime status
CREATE OR REPLACE FUNCTION check_realtime_enabled(table_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = table_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_realtime_enabled(text) TO authenticated;
