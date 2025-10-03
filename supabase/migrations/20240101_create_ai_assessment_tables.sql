-- AI Assessment Tables for AIBORG Platform
-- This migration creates the necessary tables for the AI Augmentation Self-Assessment Tool

-- Assessment Categories
CREATE TABLE IF NOT EXISTS assessment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  weight DECIMAL(3, 2) DEFAULT 1.0, -- Weight for scoring calculation
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Questions
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES assessment_categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'single_choice', -- single_choice, multiple_choice, scale, frequency
  help_text TEXT,
  audience_filters TEXT[], -- ['primary', 'secondary', 'professional', 'business'] or null for all
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  points_value INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question Options (for multiple choice questions)
CREATE TABLE IF NOT EXISTS assessment_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_value VARCHAR(100) NOT NULL,
  points INTEGER DEFAULT 0,
  description TEXT,
  tool_recommendations TEXT[], -- AI tools to recommend based on this answer
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Assessments (Main assessment records)
CREATE TABLE IF NOT EXISTS user_ai_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audience_type VARCHAR(50), -- 'primary', 'secondary', 'professional', 'business'
  total_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  augmentation_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'expert'
  completion_time_seconds INTEGER,
  is_complete BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Assessment Answers
CREATE TABLE IF NOT EXISTS user_assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES user_ai_assessments(id) ON DELETE CASCADE,
  question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
  selected_options UUID[], -- Array of selected option IDs
  text_answer TEXT, -- For open-ended questions
  score_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Tool Catalog
CREATE TABLE IF NOT EXISTS ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  pricing_model VARCHAR(50), -- 'free', 'freemium', 'subscription', 'one-time'
  price_range VARCHAR(50), -- 'free', '$', '$$', '$$$', '$$$$'
  difficulty_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  audience_suitability TEXT[], -- ['primary', 'secondary', 'professional', 'business']
  use_cases TEXT[],
  features TEXT[],
  integration_options TEXT[],
  popularity_score INTEGER DEFAULT 0,
  user_rating DECIMAL(3, 2),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Tool Stack (Tools user is currently using)
CREATE TABLE IF NOT EXISTS user_ai_tool_stack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
  usage_frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'occasionally'
  proficiency_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'expert'
  started_using_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tool_id)
);

-- Assessment Results and Insights
CREATE TABLE IF NOT EXISTS assessment_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES user_ai_assessments(id) ON DELETE CASCADE,
  category_id UUID REFERENCES assessment_categories(id),
  category_score INTEGER DEFAULT 0,
  category_max_score INTEGER DEFAULT 0,
  strength_level VARCHAR(50), -- 'weak', 'developing', 'proficient', 'strong'
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Peer Benchmarking Data
CREATE TABLE IF NOT EXISTS assessment_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_type VARCHAR(50),
  category_id UUID REFERENCES assessment_categories(id),
  average_score DECIMAL(5, 2),
  median_score DECIMAL(5, 2),
  percentile_25 DECIMAL(5, 2),
  percentile_75 DECIMAL(5, 2),
  percentile_90 DECIMAL(5, 2),
  sample_size INTEGER,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Achievement Badges for Assessment Milestones
CREATE TABLE IF NOT EXISTS assessment_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria_type VARCHAR(50), -- 'score', 'streak', 'tools_tried', 'assessments_completed'
  criteria_value INTEGER,
  badge_level VARCHAR(50), -- 'bronze', 'silver', 'gold', 'platinum'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Achievement Records
CREATE TABLE IF NOT EXISTS user_assessment_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES assessment_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assessment_id UUID REFERENCES user_ai_assessments(id),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_assessments_user_id ON user_ai_assessments(user_id);
CREATE INDEX idx_user_assessments_completed ON user_ai_assessments(is_complete, completed_at DESC);
CREATE INDEX idx_assessment_answers_assessment_id ON user_assessment_answers(assessment_id);
CREATE INDEX idx_user_tool_stack_user_id ON user_ai_tool_stack(user_id);
CREATE INDEX idx_assessment_insights_assessment_id ON assessment_insights(assessment_id);
CREATE INDEX idx_questions_category ON assessment_questions(category_id);
CREATE INDEX idx_questions_active ON assessment_questions(is_active);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_assessment_categories_updated_at BEFORE UPDATE ON assessment_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_questions_updated_at BEFORE UPDATE ON assessment_questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_tools_updated_at BEFORE UPDATE ON ai_tools
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tool_stack_updated_at BEFORE UPDATE ON user_ai_tool_stack
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default assessment categories
INSERT INTO assessment_categories (name, description, icon, weight, order_index) VALUES
  ('Daily Productivity', 'How AI enhances your daily work and personal tasks', 'Clock', 1.2, 1),
  ('Content Creation', 'AI usage in creating written, visual, and multimedia content', 'PenTool', 1.0, 2),
  ('Learning & Research', 'Leveraging AI for education and knowledge acquisition', 'BookOpen', 1.1, 3),
  ('Communication', 'AI-assisted communication and collaboration tools', 'MessageSquare', 0.9, 4),
  ('Data & Analytics', 'Using AI for data analysis and insights', 'TrendingUp', 1.0, 5),
  ('Automation', 'Workflow automation and process optimization with AI', 'Zap', 1.3, 6),
  ('Creative Tools', 'AI in design, art, music, and creative projects', 'Palette', 0.8, 7),
  ('Development & Coding', 'AI-assisted programming and technical work', 'Code', 1.1, 8)
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE assessment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_tool_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_achievements ENABLE ROW LEVEL SECURITY;

-- Public read access for categories, questions, tools, achievements
CREATE POLICY "Public read access" ON assessment_categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON assessment_questions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON assessment_question_options FOR SELECT USING (true);
CREATE POLICY "Public read access" ON ai_tools FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON assessment_achievements FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON assessment_benchmarks FOR SELECT USING (true);

-- User-specific access for personal data
CREATE POLICY "Users can view own assessments" ON user_ai_assessments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own assessments" ON user_ai_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessments" ON user_ai_assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own answers" ON user_assessment_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_ai_assessments
      WHERE id = assessment_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create own answers" ON user_assessment_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_ai_assessments
      WHERE id = assessment_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own tool stack" ON user_ai_tool_stack
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tool stack" ON user_ai_tool_stack
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON assessment_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_ai_assessments
      WHERE id = assessment_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own achievements" ON user_assessment_achievements
  FOR SELECT USING (auth.uid() = user_id);