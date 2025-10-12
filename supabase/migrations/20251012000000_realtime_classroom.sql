-- Real-Time Classroom Collaboration System
-- Enables live classroom presence, Q&A, and progress tracking

-- =====================================================
-- CLASSROOM SESSIONS
-- =====================================================

-- Track active classroom sessions for courses
CREATE TABLE IF NOT EXISTS public.classroom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT, -- Flexible identifier for lesson/module
  lesson_title TEXT,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  session_metadata JSONB, -- Additional session info (topic, resources, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- CLASSROOM PRESENCE
-- =====================================================

-- Track which students are actively in the classroom
CREATE TABLE IF NOT EXISTS public.classroom_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.classroom_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  current_position TEXT, -- Video timestamp, slide number, etc.
  metadata JSONB, -- Browser info, device type, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- =====================================================
-- LIVE Q&A SYSTEM
-- =====================================================

-- Questions asked during live sessions
CREATE TABLE IF NOT EXISTS public.classroom_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.classroom_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_context TEXT, -- What part of lesson they're on
  answer_text TEXT,
  answered_by UUID REFERENCES auth.users(id),
  answered_at TIMESTAMPTZ,
  upvotes INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false, -- Instructor can pin important questions
  priority INTEGER DEFAULT 0, -- For sorting (higher = more important)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track upvotes on questions
CREATE TABLE IF NOT EXISTS public.question_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.classroom_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- =====================================================
-- REAL-TIME PROGRESS EVENTS
-- =====================================================

-- Log significant progress events for real-time tracking
CREATE TABLE IF NOT EXISTS public.classroom_progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.classroom_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('milestone_reached', 'lesson_completed', 'quiz_passed', 'stuck', 'help_needed')),
  event_data JSONB, -- Details about the event
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Classroom Sessions
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_course ON public.classroom_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_instructor ON public.classroom_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_active ON public.classroom_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_started ON public.classroom_sessions(started_at DESC);

