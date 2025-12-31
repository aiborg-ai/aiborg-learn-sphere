-- Knowledge Graph Schema Migration
-- Phase 1: Database Foundation
-- Created: 2025-12-29

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: knowledge_graph_concepts
-- Purpose: Store learning concepts (nodes in the graph)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_graph_concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('skill', 'topic', 'technology', 'technique')),
  difficulty_level VARCHAR(50) NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  description TEXT,
  estimated_hours DECIMAL(5, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_concepts_type ON knowledge_graph_concepts(type) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_concepts_difficulty ON knowledge_graph_concepts(difficulty_level) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_concepts_slug ON knowledge_graph_concepts(slug);
CREATE INDEX IF NOT EXISTS idx_concepts_active ON knowledge_graph_concepts(is_active);

-- =====================================================
-- Table: knowledge_graph_concept_relationships
-- Purpose: Store relationships between concepts (edges in the graph)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_graph_concept_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_concept_id UUID NOT NULL REFERENCES knowledge_graph_concepts(id) ON DELETE CASCADE,
  target_concept_id UUID NOT NULL REFERENCES knowledge_graph_concepts(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
    'prerequisite',
    'related_to',
    'part_of',
    'builds_on',
    'alternative_to'
  )),
  strength DECIMAL(3, 2) NOT NULL DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT different_concepts CHECK (source_concept_id != target_concept_id),
  CONSTRAINT unique_relationship UNIQUE (source_concept_id, target_concept_id, relationship_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_relationships_source ON knowledge_graph_concept_relationships(source_concept_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON knowledge_graph_concept_relationships(target_concept_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON knowledge_graph_concept_relationships(relationship_type);

-- =====================================================
-- Table: knowledge_graph_course_concepts
-- Purpose: Map concepts to courses (which concepts are taught in which courses)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_graph_course_concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES knowledge_graph_concepts(id) ON DELETE CASCADE,
  coverage_level VARCHAR(50) NOT NULL CHECK (coverage_level IN ('introduces', 'covers', 'masters')),
  order_index INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  weight DECIMAL(3, 2) DEFAULT 0.5 CHECK (weight >= 0 AND weight <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_course_concept UNIQUE (course_id, concept_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_concepts_course ON knowledge_graph_course_concepts(course_id);
CREATE INDEX IF NOT EXISTS idx_course_concepts_concept ON knowledge_graph_course_concepts(concept_id);
CREATE INDEX IF NOT EXISTS idx_course_concepts_primary ON knowledge_graph_course_concepts(is_primary) WHERE is_primary = TRUE;

-- =====================================================
-- Table: knowledge_graph_user_mastery
-- Purpose: Track user's mastery level for each concept
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_graph_user_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  concept_id UUID NOT NULL REFERENCES knowledge_graph_concepts(id) ON DELETE CASCADE,
  mastery_level DECIMAL(3, 2) NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 1),
  last_assessed_at TIMESTAMP WITH TIME ZONE,
  confidence_score DECIMAL(3, 2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_concept UNIQUE (user_id, concept_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mastery_user ON knowledge_graph_user_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mastery_concept ON knowledge_graph_user_mastery(concept_id);
CREATE INDEX IF NOT EXISTS idx_user_mastery_level ON knowledge_graph_user_mastery(mastery_level);

-- =====================================================
-- Table: knowledge_graph_mastery_evidence
-- Purpose: Track evidence of mastery (course completions, quiz scores, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_graph_mastery_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  concept_id UUID NOT NULL REFERENCES knowledge_graph_concepts(id) ON DELETE CASCADE,
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN (
    'course_completion',
    'assessment_score',
    'project_completion',
    'manual_assessment',
    'peer_review'
  )),
  evidence_value DECIMAL(3, 2) CHECK (evidence_value >= 0 AND evidence_value <= 1),
  source_id VARCHAR(255), -- Course ID, Assessment ID, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mastery_evidence_user ON knowledge_graph_mastery_evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_evidence_concept ON knowledge_graph_mastery_evidence(concept_id);
CREATE INDEX IF NOT EXISTS idx_mastery_evidence_type ON knowledge_graph_mastery_evidence(evidence_type);

-- =====================================================
-- Function: check_circular_prerequisites
-- Purpose: Prevent circular prerequisite relationships
-- =====================================================
CREATE OR REPLACE FUNCTION check_circular_prerequisites(
  p_source_concept_id UUID,
  p_target_concept_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_cycle BOOLEAN;
BEGIN
  -- Check if adding this relationship would create a cycle
  -- Using recursive CTE to traverse the prerequisite chain
  WITH RECURSIVE prerequisite_chain AS (
    -- Base case: direct prerequisite
    SELECT
      target_concept_id AS concept_id,
      1 AS depth
    FROM knowledge_graph_concept_relationships
    WHERE source_concept_id = p_target_concept_id
      AND relationship_type = 'prerequisite'

    UNION ALL

    -- Recursive case: prerequisites of prerequisites
    SELECT
      r.target_concept_id,
      pc.depth + 1
    FROM knowledge_graph_concept_relationships r
    INNER JOIN prerequisite_chain pc ON pc.concept_id = r.source_concept_id
    WHERE r.relationship_type = 'prerequisite'
      AND pc.depth < 10 -- Prevent infinite loops
  )
  SELECT EXISTS (
    SELECT 1
    FROM prerequisite_chain
    WHERE concept_id = p_source_concept_id
  ) INTO v_has_cycle;

  RETURN v_has_cycle;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: Validate prerequisites before insert
-- =====================================================
CREATE OR REPLACE FUNCTION validate_prerequisite_relationship()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for prerequisite relationships
  IF NEW.relationship_type = 'prerequisite' THEN
    -- Check for circular dependency
    IF check_circular_prerequisites(NEW.source_concept_id, NEW.target_concept_id) THEN
      RAISE EXCEPTION 'Circular prerequisite dependency detected';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_prerequisite
  BEFORE INSERT OR UPDATE ON knowledge_graph_concept_relationships
  FOR EACH ROW
  EXECUTE FUNCTION validate_prerequisite_relationship();

-- =====================================================
-- Function: update_updated_at_column
-- Purpose: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER trigger_concepts_updated_at
  BEFORE UPDATE ON knowledge_graph_concepts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_relationships_updated_at
  BEFORE UPDATE ON knowledge_graph_concept_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_course_concepts_updated_at
  BEFORE UPDATE ON knowledge_graph_course_concepts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_mastery_updated_at
  BEFORE UPDATE ON knowledge_graph_user_mastery
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE knowledge_graph_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_concept_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_course_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_user_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_mastery_evidence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_graph_concepts
-- Anyone can read active concepts
CREATE POLICY "Concepts are viewable by everyone"
  ON knowledge_graph_concepts
  FOR SELECT
  USING (is_active = TRUE);

-- Only admins can modify concepts (you'll need to adjust this based on your auth setup)
CREATE POLICY "Admins can modify concepts"
  ON knowledge_graph_concepts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for knowledge_graph_concept_relationships
-- Anyone can read relationships
CREATE POLICY "Relationships are viewable by everyone"
  ON knowledge_graph_concept_relationships
  FOR SELECT
  USING (TRUE);

-- Only admins can modify relationships
CREATE POLICY "Admins can modify relationships"
  ON knowledge_graph_concept_relationships
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for knowledge_graph_course_concepts
-- Anyone can read course-concept mappings
CREATE POLICY "Course concepts are viewable by everyone"
  ON knowledge_graph_course_concepts
  FOR SELECT
  USING (TRUE);

-- Only admins can modify course-concept mappings
CREATE POLICY "Admins can modify course concepts"
  ON knowledge_graph_course_concepts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for knowledge_graph_user_mastery
-- Users can view their own mastery
CREATE POLICY "Users can view their own mastery"
  ON knowledge_graph_user_mastery
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own mastery (for self-assessment)
CREATE POLICY "Users can update their own mastery"
  ON knowledge_graph_user_mastery
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert mastery records
CREATE POLICY "System can insert mastery records"
  ON knowledge_graph_user_mastery
  FOR INSERT
  WITH CHECK (TRUE);

-- Admins can view all mastery data
CREATE POLICY "Admins can view all mastery"
  ON knowledge_graph_user_mastery
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for knowledge_graph_mastery_evidence
-- Users can view their own evidence
CREATE POLICY "Users can view their own evidence"
  ON knowledge_graph_mastery_evidence
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert evidence
CREATE POLICY "System can insert evidence"
  ON knowledge_graph_mastery_evidence
  FOR INSERT
  WITH CHECK (TRUE);

-- Admins can view all evidence
CREATE POLICY "Admins can view all evidence"
  ON knowledge_graph_mastery_evidence
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- Grant permissions
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on all tables to authenticated users
GRANT SELECT ON knowledge_graph_concepts TO anon, authenticated;
GRANT SELECT ON knowledge_graph_concept_relationships TO anon, authenticated;
GRANT SELECT ON knowledge_graph_course_concepts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON knowledge_graph_user_mastery TO authenticated;
GRANT SELECT, INSERT ON knowledge_graph_mastery_evidence TO authenticated;

-- Grant all permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE knowledge_graph_concepts IS 'Learning concepts (nodes in the knowledge graph)';
COMMENT ON TABLE knowledge_graph_concept_relationships IS 'Relationships between concepts (edges in the knowledge graph)';
COMMENT ON TABLE knowledge_graph_course_concepts IS 'Maps concepts to courses (which concepts are taught where)';
COMMENT ON TABLE knowledge_graph_user_mastery IS 'Tracks user mastery levels for each concept';
COMMENT ON TABLE knowledge_graph_mastery_evidence IS 'Evidence supporting mastery claims (course completions, assessments, etc.)';

COMMENT ON FUNCTION check_circular_prerequisites IS 'Prevents circular prerequisite relationships in the knowledge graph';
COMMENT ON FUNCTION update_updated_at_column IS 'Auto-updates the updated_at timestamp on row modifications';

-- =====================================================
-- Migration complete
-- =====================================================

-- Success message (for migration tracking)
DO $$
BEGIN
  RAISE NOTICE 'Knowledge Graph Schema Migration completed successfully';
  RAISE NOTICE 'Created 5 tables, 2 functions, and RLS policies';
END $$;
