-- AI-Powered Personalized Learning Paths System
-- Creates tables and functions for generating custom learning paths based on assessment results

-- =====================================================
-- 1. USER LEARNING GOALS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_learning_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.user_ai_assessments(id) ON DELETE SET NULL,

  goal_title TEXT NOT NULL,
  goal_description TEXT,

  -- Target levels
  current_augmentation_level TEXT CHECK (current_augmentation_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  target_augmentation_level TEXT CHECK (target_augmentation_level IN ('beginner', 'intermediate', 'advanced', 'expert')) NOT NULL,

  -- IRT-based metrics
  current_irt_ability DECIMAL(4,2),
  target_irt_ability DECIMAL(4,2),

  -- Focus areas
  focus_category_ids UUID[], -- Array of assessment_categories IDs
  focus_skills TEXT[], -- Specific skills to improve

  -- Timeline
  target_completion_date DATE,
  estimated_weeks INTEGER,
  hours_per_week INTEGER DEFAULT 5,

  -- Preferences
  preferred_learning_style TEXT CHECK (preferred_learning_style IN ('visual', 'reading', 'hands-on', 'mixed')),
  include_workshops BOOLEAN DEFAULT true,
  include_events BOOLEAN DEFAULT true,

  -- Status
  current_status TEXT CHECK (current_status IN ('active', 'paused', 'completed', 'archived')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_learning_goals_user ON public.user_learning_goals(user_id);
CREATE INDEX idx_user_learning_goals_status ON public.user_learning_goals(current_status);
CREATE INDEX idx_user_learning_goals_assessment ON public.user_learning_goals(assessment_id);

COMMENT ON TABLE public.user_learning_goals IS
'Stores user-defined learning goals with target levels and focus areas';

-- =====================================================
-- 2. AI-GENERATED LEARNING PATHS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_generated_learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.user_learning_goals(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.user_ai_assessments(id) ON DELETE SET NULL,

  path_title TEXT NOT NULL,
  path_description TEXT,

  -- AI Generation metadata
  generated_by_ai BOOLEAN DEFAULT true,
  generation_algorithm TEXT DEFAULT 'irt_gap_analysis_v1',
  generation_metadata JSONB, -- Stores AI reasoning, scores used, etc.

  -- Path characteristics
  difficulty_start TEXT CHECK (difficulty_start IN ('foundational', 'applied', 'advanced', 'strategic')),
  difficulty_end TEXT CHECK (difficulty_end IN ('foundational', 'applied', 'advanced', 'strategic')),

  estimated_completion_weeks INTEGER,
  estimated_total_hours INTEGER,

  -- Content counts
  total_courses INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  total_quizzes INTEGER DEFAULT 0,
  total_workshops INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,

  -- Progress tracking
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  items_completed INTEGER DEFAULT 0,
  current_item_index INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_custom_modified BOOLEAN DEFAULT false, -- User made manual changes

  -- Milestones
  milestones_completed INTEGER DEFAULT 0,
  total_milestones INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_learning_paths_user ON public.ai_generated_learning_paths(user_id);
CREATE INDEX idx_ai_learning_paths_goal ON public.ai_generated_learning_paths(goal_id);
CREATE INDEX idx_ai_learning_paths_active ON public.ai_generated_learning_paths(is_active);

COMMENT ON TABLE public.ai_generated_learning_paths IS
'AI-generated personalized learning paths based on assessment results and goals';

-- =====================================================
-- 3. LEARNING PATH ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.learning_path_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_learning_path_id UUID NOT NULL REFERENCES public.ai_generated_learning_paths(id) ON DELETE CASCADE,

  -- Sequencing
  order_index INTEGER NOT NULL,
  week_number INTEGER, -- Suggested week for completion

  -- Polymorphic content reference
  item_type TEXT CHECK (item_type IN ('course', 'exercise', 'quiz', 'workshop', 'event', 'assessment')) NOT NULL,
  item_id TEXT NOT NULL, -- Generic ID (can be INT or UUID as string)
  item_title TEXT NOT NULL,
  item_description TEXT,

  -- Characteristics
  difficulty_level TEXT CHECK (difficulty_level IN ('foundational', 'applied', 'advanced', 'strategic')),
  irt_difficulty DECIMAL(4,2),
  estimated_hours DECIMAL(5,2),

  -- Requirements
  is_required BOOLEAN DEFAULT true,
  prerequisites TEXT[], -- Array of item_id prerequisites
  skill_tags TEXT[],

  -- AI reasoning
  reason_for_inclusion TEXT, -- Why AI selected this item
  addresses_weaknesses TEXT[], -- Which weak categories it addresses
  confidence_score DECIMAL(3,2), -- AI confidence 0-1

  -- Status tracking
  status TEXT CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'skipped')) DEFAULT 'locked',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_hours DECIMAL(5,2),

  -- Engagement
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_path_items_path ON public.learning_path_items(ai_learning_path_id);
CREATE INDEX idx_learning_path_items_status ON public.learning_path_items(status);
CREATE INDEX idx_learning_path_items_type ON public.learning_path_items(item_type);
CREATE INDEX idx_learning_path_items_order ON public.learning_path_items(ai_learning_path_id, order_index);

COMMENT ON TABLE public.learning_path_items IS
'Individual items in AI-generated learning paths (courses, exercises, quizzes, etc.)';

-- =====================================================
-- 4. LEARNING PATH MILESTONES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.learning_path_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_learning_path_id UUID NOT NULL REFERENCES public.ai_generated_learning_paths(id) ON DELETE CASCADE,

  milestone_order INTEGER NOT NULL,
  milestone_title TEXT NOT NULL,
  milestone_description TEXT,

  -- Requirements
  required_items_completed UUID[], -- Array of learning_path_items IDs
  minimum_completion_percentage DECIMAL(5,2),

  -- Rewards
  reward_badge TEXT,
  reward_points INTEGER DEFAULT 0,
  reward_message TEXT,

  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_path_milestones_path ON public.learning_path_milestones(ai_learning_path_id);

COMMENT ON TABLE public.learning_path_milestones IS
'Milestones and checkpoints within AI-generated learning paths';

-- =====================================================
-- 5. PATH GENERATION METADATA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.path_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_learning_path_id UUID REFERENCES public.ai_generated_learning_paths(id) ON DELETE SET NULL,

  generation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  algorithm_version TEXT,

  -- Input data
  input_assessment_scores JSONB,
  input_goals JSONB,
  input_preferences JSONB,

  -- Output data
  items_generated INTEGER,
  computation_time_ms INTEGER,

  -- Quality metrics
  content_diversity_score DECIMAL(3,2),
  difficulty_progression_score DECIMAL(3,2),

  success BOOLEAN DEFAULT true,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_path_generation_logs_user ON public.path_generation_logs(user_id);
CREATE INDEX idx_path_generation_logs_timestamp ON public.path_generation_logs(generation_timestamp);

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.user_learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_generation_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- User Learning Goals
CREATE POLICY "Users can view own goals"
  ON public.user_learning_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON public.user_learning_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.user_learning_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- AI Generated Learning Paths
CREATE POLICY "Users can view own paths"
  ON public.ai_generated_learning_paths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own paths"
  ON public.ai_generated_learning_paths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paths"
  ON public.ai_generated_learning_paths FOR UPDATE
  USING (auth.uid() = user_id);

-- Learning Path Items
CREATE POLICY "Users can view items in their paths"
  ON public.learning_path_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ai_generated_learning_paths
    WHERE id = learning_path_items.ai_learning_path_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update items in their paths"
  ON public.learning_path_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ai_generated_learning_paths
    WHERE id = learning_path_items.ai_learning_path_id
    AND user_id = auth.uid()
  ));

