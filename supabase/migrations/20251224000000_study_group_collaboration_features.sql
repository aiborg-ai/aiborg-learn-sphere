-- ============================================================================
-- Study Group Collaboration Features Migration
-- Adds tables and functionality for group chat, resources, calendar, and invitations
-- ============================================================================

-- ============================================================================
-- TABLE: study_group_messages
-- Real-time chat messages for study groups
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_study_group_messages_group_id ON study_group_messages(group_id);
CREATE INDEX idx_study_group_messages_created_at ON study_group_messages(created_at DESC);

-- ============================================================================
-- TABLE: study_group_resources
-- Links resources (bookmarks, playlists, etc.) to study groups
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_group_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('bookmark', 'playlist', 'file', 'link')),
  resource_id UUID, -- Can be NULL for external links
  resource_url TEXT,
  resource_title TEXT NOT NULL,
  resource_description TEXT,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT resource_id_or_url CHECK (
    (resource_id IS NOT NULL AND resource_url IS NULL) OR
    (resource_id IS NULL AND resource_url IS NOT NULL)
  )
);

CREATE INDEX idx_study_group_resources_group_id ON study_group_resources(group_id);
CREATE INDEX idx_study_group_resources_type ON study_group_resources(resource_type);

-- ============================================================================
-- TABLE: study_group_events
-- Calendar events and study sessions for groups
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_group_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('study_session', 'review', 'discussion', 'workshop', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT, -- Virtual link or physical location
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_study_group_events_group_id ON study_group_events(group_id);
CREATE INDEX idx_study_group_events_start_time ON study_group_events(start_time);

-- ============================================================================
-- TABLE: study_group_event_attendees
-- Track who's attending which events
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_group_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES study_group_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attending', 'not_attending', 'maybe')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_attendees_event_id ON study_group_event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON study_group_event_attendees(user_id);

-- ============================================================================
-- TABLE: study_group_invitations
-- Email-based invitation system for study groups
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Set when user exists
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invitation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(group_id, invited_email)
);

CREATE INDEX idx_invitations_group_id ON study_group_invitations(group_id);
CREATE INDEX idx_invitations_email ON study_group_invitations(invited_email);
CREATE INDEX idx_invitations_token ON study_group_invitations(invitation_token);
CREATE INDEX idx_invitations_status ON study_group_invitations(status);

-- ============================================================================
-- TABLE: study_group_settings
-- Per-group configuration settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_group_settings (
  group_id UUID PRIMARY KEY REFERENCES study_groups(id) ON DELETE CASCADE,
  allow_member_invites BOOLEAN DEFAULT TRUE,
  require_approval_to_join BOOLEAN DEFAULT FALSE,
  allow_resource_sharing BOOLEAN DEFAULT TRUE,
  allow_event_creation BOOLEAN DEFAULT TRUE, -- By non-admins
  notification_preferences JSONB DEFAULT '{
    "new_member": true,
    "new_message": true,
    "new_event": true,
    "new_resource": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RLS POLICIES: study_group_messages
-- ============================================================================
ALTER TABLE study_group_messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages in their groups
CREATE POLICY "Members can view group messages"
  ON study_group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_messages.group_id
        AND study_group_members.user_id = auth.uid()
    )
  );

-- Members can send messages to their groups
CREATE POLICY "Members can send messages"
  ON study_group_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_messages.group_id
        AND study_group_members.user_id = auth.uid()
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
  ON study_group_messages FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own messages (soft delete)
CREATE POLICY "Users can delete own messages"
  ON study_group_messages FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: study_group_resources
-- ============================================================================
ALTER TABLE study_group_resources ENABLE ROW LEVEL SECURITY;

-- Members can view group resources
CREATE POLICY "Members can view group resources"
  ON study_group_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_resources.group_id
        AND study_group_members.user_id = auth.uid()
    )
  );

-- Members can add resources to their groups
CREATE POLICY "Members can add resources"
  ON study_group_resources FOR INSERT
  WITH CHECK (
    added_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_resources.group_id
        AND study_group_members.user_id = auth.uid()
    )
  );

-- Users can delete resources they added
CREATE POLICY "Users can delete own resources"
  ON study_group_resources FOR DELETE
  USING (added_by = auth.uid());

-- ============================================================================
-- RLS POLICIES: study_group_events
-- ============================================================================
ALTER TABLE study_group_events ENABLE ROW LEVEL SECURITY;

-- Members can view group events
CREATE POLICY "Members can view group events"
  ON study_group_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_events.group_id
        AND study_group_members.user_id = auth.uid()
    )
  );

-- Members can create events
CREATE POLICY "Members can create events"
  ON study_group_events FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_events.group_id
        AND study_group_members.user_id = auth.uid()
    )
  );

