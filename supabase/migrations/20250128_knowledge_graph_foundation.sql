-- =====================================================================
-- Knowledge Graph Foundation Migration
-- Date: 2025-01-28
-- Purpose: Create knowledge graph system for tracking learning concepts,
--          relationships, prerequisites, and user mastery
-- =====================================================================

-- =====================================================================
-- TABLE 1: concepts (Graph Nodes)
-- =====================================================================
-- Represents individual learning concepts (skills, topics, technologies)
-- that can be learned, mastered, and linked together in a knowledge graph

CREATE TABLE IF NOT EXISTS public.concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,

  -- Classification
  type VARCHAR(50) NOT NULL CHECK (type IN ('skill', 'topic', 'technology', 'technique')),
  difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),

  -- Learning Metadata
  estimated_hours DECIMAL(5,2),  -- How long to learn this concept
  metadata JSONB DEFAULT '{}'::jsonb,  -- Extensible metadata (tags, external IDs, etc.)

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_concepts_type ON public.concepts(type);
CREATE INDEX idx_concepts_difficulty ON public.concepts(difficulty_level);
CREATE INDEX idx_concepts_active ON public.concepts(is_active);
CREATE INDEX idx_concepts_slug ON public.concepts(slug);
CREATE INDEX idx_concepts_metadata ON public.concepts USING GIN(metadata);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_concepts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_concepts_updated_at
  BEFORE UPDATE ON public.concepts
  FOR EACH ROW
  EXECUTE FUNCTION update_concepts_updated_at();

-- =====================================================================
-- TABLE 2: concept_relationships (Graph Edges)
-- =====================================================================
-- Defines relationships between concepts (prerequisite, related_to, etc.)

CREATE TABLE IF NOT EXISTS public.concept_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship Definition
  source_concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  target_concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,

  -- Relationship Type
  relationship_type VARCHAR(50) NOT NULL CHECK (
    relationship_type IN ('prerequisite', 'related_to', 'part_of', 'builds_on', 'alternative_to')
  ),

  -- Relationship Strength (0 = weak, 1 = strong)
  strength DECIMAL(3,2) DEFAULT 0.5 CHECK (strength BETWEEN 0 AND 1),

  -- Description (why this relationship exists)
  description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (source_concept_id != target_concept_id),  -- Prevent self-relationships
  UNIQUE(source_concept_id, target_concept_id, relationship_type)  -- One relationship type per pair
);

-- Indexes for graph traversal
CREATE INDEX idx_relationships_source ON public.concept_relationships(source_concept_id);
CREATE INDEX idx_relationships_target ON public.concept_relationships(target_concept_id);
CREATE INDEX idx_relationships_type ON public.concept_relationships(relationship_type);
CREATE INDEX idx_relationships_active ON public.concept_relationships(is_active);

-- Composite indexes for common queries
CREATE INDEX idx_relationships_source_type ON public.concept_relationships(source_concept_id, relationship_type);
CREATE INDEX idx_relationships_target_type ON public.concept_relationships(target_concept_id, relationship_type);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_relationships_updated_at
  BEFORE UPDATE ON public.concept_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_relationships_updated_at();

-- =====================================================================
-- TABLE 3: course_concepts (Links Courses to Concepts)
-- =====================================================================
-- Maps which concepts are taught in which courses, with coverage levels

CREATE TABLE IF NOT EXISTS public.course_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,

  -- Coverage Level (how thoroughly the course teaches this concept)
  coverage_level VARCHAR(20) NOT NULL CHECK (
    coverage_level IN ('introduces', 'covers', 'masters')
  ),

  -- Ordering
  order_index INTEGER NOT NULL DEFAULT 0,  -- Order within the course

  -- Primary Concept Flag
  is_primary BOOLEAN DEFAULT false,  -- Is this a main topic of the course?

  -- Weight (how much of the course focuses on this concept)
  weight DECIMAL(3,2) DEFAULT 0.5 CHECK (weight BETWEEN 0 AND 1),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(course_id, concept_id)  -- Each concept appears once per course
);

