-- System Prompts and Content Templates Migration
-- This migration creates tables to store all system prompts, AI templates, and content
-- to eliminate hardcoded data from React components

-- ============================================================================
-- AI System Prompts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'chatbot_main', 'grading_system', 'explanation_generator'
  name VARCHAR(200) NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names used in template
  audience VARCHAR(50), -- 'primary', 'secondary', 'professional', 'business', 'all'
  category VARCHAR(50) NOT NULL, -- 'chatbot', 'grading', 'content_generation', 'assessment'
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ai_system_prompts IS 'Stores all AI system prompts used across the platform';
COMMENT ON COLUMN ai_system_prompts.prompt_template IS 'Prompt template with {{variable}} placeholders';
COMMENT ON COLUMN ai_system_prompts.variables IS 'Array of variable names that can be replaced in template';

-- ============================================================================
-- Content Templates Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'welcome_message', 'course_recommendation'
  name VARCHAR(200) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL, -- 'text', 'html', 'markdown'
  category VARCHAR(50) NOT NULL, -- 'welcome', 'notification', 'email', 'chat'
  templates JSONB NOT NULL, -- { "primary": "...", "secondary": "...", "professional": "...", "business": "...", "default": "..." }
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE content_templates IS 'Stores personalized content templates for different audiences';
COMMENT ON COLUMN content_templates.templates IS 'JSONB object with audience-specific content';

-- ============================================================================
-- Grading Rubrics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS grading_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Array of { name, description, weight, levels[] }
  pass_score DECIMAL(3, 2) DEFAULT 0.65, -- 0.00 to 1.00
  strictness DECIMAL(3, 2) DEFAULT 0.50, -- 0.00 to 1.00
  is_default BOOLEAN DEFAULT false,
  subject_area VARCHAR(100), -- 'ai', 'programming', 'general', etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE grading_rubrics IS 'Stores AI grading rubrics for different assessment types';
