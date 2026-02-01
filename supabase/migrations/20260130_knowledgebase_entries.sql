-- Knowledgebase Entries Migration
-- Creates a comprehensive knowledgebase system with 4 topic types:
-- pioneers (AI influential people), events (conferences/summits),
-- companies (AI companies/startups), research (landmark papers/breakthroughs)

-- Create topic type enum
DO $$ BEGIN
  CREATE TYPE knowledgebase_topic_type AS ENUM ('pioneers', 'events', 'companies', 'research');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create content status enum if not exists
DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create main knowledgebase_entries table
CREATE TABLE IF NOT EXISTS knowledgebase_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core content fields
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,

  -- Topic categorization
  topic_type knowledgebase_topic_type NOT NULL,

  -- Media fields
  featured_image TEXT,
  thumbnail_url TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,

  -- SEO fields
  meta_title VARCHAR(255),
  meta_description TEXT,

  -- Publishing fields
  status content_status DEFAULT 'draft' NOT NULL,
  published_at TIMESTAMPTZ,

  -- Featured/ordering
  featured_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  -- Engagement
  view_count INTEGER DEFAULT 0,

  -- Tags for filtering/search
  tags TEXT[] DEFAULT '{}',

  -- Topic-specific metadata (JSONB for flexibility)
  -- For pioneers: { awards: [], affiliations: [], birth_year: null, country: "", specialty: "" }
  -- For events: { start_date: "", end_date: "", location: "", venue: "", website: "", is_virtual: false }
  -- For companies: { founded_year: null, headquarters: "", website: "", employees: "", funding: "", products: [] }
  -- For research: { authors: [], publication_date: "", journal: "", doi: "", citations: null, abstract: "" }
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledgebase_entries_topic_type ON knowledgebase_entries(topic_type);
CREATE INDEX IF NOT EXISTS idx_knowledgebase_entries_status ON knowledgebase_entries(status);
CREATE INDEX IF NOT EXISTS idx_knowledgebase_entries_published_at ON knowledgebase_entries(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledgebase_entries_slug ON knowledgebase_entries(slug);
CREATE INDEX IF NOT EXISTS idx_knowledgebase_entries_featured ON knowledgebase_entries(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_knowledgebase_entries_tags ON knowledgebase_entries USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_knowledgebase_entries_metadata ON knowledgebase_entries USING gin(metadata);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_knowledgebase_entries_search ON knowledgebase_entries
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')));

-- Enable RLS
ALTER TABLE knowledgebase_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public read access for published entries
CREATE POLICY "knowledgebase_public_read" ON knowledgebase_entries
  FOR SELECT
  USING (status = 'published');

-- Admins can do everything
CREATE POLICY "knowledgebase_admin_all" ON knowledgebase_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND (
        raw_user_meta_data->>'role' = 'admin'
        OR email = 'hirendra.vikram@aiborg.ai'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND (
        raw_user_meta_data->>'role' = 'admin'
        OR email = 'hirendra.vikram@aiborg.ai'
      )
    )
  );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_knowledgebase_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_knowledgebase_entries_updated_at ON knowledgebase_entries;
CREATE TRIGGER trigger_update_knowledgebase_entries_updated_at
  BEFORE UPDATE ON knowledgebase_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledgebase_entries_updated_at();

-- Trigger to set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_knowledgebase_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_knowledgebase_published_at ON knowledgebase_entries;
CREATE TRIGGER trigger_set_knowledgebase_published_at
  BEFORE UPDATE ON knowledgebase_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_knowledgebase_published_at();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_knowledgebase_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- View for topic statistics
CREATE OR REPLACE VIEW knowledgebase_topic_stats AS
SELECT
  topic_type,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
  COUNT(*) as total_count,
  SUM(view_count) FILTER (WHERE status = 'published') as total_views
FROM knowledgebase_entries
GROUP BY topic_type;

-- Grant access to the view
GRANT SELECT ON knowledgebase_topic_stats TO authenticated;
GRANT SELECT ON knowledgebase_topic_stats TO anon;

-- Add comments for documentation
COMMENT ON TABLE knowledgebase_entries IS 'Stores knowledgebase content entries across 4 topics: pioneers, events, companies, research';
COMMENT ON COLUMN knowledgebase_entries.topic_type IS 'Type of knowledgebase entry: pioneers (AI people), events (conferences), companies (AI orgs), research (papers)';
COMMENT ON COLUMN knowledgebase_entries.metadata IS 'Topic-specific metadata stored as JSONB for flexibility';
COMMENT ON COLUMN knowledgebase_entries.tags IS 'Array of tags for filtering and categorization';
