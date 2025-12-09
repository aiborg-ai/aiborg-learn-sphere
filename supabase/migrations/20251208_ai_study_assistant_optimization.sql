-- AI Study Assistant Optimization Migration
-- Phase 1: Database Schema for Feedback Loop, LLM Personalization, and Analytics

-- ============================================================================
-- 1. FEEDBACK LOOP EVENTS TABLE
-- Tracks all assessment feedback events for analytics and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feedback_loop_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID,
  event_type VARCHAR(50) NOT NULL,
  ability_before DECIMAL(4,2),
  ability_after DECIMAL(4,2),
  triggers_fired INTEGER DEFAULT 0,
  trigger_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feedback loop events
CREATE INDEX IF NOT EXISTS idx_feedback_loop_events_user_time
  ON public.feedback_loop_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_loop_events_type
  ON public.feedback_loop_events(event_type, created_at DESC);

-- RLS for feedback loop events
ALTER TABLE public.feedback_loop_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback events"
  ON public.feedback_loop_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert feedback events"
  ON public.feedback_loop_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. FLASHCARD SOURCES TABLE
-- Tracks the origin of auto-generated flashcards for correlation analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.flashcard_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('assessment', 'quiz', 'course', 'manual')),
  source_id UUID,
  question_id UUID,
  initial_ef DECIMAL(3,2) DEFAULT 2.5,
  irt_difficulty DECIMAL(4,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flashcard_id)
);

-- Indexes for flashcard sources
CREATE INDEX IF NOT EXISTS idx_flashcard_sources_question
  ON public.flashcard_sources(question_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sources_type
  ON public.flashcard_sources(source_type);

-- RLS for flashcard sources (inherit from flashcards table permissions)
ALTER TABLE public.flashcard_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view flashcard sources for their flashcards"
  ON public.flashcard_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcards f
      JOIN public.flashcard_decks d ON f.deck_id = d.id
      WHERE f.id = flashcard_sources.flashcard_id
      AND d.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert flashcard sources for their flashcards"
  ON public.flashcard_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.flashcards f
      JOIN public.flashcard_decks d ON f.deck_id = d.id
      WHERE f.id = flashcard_sources.flashcard_id
      AND d.created_by = auth.uid()
    )
  );

-- ============================================================================
-- 3. LLM RATIONALE CACHE TABLE
-- Caches LLM-generated rationales to reduce API costs (7-day TTL)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.llm_rationale_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_hash TEXT NOT NULL,
  rationale_type TEXT NOT NULL CHECK (rationale_type IN ('study_plan', 'recommendation', 'advice', 'motivation')),
  generated_rationale TEXT NOT NULL,
  model_version TEXT NOT NULL DEFAULT 'gpt-4-turbo-preview',
  token_count INTEGER,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, context_hash, rationale_type)
);

-- Indexes for LLM cache
CREATE INDEX IF NOT EXISTS idx_llm_rationale_cache_lookup
  ON public.llm_rationale_cache(user_id, context_hash, rationale_type);
CREATE INDEX IF NOT EXISTS idx_llm_rationale_cache_expires
  ON public.llm_rationale_cache(expires_at);

-- RLS for LLM cache
ALTER TABLE public.llm_rationale_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cached rationales"
  ON public.llm_rationale_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cached rationales"
  ON public.llm_rationale_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expired cache entries"
  ON public.llm_rationale_cache FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. ABILITY TRAJECTORY TABLE
-- Time-series tracking of ability estimates for learning curves
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ability_trajectory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID,
  category_name VARCHAR(100),
  ability_estimate DECIMAL(4,2) NOT NULL,
  standard_error DECIMAL(4,2),
  confidence_lower DECIMAL(4,2),
  confidence_upper DECIMAL(4,2),
  questions_answered_cumulative INTEGER,
  correct_cumulative INTEGER,
  source_assessment_id UUID,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  week_number INTEGER GENERATED ALWAYS AS (EXTRACT(WEEK FROM recorded_at)::INTEGER) STORED,
  year_number INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM recorded_at)::INTEGER) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ability trajectory
