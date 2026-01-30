-- India AI Impact Summit - Seven Chakras Resource Hub
-- Migration: Create summit_themes and summit_resources tables
-- Created: 2026-01-30

-- ============================================
-- TABLE: summit_themes (The 7 Chakras)
-- ============================================

CREATE TABLE IF NOT EXISTS public.summit_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  color TEXT NOT NULL DEFAULT 'purple',
  sort_order INTEGER NOT NULL DEFAULT 0,
  resource_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_summit_themes_sort_order ON public.summit_themes(sort_order);
CREATE INDEX IF NOT EXISTS idx_summit_themes_is_active ON public.summit_themes(is_active) WHERE is_active = true;

-- ============================================
-- TABLE: summit_resources
-- ============================================

CREATE TABLE IF NOT EXISTS public.summit_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  theme_id UUID NOT NULL REFERENCES public.summit_themes(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('article', 'paper', 'case-study', 'video', 'tool', 'official-doc', 'dataset', 'report')),
  source TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  featured_order INTEGER DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_summit_resources_theme_id ON public.summit_resources(theme_id);
CREATE INDEX IF NOT EXISTS idx_summit_resources_status ON public.summit_resources(status);
CREATE INDEX IF NOT EXISTS idx_summit_resources_resource_type ON public.summit_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_summit_resources_is_featured ON public.summit_resources(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_summit_resources_created_at ON public.summit_resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summit_resources_view_count ON public.summit_resources(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_summit_resources_tags ON public.summit_resources USING GIN (tags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_summit_resources_search
  ON public.summit_resources
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ============================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ============================================

-- Function to update timestamp (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for summit_themes
DROP TRIGGER IF EXISTS trigger_summit_themes_updated_at ON public.summit_themes;
CREATE TRIGGER trigger_summit_themes_updated_at
  BEFORE UPDATE ON public.summit_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for summit_resources
DROP TRIGGER IF EXISTS trigger_summit_resources_updated_at ON public.summit_resources;
CREATE TRIGGER trigger_summit_resources_updated_at
  BEFORE UPDATE ON public.summit_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Update resource_count on themes
-- ============================================

CREATE OR REPLACE FUNCTION update_summit_theme_resource_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count for old theme (if changed or deleted)
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.theme_id != NEW.theme_id) THEN
    UPDATE public.summit_themes
    SET resource_count = (
      SELECT COUNT(*) FROM public.summit_resources
      WHERE theme_id = OLD.theme_id AND status = 'published'
    )
    WHERE id = OLD.theme_id;
  END IF;

  -- Update count for new theme (if inserted or changed)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.theme_id != NEW.theme_id OR OLD.status != NEW.status)) THEN
    UPDATE public.summit_themes
    SET resource_count = (
      SELECT COUNT(*) FROM public.summit_resources
      WHERE theme_id = NEW.theme_id AND status = 'published'
    )
    WHERE id = NEW.theme_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_summit_resource_count ON public.summit_resources;
CREATE TRIGGER trigger_summit_resource_count
  AFTER INSERT OR UPDATE OR DELETE ON public.summit_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_summit_theme_resource_count();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on both tables
ALTER TABLE public.summit_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summit_resources ENABLE ROW LEVEL SECURITY;

-- Themes: Public read for active themes
DROP POLICY IF EXISTS "Public can view active themes" ON public.summit_themes;
CREATE POLICY "Public can view active themes" ON public.summit_themes
  FOR SELECT USING (is_active = true);

-- Themes: Admin full access
DROP POLICY IF EXISTS "Admin full access to themes" ON public.summit_themes;
CREATE POLICY "Admin full access to themes" ON public.summit_themes
  FOR ALL USING (
    auth.email() = 'hirendra.vikram@aiborg.ai'
  );

-- Resources: Public read for published resources
DROP POLICY IF EXISTS "Public can view published resources" ON public.summit_resources;
CREATE POLICY "Public can view published resources" ON public.summit_resources
  FOR SELECT USING (status = 'published');

-- Resources: Admin full access
DROP POLICY IF EXISTS "Admin full access to resources" ON public.summit_resources;
CREATE POLICY "Admin full access to resources" ON public.summit_resources
  FOR ALL USING (
    auth.email() = 'hirendra.vikram@aiborg.ai'
  );

-- ============================================
-- VIEW: Summit resource statistics by theme
-- ============================================

CREATE OR REPLACE VIEW public.summit_theme_stats AS
SELECT
  t.id as theme_id,
  t.slug as theme_slug,
  t.name as theme_name,
  COUNT(CASE WHEN r.status = 'published' THEN 1 END) as published_count,
  COUNT(CASE WHEN r.status = 'draft' THEN 1 END) as draft_count,
  COUNT(r.id) as total_count,
  COALESCE(SUM(r.view_count), 0) as total_views
FROM public.summit_themes t
LEFT JOIN public.summit_resources r ON t.id = r.theme_id
GROUP BY t.id, t.slug, t.name;

-- ============================================
-- SEED DATA: The 7 Chakras (Themes)
-- ============================================

INSERT INTO public.summit_themes (slug, name, description, icon, color, sort_order) VALUES
  ('safe-trusted-ai', 'Safe & Trusted AI', 'Building AI systems that are secure, transparent, and aligned with human values. Exploring governance frameworks, ethical guidelines, and safety mechanisms for responsible AI deployment.', 'Shield', 'blue', 1),
  ('human-capital', 'Human Capital', 'Developing the workforce for an AI-driven future. Focus on education, upskilling, reskilling, and creating opportunities for all in the age of intelligent systems.', 'Users', 'green', 2),
  ('science', 'Science', 'Advancing fundamental AI research and scientific discovery. Exploring breakthroughs in machine learning, neural networks, and computational intelligence that push the boundaries of what is possible.', 'Microscope', 'purple', 3),
  ('resilience-innovation-efficiency', 'Resilience, Innovation & Efficiency', 'Leveraging AI to build robust systems, drive innovation, and optimize processes across industries. Creating sustainable and adaptable solutions for modern challenges.', 'Lightbulb', 'orange', 4),
  ('inclusion-social-empowerment', 'Inclusion for Social Empowerment', 'Ensuring AI benefits reach all sections of society. Bridging digital divides, promoting accessibility, and using AI to uplift marginalized communities.', 'Heart', 'pink', 5),
  ('democratizing-ai-resources', 'Democratizing AI Resources', 'Making AI tools, knowledge, and infrastructure accessible to everyone. Open-source initiatives, shared platforms, and community-driven development for inclusive innovation.', 'Globe', 'cyan', 6),
  ('economic-growth-social-good', 'Economic Growth & Social Good', 'Harnessing AI to drive economic prosperity while ensuring positive social outcomes. Balancing commercial success with societal benefits and sustainable development.', 'TrendingUp', 'amber', 7)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.summit_themes TO anon, authenticated;
GRANT SELECT ON public.summit_resources TO anon, authenticated;
GRANT ALL ON public.summit_themes TO authenticated;
GRANT ALL ON public.summit_resources TO authenticated;
GRANT SELECT ON public.summit_theme_stats TO anon, authenticated;
