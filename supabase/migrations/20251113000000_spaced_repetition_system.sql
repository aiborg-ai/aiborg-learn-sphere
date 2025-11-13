-- Spaced Repetition System Migration
-- Implements flashcard-based learning with SM-2 algorithm

-- ============================================================================
-- FLASHCARD DECKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_course_id ON flashcard_decks(course_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_created_by ON flashcard_decks(created_by);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_public ON flashcard_decks(is_public) WHERE is_public = true;

-- ============================================================================
-- FLASHCARDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front_content TEXT NOT NULL,
  back_content TEXT NOT NULL,
  front_image_url TEXT,
  back_image_url TEXT,
  tags TEXT[],
  difficulty INTEGER DEFAULT 0 CHECK (difficulty >= 0 AND difficulty <= 2), -- 0=easy, 1=medium, 2=hard
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster deck queries
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON flashcards USING gin(tags);

-- ============================================================================
-- SPACED REPETITION STATE (SM-2 Algorithm)
-- ============================================================================
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,

  -- SM-2 Algorithm Fields
  easiness_factor DECIMAL(4,2) DEFAULT 2.50 CHECK (easiness_factor >= 1.30), -- SM-2 EF (1.3 minimum)
  interval_days INTEGER DEFAULT 1 CHECK (interval_days >= 0), -- Days until next review
  repetition_count INTEGER DEFAULT 0 CHECK (repetition_count >= 0), -- Consecutive correct reviews

  -- Review History
  last_reviewed TIMESTAMPTZ,
  next_review_date TIMESTAMPTZ DEFAULT NOW(), -- When card is due for review
  total_reviews INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_incorrect INTEGER DEFAULT 0,

  -- Performance Tracking
  review_history JSONB DEFAULT '[]'::jsonb, -- Array of {date, quality, interval, ef}
  average_quality DECIMAL(3,2) DEFAULT 0.00, -- Average quality score (0-5)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, flashcard_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id ON flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id ON flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_next_review ON flashcard_reviews(next_review_date);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_due ON flashcard_reviews(user_id, next_review_date)
  WHERE next_review_date <= NOW();

-- ============================================================================
-- REVIEW SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,

  -- Session Metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Session Stats
  cards_reviewed INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  cards_incorrect INTEGER DEFAULT 0,
  cards_skipped INTEGER DEFAULT 0,

  -- Performance
  average_response_time_ms INTEGER,
  session_type TEXT DEFAULT 'review' CHECK (session_type IN ('review', 'learn', 'cram')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user session history
CREATE INDEX IF NOT EXISTS idx_review_sessions_user_id ON review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_deck_id ON review_sessions(deck_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_started ON review_sessions(started_at DESC);

-- ============================================================================
-- STREAK TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS review_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Streak Data
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_review_date DATE,
  total_review_days INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_review_streaks_user_id ON review_streaks(user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update card count in deck when flashcard is added/removed
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE flashcard_decks
    SET card_count = card_count + 1, updated_at = NOW()
    WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE flashcard_decks
    SET card_count = GREATEST(card_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep card_count in sync
DROP TRIGGER IF EXISTS trigger_update_deck_card_count ON flashcards;
CREATE TRIGGER trigger_update_deck_card_count
AFTER INSERT OR DELETE ON flashcards
FOR EACH ROW EXECUTE FUNCTION update_deck_card_count();

-- Update streak on review
CREATE OR REPLACE FUNCTION update_review_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  current_date DATE := CURRENT_DATE;
BEGIN
  -- Get or create streak record
  INSERT INTO review_streaks (user_id, last_review_date, current_streak, longest_streak, total_review_days)
  VALUES (NEW.user_id, current_date, 1, 1, 1)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get last review date
  SELECT last_review_date INTO last_date
  FROM review_streaks
  WHERE user_id = NEW.user_id;

  -- Update streak
  IF last_date IS NULL OR last_date < current_date THEN
    UPDATE review_streaks
    SET
      current_streak = CASE
        WHEN last_date = current_date - INTERVAL '1 day' THEN current_streak + 1
        WHEN last_date < current_date THEN 1
        ELSE current_streak
      END,
      longest_streak = GREATEST(longest_streak,
        CASE
          WHEN last_date = current_date - INTERVAL '1 day' THEN current_streak + 1
          ELSE current_streak
        END
      ),
      last_review_date = current_date,
      total_review_days = CASE
        WHEN last_date < current_date THEN total_review_days + 1
        ELSE total_review_days
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak on review
DROP TRIGGER IF EXISTS trigger_update_review_streak ON flashcard_reviews;
CREATE TRIGGER trigger_update_review_streak
AFTER UPDATE ON flashcard_reviews
FOR EACH ROW
WHEN (NEW.last_reviewed IS DISTINCT FROM OLD.last_reviewed)
EXECUTE FUNCTION update_review_streak();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_streaks ENABLE ROW LEVEL SECURITY;

-- Flashcard Decks Policies
CREATE POLICY "Users can view public decks" ON flashcard_decks
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own decks" ON flashcard_decks
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own decks" ON flashcard_decks
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own decks" ON flashcard_decks
  FOR DELETE USING (created_by = auth.uid());

-- Flashcards Policies
CREATE POLICY "Users can view cards in accessible decks" ON flashcards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM flashcard_decks
      WHERE id = flashcards.deck_id
      AND (is_public = true OR created_by = auth.uid())
    )
  );

CREATE POLICY "Users can create cards in their decks" ON flashcards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM flashcard_decks
      WHERE id = flashcards.deck_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update cards in their decks" ON flashcards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM flashcard_decks
      WHERE id = flashcards.deck_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete cards in their decks" ON flashcards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM flashcard_decks
      WHERE id = flashcards.deck_id
      AND created_by = auth.uid()
    )
  );

-- Flashcard Reviews Policies (Personal data)
CREATE POLICY "Users can view their own reviews" ON flashcard_reviews
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own reviews" ON flashcard_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews" ON flashcard_reviews
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews" ON flashcard_reviews
  FOR DELETE USING (user_id = auth.uid());

-- Review Sessions Policies
CREATE POLICY "Users can view their own sessions" ON review_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions" ON review_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON review_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Review Streaks Policies
CREATE POLICY "Users can view their own streaks" ON review_streaks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own streaks" ON review_streaks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own streaks" ON review_streaks
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- INITIAL DATA (Sample Decks)
-- ============================================================================

COMMENT ON TABLE flashcard_decks IS 'Flashcard decks for spaced repetition learning';
COMMENT ON TABLE flashcards IS 'Individual flashcards with front/back content';
COMMENT ON TABLE flashcard_reviews IS 'User-specific review state using SM-2 algorithm';
COMMENT ON TABLE review_sessions IS 'Completed review sessions for analytics';
COMMENT ON TABLE review_streaks IS 'Daily review streak tracking for gamification';

-- SM-2 Algorithm Notes:
-- - Easiness Factor (EF): 1.3-2.5+ (default 2.5)
-- - Quality scores: 0-5 (0=complete blackout, 5=perfect response)
-- - Interval calculation: I(n) = I(n-1) * EF
-- - EF adjustment: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
