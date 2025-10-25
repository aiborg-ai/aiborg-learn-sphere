-- ================================================================
-- WORLD-CLASS DISCUSSION FORUM SYSTEM
-- Reddit-style forum with nested threads, voting, moderation
-- Discord-style trust levels, real-time updates
-- ================================================================

-- ================================================================
-- PART 1: TABLES
-- ================================================================

-- Forum Categories (organize discussions by topic)
CREATE TABLE IF NOT EXISTS forum_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text, -- Lucide icon name
  color text DEFAULT '#3b82f6', -- Category color
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  requires_auth boolean DEFAULT false,
  post_count integer DEFAULT 0,
  thread_count integer DEFAULT 0,
  last_post_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Forum Threads (main discussion topics)
CREATE TABLE IF NOT EXISTS forum_threads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL, -- Markdown content
  slug text, -- Auto-generated from title
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES auth.users(id),
  view_count integer DEFAULT 0,
  upvote_count integer DEFAULT 0,
  downvote_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  last_activity_at timestamp with time zone DEFAULT timezone('utc', now()),
  has_best_answer boolean DEFAULT false,
  best_answer_id uuid, -- FK added later
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Forum Posts (replies in threads - nested like Reddit)
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE, -- For nesting
  content text NOT NULL, -- Markdown content
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES auth.users(id),
  upvote_count integer DEFAULT 0,
  downvote_count integer DEFAULT 0,
  is_edited boolean DEFAULT false,
  edited_at timestamp with time zone,
  edit_reason text,
  depth integer DEFAULT 0, -- Calculated depth in tree
  path text, -- Materialized path for efficient tree queries (e.g., "001.002.005")
  is_best_answer boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Add FK for best_answer_id in threads
ALTER TABLE forum_threads
  ADD CONSTRAINT fk_thread_best_answer
  FOREIGN KEY (best_answer_id)
  REFERENCES forum_posts(id) ON DELETE SET NULL;

-- Forum Votes (upvote/downvote tracking - Reddit style)
CREATE TABLE IF NOT EXISTS forum_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  votable_type text NOT NULL CHECK (votable_type IN ('thread', 'post')),
  votable_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, votable_type, votable_id)
);

-- Forum Attachments (images, files, videos)
CREATE TABLE IF NOT EXISTS forum_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL, -- Supabase storage path
  file_type text NOT NULL, -- image, document, code
  file_size bigint NOT NULL, -- in bytes
  mime_type text NOT NULL,
  thumbnail_url text, -- For images
  is_embedded boolean DEFAULT false, -- Embedded in content vs separate attachment
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  CHECK (post_id IS NOT NULL OR thread_id IS NOT NULL)
);

-- Forum Bookmarks (save threads for later)
CREATE TABLE IF NOT EXISTS forum_bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, thread_id)
);

-- Forum Follows (follow threads for notifications)
CREATE TABLE IF NOT EXISTS forum_follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  notify_email boolean DEFAULT true,
  notify_push boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, thread_id)
);

-- Forum Reports (user reports for content moderation)
CREATE TABLE IF NOT EXISTS forum_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reportable_type text NOT NULL CHECK (reportable_type IN ('thread', 'post')),
  reportable_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'offtopic', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  action_taken text,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Forum Moderators (moderator role assignments)
CREATE TABLE IF NOT EXISTS forum_moderators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES forum_categories(id) ON DELETE CASCADE, -- null = global moderator
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  permissions jsonb DEFAULT '{"delete": true, "edit": true, "pin": true, "lock": true, "ban": true, "warn": true}'::jsonb,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, category_id)
);

-- Forum Bans (user ban management)
CREATE TABLE IF NOT EXISTS forum_bans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES auth.users(id),
  ban_type text NOT NULL CHECK (ban_type IN ('temporary', 'permanent', 'shadow')),
  reason text NOT NULL,
  start_date timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  end_date timestamp with time zone, -- null = permanent
  is_active boolean DEFAULT true,
  can_read boolean DEFAULT true,
  can_vote boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Forum Warnings (warning system)
CREATE TABLE IF NOT EXISTS forum_warnings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by uuid NOT NULL REFERENCES auth.users(id),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reason text NOT NULL,
  description text,
  auto_ban_threshold integer DEFAULT 3,
  is_acknowledged boolean DEFAULT false,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Forum User Trust Levels (Discourse-style trust progression)
