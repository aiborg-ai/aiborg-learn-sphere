-- =============================================
-- Audience Surveys System
-- Gather learning preferences from different audience categories
-- =============================================

-- Drop existing types if they exist
DROP TYPE IF EXISTS audience_category CASCADE;
DROP TYPE IF EXISTS survey_status CASCADE;
DROP TYPE IF EXISTS survey_question_type CASCADE;

-- Audience categories enum
CREATE TYPE audience_category AS ENUM (
  'professional',      -- Working professionals seeking upskilling
  'student',           -- Students (high school, college, university)
  'entrepreneur',      -- Business owners & aspiring entrepreneurs
  'career_changer'     -- People transitioning to new careers
);

-- Survey status enum
CREATE TYPE survey_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed'
);

-- Question type enum
CREATE TYPE survey_question_type AS ENUM (
  'single_choice',     -- Radio buttons
  'multiple_choice',   -- Checkboxes
  'rating',            -- 1-5 or 1-10 scale
  'text',              -- Free text response
  'ranking'            -- Rank options in order
);

-- =============================================
-- Surveys Table
-- =============================================
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_category audience_category,  -- NULL means all categories
  status survey_status DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_responses INTEGER,              -- Optional limit
  allow_anonymous BOOLEAN DEFAULT TRUE,
  show_results_publicly BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Survey Questions Table
-- =============================================
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type survey_question_type NOT NULL,
  options JSONB,                      -- Array of options for choice questions
  is_required BOOLEAN DEFAULT TRUE,
  order_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',        -- Additional config (min/max for rating, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Survey Responses Table
-- =============================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES profiles(id),  -- NULL for anonymous
  respondent_category audience_category NOT NULL,
  respondent_email VARCHAR(255),      -- Optional for follow-up
  ip_hash VARCHAR(64),                -- Hashed IP for duplicate detection
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_complete BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'         -- Browser, location, etc.
);

-- =============================================
-- Survey Answers Table
-- =============================================
CREATE TABLE IF NOT EXISTS survey_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer_value JSONB NOT NULL,        -- Flexible: string, array, number
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(response_id, question_id)
);

-- =============================================
-- Pre-built Survey Templates
-- =============================================
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category audience_category,
  questions JSONB NOT NULL,           -- Array of question templates
  is_system BOOLEAN DEFAULT FALSE,    -- System-provided templates
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_surveys_tenant ON surveys(tenant_id);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_category ON surveys(target_category);
CREATE INDEX idx_survey_questions_survey ON survey_questions(survey_id);
CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_category ON survey_responses(respondent_category);
CREATE INDEX idx_survey_responses_completed ON survey_responses(is_complete, completed_at);
CREATE INDEX idx_survey_answers_response ON survey_answers(response_id);
CREATE INDEX idx_survey_answers_question ON survey_answers(question_id);

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active surveys" ON surveys;
DROP POLICY IF EXISTS "Anyone can view questions for active surveys" ON survey_questions;
DROP POLICY IF EXISTS "Anyone can submit survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Anyone can update own incomplete responses" ON survey_responses;
DROP POLICY IF EXISTS "Anyone can submit survey answers" ON survey_answers;
DROP POLICY IF EXISTS "Admins can manage surveys" ON surveys;
DROP POLICY IF EXISTS "Admins can manage questions" ON survey_questions;
DROP POLICY IF EXISTS "Admins can view all responses" ON survey_responses;
DROP POLICY IF EXISTS "Admins can view all answers" ON survey_answers;
DROP POLICY IF EXISTS "Anyone can view templates" ON survey_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON survey_templates;

-- Public can view active surveys
CREATE POLICY "Anyone can view active surveys"
  ON surveys FOR SELECT
  USING (status = 'active' AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at > NOW()));

-- Public can view questions for active surveys
CREATE POLICY "Anyone can view questions for active surveys"
  ON survey_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM surveys
    WHERE surveys.id = survey_questions.survey_id
    AND status = 'active'
  ));

-- Anyone can submit responses
CREATE POLICY "Anyone can submit survey responses"
  ON survey_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update own incomplete responses"
  ON survey_responses FOR UPDATE
  USING (is_complete = false AND (respondent_id = auth.uid() OR respondent_id IS NULL));

-- Anyone can submit answers
CREATE POLICY "Anyone can submit survey answers"
  ON survey_answers FOR INSERT
  WITH CHECK (true);

-- Admins can manage surveys
CREATE POLICY "Admins can manage surveys"
  ON surveys FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sme')
  ));

CREATE POLICY "Admins can manage questions"
  ON survey_questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sme')
  ));

