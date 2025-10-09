-- ============================================================================
-- USER RESOURCES SYSTEM
-- Description: System for admins to upload and allocate resources to users
-- Date: 2025-10-09
-- ============================================================================

-- ============================================================================
-- 1. USER_RESOURCES TABLE
-- ============================================================================
-- Stores PDFs, documents, and video links that can be allocated to users

CREATE TABLE IF NOT EXISTS public.user_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Resource metadata
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (
    resource_type IN ('pdf', 'video_link', 'document', 'presentation')
  ),

  -- File/URL information
  file_url TEXT, -- For uploaded PDFs/documents
  video_url TEXT, -- For video links (YouTube, Vimeo, etc.)
  thumbnail_url TEXT, -- Thumbnail for video links or PDF preview
  file_size BIGINT, -- File size in bytes
  duration INTEGER, -- Video duration in seconds (optional)

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  category TEXT, -- Optional categorization

  -- Management
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation: Either file_url OR video_url must be present
  CONSTRAINT valid_resource_url CHECK (
    (file_url IS NOT NULL AND video_url IS NULL) OR
    (file_url IS NULL AND video_url IS NOT NULL)
  )
);

-- Indexes for user_resources
CREATE INDEX idx_user_resources_type ON public.user_resources(resource_type);
CREATE INDEX idx_user_resources_active ON public.user_resources(is_active) WHERE is_active = true;
CREATE INDEX idx_user_resources_created_by ON public.user_resources(created_by);
CREATE INDEX idx_user_resources_created_at ON public.user_resources(created_at DESC);
CREATE INDEX idx_user_resources_category ON public.user_resources(category) WHERE category IS NOT NULL;

-- GIN index for tags array
CREATE INDEX idx_user_resources_tags ON public.user_resources USING GIN(tags);

-- ============================================================================
-- 2. USER_RESOURCE_ALLOCATIONS TABLE
-- ============================================================================
-- Maps resources to specific users (allocation/assignment table)

CREATE TABLE IF NOT EXISTS public.user_resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  resource_id UUID NOT NULL REFERENCES public.user_resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Allocation metadata
  allocated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiration date

  -- Status and notes
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT, -- Admin notes about this allocation

  -- Tracking
  viewed_at TIMESTAMPTZ, -- When user first viewed this resource
  view_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ, -- Last time user accessed

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate allocations
  UNIQUE(resource_id, user_id)
);

-- Indexes for user_resource_allocations
CREATE INDEX idx_resource_allocations_resource ON public.user_resource_allocations(resource_id);
CREATE INDEX idx_resource_allocations_user ON public.user_resource_allocations(user_id);
CREATE INDEX idx_resource_allocations_allocated_by ON public.user_resource_allocations(allocated_by);
CREATE INDEX idx_resource_allocations_active ON public.user_resource_allocations(is_active) WHERE is_active = true;
CREATE INDEX idx_resource_allocations_expires ON public.user_resource_allocations(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_resource_allocations_user_active ON public.user_resource_allocations(user_id, is_active) WHERE is_active = true;

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Trigger for updated_at on user_resources
CREATE TRIGGER update_user_resources_updated_at
  BEFORE UPDATE ON public.user_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on user_resource_allocations
CREATE TRIGGER update_user_resource_allocations_updated_at
  BEFORE UPDATE ON public.user_resource_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_resource_allocations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER_RESOURCES POLICIES
-- ============================================================================

-- Admins can view all resources
CREATE POLICY "Admins can view all user resources"
  ON public.user_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can create resources
CREATE POLICY "Admins can create user resources"
  ON public.user_resources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update resources
CREATE POLICY "Admins can update user resources"
  ON public.user_resources
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can delete resources
CREATE POLICY "Admins can delete user resources"
  ON public.user_resources
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Users can view resources allocated to them
CREATE POLICY "Users can view their allocated resources"
  ON public.user_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_resource_allocations
      WHERE user_resource_allocations.resource_id = user_resources.id
      AND user_resource_allocations.user_id = auth.uid()
      AND user_resource_allocations.is_active = true
      AND user_resources.is_active = true
      AND (
        user_resource_allocations.expires_at IS NULL
        OR user_resource_allocations.expires_at > NOW()
      )
    )
  );

-- ============================================================================
-- USER_RESOURCE_ALLOCATIONS POLICIES
-- ============================================================================

-- Admins can view all allocations
CREATE POLICY "Admins can view all resource allocations"
  ON public.user_resource_allocations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can create allocations
CREATE POLICY "Admins can create resource allocations"
  ON public.user_resource_allocations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update allocations
CREATE POLICY "Admins can update resource allocations"
  ON public.user_resource_allocations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can delete allocations
CREATE POLICY "Admins can delete resource allocations"
  ON public.user_resource_allocations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own allocations
CREATE POLICY "Users can view their own resource allocations"
  ON public.user_resource_allocations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own allocation tracking (view_count, viewed_at, last_accessed_at)
CREATE POLICY "Users can update their allocation tracking"
  ON public.user_resource_allocations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. STORAGE BUCKET (Optional - can reuse course-materials)
-- ============================================================================

-- Create bucket for user resources if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-resources',
  'user-resources',
  false, -- Private bucket - only allocated users can access
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-resources bucket
CREATE POLICY "Admins can upload to user-resources bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-resources'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update user-resources"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'user-resources'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete from user-resources bucket"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-resources'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Users can view files if they have an active allocation
CREATE POLICY "Users can view allocated resources"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-resources'
    AND (
      -- Admins can view all
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
      )
      OR
      -- Users can view if allocated
      EXISTS (
        SELECT 1
        FROM public.user_resource_allocations ura
        JOIN public.user_resources ur ON ur.id = ura.resource_id
        WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND ur.is_active = true
        AND ur.file_url LIKE '%' || name || '%'
        AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
      )
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's active resource count
CREATE OR REPLACE FUNCTION get_user_resource_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.user_resource_allocations ura
  JOIN public.user_resources ur ON ur.id = ura.resource_id
  WHERE ura.user_id = p_user_id
  AND ura.is_active = true
  AND ur.is_active = true
  AND (ura.expires_at IS NULL OR ura.expires_at > NOW());

  RETURN v_count;
END;
$$;

-- Function to track resource views
CREATE OR REPLACE FUNCTION track_resource_view(
  p_resource_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_resource_allocations
  SET
    view_count = view_count + 1,
    viewed_at = COALESCE(viewed_at, NOW()),
    last_accessed_at = NOW(),
    updated_at = NOW()
  WHERE resource_id = p_resource_id
  AND user_id = p_user_id;
END;
$$;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_resources IS 'Resources (PDFs, videos) that can be allocated to users by admins';
COMMENT ON TABLE public.user_resource_allocations IS 'Maps resources to users with allocation tracking';
COMMENT ON FUNCTION get_user_resource_count IS 'Get count of active resources allocated to a user';
COMMENT ON FUNCTION track_resource_view IS 'Track when a user views a resource';