-- Indexes for lookups
CREATE INDEX idx_course_concepts_course ON public.course_concepts(course_id);
CREATE INDEX idx_course_concepts_concept ON public.course_concepts(concept_id);
CREATE INDEX idx_course_concepts_primary ON public.course_concepts(is_primary);
CREATE INDEX idx_course_concepts_coverage ON public.course_concepts(coverage_level);

-- =====================================================================
-- TABLE 4: user_concept_mastery (Evidence-Based Mastery Tracking)
-- =====================================================================
-- Tracks user mastery of concepts with evidence points from various sources

CREATE TABLE IF NOT EXISTS public.user_concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,

  -- Mastery Level (calculated from evidence)
  mastery_level VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (
    mastery_level IN ('none', 'beginner', 'intermediate', 'advanced', 'mastered')
  ),

  -- Evidence Points (JSONB array of evidence)
  -- Format: [
  --   {"type": "course_completion", "course_id": "...", "score": 0.95, "date": "2025-01-15"},
  --   {"type": "assessment", "assessment_id": "...", "score": 0.85, "date": "2025-01-20"},
  --   {"type": "practice", "exercise_id": "...", "attempts": 3, "success": true, "date": "2025-01-22"}
  -- ]
  evidence JSONB DEFAULT '[]'::jsonb,

  -- Practice Tracking
  last_practiced TIMESTAMPTZ,

  -- Confidence Score (0-1, based on amount and recency of evidence)
  confidence_score DECIMAL(3,2) DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 1),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, concept_id)  -- One mastery record per user per concept
);

