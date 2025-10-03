-- Migration: Student Content Access Features
-- Description: Add tables for bookmarks, downloads, watch later queue, and playlists
-- Date: 2025-10-01
-- Phase: 1 - Foundation

-- ============================================================================
-- 1. BOOKMARKS TABLE
-- ============================================================================
-- Universal bookmarking system for courses, materials, videos, PDFs, and assignments

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Polymorphic bookmarking (supports multiple content types)
  bookmark_type TEXT NOT NULL CHECK (
    bookmark_type IN ('course', 'material', 'video_timestamp', 'pdf_page', 'assignment')
  ),

  -- References to different content types
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.course_materials(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.homework_assignments(id) ON DELETE CASCADE,

  -- Type-specific metadata stored as JSONB
  -- Examples:
  -- Video: { "timestamp": 120, "chapter": "Introduction" }
  -- PDF: { "page": 5, "scroll_position": 300 }
  -- Material: { "section": "Resources" }
  metadata JSONB DEFAULT '{}'::jsonb,

  -- User-defined organization
  title TEXT NOT NULL,
  note TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  folder TEXT DEFAULT 'default',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure valid references based on bookmark type
  CONSTRAINT valid_bookmark_reference CHECK (
    (bookmark_type = 'course' AND course_id IS NOT NULL) OR
    (bookmark_type = 'material' AND material_id IS NOT NULL) OR
    (bookmark_type = 'video_timestamp' AND material_id IS NOT NULL AND metadata ? 'timestamp') OR
    (bookmark_type = 'pdf_page' AND material_id IS NOT NULL AND metadata ? 'page') OR
    (bookmark_type = 'assignment' AND assignment_id IS NOT NULL)
  )
);

-- Indexes for bookmarks
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_type ON public.bookmarks(bookmark_type);
CREATE INDEX idx_bookmarks_course ON public.bookmarks(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_bookmarks_material ON public.bookmarks(material_id) WHERE material_id IS NOT NULL;
CREATE INDEX idx_bookmarks_folder ON public.bookmarks(user_id, folder);
CREATE INDEX idx_bookmarks_created ON public.bookmarks(user_id, created_at DESC);

-- GIN index for JSONB metadata queries
CREATE INDEX idx_bookmarks_metadata ON public.bookmarks USING GIN(metadata);

-- Trigger for updated_at
CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON public.bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin access to all bookmarks
CREATE POLICY "Admins can view all bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 2. DOWNLOADS TABLE
-- ============================================================================
-- Track downloaded materials for offline access and history

CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL,

  -- File metadata
  file_name TEXT NOT NULL,
  file_size BIGINT, -- bytes
  file_type TEXT, -- video, pdf, presentation, document, other
  downloaded_url TEXT NOT NULL,
  mime_type TEXT,

  -- Tracking metadata
  download_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 1,

  -- Offline availability (for future Service Worker integration)
  is_available_offline BOOLEAN DEFAULT FALSE,

  -- Device info (optional)
  device_info JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate tracking for same user + material
  UNIQUE(user_id, material_id)
);