CREATE TABLE IF NOT EXISTS forum_user_trust_levels (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  trust_level integer DEFAULT 0 CHECK (trust_level >= 0 AND trust_level <= 4),
  -- Stats for trust level calculation
  posts_count integer DEFAULT 0,
  topics_created integer DEFAULT 0,
  likes_given integer DEFAULT 0,
  likes_received integer DEFAULT 0,
  days_visited integer DEFAULT 0,
  read_count integer DEFAULT 0,
  flags_agreed integer DEFAULT 0,
  flags_disagreed integer DEFAULT 0,
  time_read_minutes integer DEFAULT 0,
  -- Metadata
  last_calculated_at timestamp with time zone DEFAULT timezone('utc', now()),
  last_promoted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Forum Moderator Actions (audit log for moderators)
CREATE TABLE IF NOT EXISTS forum_moderator_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN (
    'delete_thread', 'delete_post', 'pin_thread', 'unpin_thread',
    'lock_thread', 'unlock_thread', 'ban_user', 'unban_user',
    'warn_user', 'edit_post', 'move_thread', 'purge_user', 'mark_best_answer'
  )),
  target_type text CHECK (target_type IN ('thread', 'post', 'user')),
  target_id uuid,
  reason text,
  details jsonb, -- Additional action details
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Forum Online Users (real-time presence)
CREATE TABLE IF NOT EXISTS forum_online_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES forum_threads(id) ON DELETE CASCADE,
  last_seen_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  is_typing boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, thread_id)
);

-- ================================================================
-- PART 2: INDEXES (Performance Optimization)
-- ================================================================

-- Forum Categories
CREATE INDEX IF NOT EXISTS idx_forum_categories_slug ON forum_categories(slug);
CREATE INDEX IF NOT EXISTS idx_forum_categories_active ON forum_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_forum_categories_display_order ON forum_categories(display_order);