-- Classroom Presence
CREATE INDEX IF NOT EXISTS idx_classroom_presence_session ON public.classroom_presence(session_id);
CREATE INDEX IF NOT EXISTS idx_classroom_presence_user ON public.classroom_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_presence_active ON public.classroom_presence(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_classroom_presence_last_seen ON public.classroom_presence(last_seen DESC);

-- Classroom Questions
CREATE INDEX IF NOT EXISTS idx_classroom_questions_session ON public.classroom_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_classroom_questions_user ON public.classroom_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_questions_created ON public.classroom_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_questions_priority ON public.classroom_questions(priority DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_questions_unresolved ON public.classroom_questions(is_resolved) WHERE is_resolved = false;

-- Question Upvotes
CREATE INDEX IF NOT EXISTS idx_question_upvotes_question ON public.question_upvotes(question_id);
CREATE INDEX IF NOT EXISTS idx_question_upvotes_user ON public.question_upvotes(user_id);

-- Progress Events
CREATE INDEX IF NOT EXISTS idx_progress_events_session ON public.classroom_progress_events(session_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_user ON public.classroom_progress_events(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_created ON public.classroom_progress_events(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.classroom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_progress_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Classroom Sessions
-- =====================================================

-- Anyone can view active sessions for courses they're enrolled in
CREATE POLICY "Users can view sessions for enrolled courses"
  ON public.classroom_sessions FOR SELECT
  USING (
    is_active = true AND (
      -- User is instructor
      instructor_id = auth.uid() OR
      -- User is enrolled in the course
      EXISTS (
        SELECT 1 FROM public.enrollments
        WHERE enrollments.course_id = classroom_sessions.course_id
        AND enrollments.user_id = auth.uid()
      ) OR
      -- User has admin role
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- Only instructors can create sessions
CREATE POLICY "Instructors can create classroom sessions"
  ON public.classroom_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = instructor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('instructor', 'admin')
    )
  );

-- Only instructors can update their own sessions
CREATE POLICY "Instructors can update their sessions"
  ON public.classroom_sessions FOR UPDATE
  USING (instructor_id = auth.uid());

-- =====================================================
-- RLS POLICIES - Classroom Presence
-- =====================================================

-- Users can view presence in sessions they're part of
CREATE POLICY "Users can view presence in their sessions"
  ON public.classroom_presence FOR SELECT
  USING (
    -- User is viewing their own presence
    user_id = auth.uid() OR
    -- User is in the same session
    session_id IN (
      SELECT session_id FROM public.classroom_presence
      WHERE user_id = auth.uid()
    ) OR
    -- User is the instructor of the session
    session_id IN (
      SELECT id FROM public.classroom_sessions
      WHERE instructor_id = auth.uid()
    )
  );

-- Users can insert their own presence
CREATE POLICY "Users can join sessions"
  ON public.classroom_presence FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own presence
CREATE POLICY "Users can update their presence"
  ON public.classroom_presence FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own presence
CREATE POLICY "Users can leave sessions"
  ON public.classroom_presence FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES - Classroom Questions
-- =====================================================

-- Users can view questions in sessions they're part of
CREATE POLICY "Users can view questions in their sessions"
  ON public.classroom_questions FOR SELECT
  USING (
    session_id IN (
      -- Sessions user is present in
      SELECT session_id FROM public.classroom_presence
      WHERE user_id = auth.uid()
      UNION
      -- Sessions user is instructor of
      SELECT id FROM public.classroom_sessions
      WHERE instructor_id = auth.uid()
    )
  );

-- Enrolled users can ask questions
CREATE POLICY "Users can ask questions in sessions"
  ON public.classroom_questions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    session_id IN (
      SELECT session_id FROM public.classroom_presence
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Users can update their own unanswered questions
CREATE POLICY "Users can update their own questions"
  ON public.classroom_questions FOR UPDATE
  USING (
    user_id = auth.uid() AND answer_text IS NULL
  );

-- Instructors can answer questions
CREATE POLICY "Instructors can answer questions"
  ON public.classroom_questions FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.classroom_sessions
      WHERE instructor_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - Question Upvotes
-- =====================================================

CREATE POLICY "Users can view upvotes"
  ON public.question_upvotes FOR SELECT
  USING (true);

CREATE POLICY "Users can upvote questions"
  ON public.question_upvotes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their upvotes"
  ON public.question_upvotes FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES - Progress Events
-- =====================================================

CREATE POLICY "Users can view progress events in their sessions"
  ON public.classroom_progress_events FOR SELECT
  USING (
    -- User can see their own events
    user_id = auth.uid() OR
    -- Instructors can see all events in their sessions
    session_id IN (
      SELECT id FROM public.classroom_sessions
      WHERE instructor_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own progress events"
  ON public.classroom_progress_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update last_seen timestamp
CREATE OR REPLACE FUNCTION update_presence_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_seen
CREATE TRIGGER trigger_update_presence_last_seen
  BEFORE UPDATE ON public.classroom_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_presence_last_seen();

-- Function to mark inactive presence (after 5 minutes of no updates)
CREATE OR REPLACE FUNCTION mark_inactive_presence()
RETURNS void AS $$
BEGIN
  UPDATE public.classroom_presence
  SET is_active = false
  WHERE last_seen < now() - INTERVAL '5 minutes'
  AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-increment question upvotes
CREATE OR REPLACE FUNCTION update_question_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.classroom_questions
    SET upvotes = upvotes + 1
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.classroom_questions
    SET upvotes = GREATEST(upvotes - 1, 0)
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update question upvote count
CREATE TRIGGER trigger_question_upvotes
  AFTER INSERT OR DELETE ON public.question_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION update_question_upvotes();

-- Function to get active students count for a session
CREATE OR REPLACE FUNCTION get_active_students_count(session_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.classroom_presence
  WHERE session_id = session_uuid
  AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get top unanswered questions for a session
CREATE OR REPLACE FUNCTION get_top_questions(session_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  user_id UUID,
  upvotes INTEGER,
  created_at TIMESTAMPTZ,
  is_pinned BOOLEAN,
  priority INTEGER
) AS $$
  SELECT
    id,
    question_text,
    user_id,
    upvotes,
    created_at,
    is_pinned,
    priority
  FROM public.classroom_questions
  WHERE session_id = session_uuid
  AND is_resolved = false
  ORDER BY
    is_pinned DESC,
    priority DESC,
    upvotes DESC,
    created_at ASC
  LIMIT limit_count;
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- ENABLE REALTIME REPLICATION
-- =====================================================

-- Enable realtime for all classroom tables
ALTER PUBLICATION supabase_realtime ADD TABLE classroom_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE classroom_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE classroom_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE question_upvotes;
ALTER PUBLICATION supabase_realtime ADD TABLE classroom_progress_events;

-- Add comments for documentation
COMMENT ON TABLE classroom_sessions IS 'Realtime enabled for live classroom sessions';
COMMENT ON TABLE classroom_presence IS 'Realtime enabled for student presence tracking';
COMMENT ON TABLE classroom_questions IS 'Realtime enabled for live Q&A';
COMMENT ON TABLE question_upvotes IS 'Realtime enabled for instant upvote updates';
COMMENT ON TABLE classroom_progress_events IS 'Realtime enabled for progress tracking';

-- Grant permissions to authenticated users
GRANT SELECT ON public.classroom_sessions TO authenticated;
GRANT SELECT ON public.classroom_presence TO authenticated;
GRANT SELECT ON public.classroom_questions TO authenticated;
GRANT SELECT ON public.question_upvotes TO authenticated;
GRANT SELECT ON public.classroom_progress_events TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_active_students_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_questions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_inactive_presence() TO authenticated;