-- Indexes for mastery queries
CREATE INDEX idx_user_mastery_user ON public.user_concept_mastery(user_id);
CREATE INDEX idx_user_mastery_concept ON public.user_concept_mastery(concept_id);
CREATE INDEX idx_user_mastery_level ON public.user_concept_mastery(mastery_level);
CREATE INDEX idx_user_mastery_user_level ON public.user_concept_mastery(user_id, mastery_level);
CREATE INDEX idx_user_mastery_evidence ON public.user_concept_mastery USING GIN(evidence);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_mastery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mastery_updated_at
  BEFORE UPDATE ON public.user_concept_mastery
  FOR EACH ROW
  EXECUTE FUNCTION update_mastery_updated_at();

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Function: Get prerequisite chain for a concept (recursive)
CREATE OR REPLACE FUNCTION get_prerequisite_chain(concept_uuid UUID)
RETURNS TABLE (
  concept_id UUID,
  concept_name VARCHAR(200),
  depth INTEGER,
  relationship_strength DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE prereq_chain AS (
    -- Base case: direct prerequisites
    SELECT
      c.id AS concept_id,
      c.name AS concept_name,
      1 AS depth,
      cr.strength AS relationship_strength
    FROM public.concept_relationships cr
    JOIN public.concepts c ON c.id = cr.source_concept_id
    WHERE cr.target_concept_id = concept_uuid
      AND cr.relationship_type = 'prerequisite'
      AND cr.is_active = true
      AND c.is_active = true

    UNION ALL

    -- Recursive case: prerequisites of prerequisites
    SELECT
      c.id AS concept_id,
      c.name AS concept_name,
      pc.depth + 1 AS depth,
      cr.strength AS relationship_strength
    FROM public.concept_relationships cr
    JOIN public.concepts c ON c.id = cr.source_concept_id
    JOIN prereq_chain pc ON cr.target_concept_id = pc.concept_id
    WHERE cr.relationship_type = 'prerequisite'
      AND cr.is_active = true
      AND c.is_active = true
      AND pc.depth < 10  -- Prevent infinite loops
  )
  SELECT * FROM prereq_chain
  ORDER BY depth, concept_name;
END;
$$ LANGUAGE plpgsql;

-- Function: Check for circular dependencies in prerequisite relationships
CREATE OR REPLACE FUNCTION check_circular_prerequisites(
  source_uuid UUID,
  target_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  has_circular BOOLEAN;
BEGIN
  -- Check if adding this relationship would create a cycle
  -- (i.e., if target is already a prerequisite of source)
  SELECT EXISTS (
    SELECT 1 FROM get_prerequisite_chain(source_uuid)
    WHERE concept_id = target_uuid
  ) INTO has_circular;

  RETURN has_circular;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- ROW-LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_concept_mastery ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- RLS POLICIES: concepts
-- =====================================================================

-- Everyone can read active concepts
CREATE POLICY "Anyone can view active concepts"
  ON public.concepts FOR SELECT
  USING (is_active = true);

-- Only admins can insert concepts
CREATE POLICY "Admins can insert concepts"
  ON public.concepts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update concepts
CREATE POLICY "Admins can update concepts"
  ON public.concepts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete concepts (soft delete by setting is_active = false)
CREATE POLICY "Admins can delete concepts"
  ON public.concepts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================================
-- RLS POLICIES: concept_relationships
-- =====================================================================

-- Everyone can read active relationships
CREATE POLICY "Anyone can view active relationships"
  ON public.concept_relationships FOR SELECT
  USING (is_active = true);

-- Only admins can manage relationships
CREATE POLICY "Admins can insert relationships"
  ON public.concept_relationships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update relationships"
  ON public.concept_relationships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete relationships"
  ON public.concept_relationships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================================
-- RLS POLICIES: course_concepts
-- =====================================================================

-- Everyone can read course-concept mappings
CREATE POLICY "Anyone can view course concepts"
  ON public.course_concepts FOR SELECT
  USING (true);

-- Only admins can manage course-concept mappings
CREATE POLICY "Admins can insert course concepts"
  ON public.course_concepts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update course concepts"
  ON public.course_concepts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete course concepts"
  ON public.course_concepts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================================
-- RLS POLICIES: user_concept_mastery
-- =====================================================================

-- Users can read their own mastery records
CREATE POLICY "Users can view own mastery"
  ON public.user_concept_mastery FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own mastery records
CREATE POLICY "Users can insert own mastery"
  ON public.user_concept_mastery FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own mastery records
CREATE POLICY "Users can update own mastery"
  ON public.user_concept_mastery FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all mastery records
CREATE POLICY "Admins can view all mastery"
  ON public.user_concept_mastery FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================================
-- SEED DATA: Initial Concepts
-- =====================================================================
-- Create a basic set of programming concepts to test with

-- Insert foundational concepts
INSERT INTO public.concepts (name, slug, description, type, difficulty_level, estimated_hours, is_active)
VALUES
  -- Programming Fundamentals
  ('Variables', 'variables', 'Understanding how to store and manipulate data using variables', 'skill', 'beginner', 2.0, true),
  ('Data Types', 'data-types', 'Understanding different types of data (strings, numbers, booleans, etc.)', 'skill', 'beginner', 3.0, true),
  ('Conditional Logic', 'conditional-logic', 'Using if/else statements to control program flow', 'skill', 'beginner', 4.0, true),
  ('Loops', 'loops', 'Repeating code execution with for and while loops', 'skill', 'beginner', 5.0, true),
  ('Functions', 'functions', 'Creating reusable blocks of code with functions', 'skill', 'intermediate', 6.0, true),
  ('Arrays and Lists', 'arrays-lists', 'Working with ordered collections of data', 'skill', 'intermediate', 5.0, true),
  ('Object-Oriented Programming', 'oop', 'Understanding classes, objects, and inheritance', 'technique', 'intermediate', 12.0, true),
  ('Algorithms', 'algorithms', 'Problem-solving approaches and computational thinking', 'topic', 'intermediate', 20.0, true),
  ('Data Structures', 'data-structures', 'Organizing data efficiently (trees, graphs, hash tables)', 'topic', 'advanced', 25.0, true),
  ('API Integration', 'api-integration', 'Connecting to and using external APIs', 'skill', 'intermediate', 8.0, true),

  -- Python Specific
  ('Python Basics', 'python-basics', 'Fundamental Python syntax and concepts', 'technology', 'beginner', 10.0, true),
  ('Python Lists', 'python-lists', 'Working with Python list data structure', 'skill', 'beginner', 3.0, true),
  ('Python Dictionaries', 'python-dictionaries', 'Using key-value pairs in Python', 'skill', 'beginner', 4.0, true),

  -- JavaScript Specific
  ('JavaScript Basics', 'javascript-basics', 'Fundamental JavaScript syntax and concepts', 'technology', 'beginner', 10.0, true),
  ('Asynchronous JavaScript', 'async-javascript', 'Promises, async/await, and callbacks', 'technique', 'intermediate', 8.0, true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- SEED DATA: Initial Relationships
-- =====================================================================
-- Create prerequisite chains and relationships

-- Get concept IDs (we need to query them since UUIDs are generated)
DO $$
DECLARE
  var_variables UUID;
  var_data_types UUID;
  var_conditional UUID;
  var_loops UUID;
  var_functions UUID;
  var_arrays UUID;
  var_oop UUID;
  var_algorithms UUID;
  var_data_structures UUID;
  var_api UUID;
  var_python_basics UUID;
  var_python_lists UUID;
  var_python_dicts UUID;
  var_js_basics UUID;
  var_async_js UUID;
BEGIN
  -- Fetch all concept IDs
  SELECT id INTO var_variables FROM public.concepts WHERE slug = 'variables';
  SELECT id INTO var_data_types FROM public.concepts WHERE slug = 'data-types';
  SELECT id INTO var_conditional FROM public.concepts WHERE slug = 'conditional-logic';
  SELECT id INTO var_loops FROM public.concepts WHERE slug = 'loops';
  SELECT id INTO var_functions FROM public.concepts WHERE slug = 'functions';
  SELECT id INTO var_arrays FROM public.concepts WHERE slug = 'arrays-lists';
  SELECT id INTO var_oop FROM public.concepts WHERE slug = 'oop';
  SELECT id INTO var_algorithms FROM public.concepts WHERE slug = 'algorithms';
  SELECT id INTO var_data_structures FROM public.concepts WHERE slug = 'data-structures';
  SELECT id INTO var_api FROM public.concepts WHERE slug = 'api-integration';
  SELECT id INTO var_python_basics FROM public.concepts WHERE slug = 'python-basics';
  SELECT id INTO var_python_lists FROM public.concepts WHERE slug = 'python-lists';
  SELECT id INTO var_python_dicts FROM public.concepts WHERE slug = 'python-dictionaries';
  SELECT id INTO var_js_basics FROM public.concepts WHERE slug = 'javascript-basics';
  SELECT id INTO var_async_js FROM public.concepts WHERE slug = 'async-javascript';

  -- Insert prerequisite relationships
  INSERT INTO public.concept_relationships (source_concept_id, target_concept_id, relationship_type, strength, description)
  VALUES
    -- Variables → Data Types (must understand variables to learn data types)
    (var_variables, var_data_types, 'prerequisite', 0.9, 'Must understand variables before working with different data types'),

    -- Data Types → Conditional Logic
    (var_data_types, var_conditional, 'prerequisite', 0.8, 'Must understand data types to write conditional logic'),

    -- Conditional Logic → Loops
    (var_conditional, var_loops, 'prerequisite', 0.7, 'Conditional logic is foundational to understanding loops'),

    -- Variables → Loops (also needs variables)
    (var_variables, var_loops, 'prerequisite', 0.8, 'Must understand variables to use them in loops'),

    -- Loops → Functions
    (var_loops, var_functions, 'prerequisite', 0.6, 'Understanding loops helps when learning functions'),

    -- Variables → Functions
    (var_variables, var_functions, 'prerequisite', 0.9, 'Functions use variables extensively'),

    -- Data Types → Arrays
    (var_data_types, var_arrays, 'prerequisite', 0.9, 'Arrays are a data type'),

    -- Functions → OOP
    (var_functions, var_oop, 'prerequisite', 0.9, 'Must understand functions before learning OOP'),

    -- Arrays → Data Structures
    (var_arrays, var_data_structures, 'prerequisite', 0.8, 'Arrays are the simplest data structure'),

    -- Loops → Algorithms
    (var_loops, var_algorithms, 'prerequisite', 0.7, 'Algorithms often use loops'),

    -- Functions → Algorithms
    (var_functions, var_algorithms, 'prerequisite', 0.8, 'Algorithms are implemented as functions'),

    -- Functions → API Integration
    (var_functions, var_api, 'prerequisite', 0.7, 'API calls are typically made with functions'),

    -- JavaScript Basics → Async JavaScript
    (var_js_basics, var_async_js, 'prerequisite', 0.9, 'Must learn JavaScript basics before async concepts')
  ON CONFLICT (source_concept_id, target_concept_id, relationship_type) DO NOTHING;

  -- Insert "part_of" hierarchical relationships
  INSERT INTO public.concept_relationships (source_concept_id, target_concept_id, relationship_type, strength, description)
  VALUES
    -- Python Basics contains Python Lists
    (var_python_basics, var_python_lists, 'part_of', 0.8, 'Lists are a fundamental part of Python'),

    -- Python Basics contains Python Dictionaries
    (var_python_basics, var_python_dicts, 'part_of', 0.8, 'Dictionaries are a fundamental part of Python')
  ON CONFLICT (source_concept_id, target_concept_id, relationship_type) DO NOTHING;

  -- Insert "builds_on" relationships
  INSERT INTO public.concept_relationships (source_concept_id, target_concept_id, relationship_type, strength, description)
  VALUES
    -- Algorithms builds on Conditional Logic
    (var_conditional, var_algorithms, 'builds_on', 0.7, 'Algorithms use conditional logic extensively'),

    -- Data Structures builds on Arrays
    (var_arrays, var_data_structures, 'builds_on', 0.9, 'Complex data structures extend array concepts')
  ON CONFLICT (source_concept_id, target_concept_id, relationship_type) DO NOTHING;

  -- Insert "related_to" relationships
  INSERT INTO public.concept_relationships (source_concept_id, target_concept_id, relationship_type, strength, description)
  VALUES
    -- Python Lists related to Arrays
    (var_python_lists, var_arrays, 'related_to', 0.9, 'Python lists implement the array concept'),

    -- Python Basics related to Variables
    (var_python_basics, var_variables, 'related_to', 0.8, 'Python teaches variables in a specific way'),

    -- JavaScript Basics related to Variables
    (var_js_basics, var_variables, 'related_to', 0.8, 'JavaScript teaches variables in a specific way'),

    -- OOP related to Data Structures
    (var_oop, var_data_structures, 'related_to', 0.6, 'OOP is often used to implement data structures')
  ON CONFLICT (source_concept_id, target_concept_id, relationship_type) DO NOTHING;

END $$;

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================
-- Run these to verify the migration succeeded

-- Count concepts by type
-- SELECT type, COUNT(*) FROM public.concepts GROUP BY type;

-- Count relationships by type
-- SELECT relationship_type, COUNT(*) FROM public.concept_relationships GROUP BY relationship_type;

-- Test prerequisite chain function
-- SELECT * FROM get_prerequisite_chain((SELECT id FROM public.concepts WHERE slug = 'oop'));

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

COMMENT ON TABLE public.concepts IS 'Knowledge graph nodes representing learning concepts';
COMMENT ON TABLE public.concept_relationships IS 'Knowledge graph edges defining relationships between concepts';
COMMENT ON TABLE public.course_concepts IS 'Maps courses to the concepts they teach';
COMMENT ON TABLE public.user_concept_mastery IS 'Tracks user mastery of concepts with evidence-based scoring';
