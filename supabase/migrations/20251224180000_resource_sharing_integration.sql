-- =====================================================================================
-- Migration: Resource Sharing & Integration Features
-- Description: Enable collaborative playlists, resource comments, and group linking
-- Week 4 of Collaborative Learning Tools implementation
-- =====================================================================================

-- =====================================================================================
-- Table: collaborative_playlists
-- Purpose: Track which playlists support multi-user editing
-- =====================================================================================
CREATE TABLE IF NOT EXISTS collaborative_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES user_playlists(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_collaborative BOOLEAN NOT NULL DEFAULT FALSE,
  allow_member_add BOOLEAN DEFAULT TRUE,
  allow_member_remove BOOLEAN DEFAULT FALSE,
  allow_member_reorder BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one collaborative config per playlist
  UNIQUE(playlist_id)
);

-- =====================================================================================
-- Table: playlist_collaborators
-- Purpose: Manage collaborator permissions for playlists
-- =====================================================================================
CREATE TABLE IF NOT EXISTS playlist_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES user_playlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'editor',
  can_add_items BOOLEAN DEFAULT TRUE,
  can_remove_items BOOLEAN DEFAULT FALSE,
  can_reorder BOOLEAN DEFAULT TRUE,
  can_invite_others BOOLEAN DEFAULT FALSE,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate collaborators
  UNIQUE(playlist_id, user_id),

  -- Validate role
  CHECK (role IN ('owner', 'editor', 'viewer'))
);

-- =====================================================================================
-- Table: resource_comments
-- Purpose: Enable discussions on any shared resource (bookmarks, playlists, etc.)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS resource_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES resource_comments(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validate resource type
  CHECK (resource_type IN ('bookmark', 'playlist', 'resource', 'study_group_resource')),

  -- Ensure non-empty comment
  CHECK (char_length(trim(comment)) > 0)
);

-- =====================================================================================
-- Table: study_group_forum_threads
-- Purpose: Link forum threads to study groups
-- =====================================================================================
CREATE TABLE IF NOT EXISTS study_group_forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  linked_by UUID NOT NULL REFERENCES auth.users(id),
  linked_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate links
  UNIQUE(study_group_id, thread_id)
);

-- =====================================================================================
-- Table: resource_sharing_activity
-- Purpose: Track resource sharing history across the platform
-- =====================================================================================
CREATE TABLE IF NOT EXISTS resource_sharing_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_type VARCHAR(20) NOT NULL,
  shared_with_id UUID,
  share_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validate sharing target type
  CHECK (shared_with_type IN ('user', 'study_group', 'public')),

  -- Validate resource type
  CHECK (resource_type IN ('bookmark', 'playlist', 'resource', 'study_group_resource'))
);

-- =====================================================================================
-- Indexes for Performance
-- =====================================================================================
CREATE INDEX idx_collaborative_playlists_playlist_id ON collaborative_playlists(playlist_id);
CREATE INDEX idx_collaborative_playlists_owner_id ON collaborative_playlists(owner_id);

CREATE INDEX idx_playlist_collaborators_playlist_id ON playlist_collaborators(playlist_id);
CREATE INDEX idx_playlist_collaborators_user_id ON playlist_collaborators(user_id);

CREATE INDEX idx_resource_comments_resource ON resource_comments(resource_type, resource_id);
CREATE INDEX idx_resource_comments_user_id ON resource_comments(user_id);
CREATE INDEX idx_resource_comments_parent_id ON resource_comments(parent_comment_id);
CREATE INDEX idx_resource_comments_created_at ON resource_comments(created_at DESC);

CREATE INDEX idx_study_group_forum_threads_group_id ON study_group_forum_threads(study_group_id);
CREATE INDEX idx_study_group_forum_threads_thread_id ON study_group_forum_threads(thread_id);

CREATE INDEX idx_resource_sharing_activity_shared_by ON resource_sharing_activity(shared_by);
CREATE INDEX idx_resource_sharing_activity_resource ON resource_sharing_activity(resource_type, resource_id);
CREATE INDEX idx_resource_sharing_activity_target ON resource_sharing_activity(shared_with_type, shared_with_id);

-- =====================================================================================
-- Triggers for Auto-updating Timestamps
-- =====================================================================================
CREATE TRIGGER update_collaborative_playlists_updated_at
  BEFORE UPDATE ON collaborative_playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_comments_updated_at
  BEFORE UPDATE ON resource_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- Row Level Security (RLS) Policies
-- =====================================================================================

-- Enable RLS
ALTER TABLE collaborative_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_sharing_activity ENABLE ROW LEVEL SECURITY;

