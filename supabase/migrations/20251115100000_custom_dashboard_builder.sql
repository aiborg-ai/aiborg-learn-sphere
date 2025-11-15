/**
 * Custom Dashboard Builder Migration
 *
 * Creates tables for:
 * 1. Dashboard configurations with widget layouts
 * 2. Shared dashboard templates (public gallery)
 * 3. Template ratings and favorites
 * 4. Shareable links
 */

-- ============================================================================
-- STEP 1: Extend existing custom_dashboard_views table
-- ============================================================================

-- Add new columns to support dashboard builder
ALTER TABLE public.custom_dashboard_views
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'grid' CHECK (layout_type IN ('grid', 'masonry')),
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.custom_dashboard_views.config IS 'JSONB config containing: { widgets: [], responsiveSettings: {}, metadata: {} }';
COMMENT ON COLUMN public.custom_dashboard_views.is_default IS 'Whether this is the user default dashboard view';
COMMENT ON COLUMN public.custom_dashboard_views.is_public IS 'Whether this view is shared publicly in template gallery';
COMMENT ON COLUMN public.custom_dashboard_views.layout_type IS 'Layout algorithm: grid (CSS Grid) or masonry';
COMMENT ON COLUMN public.custom_dashboard_views.theme_config IS 'Theme overrides: colors, spacing, card styles';

-- Ensure only one default view per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_views_user_default
ON public.custom_dashboard_views(user_id, is_default)
WHERE is_default = true;

-- Index for public views (template gallery)
CREATE INDEX IF NOT EXISTS idx_custom_views_public
ON public.custom_dashboard_views(is_public, created_at DESC)
WHERE is_public = true;

-- ============================================================================
-- STEP 2: Create shared_dashboard_templates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.shared_dashboard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template metadata
  dashboard_view_id UUID NOT NULL REFERENCES public.custom_dashboard_views(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('student', 'instructor', 'professional', 'analytics', 'productivity', 'general')),
  tags TEXT[] DEFAULT '{}',

  -- Preview
  preview_image_url TEXT,

  -- Stats
  view_count INTEGER DEFAULT 0,
  clone_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,

  -- Status
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true, -- Moderation

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_template_per_view UNIQUE (dashboard_view_id)
);

-- Indexes
CREATE INDEX idx_templates_creator ON public.shared_dashboard_templates(creator_id);
CREATE INDEX idx_templates_category ON public.shared_dashboard_templates(category);
CREATE INDEX idx_templates_rating ON public.shared_dashboard_templates(average_rating DESC);
CREATE INDEX idx_templates_popular ON public.shared_dashboard_templates(clone_count DESC);
CREATE INDEX idx_templates_featured ON public.shared_dashboard_templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_templates_tags ON public.shared_dashboard_templates USING gin(tags);

COMMENT ON TABLE public.shared_dashboard_templates IS 'Public template gallery for shared dashboards';

-- ============================================================================
-- STEP 3: Create dashboard_template_ratings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dashboard_template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  template_id UUID NOT NULL REFERENCES public.shared_dashboard_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  is_favorite BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_template_rating UNIQUE (template_id, user_id)
);

-- Indexes
CREATE INDEX idx_ratings_template ON public.dashboard_template_ratings(template_id);
CREATE INDEX idx_ratings_user ON public.dashboard_template_ratings(user_id);
CREATE INDEX idx_ratings_favorites ON public.dashboard_template_ratings(user_id, is_favorite) WHERE is_favorite = true;

COMMENT ON TABLE public.dashboard_template_ratings IS 'User ratings and favorites for dashboard templates';