-- Event creators and admins can update events
CREATE POLICY "Creators and admins can update events"
  ON study_group_events FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_events.group_id
        AND study_group_members.user_id = auth.uid()
        AND study_group_members.role IN ('admin', 'moderator')
    )
  );

-- Event creators and admins can delete events
CREATE POLICY "Creators and admins can delete events"
  ON study_group_events FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_events.group_id
        AND study_group_members.user_id = auth.uid()
        AND study_group_members.role IN ('admin', 'moderator')
    )
  );

-- ============================================================================
-- RLS POLICIES: study_group_event_attendees
-- ============================================================================
ALTER TABLE study_group_event_attendees ENABLE ROW LEVEL SECURITY;

-- Members can view attendees for events in their groups
CREATE POLICY "Members can view event attendees"
  ON study_group_event_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_group_events
      JOIN study_group_members ON study_group_members.group_id = study_group_events.group_id
      WHERE study_group_events.id = study_group_event_attendees.event_id
        AND study_group_members.user_id = auth.uid()
    )
  );

-- Users can RSVP to events
CREATE POLICY "Users can RSVP to events"
  ON study_group_event_attendees FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own RSVP
CREATE POLICY "Users can update own RSVP"
  ON study_group_event_attendees FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: study_group_invitations
-- ============================================================================
ALTER TABLE study_group_invitations ENABLE ROW LEVEL SECURITY;

-- Group members can view invitations for their groups
CREATE POLICY "Members can view group invitations"
  ON study_group_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_invitations.group_id
        AND study_group_members.user_id = auth.uid()
    ) OR
    invited_user_id = auth.uid()
  );

-- Group admins can send invitations
CREATE POLICY "Admins can send invitations"
  ON study_group_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_invitations.group_id
        AND study_group_members.user_id = auth.uid()
        AND study_group_members.role IN ('admin', 'moderator')
    )
  );

-- Invited users can update invitation status
CREATE POLICY "Invited users can update status"
  ON study_group_invitations FOR UPDATE
  USING (invited_user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (invited_user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================================================
-- RLS POLICIES: study_group_settings
-- ============================================================================
ALTER TABLE study_group_settings ENABLE ROW LEVEL SECURITY;

-- Members can view group settings
CREATE POLICY "Members can view group settings"
  ON study_group_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_settings.group_id
        AND study_group_members.user_id = auth.uid()
    )
  );

-- Only group admins can update settings
CREATE POLICY "Admins can update group settings"
  ON study_group_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_members.group_id = study_group_settings.group_id
        AND study_group_members.user_id = auth.uid()
        AND study_group_members.role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGERS: Updated timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_study_group_messages_updated_at
  BEFORE UPDATE ON study_group_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_group_events_updated_at
  BEFORE UPDATE ON study_group_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_group_settings_updated_at
  BEFORE UPDATE ON study_group_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Auto-create group settings when group is created
-- ============================================================================
CREATE OR REPLACE FUNCTION create_default_group_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO study_group_settings (group_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_group_settings_on_group_create
  AFTER INSERT ON study_groups
  FOR EACH ROW EXECUTE FUNCTION create_default_group_settings();

-- ============================================================================
-- FUNCTION: Log activity when messages are posted
-- ============================================================================
CREATE OR REPLACE FUNCTION log_message_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO study_group_activities (group_id, user_id, activity_type, content)
  VALUES (
    NEW.group_id,
    NEW.user_id,
    'message_posted',
    jsonb_build_object('message', LEFT(NEW.message, 100))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_message_activity_trigger
  AFTER INSERT ON study_group_messages
  FOR EACH ROW EXECUTE FUNCTION log_message_activity();

-- ============================================================================
-- FUNCTION: Log activity when resources are shared
-- ============================================================================
CREATE OR REPLACE FUNCTION log_resource_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO study_group_activities (group_id, user_id, activity_type, content)
  VALUES (
    NEW.group_id,
    NEW.added_by,
    'resource_shared',
    jsonb_build_object('title', NEW.resource_title, 'type', NEW.resource_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_resource_activity_trigger
  AFTER INSERT ON study_group_resources
  FOR EACH ROW EXECUTE FUNCTION log_resource_activity();

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE study_group_messages IS 'Real-time chat messages for study groups';
COMMENT ON TABLE study_group_resources IS 'Shared resources within study groups';
COMMENT ON TABLE study_group_events IS 'Calendar events and study sessions';
COMMENT ON TABLE study_group_event_attendees IS 'Event RSVP tracking';
COMMENT ON TABLE study_group_invitations IS 'Email-based group invitations';
COMMENT ON TABLE study_group_settings IS 'Per-group configuration settings';