-- Indexes for downloads
CREATE INDEX idx_downloads_user_id ON public.downloads(user_id);
CREATE INDEX idx_downloads_material_id ON public.downloads(material_id);
CREATE INDEX idx_downloads_course_id ON public.downloads(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_downloads_date ON public.downloads(user_id, download_date DESC);
CREATE INDEX idx_downloads_accessed ON public.downloads(user_id, last_accessed DESC NULLS LAST);

-- Trigger for updated_at
CREATE TRIGGER update_downloads_updated_at
  BEFORE UPDATE ON public.downloads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for downloads
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own downloads"
  ON public.downloads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own downloads"
  ON public.downloads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own downloads"
  ON public.downloads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own downloads"
  ON public.downloads
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. WATCH LATER QUEUE
-- ============================================================================
-- Simplified playlist for queuing materials to watch later

CREATE TABLE IF NOT EXISTS public.watch_later (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL,

  -- Queue management
  queue_position INTEGER NOT NULL,

  -- Optional user note
  note TEXT,

  -- Timestamps
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicates in queue
  UNIQUE(user_id, material_id)
);

-- Indexes for watch later
CREATE INDEX idx_watch_later_user ON public.watch_later(user_id);
CREATE INDEX idx_watch_later_queue ON public.watch_later(user_id, queue_position);
CREATE INDEX idx_watch_later_added ON public.watch_later(user_id, added_at DESC);

-- RLS Policies for watch later
ALTER TABLE public.watch_later ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch later queue"
  ON public.watch_later
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watch later queue"
  ON public.watch_later
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch later queue"
  ON public.watch_later
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own watch later queue"
  ON public.watch_later
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. PLAYLISTS
-- ============================================================================
-- Custom learning playlists created by students

CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Playlist details
  title TEXT NOT NULL,
  description TEXT,

  -- Visibility and sharing
  is_public BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,

  -- Statistics (denormalized for performance)
  item_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- in seconds

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for playlists
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlists_public ON public.playlists(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_playlists_created ON public.playlists(user_id, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for playlists
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playlists"
  ON public.playlists
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public playlists"
  ON public.playlists
  FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can create own playlists"
  ON public.playlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
  ON public.playlists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
  ON public.playlists
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. PLAYLIST ITEMS
-- ============================================================================
-- Materials within playlists

CREATE TABLE IF NOT EXISTS public.playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,

  -- Ordering within playlist
  position INTEGER NOT NULL,

  -- Optional metadata
  note TEXT, -- Why this material is in the playlist
  start_time INTEGER, -- For videos: start at specific timestamp
  end_time INTEGER, -- For videos: end at specific timestamp

  -- Timestamps
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate materials in same playlist
  UNIQUE(playlist_id, material_id)
);

-- Indexes for playlist items
CREATE INDEX idx_playlist_items_playlist ON public.playlist_items(playlist_id, position);
CREATE INDEX idx_playlist_items_material ON public.playlist_items(material_id);
CREATE INDEX idx_playlist_items_added ON public.playlist_items(playlist_id, added_at DESC);

-- RLS Policies for playlist items
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in accessible playlists"
  ON public.playlist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND (playlists.user_id = auth.uid() OR playlists.is_public = TRUE)
    )
  );

CREATE POLICY "Users can add items to own playlists"
  ON public.playlist_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in own playlists"
  ON public.playlist_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from own playlists"
  ON public.playlist_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update playlist statistics when items are added/removed
CREATE OR REPLACE FUNCTION update_playlist_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.playlists
  SET
    item_count = (
      SELECT COUNT(*)
      FROM public.playlist_items
      WHERE playlist_id = COALESCE(NEW.playlist_id, OLD.playlist_id)
    ),
    total_duration = COALESCE((
      SELECT SUM(cm.duration)
      FROM public.playlist_items pi
      JOIN public.course_materials cm ON cm.id = pi.material_id
      WHERE pi.playlist_id = COALESCE(NEW.playlist_id, OLD.playlist_id)
      AND cm.duration IS NOT NULL
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.playlist_id, OLD.playlist_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update playlist stats
CREATE TRIGGER update_playlist_stats_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.playlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_stats();

-- Function to reorder watch later queue positions
CREATE OR REPLACE FUNCTION reorder_watch_later_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- When an item is removed, shift all items after it down by 1
  IF TG_OP = 'DELETE' THEN
    UPDATE public.watch_later
    SET queue_position = queue_position - 1
    WHERE user_id = OLD.user_id
    AND queue_position > OLD.queue_position;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to maintain queue order
CREATE TRIGGER reorder_watch_later_on_delete
  AFTER DELETE ON public.watch_later
  FOR EACH ROW
  EXECUTE FUNCTION reorder_watch_later_queue();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.bookmarks IS 'Universal bookmarking system for courses, materials, videos, PDFs, and assignments';
COMMENT ON TABLE public.downloads IS 'Track downloaded materials for offline access and download history';
COMMENT ON TABLE public.watch_later IS 'Queue of materials to watch later, ordered by position';
COMMENT ON TABLE public.playlists IS 'Custom learning playlists created by students';
COMMENT ON TABLE public.playlist_items IS 'Materials within playlists, ordered by position';

COMMENT ON COLUMN public.bookmarks.metadata IS 'Type-specific data: video timestamps, PDF pages, scroll positions, etc.';
COMMENT ON COLUMN public.bookmarks.folder IS 'User-defined folder for organizing bookmarks';
COMMENT ON COLUMN public.downloads.is_available_offline IS 'Future: Service Worker integration for true offline access';
COMMENT ON COLUMN public.playlists.is_public IS 'Public playlists can be viewed and cloned by other users';
COMMENT ON COLUMN public.playlist_items.position IS 'Order of items within the playlist, starting from 1';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
