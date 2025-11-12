-- Enhanced Chatbot Analytics Schema
-- Phase 1.1: Session tracking, topic categorization, and user feedback

-- ============================================================================
-- Chatbot Sessions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS chatbot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN session_end IS NOT NULL
            THEN EXTRACT(EPOCH FROM (session_end - session_start))::INTEGER
            ELSE NULL
        END
    ) STORED,
    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    user_agent TEXT,
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chatbot_sessions
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_user_id ON chatbot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_start ON chatbot_sessions(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_duration ON chatbot_sessions(duration_seconds) WHERE duration_seconds IS NOT NULL;

-- ============================================================================
-- Chatbot Topics/Categories Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS chatbot_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    keywords TEXT[], -- Array of keywords for auto-categorization
    parent_topic_id UUID REFERENCES chatbot_topics(id) ON DELETE SET NULL,
    color TEXT DEFAULT '#6366f1', -- For UI visualization
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common topics
INSERT INTO chatbot_topics (name, description, keywords) VALUES
('Course Help', 'Questions about course content and materials', ARRAY['course', 'lesson', 'material', 'content', 'chapter']),
('Technical Support', 'Technical issues and troubleshooting', ARRAY['error', 'bug', 'issue', 'problem', 'not working', 'broken']),
('Account & Enrollment', 'Account management and course enrollment', ARRAY['account', 'enroll', 'registration', 'login', 'password', 'profile']),
('Assessments & Grades', 'Questions about assignments and grading', ARRAY['assignment', 'grade', 'score', 'test', 'quiz', 'exam', 'homework']),
('Learning Paths', 'Learning path recommendations and guidance', ARRAY['path', 'track', 'career', 'recommendation', 'should i', 'which course']),
('Certificates', 'Certificate and completion questions', ARRAY['certificate', 'completion', 'badge', 'credential', 'achievement']),
('General Inquiry', 'General questions and small talk', ARRAY['hello', 'hi', 'thanks', 'help', 'general'])
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Chatbot Message Categorization (extends existing chatbot_analytics)
-- ============================================================================
-- Add new columns to existing chatbot_analytics table if they don't exist
DO $$
BEGIN
    -- Add session_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chatbot_analytics' AND column_name = 'session_id'
    ) THEN
        ALTER TABLE chatbot_analytics ADD COLUMN session_id UUID REFERENCES chatbot_sessions(id) ON DELETE SET NULL;
        CREATE INDEX idx_chatbot_analytics_session ON chatbot_analytics(session_id);
    END IF;

    -- Add topic_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chatbot_analytics' AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE chatbot_analytics ADD COLUMN topic_id UUID REFERENCES chatbot_topics(id) ON DELETE SET NULL;
        CREATE INDEX idx_chatbot_analytics_topic ON chatbot_analytics(topic_id);
    END IF;

    -- Add sentiment_score if it doesn't exist (range -1.0 to 1.0)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chatbot_analytics' AND column_name = 'sentiment_score'
    ) THEN
        ALTER TABLE chatbot_analytics ADD COLUMN sentiment_score DECIMAL(3, 2) CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0);
    END IF;

    -- Add response_time_ms if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chatbot_analytics' AND column_name = 'response_time_ms'
    ) THEN
        ALTER TABLE chatbot_analytics ADD COLUMN response_time_ms INTEGER;
        CREATE INDEX idx_chatbot_analytics_response_time ON chatbot_analytics(response_time_ms) WHERE response_time_ms IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- Chatbot Feedback Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS chatbot_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chatbot_analytics(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    feedback_type TEXT CHECK (feedback_type IN ('helpful', 'not_helpful', 'incorrect', 'incomplete', 'perfect')),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT feedback_message_or_session CHECK (message_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Indexes for chatbot_feedback
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_message ON chatbot_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_session ON chatbot_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_user ON chatbot_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_rating ON chatbot_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_created ON chatbot_feedback(created_at DESC);

-- ============================================================================
-- Analytics Views
-- ============================================================================

-- Session Analytics View
CREATE OR REPLACE VIEW chatbot_session_analytics AS
SELECT
    DATE(session_start) as date,
    COUNT(DISTINCT id) as total_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(duration_seconds)::INTEGER as avg_duration_seconds,
    AVG(message_count)::DECIMAL(10, 2) as avg_messages_per_session,
    SUM(message_count) as total_messages,
    SUM(total_tokens) as total_tokens,
    SUM(total_cost)::DECIMAL(10, 4) as total_cost,
    COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_sessions,
    COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_sessions,
    COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet_sessions
FROM chatbot_sessions
WHERE session_end IS NOT NULL
GROUP BY DATE(session_start)
ORDER BY date DESC;

-- Topic Distribution View
CREATE OR REPLACE VIEW chatbot_topic_analytics AS
SELECT
    t.id as topic_id,
    t.name as topic_name,
    t.color,
    COUNT(ca.id) as message_count,
    COUNT(DISTINCT ca.user_id) as unique_users,
    AVG(ca.sentiment_score)::DECIMAL(3, 2) as avg_sentiment,
    AVG(ca.response_time_ms)::INTEGER as avg_response_time_ms,
    COUNT(cf.id) as feedback_count,
    AVG(cf.rating)::DECIMAL(3, 2) as avg_rating
FROM chatbot_topics t
LEFT JOIN chatbot_analytics ca ON ca.topic_id = t.id
LEFT JOIN chatbot_feedback cf ON cf.message_id = ca.id
GROUP BY t.id, t.name, t.color
ORDER BY message_count DESC;

-- Sentiment Analytics View
CREATE OR REPLACE VIEW chatbot_sentiment_analytics AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN sentiment_score > 0.5 THEN 1 END) as positive_messages,
    COUNT(CASE WHEN sentiment_score >= -0.5 AND sentiment_score <= 0.5 THEN 1 END) as neutral_messages,
    COUNT(CASE WHEN sentiment_score < -0.5 THEN 1 END) as negative_messages,
    AVG(sentiment_score)::DECIMAL(3, 2) as avg_sentiment,
    MIN(sentiment_score)::DECIMAL(3, 2) as min_sentiment,
    MAX(sentiment_score)::DECIMAL(3, 2) as max_sentiment
FROM chatbot_analytics
WHERE sentiment_score IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Feedback Summary View
CREATE OR REPLACE VIEW chatbot_feedback_summary AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_feedback,
    COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
    COUNT(CASE WHEN rating = 3 THEN 1 END) as neutral_feedback,
    COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback,
    AVG(rating)::DECIMAL(3, 2) as avg_rating,
    COUNT(CASE WHEN feedback_type = 'helpful' THEN 1 END) as helpful_count,
    COUNT(CASE WHEN feedback_type = 'not_helpful' THEN 1 END) as not_helpful_count,
    COUNT(CASE WHEN feedback_type = 'incorrect' THEN 1 END) as incorrect_count,
    COUNT(CASE WHEN feedback_type = 'incomplete' THEN 1 END) as incomplete_count,
    COUNT(CASE WHEN feedback_type = 'perfect' THEN 1 END) as perfect_count
FROM chatbot_feedback
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_feedback ENABLE ROW LEVEL SECURITY;

-- Chatbot Sessions Policies
CREATE POLICY "Users can view their own sessions"
    ON chatbot_sessions FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    ));