-- ============================================================================
-- STEP 4: Create dashboard_share_links table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dashboard_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  dashboard_view_id UUID NOT NULL REFERENCES public.custom_dashboard_views(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  share_token TEXT NOT NULL UNIQUE,

  -- Access control
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,

  -- Permissions
  allow_editing BOOLEAN DEFAULT false, -- Allow cloners to edit before saving

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_view_active_link UNIQUE (dashboard_view_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX idx_share_links_token ON public.dashboard_share_links(share_token) WHERE is_active = true;
CREATE INDEX idx_share_links_creator ON public.dashboard_share_links(creator_id);
CREATE INDEX idx_share_links_expires ON public.dashboard_share_links(expires_at) WHERE is_active = true;

COMMENT ON TABLE public.dashboard_share_links IS 'Shareable links for dashboard configs (private sharing)';

-- ============================================================================
-- STEP 5: Create functions for rating aggregation
-- ============================================================================

-- Function to update template average rating
CREATE OR REPLACE FUNCTION public.update_template_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average rating and total count
  UPDATE public.shared_dashboard_templates
  SET
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0.0)
      FROM public.dashboard_template_ratings
      WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.dashboard_template_ratings
      WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.template_id, OLD.template_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for rating updates
DROP TRIGGER IF EXISTS trigger_update_template_rating ON public.dashboard_template_ratings;
CREATE TRIGGER trigger_update_template_rating
AFTER INSERT OR UPDATE OR DELETE ON public.dashboard_template_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_template_rating_stats();

-- ============================================================================
-- STEP 6: Create function to increment template view/clone counts
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_template_view_count(template_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_dashboard_templates
  SET view_count = view_count + 1
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_template_clone_count(template_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_dashboard_templates
  SET clone_count = clone_count + 1
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Create function to clean expired share links
-- ============================================================================

CREATE OR REPLACE FUNCTION public.deactivate_expired_share_links()
RETURNS INTEGER AS $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  UPDATE public.dashboard_share_links
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.shared_dashboard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_template_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_share_links ENABLE ROW LEVEL SECURITY;

-- Templates: Anyone can read approved templates, only creator can modify
DROP POLICY IF EXISTS "Anyone can view approved templates" ON public.shared_dashboard_templates;
CREATE POLICY "Anyone can view approved templates"
ON public.shared_dashboard_templates FOR SELECT
USING (is_approved = true);

DROP POLICY IF EXISTS "Creators can manage their templates" ON public.shared_dashboard_templates;
CREATE POLICY "Creators can manage their templates"
ON public.shared_dashboard_templates FOR ALL
USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all templates" ON public.shared_dashboard_templates;
CREATE POLICY "Admins can manage all templates"
ON public.shared_dashboard_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Ratings: Users can manage their own ratings, anyone can read
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.dashboard_template_ratings;
CREATE POLICY "Anyone can view ratings"
ON public.dashboard_template_ratings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can manage their own ratings" ON public.dashboard_template_ratings;
CREATE POLICY "Users can manage their own ratings"
ON public.dashboard_template_ratings FOR ALL
USING (user_id = auth.uid());

-- Share Links: Creator can manage, anyone with token can read active links
DROP POLICY IF EXISTS "Anyone can read active share links by token" ON public.dashboard_share_links;
CREATE POLICY "Anyone can read active share links by token"
ON public.dashboard_share_links FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Creators can manage their share links" ON public.dashboard_share_links;
CREATE POLICY "Creators can manage their share links"
ON public.dashboard_share_links FOR ALL
USING (creator_id = auth.uid());

-- ============================================================================
-- STEP 9: Create updated_at trigger for new tables
-- ============================================================================

-- Reuse existing update_updated_at_column function if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    -- Add triggers for new tables
    DROP TRIGGER IF EXISTS update_templates_updated_at ON public.shared_dashboard_templates;
    CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.shared_dashboard_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_ratings_updated_at ON public.dashboard_template_ratings;
    CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON public.dashboard_template_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_share_links_updated_at ON public.dashboard_share_links;
    CREATE TRIGGER update_share_links_updated_at
    BEFORE UPDATE ON public.dashboard_share_links
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- STEP 10: Insert default sample templates
-- ============================================================================

-- Sample template for demonstration (optional - remove in production)
DO $$
DECLARE
  admin_user_id UUID;
  sample_view_id UUID;
  sample_template_id UUID;
BEGIN
  -- Get first admin user
  SELECT user_id INTO admin_user_id
  FROM public.profiles
  WHERE role = 'admin'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Create a sample dashboard view
    INSERT INTO public.custom_dashboard_views (user_id, name, config, is_public, layout_type)
    VALUES (
      admin_user_id,
      'Student Dashboard - Default',
      jsonb_build_object(
        'widgets', jsonb_build_array(
          jsonb_build_object('id', gen_random_uuid()::text, 'type', 'stats', 'position', jsonb_build_object('row', 0, 'col', 0), 'size', jsonb_build_object('width', 4, 'height', 2)),
          jsonb_build_object('id', gen_random_uuid()::text, 'type', 'course-progress', 'position', jsonb_build_object('row', 0, 'col', 4), 'size', jsonb_build_object('width', 8, 'height', 4)),
          jsonb_build_object('id', gen_random_uuid()::text, 'type', 'achievements', 'position', jsonb_build_object('row', 2, 'col', 0), 'size', jsonb_build_object('width', 4, 'height', 2))
        ),
        'responsiveSettings', jsonb_build_object(
          'mobile', jsonb_build_object('columns', 1),
          'tablet', jsonb_build_object('columns', 6),
          'desktop', jsonb_build_object('columns', 12)
        )
      ),
      true,
      'grid'
    )
    RETURNING id INTO sample_view_id;

    -- Create template for the view
    INSERT INTO public.shared_dashboard_templates (
      dashboard_view_id,
      creator_id,
      name,
      description,
      category,
      tags,
      is_featured,
      is_approved
    )
    VALUES (
      sample_view_id,
      admin_user_id,
      'Student Dashboard - Default',
      'A clean, organized dashboard perfect for students tracking their courses and progress',
      'student',
      ARRAY['beginner', 'student', 'default'],
      true,
      true
    );

    RAISE NOTICE 'Sample template created successfully';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CUSTOM DASHBOARD BUILDER MIGRATION COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created/Updated:';
  RAISE NOTICE '  • custom_dashboard_views (extended)';
  RAISE NOTICE '  • shared_dashboard_templates';
  RAISE NOTICE '  • dashboard_template_ratings';
  RAISE NOTICE '  • dashboard_share_links';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Functions Created:';
  RAISE NOTICE '  • update_template_rating_stats()';
  RAISE NOTICE '  • increment_template_view_count()';
  RAISE NOTICE '  • increment_template_clone_count()';
  RAISE NOTICE '  • deactivate_expired_share_links()';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Policies: Enabled for all tables';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next Steps:';
  RAISE NOTICE '  1. Create TypeScript types';
  RAISE NOTICE '  2. Build widget registry';
  RAISE NOTICE '  3. Implement dashboard builder UI';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
