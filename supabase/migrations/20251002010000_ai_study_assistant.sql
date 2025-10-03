-- AI Study Assistant Database Schema
-- Creates tables and functions for AI-powered personalized learning

-- AI Study Sessions Table
CREATE TABLE IF NOT EXISTS public.ai_study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'study_plan', 'assignment_help', 'performance_review')),
  context JSONB DEFAULT '{}'::jsonb,
  duration_minutes INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Conversation History Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.ai_study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Study Recommendations Table
CREATE TABLE IF NOT EXISTS public.ai_study_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (
    recommendation_type IN ('material', 'study_time', 'review', 'assignment_priority', 'learning_path')
  ),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  related_course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL,
  related_assignment_id UUID, -- Remove foreign key constraint if assignments table doesn't exist
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Learning Insights Table
CREATE TABLE IF NOT EXISTS public.ai_learning_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (
    insight_type IN ('strength', 'weakness', 'pattern', 'achievement', 'suggestion')
  ),
  category TEXT, -- e.g., 'time_management', 'content_mastery', 'study_habits'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Study Plans Table
CREATE TABLE IF NOT EXISTS public.ai_study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  plan_data JSONB NOT NULL, -- Stores daily/weekly schedule
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'abandoned')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Performance Metrics Table
CREATE TABLE IF NOT EXISTS public.ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend profiles table with AI learning profile
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_learning_profile JSONB DEFAULT '{
  "learning_style": "balanced",
  "preferred_study_times": [],
  "weak_areas": [],
  "strong_areas": [],
  "study_goals": [],
  "ai_enabled": true,
  "personalization_level": "high"
}'::jsonb;

-- Add AI insights to enrollments
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS ai_insights JSONB DEFAULT '{
  "predicted_completion_date": null,
  "difficulty_assessment": "medium",
  "recommended_study_hours_per_week": 5,
  "performance_trend": "stable"
}'::jsonb;

-- Add difficulty rating to assignments (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments' AND table_schema = 'public') THEN
    ALTER TABLE public.assignments
    ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS estimated_time_hours DECIMAL(4,2);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON public.ai_study_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON public.ai_conversations(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON public.ai_study_recommendations(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON public.ai_learning_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_study_plans_user ON public.ai_study_plans(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_user_period ON public.ai_performance_metrics(user_id, period_start, period_end);

-- Enable Row Level Security
ALTER TABLE public.ai_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_study_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own study sessions"
  ON public.ai_study_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own study sessions"
  ON public.ai_study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own conversations"
  ON public.ai_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own conversations"
  ON public.ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own recommendations"
  ON public.ai_study_recommendations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own insights"
  ON public.ai_learning_insights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert insights"
  ON public.ai_learning_insights FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Users can manage their own study plans"
  ON public.ai_study_plans FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own metrics"
  ON public.ai_performance_metrics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert metrics"
  ON public.ai_performance_metrics FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Helper function to get user's study context
CREATE OR REPLACE FUNCTION public.get_user_study_context(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_context JSONB;
BEGIN
  SELECT jsonb_build_object(
    'enrolled_courses', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'course_id', c.id,
          'title', c.title,
          'progress', e.progress_percentage,
          'enrolled_at', e.enrolled_at
        )
      )
      FROM public.enrollments e
      JOIN public.courses c ON e.course_id = c.id
      WHERE e.user_id = p_user_id
    ),
    'upcoming_assignments', (
      CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments' AND table_schema = 'public') THEN
          (SELECT jsonb_agg(
            jsonb_build_object(
              'assignment_id', a.id,
              'title', a.title,
              'due_date', a.due_date,
              'difficulty', a.difficulty_rating,
              'course_title', c.title
            )
          )
          FROM public.assignments a
          JOIN public.courses c ON a.course_id = c.id
          WHERE a.due_date >= NOW()
            AND a.due_date <= NOW() + INTERVAL '14 days'
            AND EXISTS (
              SELECT 1 FROM public.enrollments e
              WHERE e.user_id = p_user_id AND e.course_id = a.course_id
            )
          ORDER BY a.due_date ASC
          LIMIT 10)
        ELSE '[]'::jsonb
      END
    ),
    'recent_activity', (
      CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions' AND table_schema = 'public') THEN
          (SELECT jsonb_agg(
            jsonb_build_object(
              'type', 'submission',
              'assignment_title', a.title,
              'submitted_at', s.created_at
            )
          )
          FROM public.submissions s
          JOIN public.assignments a ON s.assignment_id = a.id
          WHERE s.user_id = p_user_id
          ORDER BY s.created_at DESC
          LIMIT 5)
        ELSE '[]'::jsonb
      END
    ),
    'learning_profile', (
      SELECT ai_learning_profile
      FROM public.profiles
      WHERE id = p_user_id
    ),
    'active_recommendations', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'type', recommendation_type,
          'title', title,
          'priority', priority
        )
      )
      FROM public.ai_study_recommendations
      WHERE user_id = p_user_id
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY priority DESC
      LIMIT 5
    )
  ) INTO v_context;

  RETURN v_context;
END;
$$;

-- Function to create AI study session
CREATE OR REPLACE FUNCTION public.create_ai_study_session(
  p_user_id UUID,
  p_session_type TEXT,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO public.ai_study_sessions (user_id, session_type, context)
  VALUES (p_user_id, p_session_type, p_context)
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Function to update study plan completion
CREATE OR REPLACE FUNCTION public.update_study_plan_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recalculate completion percentage based on plan_data
  -- This is a simplified version - actual logic would be more complex
  UPDATE public.ai_study_plans
  SET
    completion_percentage = LEAST(100,
      COALESCE((
        SELECT COUNT(*)::float / NULLIF(jsonb_array_length(plan_data->'tasks'), 0) * 100
        FROM jsonb_array_elements(plan_data->'tasks') task
        WHERE (task->>'completed')::boolean = true
      ), 0)::integer
    ),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_study_plan_completion_trigger
  AFTER UPDATE OF plan_data ON public.ai_study_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_study_plan_completion();

-- Grant necessary permissions
GRANT SELECT ON public.ai_study_sessions TO authenticated;
GRANT INSERT ON public.ai_study_sessions TO authenticated;
GRANT SELECT, INSERT ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_study_recommendations TO authenticated;
GRANT SELECT ON public.ai_learning_insights TO authenticated;
GRANT ALL ON public.ai_study_plans TO authenticated;
GRANT SELECT ON public.ai_performance_metrics TO authenticated;

GRANT ALL ON public.ai_learning_insights TO service_role;
GRANT ALL ON public.ai_performance_metrics TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.ai_study_sessions IS 'Tracks AI-assisted study sessions for analytics and context';
COMMENT ON TABLE public.ai_conversations IS 'Stores conversation history with AI study assistant';
COMMENT ON TABLE public.ai_study_recommendations IS 'AI-generated personalized study recommendations';
COMMENT ON TABLE public.ai_learning_insights IS 'AI-analyzed learning patterns and insights';
COMMENT ON TABLE public.ai_study_plans IS 'AI-generated personalized study plans';
COMMENT ON TABLE public.ai_performance_metrics IS 'Performance metrics for tracking student progress';