CREATE INDEX IF NOT EXISTS idx_ability_trajectory_user_time
  ON public.ability_trajectory(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ability_trajectory_user_category
  ON public.ability_trajectory(user_id, category_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ability_trajectory_weekly
  ON public.ability_trajectory(user_id, year_number, week_number);

-- RLS for ability trajectory
ALTER TABLE public.ability_trajectory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ability trajectory"
  ON public.ability_trajectory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert ability trajectory"
  ON public.ability_trajectory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. RETENTION OBSERVATIONS TABLE
-- Tracks actual retention for forgetting curve calibration
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.retention_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID,
  topic_name VARCHAR(100),
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE SET NULL,
  question_id UUID,
  easiness_factor DECIMAL(4,2),
  interval_days INTEGER,
  repetition_count INTEGER,
  days_since_last_review INTEGER NOT NULL,
  was_recalled BOOLEAN NOT NULL,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 5),
  response_time_ms INTEGER,
  predicted_retention DECIMAL(4,3),
  actual_outcome DECIMAL(4,3),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for retention observations
CREATE INDEX IF NOT EXISTS idx_retention_user_topic
  ON public.retention_observations(user_id, topic_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_retention_days
  ON public.retention_observations(user_id, days_since_last_review);
CREATE INDEX IF NOT EXISTS idx_retention_flashcard
  ON public.retention_observations(flashcard_id);

-- RLS for retention observations
ALTER TABLE public.retention_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own retention observations"
  ON public.retention_observations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own retention observations"
  ON public.retention_observations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. STUDY SESSION ANALYTICS TABLE
-- Tracks study session effectiveness for pattern analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.study_session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  duration_minutes INTEGER,
  hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_weekend BOOLEAN GENERATED ALWAYS AS (day_of_week IN (0, 6)) STORED,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN questions_attempted > 0
    THEN (questions_correct::DECIMAL / questions_attempted * 100)::DECIMAL(5,2)
    ELSE 0 END
  ) STORED,
  ability_start DECIMAL(4,2),
  ability_end DECIMAL(4,2),
  ability_delta DECIMAL(4,2) GENERATED ALWAYS AS (ability_end - ability_start) STORED,
  average_response_time_ms INTEGER,
  response_time_variance DECIMAL(10,2),
  focus_score DECIMAL(5,2) CHECK (focus_score >= 0 AND focus_score <= 100),
  categories_studied JSONB,
  primary_category_id UUID,
  session_type VARCHAR(50) CHECK (session_type IN ('assessment', 'flashcard_review', 'quiz', 'course', 'mixed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for study session analytics
CREATE INDEX IF NOT EXISTS idx_study_session_user_time
  ON public.study_session_analytics(user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_study_session_hour
  ON public.study_session_analytics(user_id, hour_of_day, accuracy_percentage);
CREATE INDEX IF NOT EXISTS idx_study_session_day
  ON public.study_session_analytics(user_id, day_of_week, accuracy_percentage);
CREATE INDEX IF NOT EXISTS idx_study_session_type
  ON public.study_session_analytics(user_id, session_type);

-- RLS for study session analytics
ALTER TABLE public.study_session_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study session analytics"
  ON public.study_session_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study session analytics"
  ON public.study_session_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study session analytics"
  ON public.study_session_analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. LEARNING VELOCITY SNAPSHOTS TABLE
-- Weekly velocity snapshots for trend analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.learning_velocity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID,
  category_name VARCHAR(100),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  ability_gain DECIMAL(4,2),
  velocity DECIMAL(6,4),
  acceleration DECIMAL(6,4),
  questions_attempted INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  study_days INTEGER DEFAULT 0,
  consistency_score DECIMAL(5,2) CHECK (consistency_score >= 0 AND consistency_score <= 100),
  streak_days INTEGER DEFAULT 0,
  trend_direction VARCHAR(20) CHECK (trend_direction IN ('accelerating', 'steady', 'plateauing', 'declining')),
  predicted_ability_4w DECIMAL(4,2),
  prediction_confidence DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, week_start)
);

-- Indexes for learning velocity snapshots
CREATE INDEX IF NOT EXISTS idx_velocity_user_week
  ON public.learning_velocity_snapshots(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_velocity_category
  ON public.learning_velocity_snapshots(user_id, category_id, week_start DESC);

-- RLS for learning velocity snapshots
ALTER TABLE public.learning_velocity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own velocity snapshots"
  ON public.learning_velocity_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own velocity snapshots"
  ON public.learning_velocity_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own velocity snapshots"
  ON public.learning_velocity_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. PLAN ADJUSTMENT HISTORY TABLE
-- Tracks all dynamic adjustments made to study plans
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.plan_adjustment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.ai_study_plans(id) ON DELETE CASCADE,
  adjustment_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('minor', 'moderate', 'major')),
  trigger_type VARCHAR(50),
  previous_state JSONB,
  new_state JSONB,
  affected_tasks INTEGER DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for plan adjustment history
CREATE INDEX IF NOT EXISTS idx_plan_adjustment_user
  ON public.plan_adjustment_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_adjustment_plan
  ON public.plan_adjustment_history(plan_id, created_at DESC);

-- RLS for plan adjustment history
ALTER TABLE public.plan_adjustment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan adjustments"
  ON public.plan_adjustment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan adjustments"
  ON public.plan_adjustment_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. DATABASE TRIGGERS
-- ============================================================================

-- Trigger: Record ability trajectory after assessment completion
CREATE OR REPLACE FUNCTION public.record_ability_after_assessment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when assessment is completed
  IF NEW.is_complete = true AND (OLD.is_complete = false OR OLD.is_complete IS NULL) THEN
    INSERT INTO public.ability_trajectory (
      user_id,
      ability_estimate,
      standard_error,
      confidence_lower,
      confidence_upper,
      questions_answered_cumulative,
      source_assessment_id,
      recorded_at
    )
    VALUES (
      NEW.user_id,
      NEW.current_ability_estimate,
      NEW.ability_standard_error,
      NEW.current_ability_estimate - (1.96 * COALESCE(NEW.ability_standard_error, 0.5)),
      NEW.current_ability_estimate + (1.96 * COALESCE(NEW.ability_standard_error, 0.5)),
      NEW.questions_answered_count,
      NEW.id,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_ai_assessments
DROP TRIGGER IF EXISTS trigger_record_ability ON public.user_ai_assessments;
CREATE TRIGGER trigger_record_ability
AFTER UPDATE ON public.user_ai_assessments
FOR EACH ROW
EXECUTE FUNCTION public.record_ability_after_assessment();

-- ============================================================================
-- 10. UTILITY FUNCTIONS
-- ============================================================================

-- Function: Get user study context enhanced (for RAG personalization)
CREATE OR REPLACE FUNCTION public.get_user_study_context_enhanced(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_context JSONB;
BEGIN
  SELECT jsonb_build_object(
    -- Enrolled courses with progress
    'enrolled_courses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'course_id', c.id,
        'title', c.title,
        'progress', e.progress_percentage,
        'enrolled_at', e.enrolled_at,
        'difficulty', c.level,
        'category', c.category
      ))
      FROM public.enrollments e
      JOIN public.courses c ON e.course_id = c.id
      WHERE e.user_id = p_user_id
    ), '[]'::jsonb),

    -- Learning style profile
    'learning_style', COALESCE((
      SELECT jsonb_build_object(
        'visual_score', visual_score,
        'auditory_score', auditory_score,
        'reading_score', reading_score,
        'kinesthetic_score', kinesthetic_score,
        'preferred_session_length', preferred_session_length,
        'dominant_style', CASE
          WHEN visual_score >= GREATEST(auditory_score, reading_score, kinesthetic_score) THEN 'visual'
          WHEN auditory_score >= GREATEST(visual_score, reading_score, kinesthetic_score) THEN 'auditory'
          WHEN reading_score >= GREATEST(visual_score, auditory_score, kinesthetic_score) THEN 'reading'
          ELSE 'kinesthetic'
        END
      )
      FROM public.learning_style_profiles
      WHERE user_id = p_user_id
    ), jsonb_build_object('dominant_style', 'mixed')),

    -- Recent ability trajectory
    'ability_trajectory', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'ability', ability_estimate,
        'recorded_at', recorded_at,
        'category_name', category_name
      ) ORDER BY recorded_at DESC)
      FROM (
        SELECT ability_estimate, recorded_at, category_name
        FROM public.ability_trajectory
        WHERE user_id = p_user_id
        ORDER BY recorded_at DESC
        LIMIT 10
      ) t
    ), '[]'::jsonb),

    -- Assessment performance by category
    'assessment_performance', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'category', at.category,
        'avg_score', ROUND(AVG(ata.total_score::DECIMAL / NULLIF(ata.max_possible_score, 0) * 100), 1),
        'attempts', COUNT(*)
      ))
      FROM public.assessment_tool_attempts ata
      JOIN public.assessment_tools at ON ata.assessment_id = at.id
      WHERE ata.user_id = p_user_id AND ata.status = 'completed'
      GROUP BY at.category
    ), '[]'::jsonb),

    -- Completed prerequisites (categories with 100% completion)
    'completed_prerequisites', COALESCE((
      SELECT jsonb_agg(DISTINCT c.category)
      FROM public.enrollments e
      JOIN public.courses c ON e.course_id = c.id
      WHERE e.user_id = p_user_id
        AND e.progress_percentage = 100
    ), '[]'::jsonb),

    -- Learning profile from profiles table
    'learning_profile', (
      SELECT ai_learning_profile FROM public.profiles WHERE id = p_user_id
    ),

    -- Active study plan
    'active_study_plan', (
      SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'status', status,
        'completion_percentage', completion_percentage
      )
      FROM public.ai_study_plans
      WHERE user_id = p_user_id
        AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    ),

    -- Study statistics
    'study_stats', jsonb_build_object(
      'total_sessions', (
        SELECT COUNT(*)
        FROM public.study_session_analytics
        WHERE user_id = p_user_id
      ),
      'avg_session_duration', (
        SELECT COALESCE(ROUND(AVG(duration_minutes)), 0)
        FROM public.study_session_analytics
        WHERE user_id = p_user_id
      ),
      'best_hour', (
        SELECT hour_of_day
        FROM public.study_session_analytics
        WHERE user_id = p_user_id
        GROUP BY hour_of_day
        ORDER BY AVG(accuracy_percentage) DESC
        LIMIT 1
      )
    )
  ) INTO v_context;

  RETURN v_context;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_study_context_enhanced(UUID) TO authenticated;

-- ============================================================================
-- 11. CLEANUP FUNCTION FOR EXPIRED CACHE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_llm_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.llm_rationale_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_expired_llm_cache() TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE public.feedback_loop_events IS 'Tracks assessment feedback events for the adaptive study assistant';
COMMENT ON TABLE public.flashcard_sources IS 'Tracks origin of auto-generated flashcards for correlation analysis';
COMMENT ON TABLE public.llm_rationale_cache IS 'Caches LLM-generated rationales to reduce API costs (7-day TTL)';
COMMENT ON TABLE public.ability_trajectory IS 'Time-series tracking of ability estimates for learning curves';
COMMENT ON TABLE public.retention_observations IS 'Tracks actual retention for forgetting curve calibration';
COMMENT ON TABLE public.study_session_analytics IS 'Tracks study session effectiveness for pattern analysis';
COMMENT ON TABLE public.learning_velocity_snapshots IS 'Weekly velocity snapshots for trend analysis';
COMMENT ON TABLE public.plan_adjustment_history IS 'Tracks all dynamic adjustments made to study plans';
