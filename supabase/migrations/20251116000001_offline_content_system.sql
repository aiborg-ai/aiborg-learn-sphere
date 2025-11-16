-- Migration: Offline Content Download System
-- Created: 2025-11-16
-- Description: Database schema for managing offline content downloads and sync

-- ============================================================================
-- 1. OFFLINE DOWNLOADS TABLE
-- ============================================================================
-- Tracks which content users have downloaded for offline access
CREATE TABLE IF NOT EXISTS public.offline_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content reference
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'lesson', 'video', 'document', 'quiz')),
  content_id UUID NOT NULL,

  -- Download metadata
  download_status TEXT NOT NULL DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed', 'deleted')),
  download_progress INTEGER DEFAULT 0 CHECK (download_progress >= 0 AND download_progress <= 100),
  file_size_bytes BIGINT DEFAULT 0,
  downloaded_bytes BIGINT DEFAULT 0,

  -- Storage information
  storage_path TEXT,
  cache_key TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  downloaded_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Constraints
  UNIQUE(user_id, content_type, content_id)
);

-- Create indexes for offline_downloads
CREATE INDEX IF NOT EXISTS idx_offline_downloads_user_id ON public.offline_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_downloads_content ON public.offline_downloads(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_offline_downloads_status ON public.offline_downloads(download_status);
CREATE INDEX IF NOT EXISTS idx_offline_downloads_user_status ON public.offline_downloads(user_id, download_status);

-- ============================================================================
-- 2. OFFLINE PROGRESS TABLE
-- ============================================================================
-- Tracks user progress made while offline (for later sync)
CREATE TABLE IF NOT EXISTS public.offline_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content reference
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'lesson', 'video', 'quiz', 'assessment')),
  content_id UUID NOT NULL,

  -- Progress data
  progress_data JSONB NOT NULL DEFAULT '{}',

  -- Sync status
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
  sync_attempts INTEGER DEFAULT 0,
  last_sync_attempt_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Conflict resolution
  version INTEGER DEFAULT 1,
  client_timestamp TIMESTAMPTZ,

  -- Metadata
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for offline_progress
CREATE INDEX IF NOT EXISTS idx_offline_progress_user_id ON public.offline_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_progress_content ON public.offline_progress(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_offline_progress_sync_status ON public.offline_progress(sync_status);
CREATE INDEX IF NOT EXISTS idx_offline_progress_pending ON public.offline_progress(user_id, sync_status) WHERE sync_status = 'pending';

-- ============================================================================
-- 3. OFFLINE STORAGE QUOTA TABLE
-- ============================================================================
-- Tracks storage usage per user for offline content
CREATE TABLE IF NOT EXISTS public.offline_storage_quota (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Storage limits
  total_quota_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5GB default
  used_bytes BIGINT NOT NULL DEFAULT 0,

  -- Statistics
  total_downloads INTEGER DEFAULT 0,
  total_deletions INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_cleanup_at TIMESTAMPTZ,

  -- Constraints
  CHECK (used_bytes >= 0),
  CHECK (used_bytes <= total_quota_bytes)
);

-- Create index for storage quota
CREATE INDEX IF NOT EXISTS idx_offline_storage_quota_updated ON public.offline_storage_quota(updated_at);

-- ============================================================================
-- 4. TRIGGER FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_offline_downloads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_offline_downloads_updated_at
  BEFORE UPDATE ON public.offline_downloads
  FOR EACH ROW
  EXECUTE FUNCTION update_offline_downloads_updated_at();

CREATE OR REPLACE FUNCTION update_offline_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_offline_progress_updated_at
  BEFORE UPDATE ON public.offline_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_offline_progress_updated_at();

-- Update storage quota when downloads change
CREATE OR REPLACE FUNCTION update_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize quota if doesn't exist
  INSERT INTO public.offline_storage_quota (user_id, used_bytes, total_downloads)
  VALUES (NEW.user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  IF TG_OP = 'INSERT' THEN
    -- New download
    IF NEW.download_status = 'completed' THEN
      UPDATE public.offline_storage_quota
      SET
        used_bytes = used_bytes + COALESCE(NEW.file_size_bytes, 0),
        total_downloads = total_downloads + 1,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Download status changed
    IF OLD.download_status != 'completed' AND NEW.download_status = 'completed' THEN
      -- Download completed
      UPDATE public.offline_storage_quota
      SET
        used_bytes = used_bytes + COALESCE(NEW.file_size_bytes, 0),
        total_downloads = total_downloads + 1,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF OLD.download_status = 'completed' AND NEW.download_status = 'deleted' THEN
      -- Download deleted
      UPDATE public.offline_storage_quota
      SET
        used_bytes = GREATEST(0, used_bytes - COALESCE(OLD.file_size_bytes, 0)),
        total_deletions = total_deletions + 1,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Download record deleted
    IF OLD.download_status = 'completed' THEN
      UPDATE public.offline_storage_quota
      SET
        used_bytes = GREATEST(0, used_bytes - COALESCE(OLD.file_size_bytes, 0)),
        total_deletions = total_deletions + 1,
        updated_at = NOW()
      WHERE user_id = OLD.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_storage_quota
  AFTER INSERT OR UPDATE OR DELETE ON public.offline_downloads
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_quota();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.offline_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_storage_quota ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offline_downloads
CREATE POLICY "Users can view own downloads"
  ON public.offline_downloads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads"
  ON public.offline_downloads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own downloads"
  ON public.offline_downloads
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own downloads"
  ON public.offline_downloads
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for offline_progress
CREATE POLICY "Users can view own offline progress"
  ON public.offline_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offline progress"
  ON public.offline_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offline progress"
  ON public.offline_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own offline progress"
  ON public.offline_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for offline_storage_quota
CREATE POLICY "Users can view own storage quota"
  ON public.offline_storage_quota
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own storage quota"
  ON public.offline_storage_quota
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. UTILITY FUNCTIONS
-- ============================================================================

-- Function to check if user has available storage quota
CREATE OR REPLACE FUNCTION check_storage_quota(p_user_id UUID, p_required_bytes BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_bytes BIGINT;
BEGIN
  SELECT (total_quota_bytes - used_bytes) INTO v_available_bytes
  FROM public.offline_storage_quota
  WHERE user_id = p_user_id;

  -- If no quota record exists, create one with defaults
  IF NOT FOUND THEN
    INSERT INTO public.offline_storage_quota (user_id, total_quota_bytes, used_bytes)
    VALUES (p_user_id, 5368709120, 0); -- 5GB default
    v_available_bytes := 5368709120;
  END IF;

  RETURN v_available_bytes >= p_required_bytes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's storage statistics
CREATE OR REPLACE FUNCTION get_storage_stats(p_user_id UUID)
RETURNS TABLE(
  total_quota_mb NUMERIC,
  used_mb NUMERIC,
  available_mb NUMERIC,
  usage_percentage NUMERIC,
  total_downloads INTEGER,
  active_downloads INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(q.total_quota_bytes / 1048576.0, 2) as total_quota_mb,
    ROUND(q.used_bytes / 1048576.0, 2) as used_mb,
    ROUND((q.total_quota_bytes - q.used_bytes) / 1048576.0, 2) as available_mb,
    ROUND((q.used_bytes::NUMERIC / q.total_quota_bytes::NUMERIC) * 100, 2) as usage_percentage,
    q.total_downloads,
    (SELECT COUNT(*) FROM public.offline_downloads WHERE user_id = p_user_id AND download_status = 'completed')::INTEGER as active_downloads
  FROM public.offline_storage_quota q
  WHERE q.user_id = p_user_id;

  -- If no record exists, return defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      5120.0::NUMERIC as total_quota_mb,
      0.0::NUMERIC as used_mb,
      5120.0::NUMERIC as available_mb,
      0.0::NUMERIC as usage_percentage,
      0 as total_downloads,
      0 as active_downloads;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old failed downloads
CREATE OR REPLACE FUNCTION cleanup_failed_downloads(p_days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.offline_downloads
  WHERE
    download_status = 'failed'
    AND updated_at < NOW() - (p_days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample storage quota for existing users (if any)
-- INSERT INTO public.offline_storage_quota (user_id, total_quota_bytes, used_bytes)
-- SELECT id, 5368709120, 0
-- FROM auth.users
-- ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE public.offline_downloads IS 'Tracks content downloaded for offline access';
COMMENT ON TABLE public.offline_progress IS 'Tracks user progress made while offline for later sync';
COMMENT ON TABLE public.offline_storage_quota IS 'Tracks storage usage and quota per user';