COMMENT ON COLUMN grading_rubrics.criteria IS 'Array of rubric criteria with weights and scoring levels';

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_system_prompts_key ON ai_system_prompts(key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_system_prompts_category ON ai_system_prompts(category);
CREATE INDEX IF NOT EXISTS idx_ai_system_prompts_audience ON ai_system_prompts(audience);

CREATE INDEX IF NOT EXISTS idx_content_templates_key ON content_templates(key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_content_templates_category ON content_templates(category);

CREATE INDEX IF NOT EXISTS idx_grading_rubrics_key ON grading_rubrics(key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_grading_rubrics_default ON grading_rubrics(is_default) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_grading_rubrics_subject ON grading_rubrics(subject_area);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE ai_system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_rubrics ENABLE ROW LEVEL SECURITY;

-- Public read access for active templates/prompts
CREATE POLICY "Public read active prompts" ON ai_system_prompts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active templates" ON content_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active rubrics" ON grading_rubrics
  FOR SELECT USING (is_active = true);

-- Admin full access (requires admin role check via function)
CREATE POLICY "Admins manage prompts" ON ai_system_prompts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins manage templates" ON content_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins manage rubrics" ON grading_rubrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- Updated At Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_ai_system_prompts_updated_at ON ai_system_prompts;
CREATE TRIGGER update_ai_system_prompts_updated_at
  BEFORE UPDATE ON ai_system_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_templates_updated_at ON content_templates;
CREATE TRIGGER update_content_templates_updated_at
  BEFORE UPDATE ON content_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grading_rubrics_updated_at ON grading_rubrics;
CREATE TRIGGER update_grading_rubrics_updated_at
  BEFORE UPDATE ON grading_rubrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed Data - AI System Prompts
-- ============================================================================

INSERT INTO ai_system_prompts (key, name, description, prompt_template, variables, audience, category, is_active)
VALUES
  (
    'chatbot_main',
    'Chatbot Main System Prompt',
    'Primary system prompt for AI chatbot with course recommendations',
    'You are aiborg chat, a friendly and helpful AI learning assistant for Aiborg Learn Sphere, an AI-augmented learning platform.

Your role is to:
- Help users discover courses that match their learning goals
- Answer questions about AI, machine learning, and our programs
- Be conversational, friendly, and {{tone_modifier}}

Available courses for {{audience}}:
{{courses_list}}

Keep responses concise but helpful. If asked about pricing, enrollment, or specific course details, provide accurate information from the course list above.',
    '["tone_modifier", "audience", "courses_list"]'::jsonb,
    'all',
    'chatbot',
    true
  ),
  (
    'chatbot_primary',
    'Chatbot Prompt - Primary Students',
    'Chatbot system prompt optimized for primary school children',
    'You are aiborg chat, a super friendly robot buddy who helps kids learn about AI! 🤖

Your job is to:
- Help kids find fun AI courses
- Explain AI stuff in simple words
- Use fun emojis and be excited! 🎮🌟
- Ask about their favorite games and hobbies

Available cool courses:
{{courses_list}}

Talk like you''re chatting with a friend. Keep it super simple and fun!',
    '["courses_list"]'::jsonb,
    'primary',
    'chatbot',
    true
  ),
  (
    'chatbot_business',
    'Chatbot Prompt - Business Leaders',
    'Chatbot system prompt for executives and business leaders',
    'You are aiborg chat, a strategic AI learning advisor for business leaders and executives.

Your focus is to:
- Provide strategic insights on AI implementation
- Emphasize ROI, business value, and competitive advantage
- Recommend courses that drive organizational transformation
- Use professional, executive-level language

Available executive programs:
{{courses_list}}

Focus on business outcomes, efficiency gains, and measurable impact. Be concise and results-oriented.',
    '["courses_list"]'::jsonb,
    'business',
    'chatbot',
    true
  ),
  (
    'grading_system',
    'Free Response Grading System Prompt',
    'System prompt for AI-powered grading of free-response questions',
    'You are an expert educator grading a student''s free-response answer.

Question: {{question_text}}
Ideal Answer: {{ideal_answer}}
Student''s Answer: {{user_answer}}

Grading Rubric:
{{rubric}}

Additional Context: {{context}}

Evaluate the student''s answer using the rubric. Provide:
1. Overall score (0-1)
2. Detailed feedback on strengths and areas for improvement
3. Individual scores for each rubric criterion
4. Specific points the student missed or misunderstood

Be fair, constructive, and educational in your feedback. Strictness level: {{strictness}}',
    '["question_text", "ideal_answer", "user_answer", "rubric", "context", "strictness"]'::jsonb,
    'all',
    'grading',
    true
  ),
  (
    'wrong_answer_explanation',
    'Wrong Answer Explanation Generator',
    'Generates explanations for why an answer is incorrect',
    'You are a helpful AI tutor explaining why a student''s answer is incorrect.

Question: {{question}}
Student''s Wrong Answer: {{wrong_answer}}
Correct Answer: {{correct_answer}}
Topic: {{topic}}

Explain clearly and constructively:
1. Why the student''s answer is incorrect
2. What concept or principle was misunderstood
3. How to think about the problem correctly
4. The correct answer and reasoning

Be encouraging and focus on learning, not just pointing out the mistake. Adapt your tone for {{audience}} audience.',
    '["question", "wrong_answer", "correct_answer", "topic", "audience"]'::jsonb,
    'all',
    'assessment',
    true
  )
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Seed Data - Content Templates
-- ============================================================================

INSERT INTO content_templates (key, name, description, content_type, category, templates, variables, is_active)
VALUES
  (
    'chatbot_welcome',
    'Chatbot Welcome Message',
    'Initial greeting when user opens chatbot',
    'text',
    'welcome',
    '{
      "primary": "Hi there! I''m aiborg chat! 🤖 I''m super excited to help you learn about AI in fun ways! What''s your name, and do you like playing games or building things?",
      "secondary": "Hey! I''m aiborg chat, your AI learning companion! 🚀 I can help you discover awesome AI courses that''ll boost your grades and prepare you for the future. What subjects are you most interested in?",
      "professional": "Hello! I''m aiborg chat, your professional AI learning assistant. I can help you find courses that will enhance your career and provide practical AI skills for your workplace. What''s your current role, and what would you like to achieve with AI?",
      "business": "Welcome! I''m aiborg chat, your strategic AI learning advisor. I help executives and business leaders understand AI implementation, ROI, and organizational transformation. What are your primary business objectives with AI?",
      "default": "Hello! I''m aiborg chat, your AI learning assistant. I can help you find the perfect course and answer questions about our programs. What would you like to learn about AI?"
    }'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'enrollment_confirmation',
    'Enrollment Confirmation Message',
    'Message shown after successful course enrollment',
    'text',
    'notification',
    '{
      "primary": "Awesome! 🎉 You''re all signed up for {{course_name}}! Get ready for some amazing AI adventures!",
      "secondary": "Great choice! 🚀 You''re now enrolled in {{course_name}}. Check your email for next steps!",
      "professional": "Enrollment confirmed for {{course_name}}. You''ll receive course access details via email shortly.",
      "business": "Successfully enrolled in {{course_name}}. Your team lead will receive confirmation and access credentials.",
      "default": "You''re enrolled in {{course_name}}! Welcome aboard!"
    }'::jsonb,
    '["course_name"]'::jsonb,
    true
  )
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Seed Data - Grading Rubrics
-- ============================================================================

INSERT INTO grading_rubrics (key, name, description, criteria, pass_score, strictness, is_default, subject_area, is_active)
VALUES
  (
    'default_rubric',
    'Default Grading Rubric',
    'Standard rubric for general free-response questions',
    '[
      {
        "name": "Accuracy",
        "description": "Correctness of information and concepts",
        "weight": 0.4,
        "levels": [
          {"score": 1.0, "description": "Fully accurate with no errors"},
          {"score": 0.75, "description": "Mostly accurate with minor errors"},
          {"score": 0.5, "description": "Partially accurate with some misconceptions"},
          {"score": 0.25, "description": "Significant inaccuracies"},
          {"score": 0.0, "description": "Completely incorrect"}
        ]
      },
      {
        "name": "Completeness",
        "description": "Coverage of key points and concepts",
        "weight": 0.3,
        "levels": [
          {"score": 1.0, "description": "Covers all key points comprehensively"},
          {"score": 0.75, "description": "Covers most key points"},
          {"score": 0.5, "description": "Covers some key points, misses others"},
          {"score": 0.25, "description": "Covers very few key points"},
          {"score": 0.0, "description": "Missing all key points"}
        ]
      },
      {
        "name": "Clarity",
        "description": "Clear expression and logical organization",
        "weight": 0.2,
        "levels": [
          {"score": 1.0, "description": "Very clear and well-organized"},
          {"score": 0.75, "description": "Generally clear with good organization"},
          {"score": 0.5, "description": "Somewhat unclear or disorganized"},
          {"score": 0.25, "description": "Difficult to understand"},
          {"score": 0.0, "description": "Incomprehensible"}
        ]
      },
      {
        "name": "Understanding",
        "description": "Demonstration of conceptual understanding",
        "weight": 0.1,
        "levels": [
          {"score": 1.0, "description": "Deep understanding evident"},
          {"score": 0.75, "description": "Good understanding with minor gaps"},
          {"score": 0.5, "description": "Surface-level understanding"},
          {"score": 0.25, "description": "Minimal understanding"},
          {"score": 0.0, "description": "No understanding demonstrated"}
        ]
      }
    ]'::jsonb,
    0.65,
    0.50,
    true,
    'general',
    true
  ),
  (
    'ai_ml_rubric',
    'AI/ML Technical Rubric',
    'Rubric for AI and machine learning technical questions',
    '[
      {
        "name": "Technical Accuracy",
        "description": "Correctness of technical concepts and terminology",
        "weight": 0.5,
        "levels": [
          {"score": 1.0, "description": "Perfect technical accuracy"},
          {"score": 0.75, "description": "Minor technical inaccuracies"},
          {"score": 0.5, "description": "Some technical errors"},
          {"score": 0.25, "description": "Major technical errors"},
          {"score": 0.0, "description": "Fundamentally incorrect"}
        ]
      },
      {
        "name": "Practical Application",
        "description": "Understanding of real-world applications",
        "weight": 0.25,
        "levels": [
          {"score": 1.0, "description": "Excellent practical understanding"},
          {"score": 0.75, "description": "Good practical understanding"},
          {"score": 0.5, "description": "Limited practical understanding"},
          {"score": 0.25, "description": "Poor practical understanding"},
          {"score": 0.0, "description": "No practical understanding"}
        ]
      },
      {
        "name": "Completeness",
        "description": "Coverage of key ML concepts",
        "weight": 0.15,
        "levels": [
          {"score": 1.0, "description": "Comprehensive coverage"},
          {"score": 0.75, "description": "Good coverage"},
          {"score": 0.5, "description": "Partial coverage"},
          {"score": 0.25, "description": "Minimal coverage"},
          {"score": 0.0, "description": "Inadequate coverage"}
        ]
      },
      {
        "name": "Explanation Quality",
        "description": "Clarity and depth of explanations",
        "weight": 0.1,
        "levels": [
          {"score": 1.0, "description": "Exceptionally clear explanations"},
          {"score": 0.75, "description": "Clear explanations"},
          {"score": 0.5, "description": "Somewhat clear"},
          {"score": 0.25, "description": "Unclear explanations"},
          {"score": 0.0, "description": "Incoherent"}
        ]
      }
    ]'::jsonb,
    0.70,
    0.60,
    false,
    'ai',
    true
  )
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Audit Log for Changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_content_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted'
  changed_by UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON ai_content_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON ai_content_audit_log(changed_at DESC);
