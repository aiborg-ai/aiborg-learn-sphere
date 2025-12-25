-- ============================================
-- WEEK 3: PEER REVIEW P2P SYSTEM
-- Student-to-student peer review workflow
-- ============================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS peer_review_ratings CASCADE;
DROP TABLE IF EXISTS peer_review_assignments CASCADE;
DROP TABLE IF EXISTS peer_review_requests CASCADE;

-- ============================================
-- PEER REVIEW REQUESTS TABLE
-- Students request peer feedback on assignments
-- ============================================

CREATE TABLE peer_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  assignment_type VARCHAR(50) NOT NULL, -- 'homework', 'project', 'essay', 'code', 'presentation'
  skill_area VARCHAR(100) NOT NULL, -- Area of expertise needed
  title VARCHAR(255) NOT NULL,
  description TEXT,
  submission_url TEXT, -- Link to submission (Google Doc, GitHub, etc.)
  attachment_url TEXT, -- Uploaded file reference
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'matched', 'in_review', 'completed', 'expired'
  requested_reviewers INTEGER DEFAULT 1, -- Number of reviewers requested
  due_date TIMESTAMPTZ, -- When review is needed by
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_assignment_type CHECK (assignment_type IN ('homework', 'project', 'essay', 'code', 'presentation', 'other')),
  CONSTRAINT valid_request_status CHECK (status IN ('pending', 'matched', 'in_review', 'completed', 'expired', 'cancelled')),
  CONSTRAINT requested_reviewers_positive CHECK (requested_reviewers > 0 AND requested_reviewers <= 5)
);

-- ============================================
-- PEER REVIEW ASSIGNMENTS TABLE
-- Matches reviewers with review requests
-- ============================================

CREATE TABLE peer_review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES peer_review_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'in_progress', 'completed'

  -- Review content
  feedback TEXT, -- Written feedback
  strengths TEXT[], -- Array of identified strengths
  improvements TEXT[], -- Array of suggested improvements
  score INTEGER, -- Optional numerical score (1-10)

  -- Timestamps
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,

  -- Metadata
  time_spent_minutes INTEGER, -- Time spent reviewing
  is_anonymous BOOLEAN DEFAULT FALSE, -- Hide reviewer identity from requester

  -- Constraints
  CONSTRAINT valid_assignment_status CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'expired')),
  CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 1 AND score <= 10)),
  CONSTRAINT unique_reviewer_per_request UNIQUE(request_id, reviewer_id),
  CONSTRAINT no_self_review CHECK (reviewer_id != (SELECT requester_id FROM peer_review_requests WHERE id = request_id))
);

-- ============================================
-- PEER REVIEW RATINGS TABLE
-- Quality scoring for peer reviews
-- ============================================

CREATE TABLE peer_review_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES peer_review_assignments(id) ON DELETE CASCADE,
  rated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Usually the requester

  -- Quality metrics
  helpfulness_score INTEGER NOT NULL, -- 1-5 stars
  clarity_score INTEGER NOT NULL, -- 1-5 stars
  thoroughness_score INTEGER NOT NULL, -- 1-5 stars
  timeliness_score INTEGER NOT NULL, -- 1-5 stars

  -- Overall
  overall_rating INTEGER GENERATED ALWAYS AS (
    ROUND((helpfulness_score + clarity_score + thoroughness_score + timeliness_score)::NUMERIC / 4, 1)
  ) STORED,

  -- Optional feedback
  feedback_text TEXT,
  would_request_again BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_helpfulness CHECK (helpfulness_score >= 1 AND helpfulness_score <= 5),
  CONSTRAINT valid_clarity CHECK (clarity_score >= 1 AND clarity_score <= 5),
  CONSTRAINT valid_thoroughness CHECK (thoroughness_score >= 1 AND thoroughness_score <= 5),
  CONSTRAINT valid_timeliness CHECK (timeliness_score >= 1 AND timeliness_score <= 5),
  CONSTRAINT unique_rating_per_assignment UNIQUE(assignment_id, rated_by)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Peer review requests
CREATE INDEX idx_peer_requests_requester ON peer_review_requests(requester_id);
CREATE INDEX idx_peer_requests_status ON peer_review_requests(status);
CREATE INDEX idx_peer_requests_skill ON peer_review_requests(skill_area);
CREATE INDEX idx_peer_requests_created ON peer_review_requests(created_at DESC);
CREATE INDEX idx_peer_requests_due ON peer_review_requests(due_date);

-- Peer review assignments
CREATE INDEX idx_peer_assignments_request ON peer_review_assignments(request_id);
CREATE INDEX idx_peer_assignments_reviewer ON peer_review_assignments(reviewer_id);
CREATE INDEX idx_peer_assignments_status ON peer_review_assignments(status);
CREATE INDEX idx_peer_assignments_due ON peer_review_assignments(due_date);

-- Peer review ratings
CREATE INDEX idx_peer_ratings_assignment ON peer_review_ratings(assignment_id);
CREATE INDEX idx_peer_ratings_reviewer ON peer_review_ratings(rated_by);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE peer_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_review_ratings ENABLE ROW LEVEL SECURITY;

-- Peer Review Requests Policies
CREATE POLICY "Users can view all pending requests"
  ON peer_review_requests FOR SELECT
  USING (status = 'pending' OR requester_id = auth.uid());

