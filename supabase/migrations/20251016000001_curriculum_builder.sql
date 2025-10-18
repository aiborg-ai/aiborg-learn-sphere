-- ===================================================================
-- AI-POWERED CURRICULUM BUILDER SYSTEM
-- Creates tables for AI-generated custom curricula per learner profile
-- ===================================================================

-- ===================================================================
-- 1. USER CURRICULA TABLE
-- Custom learning paths created for each profile
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.learner_profiles(id) ON DELETE CASCADE,

  curriculum_name TEXT NOT NULL,
  description TEXT,

  -- AI Generation metadata
  generated_by_ai BOOLEAN DEFAULT true,
  ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
  generation_metadata JSONB DEFAULT '{}'::jsonb,

  -- Curriculum characteristics
  difficulty_progression TEXT CHECK (difficulty_progression IN ('linear', 'adaptive', 'mixed')) DEFAULT 'linear',
  estimated_completion_weeks INTEGER CHECK (estimated_completion_weeks > 0),
  estimated_total_hours INTEGER CHECK (estimated_total_hours > 0),

  -- Course composition counts
  total_courses INTEGER DEFAULT 0 CHECK (total_courses >= 0),
  required_courses_count INTEGER DEFAULT 0 CHECK (required_courses_count >= 0),
  elective_courses_count INTEGER DEFAULT 0 CHECK (elective_courses_count >= 0),

  -- Status and versioning
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  draft_version INTEGER DEFAULT 1 CHECK (draft_version > 0),

  -- Progress tracking
  progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  courses_completed INTEGER DEFAULT 0 CHECK (courses_completed >= 0),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_curriculum_name_length CHECK (LENGTH(curriculum_name) >= 3 AND LENGTH(curriculum_name) <= 150),
  CONSTRAINT required_lte_total CHECK (required_courses_count <= total_courses),
  CONSTRAINT courses_completed_lte_total CHECK (courses_completed <= total_courses),
  CONSTRAINT valid_generation_metadata CHECK (
    NOT generated_by_ai OR
    (generation_metadata IS NOT NULL AND generation_metadata != '{}'::jsonb)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_curricula_user_id ON public.user_curricula(user_id);
CREATE INDEX IF NOT EXISTS idx_user_curricula_profile_id ON public.user_curricula(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_curricula_is_active ON public.user_curricula(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_curricula_is_published ON public.user_curricula(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_user_curricula_user_active ON public.user_curricula(user_id, is_active) WHERE is_active = true;

COMMENT ON TABLE public.user_curricula IS
'AI-generated custom learning curricula for user profiles. Each curriculum contains a curated sequence of courses.';

-- ===================================================================
-- 2. CURRICULUM COURSES (Many-to-Many with Rich Metadata)
-- Links courses to curricula with ordering and AI recommendation data
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.curriculum_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID NOT NULL REFERENCES public.user_curricula(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,

  -- Course positioning and grouping
  sequence_order INTEGER NOT NULL CHECK (sequence_order > 0),
  module_name TEXT,

  -- AI Recommendation details
  ai_recommended BOOLEAN DEFAULT true,
  recommendation_score DECIMAL(3,2) CHECK (recommendation_score >= 0 AND recommendation_score <= 1),
  recommendation_reason TEXT,
  skill_gaps_addressed TEXT[],

  -- User actions
  user_approved BOOLEAN DEFAULT NULL,
  user_notes TEXT,
  is_required BOOLEAN DEFAULT false,

  -- Prerequisites within curriculum
  depends_on_course_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],

  -- Scheduling
  suggested_start_date DATE,
  suggested_end_date DATE,
  actual_enrolled_at TIMESTAMPTZ,
  actual_completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(curriculum_id, course_id),
  CONSTRAINT valid_recommendation_reason_length CHECK (
    recommendation_reason IS NULL OR LENGTH(recommendation_reason) <= 500
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_curriculum_courses_curriculum ON public.curriculum_courses(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_courses_course ON public.curriculum_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_courses_sequence ON public.curriculum_courses(curriculum_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_curriculum_courses_approved ON public.curriculum_courses(user_approved);
CREATE INDEX IF NOT EXISTS idx_curriculum_courses_enrolled ON public.curriculum_courses(actual_enrolled_at) WHERE actual_enrolled_at IS NOT NULL;

COMMENT ON TABLE public.curriculum_courses IS
'Junction table linking courses to curricula with AI recommendation scores, user approvals, and sequencing information.';

-- ===================================================================
-- 3. CURRICULUM GENERATION JOBS
-- Tracks AI curriculum generation requests and results
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.curriculum_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.learner_profiles(id) ON DELETE CASCADE,

  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',

  -- Input parameters for generation
  input_parameters JSONB DEFAULT '{}'::jsonb,

  -- Output results
  generated_curriculum_id UUID REFERENCES public.user_curricula(id) ON DELETE SET NULL,
  courses_recommended INTEGER DEFAULT 0,
  generation_time_ms INTEGER,

  -- AI algorithm details
  algorithm_version TEXT DEFAULT 'v1.0',
  model_used TEXT DEFAULT 'irt_gap_analysis',

  -- Error handling
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 3),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user ON public.curriculum_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_profile ON public.curriculum_generation_jobs(profile_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON public.curriculum_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created ON public.curriculum_generation_jobs(created_at DESC);

COMMENT ON TABLE public.curriculum_generation_jobs IS
'Tracks AI curriculum generation requests, processing status, and performance metrics.';

-- ===================================================================
-- 4. CURRICULUM MODULES (Optional Grouping)
-- Organizes courses into logical modules within a curriculum
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.curriculum_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID NOT NULL REFERENCES public.user_curricula(id) ON DELETE CASCADE,

  module_order INTEGER NOT NULL CHECK (module_order > 0),
  module_name TEXT NOT NULL,
  module_description TEXT,

  -- Module characteristics
  estimated_weeks INTEGER CHECK (estimated_weeks > 0),
  difficulty_level TEXT CHECK (difficulty_level IN ('foundation', 'intermediate', 'advanced', 'expert')),

  -- Progress
  courses_in_module INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(curriculum_id, module_order),
  CONSTRAINT valid_module_name_length CHECK (LENGTH(module_name) >= 3 AND LENGTH(module_name) <= 100)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_modules_curriculum ON public.curriculum_modules(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_modules_order ON public.curriculum_modules(curriculum_id, module_order);

COMMENT ON TABLE public.curriculum_modules IS
'Optional grouping of courses into modules (e.g., Foundation, Application, Mastery) within a curriculum.';

-- ===================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- Enable RLS
ALTER TABLE public.user_curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_modules ENABLE ROW LEVEL SECURITY;

-- User Curricula Policies
CREATE POLICY "Users can view their own curricula"
  ON public.user_curricula FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own curricula"
  ON public.user_curricula FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own curricula"
  ON public.user_curricula FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own curricula"
  ON public.user_curricula FOR DELETE
  USING (auth.uid() = user_id);

-- Curriculum Courses Policies
CREATE POLICY "Users can view courses in their curricula"
  ON public.curriculum_courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_curricula c
      WHERE c.id = curriculum_courses.curriculum_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add courses to their curricula"
  ON public.curriculum_courses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_curricula c
      WHERE c.id = curriculum_courses.curriculum_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update courses in their curricula"
  ON public.curriculum_courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_curricula c
      WHERE c.id = curriculum_courses.curriculum_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove courses from their curricula"
  ON public.curriculum_courses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_curricula c
      WHERE c.id = curriculum_courses.curriculum_id AND c.user_id = auth.uid()
    )
  );

-- Curriculum Generation Jobs Policies
CREATE POLICY "Users can view their own generation jobs"
  ON public.curriculum_generation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create generation jobs"
  ON public.curriculum_generation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update generation jobs"
  ON public.curriculum_generation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Curriculum Modules Policies
CREATE POLICY "Users can view modules in their curricula"
  ON public.curriculum_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_curricula c
      WHERE c.id = curriculum_modules.curriculum_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage modules in their curricula"
  ON public.curriculum_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_curricula c
      WHERE c.id = curriculum_modules.curriculum_id AND c.user_id = auth.uid()
    )
  );

-- ===================================================================
-- 6. FUNCTIONS
-- ===================================================================

-- Function to update curriculum updated_at timestamp
CREATE OR REPLACE FUNCTION update_curriculum_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_curriculum_timestamp
BEFORE UPDATE ON public.user_curricula
FOR EACH ROW
EXECUTE FUNCTION update_curriculum_timestamp();

CREATE TRIGGER trigger_update_curriculum_course_timestamp
BEFORE UPDATE ON public.curriculum_courses
FOR EACH ROW
EXECUTE FUNCTION update_curriculum_timestamp();

-- Function to recalculate curriculum course counts
CREATE OR REPLACE FUNCTION recalculate_curriculum_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_curricula
  SET
    total_courses = (
      SELECT COUNT(*)
      FROM public.curriculum_courses cc
      WHERE cc.curriculum_id = COALESCE(NEW.curriculum_id, OLD.curriculum_id)
    ),
    required_courses_count = (
      SELECT COUNT(*)
      FROM public.curriculum_courses cc
      WHERE cc.curriculum_id = COALESCE(NEW.curriculum_id, OLD.curriculum_id)
        AND cc.is_required = true
    ),
    elective_courses_count = (
      SELECT COUNT(*)
      FROM public.curriculum_courses cc
      WHERE cc.curriculum_id = COALESCE(NEW.curriculum_id, OLD.curriculum_id)
        AND (cc.is_required = false OR cc.is_required IS NULL)
    ),
    courses_completed = (
      SELECT COUNT(*)
      FROM public.curriculum_courses cc
      WHERE cc.curriculum_id = COALESCE(NEW.curriculum_id, OLD.curriculum_id)
        AND cc.actual_completed_at IS NOT NULL
    )
  WHERE id = COALESCE(NEW.curriculum_id, OLD.curriculum_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_counts_insert
AFTER INSERT ON public.curriculum_courses
FOR EACH ROW
EXECUTE FUNCTION recalculate_curriculum_counts();

CREATE TRIGGER trigger_recalculate_counts_update
AFTER UPDATE ON public.curriculum_courses
FOR EACH ROW
EXECUTE FUNCTION recalculate_curriculum_counts();

CREATE TRIGGER trigger_recalculate_counts_delete
AFTER DELETE ON public.curriculum_courses
FOR EACH ROW
EXECUTE FUNCTION recalculate_curriculum_counts();

-- Function to calculate curriculum progress percentage
CREATE OR REPLACE FUNCTION calculate_curriculum_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_total_courses INTEGER;
  v_completed_courses INTEGER;
  v_progress DECIMAL(5,2);
BEGIN
  SELECT total_courses, courses_completed
  INTO v_total_courses, v_completed_courses
  FROM public.user_curricula
  WHERE id = NEW.curriculum_id;

  IF v_total_courses > 0 THEN
    v_progress := (v_completed_courses::DECIMAL / v_total_courses::DECIMAL) * 100;

    UPDATE public.user_curricula
    SET progress_percentage = v_progress,
        completed_at = CASE
          WHEN v_progress >= 100 THEN NOW()
          ELSE NULL
        END
    WHERE id = NEW.curriculum_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_progress
AFTER UPDATE OF actual_completed_at ON public.curriculum_courses
FOR EACH ROW
WHEN (NEW.actual_completed_at IS NOT NULL AND OLD.actual_completed_at IS NULL)
EXECUTE FUNCTION calculate_curriculum_progress();

-- Function to create default modules for a curriculum
CREATE OR REPLACE FUNCTION create_default_curriculum_modules(p_curriculum_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.curriculum_modules (curriculum_id, module_order, module_name, module_description, difficulty_level)
  VALUES
    (p_curriculum_id, 1, 'Foundation', 'Build fundamental knowledge and core concepts', 'foundation'),
    (p_curriculum_id, 2, 'Application', 'Apply knowledge through practical projects', 'intermediate'),
    (p_curriculum_id, 3, 'Mastery', 'Advanced techniques and specialization', 'advanced')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to get next available sequence order
CREATE OR REPLACE FUNCTION get_next_sequence_order(p_curriculum_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_max_order INTEGER;
BEGIN
  SELECT COALESCE(MAX(sequence_order), 0) + 1
  INTO v_max_order
  FROM public.curriculum_courses
  WHERE curriculum_id = p_curriculum_id;

  RETURN v_max_order;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 7. VIEWS
-- ===================================================================

-- View: Curriculum with full details
CREATE OR REPLACE VIEW public.curricula_full_details AS
SELECT
  c.id,
  c.user_id,
  c.profile_id,
  c.curriculum_name,
  c.description,
  c.generated_by_ai,
  c.ai_confidence_score,
  c.difficulty_progression,
  c.estimated_completion_weeks,
  c.estimated_total_hours,
  c.total_courses,
  c.required_courses_count,
  c.elective_courses_count,
  c.is_active,
  c.is_published,
  c.progress_percentage,
  c.courses_completed,
  c.started_at,
  c.completed_at,
  c.created_at,
  c.updated_at,
  -- Profile info
  p.profile_name,
  p.learning_goals,
  p.experience_level,
  -- Course count details
  (SELECT COUNT(*) FROM public.curriculum_courses cc WHERE cc.curriculum_id = c.id AND cc.user_approved = true) as approved_courses_count,
  (SELECT COUNT(*) FROM public.curriculum_courses cc WHERE cc.curriculum_id = c.id AND cc.user_approved = false) as rejected_courses_count,
  (SELECT COUNT(*) FROM public.curriculum_courses cc WHERE cc.curriculum_id = c.id AND cc.user_approved IS NULL) as pending_courses_count
FROM public.user_curricula c
LEFT JOIN public.learner_profiles p ON c.profile_id = p.id;

-- ===================================================================
-- 8. GRANT PERMISSIONS
-- ===================================================================

GRANT ALL ON public.user_curricula TO authenticated;
GRANT ALL ON public.curriculum_courses TO authenticated;
GRANT ALL ON public.curriculum_generation_jobs TO authenticated;
GRANT ALL ON public.curriculum_modules TO authenticated;
GRANT SELECT ON public.curricula_full_details TO authenticated;

-- ===================================================================
-- SUCCESS!
-- ===================================================================

COMMENT ON SCHEMA public IS
'Curriculum Builder system successfully created. AI can now generate personalized learning paths!';