-- Forum Threads
CREATE INDEX IF NOT EXISTS idx_forum_threads_category_id ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_user_id ON forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created_at ON forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_last_activity ON forum_threads(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_slug ON forum_threads(slug);
CREATE INDEX IF NOT EXISTS idx_forum_threads_active ON forum_threads(is_deleted, is_pinned, last_activity_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned ON forum_threads(category_id, is_pinned, last_activity_at DESC) WHERE is_pinned = true;
-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_forum_threads_search ON forum_threads USING gin(to_tsvector('english', title || ' ' || content)) WHERE is_deleted = false;

-- Forum Posts
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_id ON forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent_id ON forum_posts(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_path ON forum_posts USING gin(path);
CREATE INDEX IF NOT EXISTS idx_forum_posts_active ON forum_posts(thread_id, created_at) WHERE is_deleted = false;
-- Covering index for post list queries
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_covering ON forum_posts(thread_id, created_at)
  INCLUDE (upvote_count, downvote_count, reply_count) WHERE is_deleted = false;

-- Forum Votes
CREATE INDEX IF NOT EXISTS idx_forum_votes_user_id ON forum_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_votable ON forum_votes(votable_type, votable_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_unique ON forum_votes(user_id, votable_type, votable_id);

-- Forum Attachments
CREATE INDEX IF NOT EXISTS idx_forum_attachments_post_id ON forum_attachments(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_attachments_thread_id ON forum_attachments(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_attachments_user_id ON forum_attachments(user_id);

-- Forum Bookmarks
CREATE INDEX IF NOT EXISTS idx_forum_bookmarks_user_id ON forum_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_bookmarks_thread_id ON forum_bookmarks(thread_id);

-- Forum Follows
CREATE INDEX IF NOT EXISTS idx_forum_follows_user_id ON forum_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_follows_thread_id ON forum_follows(thread_id);

-- Forum Reports
CREATE INDEX IF NOT EXISTS idx_forum_reports_status ON forum_reports(status, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_forum_reports_reporter ON forum_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_forum_reports_reported_user ON forum_reports(reported_user_id);

-- Forum Moderators
CREATE INDEX IF NOT EXISTS idx_forum_moderators_user_id ON forum_moderators(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_forum_moderators_category ON forum_moderators(category_id) WHERE is_active = true;

-- Forum Bans
CREATE INDEX IF NOT EXISTS idx_forum_bans_user_id ON forum_bans(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_forum_bans_end_date ON forum_bans(end_date) WHERE is_active = true AND end_date IS NOT NULL;

-- Forum Warnings
CREATE INDEX IF NOT EXISTS idx_forum_warnings_user_id ON forum_warnings(user_id);

-- Forum Trust Levels
CREATE INDEX IF NOT EXISTS idx_forum_trust_levels_level ON forum_user_trust_levels(trust_level);

-- Forum Moderator Actions
CREATE INDEX IF NOT EXISTS idx_forum_mod_actions_moderator ON forum_moderator_actions(moderator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_mod_actions_target ON forum_moderator_actions(target_type, target_id);

-- Forum Online Users
CREATE INDEX IF NOT EXISTS idx_forum_online_users_thread ON forum_online_users(thread_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_online_users_last_seen ON forum_online_users(last_seen_at);

-- ================================================================
-- PART 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_user_trust_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_moderator_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_online_users ENABLE ROW LEVEL SECURITY;

-- Forum Categories Policies
CREATE POLICY "Anyone can view active categories" ON forum_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON forum_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Forum Threads Policies
CREATE POLICY "Anyone can view non-deleted threads" ON forum_threads
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can create threads" ON forum_threads
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM forum_bans
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Users can update own threads" ON forum_threads
  FOR UPDATE USING (
    auth.uid() = user_id AND
    is_locked = false
  );

CREATE POLICY "Users can delete own threads" ON forum_threads
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Moderators can manage all threads" ON forum_threads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
      AND (category_id IS NULL OR category_id = forum_threads.category_id)
    )
  );

-- Forum Posts Policies
CREATE POLICY "Anyone can view non-deleted posts" ON forum_posts
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can create posts" ON forum_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM forum_bans
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Users can update own posts" ON forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON forum_posts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Moderators can manage all posts" ON forum_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Forum Votes Policies
CREATE POLICY "Anyone can view votes" ON forum_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create votes" ON forum_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON forum_votes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON forum_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Forum Attachments Policies
CREATE POLICY "Anyone can view attachments" ON forum_attachments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload attachments" ON forum_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments" ON forum_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Forum Bookmarks Policies
CREATE POLICY "Users can view own bookmarks" ON forum_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create bookmarks" ON forum_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON forum_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Forum Follows Policies
CREATE POLICY "Users can view own follows" ON forum_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can follow threads" ON forum_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow threads" ON forum_follows
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update follow settings" ON forum_follows
  FOR UPDATE USING (auth.uid() = user_id);

-- Forum Reports Policies
CREATE POLICY "Users can view own reports" ON forum_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view all reports" ON forum_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Authenticated users can create reports" ON forum_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can update reports" ON forum_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Forum Moderators Policies
CREATE POLICY "Anyone can view active moderators" ON forum_moderators
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage moderators" ON forum_moderators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Forum Bans Policies
CREATE POLICY "Users can view own bans" ON forum_bans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all bans" ON forum_bans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Moderators can create bans" ON forum_bans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
      AND (permissions->>'ban')::boolean = true
    )
  );

CREATE POLICY "Moderators can update bans" ON forum_bans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Forum Warnings Policies
CREATE POLICY "Users can view own warnings" ON forum_warnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all warnings" ON forum_warnings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Moderators can issue warnings" ON forum_warnings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
      AND (permissions->>'warn')::boolean = true
    )
  );

CREATE POLICY "Users can acknowledge warnings" ON forum_warnings
  FOR UPDATE USING (auth.uid() = user_id);

-- Forum Trust Levels Policies
CREATE POLICY "Anyone can view trust levels" ON forum_user_trust_levels
  FOR SELECT USING (true);

CREATE POLICY "System can manage trust levels" ON forum_user_trust_levels
  FOR ALL USING (true); -- Managed by functions

-- Forum Moderator Actions Policies
CREATE POLICY "Moderators can view all actions" ON forum_moderator_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Moderators can log actions" ON forum_moderator_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forum_moderators
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Forum Online Users Policies
CREATE POLICY "Anyone can view online users" ON forum_online_users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON forum_online_users
  FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- PART 4: DATABASE FUNCTIONS
-- ================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_forum_categories_updated_at BEFORE UPDATE ON forum_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_votes_updated_at BEFORE UPDATE ON forum_votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_user_trust_levels_updated_at BEFORE UPDATE ON forum_user_trust_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_online_users_updated_at BEFORE UPDATE ON forum_online_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update thread activity timestamp
CREATE OR REPLACE FUNCTION update_thread_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forum_threads
  SET last_activity_at = timezone('utc', now()),
      reply_count = (
        SELECT COUNT(*)
        FROM forum_posts
        WHERE thread_id = NEW.thread_id
        AND is_deleted = false
      )
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_activity_on_post AFTER INSERT ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_thread_activity();

-- Function: Update category post count
CREATE OR REPLACE FUNCTION update_category_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_categories
    SET thread_count = thread_count + 1,
        last_post_at = timezone('utc', now())
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_categories
    SET thread_count = thread_count - 1
    WHERE id = OLD.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_counts_on_thread
  AFTER INSERT OR DELETE ON forum_threads
  FOR EACH ROW EXECUTE FUNCTION update_category_counts();

-- Function: Update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
  vote_delta integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    vote_delta := CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE -1 END;

    IF NEW.votable_type = 'thread' THEN
      UPDATE forum_threads
      SET upvote_count = CASE WHEN NEW.vote_type = 'upvote' THEN upvote_count + 1 ELSE upvote_count END,
          downvote_count = CASE WHEN NEW.vote_type = 'downvote' THEN downvote_count + 1 ELSE downvote_count END
      WHERE id = NEW.votable_id;
    ELSIF NEW.votable_type = 'post' THEN
      UPDATE forum_posts
      SET upvote_count = CASE WHEN NEW.vote_type = 'upvote' THEN upvote_count + 1 ELSE upvote_count END,
          downvote_count = CASE WHEN NEW.vote_type = 'downvote' THEN downvote_count + 1 ELSE downvote_count END
      WHERE id = NEW.votable_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.votable_type = 'thread' THEN
      UPDATE forum_threads
      SET upvote_count = CASE WHEN OLD.vote_type = 'upvote' THEN upvote_count - 1 ELSE upvote_count END,
          downvote_count = CASE WHEN OLD.vote_type = 'downvote' THEN downvote_count - 1 ELSE downvote_count END
      WHERE id = OLD.votable_id;
    ELSIF OLD.votable_type = 'post' THEN
      UPDATE forum_posts
      SET upvote_count = CASE WHEN OLD.vote_type = 'upvote' THEN upvote_count - 1 ELSE upvote_count END,
          downvote_count = CASE WHEN OLD.vote_type = 'downvote' THEN downvote_count - 1 ELSE downvote_count END
      WHERE id = OLD.votable_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote type change
    IF NEW.votable_type = 'thread' THEN
      UPDATE forum_threads
      SET upvote_count = upvote_count + CASE
          WHEN NEW.vote_type = 'upvote' AND OLD.vote_type = 'downvote' THEN 1
          WHEN NEW.vote_type = 'downvote' AND OLD.vote_type = 'upvote' THEN -1
          ELSE 0 END,
          downvote_count = downvote_count + CASE
          WHEN NEW.vote_type = 'downvote' AND OLD.vote_type = 'upvote' THEN 1
          WHEN NEW.vote_type = 'upvote' AND OLD.vote_type = 'downvote' THEN -1
          ELSE 0 END
      WHERE id = NEW.votable_id;
    ELSIF NEW.votable_type = 'post' THEN
      UPDATE forum_posts
      SET upvote_count = upvote_count + CASE
          WHEN NEW.vote_type = 'upvote' AND OLD.vote_type = 'downvote' THEN 1
          WHEN NEW.vote_type = 'downvote' AND OLD.vote_type = 'upvote' THEN -1
          ELSE 0 END,
          downvote_count = downvote_count + CASE
          WHEN NEW.vote_type = 'downvote' AND OLD.vote_type = 'upvote' THEN 1
          WHEN NEW.vote_type = 'upvote' AND OLD.vote_type = 'downvote' THEN -1
          ELSE 0 END
      WHERE id = NEW.votable_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON forum_votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

-- Function: Calculate post depth and path
CREATE OR REPLACE FUNCTION calculate_post_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path text;
  parent_depth integer;
  next_child_num text;
BEGIN
  IF NEW.parent_id IS NULL THEN
    -- Root post
    NEW.depth := 0;
    -- Get next child number for this thread
    SELECT COALESCE(MAX(CAST(substring(path FROM 1 FOR 3) AS integer)), 0) + 1
    INTO next_child_num
    FROM forum_posts
    WHERE thread_id = NEW.thread_id AND parent_id IS NULL;

    NEW.path := LPAD(next_child_num::text, 3, '0');
  ELSE
    -- Child post
    SELECT depth, path INTO parent_depth, parent_path
    FROM forum_posts
    WHERE id = NEW.parent_id;

    NEW.depth := parent_depth + 1;

    -- Get next child number for this parent
    SELECT COALESCE(MAX(CAST(substring(path FROM char_length(parent_path) + 2 FOR 3) AS integer)), 0) + 1
    INTO next_child_num
    FROM forum_posts
    WHERE parent_id = NEW.parent_id;

    NEW.path := parent_path || '.' || LPAD(next_child_num::text, 3, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_post_path_trigger
  BEFORE INSERT ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION calculate_post_path();

-- Function: Initialize user trust level
CREATE OR REPLACE FUNCTION initialize_user_trust_level()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO forum_user_trust_levels (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER initialize_user_trust_level_on_post
  AFTER INSERT ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION initialize_user_trust_level();

CREATE TRIGGER initialize_user_trust_level_on_thread
  AFTER INSERT ON forum_threads
  FOR EACH ROW EXECUTE FUNCTION initialize_user_trust_level();

-- Function: Update trust level stats
CREATE OR REPLACE FUNCTION update_trust_level_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'forum_posts' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE forum_user_trust_levels
      SET posts_count = posts_count + 1
      WHERE user_id = NEW.user_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'forum_threads' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE forum_user_trust_levels
      SET topics_created = topics_created + 1
      WHERE user_id = NEW.user_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'forum_votes' THEN
    IF TG_OP = 'INSERT' AND NEW.vote_type = 'upvote' THEN
      -- Increment likes_given for voter
      UPDATE forum_user_trust_levels
      SET likes_given = likes_given + 1
      WHERE user_id = NEW.user_id;

      -- Increment likes_received for content author
      IF NEW.votable_type = 'thread' THEN
        UPDATE forum_user_trust_levels ftl
        SET likes_received = likes_received + 1
        FROM forum_threads ft
        WHERE ftl.user_id = ft.user_id AND ft.id = NEW.votable_id;
      ELSIF NEW.votable_type = 'post' THEN
        UPDATE forum_user_trust_levels ftl
        SET likes_received = likes_received + 1
        FROM forum_posts fp
        WHERE ftl.user_id = fp.user_id AND fp.id = NEW.votable_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trust_stats_on_post
  AFTER INSERT ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_trust_level_stats();

CREATE TRIGGER update_trust_stats_on_thread
  AFTER INSERT ON forum_threads
  FOR EACH ROW EXECUTE FUNCTION update_trust_level_stats();

CREATE TRIGGER update_trust_stats_on_vote
  AFTER INSERT ON forum_votes
  FOR EACH ROW EXECUTE FUNCTION update_trust_level_stats();

-- Function: Check if user can post (rate limiting + ban check)
CREATE OR REPLACE FUNCTION check_can_post(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  is_banned boolean;
  trust_level integer;
  post_count_today integer;
  max_posts_per_day integer;
BEGIN
  -- Check if banned
  SELECT EXISTS (
    SELECT 1 FROM forum_bans
    WHERE user_id = p_user_id
    AND is_active = true
    AND (end_date IS NULL OR end_date > timezone('utc', now()))
  ) INTO is_banned;

  IF is_banned THEN
    RETURN false;
  END IF;

  -- Get trust level
  SELECT COALESCE(ftl.trust_level, 0)
  INTO trust_level
  FROM forum_user_trust_levels ftl
  WHERE ftl.user_id = p_user_id;

  -- Determine rate limit based on trust level
  max_posts_per_day := CASE
    WHEN trust_level >= 2 THEN 999999 -- No limit
    WHEN trust_level = 1 THEN 10
    ELSE 3
  END;

  -- Count posts today
  SELECT COUNT(*)
  INTO post_count_today
  FROM forum_posts
  WHERE user_id = p_user_id
  AND created_at > timezone('utc', now()) - interval '1 day';

  RETURN post_count_today < max_posts_per_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Soft delete user content (moderator purge)
CREATE OR REPLACE FUNCTION soft_delete_user_content(p_user_id uuid, p_moderator_id uuid)
RETURNS jsonb AS $$
DECLARE
  threads_deleted integer;
  posts_deleted integer;
BEGIN
  -- Soft delete all threads
  UPDATE forum_threads
  SET is_deleted = true,
      deleted_at = timezone('utc', now()),
      deleted_by = p_moderator_id
  WHERE user_id = p_user_id
  AND is_deleted = false;

  GET DIAGNOSTICS threads_deleted = ROW_COUNT;

  -- Soft delete all posts
  UPDATE forum_posts
  SET is_deleted = true,
      deleted_at = timezone('utc', now()),
      deleted_by = p_moderator_id
  WHERE user_id = p_user_id
  AND is_deleted = false;

  GET DIAGNOSTICS posts_deleted = ROW_COUNT;

  -- Log the action
  INSERT INTO forum_moderator_actions (
    moderator_id, action_type, target_type, target_id, details
  ) VALUES (
    p_moderator_id, 'purge_user', 'user', p_user_id,
    jsonb_build_object('threads_deleted', threads_deleted, 'posts_deleted', posts_deleted)
  );

  RETURN jsonb_build_object(
    'threads_deleted', threads_deleted,
    'posts_deleted', posts_deleted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate trust level
CREATE OR REPLACE FUNCTION calculate_trust_level(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  stats record;
  new_level integer;
BEGIN
  SELECT * INTO stats
  FROM forum_user_trust_levels
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Trust level progression criteria (Discourse-inspired)
  new_level := 0;

  -- Level 1: Member (5 posts, 1 day, 30min reading)
  IF stats.posts_count >= 5
     AND stats.days_visited >= 1
     AND stats.time_read_minutes >= 30 THEN
    new_level := 1;
  END IF;

  -- Level 2: Regular (50 posts, 10 days, 2hr reading, 10 likes received)
  IF stats.posts_count >= 50
     AND stats.days_visited >= 10
     AND stats.time_read_minutes >= 120
     AND stats.likes_received >= 10 THEN
    new_level := 2;
  END IF;

  -- Level 3: Leader (200 posts, 50 days, 20hr reading, 100 likes, 5 flags agreed)
  IF stats.posts_count >= 200
     AND stats.days_visited >= 50
     AND stats.time_read_minutes >= 1200
     AND stats.likes_received >= 100
     AND stats.flags_agreed >= 5 THEN
    new_level := 3;
  END IF;

  -- Level 4: Elder (manually assigned by admins)
  IF stats.trust_level = 4 THEN
    new_level := 4;
  END IF;

  -- Update if changed
  IF new_level != stats.trust_level THEN
    UPDATE forum_user_trust_levels
    SET trust_level = new_level,
        last_promoted_at = timezone('utc', now())
    WHERE user_id = p_user_id;
  END IF;

  RETURN new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Award forum points (integrates with gamification)
CREATE OR REPLACE FUNCTION award_forum_points(
  p_user_id uuid,
  p_action_type text,
  p_amount integer
)
RETURNS void AS $$
BEGIN
  -- This will call the existing gamification points system
  -- For now, we'll just log it
  -- In implementation, this will integrate with PointsService

  -- Log in point_transactions if that table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'point_transactions') THEN
    INSERT INTO point_transactions (user_id, points, source, description)
    VALUES (
      p_user_id,
      p_amount,
      'forum',
      'Forum activity: ' || p_action_type
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- PART 5: SEED DATA (Initial Categories)
-- ================================================================

INSERT INTO forum_categories (name, slug, description, icon, color, display_order) VALUES
  ('AI Fundamentals', 'ai-fundamentals', 'Discuss the basics of artificial intelligence, machine learning, and neural networks', 'Brain', '#3b82f6', 1),
  ('Learning & Education', 'learning-education', 'Share learning experiences, resources, and study tips', 'GraduationCap', '#10b981', 2),
  ('Career & Opportunities', 'career-opportunities', 'Discuss AI careers, job opportunities, and professional development', 'Briefcase', '#f59e0b', 3),
  ('Projects & Showcase', 'projects-showcase', 'Share your AI projects, get feedback, and collaborate', 'Rocket', '#8b5cf6', 4),
  ('News & Trends', 'news-trends', 'Latest AI news, breakthroughs, and industry trends', 'Newspaper', '#ef4444', 5),
  ('Community Lounge', 'community-lounge', 'Off-topic discussions, introductions, and casual chat', 'MessageCircle', '#ec4899', 6)
ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- PART 6: ENABLE REALTIME REPLICATION
-- ================================================================

-- Enable realtime for forum tables
ALTER PUBLICATION supabase_realtime ADD TABLE forum_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_online_users;

-- ================================================================
-- COMPLETE: Forum System Ready for Use
-- ================================================================

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