-- Milestones
CREATE POLICY "Users can view milestones in their paths"
  ON public.learning_path_milestones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ai_generated_learning_paths
    WHERE id = learning_path_milestones.ai_learning_path_id
    AND user_id = auth.uid()
  ));

-- Generation Logs
CREATE POLICY "Users can view own generation logs"
  ON public.path_generation_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can manage all goals"
  ON public.user_learning_goals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage all paths"
  ON public.ai_generated_learning_paths FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to update path progress
CREATE OR REPLACE FUNCTION update_learning_path_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_generated_learning_paths
  SET
    items_completed = (
      SELECT COUNT(*)
      FROM public.learning_path_items
      WHERE ai_learning_path_id = NEW.ai_learning_path_id
      AND status = 'completed'
    ),
    progress_percentage = (
      SELECT (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL /
              NULLIF(COUNT(*)::DECIMAL, 0) * 100)
      FROM public.learning_path_items
      WHERE ai_learning_path_id = NEW.ai_learning_path_id
    ),
    last_accessed_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.ai_learning_path_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_learning_path_progress
  AFTER UPDATE ON public.learning_path_items
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_learning_path_progress();

-- Function to unlock next items when prerequisites are met
CREATE OR REPLACE FUNCTION unlock_next_items()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    -- Unlock items that have this item as a prerequisite
    UPDATE public.learning_path_items
    SET status = 'available'
    WHERE ai_learning_path_id = NEW.ai_learning_path_id
      AND status = 'locked'
      AND NEW.id::TEXT = ANY(prerequisites);

    -- Unlock next item in sequence if no prerequisites
    UPDATE public.learning_path_items
    SET status = 'available'
    WHERE ai_learning_path_id = NEW.ai_learning_path_id
      AND status = 'locked'
      AND order_index = NEW.order_index + 1
      AND (prerequisites IS NULL OR array_length(prerequisites, 1) IS NULL);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_unlock_next_items
  AFTER UPDATE ON public.learning_path_items
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION unlock_next_items();

-- =====================================================
-- 9. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Active learning paths with progress
CREATE OR REPLACE VIEW user_active_learning_paths AS
SELECT
  p.*,
  g.goal_title,
  g.target_augmentation_level,
  g.focus_skills,
  (SELECT COUNT(*) FROM public.learning_path_items WHERE ai_learning_path_id = p.id AND status = 'completed') as completed_items,
  (SELECT COUNT(*) FROM public.learning_path_items WHERE ai_learning_path_id = p.id AND status = 'available') as available_items,
  (SELECT COUNT(*) FROM public.learning_path_items WHERE ai_learning_path_id = p.id) as total_path_items
FROM public.ai_generated_learning_paths p
JOIN public.user_learning_goals g ON p.goal_id = g.id
WHERE p.is_active = true AND g.current_status = 'active';

COMMENT ON VIEW user_active_learning_paths IS
'Shows active learning paths with progress metrics';