-- Collaborative Playlists Policies
CREATE POLICY "Users can view collaborative playlists they own or collaborate on"
  ON collaborative_playlists FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM playlist_collaborators
      WHERE playlist_collaborators.playlist_id = collaborative_playlists.playlist_id
      AND playlist_collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create collaborative playlists for their own playlists"
  ON collaborative_playlists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their collaborative playlists"
  ON collaborative_playlists FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their collaborative playlists"
  ON collaborative_playlists FOR DELETE
  USING (auth.uid() = owner_id);

-- Playlist Collaborators Policies
CREATE POLICY "Users can view collaborators for playlists they're involved with"
  ON playlist_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM collaborative_playlists cp
      WHERE cp.playlist_id = playlist_collaborators.playlist_id
      AND cp.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM playlist_collaborators pc
      WHERE pc.playlist_id = playlist_collaborators.playlist_id
      AND pc.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and collaborators with invite permission can add collaborators"
  ON playlist_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collaborative_playlists cp
      WHERE cp.playlist_id = playlist_collaborators.playlist_id
      AND (
        cp.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM playlist_collaborators pc
          WHERE pc.playlist_id = playlist_collaborators.playlist_id
          AND pc.user_id = auth.uid()
          AND pc.can_invite_others = TRUE
        )
      )
    )
  );

CREATE POLICY "Owners can update collaborator permissions"
  ON playlist_collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM collaborative_playlists cp
      WHERE cp.playlist_id = playlist_collaborators.playlist_id
      AND cp.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners and the collaborators themselves can remove collaborators"
  ON playlist_collaborators FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM collaborative_playlists cp
      WHERE cp.playlist_id = playlist_collaborators.playlist_id
      AND cp.owner_id = auth.uid()
    )
  );

-- Resource Comments Policies
CREATE POLICY "Anyone can view non-deleted comments"
  ON resource_comments FOR SELECT
  USING (is_deleted = FALSE);

CREATE POLICY "Authenticated users can create comments"
  ON resource_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON resource_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON resource_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Study Group Forum Threads Policies
CREATE POLICY "Study group members can view linked threads"
  ON study_group_forum_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members sgm
      WHERE sgm.group_id = study_group_forum_threads.study_group_id
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Study group admins can link threads"
  ON study_group_forum_threads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_group_members sgm
      WHERE sgm.group_id = study_group_forum_threads.study_group_id
      AND sgm.user_id = auth.uid()
      AND sgm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Study group admins can unlink threads"
  ON study_group_forum_threads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members sgm
      WHERE sgm.group_id = study_group_forum_threads.study_group_id
      AND sgm.user_id = auth.uid()
      AND sgm.role IN ('admin', 'moderator')
    )
  );

-- Resource Sharing Activity Policies
CREATE POLICY "Users can view sharing activity for resources they can access"
  ON resource_sharing_activity FOR SELECT
  USING (
    auth.uid() = shared_by
    OR shared_with_type = 'public'
    OR (shared_with_type = 'user' AND shared_with_id = auth.uid())
    OR (
      shared_with_type = 'study_group'
      AND EXISTS (
        SELECT 1 FROM study_group_members sgm
        WHERE sgm.group_id = shared_with_id
        AND sgm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated users can create sharing activity"
  ON resource_sharing_activity FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

-- =====================================================================================
-- Helper Functions
-- =====================================================================================

-- Function to check if user is a playlist collaborator
CREATE OR REPLACE FUNCTION is_playlist_collaborator(
  p_playlist_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM playlist_collaborators
    WHERE playlist_id = p_playlist_id
    AND user_id = p_user_id
  );
END;
$$;

-- Function to get collaborator permissions
CREATE OR REPLACE FUNCTION get_collaborator_permissions(
  p_playlist_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  can_add_items BOOLEAN,
  can_remove_items BOOLEAN,
  can_reorder BOOLEAN,
  can_invite_others BOOLEAN,
  role VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.can_add_items,
    pc.can_remove_items,
    pc.can_reorder,
    pc.can_invite_others,
    pc.role
  FROM playlist_collaborators pc
  WHERE pc.playlist_id = p_playlist_id
  AND pc.user_id = p_user_id;
END;
$$;

-- Function to get comment thread with user info
CREATE OR REPLACE FUNCTION get_resource_comments(
  p_resource_type VARCHAR,
  p_resource_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  parent_comment_id UUID,
  comment TEXT,
  is_edited BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.user_id,
    rc.parent_comment_id,
    rc.comment,
    rc.is_edited,
    rc.created_at,
    rc.updated_at
  FROM resource_comments rc
  WHERE rc.resource_type = p_resource_type
  AND rc.resource_id = p_resource_id
  AND rc.is_deleted = FALSE
  ORDER BY rc.created_at ASC;
END;
$$;

-- =====================================================================================
-- Sample Data and Testing
-- =====================================================================================

-- Note: Sample data insertion would be handled by application logic
-- This migration only sets up the schema and security policies

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