CREATE POLICY "Users can create their own requests"
  ON peer_review_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their own requests"
  ON peer_review_requests FOR UPDATE
  USING (requester_id = auth.uid());

CREATE POLICY "Users can delete their own pending requests"
  ON peer_review_requests FOR DELETE
  USING (requester_id = auth.uid() AND status = 'pending');

-- Peer Review Assignments Policies
CREATE POLICY "Reviewers and requesters can view assignments"
  ON peer_review_assignments FOR SELECT
  USING (
    reviewer_id = auth.uid()
    OR
    request_id IN (
      SELECT id FROM peer_review_requests WHERE requester_id = auth.uid()
    )
  );

CREATE POLICY "System can create assignments"
  ON peer_review_assignments FOR INSERT
  WITH CHECK (true); -- Controlled by application logic

CREATE POLICY "Reviewers can update their assignments"
  ON peer_review_assignments FOR UPDATE
  USING (reviewer_id = auth.uid());

-- Peer Review Ratings Policies
CREATE POLICY "Users can view ratings for their reviews"
  ON peer_review_ratings FOR SELECT
  USING (
    rated_by = auth.uid()
    OR
    assignment_id IN (
      SELECT id FROM peer_review_assignments WHERE reviewer_id = auth.uid()
    )
  );

CREATE POLICY "Requesters can rate reviews they received"
  ON peer_review_ratings FOR INSERT
  WITH CHECK (
    assignment_id IN (
      SELECT pra.id
      FROM peer_review_assignments pra
      JOIN peer_review_requests prr ON pra.request_id = prr.id
      WHERE prr.requester_id = auth.uid()
      AND pra.status = 'completed'
    )
  );

-- ============================================
-- TRIGGERS FOR AUTO-UPDATES
-- ============================================

-- Auto-update timestamps
CREATE TRIGGER update_peer_requests_updated_at
  BEFORE UPDATE ON peer_review_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update request status when all assignments are completed
CREATE OR REPLACE FUNCTION update_request_status_on_assignment_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Check if all assignments for this request are completed
    UPDATE peer_review_requests
    SET
      status = 'completed',
      completed_at = NOW()
    WHERE id = NEW.request_id
    AND NOT EXISTS (
      SELECT 1 FROM peer_review_assignments
      WHERE request_id = NEW.request_id
      AND status NOT IN ('completed', 'declined')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_request_status
  AFTER UPDATE ON peer_review_assignments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_request_status_on_assignment_complete();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to find compatible reviewers based on skill level and expertise
CREATE OR REPLACE FUNCTION find_compatible_reviewers(
  p_skill_area VARCHAR,
  p_requester_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  compatibility_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH reviewer_stats AS (
    SELECT
      pra.reviewer_id,
      COUNT(*) as review_count,
      AVG(prr.overall_rating) as avg_rating,
      COUNT(CASE WHEN pra.status = 'completed' THEN 1 END) as completed_count
    FROM peer_review_assignments pra
    LEFT JOIN peer_review_ratings prr ON prr.assignment_id = pra.id
    GROUP BY pra.reviewer_id
  )
  SELECT
    u.id as user_id,
    u.email::TEXT,
    COALESCE(rs.avg_rating, 3.0) + (COALESCE(rs.completed_count, 0)::NUMERIC * 0.1) as compatibility_score
  FROM auth.users u
  LEFT JOIN reviewer_stats rs ON rs.reviewer_id = u.id
  WHERE u.id != p_requester_id
  AND u.id NOT IN (
    -- Exclude users who already have pending assignments for this requester
    SELECT pra.reviewer_id
    FROM peer_review_assignments pra
    JOIN peer_review_requests prreq ON pra.request_id = prreq.id
    WHERE prreq.requester_id = p_requester_id
    AND pra.status IN ('pending', 'accepted', 'in_progress')
  )
  ORDER BY compatibility_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate reviewer statistics
CREATE OR REPLACE FUNCTION get_reviewer_stats(p_user_id UUID)
RETURNS TABLE (
  total_reviews INTEGER,
  completed_reviews INTEGER,
  avg_rating NUMERIC,
  avg_helpfulness NUMERIC,
  avg_clarity NUMERIC,
  avg_thoroughness NUMERIC,
  avg_timeliness NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(pra.id)::INTEGER as total_reviews,
    COUNT(CASE WHEN pra.status = 'completed' THEN 1 END)::INTEGER as completed_reviews,
    ROUND(AVG(prr.overall_rating), 2) as avg_rating,
    ROUND(AVG(prr.helpfulness_score), 2) as avg_helpfulness,
    ROUND(AVG(prr.clarity_score), 2) as avg_clarity,
    ROUND(AVG(prr.thoroughness_score), 2) as avg_thoroughness,
    ROUND(AVG(prr.timeliness_score), 2) as avg_timeliness
  FROM peer_review_assignments pra
  LEFT JOIN peer_review_ratings prr ON prr.assignment_id = pra.id
  WHERE pra.reviewer_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE peer_review_requests IS 'Student-initiated requests for peer review on assignments';
COMMENT ON TABLE peer_review_assignments IS 'Matches between review requests and reviewers';
COMMENT ON TABLE peer_review_ratings IS 'Quality ratings for completed peer reviews';

COMMENT ON FUNCTION find_compatible_reviewers IS 'Matches reviewers based on past performance and availability';
COMMENT ON FUNCTION get_reviewer_stats IS 'Calculates aggregate statistics for a reviewer';