CREATE POLICY "Admins can view all responses"
  ON survey_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sme')
  ));

CREATE POLICY "Admins can view all answers"
  ON survey_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sme')
  ));

-- Templates are public to view
CREATE POLICY "Anyone can view templates"
  ON survey_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON survey_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sme')
  ));

-- =============================================
-- Default Learning Interest Survey Template
-- =============================================
INSERT INTO survey_templates (name, description, category, questions, is_system) VALUES
(
  'Learning Interests Survey',
  'Discover what topics our audience wants to learn',
  NULL,
  '[
    {
      "question_text": "What is your primary learning goal?",
      "question_type": "single_choice",
      "options": [
        "Advance in my current career",
        "Switch to a new career",
        "Start my own business",
        "Personal development",
        "Academic requirements"
      ],
      "is_required": true
    },
    {
      "question_text": "Which topics interest you most? (Select up to 3)",
      "question_type": "multiple_choice",
      "options": [
        "Artificial Intelligence & Machine Learning",
        "Data Science & Analytics",
        "Web & Mobile Development",
        "Cloud Computing & DevOps",
        "Cybersecurity",
        "Business & Management",
        "Marketing & Sales",
        "Finance & Accounting",
        "Design & Creativity",
        "Leadership & Soft Skills",
        "Healthcare & Life Sciences",
        "Language Learning"
      ],
      "is_required": true,
      "metadata": {"max_selections": 3}
    },
    {
      "question_text": "How much time can you dedicate to learning per week?",
      "question_type": "single_choice",
      "options": [
        "Less than 2 hours",
        "2-5 hours",
        "5-10 hours",
        "10-20 hours",
        "More than 20 hours"
      ],
      "is_required": true
    },
    {
      "question_text": "What is your preferred learning format?",
      "question_type": "multiple_choice",
      "options": [
        "Video courses",
        "Interactive exercises",
        "Reading materials",
        "Live sessions/webinars",
        "Project-based learning",
        "Mentorship/coaching",
        "Mobile-friendly bite-sized lessons"
      ],
      "is_required": true
    },
    {
      "question_text": "How important is certification to you?",
      "question_type": "rating",
      "metadata": {"min": 1, "max": 5, "labels": ["Not important", "Very important"]},
      "is_required": true
    },
    {
      "question_text": "What is your budget for learning per month?",
      "question_type": "single_choice",
      "options": [
        "Free only",
        "Under $20",
        "$20-50",
        "$50-100",
        "$100-200",
        "Over $200"
      ],
      "is_required": true
    },
    {
      "question_text": "What challenges do you face in learning? (Select all that apply)",
      "question_type": "multiple_choice",
      "options": [
        "Lack of time",
        "Staying motivated",
        "Finding quality content",
        "Cost of courses",
        "Applying what I learn",
        "No clear learning path",
        "Work/life balance"
      ],
      "is_required": false
    },
    {
      "question_text": "Is there a specific skill or topic you wish was available?",
      "question_type": "text",
      "is_required": false,
      "metadata": {"placeholder": "Tell us what you want to learn..."}
    }
  ]',
  true
);

-- =============================================
-- Trigger for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_surveys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_surveys_updated_at();

-- =============================================
-- View for Survey Analytics
-- =============================================
CREATE OR REPLACE VIEW survey_analytics AS
SELECT
  s.id AS survey_id,
  s.title,
  s.target_category,
  s.status,
  COUNT(DISTINCT sr.id) AS total_responses,
  COUNT(DISTINCT CASE WHEN sr.is_complete THEN sr.id END) AS completed_responses,
  COUNT(DISTINCT CASE WHEN sr.respondent_category = 'professional' THEN sr.id END) AS professional_responses,
  COUNT(DISTINCT CASE WHEN sr.respondent_category = 'student' THEN sr.id END) AS student_responses,
  COUNT(DISTINCT CASE WHEN sr.respondent_category = 'entrepreneur' THEN sr.id END) AS entrepreneur_responses,
  COUNT(DISTINCT CASE WHEN sr.respondent_category = 'career_changer' THEN sr.id END) AS career_changer_responses,
  MIN(sr.started_at) AS first_response_at,
  MAX(sr.completed_at) AS last_response_at,
  ROUND(AVG(EXTRACT(EPOCH FROM (sr.completed_at - sr.started_at)))::numeric, 0) AS avg_completion_seconds
FROM surveys s
LEFT JOIN survey_responses sr ON s.id = sr.survey_id
GROUP BY s.id, s.title, s.target_category, s.status;