CREATE POLICY "Users can insert their own sessions"
    ON chatbot_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON chatbot_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Chatbot Topics Policies (read-only for most users, admins can manage)
CREATE POLICY "Everyone can view topics"
    ON chatbot_topics FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage topics"
    ON chatbot_topics FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Chatbot Feedback Policies
CREATE POLICY "Users can view feedback"
    ON chatbot_feedback FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
    );

CREATE POLICY "Users can submit feedback"
    ON chatbot_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their feedback"
    ON chatbot_feedback FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to automatically categorize messages based on keywords
CREATE OR REPLACE FUNCTION auto_categorize_chatbot_message(message_text TEXT)
RETURNS UUID AS $$
DECLARE
    topic_record RECORD;
    matched_topic_id UUID;
    max_matches INTEGER := 0;
    current_matches INTEGER;
BEGIN
    -- Loop through all topics and count keyword matches
    FOR topic_record IN SELECT id, keywords FROM chatbot_topics LOOP
        current_matches := 0;

        -- Count how many keywords match the message
        FOR i IN 1..array_length(topic_record.keywords, 1) LOOP
            IF message_text ILIKE '%' || topic_record.keywords[i] || '%' THEN
                current_matches := current_matches + 1;
            END IF;
        END LOOP;

        -- Track topic with most matches
        IF current_matches > max_matches THEN
            max_matches := current_matches;
            matched_topic_id := topic_record.id;
        END IF;
    END LOOP;

    -- Return the best matching topic, or NULL if no matches
    RETURN matched_topic_id;
END;
$$ LANGUAGE plpgsql;

-- Function to close inactive sessions
CREATE OR REPLACE FUNCTION close_inactive_sessions()
RETURNS INTEGER AS $$
DECLARE
    closed_count INTEGER;
BEGIN
    UPDATE chatbot_sessions
    SET session_end = NOW(),
        updated_at = NOW()
    WHERE session_end IS NULL
        AND session_start < NOW() - INTERVAL '30 minutes'
        AND updated_at < NOW() - INTERVAL '30 minutes';

    GET DIAGNOSTICS closed_count = ROW_COUNT;
    RETURN closed_count;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for chatbot_sessions
CREATE OR REPLACE FUNCTION update_chatbot_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chatbot_sessions_updated_at
    BEFORE UPDATE ON chatbot_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_sessions_updated_at();

-- Update trigger for chatbot_topics
CREATE TRIGGER chatbot_topics_updated_at
    BEFORE UPDATE ON chatbot_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_sessions_updated_at();

-- Update trigger for chatbot_feedback
CREATE TRIGGER chatbot_feedback_updated_at
    BEFORE UPDATE ON chatbot_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_sessions_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE chatbot_sessions IS 'Tracks individual chatbot conversation sessions with duration and message counts';
COMMENT ON TABLE chatbot_topics IS 'Categorization taxonomy for chatbot conversations';
COMMENT ON TABLE chatbot_feedback IS 'User feedback and ratings for chatbot interactions';
COMMENT ON VIEW chatbot_session_analytics IS 'Daily aggregated session metrics including duration and device breakdown';
COMMENT ON VIEW chatbot_topic_analytics IS 'Message distribution and performance metrics by topic';
COMMENT ON VIEW chatbot_sentiment_analytics IS 'Daily sentiment analysis of chatbot conversations';
COMMENT ON VIEW chatbot_feedback_summary IS 'Daily summary of user feedback and ratings';
COMMENT ON FUNCTION auto_categorize_chatbot_message IS 'Automatically categorizes a message based on keyword matching';
COMMENT ON FUNCTION close_inactive_sessions IS 'Closes sessions that have been inactive for 30+ minutes';
